import * as vscode from 'vscode';

/**
 * Feature 2 — Smart Project Context ("Tech-Priest Mode").
 *
 * Inspects the workspace root to identify the tech stack, then supplies
 * tailored `projectOpen` voice lines. Detection is best-effort and fully
 * async (uses `vscode.workspace.fs`, never node's `fs`), and degrades
 * gracefully when there is no workspace or no recognisable manifest.
 */

export type StackId = 'react' | 'vue' | 'rust' | 'go' | 'python' | 'node';

const STACK_LINES: Readonly<Record<StackId, readonly string[]>> = {
  react: [
    'Hooks initialized. The Omnissiah blesses this DOM.',
    'The Virtual Cogitator awakens. Render the sacred tree.',
    'Component hierarchy sanctified. Re-render in the Emperor\'s name.',
  ],
  vue: [
    'Reactive bindings established. The machine spirit observes every mutation.',
    'The Composition rites are prepared. The Omnissiah blesses this template.',
    'Directives inscribed. The DOM bends to your will.',
  ],
  rust: [
    'The Borrow Checker is a true test of faith.',
    'Ownership is purity. Lifetimes are eternal vigilance.',
    'No garbage collector shall taint this forge. The metal is sound.',
  ],
  go: [
    'Goroutines dispatched like servo-skulls across the void.',
    'Errors returned, not raised. The Codex approves of such discipline.',
  ],
  python: [
    'The Serpent-tongue is interpreted, yet the Omnissiah tolerates it.',
    'Indentation is doctrine. Stray not from the sacred whitespace.',
  ],
  node: [
    'The event loop turns eternal. The machine spirit does not sleep.',
    'Dependencies without number. Audit them, lest heresy take root.',
  ],
};

async function fileExists(root: vscode.Uri, name: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, name));
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson(
  root: vscode.Uri
): Promise<Record<string, unknown> | undefined> {
  try {
    const raw = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(root, 'package.json')
    );
    return JSON.parse(Buffer.from(raw).toString('utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Returns the set of stacks detected at the workspace root, most-specific
 * first. Empty when there is no workspace or nothing recognisable.
 */
export async function detectStack(): Promise<StackId[]> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return [];

  const root = folders[0].uri;
  const found = new Set<StackId>();

  if (await fileExists(root, 'Cargo.toml')) found.add('rust');
  if (await fileExists(root, 'go.mod')) found.add('go');
  if (
    (await fileExists(root, 'pyproject.toml')) ||
    (await fileExists(root, 'requirements.txt'))
  ) {
    found.add('python');
  }

  const pkg = await readPackageJson(root);
  if (pkg) {
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
    };
    const hasReact = 'react' in deps || 'react-dom' in deps || 'next' in deps;
    const hasVue = 'vue' in deps || 'nuxt' in deps;
    if (hasReact) found.add('react');
    if (hasVue) found.add('vue');
    if (!hasReact && !hasVue) found.add('node');
  }

  return [...found];
}

/**
 * Flattens the tailored lines for the detected stacks into a single pool.
 * Returns an empty array when no stack was detected, which signals the mascot
 * to fall back to its standard `projectOpen` pool.
 */
export function resolveStackLines(ids: StackId[]): string[] {
  return ids.flatMap((id) => [...STACK_LINES[id]]);
}
