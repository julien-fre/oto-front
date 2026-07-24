"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GraphCanvas } from "@/components/knowledge/graph-canvas";
import { MaximizeIcon, SettingsIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import {
  DEFAULT_SETTINGS,
  GRAPH_COOKIE,
  parseSettings,
  serializeSettings,
  writeGraphCookie,
  type GraphSettings,
} from "@/lib/processes-graph-settings";
import {
  buildGraph,
  colorLegend,
  EDGE_LABELS,
  nodeColor,
  type GraphNode,
  type NodeKind,
} from "@/lib/processes-graph";
import type { RealProcess } from "@/lib/processes-api";
import { ProcessNodePreview } from "./process-node-preview";
import { ProcessesGraphSettingsPanel } from "./processes-graph-settings-panel";
import { useProcessesGraph } from "./use-processes-graph";

const EMPTY_PROCESSES: RealProcess[] = [];

function readSettingsCookie(): GraphSettings {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${GRAPH_COOKIE}=`))
    ?.slice(GRAPH_COOKIE.length + 1);
  return parseSettings(raw);
}

// Mirrors knowledge/knowledge-graph.tsx's shape file-for-file — same toolbar,
// hover preview, counts+legend overlay, empty states. The one structural
// difference is the fetch: this owns useProcessesGraph() (the per-process
// body fetch needed for tools/connector edges) instead of receiving an
// already-fetched KnowledgeBase as a prop.
export function ProcessesGraph() {
  const graphState = useProcessesGraph();
  const [settings, setSettings] = useState<GraphSettings>(readSettingsCookie);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hovered, setHovered] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const processes: RealProcess[] = graphState.kind === "ready" ? graphState.processes : EMPTY_PROCESSES;
  const graph = useMemo(
    () => buildGraph(processes, settings.filters),
    [processes, settings.filters],
  );
  const legend = useMemo(() => colorLegend(settings.colorBy), [settings.colorBy]);

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

  const processCount = graph.nodes.filter((n) => n.kind === "process").length;

  const shapes = useMemo(() => {
    const present = new Set(graph.nodes.map((n) => n.kind));
    const order: { kind: NodeKind; label: string }[] = [
      { kind: "process", label: "Process" },
      { kind: "connector", label: "Connector" },
    ];
    return order.filter((s) => present.has(s.kind));
  }, [graph]);

  if (graphState.kind === "loading" || graphState.kind === "idle") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-gray-1 text-body text-muted">
        Loading processes…
      </div>
    );
  }

  if (graphState.kind === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-gray-1 text-body text-muted">
        Couldn&apos;t load processes — {graphState.message}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg border border-border bg-gray-1">
      <GraphCanvas
        key={resetKey}
        graph={graph}
        nodeColor={(node) => nodeColor(node as GraphNode, settings.colorBy)}
        edgeLabels={EDGE_LABELS}
        display={settings.display}
        forces={settings.forces}
        layoutScope="processes-global"
        ariaLabel={`Processes graph, ${graph.nodes.length} nodes, ${graph.edges.length} links. Use arrow keys to move between nodes, Page Down to follow a link, Enter to open.`}
        onHoverChange={(node, screen) =>
          setHovered(node && screen ? { node: node as GraphNode, x: screen.x, y: screen.y } : null)
        }
      />

      {hovered && <ProcessNodePreview node={hovered.node} x={hovered.x} y={hovered.y} />}

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
            aria-controls="processes-graph-settings-panel"
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
            id="processes-graph-settings-panel"
            className="pointer-events-auto animate-panel-in motion-reduce:animate-none"
          >
            <ProcessesGraphSettingsPanel
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

      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-background/80 px-2 py-1">
        <span className="text-caption text-muted">
          {processCount} process{processCount === 1 ? "" : "es"} · {graph.edges.length} link
          {graph.edges.length === 1 ? "" : "s"}
        </span>
        {shapes.map((shape) => (
          <span key={shape.kind} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0",
                shape.kind === "process" && "rounded-full bg-gray-9",
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
          {processes.length === 0
            ? "No named procedures yet for this org."
            : "Nothing matches these filters."}
        </p>
      )}
    </div>
  );
}
