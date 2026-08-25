/**
 * Librarium self-checks.
 *
 * Runs under plain node — the analyzers and the graph builder never import
 * `vscode`, which is exactly why they can be tested this way.
 *
 *   npm test    (or: npx tsc -p ./ && node out/librarium/librarium.test.js)
 *
 * No network, no VS Code, no fixtures beyond the files in ./fixtures.
 */

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { goAnalyzer } from './analyzer/go';
import { javaScriptAnalyzer } from './analyzer/typescript';
import { analyzerFor, supportedExtensions } from './analyzer/registry';
import type { FileAnalysis } from './analyzer/types';
import { buildGraph, findCycles, findHubs } from './graph';
import { resolveGoImport, resolveRelativeImport, toPosix } from './resolve';
import { AnalysisCache } from './cache';
import { ids } from './model';

const FIXTURES = path.join(__dirname, '..', '..', 'fixtures');

function read(relPath: string): string {
  return fs.readFileSync(path.join(FIXTURES, relPath), 'utf8');
}

/** Analyzes a fixture file under the workspace-relative path it should carry. */
function analyze(fixturePath: string, asPath = fixturePath): FileAnalysis {
  const analyzer = analyzerFor(asPath);
  assert.ok(analyzer, `no analyzer for ${asPath}`);
  return analyzer!.analyze(asPath, read(fixturePath));
}

function entity(analysis: FileAnalysis, name: string) {
  const found = analysis.entities.find((e) => e.name === name);
  assert.ok(found, `expected entity ${name} in ${analysis.path}`);
  return found!;
}

const checks: Array<[string, () => void]> = [];
function test(name: string, fn: () => void) { checks.push([name, fn]); }

// ── registry ────────────────────────────────────────────────────────────────

test('registry maps every supported extension', () => {
  assert.strictEqual(analyzerFor('a/b/c.ts')?.id, 'typescript');
  assert.strictEqual(analyzerFor('a/b/c.TSX')?.id, 'typescript');
  assert.strictEqual(analyzerFor('a/b/c.jsx')?.id, 'javascript');
  assert.strictEqual(analyzerFor('main.go')?.id, 'go');
  assert.ok(supportedExtensions().includes('.mjs'));
});

test('unsupported files are rejected, not guessed at', () => {
  assert.strictEqual(analyzerFor('styles.css'), undefined);
  assert.strictEqual(analyzerFor('README.md'), undefined);
  assert.strictEqual(analyzerFor('Makefile'), undefined);
});

// ── TypeScript parsing ──────────────────────────────────────────────────────

test('TypeScript imports are detected, including type-only ones', () => {
  const analysis = analyze('simple-ts/checkout.ts');
  const specifiers = analysis.imports.map((i) => i.specifier).sort();
  assert.deepStrictEqual(specifiers, ['./config', './stripe', 'node:util']);

  const stripe = analysis.imports.find((i) => i.specifier === './stripe')!;
  assert.deepStrictEqual(stripe.names, ['StripeClient']);
  assert.strictEqual(stripe.typeOnly, false);

  const typeOnly = analyze('simple-ts/stripe.ts').imports
    .find((i) => i.specifier === './config' && i.typeOnly);
  assert.ok(typeOnly, 'expected the `import type { Config }` to be flagged type-only');
});

test('exports are detected across declaration forms', () => {
  const config = analyze('simple-ts/config.ts');
  // An exported data const is an export but deliberately not a graph entity.
  assert.deepStrictEqual(config.exports.sort(), ['API_URL', 'Config', 'loadConfig']);
  assert.strictEqual(config.entities.find((e) => e.name === 'API_URL'), undefined);

  const checkout = analyze('simple-ts/checkout.ts');
  assert.ok(checkout.exports.includes('CheckoutService'));
  assert.ok(checkout.exports.includes('default'), 'default export should be recorded');
});

