"use client";

import { useRef } from "react";
import { cn, focusRing } from "@/lib/cn";
import { MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, RAIL_WIDTH } from "@/lib/sidebar-cookies";

const DRAG_THRESHOLD = 4; // px of movement before a press counts as a resize, not a click
const KEYBOARD_STEP = 16;
// Drag past this width (in either direction) and the sidebar snaps shut or
// springs open instead of clamping at the boundary — matches Linear's "drag
// it closed" (and back open) feel.
const SNAP_THRESHOLD = MIN_SIDEBAR_WIDTH - 60;

// The edge handle a Linear-style sidebar exposes: drag it to resize (from
// either the open sidebar or the collapsed icon rail), click it (no
// movement) to collapse/expand, arrow keys to resize and Enter/Space to
// toggle when focused — a proper ARIA "window splitter" (role="separator" +
// aria-value*), not a plain div.
export function SidebarRail({
  open,
  width,
  onResize,
  onToggle,
  onDragStart,
  onDragEnd,
}: {
  open: boolean;
  width: number;
  onResize: (width: number) => void;
  onToggle: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const moved = useRef(false);
  const settled = useRef(false); // sprang open or snapped shut mid-drag
  const wasOpen = useRef(open);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startWidth = open ? width : RAIL_WIDTH;
    moved.current = false;
    settled.current = false;
    wasOpen.current = open;
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

      if (wasOpen.current) {
        if (raw < SNAP_THRESHOLD) {
          settled.current = true;
          wasOpen.current = false;
          end();
          onToggle();
          return;
        }
        onResize(raw);
      } else if (raw > SNAP_THRESHOLD) {
        // Springs open and keeps tracking the pointer from here in the same
        // gesture — onResize clamps to MIN_SIDEBAR_WIDTH, so it pops to the
        // minimum width then grows live past that.
        settled.current = true;
        wasOpen.current = true;
        onToggle();
        onResize(raw);
      }
    }
    function onPointerUp() {
      end();
      if (!moved.current && !settled.current) onToggle();
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (open) onResize(width - KEYBOARD_STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (open) onResize(width + KEYBOARD_STEP);
      else onToggle();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={open ? "Resize sidebar" : "Drag to expand sidebar"}
      aria-valuenow={open ? width : RAIL_WIDTH}
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
