"use client";

import { useRef } from "react";
import { cn, focusRing } from "@/lib/cn";
import { MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from "@/lib/sidebar-cookies";

const DRAG_THRESHOLD = 4; // px of movement before a press counts as a resize, not a click
const KEYBOARD_STEP = 16;
// Drag the rail past this and the sidebar snaps shut instead of just
// clamping at the minimum width — matches Linear's "drag it closed" feel.
const COLLAPSE_THRESHOLD = MIN_SIDEBAR_WIDTH - 60;

// The edge handle on the open sidebar: drag to resize, click it (no
// movement) to collapse, arrow keys to resize and Enter/Space to collapse
// when focused — a proper ARIA "window splitter" (role="separator" +
// aria-value*), not a plain div. Only rendered while open; reopening from
// collapsed happens via the left-edge hover peek instead (see sidebar.tsx).
export function SidebarRail({
  width,
  active,
  onResize,
  onToggle,
  onDragStart,
  onDragEnd,
}: {
  width: number;
  // True while a resize drag is in flight. The pointer leaves the handle as
  // soon as the drag starts, so hover alone would blink the bar off mid-drag.
  active?: boolean;
  onResize: (width: number) => void;
  onToggle: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const moved = useRef(false);
  const collapsed = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startWidth = width;
    moved.current = false;
    collapsed.current = false;
    onDragStart();

    function end() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      onDragEnd();
    }
    function onPointerMove(ev: PointerEvent) {
      const delta = ev.clientX - startX;
      if (Math.abs(delta) > DRAG_THRESHOLD) moved.current = true;
      const raw = startWidth + delta;
      if (raw < COLLAPSE_THRESHOLD) {
        collapsed.current = true;
        end();
        onToggle();
        return;
      }
      onResize(raw);
    }
    function onPointerUp() {
      end();
      if (!moved.current && !collapsed.current) onToggle();
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onResize(width - KEYBOARD_STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onResize(width + KEYBOARD_STEP);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={MIN_SIDEBAR_WIDTH}
      aria-valuemax={MAX_SIDEBAR_WIDTH}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={cn(
        // Tracks the page panel's edge, not the sidebar's own: the panel is
        // inset by 8px (layout.page-inset), so the handle is pushed out by the
        // same amount and stops at the panel's bottom. The line you grab is
        // then exactly the edge you appear to be dragging.
        "group absolute inset-y-2 -right-2 z-10 w-2.5 translate-x-1/2 cursor-col-resize",
        focusRing,
      )}
    >
      {/* At rest the page panel's own border is the divider; on hover — and
          for the whole drag — this thickens and darkens over it so the edge
          reads as grabbable. Inset by the panel's corner radius (rounded-xl,
          12px) so the bar covers only the straight run of that edge and never
          cuts across the rounded corners. The hit area stays full height. */}
      <div
        className={cn(
          "absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2 transition-colors duration-100 motion-reduce:transition-none",
          active ? "bg-gray-9" : "bg-transparent group-hover:bg-gray-9",
        )}
      />
    </div>
  );
}
