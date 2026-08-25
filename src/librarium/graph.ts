/**
 * Graph construction.
 *
 * Takes the per-file analyses and folds them into one `LibrariumGraph`. Pure:
 * no fs, no `vscode`, no renderer types — the same input always yields the same
 * graph, which is what makes it testable and cacheable.
 */

import * as path from 'path';
import {
  edgeId,
  ids,
  type CodeEdge,
  type CodeEdgeType,
  type CodeNode,
  type CodeNodeType,
  type DependencyCycle,
  type DependencyHub,
  type LibrariumGraph,
  type WorkspaceRecord,
} from './model';
import type { EntityRecord, FileAnalysis } from './analyzer/types';
import { analyzerFor } from './analyzer/registry';
import { resolveGoImport, toPosix } from './resolve';

export interface BuildOptions {
  workspace: WorkspaceRecord;
  analyses: FileAnalysis[];
  /** Module path from go.mod, when the workspace is a Go module. */
  goModule?: string;
  truncated?: boolean;
}

/** Entity kinds that become graph nodes. Methods stay as node metadata. */
const ENTITY_NODE_KINDS: ReadonlySet<CodeNodeType> = new Set<CodeNodeType>([
  'class', 'function', 'interface', 'type', 'component',
]);

class GraphAccumulator {
  private readonly nodeMap = new Map<string, CodeNode>();
  private readonly edgeMap = new Map<string, CodeEdge>();

  addNode(node: CodeNode): CodeNode {
    // First writer wins; re-adding the same id is a no-op rather than a
    // duplicate, which is what keeps directory nodes single-instance.
    const existing = this.nodeMap.get(node.id);
    if (existing) return existing;
    this.nodeMap.set(node.id, node);
    return node;
  }

  addEdge(source: string, target: string, type: CodeEdgeType, metadata?: Record<string, unknown>): void {
    if (source === target && type !== 'imports') return; // self-links add nothing
    const id = edgeId(source, target, type);
    if (this.edgeMap.has(id)) return;
    if (!this.nodeMap.has(source) || !this.nodeMap.has(target)) return; // dangling
    this.edgeMap.set(id, { id, source, target, type, metadata });
  }

  hasNode(id: string): boolean { return this.nodeMap.has(id); }
  get nodes(): CodeNode[] { return [...this.nodeMap.values()]; }
  get edges(): CodeEdge[] { return [...this.edgeMap.values()]; }
}

/** Registers every ancestor directory of a file and the `contains` chain. */
function addDirectoryChain(acc: GraphAccumulator, relPath: string, workspaceId: string): string {
  const dir = path.posix.dirname(relPath);
  if (dir === '.' || dir === '') return workspaceId;

  const segments = dir.split('/');
  let parentId = workspaceId;
  let sofar = '';
  for (const segment of segments) {
    sofar = sofar ? `${sofar}/${segment}` : segment;
    const id = ids.directory(sofar);
    acc.addNode({
      id,
      type: 'directory',
      name: segment,
      filePath: sofar,
      metadata: { depth: sofar.split('/').length },
    });
    acc.addEdge(parentId, id, 'contains');
    parentId = id;
  }
  return parentId;
}

function entityNodesFor(
  acc: GraphAccumulator,
  analysis: FileAnalysis,
  fileId: string
): Map<string, CodeNode> {
  const byName = new Map<string, CodeNode>();
  for (const entity of analysis.entities) {
    if (!ENTITY_NODE_KINDS.has(entity.kind)) continue;
    const id = ids.entity(analysis.path, entity.name, entity.kind, entity.startLine);
    const node = acc.addNode({
      id,
      type: entity.kind,
      name: entity.name,
      filePath: analysis.path,
      startLine: entity.startLine,
      endLine: entity.endLine,
      metadata: {
        language: analysis.language,
        exported: entity.exported,
        members: (entity.members ?? []).map((m: EntityRecord) => ({
          name: m.name, startLine: m.startLine, endLine: m.endLine,
        })),
      },
    });
    acc.addEdge(fileId, id, 'contains');
    // Later declarations with the same name lose; a duplicate name in one file
    // is a rarity and the first is the better guess for resolution.
    if (!byName.has(entity.name)) byName.set(entity.name, node);
  }
  return byName;
}

/** Compact declaration outline carried on every file node. */
function outlineFor(analysis: FileAnalysis) {
  const OUTLINE_LIMIT = 300;
  return analysis.entities.slice(0, OUTLINE_LIMIT).map((entity) => ({
    name: entity.name,
    kind: entity.kind,
    startLine: entity.startLine,
    endLine: entity.endLine,
    exported: entity.exported,
    members: (entity.members ?? []).map((m) => ({
      name: m.name,
      startLine: m.startLine,
      endLine: m.endLine,
    })),
  }));
}

