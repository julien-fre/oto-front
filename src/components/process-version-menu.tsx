"use client";

import { useEffect, useRef, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import type { ProcessVersion } from "@/lib/mock-data";

export function ProcessVersionMenu({ versions }: { versions: ProcessVersion[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = versions[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-7 shrink-0 items-center rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
          focusRing,
        )}
      >
        V{current.version}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Versions"
          className="absolute right-0 top-full z-20 mt-2 w-64 animate-panel-in rounded-lg border border-border bg-background py-1 shadow-dropdown motion-reduce:animate-none"
        >
          {versions.map((version, i) => {
            const isCurrent = i === 0;
            return (
              <div
                key={version.version}
                role="menuitem"
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-body-medium text-gray-12">V{version.version}</span>
                  <span className="truncate text-caption text-muted">{version.createdAt}</span>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 rounded-full bg-gray-3 px-2 py-0.5 text-caption text-gray-11">
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "h-7 shrink-0 rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
                      focusRing,
                    )}
                  >
                    Restore
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
