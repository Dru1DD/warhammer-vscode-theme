/**
 * Librarium panel — the extension-host half of the feature.
 *
 * Owns everything privileged: workspace access, parsing, graph construction,
 * git, and opening files. The webview owns rendering and nothing else; it never
 * touches the filesystem and only ever asks for data by message.
 *
 * Payload discipline: the initial message carries the workspace/directory/file
 * layer only. Entity nodes are streamed on demand, so a 5,000-file monorepo
 * sends a few hundred KB instead of tens of megabytes.
 */

import * as vscode from 'vscode';
import { getNonce } from '../util';
import { AnalysisCache } from './cache';
import { getRecentChanges } from './git';
import { buildGraph } from './graph';
import { buildTheme } from './theme';
import { renderLibrariumHtml } from './webviewHtml';
import { scanWorkspace } from './scan';
import { analyzerFor } from './analyzer/registry';
import { toPosix } from './resolve';
import { ids, type CodeEdge, type CodeNode, type LibrariumGraph } from './model';

const CACHE_FILE = 'librarium-cache.json';
const REBUILD_DEBOUNCE_MS = 800;

/** Node kinds held back from the first payload and streamed on demand. */
const ENTITY_KINDS = new Set(['class', 'function', 'interface', 'type', 'component', 'method']);

interface PendingFocus {
  filePath?: string;
}

export class LibrariumPanel {
  private static current: LibrariumPanel | undefined;
  static readonly viewType = 'warhammer.librarium';

