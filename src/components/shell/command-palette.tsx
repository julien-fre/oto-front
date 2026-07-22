"use client";

import { SearchIcon } from "@/components/icons";
import { useSidebar } from "./sidebar-provider";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useSidebar();

  if (!paletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 px-4">
      <div
        aria-hidden="true"
        onClick={() => setPaletteOpen(false)}
        className="absolute inset-0 animate-fade-in bg-black/20 motion-reduce:animate-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative mx-auto mt-[15vh] w-full max-w-xl animate-panel-in rounded-none bg-background shadow-dropdown motion-reduce:animate-none"
      >
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SearchIcon className="shrink-0 text-icon" />
          <input
            autoFocus
            placeholder="Type a command or search…"
            className="h-full w-full bg-transparent text-body text-gray-12 outline-none placeholder:text-placeholder"
          />
        </div>
        <p className="p-4 text-body text-muted">No results</p>
      </div>
    </div>
  );
}
