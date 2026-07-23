"use client";

import { useEffect, useState } from "react";
import { GraphIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { DOC_RAIL_COOKIE, writeGraphCookie } from "@/lib/graph-settings";
import { LocalGraph } from "./local-graph";

// The document's context rail, holding exactly one thing: the local graph.
// (It briefly carried Links and Outline tabs too; cut by design review — the
// graph is the rail's whole reason to exist, and the link counts already live
// in the property block.) The toggle wears the graph icon in both states,
// because that is what the button shows and hides.

export function DocRail({ slug, defaultOpen }: { slug: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    writeGraphCookie(DOC_RAIL_COOKIE, open ? "open" : "closed");
  }, [open]);

  if (!open) {
    return (
      // Collapsed, the toggle is a labelled secondary button rather than a bare
      // icon — a lone 15px glyph floating in the page margin is invisible.
      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className={cn(
            "flex h-7 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <GraphIcon className="shrink-0 text-icon" />
          Graph
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Document graph"
      // A rounded card inset from the page edges, Linear-style, rather than a
      // column bolted to the right border. On the desktop shell it sticks to
      // the viewport and takes its full height, so the graph inside it has room
      // to be read; below the breakpoint it stacks under the document with a
      // plain top border, since there is no width there for two columns.
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 border-t border-border px-4 py-4",
        "shell:sticky shell:top-2 shell:my-2 shell:mr-2 shell:h-[calc(100dvh-4.5rem)] shell:w-96",
        "shell:self-start shell:rounded-xl shell:border shell:border-border shell:px-4 shell:py-3",
      )}
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-body-medium text-gray-12">Graph</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide graph"
          aria-expanded
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <GraphIcon />
        </button>
      </div>

      <LocalGraph slug={slug} />
    </aside>
  );
}
