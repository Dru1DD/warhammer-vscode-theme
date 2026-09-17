import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vibrancy toggle.
 *
 * VS Code has no API for window transparency, so the blur itself comes from
 * the Vibrancy Continued extension (it patches the VS Code install). Our part
 * is making the active faction's chrome translucent — theme-scoped overrides
 * in `workbench.colorCustomizations` — and driving that extension's commands.
 */
const VIBRANCY_EXTENSION = 'illixion.vscode-vibrancy-continued';

const TRANSLUCENT_KEYS = [
  'editor.background',
  'editorGutter.background',
  'editorGroupHeader.tabsBackground',
  'tab.activeBackground',
  'tab.inactiveBackground',
  'sideBar.background',
  'sideBarSectionHeader.background',
  'activityBar.background',
  'panel.background',
  'terminal.background',
  'titleBar.activeBackground',
  'titleBar.inactiveBackground',
  'statusBar.background',
] as const;

/** Pure: 0..1 opacity to a two-digit hex alpha suffix. */
export function alphaHex(opacity: number): string {
  const clamped = Math.min(1, Math.max(0, opacity));
  return Math.round(clamped * 255).toString(16).padStart(2, '0').toUpperCase();
}

/** Pure: the theme's opaque (#rrggbb) backgrounds we make translucent. */
export function translucentBases(
  colors: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of TRANSLUCENT_KEYS) {
    const hex = colors[key];
    if (/^#[0-9a-f]{6}$/i.test(hex ?? '')) out[key] = hex;
  }
  return out;
}

/** Ours = theme base colour plus any alpha, so opacity changes stay recognisable. */
function isOurs(value: unknown, base: string): boolean {
  return (
    typeof value === 'string' &&
    value.length === 9 &&
    value.toLowerCase().startsWith(base.toLowerCase())
  );
}

function scopeOf(root: Record<string, unknown>, theme: string) {
  return (root[`[${theme}]`] as Record<string, unknown>) ?? {};
}

/** Pure: whether translucency is currently applied in the `[theme]` scope. */
export function isTranslucent(
  root: Record<string, unknown>,
  theme: string,
  bases: Record<string, string>
): boolean {
  const scope = scopeOf(root, theme);
  const entries = Object.entries(bases);
  return entries.length > 0 && entries.every(([k, v]) => isOurs(scope[k], v));
}

/**
 * Pure: writes `base + alpha` into the `[theme]` scope, or with alpha
 * `undefined` removes only keys still holding our colour, so manual user
 * tweaks survive. Other scopes and top-level keys are untouched.
 */
export function setTranslucency(
  root: Record<string, unknown>,
  theme: string,
  bases: Record<string, string>,
  alpha: string | undefined
): Record<string, unknown> {
  const scopeKey = `[${theme}]`;
  const scope = { ...scopeOf(root, theme) };
  for (const [k, base] of Object.entries(bases)) {
    if (alpha !== undefined) scope[k] = base + alpha;
    else if (isOurs(scope[k], base)) delete scope[k];
  }
  const next = { ...root, [scopeKey]: scope };
  if (Object.keys(scope).length === 0) delete next[scopeKey];
  return next;
}

/** Colours of the active theme, if it is one of ours. */
function readActiveThemeColors(
  context: vscode.ExtensionContext,
  theme: string
): Record<string, string> | undefined {
  const themes: { label: string; path: string }[] =
    context.extension.packageJSON.contributes?.themes ?? [];
  const entry = themes.find((t) => t.label === theme);
  if (!entry) return undefined;
  const file = path.join(context.extensionPath, entry.path);
  return JSON.parse(fs.readFileSync(file, 'utf8')).colors;
}

function activeTheme(): string {
  return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '');
}

function currentAlpha(): string {
  return alphaHex(
    vscode.workspace.getConfiguration('warhammer.vibrancy').get<number>('opacity', 0.7)
  );
}

async function writeCustomizations(root: Record<string, unknown>): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', root, vscode.ConfigurationTarget.Global);
}

function readCustomizations(): Record<string, unknown> {
  return (
    vscode.workspace
      .getConfiguration()
      .get<Record<string, unknown>>('workbench.colorCustomizations') ?? {}
  );
}

async function toggleVibrancy(context: vscode.ExtensionContext): Promise<void> {
  const theme = activeTheme();
  const colors = readActiveThemeColors(context, theme);
  if (!colors) {
    void vscode.window.showWarningMessage(
      'Vibrancy rites work only under a Warhammer 40k faction theme.'
    );
    return;
  }

  const bases = translucentBases(colors);
  const current = readCustomizations();
  const enabled = !isTranslucent(current, theme, bases);
  await writeCustomizations(
    setTranslucency(current, theme, bases, enabled ? currentAlpha() : undefined)
  );

  const installed = !!vscode.extensions.getExtension(VIBRANCY_EXTENSION);

  if (!enabled) {
    if (installed) {
      await vscode.commands.executeCommand('extension.uninstallVibrancy');
    }
    void vscode.window.showInformationMessage(
      `Vibrancy dispelled for ${theme}. The void is sealed.`
    );
    return;
  }

  if (!installed) {
    const choice = await vscode.window.showInformationMessage(
      `${theme} is now translucent. The blur needs the Vibrancy Continued extension, which patches VS Code files.`,
      'Install',
      'Later'
    );
    if (choice !== 'Install') return;
    await vscode.commands.executeCommand(
      'workbench.extensions.installExtension',
      VIBRANCY_EXTENSION
    );
  }

  // Vibrancy Continued handles its own confirmation and restart prompt.
  await vscode.commands.executeCommand('extension.installVibrancy');
}

/** Opacity changed: re-tint the active theme if translucency is on. */
async function reapplyOpacity(context: vscode.ExtensionContext): Promise<void> {
  const theme = activeTheme();
  const colors = readActiveThemeColors(context, theme);
  if (!colors) return;
  const bases = translucentBases(colors);
  const current = readCustomizations();
  if (!isTranslucent(current, theme, bases)) return;
  await writeCustomizations(setTranslucency(current, theme, bases, currentAlpha()));
}

export function registerVibrancyCommand(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('warhammer.vibrancy.toggle', () =>
      toggleVibrancy(context).catch((err) =>
        vscode.window.showErrorMessage(
          `The vibrancy rites failed: ${String(err)}`
        )
      )
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('warhammer.vibrancy.opacity')) {
        void reapplyOpacity(context);
      }
    })
  );
}
