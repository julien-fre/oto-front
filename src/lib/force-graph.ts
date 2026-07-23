// A force-directed layout, hand-rolled. No dependency, no DOM, no React.
//
// Obsidian's graph runs a vendored fork of d3-force, so matching d3's math is
// what makes the result feel like Obsidian rather than merely look like it.
// Five forces, applied in this order every tick: X, Y, link, many-body,
// collide — the same assembly Obsidian's worker uses.
//
// At our size (tens of nodes, ceiling ~200) the O(n^2) many-body loop is the
// right call: 200 nodes is 19,900 pairs of ~10 flops, ~1-3% of a frame budget.
// d3's Barnes-Hut approximation only starts winning around n=1000 because it
// rebuilds a quadtree every tick. If this ever needs to scale, the cheap next
// step is a distance cutoff or a uniform grid, not a quadtree.
//
// Four details below are the ones a naive implementation gets wrong; each is
// commented where it happens. In short: charge falls off as 1/d and not 1/d^2,
// the link force projects velocity rather than position, centering is applied
// to velocity, and the integrator is deliberately dt-free.

export type SimNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Non-null while dragged: position is pinned and velocity forced to zero. */
  fx: number | null;
  fy: number | null;
  /** Collision radius. Obsidian uses a flat 60 regardless of drawn size. */
  radius: number;
};

export type SimLink = { source: string; target: string };

/** The four values behind the Forces group, on Obsidian's own slider scale. */
export type ForceParams = {
  /** 0-1. Slider default 0.518713248970312, which log-maps to strength 0.1. */
  center: number;
  /** 0-20. Cubed and negated: the default 10 becomes -1000. */
  repel: number;
  /** 0-1, log-mapped. Default 1 = maximum. */
  linkForce: number;
  /** 30-500, passed through untouched. Default 250. */
  linkDistance: number;
};

export const DEFAULT_FORCES: ForceParams = {
  center: 0.518713248970312,
  repel: 10,
  linkForce: 1,
  linkDistance: 250,
};

export const FORCE_RANGES = {
  center: { min: 0, max: 1, step: 0.001 },
  repel: { min: 0, max: 20, step: 0.1 },
  linkForce: { min: 0, max: 1, step: 0.001 },
  linkDistance: { min: 30, max: 500, step: 1 },
} as const;

const ALPHA_MIN = 0.001;
// Decays alpha from 1 to ALPHA_MIN in exactly 300 ticks (~5s at 60fps).
const ALPHA_DECAY = 1 - Math.pow(0.001, 1 / 300);
/** Every mutation and every drag reheats to this, never higher. */
export const REHEAT_ALPHA = 0.3;
// d3's velocityDecay default is 0.4, which internally means "multiply by 0.6".
// Multiplying by 0.4 instead gives a sluggish, over-damped graph — this is the
// single most common transcription error in a hand-rolled d3 port.
const VELOCITY_MULT = 0.6;
const COLLIDE_RADIUS = 60;
const COLLIDE_STRENGTH = 0.5;
const DISTANCE_MIN_SQ = 900; // Obsidian's distanceMin(30), squared
export const TICKS_TO_SETTLE = 300;

/**
 * Obsidian's slider→strength curve, used for Center force and Link force.
 * Concentrates resolution at the low end, so the useful range isn't crammed
 * into the first 5% of travel.
 */
function logMap(slider: number, t = 0.01): number {
  return (Math.pow(t, 1 - slider) - t) / (1 - t);
}

/** Breaks the tie when two nodes land on exactly the same point. */
function jiggle(): number {
  return (Math.random() - 0.5) * 1e-6;
}

/**
 * Deterministic initial placement on a phyllotaxis spiral — the same seeding
 * d3 uses. Deterministic matters twice over here: random seeding is the usual
 * cause of an ugly first-frame explosion, and it would also put Math.random()
 * on the render path where server and client must agree.
 */