test('classes, methods, functions and interfaces are extracted with line ranges', () => {
  const analysis = analyze('simple-ts/stripe.ts');
  const client = entity(analysis, 'StripeClient');
  assert.strictEqual(client.kind, 'class');
  assert.strictEqual(client.exported, true);
  assert.ok(client.startLine > 0 && client.endLine >= client.startLine);
  assert.deepStrictEqual(
    (client.members ?? []).map((m) => m.name).sort(),
    ['charge', 'constructor', 'refund']
  );

  const iface = entity(analyze('simple-ts/config.ts'), 'Config');
  assert.strictEqual(iface.kind, 'interface');

  const fn = entity(analyze('simple-ts/config.ts'), 'loadConfig');
  assert.strictEqual(fn.kind, 'function');
});

test('inheritance and call sites are captured', () => {
  const checkout = analyze('simple-ts/checkout.ts');
  const service = entity(checkout, 'CheckoutService');
  assert.strictEqual(service.extendsName, 'StripeClient');
  assert.ok(service.calls.includes('loadConfig'), 'method body calls should bubble to the class');
});

test('React components are distinguished from plain functions', () => {
  const app = analyze('react/App.tsx');
  const component = entity(app, 'App');
  assert.strictEqual(component.kind, 'component');
  assert.deepStrictEqual(component.renders, ['Button']);

  const button = entity(analyze('react/Button.tsx'), 'Button');
  assert.strictEqual(button.kind, 'component');

  // A capitalised non-JSX const must not be promoted to a component, and plain
  // data variables must not become entities at all.
  assert.strictEqual(app.entities.find((e) => e.name === 'NOT_A_COMPONENT'), undefined);
  assert.ok(app.exports.includes('NOT_A_COMPONENT'), 'but it is still an export');
});

test('malformed TypeScript degrades instead of throwing', () => {
  const analysis = analyze('malformed/broken.ts');
  // The TS parser is error-tolerant: it must return a well-formed analysis.
  assert.strictEqual(analysis.path, 'malformed/broken.ts');
  assert.ok(Array.isArray(analysis.entities));
  assert.ok(Array.isArray(analysis.imports));
});

test('JavaScript uses the same extraction path, including require()', () => {
  const analysis = javaScriptAnalyzer.analyze(
    'legacy/service.js',
    "const fs = require('./fs-helper');\n" +
    "async function boot() { const m = await import('./late'); return fs; }\n" +
    'module.exports = boot;\n'
  );
  const specifiers = analysis.imports.map((i) => i.specifier).sort();
  assert.deepStrictEqual(specifiers, ['./fs-helper', './late']);
  assert.strictEqual(analysis.language, 'javascript');
  assert.ok(analysis.entities.some((e) => e.name === 'boot'));
});

// ── Go parsing ──────────────────────────────────────────────────────────────

test('Go declarations are parsed and comments/strings cannot fake them', () => {
  const analysis = analyze('go/payment/payment.go');
  assert.strictEqual(analysis.packageName, 'payment');
  assert.deepStrictEqual(analysis.imports.map((i) => i.specifier).sort(), ['errors', 'fmt']);

  const client = entity(analysis, 'StripeClient');
  assert.strictEqual(client.kind, 'class');
  assert.strictEqual(client.extendsName, 'Base', 'embedded struct is the Go form of extends');
  assert.deepStrictEqual((client.members ?? []).map((m) => m.name).sort(), ['Charge', 'Refund']);

  const iface = entity(analysis, 'Charger');
  assert.strictEqual(iface.kind, 'interface');
  assert.deepStrictEqual((iface.members ?? []).map((m) => m.name).sort(), ['Charge', 'Refund']);

  // "func Fake(" lives in a comment and "func Decoy(" in a string literal.
  assert.strictEqual(analysis.entities.find((e) => e.name === 'Fake'), undefined);
  assert.strictEqual(analysis.entities.find((e) => e.name === 'Decoy'), undefined);

  // Go exports by capitalisation.
  assert.ok(analysis.exports.includes('New'));
  assert.ok(!analysis.exports.includes('notAFunc'));
});

test('malformed Go degrades instead of throwing', () => {
  const analysis = goAnalyzer.analyze('malformed/broken.go', read('malformed/broken.go'));
  assert.strictEqual(analysis.language, 'go');
  assert.ok(Array.isArray(analysis.entities));
});

// ── path handling and resolution ────────────────────────────────────────────

test('paths are normalised to POSIX', () => {
  assert.strictEqual(toPosix('src\\librarium\\panel.ts'), 'src/librarium/panel.ts');
  assert.strictEqual(toPosix('./src/a.ts'), 'src/a.ts');
});

