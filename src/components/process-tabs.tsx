"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppVersion } from "@/components/shell/version-provider";
import { cn, focusRing } from "@/lib/cn";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/flow", label: "Flow" },
  { href: "/usage", label: "Usage" },
] as const;

export function ProcessTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { version } = useAppVersion();
  const base = `/processes/${slug}`;

  // Flow and Usage aren't finished yet — V0 hides the whole tab row (Overview
  // included) rather than show a single tab with nothing to switch to.
  if (version === "v0") return null;

  return (
    <div role="tablist" aria-label="Process views" className="flex items-center gap-1">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex h-7 items-center rounded-full px-3 text-button transition-colors duration-100 motion-reduce:transition-none",
              active
                ? "bg-interactive-checked text-gray-12"
                : "border border-border text-muted hover:bg-interactive-hovered hover:text-gray-12",
              focusRing,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
