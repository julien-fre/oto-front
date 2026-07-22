"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import { freshnessSummary, freshnessTextClassName } from "@/lib/doc-freshness";
import { docColor, getDoc } from "@/lib/mock-data";

const PREVIEW_DELAY = 300; // Obsidian's hover-preview wait

/**
 * An inline reference to another doc, mid-sentence.
 *
 * The leading dot carries the target's identity color — the same one the
 * sidebar and the graph use — so a doc looks like itself everywhere it
 * appears. A slug with no doc behind it renders as an unresolved link rather
 * than disappearing: dead references should be visible, not silent.
 */
export function DocReference({ slug }: { slug: string }) {
  const doc = getDoc(slug);
  const [preview, setPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreview(true), PREVIEW_DELAY);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreview(false);
  };

  if (!doc) {
    return (
      <span
        className="text-placeholder underline decoration-dotted decoration-gray-7 underline-offset-2"
        title="Not created yet"
      >
        {slug}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <Link
        href={`/knowledge/${doc.slug}`}
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
          style={{ backgroundColor: docColor(doc.slug) }}
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
          <span className="mt-1 block text-caption text-muted">{doc.excerpt}</span>
          <span className="mt-2 block text-caption text-muted">
            {doc.owner}
            {" · "}
            <span className={freshnessTextClassName[doc.freshness]}>
              {freshnessSummary(doc)}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