test('relative imports resolve through extensions and index files', () => {
  const files = new Set([
    'src/config.ts', 'src/nested/index.ts', 'src/legacy.js', 'src/app.tsx',
  ]);
  assert.strictEqual(resolveRelativeImport('src/main.ts', './config', files), 'src/config.ts');
  assert.strictEqual(resolveRelativeImport('src/main.ts', './nested', files), 'src/nested/index.ts');
  assert.strictEqual(resolveRelativeImport('src/main.ts', './legacy', files), 'src/legacy.js');
  // ESM-style '.js' specifier pointing at a '.ts' source on disk.
  assert.strictEqual(resolveRelativeImport('src/main.ts', './config.js', files), 'src/config.ts');
  // Bare specifiers are packages, not files.
  assert.strictEqual(resolveRelativeImport('src/main.ts', 'react', files), undefined);
  // Escaping the workspace root resolves to nothing rather than a bogus path.
  assert.strictEqual(resolveRelativeImport('src/main.ts', '../../outside', files), undefined);
});

test('cross-package imports inside a monorepo resolve', () => {
  const files = new Set(['packages/core/index.ts', 'packages/app/main.ts']);
  assert.strictEqual(
    resolveRelativeImport('packages/app/main.ts', '../core/index.js', files),
    'packages/core/index.ts'
  );
});

test('Go module imports resolve to directories; stdlib does not', () => {
  const dirs = new Set(['payment', 'api']);
  assert.strictEqual(resolveGoImport('example.com/shop/payment', 'example.com/shop', dirs), 'payment');
  assert.strictEqual(resolveGoImport('fmt', 'example.com/shop', dirs), undefined);
  assert.strictEqual(resolveGoImport('example.com/other/pkg', 'example.com/shop', dirs), undefined);
  assert.strictEqual(resolveGoImport('example.com/shop/payment', undefined, dirs), undefined);
});

// ── graph construction ──────────────────────────────────────────────────────

function simpleTsGraph() {
  const analyses = ['config.ts', 'stripe.ts', 'checkout.ts'].map((f) =>
    analyze(`simple-ts/${f}`, `src/${f}`)
  );
  return buildGraph({
    workspace: { name: 'fixture', rootPath: '/tmp/fixture' },
    analyses,
  });
}

test('graph contains the workspace, directories, files and entities', () => {
  const graph = simpleTsGraph();
  assert.ok(graph.nodes.find((n) => n.id === ids.workspace()));
  assert.ok(graph.nodes.find((n) => n.id === ids.directory('src')));
  assert.ok(graph.nodes.find((n) => n.id === ids.file('src/checkout.ts')));
  assert.ok(graph.nodes.find((n) => n.type === 'class' && n.name === 'CheckoutService'));
  assert.strictEqual(graph.metadata.fileCount, 3);
  assert.strictEqual(graph.metadata.nodeCount, graph.nodes.length);
  assert.strictEqual(graph.metadata.edgeCount, graph.edges.length);
  assert.deepStrictEqual(graph.metadata.languageCounts, { typescript: 3 });
});

test('file-to-file import edges are directional and deduplicated', () => {
  const graph = simpleTsGraph();
  const imports = graph.edges.filter((e) => e.type === 'imports');
  const pairs = imports.map((e) => `${e.source}->${e.target}`).sort();
  assert.deepStrictEqual(pairs, [
    'file:src/checkout.ts->file:src/config.ts',
    'file:src/checkout.ts->file:src/stripe.ts',
    'file:src/stripe.ts->file:src/config.ts',
  ]);
  assert.strictEqual(new Set(pairs).size, pairs.length, 'no duplicate import edges');
});

test('external packages become package nodes, not phantom files', () => {
  const graph = simpleTsGraph();
  const pkg = graph.nodes.find((n) => n.type === 'package');
  assert.ok(pkg, 'node:util should surface as an external package');
  assert.ok(graph.edges.some((e) => e.type === 'dependsOn' && e.target === pkg!.id));
});

