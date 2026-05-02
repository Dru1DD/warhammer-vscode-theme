import * as vscode from 'vscode';

export type Faction = 'bloodAngels' | 'deathwatch';
export type TriggerEvent =
  | 'taskSuccess'
  | 'taskFail'
  | 'gitCommit'
  | 'projectOpen'
  | 'longSession'
  | 'ambient';

const MESSAGES: Record<Faction, Record<TriggerEvent, string[]>> = {
  bloodAngels: {
    taskSuccess: [
      'Machine Spirit appeased.',
      'Honour in execution. The task is complete.',
      'Victory resides in discipline. Well done.',
      'The sacred engines hum with approval.',
      'Another trial overcome. The Emperor is pleased.',
    ],
    taskFail: [
      'Tech-Heresy detected. Purge and recommit.',
      'The machine spirit recoils. Investigate.',
      'Failure is information. Let it guide you.',
      'Even the mightiest fall. Rise and correct.',
      'This is not heresy. It is simply unfinished work.',
    ],
    gitCommit: [
      'The Codex records your actions.',
      'A purity seal has been applied.',
      'History belongs to those who commit.',
      'The sacred scroll is updated. The Chapter remembers.',
      'Inscribed in the annals. Proceed.',
    ],
    projectOpen: [
      'Litany of Awakening complete.',
      'The machine spirit stirs. Work begins.',
      'Systems nominal. The Emperor watches.',
      'Initialisation complete. For the Chapter.',
      'We return to the work. As it must be.',
    ],
    longSession: [
      'Even in death, code still serves.',
      'Your dedication honours the Chapter.',
      'Hours pass like seconds in His service.',
      'Rest when victory is secured.',
      'The work endures. As do you.',
    ],
    ambient: [
      'The Omnissiah observes.',
      'Faith is compiled in silence.',
      'Honour resides in discipline.',
      'Deploy only with conviction.',
      'Blessed is the clean architecture.',
      'Purge the unnecessary.',
      'Your tabs multiply like heresy.',
      'Refactor before the Inquisition arrives.',
      'A logical sequence, brother.',
      'The machine spirit is... watching.',
    ],
  },
  deathwatch: {
    taskSuccess: [
      'Target eliminated. Move to the next.',
      'Objective secured. Vigilance maintained.',
      'Tactical success confirmed.',
      'The kill-team reports mission complete.',
      'Threat neutralised. Stand ready.',
    ],
    taskFail: [
      'Tech-Heresy detected. Regroup and adapt.',
      'Mission parameters compromised. Reassess.',
      'The enemy is in the code. Find them.',
      'Abort. Purge. Recommit.',
      'Tactical setback. Not defeat. Never defeat.',
    ],
    gitCommit: [
      'The Codex records your actions.',
      'Intel logged. The Watch remembers.',
      'Tactical data archived.',
      'Mission report committed to record.',
      'Inscribed. The Watch does not forget.',
    ],
    projectOpen: [
      'Initiating kill-zone protocols.',
      'Watch Station active. Standing by.',
      'Auspex sweep complete. Area clear.',
      'The vigil begins.',
      'Threat assessment in progress.',
    ],
    longSession: [
      'Even in death, code still serves.',
      'Vigilance is the price of deployment.',
      'The Watch endures. As must you.',
      'Sustained engagement. Casualties: none.',
      'Endurance is a weapon. Use it.',
    ],
    ambient: [
      'The Watch endures.',
      'Vigilance is the price of deployment.',
      'Trust only what is proven in fire.',
      'Deploy only with conviction.',
      'Precision over speed. Always.',
      'The enemy hides in untested code.',
      'The xenos hides in every unchecked assumption.',
      'One shot. One solution.',
      'Silence is discipline.',
    ],
  },
};

const IDLE_MESSAGES: Record<Faction, string[]> = {
  bloodAngels: [
    'The machine spirit awaits.',
    'In vigil, we serve the Emperor.',
    'Blessed is the disciplined code.',
    'Silence is focus. Focus is victory.',
    'Standing by for your command.',
  ],
  deathwatch: [
    'Standing watch. Awaiting orders.',
    'The vigil continues.',
    'Patience is a tactical virtue.',
    'Eyes open. Weapons ready.',
    'No threats detected. For now.',
  ],
};

