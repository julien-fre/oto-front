// Turns the live knowledge base into a node/edge graph. Pure: no fetching, no
// randomness — the same KB and filters always produce the same graph, which is
// what lets the canvas cache node positions across navigations.
//
// Nodes are the KB's pages (kind doc | note | source) plus one phantom node
// per unresolved [[wikilink]] title — the backend's "lien-souche" concept
// (db/backlinks.py: an unmatched title is rendered UI-side, never stored).
// Edges are the resolved wikilinks, the same ones the backend keeps in
// doc_links.

import type { NodeShape } from "./graph";
import { docAccentColor, type KnowledgeBase, type KnowledgeDoc } from "./knowledge-model";
import { normalizeTitle } from "./markdown";

export type NodeKind = "doc" | "note" | "source" | "unresolved";
export type EdgeKind = "references";

// Structurally assignable into graph.ts's wider Graph/GraphNode wherever a
// value flows into GraphCanvas or the shared traversal helpers (neighborsOf,
// describeNode, nodeWeight) — this domain keeps its own narrow types for its
// own logic (nodeColor, colorLegend, buildGraph) rather than importing the
// wide ones, so nothing here loses exhaustiveness checking.
export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  href: string | null; // null for unresolved — there is nothing to open
  /** Incoming + outgoing, counting a mutual pair twice, the way Obsidian does. */
  degree: number;
  /** Top-level ancestor doc — the branch of the tree this page lives under. */
  branchId?: number;
  freshness?: KnowledgeDoc["freshness"];
  excerpt?: string;
  /** Hops from the center node. Only set by localGraph(). */
  ring?: number;
  shape?: NodeShape;
};

export type GraphEdge = { source: string; target: string; kind: EdgeKind };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export const EDGE_LABELS: Record<EdgeKind, string> = {
  references: "references",
};

export const docNodeId = (id: number) => `doc:${id}`;
export const unresolvedNodeId = (title: string) => `unresolved:${normalizeTitle(title)}`;

// ── Color ────────────────────────────────────────────────────────────────────
// Node *type* is carried by shape (circle/square/ring — see graph-canvas), so
// color is free to carry a second dimension, picked by the user.

export type ColorBy = "branch" | "type" | "freshness" | "none";

export const COLOR_BY_LABELS: Record<ColorBy, string> = {
  branch: "Branch",
  type: "Type",
  freshness: "Freshness",
  none: "None",
};

const NEUTRAL = "#8b8d98"; // gray-9
const TYPE_COLORS: Record<NodeKind, string> = {
  doc: "#3e63dd", // indigo
  note: "#0d9488", // teal
  source: "#8b8d98", // gray-9
  unresolved: "#b9bbc6", // gray-8
};
// Freshness is state, so it is the one dimension allowed to speak in
// chromatic color: green = maintained, amber = past the lint horizon
// (a warning, not an error — red stays reserved).
const FRESHNESS_COLORS: Record<KnowledgeDoc["freshness"], string> = {
  fresh: "#30a46c", // green-9
  stale: "#ffc53d", // amber-9
};

export function nodeColor(node: GraphNode, colorBy: ColorBy): string {
  if (node.kind === "unresolved") return TYPE_COLORS.unresolved;
  switch (colorBy) {
    case "none":
      return NEUTRAL;
    case "type":
      return TYPE_COLORS[node.kind];
    case "freshness":
      return node.freshness ? FRESHNESS_COLORS[node.freshness] : NEUTRAL;
    case "branch":
      return node.branchId != null ? docAccentColor(node.branchId) : NEUTRAL;
  }
}

/** Legend entries for a dimension, so the graph never speaks in color alone. */
export function colorLegend(colorBy: ColorBy, kb: KnowledgeBase): { label: string; color: string }[] {
  switch (colorBy) {
    case "none":
      return [];
    case "type":
      return [
        { label: "Doc", color: TYPE_COLORS.doc },
        { label: "Note", color: TYPE_COLORS.note },
        { label: "Source", color: TYPE_COLORS.source },
      ];
    case "freshness":
      return [
        { label: "Up to date", color: FRESHNESS_COLORS.fresh },
        { label: "Needs review", color: FRESHNESS_COLORS.stale },
      ];
    case "branch":
      return (kb.children.get(null) ?? []).map((doc) => ({
        label: doc.title,
        color: docAccentColor(doc.id),
      }));
  }
}

// ── Building ─────────────────────────────────────────────────────────────────

