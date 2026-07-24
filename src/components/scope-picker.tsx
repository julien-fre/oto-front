"use client";

import { cn, focusRing } from "@/lib/cn";
import { scopeLabels, type Scope } from "@/lib/scope";

export function ScopePicker({
  scopes,
  value,
  onChange,
}: {
  scopes: Scope[];
  value: Scope;
  onChange: (scope: Scope) => void;
}) {
  if (scopes.length <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      {scopes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-pressed={value === s}
          className={cn(
            "h-7 rounded-full px-3 text-button",
            value === s
              ? "bg-interactive-checked text-gray-12"
              : "text-muted hover:bg-interactive-hovered",
            focusRing,
          )}
        >
          {scopeLabels[s]}
        </button>
      ))}
    </div>
  );
}
