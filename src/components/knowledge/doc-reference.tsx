"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import { freshnessLabel, freshnessTextClassName } from "@/lib/doc-freshness";
import { docAccentColor, formatDocDate } from "@/lib/knowledge-api";
import { useKnowledge } from "./knowledge-provider";

const PREVIEW_DELAY = 300; // Obsidian's hover-preview wait

/**
 * An inline [[wikilink]] to another doc, mid-sentence.
 *
 * The leading dot carries the target's identity color — the same one the
 * sidebar and the graph use — so a doc looks like itself everywhere it
 * appears. `docId` arrives as the string the markdown converter resolved;
 * if the doc has since vanished from the KB it degrades to the stub style
 * rather than a dead link.
 */
export function DocReference({ docId }: { docId: string }) {
  const { state } = useKnowledge();
  const [preview, setPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doc = state.kind === "ready" ? state.kb.byId.get(Number(docId)) : undefined;

  const open = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreview(true), PREVIEW_DELAY);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreview(false);
  };

  // The target vanished from the KB after this body was written.
  if (!doc) return <StubReference title="Missing page" />;

  return (
    <span className="relative inline-block">
      <Link
        href={`/knowledge/${doc.id}`}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={cn(
          "rounded-sm text-gray-11 underline decoration-gray-7 underline-offset-2 transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
          focusRing,
        )}
      >
        <span
          className="mr-1 inline-block size-1.5 shrink-0 rounded-full align-baseline"
          style={{ backgroundColor: docAccentColor(doc.id) }}
          aria-hidden="true"
        />
        {doc.title}
      </Link>
      {preview && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 block w-64 animate-fade-in rounded-lg border border-border bg-background p-3 shadow-dropdown motion-reduce:animate-none"
        >
          <span className="block truncate text-body-medium text-gray-12">{doc.title}</span>
          {doc.summary && (
            <span className="mt-1 block text-caption text-muted">{doc.summary}</span>
          )}
          <span className="mt-2 block text-caption text-muted">
            Updated {formatDocDate(doc.updatedAt)}
            {doc.freshness === "stale" && (
              <>
                {" · "}
                <span className={freshnessTextClassName.stale}>{freshnessLabel.stale}</span>
              </>
            )}
          </span>
        </span>
      )}
    </span>
  );
}

/** A [[wikilink]] whose title matches no page — the backend's "lien-souche".
 *  Visible rather than silent: a dead reference is information. */
export function StubReference({ title }: { title: string }) {
  return (
    <span
      className="text-placeholder underline decoration-dotted decoration-gray-7 underline-offset-2"
      title="Not created yet"
    >
      {title}
    </span>
  );
}
