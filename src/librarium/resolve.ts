/**
 * Import-specifier resolution.
 *
 * Deliberately does not touch the filesystem: resolution is done against the
 * set of files the scanner already found. That makes it pure, testable, and
 * fast (a Set lookup instead of a stat per candidate).
 */

import * as path from 'path';

const TS_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const INDEX_BASENAMES = ['index'];

/** Normalizes to POSIX separators and strips any leading './'. */
export function toPosix(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Resolves a JS/TS import specifier to a workspace-relative file path.
 * Returns undefined for bare specifiers (packages) and unresolvable paths.
 */
export function resolveRelativeImport(
  fromPath: string,
  specifier: string,
  candidates: ReadonlySet<string>
): string | undefined {
  if (!specifier.startsWith('.')) return undefined;

  const base = toPosix(path.posix.join(path.posix.dirname(toPosix(fromPath)), specifier));
  // Paths may escape the workspace root via '../'; those are external.
  if (base.startsWith('..')) return undefined;

  if (candidates.has(base)) return base;

  // TS allows importing './x.js' while the file on disk is './x.ts'.
  const jsExt = TS_EXTS.find((e) => base.endsWith(e));
  if (jsExt) {
    const stem = base.slice(0, -jsExt.length);
    for (const ext of TS_EXTS) {
      if (candidates.has(stem + ext)) return stem + ext;
    }
  }

  for (const ext of TS_EXTS) {
    if (candidates.has(base + ext)) return base + ext;
  }
  for (const idx of INDEX_BASENAMES) {
    for (const ext of TS_EXTS) {
      const p = path.posix.join(base, idx + ext);
      if (candidates.has(p)) return p;
    }
  }
  return undefined;
}

/**
 * Resolves a Go import path to a workspace-relative directory.
 * Only imports inside the current module resolve; stdlib and third-party
 * packages return undefined and are surfaced as external packages instead.
 */
export function resolveGoImport(
  specifier: string,
  goModule: string | undefined,
  directories: ReadonlySet<string>
): string | undefined {
  if (!goModule) return undefined;
  if (specifier === goModule) return '';
  const prefix = goModule + '/';
  if (!specifier.startsWith(prefix)) return undefined;
  const rel = specifier.slice(prefix.length);
  return directories.has(rel) ? rel : undefined;
}
