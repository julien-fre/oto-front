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
import { readGraphTheme, type GraphTheme } from "@/lib/graph-theme";
import {
  describeNode,
  EDGE_LABELS,
  neighborsOf,
  nodeColor,
  nodeWeight,
  type ColorBy,
  type Graph,
  type GraphNode,
} from "@/lib/knowledge-graph";
import { LABEL_DOT_COLORS } from "@/lib/mock-data";

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
  edgeLabels: true,
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
const positionCache = new Map<string, { x: number; y: number }>();

const ZOOM_MIN = 1 / 128;
const ZOOM_MAX = 8;
const DRAG_THRESHOLD_SQ = 25; // 5px, Obsidian's exact click-vs-drag cutoff
const DIM = 0.2; // what everything unrelated to the hovered node fades to
const EASE = 0.1; // per-frame lerp: new = old * 0.9 + target * 0.1
const HIT_SLOP = 6;

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
  colorBy: ColorBy;
  display: DisplaySettings;
  forces: ForceParams;
  /** Local graph only: the node to mark as focused and size the rings from. */
  centerId?: string;
  depth?: number;
  /** Rail mode — smaller labels, no edge labels, no keyboard zoom hints. */
  compact?: boolean;
  ariaLabel: string;
  className?: string;
  onHoverChange?: (node: GraphNode | null, screen: { x: number; y: number } | null) => void;
};

export function GraphCanvas({
  graph,
  colorBy,
  display,
  forces,
  centerId,
  depth,
  compact = false,
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
  const colorByRef = useRef(colorBy);
  const focusedRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

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
        const label = EDGE_LABELS[e.kind];
        const fontSize = 11 / t.k;
        ctx.font = `${fontSize}px var(--font-inter), ui-sans-serif, sans-serif`;
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
      ctx.fillStyle = isHovered
        ? theme.ink
        : nodeColor(node, colorByRef.current, LABEL_DOT_COLORS);

      // Shape carries the node's kind, so type is never encoded by colour
      // alone: a filled circle is a doc, a rounded square a process, a ring a
      // connector.
      ctx.beginPath();
      if (node.kind === "process") {
        const s = r * 0.9;
        ctx.roundRect(p.x - s, p.y - s, s * 2, s * 2, s * 0.4);
        ctx.fill();
      } else if (node.kind === "connector") {
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
      ctx.font = `${fontSize}px var(--font-inter), ui-sans-serif, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHovered || isFocused ? theme.ink : theme.label;
      ctx.fillText(node.label, p.x, p.y + r + 5 * scale);
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
   *  a deliberate addition — "I lost the graph" is its top complaint. */
  const fitToView = useCallback(() => {
    const sim = simRef.current;
    const { w, h } = sizeRef.current;
    if (!sim || w === 0 || h === 0 || sim.nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of sim.nodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    }
    const pad = 80;
    const width = maxX - minX + pad * 2;
    const height = maxY - minY + pad * 2;
    const k = clamp(Math.min(w / width, h / height), ZOOM_MIN, 1.5);
    transformRef.current = {
      k,
      x: w / 2 - ((minX + maxX) / 2) * k,
      y: h / 2 - ((minY + maxY) / 2) * k,
    };
    kick();
  }, [kick]);

  // ── Simulation lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    themeRef.current = readGraphTheme();
    reducedRef.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useEffect(() => {
    nodesRef.current = graph.nodes;
    graphRef.current = graph;
    labelWidthRef.current.clear();

    const placed = new Map<string, { x: number; y: number }>();
    for (const node of graph.nodes) {
      const cached = positionCache.get(node.id);
      if (cached) placed.set(node.id, cached);
    }

    const simNodes: SimNode[] = graph.nodes.map((node, i) => {
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
    const hasNewNodes = graph.nodes.some((n) => !positionCache.has(n.id));
    if (hasNewNodes) sim.settle();
    else sim.freeze();

    for (const n of sim.nodes) positionCache.set(n.id, { x: n.x, y: n.y });

    fitToView();
    draw();

    return () => {
      for (const n of sim.nodes) positionCache.set(n.id, { x: n.x, y: n.y });
    };
    // `forces` is applied via its own effect below so a slider drag does not
    // rebuild the simulation and throw away every position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, draw, fitToView, kick]);

  useEffect(() => {
    simRef.current?.setForces(forces);
    kick();
  }, [forces, kick]);

  // The render loop reads these through refs rather than closing over them, so
  // a settings change repaints without tearing down the simulation.
  useEffect(() => {
    displayRef.current = display;
    colorByRef.current = colorBy;
    draw();
    kick();
  }, [display, colorBy, draw, kick]);

  // Persist positions on unmount too, so a navigation keeps the layout.
  useEffect(() => {
    return () => {
      const sim = simRef.current;
      if (sim) for (const n of sim.nodes) positionCache.set(n.id, { x: n.x, y: n.y });
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

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
      const first = sizeRef.current.w === 0;
      sizeRef.current = { w: box.width, h: box.height };
      // Resize inside the frame, not in the observer callback, to avoid
      // "ResizeObserver loop completed with undelivered notifications".
      requestAnimationFrame(() => {
        if (first) fitToView();
        draw();
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
      if (node) {
        // Release rather than pin. Obsidian does not have drag-to-pin — the
        // node drifts back to equilibrium, and that is the behaviour people
        // recognise.
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
