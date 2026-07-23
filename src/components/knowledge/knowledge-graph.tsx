"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MaximizeIcon, SettingsIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import {
  DEFAULT_SETTINGS,
  GRAPH_COOKIE,
  serializeSettings,
  writeGraphCookie,
  type GraphSettings,
} from "@/lib/graph-settings";
import { buildGraph, colorLegend, type GraphNode, type NodeKind } from "@/lib/knowledge-graph";
import { LABEL_DOT_COLORS } from "@/lib/mock-data";
import { GraphCanvas } from "./graph-canvas";
import { GraphSettingsPanel } from "./graph-settings-panel";
import { NodePreview } from "./node-preview";

export function KnowledgeGraph({ initialSettings }: { initialSettings: GraphSettings }) {
  const [settings, setSettings] = useState<GraphSettings>(initialSettings);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hovered, setHovered] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const graph = useMemo(() => buildGraph(settings.filters), [settings.filters]);
  const legend = useMemo(
    () => colorLegend(settings.colorBy, LABEL_DOT_COLORS),
    [settings.colorBy],
  );

  // Persist debounced, the way Obsidian does — a slider drag would otherwise
  // write a cookie on every animation frame.
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      writeGraphCookie(GRAPH_COOKIE, serializeSettings(settings));
    }, 2000);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [settings]);

  const docCount = graph.nodes.filter((n) => n.kind === "doc").length;

  // What each node *shape* means — the counterpart to the colour legend. Only
  // the kinds actually on screen appear, and the swatch mirrors the node shape
  // (circle / square / ring) in neutral grey, so shape reads as its own signal
  // independent of whatever "Color by" is set to.
  const shapes = useMemo(() => {
    const present = new Set(graph.nodes.map((n) => n.kind));
    const order: { kind: NodeKind; label: string }[] = [
      { kind: "doc", label: "Doc" },
      { kind: "process", label: "Process" },
      { kind: "connector", label: "Connector" },
    ];
    return order.filter((s) => present.has(s.kind));
  }, [graph]);

  return (
    <div className="relative h-full w-full rounded-lg border border-border bg-gray-1">
      <GraphCanvas
        key={resetKey}
        graph={graph}
        colorBy={settings.colorBy}
        display={settings.display}
        forces={settings.forces}
        ariaLabel={`Knowledge graph, ${graph.nodes.length} nodes, ${graph.edges.length} links. Use arrow keys to move between nodes, Page Down to follow a link, Enter to open.`}
        onHoverChange={(node, screen) =>
          setHovered(node && screen ? { node, x: screen.x, y: screen.y } : null)
        }
      />

      {hovered && <NodePreview node={hovered.node} x={hovered.x} y={hovered.y} />}

      {/* Controls float over the canvas at the top right, where Obsidian puts
          its cog. The panel anchors under it — Obsidian never documents which
          corner its own box uses, so this is a free choice, and hanging it off
          the trigger is the one that needs no explanation. */}
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background p-0.5 shadow-dropdown">
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            aria-label="Reset view"
            title="Reset view (0)"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
              focusRing,
            )}
          >
            <MaximizeIcon />
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-label="Open graph settings"
            aria-expanded={panelOpen}
            aria-controls="graph-settings-panel"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-100 active:scale-95 motion-reduce:transition-none",
              panelOpen
                ? "bg-interactive-checked text-gray-12"
                : "text-icon hover:bg-interactive-hovered",
              focusRing,
            )}
          >
            <SettingsIcon />
          </button>
        </div>
        {panelOpen && (
          <div
            id="graph-settings-panel"
            className="pointer-events-auto animate-panel-in motion-reduce:animate-none"
          >
            <GraphSettingsPanel
              settings={settings}
              onChange={setSettings}
              onReset={() => {
                setSettings(DEFAULT_SETTINGS);
                setResetKey((k) => k + 1);
              }}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Counts and legend. The legend is not decoration: it is what stops the
          graph encoding meaning in colour alone. */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-background/80 px-2 py-1">
        <span className="text-caption text-muted">
          {docCount} doc{docCount === 1 ? "" : "s"} · {graph.edges.length} links
        </span>
        {shapes.map((shape) => (
          <span key={shape.kind} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0",
                shape.kind === "process" && "rounded-[2px] bg-gray-9",
                shape.kind === "doc" && "rounded-full bg-gray-9",
                shape.kind === "connector" && "rounded-full border-[1.5px] border-gray-9",
              )}
            />
            <span className="text-caption text-muted">{shape.label}</span>
          </span>
        ))}
        {legend.length > 0 && (
          <span aria-hidden="true" className="h-3 w-px shrink-0 bg-gray-5" />
        )}
        {legend.map((entry) => (
          <span key={entry.label} className="flex items-center gap-1.5">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-caption text-muted">{entry.label}</span>
          </span>
        ))}
      </div>

      {graph.nodes.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-body text-muted">
          Nothing matches these filters.
        </p>
      )}
    </div>
  );
}
