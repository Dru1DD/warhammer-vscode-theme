/**
 * TypeScript / JavaScript / TSX / JSX analyzer.
 *
 * Uses the real TypeScript compiler API (`ts.createSourceFile`) — parse only,
 * no type checker and no program. That keeps analysis per-file, incremental and
 * fast: a 5k-file repo never builds a program, it parses 5k independent files
 * and caches each one by mtime.
 *
 * `typescript` is required lazily so the module load cost is paid only when the
 * Librarium is actually opened.
 */

import type * as TS from 'typescript';
import { emptyAnalysis, type EntityRecord, type FileAnalysis, type ImportRecord, type LanguageAnalyzer } from './types';
import type { CodeNodeType } from '../model';
import { resolveRelativeImport } from '../resolve';

let tsMod: typeof TS | undefined;
function ts(): typeof TS {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (!tsMod) tsMod = require('typescript') as typeof TS;
  return tsMod;
}

function scriptKindFor(path: string): TS.ScriptKind {
  const t = ts();
  if (path.endsWith('.tsx')) return t.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return t.ScriptKind.JSX;
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return t.ScriptKind.JS;
  return t.ScriptKind.TS;
}

function languageFor(path: string): string {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.ts') || path.endsWith('.mts') || path.endsWith('.cts')) return 'typescript';
  return 'javascript';
}

/** 1-based line for a source position. */
function lineOf(sf: TS.SourceFile, pos: number): number {
  return sf.getLineAndCharacterOfPosition(pos).line + 1;
}

function hasModifier(node: TS.Node, kind: TS.SyntaxKind): boolean {
  const mods = (node as { modifiers?: readonly TS.ModifierLike[] }).modifiers;
  return !!mods?.some((m) => m.kind === kind);
}

function isExported(node: TS.Node): boolean {
  return hasModifier(node, ts().SyntaxKind.ExportKeyword);
}

/** Collects called identifier names and rendered JSX tags inside a subtree. */
function collectBody(node: TS.Node, sf: TS.SourceFile): { calls: string[]; renders: string[] } {
  const t = ts();
  const calls = new Set<string>();
  const renders = new Set<string>();

  const visit = (n: TS.Node): void => {
    if (t.isCallExpression(n)) {
      const e = n.expression;
      if (t.isIdentifier(e)) {
        calls.add(e.text);
      } else if (t.isPropertyAccessExpression(e)) {
        // `service.createSession()` -> record both the receiver and the member,
        // so cross-file resolution can match either an imported binding or a
        // method name.
        calls.add(e.name.text);
        if (t.isIdentifier(e.expression)) calls.add(e.expression.text);
      }
    } else if (t.isNewExpression(n) && t.isIdentifier(n.expression)) {
      calls.add(n.expression.text);
    } else if (t.isJsxOpeningElement(n) || t.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      // Lowercase tags are intrinsic DOM elements, not components.
      if (/^[A-Z]/.test(tag)) renders.add(tag.split('.')[0]);
    }
    n.forEachChild(visit);
  };
  node.forEachChild(visit);
  return { calls: [...calls], renders: [...renders] };
}

/** True when a function-ish node returns JSX — i.e. it is a React component. */
function producesJsx(node: TS.Node, sf: TS.SourceFile): boolean {
  const t = ts();
  let found = false;
  const visit = (n: TS.Node): void => {
    if (found) return;
    if (
      t.isJsxElement(n) || t.isJsxSelfClosingElement(n) || t.isJsxFragment(n)
    ) { found = true; return; }
    // Do not descend into nested function declarations: their JSX belongs to
    // them, not to the outer function.
    if (t.isFunctionDeclaration(n) || t.isClassDeclaration(n)) return;
    n.forEachChild(visit);
  };
  node.forEachChild(visit);
  return found;
}

function classifyFunction(name: string, node: TS.Node, sf: TS.SourceFile): CodeNodeType {
  return /^[A-Z]/.test(name) && producesJsx(node, sf) ? 'component' : 'function';
}

