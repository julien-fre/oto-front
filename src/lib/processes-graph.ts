// Turns live processes into a node/edge graph — processes linked to the
// connectors they use. Pure: no fetching, no randomness. Mirrors
// knowledge-graph.ts's shape file-for-file; this domain has no doc-tree
// ancestry or freshness concept, so it only ever offers what's real: a
// process/connector type split, no "branch"/"freshness" color dimension.
//
// This models what the knowledge graph modeled before it went live (node
// kinds doc | process | connector, edge kinds reads | uses — see git history
// on knowledge-graph.ts, commit d3a58bf) — processes are live now, and a
// process's connector usage is already derived for the process detail page's
// aside (processes-api.ts's detectTools → mock-data.ts's
// orderedConnectorsForProcess), reused here unchanged.

import type { NodeShape } from "./graph";
import { orderedConnectorsForProcess, type Connector } from "./mock-data";
import type { RealProcess } from "./processes-api";

export type NodeKind = "process" | "connector";
export type EdgeKind = "uses";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  href: string | null;
  /** Incoming + outgoing, counting a mutual pair twice, the way Obsidian does. */
  degree: number;
  excerpt?: string;
  /** Process only. */
  version?: number;
  /** Connector only — e.g. "Prospection", "Data FR". */
  category?: string;
  shape?: NodeShape;
};

export type GraphEdge = { source: string; target: string; kind: EdgeKind };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export const EDGE_LABELS: Record<EdgeKind, string> = {
  uses: "uses",
};

export const processNodeId = (slug: string) => `process:${slug}`;
export const connectorNodeId = (id: string) => `connector:${id}`;

// ── Color ────────────────────────────────────────────────────────────────────
// Same "shape carries type, color is free" split as knowledge-graph.ts. Flat
// per-kind colors (not per-node identity colors like the sidebar's dots) —
// the point of "Color by: Type" is exactly two colors on screen, matching the
// two-entry legend below.

export type ColorBy = "type" | "none";

export const COLOR_BY_LABELS: Record<ColorBy, string> = {
  type: "Type",
  none: "None",
};

const NEUTRAL = "#8b8d98"; // gray-9
const TYPE_COLORS: Record<NodeKind, string> = {
  process: "#0d9488", // teal — matches this codebase's pre-live graph
  connector: "#8b8d98", // gray-9 — ditto
};

const SHAPE_BY_KIND: Record<NodeKind, NodeShape> = {
  process: "circle",
  connector: "ring",
};

export function nodeColor(node: GraphNode, colorBy: ColorBy): string {
  switch (colorBy) {
    case "none":
      return NEUTRAL;
    case "type":
      return TYPE_COLORS[node.kind];
  }
}

/** Legend entries for a dimension, so the graph never speaks in color alone. */
export function colorLegend(colorBy: ColorBy): { label: string; color: string }[] {
  switch (colorBy) {
    case "none":
      return [];
    case "type":
      return [
        { label: "Process", color: TYPE_COLORS.process },
        { label: "Connector", color: TYPE_COLORS.connector },
      ];
  }
}

// ── Building ─────────────────────────────────────────────────────────────────

export type GraphFilters = {
  query: string;
  showProcesses: boolean;
  showConnectors: boolean;
  showOrphans: boolean;
};

export const DEFAULT_FILTERS: GraphFilters = {
  query: "",
  showProcesses: true,
  showConnectors: true,
  showOrphans: true,
};

function makeProcessNode(process: RealProcess): GraphNode {
  return {
    id: processNodeId(process.slug),
    kind: "process",
    label: process.name,
    href: `/processes/${process.slug}`,
    degree: 0,
    excerpt: process.description,
    version: process.version,
    shape: SHAPE_BY_KIND.process,
  };
}

function makeConnectorNode(connector: Connector): GraphNode {
  return {
    id: connectorNodeId(connector.id),
    kind: "connector",
    label: connector.name,
    // Connectors have no per-connector page yet — same target the pre-live
    // graph used.
    href: "/connectors",
    degree: 0,
    category: connector.category,
    shape: SHAPE_BY_KIND.connector,
  };
}

/** Every node and edge the fetched processes can produce, before filtering. */
function fullGraph(processes: RealProcess[]): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  // Only connectors actually used by a live process are added — otherwise the
  // graph would be swamped by the full ~60-entry catalog (the same
  // restriction the pre-live graph applied).
  const seenConnectors = new Map<string, GraphNode>();

  for (const process of processes) {
    nodes.push(makeProcessNode(process));
    const connectors = orderedConnectorsForProcess({ tools: process.tools, connectorIds: [] });
    for (const connector of connectors) {
      const id = connectorNodeId(connector.id);
      let node = seenConnectors.get(id);
      if (!node) {
        node = makeConnectorNode(connector);
        seenConnectors.set(id, node);
        nodes.push(node);
      }
      edges.push({ source: processNodeId(process.slug), target: id, kind: "uses" });
    }
  }

  return { nodes, edges };
}

function matchesQuery(node: GraphNode, needle: string) {
  if (!needle) return true;
  return (
    node.label.toLowerCase().includes(needle) ||
    (node.excerpt?.toLowerCase().includes(needle) ?? false)
  );
}

/** Drop edges with a missing endpoint, then recompute degree from what is left. */
function settle(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const present = new Set(nodes.map((n) => n.id));
  const kept = edges.filter((e) => present.has(e.source) && present.has(e.target));
  const degree = new Map<string, number>();
  for (const e of kept) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  return {
    nodes: nodes.map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 })),
    edges: kept,
  };
}

export function buildGraph(processes: RealProcess[], filters: GraphFilters): Graph {
  const { nodes: all, edges: allEdges } = fullGraph(processes);
  const needle = filters.query.trim().toLowerCase();

  let nodes = all.filter((n) => {
    if (n.kind === "process" && !filters.showProcesses) return false;
    if (n.kind === "connector" && !filters.showConnectors) return false;
    return matchesQuery(n, needle);
  });

  let graph = settle(nodes, allEdges);

  // Orphan status is computed AFTER every other filter, matching
  // knowledge-graph.ts's rule: a node whose neighbors were filtered out is an
  // orphan "in the context of the filtered search" and disappears too. Here
  // it mainly means a process with no detected connector usage.
  if (!filters.showOrphans) {
    nodes = graph.nodes.filter((n) => n.degree > 0);
    graph = settle(nodes, allEdges);
  }

  return graph;
}
