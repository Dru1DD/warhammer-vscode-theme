/**
 * Language registry — the single place that maps a file extension to an
 * analyzer. Adding a language means writing one analyzer and appending it here;
 * nothing else in the Librarium needs to change.
 */

import type { LanguageAnalyzer } from './types';
import { javaScriptAnalyzer, typeScriptAnalyzer } from './typescript';
import { goAnalyzer } from './go';

export const ANALYZERS: LanguageAnalyzer[] = [
  typeScriptAnalyzer,
  javaScriptAnalyzer,
  goAnalyzer,
];

const BY_EXT = new Map<string, LanguageAnalyzer>();
for (const analyzer of ANALYZERS) {
  for (const ext of analyzer.extensions) BY_EXT.set(ext, analyzer);
}

export function analyzerFor(filePath: string): LanguageAnalyzer | undefined {
  const dot = filePath.lastIndexOf('.');
  if (dot === -1) return undefined;
  return BY_EXT.get(filePath.slice(dot).toLowerCase());
}

/** Every supported extension, for the workspace scanner's glob. */
export function supportedExtensions(): string[] {
  return [...BY_EXT.keys()];
}
