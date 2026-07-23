"use client";

import { useMemo, useState } from "react";
import { PinIcon } from "@/components/icons";
import { Slider } from "@/components/slider";
import { cn, focusRing } from "@/lib/cn";
import { DEFAULT_FORCES } from "@/lib/force-graph";
import {
  DEFAULT_LOCAL_FILTERS,
  docNodeId,
  localGraph,
  MAX_LOCAL_DEPTH,
  type ColorBy,
} from "@/lib/knowledge-graph";
import { DEFAULT_DISPLAY, GraphCanvas } from "./graph-canvas";

// The local graph runs at a smaller link distance than the global one: at
// depth 1-2 there is little to untangle, and Obsidian's 250 would push a
// dozen nodes far outside a 288px rail.
const RAIL_FORCES = { ...DEFAULT_FORCES, linkDistance: 110, repel: 7 };
const RAIL_DISPLAY = { ...DEFAULT_DISPLAY, nodeSize: 0.85, textFade: -1.5 };

export function LocalGraph({ slug, colorBy = "folder" }: { slug: string; colorBy?: ColorBy }) {
  const [filters, setFilters] = useState(DEFAULT_LOCAL_FILTERS);
  // Pinning freezes the graph on the doc it was showing, so you can walk away
  // from a hub and keep its neighbourhood on screen. Obsidian gets this via
  // tab pinning, which is discoverable only if you already know about it.
  const [pinnedTo, setPinnedTo] = useState<string | null>(null);
  const centerSlug = pinnedTo ?? slug;
  const centerId = docNodeId(centerSlug);

  const graph = useMemo(() => localGraph(centerId, filters), [centerId, filters]);

  const directions = [
    { key: "incoming" as const, label: "In", hint: "Links from other docs" },
    { key: "outgoing" as const, label: "Out", hint: "Links to other docs" },
    { key: "neighborLinks" as const, label: "Between", hint: "Links among neighbors" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="h-64 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-1">
        <GraphCanvas
          graph={graph}
          colorBy={colorBy}
          display={RAIL_DISPLAY}
          forces={RAIL_FORCES}
          centerId={centerId}
          depth={filters.depth}
          compact
          ariaLabel={`Local graph, ${graph.nodes.length} nodes within ${filters.depth} link${
            filters.depth === 1 ? "" : "s"
          }. Arrow keys move between nodes, Enter opens.`}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <Slider
          label="Depth"
          value={filters.depth}
          min={1}
          max={MAX_LOCAL_DEPTH}
          step={1}
          format={(v) => String(v)}
          onChange={(depth) => setFilters((f) => ({ ...f, depth }))}
        />
        <div className="flex items-center gap-1">
          {directions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, [d.key]: !f[d.key] }))}
              aria-pressed={filters[d.key]}
              title={d.hint}
              className={cn(
                "flex h-7 flex-1 items-center justify-center rounded-full px-2 text-caption",
                filters[d.key]
                  ? "bg-interactive-checked text-gray-12"
                  : "text-muted hover:bg-interactive-hovered",
                focusRing,
              )}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPinnedTo((p) => (p ? null : slug))}
            aria-pressed={pinnedTo !== null}
            aria-label={pinnedTo ? "Unpin local graph" : "Pin local graph to this doc"}
            title={pinnedTo ? "Unpin local graph" : "Pin local graph to this doc"}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-100 active:scale-95 motion-reduce:transition-none",
              pinnedTo ? "bg-interactive-checked text-gray-12" : "text-icon hover:bg-interactive-hovered",
              focusRing,
            )}
          >
            <PinIcon />
          </button>
        </div>
        {!filters.incoming && !filters.outgoing && (
          // Worth saying out loud: with both directions off the walk can never
          // leave the centre, so the lone node on screen is correct, not broken.
          <p className="text-caption text-muted">
            Both directions are off, so only this doc is shown.
          </p>
        )}
        {pinnedTo && pinnedTo !== slug && (
          <p className="text-caption text-muted">Pinned to another doc.</p>
        )}
      </div>
    </div>
  );
}
