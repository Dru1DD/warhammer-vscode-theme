/**
 * The contract every language analyzer implements.
 *
 * Analyzers are pure: `(relative path, source text) -> FileAnalysis`. No fs, no
 * `vscode`, no network. That keeps them unit-testable under plain node and lets
 * the host decide about caching, threading and file discovery.
 */

import type { CodeNodeType } from '../model';

export interface ImportRecord {
  /** Raw specifier as written: './stripe', 'react', 'github.com/x/y'. */
  specifier: string;
  /** Bound local names. `default` and `*` are recorded as-is. */
  names: string[];
  /** Type-only imports carry no runtime dependency. */
  typeOnly: boolean;
  line: number;
}

/** A class/function/interface/... found in a file. */
export interface EntityRecord {
  name: string;
  kind: CodeNodeType;
  startLine: number;
  endLine: number;
  exported: boolean;
  /** Superclass / embedded type name, if any. */
  extendsName?: string;
  implementsNames?: string[];
  /** Identifier names invoked inside the body. Deduped, unresolved. */
  calls: string[];
  /** JSX element names rendered in the body (React components). */
  renders?: string[];
  /** Methods of a class / struct. */
  members?: EntityRecord[];
}

export interface FileAnalysis {
  /** Workspace-relative, POSIX separators. */
  path: string;
  language: string;
  imports: ImportRecord[];
  /** Exported symbol names (plus 'default' when a default export exists). */
  exports: string[];
  entities: EntityRecord[];
  /** Go package name; undefined for languages without one. */
  packageName?: string;
  /** Set when parsing failed; the analysis is then empty but well-formed. */
  error?: string;
}

export interface LanguageAnalyzer {
  /** Stable id, also used as the language label in metrics. */
  id: string;
  /** Lowercase extensions including the dot. */
  extensions: string[];
  analyze(path: string, text: string): FileAnalysis;
  /**
   * Resolves an import specifier to a workspace-relative path.
   * `candidates` is the set of known file paths; returns undefined for
   * externals (node_modules, stdlib) so they can be treated as packages.
   */
  resolveImport?(fromPath: string, specifier: string, candidates: ReadonlySet<string>): string | undefined;
}

export function emptyAnalysis(path: string, language: string, error?: string): FileAnalysis {
  return { path, language, imports: [], exports: [], entities: [], error };
}
