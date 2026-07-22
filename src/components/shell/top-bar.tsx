"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRightIcon, PanelLeftIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { getDoc, getProcess, knowledgeFolders } from "@/lib/mock-data";
import { useSidebar } from "./sidebar-provider";

type Crumb = { label: string; href?: string };

// Where you are, and what it belongs to. Only the trailing crumb is the page
// itself; anything with an href is an ancestor you can climb back to. The
// Knowledge folder crumb has no href — folders are disclosure, not pages.
function crumbsFor(pathname: string): Crumb[] {
  const [, section, slug] = pathname.split("/");

  if (!section) return [{ label: "Home" }];

  if (section === "knowledge") {
    if (!slug) return [{ label: "Knowledge" }];
    const doc = getDoc(slug);
    if (!doc) return [{ label: "Knowledge", href: "/knowledge" }];
    const folder = knowledgeFolders.find((f) => f.id === doc.category);
    return [
      { label: "Knowledge", href: "/knowledge" },
      ...(folder ? [{ label: folder.label }] : []),
      { label: doc.title },
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

export function TopBar({ inert }: { inert?: boolean }) {
  const pathname = usePathname();
  const { open, toggleNav } = useSidebar();
  const crumbs = crumbsFor(pathname);

  return (
    <div inert={inert} className="flex h-10 shrink-0 items-center gap-1 px-2">
      {/* Only while collapsed — the docked sidebar carries its own toggle. */}
      {!open && (
        <button
          type="button"
          onClick={() => toggleNav("button")}
          aria-label="Open sidebar"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <PanelLeftIcon />
        </button>
      )}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 px-1">
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
