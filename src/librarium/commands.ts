/**
 * Librarium command surface.
 *
 * All navigation goes through the standard VS Code command API; nothing here
 * invents its own way to open a file or reveal a range.
 */

import * as vscode from 'vscode';
import { LibrariumPanel } from './panel';
import { LibrariumNavProvider } from './navView';
import { analyzerFor } from './analyzer/registry';
import { toPosix } from './resolve';

/** Workspace-relative path of a uri, or of the active editor when omitted. */
function relPathFor(uri?: vscode.Uri): string | undefined {
  const target = uri ?? vscode.window.activeTextEditor?.document.uri;
  if (!target || target.scheme !== 'file') return undefined;
  return toPosix(vscode.workspace.asRelativePath(target, false));
}

export function registerLibrariumCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      LibrariumNavProvider.viewId,
      new LibrariumNavProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    ),

    vscode.commands.registerCommand('warhammer.librarium.open', () =>
      LibrariumPanel.show(context)
    ),

    vscode.commands.registerCommand('warhammer.librarium.refresh', async () => {
      const panel = LibrariumPanel.active;
      if (!panel) {
        await LibrariumPanel.show(context, undefined, true);
        return;
      }
      await panel.refresh();
    }),

    vscode.commands.registerCommand(
      'warhammer.librarium.focusCurrentFile',
      async (uri?: vscode.Uri) => {
        const relPath = relPathFor(uri);
        if (!relPath) {
          void vscode.window.showInformationMessage(
            'Librarium: open a file first — there is no record to inspect.'
          );
          return;
        }
        if (!analyzerFor(relPath)) {
          void vscode.window.showInformationMessage(
            `Librarium: ${relPath} is not a supported record type (TypeScript, JavaScript, Go).`
          );
          return;
        }
        await LibrariumPanel.show(context, relPath);
      }
    )
  );
}
