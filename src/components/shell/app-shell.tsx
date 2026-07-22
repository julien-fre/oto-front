"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { PanelLeftIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { useSidebar } from "./sidebar-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { open, toggleNav, consumeNavHandoff, mobileOpen, paletteOpen } = useSidebar();
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // When the desktop toggle came from one of the two visible buttons, the
  // activated button gets hidden/inerted by the toggle itself — hand keyboard
  // focus to its counterpart so focus never drops to <body>.
  useEffect(() => {
    if (!consumeNavHandoff()) return;
    if (open) {
      document
        .querySelector<HTMLElement>('[data-sidebar="desktop"] [aria-label="Close sidebar"]')
        ?.focus();
    } else {
      openButtonRef.current?.focus();
    }
  }, [open, consumeNavHandoff]);

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div
        className="flex min-w-0 flex-1 flex-col"
        inert={mobileOpen || paletteOpen}
      >
        {/* Reopen affordance: always present on mobile, desktop only when the
            sidebar is closed. */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-border bg-background px-2",
            open && "shell:hidden",
          )}
        >
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => toggleNav("button")}
            aria-label="Open sidebar"
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-icon hover:bg-interactive-hovered",
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
