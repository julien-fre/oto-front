"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import { headingId, type Heading } from "@/lib/doc-outline";
import { DOC_RAIL_COOKIE, writeGraphCookie } from "@/lib/graph-settings";
import type { Doc, Process } from "@/lib/mock-data";
import { docColor } from "@/lib/mock-data";
import { LocalGraph } from "./local-graph";

type Tab = "graph" | "links" | "outline";
const TABS: { key: Tab; label: string }[] = [
  { key: "graph", label: "Graph" },
  { key: "links", label: "Links" },
  { key: "outline", label: "Outline" },
];

export type RailData = {
  slug: string;
  backlinks: Pick<Doc, "slug" | "title">[];
  outgoing: { slug: string; title: string | null }[];
  readers: Pick<Process, "slug" | "name">[];
  headings: Heading[];
};

export function DocRail({ data, defaultOpen }: { data: RailData; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<Tab>("graph");

  useEffect(() => {
    writeGraphCookie(DOC_RAIL_COOKIE, open ? "open" : "closed");
  }, [open]);

  if (!open) {
    return (
      <div className="shrink-0 border-l border-border p-2 shell:block">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show links and graph"
          aria-expanded={false}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <PanelGlyph />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Document context"
      // Stacks under the document below the shell breakpoint rather than
      // overlaying it — at that width there is no room for two columns, and a
      // drawer for reference material would be more ceremony than it is worth.
      className="flex w-full shrink-0 flex-col gap-3 border-t border-border px-4 py-4 shell:w-72 shell:border-l shell:border-t-0"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "h-8 border-b-2 px-1 text-button transition-colors duration-100 motion-reduce:transition-none",
              tab === item.key
                ? "border-gray-12 text-gray-12"
                : "border-transparent text-muted hover:text-gray-12",
              focusRing,
            )}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide links and graph"
          aria-expanded
          className={cn(
            "ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <PanelGlyph />
        </button>
      </div>

      {tab === "graph" && <LocalGraph slug={data.slug} />}
      {tab === "links" && <LinksTab data={data} />}
      {tab === "outline" && <OutlineTab headings={data.headings} />}
    </aside>
  );
}

function PanelGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

/**
 * The text counterpart to the local graph, and the more useful of the two for
 * most questions — a typed list of what points here, what this points at, and
 * which automations depend on it. The graph is the enhancement; this is the
 * thing that always works, including for a screen reader.
 */
function LinksTab({ data }: { data: RailData }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <Section title="Backlinks" count={data.backlinks.length} empty="No backlinks found.">
        {data.backlinks.map((d) => (
          <RailLink key={d.slug} href={`/knowledge/${d.slug}`} slug={d.slug} label={d.title} />
        ))}
      </Section>

      <Section title="Outgoing" count={data.outgoing.length} empty="No links found.">
        {data.outgoing.map((item) =>
          item.title ? (
            <RailLink
              key={item.slug}
              href={`/knowledge/${item.slug}`}
              slug={item.slug}
              label={item.title}
            />
          ) : (
            <li key={item.slug} className="flex items-center gap-2 py-1">
              <span className="size-1.5 shrink-0 rounded-full bg-gray-8" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-caption text-placeholder">
                {item.slug}
              </span>
              <span className="shrink-0 text-caption text-muted">Not created yet</span>
            </li>
          ),
        )}
      </Section>

      <Section title="Read by" count={data.readers.length} empty="No process reads this doc.">
        {data.readers.map((p) => (
          <li key={p.slug} className="py-1">
            <Link
              href={`/processes/${p.slug}`}
              className={cn(
                "block truncate rounded-sm text-caption text-gray-11 underline decoration-gray-7 underline-offset-2 transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
                focusRing,
              )}
            >
              {p.name}
            </Link>
          </li>
        ))}
      </Section>
    </div>
  );
}

function RailLink({ href, slug, label }: { href: string; slug: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-sm py-1 transition-colors duration-100 motion-reduce:transition-none",
          focusRing,
        )}
      >
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: docColor(slug) }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-caption text-gray-11 hover:text-gray-12">
          {label}
        </span>
      </Link>
    </li>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-caption text-muted">
        {title}
        <span className="text-caption text-muted">{count}</span>
      </h2>
      {count === 0 ? (
        <p className="mt-1 text-caption text-muted">{empty}</p>
      ) : (
        <ul className="mt-1 flex flex-col">{children}</ul>
      )}
    </section>
  );
}

function OutlineTab({ headings }: { headings: RailData["headings"] }) {
  if (headings.length === 0) {
    return <p className="text-caption text-muted">This doc has no headings.</p>;
  }
  return (
    <nav aria-label="Document outline" className="min-h-0 flex-1 overflow-y-auto">
      <ul className="flex flex-col">
        {headings.map((h, i) => (
          <li key={`${h.text}-${i}`}>
            <a
              href={`#${headingId(h.text)}`}
              className={cn(
                "block truncate rounded-sm py-1 text-caption text-muted transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
                h.level === 3 && "pl-3",
                focusRing,
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

