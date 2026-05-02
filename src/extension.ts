import * as vscode from 'vscode';

const TRANSMISSIONS = [
  '"The flesh is weak. The code must be pure." — Servo-Skull 7-Theta',
  '"A logical sequence, brother. The Omnissiah approves." — Servo-Skull 7-Theta',
  '"Your functions are... adequate. Praise the Machine God." — Servo-Skull 7-Theta',
  '"This variable naming displeases the machine spirit. It endures." — Servo-Skull 7-Theta',
  '"In the Emperor\'s name, ship this feature." — Servo-Skull 7-Theta',
  '"Purity seal issued. Commit approved." — Servo-Skull 7-Theta',
  '"The logic engines hum contentedly. For now." — Servo-Skull 7-Theta',
  '"Another cycle complete. The Chapter\'s work is never finished." — Servo-Skull 7-Theta',
  '"Courage and honour, brother. Also, fix that TODO." — Servo-Skull 7-Theta',
  '"The warp takes many forms. Today it is a production bug." — Servo-Skull 7-Theta',
];

const STATUS_LABELS = [
  '$(circuit-board) Servo-Skull',
  '$(circuit-board) Logic Engines: Nominal',
  '$(circuit-board) Purity: Verified',
  '$(circuit-board) The Omnissiah Watches',
  '$(circuit-board) Machine Spirit: Active',
  '$(circuit-board) For the Emperor',
];

const SAVE_REACTIONS = [
  '"A Purity Seal has been issued for this file." — Servo-Skull 7-Theta',
  '"Saved to the sacred data-stacks." — Servo-Skull 7-Theta',
  '"The machine spirit stirs approvingly." — Servo-Skull 7-Theta',
  '"Data integrity: confirmed." — Servo-Skull 7-Theta',
];

function getConfig() {
  return vscode.workspace.getConfiguration('warhammer.companion');
}

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );
  statusBarItem.command = 'warhammer.toggleCompanion';

  let labelIndex = 0;
  let rotateTimer: NodeJS.Timeout | undefined;
  let transmissionTimer: NodeJS.Timeout | undefined;

  function isEnabled(): boolean {
    return getConfig().get<boolean>('enabled', true);
  }

  function refreshStatusBar() {
    if (!isEnabled()) {
      statusBarItem.hide();
      return;
    }
    statusBarItem.text = STATUS_LABELS[labelIndex % STATUS_LABELS.length];
    statusBarItem.tooltip = new vscode.MarkdownString(
      '**Warhammer 40k Theme** — Servo-Skull Companion\n\n' +
      '_Click to toggle. The skull observes._'
    );
    statusBarItem.show();
  }

  function startRotation() {
    if (rotateTimer) clearInterval(rotateTimer);
    rotateTimer = setInterval(() => {
      labelIndex = (labelIndex + 1) % STATUS_LABELS.length;
      refreshStatusBar();
    }, 5 * 60 * 1000);
  }

  function scheduleTransmission() {
    if (transmissionTimer) clearTimeout(transmissionTimer);
    const delay = (40 + Math.random() * 20) * 60 * 1000;
    transmissionTimer = setTimeout(() => {
      if (isEnabled() && getConfig().get<boolean>('notificationsEnabled', true)) {
        const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
        void vscode.window.showInformationMessage(msg);
      }
      scheduleTransmission();
    }, delay);
  }

  refreshStatusBar();
  startRotation();
  scheduleTransmission();

  const toggleCommand = vscode.commands.registerCommand(
    'warhammer.toggleCompanion',
    async () => {
      const current = isEnabled();
      await getConfig().update('enabled', !current, vscode.ConfigurationTarget.Global);
      refreshStatusBar();
      if (!current) {
        void vscode.window.showInformationMessage(
          '$(circuit-board) Servo-Skull activated. The machine spirit stirs.',
          { title: 'For the Emperor' }
        );
      } else {
        void vscode.window.showInformationMessage(
          'Servo-Skull dismissed. It drifts into the darkness...'
        );
      }
    }
  );

  const speakCommand = vscode.commands.registerCommand(
    'warhammer.companionSpeak',
    () => {
      const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
      void vscode.window.showInformationMessage(msg);
    }
  );

  const saveListener = vscode.workspace.onDidSaveTextDocument(() => {
    if (!isEnabled() || !getConfig().get<boolean>('saveReactions', true)) return;
    if (Math.random() < 0.08) {
      const msg = SAVE_REACTIONS[Math.floor(Math.random() * SAVE_REACTIONS.length)];
      void vscode.window.showInformationMessage(msg);
    }
  });

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('warhammer.companion')) {
      refreshStatusBar();
    }
  });

  context.subscriptions.push(
    statusBarItem,
    toggleCommand,
    speakCommand,
    saveListener,
    configListener,
    {
      dispose: () => {
        if (rotateTimer) clearInterval(rotateTimer);
        if (transmissionTimer) clearTimeout(transmissionTimer);
      },
    }
  );
}

export function deactivate() {}