function readImport(node: TS.ImportDeclaration, sf: TS.SourceFile): ImportRecord | undefined {
  const t = ts();
  if (!t.isStringLiteral(node.moduleSpecifier)) return undefined;
  const names: string[] = [];
  const clause = node.importClause;
  if (clause?.name) names.push(clause.name.text);

  const bindings = clause?.namedBindings;
  let allSpecifiersAreTypes = false;
  if (bindings) {
    if (t.isNamespaceImport(bindings)) {
      names.push(bindings.name.text);
    } else {
      for (const el of bindings.elements) names.push((el.propertyName ?? el.name).text);
      // `import { type A, type B }` carries no runtime dependency either.
      allSpecifiersAreTypes =
        bindings.elements.length > 0 && bindings.elements.every((el) => el.isTypeOnly);
    }
  }
  // `import type { A }` sets isTypeOnly on the clause itself.
  const typeOnly = (clause?.isTypeOnly ?? false) || allSpecifiersAreTypes;
  return {
    specifier: node.moduleSpecifier.text,
    names,
    typeOnly,
    line: lineOf(sf, node.getStart(sf)),
  };
}

function entityFromClass(node: TS.ClassDeclaration, sf: TS.SourceFile): EntityRecord {
  const t = ts();
  const name = node.name?.text ?? '(anonymous class)';
  let extendsName: string | undefined;
  const implementsNames: string[] = [];
  for (const clause of node.heritageClauses ?? []) {
    for (const type of clause.types) {
      const text = type.expression.getText(sf);
      if (clause.token === t.SyntaxKind.ExtendsKeyword) extendsName = text;
      else implementsNames.push(text);
    }
  }

  const members: EntityRecord[] = [];
  const calls = new Set<string>();
  const renders = new Set<string>();
  for (const member of node.members) {
    if (!t.isMethodDeclaration(member) && !t.isConstructorDeclaration(member)) continue;
    const memberName = t.isConstructorDeclaration(member)
      ? 'constructor'
      : member.name.getText(sf);
    const body = collectBody(member, sf);
    body.calls.forEach((c) => calls.add(c));
    body.renders.forEach((r) => renders.add(r));
    members.push({
      name: memberName,
      kind: 'method',
      startLine: lineOf(sf, member.getStart(sf)),
      endLine: lineOf(sf, member.getEnd()),
      exported: false,
      calls: body.calls,
    });
  }

  return {
    name,
    kind: /^[A-Z]/.test(name) && producesJsx(node, sf) ? 'component' : 'class',
    startLine: lineOf(sf, node.getStart(sf)),
    endLine: lineOf(sf, node.getEnd()),
    exported: isExported(node),
    extendsName,
    implementsNames: implementsNames.length ? implementsNames : undefined,
    calls: [...calls],
    renders: renders.size ? [...renders] : undefined,
    members: members.length ? members : undefined,
  };
}

