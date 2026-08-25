/**
 * Go analyzer.
 *
 * There is no mature Go AST parser for Node, and shelling out to the Go
 * toolchain would make the feature depend on the user having Go installed —
 * which breaks the local-only, zero-setup principle. So this is a two-stage
 * scanner: stage one strips comments and string/rune literals (replacing them
 * with length-preserving placeholders so offsets and line numbers stay valid),
 * stage two walks the sanitised text with brace-depth tracking to find
 * declarations.
 *
 * That is weaker than a real AST — see the README's limitations — but it is not
 * a naive regex over raw source: constructs inside comments and strings cannot
 * produce phantom nodes, and nesting is tracked rather than guessed.
 */

import {
  emptyAnalysis,
  type EntityRecord,
  type FileAnalysis,
  type ImportRecord,
  type LanguageAnalyzer,
} from './types';

const GO_KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
  'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
  'var', 'make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'panic',
  'recover', 'print', 'println', 'string', 'int', 'error', 'bool', 'byte',
]);

interface Scanned {
  /** Source with comments blanked and literals replaced; newlines preserved. */
  text: string;
  /** Literal contents, indexed by the number embedded in each placeholder. */
  literals: string[];
}

/**
 * Blanks comments and captures string literals. Placeholders keep the exact
 * character count of what they replace so every offset stays valid.
 */
function scan(src: string): Scanned {
  const out: string[] = [];
  const literals: string[] = [];
  let i = 0;

  const pushBlank = (s: string) => {
    // Preserve newlines so line numbers survive; blank everything else.
    for (const ch of s) out.push(ch === '\n' ? '\n' : ' ');
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? src.length : end;
      pushBlank(src.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      pushBlank(src.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '"' || ch === '`' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < src.length) {
        if (quote !== '`' && src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) { j++; break; }
        if (quote !== '`' && src[j] === '\n') break; // unterminated literal
        j++;
      }
      const raw = src.slice(i, j);
      const idx = literals.length;
      literals.push(raw.length >= 2 ? raw.slice(1, -1) : '');
      // Placeholder of identical length: the index, padded with '~'.
      const token = String(idx);
      const padded = token.length <= raw.length
        ? token + '~'.repeat(raw.length - token.length)
        : token;
      for (const c of padded) out.push(c === '\n' ? '\n' : c);
      i = j;
      continue;
    }
    out.push(ch);
    i++;
  }
  return { text: out.join(''), literals };
}

function literalAt(scanned: Scanned, token: string): string | undefined {
  const m = /(\d+)/.exec(token);
  return m ? scanned.literals[Number(m[1])] : undefined;
}

/** Builds an offset -> 1-based line lookup once per file. */
function lineIndex(text: string): (offset: number) => number {
  const starts: number[] = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (offset: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}

/** Offset of the brace matching the block that opens at `open`. */
function matchBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return text.length - 1;
}