test('entity edges resolve across files', () => {
  const graph = simpleTsGraph();
  const service = graph.nodes.find((n) => n.name === 'CheckoutService')!;
  const base = graph.nodes.find((n) => n.name === 'StripeClient')!;
  assert.ok(
    graph.edges.some((e) => e.type === 'extends' && e.source === service.id && e.target === base.id),
    'CheckoutService extends StripeClient across a file boundary'
  );
  const loadConfig = graph.nodes.find((n) => n.name === 'loadConfig')!;
  assert.ok(
    graph.edges.some((e) => e.type === 'calls' && e.source === service.id && e.target === loadConfig.id)
  );
});

test('React render edges are produced', () => {
  const analyses = [
    analyze('react/App.tsx', 'src/App.tsx'),
    analyze('react/Button.tsx', 'src/Button.tsx'),
  ];
  const graph = buildGraph({ workspace: { name: 'react', rootPath: '/tmp' }, analyses });
  const app = graph.nodes.find((n) => n.name === 'App')!;
  const button = graph.nodes.find((n) => n.name === 'Button')!;
  assert.ok(graph.edges.some((e) => e.type === 'renders' && e.source === app.id && e.target === button.id));
});

test('Go package imports link every file in the target package', () => {
  const analyses = [
    analyze('go/payment/payment.go', 'payment/payment.go'),
    analyze('go/api/handler.go', 'api/handler.go'),
  ];
  const graph = buildGraph({
    workspace: { name: 'shop', rootPath: '/tmp/shop' },
    analyses,
    goModule: 'example.com/shop',
  });
  assert.ok(
    graph.edges.some(
      (e) => e.type === 'imports' &&
        e.source === ids.file('api/handler.go') &&
        e.target === ids.file('payment/payment.go')
    ),
    'api should depend on the payment package'
  );
  // Stdlib imports must not invent file nodes.
  assert.strictEqual(graph.nodes.filter((n) => n.type === 'file').length, 2);
});

test('the same file analyzed twice yields no duplicate nodes or edges', () => {
  const analysis = analyze('simple-ts/config.ts', 'src/config.ts');
  const graph = buildGraph({
    workspace: { name: 'dupe', rootPath: '/tmp' },
    analyses: [analysis, analysis],
  });
  assert.strictEqual(new Set(graph.nodes.map((n) => n.id)).size, graph.nodes.length);
  assert.strictEqual(new Set(graph.edges.map((e) => e.id)).size, graph.edges.length);
  assert.strictEqual(graph.nodes.filter((n) => n.id === ids.file('src/config.ts')).length, 1);
});

test('directory chains are created once and nest correctly', () => {
  const graph = buildGraph({
    workspace: { name: 'nested', rootPath: '/tmp' },
    analyses: [
      analyze('simple-ts/config.ts', 'src/api/deep/config.ts'),
      analyze('simple-ts/stripe.ts', 'src/api/stripe.ts'),
    ],
  });
  const dirs = graph.nodes.filter((n) => n.type === 'directory').map((n) => n.filePath).sort();
  assert.deepStrictEqual(dirs, ['src', 'src/api', 'src/api/deep']);
  assert.ok(graph.edges.some(
    (e) => e.type === 'contains' && e.source === ids.directory('src') && e.target === ids.directory('src/api')
  ));
  assert.ok(graph.edges.some(
    (e) => e.type === 'contains' && e.source === ids.workspace() && e.target === ids.directory('src')
  ));
});

test('an empty workspace produces a valid, empty-but-not-broken graph', () => {
  const graph = buildGraph({ workspace: { name: 'empty', rootPath: '/tmp' }, analyses: [] });
  assert.strictEqual(graph.metadata.fileCount, 0);
  assert.strictEqual(graph.nodes.length, 1, 'only the workspace node');
  assert.deepStrictEqual(graph.edges, []);
  assert.deepStrictEqual(graph.cycles, []);
  assert.deepStrictEqual(graph.hubs, []);
});

test('files that failed to parse are reported, not dropped', () => {
  const graph = buildGraph({
    workspace: { name: 'partial', rootPath: '/tmp' },
    analyses: [
      { path: 'src/bad.ts', language: 'typescript', imports: [], exports: [], entities: [], error: 'boom' },
    ],
  });
  assert.deepStrictEqual(graph.metadata.failedFiles, ['src/bad.ts']);
  assert.ok(graph.nodes.find((n) => n.id === ids.file('src/bad.ts')), 'the file still appears in the graph');
});

