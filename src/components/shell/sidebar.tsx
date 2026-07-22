"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenIcon,
  DottedIcon,
  FileTextIcon,
  PanelLeftIcon,
  PlugIcon,
  SearchIcon,
  SettingsIcon,
  WorkflowIcon,
} from "@/components/icons";
import { OtoMark } from "@/components/oto-mark";
import { cn, focusRing } from "@/lib/cn";
import {
  docColor,
  docsInFolder,
  getDoc,
  knowledgeFolders,
  LABEL_DOT_COLORS,
  processColor,
  processes,
} from "@/lib/mock-data";
import { NavFolder } from "./nav-folder";
import { NavLink } from "./nav-link";
import { NavSection } from "./nav-section";
import { SidebarRail } from "./sidebar-rail";
import { useSidebar } from "./sidebar-provider";

function SidebarContent({ variant }: { variant: "desktop" | "drawer" | "peek" }) {
  const { toggleNav, setPaletteOpen } = useSidebar();

  return (
    <div className={cn("flex h-full flex-col", variant === "drawer" ? "w-60" : "w-full")}>
      <div className="flex h-12 shrink-0 items-center gap-1 px-3">
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
          aria-label={
            variant === "desktop"
              ? "Collapse sidebar"
              : variant === "drawer"
                ? "Close sidebar"
                : "Expand sidebar"
          }
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <PanelLeftIcon />
        </button>
      </div>
      <div className="px-3 pb-2">
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
      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col gap-4">
          <NavSection
            idPrefix={variant}
            id="knowledge"
            label="Knowledge"
            href="/knowledge"
            icon={<BookOpenIcon />}
            addLabel="New doc"
          >
            {knowledgeFolders.map((folder, i) => (
              <NavFolder
                key={folder.id}
                id={`knowledge-${folder.id}`}
                label={folder.label}
                color={LABEL_DOT_COLORS[i % LABEL_DOT_COLORS.length]}
              >
                {docsInFolder(folder.id).map((doc) => (
                  <NavLink
                    key={doc.slug}
                    href={`/knowledge/${doc.slug}`}
                    label={doc.title}
                    icon={<FileTextIcon style={{ color: docColor(doc.slug) }} />}
                    indent
                  />
                ))}
              </NavFolder>
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
                  icon={
                    <DottedIcon color={processColor(process.slug)}>
                      <SettingsIcon />
                    </DottedIcon>
                  }
                  indent
                />
              ))}
          </NavSection>
          <NavLink href="/connectors" label="Connectors" icon={<PlugIcon />} />
        </div>
      </nav>
      <div className="flex shrink-0 flex-col gap-1 border-t border-border p-3">
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

const PEEK_WIDTH = 224; // narrower than the docked sidebar's default 240px

export function Sidebar() {
  const { open, toggleNav, width, setWidth, mobileOpen, setMobileOpen, expandGroup, paletteOpen } =
    useSidebar();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  // Collapsed desktop sidebar: hovering the far-left edge (or the peek panel
  // itself) floats the full sidebar over the content as an overlay, Linear-
  // style, without touching `open` — the docked layout never shifts. Delays
  // on both ends stop a quick pass over the edge from flickering the panel.
  const [peeking, setPeeking] = useState(false);
  const peekShowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPeekTimers = useCallback(() => {
    if (peekShowTimer.current) clearTimeout(peekShowTimer.current);
    if (peekHideTimer.current) clearTimeout(peekHideTimer.current);
    peekShowTimer.current = null;
    peekHideTimer.current = null;
  }, []);

  useEffect(() => clearPeekTimers, [clearPeekTimers]);

  // Pinning the sidebar open always wins over a peek.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the peek overlay on the pin transition, not every render; guarded by `open`
    if (open) setPeeking(false);
  }, [open]);

  const handleEdgeEnter = useCallback(() => {
    if (open) return;
    clearPeekTimers();
    peekShowTimer.current = setTimeout(() => setPeeking(true), 150);
  }, [open, clearPeekTimers]);

  const handleEdgeLeave = useCallback(() => {
    clearPeekTimers();
    peekHideTimer.current = setTimeout(() => setPeeking(false), 150);
  }, [clearPeekTimers]);

  useEffect(() => {
    if (!peeking) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPeeking(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [peeking]);

  // Navigating into a section reveals it; manual collapse afterwards sticks
  // until the next navigation. The drawer and the peek overlay always close
  // on navigation.
  useEffect(() => {
    if (pathname.startsWith("/knowledge")) {
      expandGroup("knowledge");
      // Also open the folder holding this doc, so the active row is revealed
      // rather than hidden inside a collapsed folder.
      const doc = getDoc(pathname.split("/")[2] ?? "");
      if (doc) expandGroup(`knowledge-${doc.category}`);
    } else if (pathname.startsWith("/processes")) expandGroup("processes");
  }, [pathname, expandGroup]);

  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the peek overlay on navigation, mirroring the drawer-close above
    setPeeking(false);
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
      {/* Desktop collapsed only: an invisible strip along the left edge that
          triggers the peek panel on hover. Sits under the peek panel (lower
          z) so hovering the panel itself also keeps it open. */}
      {!open && (
        <div
          aria-hidden="true"
          onMouseEnter={handleEdgeEnter}
          onMouseLeave={handleEdgeLeave}
          className="fixed inset-y-0 left-0 z-30 hidden w-3 shell:block"
        />
      )}
      <div
        data-sidebar="desktop"
        className={cn(
          "relative hidden shrink-0 shell:block",
          !resizing && "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        )}
        style={{ width: open ? width : 0 }}
        inert={paletteOpen}
      >
        {open && (
          <div className="h-full overflow-hidden border-r border-border bg-gray-2">
            <div
              className="h-full animate-fade-in motion-reduce:animate-none"
              style={{ width }}
            >
              <SidebarContent variant="desktop" />
            </div>
          </div>
        )}
        {open && (
          <SidebarRail
            width={width}
            onResize={setWidth}
            onToggle={() => toggleNav("button")}
            onDragStart={() => setResizing(true)}
            onDragEnd={() => setResizing(false)}
          />
        )}
      </div>
      {/* Desktop collapsed only: the floating peek panel, inset from the top
          and bottom so it reads as a card over the content, not a second
          docked column. */}
      {!open && (
        <div
          onMouseEnter={handleEdgeEnter}
          onMouseLeave={handleEdgeLeave}
          inert={!peeking}
          style={{ width: PEEK_WIDTH }}
          className={cn(
            "fixed inset-y-3 left-3 z-40 hidden overflow-hidden rounded-lg bg-gray-2 shadow-high transition-transform duration-150 ease-out shell:block motion-reduce:transition-none",
            peeking ? "translate-x-0" : "-translate-x-[calc(100%+0.75rem)]",
          )}
        >
          <SidebarContent variant="peek" />
        </div>
      )}
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