const STATUS_LINES: Record<Faction, string[]> = {
  bloodAngels: [
    'Logic Engines: Nominal',
    'Purity: Verified',
    'Machine Spirit: Active',
    'The Emperor Watches',
    'Sanctified & Ready',
  ],
  deathwatch: [
    'Auspex: Active',
    'Threat Level: Low',
    'Watch Station: Online',
    'Systems: Nominal',
    'Standing Vigil',
  ],
};

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const EVENT_PRIORITY: Record<TriggerEvent, number> = {
  taskFail: 3,
  taskSuccess: 2,
  gitCommit: 2,
  projectOpen: 2,
  longSession: 1,
  ambient: 0,
};

const EVENT_RARITY: Record<TriggerEvent, number> = {
  taskFail: 1.0,
  taskSuccess: 0.75,
  gitCommit: 0.55,
  projectOpen: 1.0,
  longSession: 1.0,
  ambient: 1.0,
};

const PER_EVENT_COOLDOWN_MS: Record<TriggerEvent, number> = {
  taskFail: 3 * 60_000,
  taskSuccess: 8 * 60_000,
  gitCommit: 10 * 60_000,
  projectOpen: 0,
  longSession: 0,
  ambient: 0,
};

const GLOBAL_COOLDOWN_MS = 75_000;
const MAX_QUEUE = 2;

