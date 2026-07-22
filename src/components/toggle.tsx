"use client";

import { cn, focusRing } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-green-9" : "bg-gray-6",
        focusRing,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-2 -z-10 rounded-full bg-green-9/40 blur-md transition-opacity duration-150 motion-reduce:transition-none",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
