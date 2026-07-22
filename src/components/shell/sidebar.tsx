"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenIcon,
  PanelLeftIcon,
  PlugIcon,
  SearchIcon,
  SettingsIcon,
  WorkflowIcon,
} from "@/components/icons";
import { OtoMark } from "@/components/oto-mark";
import { cn, focusRing } from "@/lib/cn";
import { docs, processes } from "@/lib/mock-data";
import { NavLink } from "./nav-link";
import { NavSection } from "./nav-section";
import { Rail } from "./rail";
import { SidebarRail } from "./sidebar-rail";
import { useSidebar } from "./sidebar-provider";

function SidebarContent({ variant }: { variant: "desktop" | "drawer" }) {
  const { toggleNav, setPaletteOpen } = useSidebar();

  return (
    <div className={cn("flex h-full flex-col", variant === "drawer" ? "w-60" : "w-full")}>
      <div className="flex h-12 shrink-0 items-center gap-1 px-2">
        <button
          type="button"
          aria-haspopup="menu"
          className={cn(
            "group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full px-2 transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
            focusRing,
          )}
        >
          <OtoMark className="shrink-0 text-gray-12 transition-transform duration-300 ease-out group-hover:rotate-90 motion-reduce:transition-none" />
          <span className="truncate text-body-medium text-gray-12">Otomata</span>
        </button>
        <button
          type="button"
          onClick={() => toggleNav("button")}
          aria-label={variant === "drawer" ? "Close sidebar" : "Collapse sidebar"}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <PanelLeftIcon />
        </button>
      </div>
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className={cn(
            "flex h-7 w-full items-center gap-2 rounded-full px-2 transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
            focusRing,
          )}
        >
          <SearchIcon className="shrink-0 text-icon" />
          <span className="text-body text-placeholder">Search</span>
          <span className="ml-auto text-caption text-placeholder">⌘K</span>
        </button>
      </div>
      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-4">
          <NavSection
            idPrefix={variant}
            id="knowledge"
            label="Knowledge"
            href="/knowledge"
            icon={<BookOpenIcon />}
            addLabel="New doc"
          >
            {docs.map((doc) => (
              <NavLink
                key={doc.slug}
                href={`/knowledge/${doc.slug}`}
                label={doc.title}
                indent
              />
            ))}
          </NavSection>
          <NavSection
            idPrefix={variant}
            id="processes"
            label="Processes"
            href="/processes"
            icon={<WorkflowIcon />}
            addLabel="New process"
          >
            {processes
              .filter((process) => process.status !== "deprecated")
              .map((process) => (
                <NavLink
                  key={process.slug}
                  href={`/processes/${process.slug}`}
                  label={process.name}
                  indent
                />
              ))}
          </NavSection>
          <NavLink href="/connectors" label="Connectors" icon={<PlugIcon />} />
        </div>
      </nav>
      <div className="flex shrink-0 flex-col gap-1 border-t border-border p-2">
        <NavLink href="/settings" label="Settings" icon={<SettingsIcon />} />
        <button
          type="button"
          aria-haspopup="menu"
          className={cn(
            "flex h-8 items-center gap-2 rounded-full px-2 transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
            focusRing,
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-4 text-caption text-gray-11">
            AM
          </span>
          <span className="truncate text-body text-gray-12">Alessandro</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { open, toggleNav, width, setWidth, mobileOpen, setMobileOpen, expandGroup, paletteOpen } =
    useSidebar();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  // Navigating into a section reveals it; manual collapse afterwards sticks
  // until the next navigation. The drawer always closes on navigation.
  useEffect(() => {
    if (pathname.startsWith("/knowledge")) expandGroup("knowledge");
    else if (pathname.startsWith("/processes")) expandGroup("processes");
  }, [pathname, expandGroup]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // The drawer is aria-modal: move focus into it on open — the trigger sits
  // in the top bar, which goes inert behind the scrim. (The provider records
  // the trigger before that and restores focus to it on close.)
  useEffect(() => {
    if (mobileOpen) {
      drawerRef.current
        ?.querySelector<HTMLElement>('[aria-label="Close sidebar"]')
        ?.focus();
    }
  }, [mobileOpen]);

  return (
    <>
      <div
        data-sidebar="desktop"
        className={cn(
          "relative hidden shrink-0 border-r border-border bg-gray-2 shell:block",
          !resizing && "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        )}
        style={{ width: open ? width : "3rem" }}
        inert={paletteOpen}
      >
        {open ? (
          <div className="h-full overflow-hidden">
            <div className="h-full w-full animate-fade-in motion-reduce:animate-none">
              <SidebarContent variant="desktop" />
            </div>
          </div>
        ) : (
          <Rail />
        )}
        <SidebarRail
          open={open}
          width={width}
          onResize={setWidth}
          onToggle={() => toggleNav("button")}
          onDragStart={() => setResizing(true)}
          onDragEnd={() => setResizing(false)}
        />
      </div>
      <div className="shell:hidden">
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "fixed inset-0 z-30 bg-black/20 transition-opacity duration-200 motion-reduce:transition-none",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          inert={!mobileOpen || paletteOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-60 bg-gray-2 shadow-high transition-transform duration-200 ease-out motion-reduce:transition-none",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarContent variant="drawer" />
        </div>
      </div>
    </>
  );
}
