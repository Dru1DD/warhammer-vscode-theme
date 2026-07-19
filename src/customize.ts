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
