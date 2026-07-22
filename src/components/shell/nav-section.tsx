"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { useSidebar } from "./sidebar-provider";

export function NavSection({
  idPrefix,
  id,
  label,
  href,
  icon,
  addLabel,
  children,
}: {
  // The sidebar content renders twice (desktop column + mobile drawer);
  // prefixing keeps the aria-controls target ids unique per instance.
  idPrefix: string;
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  addLabel: string;
  children: ReactNode;
}) {
  const { expanded, toggleGroup, setMobileOpen } = useSidebar();
  const isExpanded = expanded.includes(id);
  const pathname = usePathname();
  const active = pathname === href;
  const groupId = `nav-group-${idPrefix}-${id}`;

  return (
    <div>
      <div
        className={cn(
          "group/row flex h-7 items-center gap-2 rounded-full px-2",
          active ? "bg-interactive-checked" : "hover:bg-interactive-hovered",
        )}
      >
        <button
          type="button"
          onClick={() => toggleGroup(id)}
          aria-expanded={isExpanded}
          aria-controls={groupId}
          aria-label={isExpanded ? `Collapse ${label.toLowerCase()}` : `Expand ${label.toLowerCase()}`}
          className={cn(
            "relative flex size-5 shrink-0 items-center justify-center rounded-full text-icon",
            focusRing,
          )}
        >
          <span className="group-focus-within/row:opacity-0 group-hover/row:opacity-0">
            {icon}
          </span>
          <ChevronRightIcon
            className={cn(
              "absolute inset-0 m-auto opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        <Link
          href={href}
          onClick={() => setMobileOpen(false)}
          aria-current={active ? "page" : undefined}
          className={cn(
            "min-w-0 flex-1 truncate rounded-full",
            active ? "text-body-medium text-gray-12" : "text-body text-gray-12",
            focusRing,
          )}
        >
          {label}
        </Link>
        <button
          type="button"
          aria-label={addLabel}
          onClick={() => console.debug(addLabel)}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-icon opacity-0 hover:bg-interactive-hovered focus-visible:opacity-100 group-hover/row:opacity-100",
            focusRing,
          )}
        >
          <PlusIcon />
        </button>
      </div>
      <div id={groupId} hidden={!isExpanded}>
        {children}
      </div>
    </div>
  );
}
