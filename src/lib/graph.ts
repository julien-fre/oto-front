// The domain-agnostic slice of the graph — the shape graph-canvas.tsx (the
// Obsidian-style force-directed renderer) actually needs, and the pure
// traversal helpers it calls. Everything domain-specific (node kinds, color
// dimensions, edge semantics, how a graph is built from a data source) lives
// in the domain's own module (knowledge-graph.ts, processes-graph.ts) — those
// modules keep their own richer, narrowly-typed GraphNode/GraphEdge, which is
// freely assignable into these wider types wherever a value flows into
// GraphCanvas (a docs node's `kind: NodeKind` is a valid `kind: string`).
//
// kind/freshness are deliberately typed as plain `string` here rather than a
// shared union: the two domains that exist so far (docs, processes+connectors)
// have disjoint kind vocabularies, and a wider index signature these callers
// need to narrow-cast against would give up more type safety than it buys.

export type NodeShape = "circle" | "square" | "ring";

export type GraphNode = {
  id: string;
  kind: string;
  label: string;
  href: string | null;
  /** Incoming + outgoing, counting a mutual pair twice, the way Obsidian does. */
  degree: number;
  branchId?: number;
  freshness?: string;
  excerpt?: string;
  /** Hops from the center node. Only set by a domain's localGraph(), if it has one. */
  ring?: number;
  /** Carries node *type*, so color stays free to encode a second dimension. */
  shape?: NodeShape;
};

export type GraphEdge = { source: string; target: string; kind: string };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Both directions, deduped — used for hover highlighting and keyboard cycling. */
export function neighborsOf(id: string, graph: Graph): GraphNode[] {
  const ids = new Set<string>();
  for (const e of graph.edges) {
    if (e.source === id) ids.add(e.target);
    else if (e.target === id) ids.add(e.source);
  }
  return graph.nodes.filter((n) => ids.has(n.id));
}

/** Human-readable summary for the graph's accessible name and live region. */
export function describeNode(node: GraphNode, neighbors: GraphNode[]): string {
  const names = neighbors.map((n) => n.label);
  const count = names.length;
  if (count === 0) return `${node.label}. No links.`;
  return `${node.label}. ${count} link${count === 1 ? "" : "s"}: ${names.join(", ")}.`;
}

/**
 * Node weight. The global graph sizes by link count; a local graph (one with
 * `ring` set) sizes by distance from the center, so the focal node is
 * unmistakably the biggest thing on screen.
 */
export function nodeWeight(node: GraphNode, depth?: number): number {
  if (node.ring === undefined || !depth) return node.degree;
  return 30 - (30 / depth) * node.ring;
}