  private readonly disposables: vscode.Disposable[] = [];
  private cache = new AnalysisCache();
  private graph?: LibrariumGraph;
  private building = false;
  private rebuildTimer?: NodeJS.Timeout;
  private watcher?: vscode.FileSystemWatcher;
  private webviewReady = false;
  private disposed = false;
  private pendingFocus: PendingFocus = {};

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext
  ) {
    this.panel.webview.html = renderLibrariumHtml(getNonce(), buildTheme());

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (msg) => void this.onMessage(msg),
      null,
      this.disposables
    );

    // The Librarium repaints itself when the user switches faction.
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => this.post({ command: 'theme', theme: buildTheme() })),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('workbench.colorTheme')) {
          this.post({ command: 'theme', theme: buildTheme() });
        }
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => this.postActiveFile(editor))
    );

    this.setupWatcher();
  }

  /** Opens (or reveals) the Librarium, optionally focused on a file. */
  static async show(
    context: vscode.ExtensionContext,
    focusPath?: string,
    forceRefresh = false
  ): Promise<LibrariumPanel> {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (LibrariumPanel.current) {
      const existing = LibrariumPanel.current;
      existing.panel.reveal(column);
      if (forceRefresh) await existing.rebuild(true);
      if (focusPath) existing.focusOn(focusPath);
      return existing;
    }

    const panel = vscode.window.createWebviewPanel(
      LibrariumPanel.viewType,
      'Librarium',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // The webview loads no local resources; everything is inlined under CSP.
        localResourceRoots: [],
      }
    );

    const instance = new LibrariumPanel(panel, context);
    LibrariumPanel.current = instance;
    context.subscriptions.push(instance);
    instance.pendingFocus.filePath = focusPath;
    await instance.loadPersistedCache();
    void instance.rebuild(false);
    return instance;
  }

  static get active(): LibrariumPanel | undefined {
    return LibrariumPanel.current;
  }

  /** Re-analyzes the workspace and pushes a fresh graph. */
  async refresh(): Promise<void> {
    await this.rebuild(true);
  }

  focusOn(filePath: string): void {
    const relPath = toPosix(filePath);
    if (!this.webviewReady) {
      this.pendingFocus.filePath = relPath;
      return;
    }
    this.post({ command: 'focusFile', filePath: relPath });
  }

  // ── analysis ────────────────────────────────────────────────────────────────

  private get maxFiles(): number {
    return vscode.workspace
      .getConfiguration('warhammer.librarium')
      .get<number>('maxFiles', 2500);
  }

  private async rebuild(clearCache: boolean): Promise<void> {
    if (this.building) return;
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.post({ command: 'empty', reason: 'no-workspace' });
      return;
    }

    this.building = true;
    if (clearCache) this.cache.clear();
    this.post({ command: 'analyzing' });

    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: 'Librarium: indexing knowledge records...',
        },
        (_progress, token) =>
          scanWorkspace({ folder, cache: this.cache, maxFiles: this.maxFiles, token })
      );

      if (!result.analyses.length) {
        this.post({ command: 'empty', reason: 'no-supported-files' });
        return;
      }

      this.graph = buildGraph({
        workspace: { name: folder.name, rootPath: folder.uri.fsPath },
        analyses: result.analyses,
        goModule: result.goModule,
        truncated: result.truncated,
      });

      const recentChanges = await getRecentChanges(folder.uri.fsPath);
      this.post({
        command: 'graph',
        graph: this.structuralSlice(this.graph),
        recentChanges,
        activeFile: this.activeRelPath(),
        focusFile: this.pendingFocus.filePath,
      });
      this.pendingFocus.filePath = undefined;
      void this.persistCache();
    } catch (err) {
      void vscode.window.showErrorMessage(`Librarium analysis failed: ${String(err)}`);
      this.post({ command: 'empty', reason: 'error' });
    } finally {
      this.building = false;
    }
  }

  /** Workspace/directory/file layer — entities are withheld until requested. */
  private structuralSlice(graph: LibrariumGraph): LibrariumGraph {
    const nodes = graph.nodes.filter((n) => !ENTITY_KINDS.has(n.type));
    const keep = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    return { ...graph, nodes, edges };
  }

  /** Entity nodes and their edges for a specific set of files. */
  private entitySlice(filePaths: string[]): { nodes: CodeNode[]; edges: CodeEdge[] } {
    if (!this.graph) return { nodes: [], edges: [] };
    const wanted = new Set(filePaths.map(toPosix));
    const nodes = this.graph.nodes.filter(
      (n) => ENTITY_KINDS.has(n.type) && wanted.has(n.filePath)
    );
    const nodeIds = new Set(nodes.map((n) => n.id));
    const fileIds = new Set([...wanted].map((p) => ids.file(p)));
    const edges = this.graph.edges.filter(
      (e) =>
        (nodeIds.has(e.source) && nodeIds.has(e.target)) ||
        (fileIds.has(e.source) && nodeIds.has(e.target) && e.type === 'contains')
    );
    return { nodes, edges };
  }

  // ── incremental invalidation ────────────────────────────────────────────────

  private setupWatcher(): void {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return;

    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,go}')
    );

    const onChange = (uri: vscode.Uri) => {
      const relPath = toPosix(vscode.workspace.asRelativePath(uri, false));
      if (relPath.includes('node_modules/') || !analyzerFor(relPath)) return;
      // Drop only the touched file: the rebuild then re-parses one file and
      // serves the rest from cache.
      this.cache.invalidate(relPath);
      this.scheduleRebuild();
    };

    this.watcher.onDidChange(onChange, null, this.disposables);
    this.watcher.onDidCreate(onChange, null, this.disposables);
    this.watcher.onDidDelete(onChange, null, this.disposables);
    this.disposables.push(this.watcher);
  }

  private scheduleRebuild(): void {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => void this.rebuild(false), REBUILD_DEBOUNCE_MS);
  }

  // ── persistence ─────────────────────────────────────────────────────────────

  private cacheUri(): vscode.Uri | undefined {
    const storage = this.context.storageUri;
    return storage ? vscode.Uri.joinPath(storage, CACHE_FILE) : undefined;
  }

  private async loadPersistedCache(): Promise<void> {
    const uri = this.cacheUri();
    if (!uri) return;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      this.cache = AnalysisCache.deserialize(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      this.cache = new AnalysisCache(); // absent or corrupt cache is not an error
    }
  }

  private async persistCache(): Promise<void> {
    const uri = this.cacheUri();
    if (!uri || !this.context.storageUri) return;
    try {
      await vscode.workspace.fs.createDirectory(this.context.storageUri);
      await vscode.workspace.fs.writeFile(
        uri,
        new TextEncoder().encode(JSON.stringify(this.cache.serialize()))
      );
    } catch {
      /* a cache that cannot be written just means a slower next open */
    }
  }

  // ── messaging ───────────────────────────────────────────────────────────────

  private post(message: unknown): void {
    void this.panel.webview.postMessage(message);
  }

  private activeRelPath(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') return undefined;
    return toPosix(vscode.workspace.asRelativePath(editor.document.uri, false));
  }

  private postActiveFile(editor: vscode.TextEditor | undefined): void {
    if (!editor) return;
    const relPath = this.activeRelPath();
    if (relPath) this.post({ command: 'activeFile', filePath: relPath });
  }

  private async onMessage(msg: {
    command: string;
    filePath?: string;
    line?: number;
    paths?: string[];
  }): Promise<void> {
    switch (msg.command) {
      case 'ready': {
        this.webviewReady = true;
        if (this.graph) {
          this.post({
            command: 'graph',
            graph: this.structuralSlice(this.graph),
            activeFile: this.activeRelPath(),
            focusFile: this.pendingFocus.filePath,
          });
          this.pendingFocus.filePath = undefined;
        }
        break;
      }

      case 'openSource': {
        if (!msg.filePath) break;
        await this.openSource(msg.filePath, msg.line);
        break;
      }

      case 'requestEntities': {
        const slice = this.entitySlice(msg.paths ?? []);
        this.post({ command: 'entities', ...slice, paths: msg.paths ?? [] });
        break;
      }

      case 'refresh':
        await this.rebuild(true);
        break;

      default:
        break;
    }
  }

  /** Navigation goes through the standard VS Code command, not a custom path. */
  private async openSource(filePath: string, line?: number): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return;
    const uri = vscode.Uri.joinPath(folder.uri, filePath);
    try {
      const target = Math.max(0, (line ?? 1) - 1);
      const selection = new vscode.Range(target, 0, target, 0);
      await vscode.commands.executeCommand('vscode.open', uri, {
        selection,
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
      });
    } catch (err) {
      void vscode.window.showWarningMessage(`Librarium could not open ${filePath}: ${String(err)}`);
    }
  }

  dispose(): void {
    // `panel.dispose()` re-enters through onDidDispose; guard so teardown and
    // the cache write happen exactly once.
    if (this.disposed) return;
    this.disposed = true;
    LibrariumPanel.current = undefined;
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    void this.persistCache();
    this.panel.dispose();
    for (const d of this.disposables.splice(0)) {
      try { d.dispose(); } catch { /* already gone */ }
    }
  }
}
