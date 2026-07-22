"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenIcon,
  PlugIcon,
  SearchIcon,
  SettingsIcon,
  WorkflowIcon,
} from "@/components/icons";
import { OtoMark } from "@/components/oto-mark";
import { cn, focusRing } from "@/lib/cn";
import { useSidebar } from "./sidebar-provider";

// The collapsed sidebar: a 48px icon rail. Tooltips float to the right of
// each item (dropdown shadow, sharp corners), delayed on hover, instant on
// keyboard focus.

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-none bg-background px-2 py-1 text-caption text-gray-12 opacity-0 shadow-dropdown transition-opacity duration-100 group-hover:opacity-100 group-hover:delay-300 group-focus-visible:opacity-100 motion-reduce:transition-none">
      {label}
    </span>
  );
}

// Base only — hover backgrounds are applied per call site so the active
// (checked) state is never overridden by the lighter hover overlay.
const railItem = cn(
  "group relative flex size-8 shrink-0 items-center justify-center rounded-full text-icon",
  "transition-[background-color,color,scale] duration-100 motion-reduce:transition-none",
  "active:scale-95",
  focusRing,
);

const railItemIdle = "hover:bg-interactive-hovered hover:text-gray-12";

function RailLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(railItem, active ? "bg-interactive-checked text-gray-12" : railItemIdle)}
    >
      {icon}
      <Tooltip label={label} />
    </Link>
  );
}

export function Rail() {
  const { toggleNav, setPaletteOpen } = useSidebar();

  return (
    <div className="flex h-full w-12 animate-fade-in flex-col items-center motion-reduce:animate-none">
      <div className="flex h-12 shrink-0 items-center">
        <button
          type="button"
          onClick={() => toggleNav("button")}
          aria-label="Expand sidebar"
          className={cn(railItem, railItemIdle)}
        >
          <OtoMark className="text-gray-12 transition-transform duration-300 ease-out group-hover:rotate-90 motion-reduce:transition-none" />
          <Tooltip label="Expand sidebar" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search"
        className={cn(railItem, railItemIdle)}
      >
        <SearchIcon />
        <Tooltip label="Search ⌘K" />
      </button>
      <nav aria-label="Main" className="mt-4 flex flex-col items-center gap-1">
        <RailLink href="/knowledge" label="Knowledge" icon={<BookOpenIcon />} />
        <RailLink href="/processes" label="Processes" icon={<WorkflowIcon />} />
        <RailLink href="/connectors" label="Connectors" icon={<PlugIcon />} />
      </nav>
      <div className="mb-2 mt-auto flex flex-col items-center gap-1">
        <RailLink href="/settings" label="Settings" icon={<SettingsIcon />} />
        <button
          type="button"
          aria-haspopup="menu"
          aria-label="Alessandro"
          className={cn(railItem, railItemIdle)}
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-gray-4 text-caption text-gray-11">
            AM
          </span>
          <Tooltip label="Alessandro" />
        </button>
      </div>
    </div>
  );
}
