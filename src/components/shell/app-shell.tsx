"use client";

import { useEffect, type ReactNode } from "react";
import { PanelLeftIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { useSidebar } from "./sidebar-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { open, toggleNav, consumeNavHandoff, mobileOpen, paletteOpen } = useSidebar();

  // When the desktop toggle came from one of the two visible buttons, the
  // activated button is unmounted (or hidden) by the open/collapsed swap —
  // hand keyboard focus to its counterpart so focus never drops to <body>.
  useEffect(() => {
    if (!consumeNavHandoff()) return;
    const selector = open
      ? '[data-sidebar="desktop"] [aria-label="Collapse sidebar"]'
      : '[aria-label="Open sidebar"]';
    document.querySelector<HTMLElement>(selector)?.focus();
  }, [open, consumeNavHandoff]);

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div
        className="relative flex min-w-0 flex-1 flex-col"
        inert={mobileOpen || paletteOpen}
      >
        {/* The drawer/reopen trigger: always shown on mobile (the drawer is
            independent of desktop `open`), and on desktop only while
            collapsed — once open, the docked sidebar has its own collapse
            button. */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-border bg-background px-2",
            open && "shell:hidden",
          )}
        >
          <button
            type="button"
            onClick={() => toggleNav("button")}
            aria-label="Open sidebar"
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
              focusRing,
            )}
          >
            <PanelLeftIcon />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
