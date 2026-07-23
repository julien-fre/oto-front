// Turns the mock corpus into a node/edge graph. Pure: no React, no DOM, no
// randomness — the same filters always produce the same graph, which is what
// lets the canvas cache node positions across navigations.
//
// Node ids are namespaced ("doc:glossary") because a doc slug and a process
// slug could collide, and because the renderer needs to know a node's kind
// without a lookup.

import {
  connectors,
  docs,
  getConnector,
  getDoc,
  knowledgeFolders,
  processes,
  team,
  type Doc,
} from "./mock-data";

export type NodeKind = "doc" | "process" | "connector" | "unresolved";
export type EdgeKind = "references" | "reads" | "uses";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  href: string | null; // null for unresolved — there is nothing to open
  /** Incoming + outgoing, counting a mutual pair twice, the way Obsidian does. */
  degree: number;
  category?: Doc["category"];
  owner?: string;
  freshness?: Doc["freshness"];
  excerpt?: string;
  /** Hops from the center node. Only set by localGraph(). */
  ring?: number;
};

export type GraphEdge = { source: string; target: string; kind: EdgeKind };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export const EDGE_LABELS: Record<EdgeKind, string> = {
  references: "references",
  reads: "reads",
  uses: "uses",
};

export const docNodeId = (slug: string) => `doc:${slug}`;
export const processNodeId = (slug: string) => `process:${slug}`;
export const connectorNodeId = (id: string) => `connector:${id}`;
export const unresolvedNodeId = (slug: string) => `unresolved:${slug}`;

// ── Color ────────────────────────────────────────────────────────────────────
// Obsidian encodes node type purely by fill color. We deliberately don't: the
// renderer also varies shape per kind (WCAG 1.4.1, and the design system's own
// "pair color with an icon or text label, never color alone"). Color here is
// the second signal, chosen by the dimension the user picked.

export type ColorBy = "folder" | "type" | "owner" | "freshness" | "none";

export const COLOR_BY_LABELS: Record<ColorBy, string> = {
  folder: "Folder",
  type: "Type",
  owner: "Owner",
  freshness: "Freshness",
  none: "None",
};

// Pulled from the design system rather than re-declared: label-dots for
// identity dimensions, the chromatic scale for freshness (which is state, and
// so is the one dimension allowed to carry meaning in its hue).
const NEUTRAL = "#8b8d98"; // gray-9
const TYPE_COLORS: Record<NodeKind, string> = {
  doc: "#3e63dd", // indigo
  process: "#0d9488", // teal
  connector: "#8b8d98", // gray-9
  unresolved: "#b9bbc6", // gray-8
};
const FRESHNESS_COLORS: Record<Doc["freshness"], string> = {
  fresh: "#30a46c", // green-9
  aging: "#ffc53d", // amber-9
  stale: "#e5484d", // red-9
};

/**
 * The identity color for a node under the current "Color by" dimension.
 * Folder is the default because it maps onto the three folder dots the sidebar
 * already shows, so a cluster in the graph is recognizable from the nav.
 */
export function nodeColor(node: GraphNode, colorBy: ColorBy, palette: readonly string[]): string {
  if (node.kind === "unresolved") return TYPE_COLORS.unresolved;
  switch (colorBy) {
    case "none":
      return NEUTRAL;
    case "type":
      return TYPE_COLORS[node.kind];
    case "freshness":
      return node.freshness ? FRESHNESS_COLORS[node.freshness] : NEUTRAL;
    case "owner": {
      const i = team.indexOf(node.owner as (typeof team)[number]);
      return i < 0 ? NEUTRAL : palette[i % palette.length];
    }
    case "folder": {
      if (!node.category) return TYPE_COLORS[node.kind];
      const i = knowledgeFolders.findIndex((f) => f.id === node.category);
      return palette[Math.max(0, i) % palette.length];
    }
  }
}

/** The legend entries for a dimension, so the graph never relies on color alone. */
export function colorLegend(
  colorBy: ColorBy,
  palette: readonly string[],
): { label: string; color: string }[] {
  switch (colorBy) {
    case "none":
      return [];
    case "type":
      return [
        { label: "Doc", color: TYPE_COLORS.doc },
        { label: "Process", color: TYPE_COLORS.process },
        { label: "Connector", color: TYPE_COLORS.connector },
      ];
    case "freshness":
      return [
        { label: "Verified", color: FRESHNESS_COLORS.fresh },
        { label: "Review soon", color: FRESHNESS_COLORS.aging },
        { label: "Needs review", color: FRESHNESS_COLORS.stale },
      ];
    case "owner":
      return team.map((person, i) => ({ label: person, color: palette[i % palette.length] }));
    case "folder":
      return knowledgeFolders.map((f, i) => ({ label: f.label, color: palette[i % palette.length] }));
  }
}

