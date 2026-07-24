"use client";

import { cn, focusRing } from "@/lib/cn";

/**
 * The knowledge pages' error state: what happened, then the way out. The
 * provider keeps the refresh; this keeps the copy — shared so the list, graph
 * and doc pages fail identically.
 */
export function KnowledgeError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <p>Couldn&apos;t load the knowledge base — {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "h-7 rounded-full border border-border px-3 text-button text-gray-12 hover:bg-gray-2",
          focusRing,
        )}
      >
        Try again
      </button>
    </>
  );
}
