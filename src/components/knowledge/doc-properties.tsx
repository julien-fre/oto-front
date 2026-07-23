"use client";

import { useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import {
  freshnessDotClassName,
  freshnessLabel,
  freshnessTextClassName,
} from "@/lib/doc-freshness";
import { formatDocDate, type KnowledgeDoc } from "@/lib/knowledge-api";

const KIND_LABELS: Record<KnowledgeDoc["kind"], string> = {
  doc: "Doc",
  note: "Note — written by an agent",
  source: "Source — imported material",
};

/**
 * The key-value block under a document's title, following Notion's shape: a
 * compact list of properties, the less-load-bearing ones folded behind a
 * "Show N more" disclosure.
 *
 * Every row is backed by a real backend field (capabilities/docs.py _view) —
 * the mock era's Owner and Source-of-truth rows died with the wiring, per the
 * "no backend field → remove, don't fake" precedent (PR #13).
 */
export function DocProperties({
  doc,
  backlinks,
  outgoing,
}: {
  doc: KnowledgeDoc;
  backlinks: number;
  outgoing: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const hidden: { key: string; value: React.ReactNode }[] = [
    { key: "Kind", value: KIND_LABELS[doc.kind] },
    { key: "Created", value: formatDocDate(doc.createdAt) },
    {
      key: "Links",
      value: `${backlinks} in · ${outgoing} out`,
    },
  ];
  if (doc.isPublic && doc.publicUrl) {
    hidden.push({
      key: "Public link",
      value: (
        <a
          href={doc.publicUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12",
            focusRing,
          )}
        >
          {doc.publicUrl.replace(/^https?:\/\//, "")}
        </a>
      ),
    });
  }

  return (
    <dl className="flex flex-col">
      <Row label="Updated">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", freshnessDotClassName[doc.freshness])}
            aria-hidden="true"
          />
          <span className={cn("text-caption", freshnessTextClassName[doc.freshness])}>
            {formatDocDate(doc.updatedAt)}
            {doc.freshness === "stale" && ` · ${freshnessLabel.stale}`}
          </span>
        </span>
      </Row>

      {expanded &&
        hidden.map((item) => (
          <Row key={item.key} label={item.key}>
            <span className="text-caption text-gray-12">{item.value}</span>
          </Row>
        ))}

      <div className="mt-1">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className={cn(
            "h-6 rounded-full px-1 text-caption text-muted transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
            focusRing,
          )}
        >
          {expanded ? "Hide properties" : `Show ${hidden.length} more propert${hidden.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-6 items-baseline gap-3">
      <dt className="w-28 shrink-0 text-caption text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
