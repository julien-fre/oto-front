import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { connectors, docs, processes } from "@/lib/mock-data";

// title.template in the root layout does not apply to the same segment's page
export const metadata: Metadata = { title: { absolute: "Home · Oto" } };

// A first cut of the auto-generated workspace index that both company-OS
// precedents maintained by hand (the CLAUDE.md tables). The real dashboard is
// its own issue; this stub already computes from the workspace objects.
export default function HomePage() {
  const activeProcesses = processes.filter((p) => p.status === "active");
  const connected = connectors.filter((c) => c.status === "connected");
  const sections = [
    {
      href: "/knowledge",
      title: "Knowledge",
      summary: `${docs.length} docs · last verified Jul 20, 2026`,
    },
    {
      href: "/processes",
      title: "Processes",
      summary: `${activeProcesses.length} active · ${activeProcesses.filter((p) => p.schedule).length} scheduled`,
    },
    {
      href: "/connectors",
      title: "Connectors",
      summary: `${connected.length} of ${connectors.length} connected`,
    },
  ];

  return (
    <div className="px-8 py-6">
      <PageHeader title="Home" caption="The workspace at a glance." />
      <div className="mt-8 divide-y divide-gray-5 border-y border-gray-5">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-baseline gap-4 px-2 py-2 hover:bg-gray-2"
          >
            <span className="min-w-0 flex-1 truncate text-body text-gray-12">
              {section.title}
            </span>
            <span className="shrink-0 text-caption text-muted">{section.summary}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
