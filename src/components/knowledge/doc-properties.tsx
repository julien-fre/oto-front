"use client";

import { useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import {
  freshnessDotClassName,
  freshnessLabel,
  freshnessTextClassName,
} from "@/lib/doc-freshness";
import { knowledgeFolders, type Doc } from "@/lib/mock-data";

/**
 * The key-value block under a document's title, following Notion's shape: a
 * compact list of properties, with the less-load-bearing ones folded behind a
 * "Show N more" disclosure.
 *
 * The metadata triad (owner, verified date, source of truth) is always
 * visible, because it is the thing that makes a doc trustworthy to act on —
 * everything else can hide.
 */
export function DocProperties({
  doc,
  backlinks,
  readers,
}: {
  doc: Doc;
  backlinks: number;
  readers: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const folder = knowledgeFolders.find((f) => f.id === doc.category);

  const hidden = [
    { key: "Folder", value: folder?.label ?? doc.category },
    {
      key: "Links",
      value: `${backlinks} in · ${doc.links.length} out${
        readers > 0 ? ` · ${readers} process${readers === 1 ? "" : "es"}` : ""
      }`,
    },
  ];

  return (
    <dl className="flex flex-col">
      <Row label="Owner">
        <span className="text-caption text-gray-12">{doc.owner}</span>
      </Row>

      <Row label="Verified">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", freshnessDotClassName[doc.freshness])}
            aria-hidden="true"
          />
          <span className={cn("text-caption", freshnessTextClassName[doc.freshness])}>
            {doc.verifiedAt}
            {doc.freshness !== "fresh" && ` · ${freshnessLabel[doc.freshness]}`}
          </span>
          {/* Designed, deliberately inert: there is no back end to record a
              review against yet. */}
          <button
            type="button"
            disabled
            title="Connect the back end to record a review"
            className={cn(
              "ml-1 h-5 rounded-full px-2 text-caption text-muted disabled:cursor-not-allowed disabled:opacity-60",
              focusRing,
            )}
          >
            Mark reviewed
          </button>
        </span>
      </Row>

      {doc.sourceOfTruth && (
        <Row label="Source of truth">
          <span className="text-caption text-gray-12">{doc.sourceOfTruth}</span>
        </Row>
      )}

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
          {expanded ? "Hide properties" : `Show ${hidden.length} more properties`}
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
