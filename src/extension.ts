import * as vscode from 'vscode';
import { MascotViewProvider } from './mascot';

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
  '"Refactor not from weakness, but from strength of purpose." — Servo-Skull 7-Theta',
  '"A test that passes is a seal of purity. A test that fails is a heresy to be purged." — Servo-Skull 7-Theta',
  '"Even the smallest commit is recorded in the annals of the Omnissiah." — Servo-Skull 7-Theta',
  '"The Astronomican guides the lost. Your documentation guides your successors." — Servo-Skull 7-Theta',
  '"Technical debt is the corruption of the machine spirit. Address it." — Servo-Skull 7-Theta',
  '"Compliance is not optional. Neither are code reviews." — Servo-Skull 7-Theta',
  '"That which can be automated shall be automated. So it is written." — Servo-Skull 7-Theta',
  '"Your dependencies age. Update them, or face the consequences of entropy." — Servo-Skull 7-Theta',
  '"A warrior who does not know the battlefield is already defeated. Read the codebase." — Servo-Skull 7-Theta',
  '"The Greater Good is served by well-typed interfaces." — Servo-Skull 7-Theta',
  '"Silence is not agreement. Write the comment." — Servo-Skull 7-Theta',
  '"The Eldar see all possible futures. You need only handle the three likely ones." — Servo-Skull 7-Theta',
  '"That error message was prophesied ten thousand cycles ago." — Servo-Skull 7-Theta',
  '"Not every branch needs a name. Some are better left unmerged." — Servo-Skull 7-Theta',
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

function getCompanionConfig() {
  return vscode.workspace.getConfiguration('warhammer.companion');
}

function getMascotConfig() {
  return vscode.workspace.getConfiguration('warhammer.mascot');
}

export function activate(context: vscode.ExtensionContext) {

  // ── Status-bar companion (existing) ────────────────────────────────────────

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );
  statusBarItem.command = 'warhammer.toggleCompanion';

  let labelIndex = 0;
  let rotateTimer: NodeJS.Timeout | undefined;
  let transmissionTimer: NodeJS.Timeout | undefined;

  const mascot = new MascotViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MascotViewProvider.viewId, mascot, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  function isCompanionEnabled(): boolean {
    return getCompanionConfig().get<boolean>('enabled', true);
  }

  function refreshStatusBar() {
    if (!isCompanionEnabled()) { statusBarItem.hide(); return; }
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
      if (isCompanionEnabled() && getCompanionConfig().get<boolean>('notificationsEnabled', true)) {
        const msg = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
        mascot.showScheduledTransmission(msg);
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
      const current = isCompanionEnabled();
      await getCompanionConfig().update('enabled', !current, vscode.ConfigurationTarget.Global);
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
      mascot.showScheduledTransmission(msg);
      void vscode.window.showInformationMessage(msg);
    }
  );

  const saveListener = vscode.workspace.onDidSaveTextDocument(() => {
    if (!isCompanionEnabled() || !getCompanionConfig().get<boolean>('saveReactions', true)) return;
    if (Math.random() < 0.08) {
      const msg = SAVE_REACTIONS[Math.floor(Math.random() * SAVE_REACTIONS.length)];
      void vscode.window.showInformationMessage(msg);
    }
  });

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('warhammer.companion')) refreshStatusBar();
  });

  const projectOpenTimer = setTimeout(() => mascot.show('projectOpen'), 3500);

  const taskListener = vscode.tasks.onDidEndTaskProcess((e) => {
    if (e.exitCode === 0) {
      mascot.show('taskSuccess');
    } else if (e.exitCode !== undefined) {
      mascot.show('taskFail');
    }
  });

  let gitWatcher: vscode.FileSystemWatcher | undefined;

  function setupGitWatcher() {
    gitWatcher?.dispose();
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) return;
    const pattern = new vscode.RelativePattern(folders[0], '.git/COMMIT_EDITMSG');
    gitWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    gitWatcher.onDidChange(() => mascot.show('gitCommit'));
    gitWatcher.onDidCreate(() => mascot.show('gitCommit'));
  }
  setupGitWatcher();

  const workspaceFoldersListener = vscode.workspace.onDidChangeWorkspaceFolders(setupGitWatcher);

  let firstEditTime: number | undefined;
  let longSessionShown = false;

  const editTracker = vscode.workspace.onDidChangeTextDocument(() => {
    if (!firstEditTime) firstEditTime = Date.now();
    if (longSessionShown) return;
    const thresholdMs = getMascotConfig().get<number>('longSessionThreshold', 2) * 60 * 60 * 1000;
    if (Date.now() - firstEditTime >= thresholdMs) {
      longSessionShown = true;
      mascot.show('longSession');
    }
  });

  function scheduleAmbientMascot() {
    const freq = getMascotConfig().get<string>('ambientFrequency', 'rare');
    if (freq === 'off') return;
    const [minM, maxM] = freq === 'occasional' ? [45, 75] : [90, 130];
    const delayMs = (minM + Math.random() * (maxM - minM)) * 60 * 1000;
    setTimeout(() => {
      const hour = new Date().getHours();
      const isLateNight = hour >= 0 && hour < 5;
      mascot.show(isLateNight ? 'lateNight' : 'ambient');
      scheduleAmbientMascot();
    }, delayMs);
  }
  scheduleAmbientMascot();

  const summonCommand = vscode.commands.registerCommand(
    'warhammer.summonMascot',
    () => mascot.show('ambient')
  );

  // ── Subscriptions ───────────────────────────────────────────────────────────

  context.subscriptions.push(
    statusBarItem,
    toggleCommand,
    speakCommand,
    saveListener,
    configListener,
    taskListener,
    workspaceFoldersListener,
    editTracker,
    summonCommand,
    {
      dispose: () => {
        clearTimeout(projectOpenTimer);
        if (rotateTimer) clearInterval(rotateTimer);
        if (transmissionTimer) clearTimeout(transmissionTimer);
        gitWatcher?.dispose();
        mascot.dispose();
      },
    }
  );
}

export function deactivate() { }
