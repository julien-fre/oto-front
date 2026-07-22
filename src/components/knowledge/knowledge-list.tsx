"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { freshnessDotClassName, freshnessSummary } from "@/lib/doc-freshness";
import {
  backlinksFor,
  docColor,
  docs,
  knowledgeFolders,
  processesReading,
  type Doc,
} from "@/lib/mock-data";

type Filter = Doc["category"] | "stale";

export function KnowledgeList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter | null>(null);

  // Counted against the full corpus rather than the filtered set, so a count
  // never changes just because another filter narrowed the list — same
  // convention as the connectors browser.
  const filters = useMemo(() => {
    const byCategory = knowledgeFolders.map((folder) => ({
      key: folder.id as Filter,
      label: folder.label,
      count: docs.filter((d) => d.category === folder.id).length,
    }));
    const stale = docs.filter((d) => d.freshness === "stale").length;
    return stale > 0
      ? [...byCategory, { key: "stale" as Filter, label: "Needs review", count: stale }]
      : byCategory;
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (filter === "stale" && doc.freshness !== "stale") return false;
      if (filter && filter !== "stale" && doc.category !== filter) return false;
      if (!needle) return true;
      return (
        doc.title.toLowerCase().includes(needle) ||
        doc.excerpt.toLowerCase().includes(needle) ||
        doc.owner.toLowerCase().includes(needle)
      );
    });
  }, [query, filter]);

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
            placeholder="Search docs"
            aria-label="Search docs"
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
        <p className="text-body text-muted">No docs match your filters.</p>
      ) : (
        <div className="divide-y divide-gray-5 border-y border-gray-5">
          {visible.map((doc) => {
            const backlinks = backlinksFor(doc.slug).length;
            const readers = processesReading(doc.slug).length;
            return (
              <Link
                key={doc.slug}
                href={`/knowledge/${doc.slug}`}
                className={cn(
                  "flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
                  focusRing,
                )}
              >
                <span
                  className="size-1.5 shrink-0 translate-y-[-2px] rounded-full"
                  style={{ backgroundColor: docColor(doc.slug) }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-gray-12">{doc.title}</span>
                  <span className="block truncate text-caption text-muted">{doc.excerpt}</span>
                </span>
                {/* The link counts are the list's version of what the graph
                    draws — the same relationships, read rather than seen. */}
                <span className="hidden shrink-0 text-caption text-muted sm:block">
                  {backlinks} in · {doc.links.length} out
                  {readers > 0 && ` · ${readers} process${readers === 1 ? "" : "es"}`}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", freshnessDotClassName[doc.freshness])}
                    aria-hidden="true"
                  />
                  <span className="text-caption text-muted">{freshnessSummary(doc)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
