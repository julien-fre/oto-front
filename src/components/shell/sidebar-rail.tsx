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
  onResize,
  onToggle,
  onDragStart,
  onDragEnd,
}: {
  width: number;
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
        "group absolute inset-y-0 right-0 z-10 w-2.5 translate-x-1/2 cursor-col-resize",
        focusRing,
      )}
    >
      <div className="mx-auto h-full w-px bg-transparent transition-colors group-hover:bg-gray-7" />
    </div>
  );
}
