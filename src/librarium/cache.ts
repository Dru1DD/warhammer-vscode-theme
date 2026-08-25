/**
 * Analysis cache.
 *
 * Keyed by (path, mtime, size) so an edited file is re-parsed and every other
 * file is served from memory. Persisted into the extension's workspace storage,
 * which makes a second `Consult the Librarium` on an unchanged repo effectively
 * instant.
 *
 * The cache is a pure-data structure with an injectable persistence backend, so
 * the eviction logic can be exercised without VS Code.
 */

import type { FileAnalysis } from './analyzer/types';

interface CacheEntry {
  mtime: number;
  size: number;
  analysis: FileAnalysis;
}

interface PersistedCache {
  version: number;
  entries: Record<string, CacheEntry>;
}

const CACHE_VERSION = 2;

export class AnalysisCache {
  private entries = new Map<string, CacheEntry>();

  get(path: string, mtime: number, size: number): FileAnalysis | undefined {
    const entry = this.entries.get(path);
    if (!entry) return undefined;
    // Any difference in mtime or size means the parse is stale.
    if (entry.mtime !== mtime || entry.size !== size) {
      this.entries.delete(path);
      return undefined;
    }
    return entry.analysis;
  }

  set(path: string, mtime: number, size: number, analysis: FileAnalysis): void {
    this.entries.set(path, { mtime, size, analysis });
  }

  /** Drops one file — call on change/delete so the next build re-reads it. */
  invalidate(path: string): void {
    this.entries.delete(path);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  serialize(): PersistedCache {
    return { version: CACHE_VERSION, entries: Object.fromEntries(this.entries) };
  }

  /** Loads a persisted cache; a version mismatch or junk payload starts empty. */
  static deserialize(raw: unknown): AnalysisCache {
    const cache = new AnalysisCache();
    const data = raw as PersistedCache | undefined;
    if (!data || data.version !== CACHE_VERSION || typeof data.entries !== 'object') {
      return cache;
    }
    for (const [path, entry] of Object.entries(data.entries)) {
      if (entry && typeof entry.mtime === 'number' && entry.analysis) {
        cache.entries.set(path, entry);
      }
    }
    return cache;
  }
}
