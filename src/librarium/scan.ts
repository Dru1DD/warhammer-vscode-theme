/**
 * Workspace scanning — the only part of the analysis pipeline that touches the
 * filesystem. Everything downstream is pure.
 *
 * Reads are cached per file by (mtime, size), so a rebuild after one edit
 * re-parses exactly one file and reuses the rest.
 */

import * as vscode from 'vscode';
import type { FileAnalysis } from './analyzer/types';
import { analyzerFor, supportedExtensions } from './analyzer/registry';
import { emptyAnalysis } from './analyzer/types';
import type { AnalysisCache } from './cache';
import { toPosix } from './resolve';

/** Directories that never carry first-party architecture. */
const EXCLUDED = [
  '**/node_modules/**', '**/.git/**', '**/out/**', '**/dist/**', '**/build/**',
  '**/vendor/**', '**/.next/**', '**/coverage/**', '**/*.min.js', '**/*.d.ts',
];

/** Beyond this a file is a bundle or generated blob, not architecture. */
const MAX_FILE_BYTES = 512 * 1024;

export interface ScanResult {
  analyses: FileAnalysis[];
  truncated: boolean;
  goModule?: string;
  /** Files scanned, before the cap was applied. */
  discovered: number;
}

export interface ScanOptions {
  folder: vscode.WorkspaceFolder;
  cache: AnalysisCache;
  maxFiles: number;
  token?: vscode.CancellationToken;
  onProgress?: (done: number, total: number) => void;
}

function globPattern(): string {
  const exts = supportedExtensions().map((e) => e.slice(1));
  return `**/*.{${exts.join(',')}}`;
}

/** Reads the module path out of go.mod, when there is one. */
async function readGoModule(folder: vscode.WorkspaceFolder): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(folder.uri, 'go.mod')
    );
    const match = /^\s*module\s+(\S+)/m.exec(new TextDecoder().decode(bytes));
    return match?.[1];
  } catch {
    return undefined; // no go.mod — not a Go module, which is fine
  }
}

export async function scanWorkspace(options: ScanOptions): Promise<ScanResult> {
  const { folder, cache, maxFiles, token } = options;

  const found = await vscode.workspace.findFiles(
    new vscode.RelativePattern(folder, globPattern()),
    `{${EXCLUDED.join(',')}}`,
    maxFiles + 1,
    token
  );

  const truncated = found.length > maxFiles;
  const uris = truncated ? found.slice(0, maxFiles) : found;
  const goModule = await readGoModule(folder);

  const analyses: FileAnalysis[] = [];
  let done = 0;

  for (const uri of uris) {
    if (token?.isCancellationRequested) break;
    const relPath = toPosix(vscode.workspace.asRelativePath(uri, false));
    analyses.push(await analyzeFile(uri, relPath, cache));
    done++;
    if (done % 50 === 0) options.onProgress?.(done, uris.length);
  }

  return { analyses, truncated, goModule, discovered: found.length };
}

/** Analyzes one file, going through the cache. Never throws. */
export async function analyzeFile(
  uri: vscode.Uri,
  relPath: string,
  cache: AnalysisCache
): Promise<FileAnalysis> {
  const analyzer = analyzerFor(relPath);
  if (!analyzer) return emptyAnalysis(relPath, 'unknown', 'unsupported file type');

  let stat: vscode.FileStat;
  try {
    stat = await vscode.workspace.fs.stat(uri);
  } catch (err) {
    return emptyAnalysis(relPath, analyzer.id, `stat failed: ${String(err)}`);
  }

  const cached = cache.get(relPath, stat.mtime, stat.size);
  if (cached) return cached;

  if (stat.size > MAX_FILE_BYTES) {
    const skipped = emptyAnalysis(relPath, analyzer.id, 'file too large; skipped');
    cache.set(relPath, stat.mtime, stat.size, skipped);
    return skipped;
  }

  let analysis: FileAnalysis;
  try {
    const text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
    analysis = analyzer.analyze(relPath, text);
  } catch (err) {
    // A malformed or unreadable file must never take the whole graph down.
    analysis = emptyAnalysis(relPath, analyzer.id, String(err));
  }

  cache.set(relPath, stat.mtime, stat.size, analysis);
  return analysis;
}