export function buildGraph(options: BuildOptions): LibrariumGraph {
  const { workspace, analyses, goModule } = options;
  const acc = new GraphAccumulator();

  const workspaceId = ids.workspace();
  acc.addNode({
    id: workspaceId,
    type: 'workspace',
    name: workspace.name,
    filePath: '',
    metadata: { rootPath: workspace.rootPath },
  });

  const filePaths = new Set(analyses.map((a) => toPosix(a.path)));
  const directories = new Set<string>();
  for (const p of filePaths) {
    const dir = path.posix.dirname(p);
    if (dir !== '.' && dir !== '') {
      const segments = dir.split('/');
      for (let i = 1; i <= segments.length; i++) directories.add(segments.slice(0, i).join('/'));
    }
  }

  // ── nodes: directories, files, entities ─────────────────────────────────────
  const entitiesByFile = new Map<string, Map<string, CodeNode>>();
  const languageCounts: Record<string, number> = {};

  for (const analysis of analyses) {
    const relPath = toPosix(analysis.path);
    const parentId = addDirectoryChain(acc, relPath, workspaceId);
    const fileId = ids.file(relPath);

    languageCounts[analysis.language] = (languageCounts[analysis.language] ?? 0) + 1;

    acc.addNode({
      id: fileId,
      type: 'file',
      name: path.posix.basename(relPath),
      filePath: relPath,
      metadata: {
        language: analysis.language,
        packageName: analysis.packageName,
        exports: analysis.exports,
        entityCount: analysis.entities.length,
        failed: !!analysis.error,
        // The file's own outline travels with the file node so clicking a file
        // shows its functions immediately, without a round-trip to the host.
        outline: outlineFor(analysis),
      },
    });
    acc.addEdge(parentId, fileId, 'contains');
    entitiesByFile.set(relPath, entityNodesFor(acc, analysis, fileId));
  }

  // ── edges: file imports ─────────────────────────────────────────────────────
  /** relPath -> (imported local name -> source file relPath) */
  const importBindings = new Map<string, Map<string, string>>();
  const externalPackages = new Map<string, string>();

  for (const analysis of analyses) {
    const relPath = toPosix(analysis.path);
    const fileId = ids.file(relPath);
    const analyzer = analyzerFor(relPath);
    const bindings = new Map<string, string>();

    for (const imp of analysis.imports) {
      let targetPath: string | undefined;

      if (analysis.language === 'go') {
        const dir = resolveGoImport(imp.specifier, goModule, directories);
        if (dir !== undefined) {
          // A Go import addresses a package (directory), so depend on every
          // file in it — that is what the compiler actually does.
          for (const candidate of filePaths) {
            if (candidate.endsWith('.go') && path.posix.dirname(candidate) === (dir || '.')) {
              acc.addEdge(fileId, ids.file(candidate), 'imports', { specifier: imp.specifier });
              bindings.set(imp.names[0] ?? path.posix.basename(dir || '.'), candidate);
            }
          }
          continue;
        }
      } else {
        targetPath = analyzer?.resolveImport?.(relPath, imp.specifier, filePaths);
      }

      if (targetPath) {
        acc.addEdge(fileId, ids.file(targetPath), 'imports', {
          specifier: imp.specifier,
          typeOnly: imp.typeOnly,
        });
        for (const name of imp.names) bindings.set(name, targetPath);
        continue;
      }

      // Unresolved and non-relative: an external package.
      if (!imp.specifier.startsWith('.')) {
        const root = imp.specifier.startsWith('@')
          ? imp.specifier.split('/').slice(0, 2).join('/')
          : imp.specifier.split('/')[0];
        const pkgId = `pkg:${root}`;
        if (!externalPackages.has(root)) {
          externalPackages.set(root, pkgId);
          acc.addNode({
            id: pkgId,
            type: 'package',
            name: root,
            filePath: '',
            metadata: { external: true },
          });
        }
        acc.addEdge(fileId, pkgId, 'dependsOn', { specifier: imp.specifier });
      }
    }
    importBindings.set(relPath, bindings);
  }

  // ── edges: entity-level calls, inheritance, renders ─────────────────────────
  for (const analysis of analyses) {
    const relPath = toPosix(analysis.path);
    const own = entitiesByFile.get(relPath) ?? new Map<string, CodeNode>();
    const bindings = importBindings.get(relPath) ?? new Map<string, string>();

    /** Resolves a bare name to an entity node: same file first, then imports. */
    const resolveName = (name: string): CodeNode | undefined => {
      const local = own.get(name);
      if (local) return local;
      const sourceFile = bindings.get(name);
      if (!sourceFile) return undefined;
      return entitiesByFile.get(sourceFile)?.get(name);
    };

    for (const entity of analysis.entities) {
      if (!ENTITY_NODE_KINDS.has(entity.kind)) continue;
      const sourceId = ids.entity(relPath, entity.name, entity.kind, entity.startLine);

      for (const callee of entity.calls) {
        const target = resolveName(callee);
        if (target && target.id !== sourceId) acc.addEdge(sourceId, target.id, 'calls');
      }
      if (entity.extendsName) {
        const target = resolveName(entity.extendsName);
        if (target) acc.addEdge(sourceId, target.id, 'extends');
      }
      for (const impl of entity.implementsNames ?? []) {
        const target = resolveName(impl);
        if (target) acc.addEdge(sourceId, target.id, 'implements');
      }
      for (const rendered of entity.renders ?? []) {
        const target = resolveName(rendered);
        if (target && target.id !== sourceId) acc.addEdge(sourceId, target.id, 'renders');
      }
    }
  }

  const nodes = acc.nodes;
  const edges = acc.edges;
  const nodeTypeCounts: Partial<Record<CodeNodeType, number>> = {};
  for (const node of nodes) {
    nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] ?? 0) + 1;
  }

  const importEdges = edges.filter((e) => e.type === 'imports');

  return {
    workspace,
    nodes,
    edges,
    metadata: {
      generatedAt: Date.now(),
      languageCounts,
      nodeTypeCounts,
      fileCount: filePaths.size,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      truncated: !!options.truncated,
      failedFiles: analyses.filter((a) => a.error).map((a) => toPosix(a.path)),
    },
    hubs: findHubs(nodes, importEdges),
    cycles: findCycles(importEdges),
  };
}

