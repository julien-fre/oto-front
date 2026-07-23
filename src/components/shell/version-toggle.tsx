"use client";

import { cn, focusRing } from "@/lib/cn";
import { useAppVersion } from "./version-provider";

// A dev-facing toggle, not a product feature: lets us preview the trimmed
// V0 nav (Overview only, no Flow/Usage) against the eventual V1 with all
// three tabs, without shipping two separate builds.
export function VersionToggle() {
  const { version, toggleVersion } = useAppVersion();

  return (
    <button
      type="button"
      onClick={toggleVersion}
      aria-label={`Switch to ${version === "v0" ? "V1" : "V0"}`}
      className={cn(
        "fixed bottom-4 right-4 z-30 flex h-8 items-center rounded-full border border-border bg-background px-3 text-button text-gray-12 shadow-dropdown transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
        focusRing,
      )}
    >
      {version === "v0" ? "V0" : "V1"}
    </button>
  );
}