export class MascotViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'warhammer.mascotView';

  private view?: vscode.WebviewView;
  private idleTimer?: NodeJS.Timeout;

  private isShowing = false;
  private queue: TriggerEvent[] = [];
  private lastShownAt = 0;
  private lastEventAt = new Map<TriggerEvent, number>();
  private pendingEvent: TriggerEvent | undefined;
  private pendingTransmission?: string;
  private queuedTransmission?: string;

  constructor(private readonly context: vscode.ExtensionContext) { }

  private getConfig() {
    return vscode.workspace.getConfiguration('warhammer.mascot');
  }

  isEnabled(): boolean {
    return this.getConfig().get<boolean>('enabled', true);
  }

  getFaction(): Faction {
    const setting = this.getConfig().get<string>('faction', 'auto');
    if (setting !== 'auto') return setting as Faction;
    const theme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '');
    return theme.toLowerCase().includes('deathwatch') ? 'deathwatch' : 'bloodAngels';
  }

  private getMessage(event: TriggerEvent): string {
    const pool = MESSAGES[this.getFaction()][event];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getIdleMessage(): string {
    const pool = IDLE_MESSAGES[this.getFaction()];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  show(event: TriggerEvent): void {
    if (!this.isEnabled()) return;

    if (Math.random() > EVENT_RARITY[event]) return;

    const lastEvent = this.lastEventAt.get(event) ?? 0;
    if (Date.now() - lastEvent < PER_EVENT_COOLDOWN_MS[event]) return;

    if (Date.now() - this.lastShownAt < GLOBAL_COOLDOWN_MS) {
      if (EVENT_PRIORITY[event] >= 2 && this.queue.length < MAX_QUEUE) {
        this.queue.push(event);
      }
      return;
    }

    if (this.isShowing) {
      if (EVENT_PRIORITY[event] >= 2 && this.queue.length < MAX_QUEUE) {
        this.queue.push(event);
      }
      return;
    }

    this.dispatch(event);
  }

  private dispatch(event: TriggerEvent): void {
    this.isShowing = true;
    this.lastShownAt = Date.now();
    this.lastEventAt.set(event, Date.now());

    if (!this.view) {
      this.pendingEvent = event;
      return;
    }

    this.triggerShow(event);
  }

  private triggerShow(event: TriggerEvent): void {
    if (!this.view) return;
    const message = this.getMessage(event);
    void this.view.webview.postMessage({ command: 'show', message, event });
    this.startIdleTimer();
  }

  showScheduledTransmission(text: string): void {
    if (!this.isEnabled()) return;
    if (!this.view) {
      this.pendingTransmission = text;
      return;
    }
    if (this.isShowing) {
      this.queuedTransmission = text;
      return;
    }
    this.triggerTransmission(text);
  }

  private triggerTransmission(text: string): void {
    if (!this.view) return;
    this.isShowing = true;
    this.lastShownAt = Date.now();
    void this.view.webview.postMessage({ command: 'transmission', message: text });
    this.startIdleTimer();
  }

  private startIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const duration = this.getConfig().get<number>('displayDuration', 8) * 1000;
    this.idleTimer = setTimeout(() => {
      void this.view?.webview.postMessage({
        command: 'idle',
        message: this.getIdleMessage(),
      });
      setTimeout(() => {
        this.isShowing = false;
        if (this.queuedTransmission) {
          const next = this.queuedTransmission;
          this.queuedTransmission = undefined;
          this.triggerTransmission(next);
        } else {
          this.drainQueue();
        }
      }, 400);
    }, duration);
  }

  private drainQueue(): void {
    if (!this.queue.length || !this.isEnabled()) return;
    const next = this.queue.shift()!;
    setTimeout(() => this.dispatch(next), 1_200);
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'images')],
    };

    const faction = this.getFaction();
    const mascotUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'images', 'mascot.png')
    );

    webviewView.webview.html = this.buildHtml(
      mascotUri.toString(),
      webviewView.webview.cspSource,
      faction
    );

    webviewView.onDidDispose(() => {
      this.view = undefined;
      if (this.idleTimer) clearTimeout(this.idleTimer);
    });

    setTimeout(() => {
      void this.view?.webview.postMessage({
        command: 'idle',
        message: this.getIdleMessage(),
      });
    }, 600);

    if (this.pendingEvent !== undefined) {
      const event = this.pendingEvent;
      this.pendingEvent = undefined;
      if (this.pendingTransmission) {
        this.queuedTransmission = this.pendingTransmission;
        this.pendingTransmission = undefined;
      }
      setTimeout(() => this.triggerShow(event), 800);
    } else if (this.pendingTransmission) {
      const line = this.pendingTransmission;
      this.pendingTransmission = undefined;
      setTimeout(() => this.triggerTransmission(line), 800);
    }
  }

  dispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.queue = [];
    this.pendingTransmission = undefined;
    this.queuedTransmission = undefined;
  }

  private buildHtml(
    mascotSrc: string,
    cspSource: string,
    faction: Faction
  ): string {
    const nonce = getNonce();

    const isBA = faction === 'bloodAngels';
    const accent = isBA ? '#c41e3a' : '#4a6080';
    const accentDim = isBA ? '#8b0000' : '#2c3e50';
    const gold = isBA ? '#c9a84c' : '#718096';
    const goldDim = isBA ? '#7a6530' : '#4a5568';
    const glowRgb = isBA ? '196,30,58' : '74,96,128';
    const bgBase = isBA ? '#0d0809' : '#080a0d';
    const bgTint = isBA ? '#120608' : '#090c10';
    const factionTag = isBA ? 'BLOOD ANGELS' : 'DEATHWATCH';
    const statusPool = STATUS_LINES[faction];
    const initStatus = statusPool[Math.floor(Math.random() * statusPool.length)];

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --accent:    ${accent};
    --accentDim: ${accentDim};
    --gold:      ${gold};
    --goldDim:   ${goldDim};
    --glow:      rgba(${glowRgb}, 0.35);
    --glowSoft:  rgba(${glowRgb}, 0.18);
    --bg:        ${bgBase};
    --bgTint:    ${bgTint};
    --text:      #e8d5b0;
    --textDim:   #9a8878;
  }

  html, body {
    width: 100%; height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
    user-select: none;
    background: var(--bg);
    color: var(--text);
  }

  /* ── Background ── */
  .bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      repeating-linear-gradient(
        -55deg,
        transparent 0px,
        transparent 18px,
        rgba(${glowRgb}, 0.025) 18px,
        rgba(${glowRgb}, 0.025) 19px
      ),
      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 3px,
        rgba(255,255,255,0.008) 3px,
        rgba(255,255,255,0.008) 4px
      ),
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${glowRgb}, 0.22) 0%, transparent 100%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(${glowRgb}, 0.08) 0%, transparent 100%),
      linear-gradient(180deg, var(--bgTint) 0%, var(--bg) 40%);
  }

  /* ── Corner ornaments ── */
  .corner {
    position: fixed; z-index: 1;
    width: 22px; height: 22px;
    border-color: ${gold}55;
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .corner::after {
    content: '';
    position: absolute;
    background: ${gold};
    opacity: 0.5;
  }
  .tl { top: 8px; left: 8px; border-top-width: 1px; border-left-width: 1px; }
  .tr { top: 8px; right: 8px; border-top-width: 1px; border-right-width: 1px; }
  .bl { bottom: 8px; left: 8px; border-bottom-width: 1px; border-left-width: 1px; }
  .br { bottom: 8px; right: 8px; border-bottom-width: 1px; border-right-width: 1px; }

  .tl::after { width: 3px; height: 3px; top: -2px; left: -2px; }
  .tr::after { width: 3px; height: 3px; top: -2px; right: -2px; }
  .bl::after { width: 3px; height: 3px; bottom: -2px; left: -2px; }
  .br::after { width: 3px; height: 3px; bottom: -2px; right: -2px; }

  .container {
    position: relative; z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 14px 18px;
    gap: 12px;
    min-height: 150%;
    max-height: 50%;
  }

  .faction-tag {
    font-size: 8px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.55;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 50%;
    justify-content: center;
  }
  .faction-tag::before,
  .faction-tag::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${gold}40);
  }
  .faction-tag::after {
    background: linear-gradient(90deg, ${gold}40, transparent);
  }

  .mascot-wrap {
    position: relative;
    width: 130px; height: 130px;
    display: flex; align-items: center; justify-content: center;
  }

  .mascot-wrap::before {
    content: '';
    position: absolute; inset: -6px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--glowSoft) 0%, transparent 68%);
    opacity: 0.85;
  }


  .mascot-wrap::after {
    content: '';
    position: absolute; inset: 4px;
    border-radius: 50%;
    border: 1px solid ${accent}35;
    opacity: 0.9;
  }

  .mascot-img {
    width: 110px; height: 110px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px rgba(${glowRgb}, 0.7))
            drop-shadow(0 4px 12px rgba(0,0,0,0.8));
    mix-blend-mode: screen;
    position: relative; z-index: 1;
  }

  .skull-title {
    text-align: center;
    line-height: 1.3;
  }
  .skull-title .name {
    font-size: 13px;
    letter-spacing: 0.12em;
    color: var(--text);
    font-weight: normal;
    text-shadow: 0 0 12px rgba(${glowRgb}, 0.6);
  }
  .skull-title .designation {
    display: block;
    font-size: 8.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.6;
    margin-top: 2px;
  }


  .divider {
    width: 85%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${accent}70 30%, ${gold}60 50%, ${accent}70 70%, transparent 100%);
    position: relative;
  }
  .divider::before {
    content: '✦';
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    font-size: 7px;
    color: ${gold};
    background: var(--bg);
    padding: 0 4px;
    opacity: 0.7;
  }


  .scroll {
    width: 100%;
    background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 100%);
    border: 1px solid ${accent}28;
    border-radius: 4px;
    padding: 13px 12px 10px;
    position: relative;
    overflow: hidden;
  }


  .scroll::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 5%, ${accent}55 50%, transparent 95%);
  }

  .scroll::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 20%, ${goldDim}40 50%, transparent 80%);
  }

  .scroll-text {
    color: var(--text);
    font-size: 11.5px;
    font-style: italic;
    line-height: 1.65;
    text-align: center;
    letter-spacing: 0.02em;
    min-height: 46px;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.18s ease;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  }

  .scroll-text.fading {
    opacity: 0;
  }

  .sig {
    margin-top: 8px;
    font-size: 8.5px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.45;
    text-align: right;
    transition: opacity 0.18s ease;
  }

  .sig.fading { opacity: 0; }

  .status-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 2px;
  }

  .status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: ${accent};
    box-shadow: 0 0 4px rgba(${glowRgb}, 0.5);
    flex-shrink: 0;
    opacity: 0.9;
  }

  .status-text {
    font-size: 8.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.4;
  }

  .event-badge {
    font-size: 7.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 2px;
    background: ${accent}25;
    border: 1px solid ${accent}40;
    color: ${accent};
    opacity: 0;
    transition: opacity 0.3s ease;
    text-align: center;
  }
  .event-badge.visible { opacity: 1; }

  .event-badge.transmission {
    background: ${gold}18;
    border-color: ${gold}35;
    color: var(--gold);
  }
