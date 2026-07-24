"use client";

import type { GraphNode } from "@/lib/processes-graph";

const KIND_LABELS: Record<GraphNode["kind"], string> = {
  process: "Process",
  connector: "Connector",
};

/**
 * The card that follows the cursor over a graph node — mirrors
 * knowledge/node-preview.tsx's layout exactly. Where that one shows a
 * freshness badge, a process node shows its version; a connector node shows
 * its category instead of an excerpt (connectors have no description text
 * worth surfacing here — the process detail page's aside already does that).
 */
export function ProcessNodePreview({ node, x, y }: { node: GraphNode; x: number; y: number }) {
  return (
    <div
      style={{ left: x + 14, top: y + 14 }}
      className="pointer-events-none absolute z-20 w-64 animate-fade-in rounded-lg border border-border bg-background p-3 shadow-dropdown motion-reduce:animate-none"
    >
      <p className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-body-medium text-gray-12">{node.label}</span>
        <span className="shrink-0 text-caption text-muted">{KIND_LABELS[node.kind]}</span>
      </p>
      {node.kind === "process" && node.excerpt && (
        <p className="mt-1 line-clamp-2 text-caption text-muted">{node.excerpt}</p>
      )}
      <p className="mt-2 flex items-center gap-2 text-caption text-muted">
        {node.kind === "process" && node.version !== undefined && <span>Version {node.version}</span>}
        {node.kind === "connector" && node.category && <span>{node.category}</span>}
        <span className="ml-auto shrink-0">
          {node.degree} link{node.degree === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  );
}
