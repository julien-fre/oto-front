import type { SVGProps } from "react";

// The "open O" — Oto's mark: a ring with a gap at the top-right, round caps.
// pathLength normalizes the circumference to 100 so the dash array draws an
// 80% arc; the SVG dash starts at 3 o'clock, so rotating -13° centers the 20%
// gap on the north-east. Monochrome via currentColor.
export function OtoMark({ size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" {...props}>
      <circle
        cx="8"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="80 20"
        transform="rotate(-13 8 8)"
      />
    </svg>
  );
}