// ── Building ─────────────────────────────────────────────────────────────────

export type GraphFilters = {
  query: string;
  showProcesses: boolean;
  showConnectors: boolean;
  showOrphans: boolean;
  /** Obsidian's inverted "Existing files only": on = hide unresolved links. */
  hideUnresolved: boolean;
};

export const DEFAULT_FILTERS: GraphFilters = {
  query: "",
  showProcesses: true,
  showConnectors: false,
  showOrphans: true,
  hideUnresolved: false,
};

function makeDocNode(doc: Doc): GraphNode {
  return {
    id: docNodeId(doc.slug),
    kind: "doc",
    label: doc.title,
    href: `/knowledge/${doc.slug}`,
    degree: 0,
    category: doc.category,
    owner: doc.owner,
    freshness: doc.freshness,
    excerpt: doc.excerpt,
  };
}

/** Every node and edge the corpus can produce, before any filtering. */
function fullGraph(): Graph {
  const nodes: GraphNode[] = docs.map(makeDocNode);
  const edges: GraphEdge[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // doc → doc, materializing a phantom node for any slug with no doc behind it
  for (const doc of docs) {
    for (const target of doc.links) {
      if (getDoc(target)) {
        edges.push({ source: docNodeId(doc.slug), target: docNodeId(target), kind: "references" });
        continue;
      }
      const id = unresolvedNodeId(target);
      if (!byId.has(id)) {
        const node: GraphNode = { id, kind: "unresolved", label: target, href: null, degree: 0 };
        byId.set(id, node);
        nodes.push(node);
      }
      edges.push({ source: docNodeId(doc.slug), target: id, kind: "references" });
    }
  }

  const live = processes.filter((p) => p.status !== "deprecated");
  for (const process of live) {
    nodes.push({
      id: processNodeId(process.slug),
      kind: "process",
      label: process.name,
      href: `/processes/${process.slug}`,
      degree: 0,
      owner: process.owner,
      excerpt: process.description,
    });
    for (const slug of process.docSlugs) {
      if (getDoc(slug)) {
        edges.push({ source: processNodeId(process.slug), target: docNodeId(slug), kind: "reads" });
      }
    }
  }

  // Only connectors a live process actually uses — the registry has ~55, and
  // dropping in all of them would swamp the graph with unconnected nodes.
  const used = new Set(live.flatMap((p) => p.connectorIds));
  for (const connector of connectors) {
    if (!used.has(connector.id)) continue;
    nodes.push({
      id: connectorNodeId(connector.id),
      kind: "connector",
      label: connector.name,
      href: "/connectors",
      degree: 0,
      owner: connector.owner,
      excerpt: connector.description,
    });
  }
  for (const process of live) {
    for (const id of process.connectorIds) {
      if (getConnector(id)) {
        edges.push({ source: processNodeId(process.slug), target: connectorNodeId(id), kind: "uses" });
      }
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

export function buildGraph(filters: GraphFilters): Graph {
  const { nodes: all, edges: allEdges } = fullGraph();
  const needle = filters.query.trim().toLowerCase();

  let nodes = all.filter((n) => {
    if (n.kind === "process" && !filters.showProcesses) return false;
    if (n.kind === "connector" && !filters.showConnectors) return false;
    if (n.kind === "unresolved" && filters.hideUnresolved) return false;
    return matchesQuery(n, needle);
  });

  let graph = settle(nodes, allEdges);

  // Orphan status is computed AFTER every other filter — Obsidian's rule, and
  // the reason the toggle feels alive: a doc whose neighbors were filtered out
  // is an orphan "in the context of the filtered search" and disappears too.
  if (!filters.showOrphans) {
    nodes = graph.nodes.filter((n) => n.degree > 0);
    graph = settle(nodes, allEdges);
  }

  return graph;
}

// ── Local graph ──────────────────────────────────────────────────────────────

export type LocalFilters = {
  depth: number;
  incoming: boolean;
  outgoing: boolean;
  /** Adds edges among the included set. Never adds nodes. */
  neighborLinks: boolean;
  showProcesses: boolean;
  showConnectors: boolean;
  hideUnresolved: boolean;
};

export const DEFAULT_LOCAL_FILTERS: LocalFilters = {
  depth: 1,
  incoming: true,
  outgoing: true,
  neighborLinks: false,
  showProcesses: true,
  showConnectors: false,
  hideUnresolved: false,
};

export const MAX_LOCAL_DEPTH = 3;

/**
 * BFS out from one node, following Obsidian's local-graph algorithm.
 *
 * The subtle part, and the thing a naive implementation gets wrong: the
 * direction toggles gate *traversal*, not just which edges get drawn. With
 * incoming off, the walk only ever moves forward along outgoing links — so at
 * depth 3 you get a pure forward cone, not a 3-hop neighborhood with some
 * edges hidden. With both off, nothing is ever added to the frontier and only
 * the center node renders.
 */
export function localGraph(centerId: string, filters: LocalFilters): Graph {
  const { nodes: all, edges: allEdges } = fullGraph();
  const byId = new Map(all.map((n) => [n.id, n]));
  if (!byId.has(centerId)) return { nodes: [], edges: [] };

  const visible = (id: string) => {
    const node = byId.get(id);
    if (!node) return false;
    if (node.kind === "process" && !filters.showProcesses) return false;
    if (node.kind === "connector" && !filters.showConnectors) return false;
    if (node.kind === "unresolved" && filters.hideUnresolved) return false;
    return true;
  };

  const edges = allEdges.filter((e) => visible(e.source) && visible(e.target));

  const ring = new Map<string, number>([[centerId, 0]]);
  // The edges actually walked. With neighbor links off these are the only ones
  // drawn — each included node keeps its *pruned* adjacency, which is why a
  // local graph normally reads as a tree rather than a mesh.
  const walked: GraphEdge[] = [];
  for (let hop = 0; hop < filters.depth; hop++) {
    const frontier: string[] = [];
    for (const e of edges) {
      // `ring` is only written after the loop, so both tests see the frontier
      // as it stood at the start of this hop — nodes added this round do not
      // pull in their own neighbors until the next one.
      if (filters.outgoing && ring.has(e.source) && !ring.has(e.target)) {
        frontier.push(e.target);
        walked.push(e);
      } else if (filters.incoming && ring.has(e.target) && !ring.has(e.source)) {
        frontier.push(e.source);
        walked.push(e);
      }
    }
    if (frontier.length === 0) break;
    for (const id of frontier) if (!ring.has(id)) ring.set(id, hop + 1);
  }

  const included = new Set(ring.keys());
  // Neighbor links restores the full adjacency among the included set. An edge
  // is only drawn when both endpoints are already present, so this adds edges
  // and never nodes.
  const kept = filters.neighborLinks
    ? edges.filter((e) => included.has(e.source) && included.has(e.target))
    : walked.filter((e) => included.has(e.source) && included.has(e.target));

  const degree = new Map<string, number>();
  for (const e of kept) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const nodes = [...included].map((id) => ({
    ...(byId.get(id) as GraphNode),
    degree: degree.get(id) ?? 0,
    ring: ring.get(id) ?? 0,
  }));

  return { nodes, edges: kept };
}

/**
 * Node weight. The global graph sizes by link count; the local graph sizes by
 * distance from the center, so the doc you are reading is unmistakably the
 * biggest thing on screen (at depth 1 it is >2x every neighbor).
 */
export function nodeWeight(node: GraphNode, depth?: number): number {
  if (node.ring === undefined || !depth) return node.degree;
  return 30 - (30 / depth) * node.ring;
}

/** Human-readable summary for the graph's accessible name and live region. */
export function describeNode(node: GraphNode, neighbors: GraphNode[]): string {
  const names = neighbors.map((n) => n.label);
  const count = names.length;
  if (count === 0) return `${node.label}. No links.`;
  return `${node.label}. ${count} link${count === 1 ? "" : "s"}: ${names.join(", ")}.`;
}

/** Both directions, deduped — used for hover highlighting and keyboard cycling. */
export function neighborsOf(id: string, graph: Graph): GraphNode[] {
  const ids = new Set<string>();
  for (const e of graph.edges) {
    if (e.source === id) ids.add(e.target);
    else if (e.target === id) ids.add(e.source);
  }
  return graph.nodes.filter((n) => ids.has(n.id));
}
