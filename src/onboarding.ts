import * as vscode from 'vscode';
import { getNonce } from './util';

/**
 * Feature 5 — Inquisition Terminal Welcome Screen.
 *
 * A full-editor webview panel shown once on first activation. Reopenable via
 * the `warhammer.showWelcome` command. Disposes cleanly and holds no timers.
 */

const SEEN_KEY = 'warhammer.hasSeenOnboarding';

/** Shows the terminal only the first time; marks it seen afterwards. */
export async function maybeShowOnboarding(
  context: vscode.ExtensionContext
): Promise<void> {
  if (context.globalState.get<boolean>(SEEN_KEY, false)) return;
  showOnboarding(context);
  await context.globalState.update(SEEN_KEY, true);
}

/** Opens (or focuses) the Inquisition Terminal panel. Safe to call anytime. */
export function showOnboarding(
  context: vscode.ExtensionContext
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    'warhammer.onboarding',
    'Inquisition Terminal',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: false,
      localResourceRoots: [],
    }
  );

  panel.webview.html = buildOnboardingHtml();

  // Tie lifetime to the extension so it is torn down on deactivate.
  context.subscriptions.push(panel);
  panel.onDidDispose(() => {
    /* nothing retained; handler present for symmetry / future cleanup */
  });

  return panel;
}

export function registerOnboardingCommand(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('warhammer.showWelcome', () =>
      showOnboarding(context)
    )
  );
}

function buildOnboardingHtml(): string {
  const nonce = getNonce();
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; font-src 'none';">
<style nonce="${nonce}">
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --amber: #d8a838;
    --amber-dim: #8a6a20;
    --green: #58c878;
    --bg: #08060a;
    --panel: #0d0a10;
    --line: rgba(216, 168, 56, 0.22);
  }

  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--amber);
    font-family: 'Courier New', 'DejaVu Sans Mono', monospace;
    letter-spacing: 0.03em;
    overflow-x: hidden;
  }

  /* CRT scanline + vignette overlay */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 5; pointer-events: none;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(0,0,0,0) 0px,
        rgba(0,0,0,0) 2px,
        rgba(0,0,0,0.18) 3px
      ),
      radial-gradient(ellipse 90% 70% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%);
  }

  .wrap {
    position: relative; z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 32px 64px;
  }

  .frame {
    border: 1px solid var(--line);
    background:
      linear-gradient(180deg, rgba(216,168,56,0.04), transparent 40%),
      var(--panel);
    padding: 30px 30px 34px;
    box-shadow: 0 0 40px rgba(216,168,56,0.06), inset 0 0 60px rgba(0,0,0,0.6);
  }

  .banner {
    text-align: center;
    border-bottom: 1px solid var(--line);
    padding-bottom: 18px;
    margin-bottom: 22px;
  }
  .banner .sigil { font-size: 26px; color: var(--amber); text-shadow: 0 0 14px rgba(216,168,56,0.5); }
  .banner h1 {
    font-size: 18px;
    font-weight: normal;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    margin-top: 10px;
    color: #f0d89a;
    text-shadow: 0 0 12px rgba(216,168,56,0.4);
  }
  .banner .sub {
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--amber-dim);
    margin-top: 8px;
  }

  .boot { font-size: 12px; line-height: 1.9; color: var(--green); opacity: 0.85; margin-bottom: 26px; }
  .boot .ok { color: var(--amber); }

  h2 {
    font-size: 11px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #f0d89a;
    margin: 26px 0 12px;
    padding-left: 14px;
    border-left: 2px solid var(--amber);
  }

  p, li { font-size: 12.5px; line-height: 1.75; color: #d8c49a; }
  ul { list-style: none; }
  li { padding: 4px 0 4px 18px; position: relative; }
  li::before {
    content: '▸';
    position: absolute; left: 0;
    color: var(--amber);
  }
  li b { color: #f0d89a; font-weight: normal; }

  .cmd-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .cmd-table td {
    font-size: 12px;
    padding: 7px 10px;
    border-bottom: 1px dotted var(--line);
    vertical-align: top;
  }
  .cmd-table td.k {
    color: var(--green);
    white-space: nowrap;
    width: 46%;
  }
  .cmd-table td.d { color: #cdbe98; }

  .note {
    margin-top: 26px;
    padding: 14px 16px;
    border: 1px dashed var(--line);
    background: rgba(216,168,56,0.03);
    font-size: 12px;
    line-height: 1.7;
    color: #cdbe98;
  }
  .note b { color: var(--amber); }

  .footer {
    text-align: center;
    margin-top: 30px;
    font-size: 10px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--amber-dim);
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="frame">
      <div class="banner">
        <div class="sigil">✚</div>
        <h1>Inquisition Terminal</h1>
        <div class="sub">Warhammer 40k · Grimdark Elite</div>
      </div>

      <div class="boot">
        &gt; ESTABLISHING NOOSPHERIC LINK<span class="ok"> ... [OK]</span><br>
        &gt; AWAKENING MACHINE SPIRIT<span class="ok"> ... [OK]</span><br>
        &gt; SERVO-SKULL 7-THETA ONLINE<span class="ok"> ... [OK]</span><br>
        &gt; AUTHORITY GRANTED. WELCOME, ADEPT.
      </div>

      <h2>Core Systems</h2>
      <ul>
        <li><b>16 Faction Themes</b> — ten dark, six light. Choose your Chapter via <b>Preferences: Color Theme</b>.</li>
        <li><b>Servo-Skull Companion</b> — an animated sentinel in your Explorer sidebar with a faction-matched voice.</li>
        <li><b>Event Transmissions</b> — the skull reacts to builds, commits, long sessions, and the small hours of the night.</li>
        <li><b>Purity Seals</b> — your commits are counted across all sessions. Milestones earn an Imperial commendation.</li>
        <li><b>The Librarium</b> — a local knowledge graph of your codebase: architecture, file dependencies, entities, dependency hubs and circular-import heresy. No network, no accounts.</li>
      </ul>

      <h2>Sanctioned Commands</h2>
      <table class="cmd-table">
        <tr><td class="k">Warhammer 40k: Customize Theme</td><td class="d">Inject the Warhammer colour-rites into your settings.</td></tr>
        <tr><td class="k">Warhammer 40k: Summon the Servo-Skull</td><td class="d">Trigger an ambient transmission in the sidebar.</td></tr>
        <tr><td class="k">Warhammer 40k: Consult the Servo-Skull</td><td class="d">Request an immediate reading from 7-Theta.</td></tr>
        <tr><td class="k">Warhammer 40k: Toggle Servo-Skull Companion</td><td class="d">Silence or rouse the status-bar sentinel.</td></tr>
        <tr><td class="k">Warhammer 40k: Consult the Librarium</td><td class="d">Open the project knowledge graph for this workspace.</td></tr>
      </table>

      <div class="note">
        <b>On the matter of restraint:</b> the Servo-Skull observes intelligent
        cooldowns — rarity gates, per-event timers, and a global quiet-period —
        so it speaks with purpose and will <b>not</b> spam your cogitator.
        Silence is not malfunction. It is discipline.
      </div>

      <div class="footer">The Emperor Protects · Close this panel to begin</div>
    </div>
  </div>
</body>
</html>`;
}
