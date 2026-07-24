"use client";

import { useEffect, useRef, useState } from "react";
import { useOrg } from "@/components/org-provider";
import { OtoMark } from "@/components/oto-mark";
import { cn, focusRing } from "@/lib/cn";

// Switching is shown per-row (not a single global pending flag) so a failed
// switch to one org doesn't block immediately retrying a different one.
type SwitchState = { id: number; status: "pending" } | { id: number; status: "error"; message: string };

/**
 * The sidebar's top-left button, switched from a static "Otomata" label to
 * the real active org, with a dropdown to switch to another one the account
 * belongs to. Mirrors ProcessVersionMenu's shape (trigger + panel sharing one
 * containerRef, so a click on the trigger itself isn't treated as "outside").
 */
export function OrgSwitcherMenu() {
  const { state, activeOrg, switchOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<SwitchState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  function handleSwitch(orgId: number) {
    setSwitching({ id: orgId, status: "pending" });
    switchOrg(orgId)
      .then(() => {
        setSwitching(null);
        setOpen(false);
      })
      .catch((err: unknown) => {
        setSwitching({
          id: orgId,
          status: "error",
          message: err instanceof Error ? err.message : "Failed to switch organizations.",
        });
      });
  }

  const label = activeOrg?.name ?? (state.kind === "loading" ? "Loading…" : "Select an org");

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group flex h-8 w-full min-w-0 items-center gap-2 rounded-full px-2 transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
          focusRing,
        )}
      >
        <OtoMark className="shrink-0 text-gray-12 transition-transform duration-300 ease-out group-hover:rotate-90 motion-reduce:transition-none" />
        <span className="truncate text-body-medium text-gray-12">{label}</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Organizations"
          className="absolute left-0 top-full z-20 mt-1 max-h-64 w-64 animate-panel-in overflow-y-auto rounded-lg border border-border bg-background py-1 shadow-dropdown motion-reduce:animate-none"
        >
          {state.kind === "loading" && (
            <p className="px-3 py-2 text-caption text-muted">Loading…</p>
          )}
          {state.kind === "error" && (
            <p className="px-3 py-2 text-caption text-muted">Couldn&apos;t load organizations.</p>
          )}
          {state.kind === "ready" &&
            state.orgs.map((org) => {
              const isSwitchingThis = switching?.id === org.id;
              return (
                <div key={org.id} role="menuitem" className="px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-body text-gray-12">{org.name}</span>
                    {org.active ? (
                      <span className="shrink-0 rounded-full bg-gray-3 px-2 py-0.5 text-caption text-gray-11">
                        Current
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={switching?.status === "pending"}
                        onClick={() => handleSwitch(org.id)}
                        className={cn(
                          "h-7 shrink-0 rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 disabled:opacity-40 motion-reduce:transition-none",
                          focusRing,
                        )}
                      >
                        {isSwitchingThis && switching.status === "pending" ? "Switching…" : "Switch"}
                      </button>
                    )}
                  </div>
                  {isSwitchingThis && switching.status === "error" && (
                    <p className="mt-1 text-caption text-red-11">{switching.message}</p>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
