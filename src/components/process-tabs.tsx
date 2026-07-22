"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, RowsIcon, WorkflowIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";

const tabs = [
  { href: "", label: "Overview", icon: RowsIcon },
  { href: "/flow", label: "Flow", icon: WorkflowIcon },
  { href: "/usage", label: "Usage", icon: ChartIcon },
] as const;

export function ProcessTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/processes/${slug}`;

  return (
    <div
      role="tablist"
      aria-label="Process views"
      className="inline-flex items-center gap-1 rounded-full bg-gray-12/85 p-1 shadow-dropdown backdrop-blur-md"
    >
      {tabs.map(({ href: tabHref, label, icon: Icon }) => {
        const href = `${base}${tabHref}`;
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 transition-colors duration-100 motion-reduce:transition-none",
              active ? "text-gray-1" : "text-gray-1/45 hover:text-gray-1/70",
              focusRing,
            )}
          >
            <Icon size={15} />
            <span className="text-caption">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