function collectCalls(body: string): string[] {
  const calls = new Set<string>();
  let m: RegExpExecArray | null;

  const direct = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  while ((m = direct.exec(body))) {
    if (!GO_KEYWORDS.has(m[1])) calls.add(m[1]);
  }
  // Calls through a receiver or package: `svc.Charge(` — record the qualifier.
  const qualified = /([A-Za-z_][A-Za-z0-9_]*)\.[A-Za-z_][A-Za-z0-9_]*\s*\(/g;
  while ((m = qualified.exec(body))) {
    if (!GO_KEYWORDS.has(m[1])) calls.add(m[1]);
  }
  return [...calls];
}

function analyze(filePath: string, text: string): FileAnalysis {
  let scanned: Scanned;
  try {
    scanned = scan(text);
  } catch (err) {
    return emptyAnalysis(filePath, 'go', String(err));
  }
  const code = scanned.text;
  const lineAt = lineIndex(code);

  const imports: ImportRecord[] = [];
  const entities: EntityRecord[] = [];
  const exports: string[] = [];
  let packageName: string | undefined;
  let m: RegExpExecArray | null;

  const pkg = /(^|\n)\s*package\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(code);
  if (pkg) packageName = pkg[2];

  // -- imports ---------------------------------------------------------------
  const importBlock = /(^|\n)\s*import\s*\(/g;
  while ((m = importBlock.exec(code))) {
    const open = code.indexOf('(', m.index);
    const close = code.indexOf(')', open);
    if (close === -1) break;
    let offset = open + 1;
    for (const line of code.slice(open + 1, close).split('\n')) {
      const tok = /(?:([A-Za-z_.][A-Za-z0-9_]*)\s+)?(\d+~*)/.exec(line);
      const spec = tok ? literalAt(scanned, tok[2]) : undefined;
      if (spec) {
        imports.push({
          specifier: spec,
          names: tok?.[1] ? [tok[1]] : [],
          typeOnly: false,
          line: lineAt(offset),
        });
      }
      offset += line.length + 1;
    }
    importBlock.lastIndex = close;
  }

  const singleImport = /(^|\n)\s*import\s+(?:([A-Za-z_.][A-Za-z0-9_]*)\s+)?(\d+~*)/g;
  while ((m = singleImport.exec(code))) {
    const spec = literalAt(scanned, m[3]);
    if (spec) {
      imports.push({
        specifier: spec,
        names: m[2] ? [m[2]] : [],
        typeOnly: false,
        line: lineAt(m.index),
      });
    }
  }

  // -- funcs and methods -----------------------------------------------------
  const funcRe =
    /(^|\n)func\s+(?:\(\s*[A-Za-z_][A-Za-z0-9_]*\s+\*?([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const methodsByReceiver = new Map<string, EntityRecord[]>();
  while ((m = funcRe.exec(code))) {
    const receiver = m[2];
    const name = m[3];
    const start = m.index + (m[1] ? 1 : 0);
    const open = code.indexOf('{', m.index);
    const end = open === -1 ? start : matchBrace(code, open);
    const body = open === -1 ? '' : code.slice(open, end);
    const record: EntityRecord = {
      name,
      kind: receiver ? 'method' : 'function',
      startLine: lineAt(start),
      endLine: lineAt(end),
      // Go exports by capitalisation.
      exported: /^[A-Z]/.test(name),
      calls: collectCalls(body),
    };
    if (receiver) {
      const list = methodsByReceiver.get(receiver) ?? [];
      list.push(record);
      methodsByReceiver.set(receiver, list);
    } else {
      entities.push(record);
      if (record.exported) exports.push(name);
    }
  }

  // -- types: structs, interfaces, aliases -----------------------------------
  const typeRe = /(^|\n)\s*type\s+([A-Za-z_][A-Za-z0-9_]*)\s+(struct|interface)?/g;
  while ((m = typeRe.exec(code))) {
    const name = m[2];
    const flavour = m[3];
    const start = m.index + (m[1] ? 1 : 0);
    let endLine = lineAt(start);
    let extendsName: string | undefined;
    const members: EntityRecord[] = [];

    if (flavour) {
      const open = code.indexOf('{', m.index);
      if (open !== -1) {
        const end = matchBrace(code, open);
        endLine = lineAt(end);
        const body = code.slice(open + 1, end);
        if (flavour === 'struct') {
          // An embedded type is a line holding a bare type name and nothing else.
          for (const raw of body.split('\n')) {
            const line = raw.trim();
            const embed = /^\*?([A-Za-z_][A-Za-z0-9_]*)$/.exec(line);
            if (embed && !GO_KEYWORDS.has(embed[1])) { extendsName = embed[1]; break; }
          }
        } else {
          let offset = open + 1;
          for (const raw of body.split('\n')) {
            const sig = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(raw);
            if (sig) {
              members.push({
                name: sig[1],
                kind: 'method',
                startLine: lineAt(offset),
                endLine: lineAt(offset),
                exported: /^[A-Z]/.test(sig[1]),
                calls: [],
              });
            }
            offset += raw.length + 1;
          }
        }
        typeRe.lastIndex = end;
      }
    }

    entities.push({
      name,
      kind: flavour === 'interface' ? 'interface' : flavour === 'struct' ? 'class' : 'type',
      startLine: lineAt(start),
      endLine,
      exported: /^[A-Z]/.test(name),
      extendsName,
      calls: [],
      members: members.length ? members : undefined,
    });
    if (/^[A-Z]/.test(name)) exports.push(name);
  }

  // Attach methods to their receiving struct; orphans become free functions so
  // nothing is silently dropped.
  for (const [receiver, methods] of methodsByReceiver) {
    const owner = entities.find(
      (e) => e.name === receiver && (e.kind === 'class' || e.kind === 'interface')
    );
    if (owner) {
      owner.members = [...(owner.members ?? []), ...methods];
      owner.calls = [...new Set([...owner.calls, ...methods.flatMap((mm) => mm.calls)])];
    } else {
      entities.push(...methods.map((mm) => ({ ...mm, kind: 'function' as const })));
    }
  }

  return {
    path: filePath,
    language: 'go',
    imports,
    exports: [...new Set(exports)],
    entities,
    packageName,
  };
}

export const goAnalyzer: LanguageAnalyzer = {
  id: 'go',
  extensions: ['.go'],
  analyze,
};
