/**
 * Librarium — language-agnostic graph model.
 *
 * Nothing in this file knows about TypeScript, Go, VS Code, or the renderer.
 * Analyzers produce these shapes; the webview consumes them. Keep it
 * serializable: the whole graph round-trips through `JSON.stringify` for both
 * the cache and `postMessage`.
 */

export type CodeNodeType =
  | 'workspace'
  | 'directory'
  | 'file'
  | 'module'
  | 'class'
  | 'function'
  | 'method'
  | 'interface'
  | 'type'
  | 'component'
  | 'variable'
  | 'package';

export type CodeEdgeType =
  | 'imports'
  | 'exports'
  | 'calls'
  | 'extends'
  | 'implements'
  | 'contains'
  | 'references'
  | 'renders'
  | 'dependsOn';

export interface CodeNode {
  id: string;
  type: CodeNodeType;
  name: string;
  /** Workspace-relative, POSIX-separated. Empty for the workspace root node. */
  filePath: string;
  startLine?: number;
  endLine?: number;
  metadata?: Record<string, unknown>;
}

export interface CodeEdge {
  id: string;
  source: string;
  target: string;
  type: CodeEdgeType;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceRecord {
  name: string;
  /** Absolute fs path of the workspace root. */
  rootPath: string;
}

export interface GraphMetadata {
  generatedAt: number;
  languageCounts: Record<string, number>;
  nodeTypeCounts: Partial<Record<CodeNodeType, number>>;
  fileCount: number;
  nodeCount: number;
  edgeCount: number;
  /** True when the scan hit the file cap and the graph is partial. */
  truncated: boolean;
  /** Files that failed to parse. Never fatal. */
  failedFiles: string[];
}

export interface DependencyHub {
  nodeId: string;
  name: string;
  filePath: string;
  incoming: number;
  outgoing: number;
  degree: number;
}

/** One circular dependency, as a closed ring of file node ids. */
export interface DependencyCycle {
  /** Node ids, in traversal order. The ring closes back onto `nodes[0]`. */
  nodes: string[];
}

export interface LibrariumGraph {
  workspace: WorkspaceRecord;
  nodes: CodeNode[];
  edges: CodeEdge[];
  metadata: GraphMetadata;
  hubs: DependencyHub[];
  cycles: DependencyCycle[];
}

/** Node id helpers — stable, collision-free, and cheap to recompute. */
export const ids = {
  workspace: () => 'ws',
  directory: (relPath: string) => `dir:${relPath}`,
  file: (relPath: string) => `file:${relPath}`,
  /** Entities are scoped by file so two `handler()`s never collide. */
  entity: (relPath: string, name: string, kind: CodeNodeType, line: number) =>
    `ent:${relPath}#${kind}:${name}:${line}`,
};

export function edgeId(source: string, target: string, type: CodeEdgeType): string {
  return `${type}|${source}|${target}`;
}
