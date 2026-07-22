"use client";

import { cn, focusRing } from "@/lib/cn";

// A range control sized to the design system's dense scale: an h-7 row, a 2px
// gray-5 track, a gray-12 thumb. Native <input type="range"> rather than a
// custom drag target — it comes with keyboard support, the correct ARIA, and
// touch behaviour for free, and the only cost is vendor-prefixed thumb CSS.
//
// The value renders in a fixed-width trailing cell so the track does not
// reflow as digits change while dragging.

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Display form of the value. Defaults to two significant decimals. */
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const shown = format ? format(value) : value.toFixed(2).replace(/\.?0+$/, "");

  return (
    <label className="flex h-7 items-center gap-2">
      <span className="w-28 shrink-0 truncate text-caption text-muted">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-gray-5",
          "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-12",
          "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gray-12",
          focusRing,
        )}
      />
      <span className="w-8 shrink-0 text-right text-caption tabular-nums text-muted">
        {shown}
      </span>
    </label>
  );
}
