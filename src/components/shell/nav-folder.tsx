"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon, DottedIcon, FolderIcon } from "@/components/icons";
import { cn, focusRing, treeGuide } from "@/lib/cn";
import { useSidebar } from "./sidebar-provider";

// A folder inside a section: click anywhere on the row to open or close it.
// Unlike a section header it has no destination of its own — it is pure
// disclosure, the way a file tree behaves.
export function NavFolder({
  id,
  label,
  color,
  children,
}: {
  id: string;
  label: string;
  color: string;
  children: ReactNode;
}) {
  const { expanded, toggleGroup } = useSidebar();
  const isExpanded = expanded.includes(id);
  const groupId = `nav-folder-${id}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleGroup(id)}
        aria-expanded={isExpanded}
        aria-controls={groupId}
        className={cn(
          "flex h-7 w-full items-center gap-1 rounded-full pl-1 pr-2 text-icon transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
          focusRing,
        )}
      >
        <ChevronRightIcon
          className={cn(
            "shrink-0 transition-[rotate] duration-150 motion-reduce:transition-none",
            isExpanded && "rotate-90",
          )}
        />
        <DottedIcon color={color}>
          <FolderIcon />
        </DottedIcon>
        <span className="min-w-0 flex-1 truncate text-left text-body text-gray-12">
          {label}
        </span>
      </button>
      <div
        id={groupId}
        hidden={!isExpanded}
        className={cn(treeGuide, "animate-fade-in motion-reduce:animate-none")}
      >
        {children}
      </div>
    </div>
  );
}
