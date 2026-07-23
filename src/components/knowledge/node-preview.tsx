"use client";

import { freshnessLabel, freshnessTextClassName } from "@/lib/doc-freshness";
import type { GraphNode } from "@/lib/knowledge-graph";

const KIND_LABELS: Record<GraphNode["kind"], string> = {
  doc: "Doc",
  note: "Note",
  source: "Source",
  unresolved: "Not created yet",
};

/**
 * The card that follows the cursor over a graph node. Obsidian gates its
 * equivalent behind Cmd/Ctrl-hover; ours shows on plain hover because the card
 * is a four-line summary rather than a page preview, and needing a modifier to
 * identify a dot is a poor trade in a small graph.
 */
export function NodePreview({ node, x, y }: { node: GraphNode; x: number; y: number }) {
  return (
    <div
      // Offset from the cursor rather than centred on it, so the card never
      // sits under the pointer and steals the hover it is describing.
      style={{ left: x + 14, top: y + 14 }}
      className="pointer-events-none absolute z-20 w-64 animate-fade-in rounded-lg border border-border bg-background p-3 shadow-dropdown motion-reduce:animate-none"
    >
      <p className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-body-medium text-gray-12">{node.label}</span>
        <span className="shrink-0 text-caption text-muted">{KIND_LABELS[node.kind]}</span>
      </p>
      {node.excerpt && (
        <p className="mt-1 line-clamp-2 text-caption text-muted">{node.excerpt}</p>
      )}
      <p className="mt-2 flex items-center gap-2 text-caption text-muted">
        {node.freshness && (
          <span className={freshnessTextClassName[node.freshness]}>
            {freshnessLabel[node.freshness]}
          </span>
        )}
        <span className="ml-auto shrink-0">
          {node.degree} link{node.degree === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  );
}
