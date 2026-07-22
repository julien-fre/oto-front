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
  // activated button is unmounted by the rail/expanded swap — hand keyboard
  // focus to its counterpart so focus never drops to <body>.
  useEffect(() => {
    if (!consumeNavHandoff()) return;
    const selector = open
      ? '[data-sidebar="desktop"] [aria-label="Collapse sidebar"]'
      : '[data-sidebar="desktop"] [aria-label="Expand sidebar"]';
    document.querySelector<HTMLElement>(selector)?.focus();
  }, [open, consumeNavHandoff]);

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div
        className="flex min-w-0 flex-1 flex-col"
        inert={mobileOpen || paletteOpen}
      >
        {/* Mobile-only: the drawer trigger. On desktop the rail is always
            present, so no reopen affordance is needed here. */}
        <div className="flex h-12 shrink-0 items-center border-b border-border bg-background px-2 shell:hidden">
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
