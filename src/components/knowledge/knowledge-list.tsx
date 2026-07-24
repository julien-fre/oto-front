"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { freshnessDotClassName, freshnessLabel } from "@/lib/doc-freshness";
import {
  docAccentColor,
  formatDocDate,
  type KnowledgeBase,
  type KnowledgeDoc,
} from "@/lib/knowledge-api";

type Filter = KnowledgeDoc["kind"] | "stale";

const KIND_FILTER_LABELS: Record<KnowledgeDoc["kind"], string> = {
  doc: "Docs",
  note: "Notes",
  source: "Sources",
};

export function KnowledgeList({ kb }: { kb: KnowledgeBase }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter | null>(null);

  // Counted against the full corpus rather than the filtered set, so a count
  // never changes just because another filter narrowed the list — same
  // convention as the connectors browser.
  const filters = useMemo(() => {
    const byKind = (Object.keys(KIND_FILTER_LABELS) as KnowledgeDoc["kind"][])
      .map((kind) => ({
        key: kind as Filter,
        label: KIND_FILTER_LABELS[kind],
        count: kb.docs.filter((d) => d.kind === kind).length,
      }))
      .filter((f) => f.count > 0);
    const stale = kb.docs.filter((d) => d.freshness === "stale").length;
    return stale > 0
      ? [...byKind, { key: "stale" as Filter, label: freshnessLabel.stale, count: stale }]
      : byKind;
  }, [kb]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return kb.docs.filter((doc) => {
      if (filter === "stale" && doc.freshness !== "stale") return false;
      if (filter && filter !== "stale" && doc.kind !== filter) return false;
      if (!needle) return true;
      return (
        doc.title.toLowerCase().includes(needle) ||
        doc.summary.toLowerCase().includes(needle)
      );
    });
  }, [kb, query, filter]);

  if (kb.docs.length === 0) {
    return (
      <p className="text-body text-muted">
        No pages yet. Ask Oto to capture what it learns — pages land here, in the org’s
        knowledge base.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-64 items-center gap-2 rounded-md border border-border px-2",
            "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
          )}
        >
          <SearchIcon className="shrink-0 text-icon" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages"
            aria-label="Search pages"
            className="w-full min-w-0 bg-transparent text-body text-gray-12 placeholder:text-placeholder focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter((prev) => (prev === f.key ? null : f.key))}
              aria-pressed={filter === f.key}
              className={cn(
                "flex h-8 items-center gap-1 rounded-full px-3 text-button",
                filter === f.key
                  ? "bg-interactive-checked text-gray-12"
                  : "text-muted hover:bg-interactive-hovered",
                focusRing,
              )}
            >
              {f.label}
              <span className="text-caption text-muted">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-body text-muted">No pages match your filters.</p>
      ) : (
        <div className="divide-y divide-gray-5 border-y border-gray-5">
          {visible.map((doc) => {
            const backlinks = kb.incoming.get(doc.id)?.length ?? 0;
            const outgoing =
              (kb.outgoing.get(doc.id)?.length ?? 0) + (kb.stubs.get(doc.id)?.length ?? 0);
            return (
              <Link
                key={doc.id}
                href={`/knowledge/${doc.id}`}
                className={cn(
                  "flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
                  focusRing,
                )}
              >
                <span
                  className="size-1.5 shrink-0 translate-y-[-2px] rounded-full"
                  style={{ backgroundColor: docAccentColor(doc.id) }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-gray-12">
                    {doc.title || `Untitled ${doc.id}`}
                  </span>
                  {doc.summary && (
                    <span className="block truncate text-caption text-muted">
                      {doc.summary}
                    </span>
                  )}
                </span>
                {/* The link counts are the list's version of what the graph
                    draws — the same relationships, read rather than seen. */}
                <span className="hidden shrink-0 text-caption text-muted sm:block">
                  {backlinks} in · {outgoing} out
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      freshnessDotClassName[doc.freshness],
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-caption text-muted">
                    {doc.freshness === "stale"
                      ? freshnessLabel.stale
                      : `Updated ${formatDocDate(doc.updatedAt)}`}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
