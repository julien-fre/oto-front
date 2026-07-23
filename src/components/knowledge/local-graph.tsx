"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/slider";
import { DEFAULT_FORCES } from "@/lib/force-graph";
import {
  DEFAULT_LOCAL_FILTERS,
  docNodeId,
  localGraph,
  MAX_LOCAL_DEPTH,
  type ColorBy,
} from "@/lib/knowledge-graph";
import { DEFAULT_DISPLAY, GraphCanvas } from "./graph-canvas";

// A wide rail and a tall canvas let the layout breathe: a longer link distance
// spreads the neighbourhood out so labels stop colliding, and the canvas is now
// large enough that fit-to-view zooms in far enough to read them. Full-size
// nodes with an early label fade keep every name legible at rest.
const RAIL_FORCES = { ...DEFAULT_FORCES, linkDistance: 120, repel: 8 };
const RAIL_DISPLAY = { ...DEFAULT_DISPLAY, nodeSize: 1, textFade: -1 };

export function LocalGraph({ slug, colorBy = "folder" }: { slug: string; colorBy?: ColorBy }) {
  // Direction and neighbour toggles are gone — the graph always shows the full
  // neighbourhood (incoming + outgoing), which is what you want beside the doc
  // you are reading. Depth is the one control that stays.
  const [depth, setDepth] = useState(DEFAULT_LOCAL_FILTERS.depth);
  const centerId = docNodeId(slug);
  const filters = useMemo(() => ({ ...DEFAULT_LOCAL_FILTERS, depth }), [depth]);
  const graph = useMemo(() => localGraph(centerId, filters), [centerId, filters]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* flex-1 fills the fixed-height rail on desktop; the min-height is the
          floor so it stays readable below the breakpoint, where the stacked
          rail has no bounded height for flex-1 to resolve against. */}
      <div className="min-h-[22rem] flex-1 overflow-hidden rounded-lg border border-border bg-gray-1">
        <GraphCanvas
          graph={graph}
          colorBy={colorBy}
          display={RAIL_DISPLAY}
          forces={RAIL_FORCES}
          centerId={centerId}
          depth={filters.depth}
          compact
          // Let a handful of nodes fill the tall rail canvas, so their labels
          // are read at a comfortable size rather than framed tiny.
          fitZoomMax={2.6}
          // Its own layout space, per doc — so it never inherits the global
          // graph's sprawling positions, and returning to a doc finds its
          // local graph where it was left.
          layoutScope={`local:${centerId}`}
          ariaLabel={`Local graph, ${graph.nodes.length} nodes within ${filters.depth} link${
            filters.depth === 1 ? "" : "s"
          } of this doc. Arrow keys move between nodes, Enter opens.`}
        />
      </div>
      <Slider
        label="Depth"
        value={depth}
        min={1}
        max={MAX_LOCAL_DEPTH}
        step={1}
        format={(v) => String(v)}
        onChange={setDepth}
      />
    </div>
  );
}
