"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRightIcon, PanelLeftIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { useKnowledge, type KnowledgeState } from "@/components/knowledge/knowledge-provider";
import { getProcess } from "@/lib/mock-data";
import { useSidebar } from "./sidebar-provider";

type Crumb = { label: string; href?: string };

// Where you are, and what it belongs to. Only the trailing crumb is the page
// itself; anything with an href is an ancestor you can climb back to.
function crumbsFor(pathname: string, knowledge: KnowledgeState): Crumb[] {
  const [, section, slug] = pathname.split("/");

  if (!section) return [{ label: "Home" }];

  if (section === "knowledge") {
    if (!slug) return [{ label: "Knowledge" }];
    // A doc's ancestors come from the live tree (parent_id chain). Before the
    // KB has loaded the trail degrades to the section crumb alone.
    if (knowledge.kind !== "ready") return [{ label: "Knowledge", href: "/knowledge" }];
    const doc = knowledge.kb.byId.get(Number(slug));
    if (!doc) return [{ label: "Knowledge", href: "/knowledge" }];
    const ancestors: Crumb[] = [];
    const seen = new Set<number>([doc.id]);
    let cursor = doc.parentId != null ? knowledge.kb.byId.get(doc.parentId) : undefined;
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      ancestors.unshift({ label: cursor.title || `Untitled ${cursor.id}`, href: `/knowledge/${cursor.id}` });
      cursor = cursor.parentId != null ? knowledge.kb.byId.get(cursor.parentId) : undefined;
    }
    return [
      { label: "Knowledge", href: "/knowledge" },
      ...ancestors,
      { label: doc.title || `Untitled ${doc.id}` },
    ];
  }

  if (section === "processes") {
    if (!slug) return [{ label: "Processes" }];
    return [
      { label: "Processes", href: "/processes" },
      { label: getProcess(slug)?.name ?? slug },
    ];
  }

  if (section === "connectors") return [{ label: "Connectors" }];
  if (section === "settings") return [{ label: "Settings" }];
  return [];
}

export function TopBar() {
  const pathname = usePathname();
  const { open, toggleNav } = useSidebar();
  const { state: knowledge } = useKnowledge();
  const crumbs = crumbsFor(pathname, knowledge);

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-2">
      {/* Below the shell breakpoint this is the only way to reach the drawer,
          so it is always there; on desktop the docked sidebar carries its own
          collapse button, so it appears only while collapsed. */}
      <button
        type="button"
        onClick={() => toggleNav("button")}
        aria-label="Open sidebar"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
          open && "shell:hidden",
          focusRing,
        )}
      >
        <PanelLeftIcon />
      </button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 px-1">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronRightIcon size={13} className="shrink-0 text-gray-8" aria-hidden="true" />
              )}
              {last ? (
                <h1 className="truncate text-body-medium text-gray-12">{crumb.label}</h1>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  className={cn(
                    "truncate rounded-sm px-1 text-body text-muted transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
                    focusRing,
                  )}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate px-1 text-body text-muted">{crumb.label}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
