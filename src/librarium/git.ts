/**
 * Recent changes, via git when it happens to be there.
 *
 * Strictly optional: no git, no repository, or a git that errors all degrade to
 * an empty list. The Librarium never requires version control.
 */

import { execFile } from 'child_process';
import { toPosix } from './resolve';

export interface RecentChange {
  path: string;
  /** Unix seconds of the commit that last touched the file. */
  timestamp: number;
}

const GIT_TIMEOUT_MS = 4000;

function run(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      { cwd, timeout: GIT_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => (err ? reject(err) : resolve(stdout))
    );
  });
}

/**
 * Most recently committed files, newest first. `limit` caps the returned list,
 * not the commits inspected.
 */
export async function getRecentChanges(
  rootPath: string,
  limit = 12
): Promise<RecentChange[]> {
  let stdout: string;
  try {
    stdout = await run(
      ['log', '-n', '60', '--name-only', '--no-merges', '--pretty=format:@%ct'],
      rootPath
    );
  } catch {
    return []; // no git, no repo, or a timeout — all equally non-fatal
  }

  const latest = new Map<string, number>();
  let timestamp = 0;
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('@')) {
      timestamp = Number(trimmed.slice(1)) || 0;
      continue;
    }
    const path = toPosix(trimmed);
    // First sighting wins: git log is already newest-first.
    if (!latest.has(path)) latest.set(path, timestamp);
  }

  return [...latest.entries()]
    .map(([path, ts]) => ({ path, timestamp: ts }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}
