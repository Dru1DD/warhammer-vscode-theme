// Runnable self-check for the pure vibrancy logic.
// Run: npx tsc && node out/vibrancy.test.js
import assert from 'assert';
import Module from 'module';
// 'vscode' only resolves inside the extension host; stub it for plain node.
const origLoad = (Module as any)._load;
(Module as any)._load = (req: string, ...rest: unknown[]) =>
  req === 'vscode' ? {} : origLoad(req, ...rest);

const { alphaHex, translucentBases, isTranslucent, setTranslucency } =
  require('./vibrancy') as typeof import('./vibrancy');

assert.strictEqual(alphaHex(0.7), 'B3');
assert.strictEqual(alphaHex(0), '00');
assert.strictEqual(alphaHex(1), 'FF');
assert.strictEqual(alphaHex(5), 'FF'); // clamped

// only opaque hex backgrounds qualify; foregrounds ignored
const bases = translucentBases({
  'editor.background': '#111114',
  'sideBar.background': '#0d0d0f80',
  'editor.foreground': '#ffffff',
});
assert.deepStrictEqual(bases, { 'editor.background': '#111114' });

// on: merges into theme scope, keeps siblings
const start = {
  'editorCursor.foreground': '#top',
  '[Blood Angels]': { 'statusBar.foreground': '#keep' },
};
assert.strictEqual(isTranslucent(start, 'Blood Angels', bases), false);
const on = setTranslucency(start, 'Blood Angels', bases, 'B3');
assert.strictEqual(isTranslucent(on, 'Blood Angels', bases), true);
assert.deepStrictEqual(on['[Blood Angels]'], {
  'statusBar.foreground': '#keep',
  'editor.background': '#111114B3',
});
assert.strictEqual(on['editorCursor.foreground'], '#top');

// opacity change: still recognised as ours, re-tinted in place
const dimmer = setTranslucency(on, 'Blood Angels', bases, '4D');
assert.strictEqual(isTranslucent(dimmer, 'Blood Angels', bases), true);
assert.strictEqual((dimmer['[Blood Angels]'] as any)['editor.background'], '#1111144D');

// off: removes ours regardless of alpha, keeps siblings
const off = setTranslucency(dimmer, 'Blood Angels', bases, undefined);
assert.deepStrictEqual(off['[Blood Angels]'], { 'statusBar.foreground': '#keep' });

// off with nothing left drops the empty scope; user colour is not ours
assert.deepStrictEqual(setTranslucency(setTranslucency({}, 'X', bases, 'B3'), 'X', bases, undefined), {});
const edited = { '[X]': { 'editor.background': '#222222' } };
assert.strictEqual(isTranslucent(edited, 'X', bases), false);
assert.deepStrictEqual(setTranslucency(edited, 'X', bases, undefined), edited);
assert.deepStrictEqual(isTranslucent({}, 'X', {}), false); // nothing to tint

console.log('vibrancy toggle: OK');