</style>
</head>
<body>

<div class="bg"></div>
<div class="corner tl"></div>
<div class="corner tr"></div>
<div class="corner bl"></div>
<div class="corner br"></div>

<div class="container">

  <div class="faction-tag">${factionTag}</div>

  <div class="mascot-wrap">
    <img class="mascot-img" src="${mascotSrc}" alt="Servo-Skull">
  </div>

  <div class="skull-title">
    <span class="name">Servo-Skull 7-Theta</span>
    <span class="designation">Mechanicus Familiar</span>
  </div>

  <div class="divider"></div>

  <div id="eventBadge" class="event-badge"></div>

  <div class="scroll">
    <div class="scroll-text" id="scrollText"></div>
    <div class="sig" id="sig">— Standing by</div>
  </div>

  <div class="status-row">
    <div class="status-dot"></div>
    <span class="status-text" id="statusText">${initStatus}</span>
  </div>

</div>

<script nonce="${nonce}">
  const scrollText = document.getElementById('scrollText');
  const sig        = document.getElementById('sig');
  const badge      = document.getElementById('eventBadge');
  const statusEl   = document.getElementById('statusText');

  const STATUS_LINES = ${JSON.stringify(statusPool)};
  const EVENT_LABELS = {
    taskSuccess: 'Mission Complete',
    taskFail:    'Anomaly Detected',
    gitCommit:   'Codex Updated',
    projectOpen: 'System Online',
    longSession: 'Extended Vigil',
    ambient:     'Transmission',
  };

  function setMessage(text, sigText, eventKey) {
    scrollText.classList.add('fading');
    sig.classList.add('fading');
    badge.classList.remove('visible', 'transmission');

    setTimeout(() => {
      scrollText.textContent = '“' + text + '”';
      sig.textContent = sigText || '— Servo-Skull 7-Theta';
      scrollText.classList.remove('fading');
      sig.classList.remove('fading');
    }, 180);

    if (eventKey && EVENT_LABELS[eventKey]) {
      badge.textContent = EVENT_LABELS[eventKey];
      badge.classList.add('visible');
      setTimeout(() => badge.classList.remove('visible'), 4500);
    }

    const next = STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)];
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = next;
      statusEl.style.opacity = '';
    }, 180);
  }

  function setMessageVerbatim(body, sigText) {
    scrollText.classList.add('fading');
    sig.classList.add('fading');

    setTimeout(() => {
      scrollText.textContent = body;
      sig.textContent = sigText || '— Vox';
      scrollText.classList.remove('fading');
      sig.classList.remove('fading');
    }, 180);

    badge.textContent = 'Vox Transmission';
    badge.classList.add('visible', 'transmission');
    setTimeout(() => {
      badge.classList.remove('visible', 'transmission');
    }, 4500);

    const next = STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)];
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = next;
      statusEl.style.opacity = '';
    }, 180);
  }

  window.addEventListener('message', ({ data }) => {
    switch (data.command) {
      case 'show':
        setMessage(data.message, '— Servo-Skull 7-Theta', data.event);
        break;
      case 'idle':
        setMessage(data.message, '— Standing by', null);
        break;
      case 'transmission':
        setMessageVerbatim(data.message, '— Servo-Skull 7-Theta');
        break;
    }
  });
</script>
</body>
</html>`;
  }
}
