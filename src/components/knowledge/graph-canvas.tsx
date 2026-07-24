"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import {
  COLLIDE_RADIUS,
  createSimulation,
  seedPosition,
  type ForceParams,
  type SimLink,
  type SimNode,
  type Simulation,
} from "@/lib/force-graph";
import { describeNode, neighborsOf, nodeWeight, type Graph, type GraphNode } from "@/lib/graph";
import { readGraphTheme, type GraphTheme } from "@/lib/graph-theme";

export type DisplaySettings = {
  arrows: boolean;
  edgeLabels: boolean;
  /** Obsidian's textFadeMultiplier, -3..3. Higher hides labels until closer. */
  textFade: number;
  nodeSize: number;
  linkThickness: number;
};

export const DEFAULT_DISPLAY: DisplaySettings = {
  arrows: false,
  // Off by default since the live graph has a single edge kind — "references"
  // on every hovered edge is noise; the toggle stays for when types return.
  edgeLabels: false,
  textFade: 0,
  nodeSize: 1,
  linkThickness: 1,
};

export const DISPLAY_RANGES = {
  textFade: { min: -3, max: 3, step: 0.1 },
  nodeSize: { min: 0.1, max: 5, step: 0.01 },
  linkThickness: { min: 0.1, max: 5, step: 0.01 },
} as const;

// Node positions survive navigation. Re-simulating from scratch on every doc
// change is the single most-cited complaint about Obsidian's local graph —
// nodes shuffle and you lose track of where you came from. Keeping coordinates
// in a module-level cache means a node you have already seen stays put.
//
// The cache is namespaced by layout scope: the global graph and each doc's
// local graph get their own space, so a node the global graph flung to the far
// edge does not drag the local graph's copy of it out there too. Without this,
// a local graph inherits the global sprawl and frames tiny and off-centre.
const positionCaches = new Map<string, Map<string, { x: number; y: number }>>();
function positionCacheFor(scope: string) {
  let cache = positionCaches.get(scope);
  if (!cache) {
    cache = new Map();
    positionCaches.set(scope, cache);
  }
  return cache;
}

const ZOOM_MIN = 1 / 128;
const ZOOM_MAX = 8;
const DRAG_THRESHOLD_SQ = 25; // 5px, Obsidian's exact click-vs-drag cutoff
const DIM = 0.2; // what everything unrelated to the hovered node fades to
const EASE = 0.1; // per-frame lerp: new = old * 0.9 + target * 0.1
const HIT_SLOP = 6;
const COMPACT_LABEL_MAX = 22; // chars before a rail label is truncated at rest
// Entry animation: how far the nodes are pulled toward the centre before they
// bloom back out to their settled places, and the alpha that drives the bloom.
// Chosen by measurement, not feel: reheating physics first *contracts* the
// layout toward its sustained-alpha equilibrium before the decay lets it
// re-expand, and that dip is what read as nervous. At alpha 0.05 the dip is
// ~2% — the motion is a single gentle bloom outward (90% → 100% of the settled
// span over ~3s) that lands back on the exact settled layout, so the fixed
// camera stays correct. Raise ENTRY_ALPHA and the dip comes back; you have
// been warned.
const ENTRY_PERTURB = 0.9;
const ENTRY_ALPHA = 0.05;

type Transform = { x: number; y: number; k: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Obsidian's exact node size curve. Note the floor: degree 0-6 all render the
 *  same, so orphans are minimum-sized rather than small. */
function radiusFor(node: GraphNode, display: DisplaySettings, depth?: number) {
  const weight = Math.max(0, nodeWeight(node, depth));
  return clamp(3 * Math.sqrt(weight + 1), 8, 30) * display.nodeSize;
}

/** Seed a node the simulation has not placed before, biased toward whichever of
 *  its neighbors are already on screen so it arrives from the right direction. */
function seedNew(
  node: GraphNode,
  index: number,
  placed: Map<string, { x: number; y: number }>,
  graph: Graph,
) {
  const anchors = graph.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => placed.get(e.source === node.id ? e.target : e.source))
    .filter((p): p is { x: number; y: number } => p !== undefined);

  if (anchors.length === 0) return seedPosition(index);

  const ax = anchors.reduce((s, p) => s + p.x, 0) / anchors.length;
  const ay = anchors.reduce((s, p) => s + p.y, 0) / anchors.length;
  const len = Math.hypot(ax, ay) || 1;
  // Push out past the anchor centroid so it settles inward rather than
  // exploding out of a pile at the origin.
  const out = 160;
  return { x: ax + (ax / len) * out, y: ay + (ay / len) * out };
}

