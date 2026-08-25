/**
 * Librarium activity-bar entry.
 *
 * The book icon in the activity bar opens a small navigation view; showing that
 * view opens (or reveals) the Librarium panel itself, so clicking the icon does
 * what a user expects — it opens the Librarium — while still leaving somewhere
 * to put the quick actions.
 */

import * as vscode from 'vscode';
import { getNonce } from '../util';
import { LibrariumPanel } from './panel';
import { buildTheme } from './theme';

export class LibrariumNavProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'warhammer.librariumNav';

  constructor(private readonly context: vscode.ExtensionContext) { }

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true, localResourceRoots: [] };
    view.webview.html = this.html();

    view.webview.onDidReceiveMessage((msg: { command?: string }) => {
      if (msg.command === 'open') void LibrariumPanel.show(this.context);
      else if (msg.command === 'refresh') void vscode.commands.executeCommand('warhammer.librarium.refresh');
      else if (msg.command === 'focus') void vscode.commands.executeCommand('warhammer.librarium.focusCurrentFile');
    });

    // Opening the container is itself the request to consult the Librarium.
    void LibrariumPanel.show(this.context);
    view.onDidChangeVisibility(() => {
      if (view.visible) void LibrariumPanel.show(this.context);
    });

    vscode.window.onDidChangeActiveColorTheme(
      () => { view.webview.html = this.html(); },
      null,
      this.context.subscriptions
    );
  }

  private html(): string {
    const nonce = getNonce();
    const theme = buildTheme();
    const vars = Object.entries(theme.variables)
      .map(([key, value]) => `    ${key}: ${value};`)
      .join('\n');

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
${vars}
  }
  body {
    background: transparent;
    color: var(--librarium-text);
    font-family: ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    padding: 14px 12px;
  }
  .tag {
    font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--librarium-accent); margin-bottom: 10px;
  }
  p { color: var(--librarium-muted); line-height: 1.7; margin-bottom: 14px; font-size: 11.5px; }
  button {
    display: block; width: 100%; text-align: left;
    padding: 8px 11px; margin-bottom: 7px; cursor: pointer;
    background: transparent; color: var(--librarium-text);
    border: 1px solid var(--librarium-border); border-radius: 6px;
    font-family: inherit; font-size: 11.5px;
  }
  button:hover { border-color: var(--librarium-border-strong); color: var(--librarium-accent); }
  button.primary {
    background: var(--librarium-accent-soft);
    border-color: var(--librarium-border-strong);
    color: var(--librarium-accent);
    letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px;
  }
  .note {
    margin-top: 14px; padding-top: 12px;
    border-top: 1px solid var(--librarium-border);
    font-size: 10.5px; color: var(--librarium-muted); line-height: 1.7;
  }
</style>
</head>
<body>
  <div class="tag">Librarium</div>
  <p>The knowledge index of this workspace. Analysis is local — no network, no accounts.</p>
  <button class="primary" id="open">Consult the Librarium</button>
  <button id="focus">Focus on current file</button>
  <button id="refresh">Re-index workspace</button>
  <div class="note">Records are read from your source with a real parser. Nothing leaves this machine.</div>
<script nonce="${nonce}">
  var api = acquireVsCodeApi();
  document.getElementById('open').addEventListener('click', function () { api.postMessage({ command: 'open' }); });
  document.getElementById('focus').addEventListener('click', function () { api.postMessage({ command: 'focus' }); });
  document.getElementById('refresh').addEventListener('click', function () { api.postMessage({ command: 'refresh' }); });
</script>
</body>
</html>`;
  }
}
