// Runnable self-check for the pure override-merge logic.
// Run: npx tsc && node out/customize.test.js  (or ts-node src/customize.test.ts)
import assert from 'assert';
import Module from 'module';
// 'vscode' only resolves inside the extension host; stub it so this pure-logic
// check runs under plain node.
const origLoad = (Module as any)._load;
(Module as any)._load = (req: string, ...rest: unknown[]) =>
  req === 'vscode' ? {} : origLoad(req, ...rest);

// require (not import) so the stub above is installed before customize loads.
const { mergeOverride } = require('./customize') as typeof import('./customize');

// theme-scoped write preserves other keys in the same scope + top-level siblings
const start = {
  'editorCursor.foreground': '#top',
  '[Blood Angels]': { 'statusBar.background': '#keep' },
};
const out = mergeOverride(start, 'editorCursor.foreground', '#new', 'Blood Angels');
assert.deepStrictEqual(out['[Blood Angels]'], {
  'statusBar.background': '#keep',
  'editorCursor.foreground': '#new',
});
assert.strictEqual(out['editorCursor.foreground'], '#top'); // top-level untouched
assert.notStrictEqual(out, start); // input not mutated
assert.deepStrictEqual((start['[Blood Angels]'] as object), { 'statusBar.background': '#keep' });

// no theme → top-level write
const flat = mergeOverride({}, 'comments', '#8a8a8a', '');
assert.strictEqual(flat['comments'], '#8a8a8a');

console.log('customize merge: OK');
