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
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-green-9" : "bg-gray-6",
        focusRing,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