export function seedPosition(index: number): { x: number; y: number } {
  const radius = 10 * Math.sqrt(0.5 + index);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

export type Simulation = ReturnType<typeof createSimulation>;

export function createSimulation(
  nodes: SimNode[],
  links: SimLink[],
  params: ForceParams = DEFAULT_FORCES,
) {
  let alpha = 1;
  let alphaTarget = 0;
  let forces = params;

  const index = new Map<string, SimNode>();
  // Resolved once per data change rather than per tick — a per-tick lookup of
  // both endpoints is the hot loop's biggest avoidable cost.
  let edges: { s: SimNode; t: SimNode; strength: number; bias: number }[] = [];

  function reindex() {
    index.clear();
    for (const n of nodes) index.set(n.id, n);

    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }

    edges = [];
    for (const l of links) {
      const s = index.get(l.source);
      const t = index.get(l.target);
      if (!s || !t) continue;
      const ds = degree.get(l.source) ?? 1;
      const dt = degree.get(l.target) ?? 1;
      // Degree normalization plus mass bias. This is what makes a hub sit
      // still while its leaves swing around it; without it every node has the
      // same inertia and the layout reads as a uniform blob rather than
      // hub-and-spoke.
      edges.push({ s, t, strength: 1 / Math.min(ds, dt), bias: ds / (ds + dt) });
    }
  }

  reindex();

  function step() {
    const n = nodes.length;
    const centerStrength = logMap(forces.center);
    const linkStrength = logMap(forces.linkForce);
    // Cubing makes the slider feel linear at the bottom and explode at the top.
    let charge = -(forces.repel * forces.repel * forces.repel);
    if (Math.abs(charge) < 1) charge = -1;

    // 1 & 2 — Center force. Not d3's forceCenter (which rigidly translates the
    // whole system); Obsidian uses forceX(0) + forceY(0), a per-node pull on
    // velocity. It is also what stops disconnected nodes drifting off-screen.
    if (centerStrength > 0) {
      for (const node of nodes) {
        node.vx -= node.x * centerStrength * alpha;
        node.vy -= node.y * centerStrength * alpha;
      }
    }

    // 3 — Link spring.
    for (const e of edges) {
      // Projecting the *current velocity* rather than raw position is what
      // keeps springs from oscillating. Using e.t.x - e.s.x here gives a
      // visibly jittery graph that never quite settles.
      let dx = e.t.x + e.t.vx - e.s.x - e.s.vx;
      let dy = e.t.y + e.t.vy - e.s.y - e.s.vy;
      if (dx === 0) dx = jiggle();
      if (dy === 0) dy = jiggle();
      const dist = Math.sqrt(dx * dx + dy * dy);
      const l = ((dist - forces.linkDistance) / dist) * alpha * e.strength * linkStrength;
      dx *= l;
      dy *= l;
      e.t.vx -= dx * e.bias;
      e.t.vy -= dy * e.bias;
      e.s.vx += dx * (1 - e.bias);
      e.s.vy += dy * (1 - e.bias);
    }

    // 4 — Many-body repulsion, exact, using Newton's third law so each pair is
    // visited once.
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (dx === 0) dx = jiggle();
        if (dy === 0) dy = jiggle();
        let l = dx * dx + dy * dy;
        // Geometric mean rather than a hard floor, so the force stays
        // continuous as two nodes converge instead of snapping at the cutoff.
        if (l < DISTANCE_MIN_SQ) l = Math.sqrt(DISTANCE_MIN_SQ * l);
        // The delta is deliberately NOT normalized: dividing an unnormalized
        // delta by the SQUARED distance yields a magnitude of strength*alpha/d,
        // i.e. inverse-LINEAR falloff. Writing the intuitive inverse-square law
        // here makes distant clusters drift apart and close nodes explode.
        const w = (charge * alpha) / l;
        a.vx -= dx * w;
        a.vy -= dy * w;
        b.vx += dx * w;
        b.vy += dy * w;
      }
    }

    // 5 — Collision. Obsidian applies a flat 60-unit radius independent of the
    // drawn node size; it is what enforces minimum spacing no matter where the
    // repel slider sits, and a real part of the look.
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        const r = a.radius + b.radius;
        let dx = b.x + b.vx - a.x - a.vx;
        let dy = b.y + b.vy - a.y - a.vy;
        let l = dx * dx + dy * dy;
        if (l >= r * r) continue;
        if (dx === 0) dx = jiggle();
        if (dy === 0) dy = jiggle();
        l = Math.sqrt(l);
        const push = ((r - l) / l) * COLLIDE_STRENGTH;
        dx *= push;
        dy *= push;
        const br = b.radius * b.radius;
        const share = br / (a.radius * a.radius + br);
        a.vx -= dx * share;
        a.vy -= dy * share;
        b.vx += dx * (1 - share);
        b.vy += dy * (1 - share);
      }
    }

    // 6 — Integrate. Fixed step with no dt term, on purpose: a dt-scaled
    // integrator would destabilize whenever requestAnimationFrame is throttled
    // in a background tab or a frame runs long. Do not "fix" this.
    for (const node of nodes) {
      if (node.fx == null) {
        node.vx *= VELOCITY_MULT;
        node.x += node.vx;
      } else {
        node.x = node.fx;
        node.vx = 0;
      }
      if (node.fy == null) {
        node.vy *= VELOCITY_MULT;
        node.y += node.vy;
      } else {
        node.y = node.fy;
        node.vy = 0;
      }
    }
  }

  return {
    get nodes() {
      return nodes;
    },
    get alpha() {
      return alpha;
    },
    /** True once the layout has come to rest and the render loop can stop. */
    get settled() {
      return alpha < ALPHA_MIN;
    },
    /** Advance one frame. Returns false when there is nothing left to do. */
    tick(): boolean {
      if (alpha < ALPHA_MIN) return false;
      alpha += (alphaTarget - alpha) * ALPHA_DECAY;
      step();
      return true;
    },
    /** Run to convergence without painting — used under reduced motion. */
    settle(ticks = TICKS_TO_SETTLE) {
      for (let i = 0; i < ticks; i++) {
        alpha += (alphaTarget - alpha) * ALPHA_DECAY;
        step();
      }
      alpha = ALPHA_MIN / 2;
    },
    reheat(to = REHEAT_ALPHA) {
      if (alpha < to) alpha = to;
    },
    /**
     * Place every free node at `scale` times its position in `origin` — pulled
     * toward the centre, ready to spring back out. Used for the entry bloom.
     * Absolute (from a snapshot) rather than relative (scaling current
     * positions) so that running it twice lands in the same place — dev-mode
     * StrictMode double-invokes the effect that calls this, and a relative
     * scale would compound. Pinned nodes and nodes missing from the snapshot
     * stay put.
     */
    perturbFrom(origin: Map<string, { x: number; y: number }>, scale: number) {
      for (const n of nodes) {
        const at = origin.get(n.id);
        if (!at) continue;
        if (n.fx == null) n.x = at.x * scale;
        if (n.fy == null) n.y = at.y * scale;
      }
    },
    /**
     * Declare the layout already at rest. Used when every node came back from
     * a position cache: the nodes are where a previous run left them, so
     * running physics over them again would only shuffle a settled graph.
     */
    freeze() {
      alpha = ALPHA_MIN / 2;
      alphaTarget = 0;
    },
    /** Holds the simulation warm while a node is being dragged. */
    setAlphaTarget(value: number) {
      alphaTarget = value;
      if (value > alpha) alpha = value;
    },
    setForces(next: ForceParams) {
      forces = next;
      this.reheat();
    },
    setData(nextNodes: SimNode[], nextLinks: SimLink[]) {
      nodes = nextNodes;
      links = nextLinks;
      reindex();
      this.reheat();
    },
    get(id: string) {
      return index.get(id);
    },
    /**
     * Nearest node within `radius`, or null. A linear scan, the same as
     * d3-force's own simulation.find(): nearest-center is the right rule for a
     * graph, where hit areas are inflated past the drawn radius and overlap.
     */
    find(x: number, y: number, radius: number): SimNode | null {
      let best: SimNode | null = null;
      let bestDist = radius * radius;
      for (const node of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          best = node;
          bestDist = d2;
        }
      }
      return best;
    },
  };
}

export { COLLIDE_RADIUS };
