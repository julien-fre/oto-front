"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn, focusRing } from "@/lib/cn";
import { useSidebar } from "./sidebar-provider";

export function NavLink({
  href,
  label,
  icon,
  match = "prefix",
  indent = false,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  match?: "exact" | "prefix";
  indent?: boolean;
}) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const active =
    match === "exact"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      // Close-on-navigate only fires when the pathname changes; this also
      // closes the drawer when tapping a link to the current route.
      onClick={() => setMobileOpen(false)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-7 items-center gap-2 rounded-full pr-2 transition-colors duration-100 motion-reduce:transition-none",
        // Nested rows sit inside a tree-guide container that already indents
        // them, so they only need a hair of padding of their own.
        indent ? "pl-1" : "px-2",
        active ? "bg-interactive-checked" : "hover:bg-interactive-hovered",
        focusRing,
      )}
    >
      {icon && <span className="shrink-0 text-icon">{icon}</span>}
      <span
        className={cn(
          "min-w-0 flex-1 truncate transition-colors duration-100 motion-reduce:transition-none",
          active
            ? "text-body-medium text-gray-12"
            : indent
              ? "text-body text-muted group-hover:text-gray-12"
              : "text-body text-gray-12",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