/** Files ranked by import degree — the de-facto architectural centres. */
export function findHubs(nodes: CodeNode[], importEdges: CodeEdge[], limit = 10): DependencyHub[] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of importEdges) {
    outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  return nodes
    .filter((n) => n.type === 'file')
    .map((n) => ({
      nodeId: n.id,
      name: n.name,
      filePath: n.filePath,
      incoming: incoming.get(n.id) ?? 0,
      outgoing: outgoing.get(n.id) ?? 0,
      degree: (incoming.get(n.id) ?? 0) + (outgoing.get(n.id) ?? 0),
    }))
    .filter((h) => h.degree > 0)
    .sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Circular imports, via Tarjan's strongly-connected components.
 *
 * Every SCC larger than one node contains at least one cycle; a simple ring is
 * then recovered from it with a depth-first walk so the UI can show an actual
 * a -> b -> c -> a path rather than an unordered blob.
 */
export function findCycles(importEdges: CodeEdge[]): DependencyCycle[] {
  const adjacency = new Map<string, string[]>();
  for (const edge of importEdges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
  }

  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  // Iterative Tarjan: a recursive one blows the stack on real monorepos.
  for (const root of adjacency.keys()) {
    if (index.has(root)) continue;
    const work: Array<{ node: string; edge: number }> = [{ node: root, edge: 0 }];

    while (work.length) {
      const frame = work[work.length - 1];
      const { node } = frame;

      if (frame.edge === 0) {
        index.set(node, counter);
        lowlink.set(node, counter);
        counter++;
        stack.push(node);
        onStack.add(node);
      }

      const neighbours = adjacency.get(node) ?? [];
      if (frame.edge < neighbours.length) {
        const next = neighbours[frame.edge++];
        if (!index.has(next)) {
          work.push({ node: next, edge: 0 });
        } else if (onStack.has(next)) {
          lowlink.set(node, Math.min(lowlink.get(node)!, index.get(next)!));
        }
        continue;
      }

      work.pop();
      if (work.length) {
        const parent = work[work.length - 1].node;
        lowlink.set(parent, Math.min(lowlink.get(parent)!, lowlink.get(node)!));
      }
      if (lowlink.get(node) === index.get(node)) {
        const component: string[] = [];
        let member: string;
        do {
          member = stack.pop()!;
          onStack.delete(member);
          component.push(member);
        } while (member !== node);
        if (component.length > 1) components.push(component);
      }
    }
  }

  // Self-import (a file importing itself) is a one-node cycle Tarjan skips.
  for (const edge of importEdges) {
    if (edge.source === edge.target) components.push([edge.source]);
  }

  return components
    .map((component) => ({ nodes: shortestRing(component, adjacency) }))
    .filter((c) => c.nodes.length > 0);
}

/** Recovers one concrete cycle path from a strongly-connected component. */
function shortestRing(component: string[], adjacency: Map<string, string[]>): string[] {
  const members = new Set(component);
  const start = component[component.length - 1];
  const parent = new Map<string, string>();
  const seen = new Set<string>([start]);
  const queue = [start];

  // Breadth-first from `start` back to `start` gives the shortest ring through
  // it, which is the most readable one to display.
  while (queue.length) {
    const node = queue.shift()!;
    for (const next of adjacency.get(node) ?? []) {
      if (!members.has(next)) continue;
      if (next === start) {
        const ring = [node];
        let cursor = node;
        while (parent.has(cursor)) {
          cursor = parent.get(cursor)!;
          ring.push(cursor);
        }
        return ring.reverse();
      }
      if (seen.has(next)) continue;
      seen.add(next);
      parent.set(next, node);
      queue.push(next);
    }
  }
  return component;
}
