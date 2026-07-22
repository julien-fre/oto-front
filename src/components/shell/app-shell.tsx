"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { useSidebar } from "./sidebar-provider";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const { open, consumeNavHandoff, mobileOpen, paletteOpen } = useSidebar();

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
    // The app background is the sidebar's surface. A full-width bar sits above
    // everything so the breadcrumb stays visible no matter what the sidebar is
    // doing; the sidebar and the page hang below it, and the page is an inset
    // rounded panel so the sidebar reads as a frame around it.
    <div className="flex h-dvh flex-col bg-gray-2">
      <TopBar inert={mobileOpen || paletteOpen} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col bg-background",
            "shell:mx-2 shell:mb-2 shell:overflow-hidden shell:rounded-xl shell:border shell:border-border",
          )}
          inert={mobileOpen || paletteOpen}
        >
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