function analyze(path: string, text: string): FileAnalysis {
  const language = languageFor(path);
  let sf: TS.SourceFile;
  try {
    sf = ts().createSourceFile(path, text, ts().ScriptTarget.Latest, true, scriptKindFor(path));
  } catch (err) {
    return emptyAnalysis(path, language, String(err));
  }

  const t = ts();
  const imports: ImportRecord[] = [];
  const exports = new Set<string>();
  const entities: EntityRecord[] = [];

  const pushEntity = (e: EntityRecord) => {
    entities.push(e);
    if (e.exported) exports.add(e.name);
  };

  // Only top-level declarations become entities. Nested helpers stay invisible
  // on purpose — the graph has to stay readable.
  for (const node of sf.statements) {
    if (t.isImportDeclaration(node)) {
      const rec = readImport(node, sf);
      if (rec) imports.push(rec);
      continue;
    }

    if (t.isExportDeclaration(node)) {
      // `export { a } from './x'` is both an export and a dependency.
      if (node.moduleSpecifier && t.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          specifier: node.moduleSpecifier.text,
          names: [],
          typeOnly: node.isTypeOnly,
          line: lineOf(sf, node.getStart(sf)),
        });
      }
      if (node.exportClause && t.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) exports.add(el.name.text);
      }
      continue;
    }

    if (t.isExportAssignment(node)) { exports.add('default'); continue; }

    if (t.isClassDeclaration(node)) {
      const entity = entityFromClass(node, sf);
      if (hasModifier(node, t.SyntaxKind.DefaultKeyword)) exports.add('default');
      pushEntity(entity);
      continue;
    }

    if (t.isFunctionDeclaration(node) && node.name) {
      const body = collectBody(node, sf);
      if (hasModifier(node, t.SyntaxKind.DefaultKeyword)) exports.add('default');
      pushEntity({
        name: node.name.text,
        kind: classifyFunction(node.name.text, node, sf),
        startLine: lineOf(sf, node.getStart(sf)),
        endLine: lineOf(sf, node.getEnd()),
        exported: isExported(node),
        calls: body.calls,
        renders: body.renders.length ? body.renders : undefined,
      });
      continue;
    }

    if (t.isInterfaceDeclaration(node)) {
      const extendsNames = (node.heritageClauses ?? [])
        .flatMap((c) => c.types.map((ty) => ty.expression.getText(sf)));
      pushEntity({
        name: node.name.text,
        kind: 'interface',
        startLine: lineOf(sf, node.getStart(sf)),
        endLine: lineOf(sf, node.getEnd()),
        exported: isExported(node),
        extendsName: extendsNames[0],
        calls: [],
      });
      continue;
    }

    if (t.isTypeAliasDeclaration(node) || t.isEnumDeclaration(node)) {
      pushEntity({
        name: node.name.text,
        kind: 'type',
        startLine: lineOf(sf, node.getStart(sf)),
        endLine: lineOf(sf, node.getEnd()),
        exported: isExported(node),
        calls: [],
      });
      continue;
    }

    if (t.isVariableStatement(node)) {
      const exported = isExported(node);
      for (const decl of node.declarationList.declarations) {
        if (!t.isIdentifier(decl.name)) continue;
        const init = decl.initializer;
        const name = decl.name.text;
        // Only function-valued consts become entities. Plain data variables are
        // deliberately excluded: they explode the node count without explaining
        // structure.
        const isFn = !!init && (t.isArrowFunction(init) || t.isFunctionExpression(init));
        if (!isFn) { if (exported) exports.add(name); continue; }
        const body = collectBody(init, sf);
        pushEntity({
          name,
          kind: classifyFunction(name, init, sf),
          startLine: lineOf(sf, node.getStart(sf)),
          endLine: lineOf(sf, node.getEnd()),
          exported,
          calls: body.calls,
          renders: body.renders.length ? body.renders : undefined,
        });
      }
    }
  }

  // CommonJS `require()` and dynamic `import()` anywhere in the file.
  const seen = new Set(imports.map((i) => i.specifier));
  const visitRequires = (n: TS.Node): void => {
    if (t.isCallExpression(n)) {
      const isRequire = t.isIdentifier(n.expression) && n.expression.text === 'require';
      const isDynImport = n.expression.kind === t.SyntaxKind.ImportKeyword;
      const arg = n.arguments[0];
      if ((isRequire || isDynImport) && arg && t.isStringLiteral(arg) && !seen.has(arg.text)) {
        seen.add(arg.text);
        imports.push({ specifier: arg.text, names: [], typeOnly: false, line: lineOf(sf, n.getStart(sf)) });
      }
    }
    n.forEachChild(visitRequires);
  };
  sf.forEachChild(visitRequires);

  return { path, language, imports, exports: [...exports], entities };
}

export const typeScriptAnalyzer: LanguageAnalyzer = {
  id: 'typescript',
  extensions: ['.ts', '.tsx', '.mts', '.cts'],
  analyze,
  resolveImport: resolveRelativeImport,
};

/**
 * JS and TS share one implementation — the TS parser handles JS/JSX natively via
 * ScriptKind. They stay separate registry entries so metrics can distinguish
 * them and so a future JS-specific rule has somewhere to live.
 */
export const javaScriptAnalyzer: LanguageAnalyzer = {
  id: 'javascript',
  extensions: ['.js', '.jsx', '.mjs', '.cjs'],
  analyze,
  resolveImport: resolveRelativeImport,
};