// ── cycles and hubs ─────────────────────────────────────────────────────────

test('circular dependencies are detected and returned as a ring', () => {
  const analyses = ['auth.ts', 'user.ts', 'session.ts'].map((f) =>
    analyze(`circular/${f}`, `src/${f}`)
  );
  const graph = buildGraph({ workspace: { name: 'circular', rootPath: '/tmp' }, analyses });
  assert.strictEqual(graph.cycles.length, 1);
  const ring = graph.cycles[0].nodes;
  assert.strictEqual(ring.length, 3);
  assert.deepStrictEqual(
    [...ring].sort(),
    [ids.file('src/auth.ts'), ids.file('src/session.ts'), ids.file('src/user.ts')]
  );
});

test('an acyclic graph reports no heresy', () => {
  assert.deepStrictEqual(simpleTsGraph().cycles, []);
});

test('cycle detection survives a large graph without blowing the stack', () => {
  // A 20k-long chain: a recursive Tarjan would overflow here.
  const edges = [];
  for (let i = 0; i < 20000; i++) {
    edges.push({ id: `e${i}`, source: `n${i}`, target: `n${i + 1}`, type: 'imports' as const });
  }
  edges.push({ id: 'close', source: 'n20000', target: 'n0', type: 'imports' as const });
  const cycles = findCycles(edges);
  assert.strictEqual(cycles.length, 1);
  assert.strictEqual(cycles[0].nodes.length, 20001);
});

test('self-imports count as a cycle', () => {
  const cycles = findCycles([
    { id: 'e', source: 'file:a.ts', target: 'file:a.ts', type: 'imports' },
  ]);
  assert.strictEqual(cycles.length, 1);
});

test('hubs rank files by total import degree', () => {
  const graph = simpleTsGraph();
  const hubs = findHubs(graph.nodes, graph.edges.filter((e) => e.type === 'imports'));
  const config = hubs.find((h) => h.name === 'config.ts')!;
  assert.strictEqual(config.incoming, 2, 'config is imported by everything');
  assert.strictEqual(config.outgoing, 0);
  assert.strictEqual(config.degree, 2);
  // Ranking is by degree, descending.
  for (let i = 1; i < hubs.length; i++) {
    assert.ok(hubs[i - 1].degree >= hubs[i].degree, 'hubs must be sorted by degree');
  }
  assert.ok(hubs.every((h) => h.degree > 0), 'unconnected files are not hubs');
});

// ── cache ───────────────────────────────────────────────────────────────────

test('cache serves hits and invalidates on mtime or size change', () => {
  const cache = new AnalysisCache();
  const analysis = analyze('simple-ts/config.ts', 'src/config.ts');
  cache.set('src/config.ts', 100, 500, analysis);

  assert.strictEqual(cache.get('src/config.ts', 100, 500), analysis);
  assert.strictEqual(cache.get('src/config.ts', 101, 500), undefined, 'mtime change invalidates');

  cache.set('src/config.ts', 100, 500, analysis);
  assert.strictEqual(cache.get('src/config.ts', 100, 501), undefined, 'size change invalidates');

  cache.set('src/config.ts', 100, 500, analysis);
  cache.invalidate('src/config.ts');
  assert.strictEqual(cache.get('src/config.ts', 100, 500), undefined);
});

test('cache round-trips through serialization and rejects foreign payloads', () => {
  const cache = new AnalysisCache();
  cache.set('src/a.ts', 1, 2, analyze('simple-ts/config.ts', 'src/a.ts'));
  const revived = AnalysisCache.deserialize(JSON.parse(JSON.stringify(cache.serialize())));
  assert.strictEqual(revived.size, 1);
  assert.ok(revived.get('src/a.ts', 1, 2));

  assert.strictEqual(AnalysisCache.deserialize(undefined).size, 0);
  assert.strictEqual(AnalysisCache.deserialize({ version: 0, entries: {} }).size, 0);
  assert.strictEqual(AnalysisCache.deserialize('garbage').size, 0);
});

// ── runner ──────────────────────────────────────────────────────────────────

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nlibrarium: ${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exit(1);