export type GraphFilters = {
  query: string;
  /** Agent-written pages (kind=note). */
  showNotes: boolean;
  /** Imported material (kind=source). */
  showSources: boolean;
  showOrphans: boolean;
  /** On = hide unresolved [[wikilinks]] (Obsidian's inverted naming, kept). */
  hideUnresolved: boolean;
};

export const DEFAULT_FILTERS: GraphFilters = {
  query: "",
  showNotes: true,
  showSources: true,
  showOrphans: true,
  hideUnresolved: false,
};

const SHAPE_BY_KIND: Record<NodeKind, NodeShape> = {
  doc: "circle",
  note: "square",
  source: "ring",
  unresolved: "circle",
};

function makeDocNode(doc: KnowledgeDoc, kb: KnowledgeBase): GraphNode {
  return {
    id: docNodeId(doc.id),
    kind: doc.kind,
    label: doc.title || `Untitled ${doc.id}`,
    href: `/knowledge/${doc.id}`,
    degree: 0,
    branchId: kb.branchOf.get(doc.id) ?? doc.id,
    freshness: doc.freshness,
    excerpt: doc.summary,
    shape: SHAPE_BY_KIND[doc.kind],
  };
}

/** Every node and edge the KB can produce, before any filtering. */
function fullGraph(kb: KnowledgeBase): Graph {
  const nodes: GraphNode[] = kb.docs.map((doc) => makeDocNode(doc, kb));
  const edges: GraphEdge[] = [];
  const seenStubs = new Map<string, GraphNode>();

  for (const doc of kb.docs) {
    for (const target of kb.outgoing.get(doc.id) ?? []) {
      edges.push({ source: docNodeId(doc.id), target: docNodeId(target), kind: "references" });
    }
    for (const title of kb.stubs.get(doc.id) ?? []) {
      const id = unresolvedNodeId(title);
      let node = seenStubs.get(id);
      if (!node) {
        node = {
          id,
          kind: "unresolved",
          label: title,
          href: null,
          degree: 0,
          shape: SHAPE_BY_KIND.unresolved,
        };
        seenStubs.set(id, node);
        nodes.push(node);
      }
      edges.push({ source: docNodeId(doc.id), target: id, kind: "references" });
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

export function buildGraph(kb: KnowledgeBase, filters: GraphFilters): Graph {
  const { nodes: all, edges: allEdges } = fullGraph(kb);
  const needle = filters.query.trim().toLowerCase();

  let nodes = all.filter((n) => {
    if (n.kind === "note" && !filters.showNotes) return false;
    if (n.kind === "source" && !filters.showSources) return false;
    if (n.kind === "unresolved" && filters.hideUnresolved) return false;
    return matchesQuery(n, needle);
  });

  let graph = settle(nodes, allEdges);

  // Orphan status is computed AFTER every other filter — Obsidian's rule: a
  // doc whose neighbors were filtered out is an orphan "in the context of the
  // filtered search" and disappears too.
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
  showNotes: boolean;
  showSources: boolean;
  hideUnresolved: boolean;
};

export const DEFAULT_LOCAL_FILTERS: LocalFilters = {
  depth: 1,
  incoming: true,
  outgoing: true,
  neighborLinks: false,
  showNotes: true,
  showSources: true,
  hideUnresolved: false,
};

export const MAX_LOCAL_DEPTH = 3;

/**
 * BFS out from one node, Obsidian's local-graph algorithm. The direction
 * toggles gate *traversal*, not just edge rendering; with both off nothing is
 * ever added to the frontier and only the center renders.
 */
export function localGraph(kb: KnowledgeBase, centerId: string, filters: LocalFilters): Graph {
  const { nodes: all, edges: allEdges } = fullGraph(kb);
  const byId = new Map(all.map((n) => [n.id, n]));
  if (!byId.has(centerId)) return { nodes: [], edges: [] };

  const visible = (id: string) => {
    const node = byId.get(id);
    if (!node) return false;
    if (node.kind === "note" && !filters.showNotes) return false;
    if (node.kind === "source" && !filters.showSources) return false;
    if (node.kind === "unresolved" && filters.hideUnresolved) return false;
    return true;
  };

  const edges = allEdges.filter((e) => visible(e.source) && visible(e.target));

  const ring = new Map<string, number>([[centerId, 0]]);
  // The edges actually walked — with neighbor links off, only these draw, so
  // a local graph reads as a tree rather than a mesh.
  const walked: GraphEdge[] = [];
  for (let hop = 0; hop < filters.depth; hop++) {
    const frontier: string[] = [];
    for (const e of edges) {
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

// nodeWeight/describeNode/neighborsOf moved to lib/graph.ts — pure traversal
// helpers with zero docs-specific logic, now shared with processes-graph.ts.
