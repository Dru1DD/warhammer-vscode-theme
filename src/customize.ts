import * as vscode from 'vscode';

/**
 * Feature 1 — Theme Customization Injector.
 *
 * A curated, faction-neutral palette layered on top of whatever theme is
 * active. Values are intentionally subtle overrides (chrome + accents) rather
 * than a full theme, so they read well against every one of the 16 factions.
 */
const WARHAMMER_CUSTOMIZATIONS: Readonly<Record<string, string>> = {
  'titleBar.activeBackground': '#12070a',
  'titleBar.activeForeground': '#e8d5b0',
  'titleBar.inactiveBackground': '#0d0809',
  'activityBar.background': '#0d0809',
  'activityBar.foreground': '#c9a84c',
  'activityBar.activeBorder': '#c41e3a',
  'statusBar.background': '#12070a',
  'statusBar.foreground': '#c9a84c',
  'statusBar.noFolderBackground': '#0d0809',
  'editorCursor.foreground': '#c41e3a',
  'editorLineNumber.activeForeground': '#c9a84c',
  'terminal.ansiRed': '#c41e3a',
  'terminal.ansiYellow': '#c9a84c',
  'selection.background': '#c41e3a44',
};

/** Marker prefix so a later "reset" could distinguish our keys from the user's. */
const MANAGED_KEYS = new Set(Object.keys(WARHAMMER_CUSTOMIZATIONS));

/**
 * Safely merges the Warhammer palette into the user's
 * `workbench.colorCustomizations`. Existing user keys are preserved; only our
 * managed keys are (re)written. Uses the configuration API rather than editing
 * settings.json by hand, so comments and formatting the user has are untouched.
 */
export async function applyColorCustomizations(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const existing =
    config.get<Record<string, unknown>>('workbench.colorCustomizations') ?? {};

  const alreadyApplied = [...MANAGED_KEYS].every(
    (key) => existing[key] === WARHAMMER_CUSTOMIZATIONS[key]
  );
  if (alreadyApplied) {
    void vscode.window.showInformationMessage(
      'The rites are already inscribed. Your colours remain sanctified.'
    );
    return;
  }

  const merged = { ...existing, ...WARHAMMER_CUSTOMIZATIONS };

  try {
    await config.update(
      'workbench.colorCustomizations',
      merged,
      vscode.ConfigurationTarget.Global
    );
    void vscode.window.showInformationMessage(
      '✚ The Omnissiah blesses your custom colours. Purity of aesthetic achieved.'
    );
  } catch (err) {
    void vscode.window.showErrorMessage(
      `The colour-rites were rejected by the machine spirit: ${String(err)}`
    );
  }
}

export function registerCustomizeThemeCommand(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('warhammer.customizeTheme', () =>
      applyColorCustomizations()
    )
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Per-key colour tuning — the Servo-Skull "rites plate".
 *
 * Overrides are written *theme-scoped* (`"[<Active Theme>]": { ... }`) so a
 * tweak sticks to the theme it was made under and leaves every other faction
 * untouched. Colours use `workbench.colorCustomizations`; `comments` and other
 * syntax scopes use `editor.tokenColorCustomizations`.
 * ───────────────────────────────────────────────────────────────────────── */

export type TargetKind = 'color' | 'token';

export interface TunableTarget {
  id: string;
  label: string;
  /** colorCustomizations key, or a tokenColorCustomizations scope name. */
  key: string;
  kind: TargetKind;
  /** Optional alpha appended to the hex for `color` targets (e.g. selection). */
  alpha?: string;
  /** FactionPalette field used as the default swatch when nothing is set yet. */
  paletteKey: string;
}

export const TUNABLE_TARGETS: readonly TunableTarget[] = [
  { id: 'comments',  label: 'Comments',            key: 'comments',                          kind: 'token', paletteKey: 'goldDim' },
  { id: 'cursor',    label: 'Cursor',              key: 'editorCursor.foreground',           kind: 'color', paletteKey: 'accent'  },
  { id: 'lineNum',   label: 'Active Line Number',  key: 'editorLineNumber.activeForeground',  kind: 'color', paletteKey: 'gold'    },
  { id: 'actIcon',   label: 'Activity Bar Icons',  key: 'activityBar.foreground',            kind: 'color', paletteKey: 'gold'    },
  { id: 'statusBg',  label: 'Status Bar Background', key: 'statusBar.background',            kind: 'color', paletteKey: 'bgBase'  },
  { id: 'selection', label: 'Selection',           key: 'selection.background',              kind: 'color', alpha: '55', paletteKey: 'accent' },
];

const SETTING_FOR: Record<TargetKind, string> = {
  color: 'workbench.colorCustomizations',
  token: 'editor.tokenColorCustomizations',
};

function activeThemeName(): string {
  return (
    vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '') ||
    ''
  );
}

/** Reads the current override for a target (theme-scoped first, then global). */
export function readColorOverride(
  key: string,
  kind: TargetKind
): string | undefined {
  const root =
    vscode.workspace
      .getConfiguration()
      .get<Record<string, unknown>>(SETTING_FOR[kind]) ?? {};
  const theme = activeThemeName();
  const scoped = theme
    ? (root[`[${theme}]`] as Record<string, unknown> | undefined)
    : undefined;
  const value = scoped?.[key] ?? root[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Pure merge: returns a new root with `key: value` set — theme-scoped under
 * `[theme]` when a theme name is given, else at the top level. Existing
 * siblings (other keys, other theme scopes) are preserved.
 */
export function mergeOverride(
  root: Record<string, unknown>,
  key: string,
  value: string,
  theme: string
): Record<string, unknown> {
  const next = { ...root };
  if (theme) {
    const scopeKey = `[${theme}]`;
    next[scopeKey] = {
      ...((next[scopeKey] as Record<string, unknown>) ?? {}),
      [key]: value,
    };
  } else {
    next[key] = value;
  }
  return next;
}

/** Writes a single theme-scoped colour/token override, preserving siblings. */
export async function setColorOverride(
  key: string,
  hex: string,
  kind: TargetKind,
  alpha?: string
): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const setting = SETTING_FOR[kind];
  const root = config.get<Record<string, unknown>>(setting) ?? {};
  const value = kind === 'color' ? hex + (alpha ?? '') : hex;
  const merged = mergeOverride(root, key, value, activeThemeName());
  await config.update(setting, merged, vscode.ConfigurationTarget.Global);
}
