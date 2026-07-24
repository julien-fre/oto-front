"use client";

import { useEffect, useRef, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import { ApiError } from "@/lib/api";
import { fetchProcessVersions, revertProcess, type ProcessVersion } from "@/lib/processes-api";

// Versions are fetched lazily on first open rather than eagerly with the
// process, since most visits never open it.
type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; versions: ProcessVersion[] };

// Restore is shown to everyone and just surfaces a clean message on a 403,
// rather than pre-fetching an org-wide can_edit flag to hide it up front —
// simpler, no extra request, and matches how the rest of the app handles
// permission errors (catch and display, don't precompute).
type RestoreState = { version: number; status: "pending" } | { version: number; status: "error"; message: string };

export function ProcessVersionMenu({
  slug,
  version,
  updatedAt,
  onReverted,
}: {
  slug: string;
  version: number;
  updatedAt: string | null;
  onReverted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const [restore, setRestore] = useState<RestoreState | null>(null);
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

  function loadVersions() {
    setState({ kind: "loading" });
    fetchProcessVersions(slug)
      .then((versions) => setState({ kind: "ready", versions }))
      .catch((err: unknown) => {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to load versions.",
        });
      });
  }

  function toggle() {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next && state.kind === "idle") loadVersions();
      return next;
    });
  }

  function restoreVersion(v: number) {
    setRestore({ version: v, status: "pending" });
    revertProcess(slug, v)
      .then(() => {
        setRestore(null);
        setOpen(false);
        // The endpoint copies the old content into a brand-new version
        // rather than rewinding — both the process (new version number,
        // possibly different body) and this menu's list are now stale.
        setState({ kind: "idle" });
        onReverted();
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError && err.status === 403
            ? "You need admin access to restore a version."
            : err instanceof Error
              ? err.message
              : "Failed to restore this version.";
        setRestore({ version: v, status: "error", message });
      });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-md px-1 py-0.5 transition-colors duration-100 hover:bg-gray-3 motion-reduce:transition-none",
          focusRing,
        )}
      >
        <span className="text-body-medium text-gray-12">Version {version}</span>
        {updatedAt && <span className="text-caption text-muted">{updatedAt}</span>}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Versions"
          className="absolute left-0 top-full z-20 mt-1 max-h-64 w-64 animate-panel-in overflow-y-auto rounded-lg border border-border bg-background py-1 shadow-dropdown motion-reduce:animate-none"
        >
          {state.kind === "loading" && (
            <p className="px-3 py-2 text-caption text-muted">Loading…</p>
          )}
          {state.kind === "error" && (
            <p className="px-3 py-2 text-caption text-muted">Couldn&apos;t load versions.</p>
          )}
          {state.kind === "ready" &&
            state.versions.map((v, i) => {
              const isCurrent = i === 0;
              const isRestoringThis = restore?.version === v.version;
              return (
                <div key={v.version} role="menuitem" className="px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-body-medium text-gray-12">V{v.version}</span>
                      {v.createdAt && (
                        <span className="truncate text-caption text-muted">{v.createdAt}</span>
                      )}
                    </div>
                    {isCurrent ? (
                      <span className="shrink-0 rounded-full bg-gray-3 px-2 py-0.5 text-caption text-gray-11">
                        Current
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={restore?.status === "pending"}
                        onClick={() => restoreVersion(v.version)}
                        className={cn(
                          "h-7 shrink-0 rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 disabled:opacity-40 motion-reduce:transition-none",
                          focusRing,
                        )}
                      >
                        {isRestoringThis && restore.status === "pending" ? "Restoring…" : "Restore"}
                      </button>
                    )}
                  </div>
                  {isRestoringThis && restore.status === "error" && (
                    <p className="mt-1 text-caption text-red-11">{restore.message}</p>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
