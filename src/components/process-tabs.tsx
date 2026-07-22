"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, focusRing } from "@/lib/cn";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/flow", label: "Flow" },
  { href: "/usage", label: "Usage" },
] as const;

export function ProcessTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/processes/${slug}`;

  return (
    <div
      role="tablist"
      aria-label="Process views"
      className="inline-flex items-center gap-1 rounded-full bg-gray-11/90 p-1 backdrop-blur-md"
    >
      {tabs.map(({ href: tabHref, label }) => {
        const href = `${base}${tabHref}`;
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex h-8 items-center rounded-full px-3 text-caption transition-colors duration-100 motion-reduce:transition-none",
              active ? "text-gray-1" : "text-gray-1/45 hover:bg-gray-1/10 hover:text-gray-1/70",
              focusRing,
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