export type GraphCanvasProps = {
  graph: Graph;
  /** Resolves a node's fill color — the domain caller curries its own "color
   *  by" dimension in, so the canvas never needs to know that vocabulary. */
  nodeColor: (node: GraphNode) => string;
  /** Shown next to an edge when hovered, keyed by GraphEdge.kind. Omit (or
   *  leave a kind out) to show nothing for that edge. */
  edgeLabels?: Record<string, string>;
  display: DisplaySettings;
  forces: ForceParams;
  /** Local graph only: the node to mark as focused and size the rings from. */
  centerId?: string;
  depth?: number;
  /** Rail mode — smaller labels, no edge labels, no keyboard zoom hints. */
  compact?: boolean;
  /** Upper bound on the fit-to-view zoom. Higher lets a small graph fill a
   *  large canvas (the rail wants this so its labels are legible). */
  fitZoomMax?: number;
  /** Namespaces the position cache. The global graph and each local graph pass
   *  distinct scopes so they do not share (and distort) each other's layouts. */
  layoutScope?: string;
  ariaLabel: string;
  className?: string;
  onHoverChange?: (node: GraphNode | null, screen: { x: number; y: number } | null) => void;
};

export function GraphCanvas({
  graph,
  nodeColor,
  edgeLabels,
  display,
  forces,
  centerId,
  depth,
  compact = false,
  fitZoomMax = 1.5,
  layoutScope = "global",
  ariaLabel,
  className,
  onHoverChange,
}: GraphCanvasProps) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Everything the render loop touches lives in refs. Putting node positions in
  // state would mean 60 re-renders a second.
  const simRef = useRef<Simulation | null>(null);
  const nodesRef = useRef<GraphNode[]>(graph.nodes);
  const graphRef = useRef<Graph>(graph);
  const transformRef = useRef<Transform>({ x: 0, y: 0, k: 1 });
  const themeRef = useRef<GraphTheme | null>(null);
  const fadeRef = useRef(new Map<string, number>());
  const hoverRef = useRef<string | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const idleRef = useRef(0);
  const labelWidthRef = useRef(new Map<string, number>());
  const reducedRef = useRef(false);
  const displayRef = useRef(display);
  const nodeColorRef = useRef(nodeColor);
  const edgeLabelsRef = useRef(edgeLabels);
  const focusedRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  // Set once the user zooms or pans by hand. While it is false the camera
  // re-frames the graph on every resize (so the rail growing to full height, or
  // the sidebar collapsing, keeps the graph centred); once true, a resize
  // leaves their view alone.
  const userAdjustedRef = useRef(false);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Held in a ref rather than closed over. The parent re-renders on every
  // hover, so an inline callback prop would give this component a new identity
  // each time, which would cascade through kick() into the simulation effect
  // and rebuild the layout mid-hover.
  const hoverCallbackRef = useRef(onHoverChange);
  useEffect(() => {
    hoverCallbackRef.current = onHoverChange;
  }, [onHoverChange]);

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const toWorld = useCallback((sx: number, sy: number) => {
    const t = transformRef.current;
    return { x: (sx - t.x) / t.k, y: (sy - t.y) / t.k };
  }, []);

  const hitRadius = useCallback(() => {
    const t = transformRef.current;
    return (30 + HIT_SLOP) / t.k;
  }, []);

  // ── The render loop ────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    const theme = themeRef.current;
    if (!canvas || !sim || !theme) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    // Assigning width/height resets every bit of context state, so only do it
    // when the size actually changed.
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    // setTransform, never scale(), which would compound every frame.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const t = transformRef.current;
    const d = displayRef.current;
    const nodes = nodesRef.current;
    const g = graphRef.current;
    const hovered = hoverRef.current;
    const focused = focusedRef.current;
    const fades = fadeRef.current;
    const instant = reducedRef.current;

    // Which nodes stay lit while something is hovered: the node itself and its
    // one-hop neighbourhood, in either direction.
    const lit = new Set<string>();
    if (hovered) {
      lit.add(hovered);
      for (const e of g.edges) {
        if (e.source === hovered) lit.add(e.target);
        else if (e.target === hovered) lit.add(e.source);
      }
    }

    const targetFade = (id: string) => (!hovered || lit.has(id) ? 1 : DIM);
    const ease = (key: string, target: number) => {
      if (instant) {
        fades.set(key, target);
        return target;
      }
      const prev = fades.get(key) ?? target;
      const next = prev + (target - prev) * EASE;
      fades.set(key, next);
      return next;
    };

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // ── Links ──
    // Constant on-screen thickness regardless of zoom, the way Obsidian does it.
    const lineWidth = d.linkThickness / t.k;
    for (let i = 0; i < g.edges.length; i++) {
      const e = g.edges[i];
      const s = sim.get(e.source);
      const target = sim.get(e.target);
      if (!s || !target) continue;

      const touched = hovered != null && (e.source === hovered || e.target === hovered);
      const alpha = ease(`e${i}`, !hovered || touched ? 1 : DIM);

      const sNode = nodeById.get(e.source);
      const tNode = nodeById.get(e.target);
      const sr = sNode ? radiusFor(sNode, d, depth) : 8;
      const tr = tNode ? radiusFor(tNode, d, depth) : 8;

      const dx = target.x - s.x;
      const dy = target.y - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      // Start and end at the circle edges so a line never runs under a node.
      const x1 = s.x + ux * sr;
      const y1 = s.y + uy * sr;
      const x2 = target.x - ux * tr;
      const y2 = target.y - uy * tr;
      if (dist <= sr + tr) continue;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = touched ? theme.linkStrong : theme.link;
      ctx.lineWidth = touched ? lineWidth * 1.5 : lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (d.arrows) {
        // Fades out below zoom 0.3 and is at full strength by 0.8 — Obsidian's
        // "show arrows when zoomed in".
        const arrowAlpha = alpha * clamp(2 * (t.k - 0.3), 0, 1) * 0.6;
        if (arrowAlpha > 0.01) {
          const size = 5 / t.k;
          ctx.save();
          ctx.globalAlpha = arrowAlpha;
          ctx.translate(x2, y2);
          ctx.rotate(Math.atan2(dy, dx));
          ctx.fillStyle = touched ? theme.linkStrong : theme.label;
          ctx.beginPath();
          // A barbed chevron rather than a filled triangle — lighter at size.
          ctx.moveTo(0, 0);
          ctx.lineTo(-size, -size * 0.5);
          ctx.lineTo(-size * 0.75, 0);
          ctx.lineTo(-size, size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Relation labels, only on the hovered node's own edges. This is the one
      // thing that makes a small graph legible at a glance — you can read
      // "reads" / "uses" rather than guessing what a line means.
      if (d.edgeLabels && !compact && touched && alpha > 0.5) {
        const label = edgeLabelsRef.current?.[e.kind];
        if (!label) continue;
        const fontSize = 11 / t.k;
        ctx.font = `${fontSize}px ${theme.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const pad = 3 / t.k;
        const width = ctx.measureText(label).width;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = theme.background;
        ctx.fillRect(mx - width / 2 - pad, my - fontSize / 2 - pad, width + pad * 2, fontSize + pad * 2);
        ctx.fillStyle = theme.label;
        ctx.fillText(label, mx, my);
      }
    }

    // ── Nodes ──
    for (const node of nodes) {
      const p = sim.get(node.id);
      if (!p) continue;
      const alpha = ease(`n${node.id}`, targetFade(node.id));
      const r = radiusFor(node, d, depth);
      const isHovered = node.id === hovered;
      const isCenter = node.id === centerId;
      const isFocused = node.id === focused;

      ctx.globalAlpha = node.kind === "unresolved" ? alpha * 0.5 : alpha;
      ctx.fillStyle = isHovered ? theme.ink : nodeColorRef.current(node);

      // Shape carries the node's kind, so type is never encoded by colour
      // alone — each domain decides what circle/square/ring means (docs: a
      // filled circle is a doc, a square a note, a ring a source).
      ctx.beginPath();
      if (node.shape === "square") {
        const s = r * 0.9;
        ctx.roundRect(p.x - s, p.y - s, s * 2, s * 2, s * 0.4);
        ctx.fill();
      } else if (node.shape === "ring") {
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1.5 / t.k, r * 0.28);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
      } else {
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rings, outermost concern first. Hover hugs the circle edge — 1px on
      // screen, no halo, no glow.
      if (isHovered || isCenter || isFocused) {
        const width = Math.max(1 / t.k, 1.5 / t.k);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + width, 0, Math.PI * 2);
        ctx.lineWidth = width;
        ctx.strokeStyle = theme.ink;
        ctx.stroke();
      } else if (node.freshness === "stale") {
        // Freshness is state, so it is the one thing allowed to speak in
        // colour — a stale doc wears an amber ring wherever it appears.
        const width = Math.max(1 / t.k, 1.5 / t.k);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + width, 0, Math.PI * 2);
        ctx.lineWidth = width;
        ctx.strokeStyle = theme.stale;
        ctx.stroke();
      }

      if (isFocused) {
        // Keyboard focus needs to read as focus, not as hover: a second, offset
        // ring rather than a heavier one.
        const gap = 4 / t.k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + gap + 2 / t.k, 0, Math.PI * 2);
        ctx.lineWidth = 1.5 / t.k;
        ctx.strokeStyle = theme.ink;
        ctx.setLineDash([3 / t.k, 3 / t.k]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ── Labels ──
    // Obsidian's fade: invisible below zoom 0.5 at the default threshold, full
    // by zoom 1, a smooth ramp one octave wide in log-zoom space.
    const baseTextAlpha = clamp(Math.log2(t.k) + 1 - d.textFade, 0, 1);
    for (const node of nodes) {
      const p = sim.get(node.id);
      if (!p) continue;
      const isHovered = node.id === hovered;
      const isFocused = node.id === focused;
      // The hovered label is always readable, even when every other label has
      // faded out.
      const textAlpha = isHovered || isFocused ? 1 : baseTextAlpha;
      if (textAlpha < 0.02) continue;

      const alpha = (fades.get(`n${node.id}`) ?? 1) * textAlpha;
      if (alpha < 0.02) continue;

      const r = radiusFor(node, d, depth);
      const base = compact ? 9 : 11;
      let fontSize = (base + r / 5) / 1;
      let scale = 1;
      // When zoomed out, render the hovered label at 100% screen size so it
      // stays legible rather than shrinking with everything else.
      if ((isHovered || isFocused) && t.k < 1) {
        scale = 1 / t.k;
        fontSize = fontSize * scale;
      }

      ctx.globalAlpha = alpha;
      ctx.font = `${fontSize}px ${theme.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHovered || isFocused ? theme.ink : theme.label;
      // In the narrow rail, long titles would run off the canvas; truncate at
      // rest and reveal the full name on hover or keyboard focus (and it's
      // always spelled out in the Links tab).
      const label =
        compact && !isHovered && !isFocused && node.label.length > COMPACT_LABEL_MAX
          ? `${node.label.slice(0, COMPACT_LABEL_MAX - 1).trimEnd()}…`
          : node.label;
      ctx.fillText(label, p.x, p.y + r + 5 * scale);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }, [nodeById, centerId, depth, compact]);

  // Keeps the loop alive while anything is still moving, then stops it dead.
  const kick = useCallback(() => {
    if (rafRef.current != null) return;
    const frame = () => {
      const sim = simRef.current;
      if (!sim) {
        rafRef.current = null;
        return;
      }
      const moved = sim.tick();

      // While the layout is moving, nodes walk out from under a stationary
      // cursor, so the hover has to be re-tested geometrically rather than only
      // on pointermove — otherwise a highlight sticks to a node that has left.
      // Once the layout is at rest nothing can move under the pointer, so this
      // stops being necessary and pointermove alone is enough.
      if (moved && pointerRef.current) {
        const world = toWorld(pointerRef.current.x, pointerRef.current.y);
        const hit = sim.find(world.x, world.y, hitRadius());
        const next = hit?.id ?? null;
        if (next !== hoverRef.current) {
          hoverRef.current = next;
          idleRef.current = 0;
          hoverCallbackRef.current?.(next ? (nodeById.get(next) ?? null) : null, pointerRef.current);
        }
      }

      draw();

      // Fades keep easing after the layout stops, so the loop runs a beat
      // longer and then parks. Parking does NOT wait for the pointer to leave:
      // a cursor resting on a settled graph would otherwise pin the loop at
      // 60fps forever, and a graph at rest has to cost nothing — that is what
      // makes it safe to leave one mounted in the document rail.
      if (moved) idleRef.current = 0;
      else idleRef.current += 1;

      if (idleRef.current > 45) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [draw, nodeById, toWorld, hitRadius]);

  /** Frame the whole graph with a margin. Obsidian has no such control; this is
   *  a deliberate addition — "I lost the graph" is its top complaint. Pass
   *  measureLabels=false for the cheap radius-only frame used each frame during
   *  the entry bloom; the accurate label-aware frame runs once when it settles. */
  const fitToView = useCallback((measureLabels = true) => {
    const sim = simRef.current;
    const { w, h } = sizeRef.current;
    if (!sim || w === 0 || h === 0 || sim.nodes.length === 0) return;
    const d = displayRef.current;
    const ctx = measureLabels ? (canvasRef.current?.getContext("2d") ?? null) : null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    // Frame the *settled* layout, read from the position cache, not the live
    // node positions. During the entry bloom the live nodes are compressed
    // toward the centre; framing those (which a resize or fonts-ready re-fit can
    // trigger mid-bloom) would zoom in on the compressed state, and the graph
    // would then bloom straight out of frame. The cache holds the final layout
    // throughout, so the camera stays put and the bloom plays inside it.
    //
    // Frame the visible extent, not just node centres: a label is centred under
    // its node and hangs below it, so each node claims its radius plus, below, a
    // label's height, and, to each side, half the label's measured width.
    const posCache = positionCacheFor(layoutScope);
    for (const n of sim.nodes) {
      const node = nodeById.get(n.id);
      const at = posCache.get(n.id) ?? n;
      const r = node ? radiusFor(node, d, depth) : 8;
      const fontSize = (compact ? 9 : 11) + r / 5;
      const labelHang = r + 6 + fontSize;
      let halfLabel = r;
      if (node && ctx) {
        // Measured with an untransformed context, so the width comes back in
        // world units (the font size is already world units).
        ctx.font = `${fontSize}px ${themeRef.current?.fontFamily ?? "ui-sans-serif, sans-serif"}`;
        const label =
          compact && node.label.length > COMPACT_LABEL_MAX
            ? `${node.label.slice(0, COMPACT_LABEL_MAX - 1)}…`
            : node.label;
        halfLabel = Math.max(r, ctx.measureText(label).width / 2);
      }
      minX = Math.min(minX, at.x - halfLabel);
      maxX = Math.max(maxX, at.x + halfLabel);
      minY = Math.min(minY, at.y - r);
      maxY = Math.max(maxY, at.y + labelHang);
    }
    const pad = 20;
    const width = maxX - minX + pad * 2;
    const height = maxY - minY + pad * 2;
    // Fill ~85% of the frame, so the whole graph reads with a comfortable
    // margin — and so the entry bloom's brief spring-back has room before it
    // would touch an edge.
    const k = clamp(Math.min(w / width, h / height) * 0.85, ZOOM_MIN, fitZoomMax);
    transformRef.current = {
      k,
      x: w / 2 - ((minX + maxX) / 2) * k,
      y: h / 2 - ((minY + maxY) / 2) * k,
    };
    // A programmatic frame is not a manual adjustment — clear the flag so the
    // next resize re-frames too.
    userAdjustedRef.current = false;
    kick();
  }, [kick, fitZoomMax, nodeById, depth, compact, layoutScope]);

  // ── Simulation lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    themeRef.current = readGraphTheme();
    reducedRef.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  // The first fit can run before the web font has loaded, so measureText comes
  // back a hair narrow and the widest labels clip. Re-fit once fonts are ready
  // (unless the user has already taken the camera over), now that the metrics
  // are real.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled && !userAdjustedRef.current) fitToView();
    });
    return () => {
      cancelled = true;
    };
  }, [fitToView]);

  useEffect(() => {
    nodesRef.current = graph.nodes;
    graphRef.current = graph;
    labelWidthRef.current.clear();
    const cache = positionCacheFor(layoutScope);

    const placed = new Map<string, { x: number; y: number }>();
    for (const node of graph.nodes) {
      const cached = cache.get(node.id);
      if (cached) placed.set(node.id, cached);
    }

    const simNodes: SimNode[] = graph.nodes.map((node, i) => {
      // In a local graph the centre node is pinned at the world origin, so its
      // neighbourhood settles symmetrically around it and it always frames dead
      // centre — rather than drifting to the edge of its own cloud.
      if (node.id === centerId) {
        return { id: node.id, x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0, radius: COLLIDE_RADIUS };
      }
      const at = placed.get(node.id) ?? seedNew(node, i, placed, graph);
      return {
        id: node.id,
        x: at.x,
        y: at.y,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        radius: COLLIDE_RADIUS,
      };
    });
    const simLinks: SimLink[] = graph.edges.map((e) => ({ source: e.source, target: e.target }));

    const sim = createSimulation(simNodes, simLinks, forces);
    simRef.current = sim;

    // Settle only when there is something new to place. A graph whose nodes
    // all came out of the cache is already at rest, and re-running the
    // simulation over it would shuffle every node — which is precisely the
    // re-layout thrash that makes Obsidian's local graph frustrating to
    // navigate. Skipping the settle is what makes a node stay where you left
    // it. (It also makes the layout deterministic under StrictMode's
    // double-invoked effects, where the second pass finds everything cached.)
    //
    // When there IS new work, run to convergence synchronously before the
    // first paint: the camera can only frame the graph once it has stopped
    // growing, 300 ticks costs ~5ms at this size, and arriving settled means an
    // idle graph burns no CPU. Animation is then spent where it carries
    // meaning — dragging a node, or changing a force.
    //
    // This doubles as the reduced-motion path, so there is no second branch for
    // it: freezing a *fresh* simulation would leave a hairball on screen, and
    // it is the settled layout that carries the information.
    const hasNewNodes = graph.nodes.some((n) => !cache.has(n.id));
    if (hasNewNodes) sim.settle();
    else sim.freeze();

    // Cache the *settled* positions, the layout a revisit restores. The entry
    // bloom (below, in its own effect) perturbs the live nodes afterwards, but
    // never touches this cache — so a revisit always finds the final layout.
    for (const n of sim.nodes) cache.set(n.id, { x: n.x, y: n.y });

    // Frame the final layout. The camera then stays put while the entry bloom
    // animates into it, so the whole brain is in view the entire time.
    fitToView();
    draw();

    return () => {
      // Only persist a *settled* layout. Mid-bloom the nodes are compressed
      // toward the centre; caching those would make a revisit (or StrictMode's
      // second mount) restore a half-animated frame instead of the final one.
      if (sim.settled) for (const n of sim.nodes) cache.set(n.id, { x: n.x, y: n.y });
    };
    // `forces` is applied via its own effect below so a slider drag does not
    // rebuild the simulation and throw away every position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, layoutScope, draw, fitToView, kick]);

  // Latest kick(), read through a ref so the entry-bloom effect below does not
  // re-run every time kick's identity changes (which would re-bloom on filter
  // changes).
  const kickRef = useRef(kick);
  useEffect(() => {
    kickRef.current = kick;
  }, [kick]);

  // The entry bloom, in its own mount-only effect (deps [compact], which is
  // stable). This is what runs on the first view of the full graph — and,
  // crucially, NOT on a filter change (the graph effect above re-runs then, but
  // this one does not). The graph effect has already settled the sim and framed
  // it; here we pull the nodes toward the centre and reheat, so they bloom back
  // out to their settled places while the camera holds the whole brain in view.
  //
  // Runs on every real mount, so opening the graph always greets you with the
  // settle. Under StrictMode it runs on both the discarded and the surviving
  // mount — harmless, because the surviving one is the one you see, and the
  // guarded cache above keeps the target layout intact between them.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim || compact || reducedRef.current) return;
    sim.perturbFrom(positionCacheFor(layoutScope), ENTRY_PERTURB);
    sim.reheat(ENTRY_ALPHA);
    kickRef.current();
  }, [compact, layoutScope]);

  // Apply live force changes — but not on mount. The simulation is already
  // built with the current forces in the effect above, and calling setForces
  // here reheats it to alpha 0.3, which re-shuffles the just-settled graph on
  // entry. So we only act when the forces value actually differs from what the
  // simulation already has. Comparing the value (not a "first run" flag) is
  // what makes this survive StrictMode's double-invoked effects in dev — a flag
  // gets set on the first pass and then fires on the second, re-shuffling the
  // graph; a value compare skips both passes.
  const appliedForcesRef = useRef(forces);
  useEffect(() => {
    if (appliedForcesRef.current === forces) return;
    appliedForcesRef.current = forces;
    simRef.current?.setForces(forces);
    kick();
  }, [forces, kick]);

  // The render loop reads these through refs rather than closing over them, so
  // a settings change repaints without tearing down the simulation.
  useEffect(() => {
    displayRef.current = display;
    nodeColorRef.current = nodeColor;
    edgeLabelsRef.current = edgeLabels;
    draw();
    kick();
  }, [display, nodeColor, edgeLabels, draw, kick]);

  // Persist positions on unmount too, so a navigation keeps the layout.
  useEffect(() => {
    const cache = positionCacheFor(layoutScope);
    return () => {
      const sim = simRef.current;
      // Same guard as the graph effect: only a settled layout is worth keeping,
      // so a mid-bloom unmount does not cache half-animated positions.
      if (sim?.settled) for (const n of sim.nodes) cache.set(n.id, { x: n.x, y: n.y });
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [layoutScope]);

  // ── Sizing ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Observe the container, not the window: the sidebar collapsing changes our
    // width without ever firing a window resize.
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const changed = box.width !== sizeRef.current.w || box.height !== sizeRef.current.h;
      if (!changed) return;
      sizeRef.current = { w: box.width, h: box.height };
      // Resize inside the frame, not in the observer callback, to avoid
      // "ResizeObserver loop completed with undelivered notifications".
      requestAnimationFrame(() => {
        // Re-frame on every resize until the user takes the camera over — this
        // is what keeps the graph centred as the rail grows to full height on
        // mount, and as the sidebar collapses. After a manual zoom/pan, leave
        // their view untouched and just repaint at the new size.
        if (!userAdjustedRef.current) fitToView();
        else draw();
        kick();
      });
    });
    observer.observe(container);

    // A window dragged between a Retina and an external display changes dpr
    // without changing the element's size.
    const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      draw();
      kick();
    };
    dprQuery.addEventListener("change", onDpr);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      reducedRef.current = motionQuery.matches;
    };
    motionQuery.addEventListener("change", onMotion);

    return () => {
      observer.disconnect();
      dprQuery.removeEventListener("change", onDpr);
      motionQuery.removeEventListener("change", onMotion);
    };
  }, [draw, kick, fitToView]);

  // ── Pointer ────────────────────────────────────────────────────────────────

  const dragRef = useRef<{
    id: string | null;
    startX: number;
    startY: number;
    moved: boolean;
    panX: number;
    panY: number;
  } | null>(null);

  const openNode = useCallback(
    (node: GraphNode, newTab: boolean) => {
      if (!node.href) return;
      if (newTab) window.open(node.href, "_blank", "noopener");
      else router.push(node.href);
    },
    [router],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const world = toWorld(sx, sy);
    const hit = simRef.current?.find(world.x, world.y, hitRadius()) ?? null;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: hit?.id ?? null,
      startX: sx,
      startY: sy,
      moved: false,
      panX: transformRef.current.x,
      panY: transformRef.current.y,
    };

    if (hit) {
      hit.fx = hit.x;
      hit.fy = hit.y;
      // Holding alphaTarget warm is what makes the whole graph reflow live
      // under the cursor rather than staying frozen around the dragged node.
      simRef.current?.setAlphaTarget(0.3);
      kick();
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    pointerRef.current = { x: sx, y: sy };

    const drag = dragRef.current;
    if (drag) {
      const dx = sx - drag.startX;
      const dy = sy - drag.startY;
      if (!drag.moved && dx * dx + dy * dy > DRAG_THRESHOLD_SQ) drag.moved = true;
      if (drag.moved) {
        if (drag.id) {
          const node = simRef.current?.get(drag.id);
          if (node) {
            // Convert through the inverse transform every move — forgetting
            // this is the classic bug where a dragged node lags or flies off
            // once the view is zoomed.
            const world = toWorld(sx, sy);
            node.fx = world.x;
            node.fy = world.y;
            simRef.current?.setAlphaTarget(0.3);
          }
        } else {
          userAdjustedRef.current = true;
          transformRef.current = {
            ...transformRef.current,
            x: drag.panX + dx,
            y: drag.panY + dy,
          };
        }
        kick();
      }
      return;
    }

    const world = toWorld(sx, sy);
    const hit = simRef.current?.find(world.x, world.y, hitRadius()) ?? null;
    const next = hit?.id ?? null;
    if (next !== hoverRef.current) {
      hoverRef.current = next;
      hoverCallbackRef.current?.(next ? (nodeById.get(next) ?? null) : null, { x: sx, y: sy });
      kick();
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.id) {
      const node = simRef.current?.get(drag.id);
      // Release rather than pin. Obsidian does not have drag-to-pin — the node
      // drifts back to equilibrium, and that is the behaviour people recognise.
      // The local graph's centre is the exception: it stays anchored at origin.
      if (node && drag.id !== centerId) {
        node.fx = null;
        node.fy = null;
      }
      simRef.current?.setAlphaTarget(0);
    }

    if (!drag.moved && drag.id) {
      const node = nodeById.get(drag.id);
      if (node) {
        setFocusedId(drag.id);
        focusedRef.current = drag.id;
        openNode(node, event.metaKey || event.ctrlKey || event.button === 1);
      }
    }
    kick();
  };

  const onPointerLeave = () => {
    pointerRef.current = null;
    if (hoverRef.current) {
      hoverRef.current = null;
      hoverCallbackRef.current?.(null, null);
      kick();
    }
  };

  // Wheel is bound natively rather than through React so it can be passive:
  // false and actually preventDefault the page scroll.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 40;
      else if (event.deltaMode === 2) delta *= 800;

      const t = transformRef.current;
      const k = clamp(t.k * Math.pow(1.5, -delta / 120), ZOOM_MIN, ZOOM_MAX);
      if (k === t.k) return;
      userAdjustedRef.current = true;
      // Anchor on the cursor when zooming in, on the viewport centre when
      // zooming out. The asymmetry is deliberate: it means zooming out always
      // recovers the whole graph instead of drifting into a corner.
      const ax = k > t.k ? sx : sizeRef.current.w / 2;
      const ay = k > t.k ? sy : sizeRef.current.h / 2;
      transformRef.current = {
        k,
        x: ax - ((ax - t.x) / t.k) * k,
        y: ay - ((ay - t.y) / t.k) * k,
      };
      kick();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [kick]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  const announce = useCallback(
    (node: GraphNode) => {
      setAnnouncement(describeNode(node, neighborsOf(node.id, graphRef.current)));
    },
    [],
  );

  const focusNode = useCallback(
    (id: string) => {
      setFocusedId(id);
      focusedRef.current = id;
      const node = nodeById.get(id);
      if (node) announce(node);
      // Keep the focused node on screen without moving the camera further than
      // it has to.
      const sim = simRef.current;
      const p = sim?.get(id);
      const { w, h } = sizeRef.current;
      if (p && w && h) {
        const t = transformRef.current;
        const sx = p.x * t.k + t.x;
        const sy = p.y * t.k + t.y;
        const m = 48;
        let nx = t.x;
        let ny = t.y;
        if (sx < m) nx += m - sx;
        else if (sx > w - m) nx -= sx - (w - m);
        if (sy < m) ny += m - sy;
        else if (sy > h - m) ny -= sy - (h - m);
        if (nx !== t.x || ny !== t.y) transformRef.current = { ...t, x: nx, y: ny };
      }
      kick();
    },
    [nodeById, announce, kick],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      userAdjustedRef.current = true;
      const t = transformRef.current;
      const k = clamp(t.k * factor, ZOOM_MIN, ZOOM_MAX);
      const { w, h } = sizeRef.current;
      transformRef.current = {
        k,
        x: w / 2 - ((w / 2 - t.x) / t.k) * k,
        y: h / 2 - ((h / 2 - t.y) / t.k) * k,
      };
      kick();
    },
    [kick],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    const current = focusedRef.current;
    const key = event.key;

    if (key === "+" || key === "=" ) {
      event.preventDefault();
      zoomBy(1.3);
      return;
    }
    if (key === "-" || key === "_") {
      event.preventDefault();
      zoomBy(1 / 1.3);
      return;
    }
    if (key === "0") {
      event.preventDefault();
      fitToView();
      setAnnouncement("View reset");
      return;
    }
    if (key === "Enter" || key === " ") {
      if (!current) return;
      event.preventDefault();
      const node = nodeById.get(current);
      if (node) openNode(node, event.metaKey || event.ctrlKey);
      return;
    }

    // Cycle the focused node's connected neighbours. Edge traversal is the one
    // affordance a graph has that a list does not, so it gets first-class keys.
    // PageUp/PageDown rather than [ and ] because bracket keys need a modifier
    // on AZERTY and Nordic layouts.
    if (key === "PageDown" || key === "PageUp" || key === "]" || key === "[") {
      event.preventDefault();
      if (!current) {
        focusNode(nodes[0].id);
        return;
      }
      const neighbors = neighborsOf(current, graphRef.current);
      if (neighbors.length === 0) {
        setAnnouncement(`${nodeById.get(current)?.label ?? ""} has no links.`);
        return;
      }
      const forward = key === "PageDown" || key === "]";
      const at = neighbors.findIndex((n) => n.id === focusedRef.current);
      const next = forward
        ? neighbors[(at + 1 + neighbors.length) % neighbors.length]
        : neighbors[(at - 1 + neighbors.length) % neighbors.length];
      focusNode(next.id);
      return;
    }

    const directions: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
    const dir = directions[key];
    if (!dir) return;
    event.preventDefault();

    if (!current) {
      // Enter at the most connected node — the one a reader would look at first.
      const busiest = [...nodes].sort((a, b) => b.degree - a.degree)[0];
      focusNode(busiest.id);
      return;
    }

    const from = sim.get(current);
    if (!from) return;
    const [dx, dy] = dir;
    let best: string | null = null;
    let bestScore = Infinity;
    for (const node of nodes) {
      if (node.id === current) continue;
      const p = sim.get(node.id);
      if (!p) continue;
      const ox = p.x - from.x;
      const oy = p.y - from.y;
      const along = ox * dx + oy * dy;
      if (along <= 0) continue;
      const across = Math.abs(ox * dy - oy * dx);
      // Distance along the pressed axis plus a penalty for how far off-axis the
      // candidate sits, following the CSS spatial-navigation model. A plain
      // nearest-node test skips obvious neighbours that sit slightly diagonally.
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = node.id;
      }
    }
    if (best) focusNode(best);
  };

  const onFocus = () => {
    if (focusedRef.current || nodesRef.current.length === 0) return;
    const start =
      (centerId && nodeById.has(centerId) ? centerId : null) ??
      [...nodesRef.current].sort((a, b) => b.degree - a.degree)[0]?.id;
    if (start) focusNode(start);
  };

  const onBlur = () => {
    focusedRef.current = null;
    setFocusedId(null);
    kick();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      {/* One tab stop for the whole graph, never one per node.
          role="listbox" rather than role="img" because this thing is genuinely
          operable — arrows move between nodes, Enter opens one — and listbox is
          the composite role that actually supports aria-activedescendant.
          role="application" would work too and is the usual reach here, but it
          drops screen readers out of browse mode and tends to break the entire
          subtree, so it is the wrong tool. */}
      <div
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={focusedId ? `${listId}-${focusedId}` : undefined}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn("h-full w-full rounded-lg", focusRing)}
      >
        {/* aria-hidden keeps the canvas out of the accessibility tree, which is
            also what leaves the listbox owning nothing but options. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="h-full w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={onPointerLeave}
        />
        {/* Nothing inside a <canvas> is ever announced, so the graph's content
            lives here instead. These must stay clipped rather than hidden:
            display:none would drop them from the accessibility tree and
            aria-activedescendant would then fail silently. */}
        {graph.nodes.map((node) => (
          <div
            key={node.id}
            id={`${listId}-${node.id}`}
            role="option"
            aria-selected={focusedId === node.id}
            className="sr-only"
          >
            {node.href
              ? describeNode(node, neighborsOf(node.id, graph))
              : `${node.label}, not created yet.`}
          </div>
        ))}
      </div>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
