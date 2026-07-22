import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { processes } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Processes" };

const statusLabel = { active: "Active", draft: "Draft", deprecated: "Deprecated" } as const;

export default function ProcessesPage() {
  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Processes"
        caption="Automations and internal products, each composed of reusable skills."
      />
      <div className="mt-8 divide-y divide-gray-5 border-y border-gray-5">
        {processes.map((process) => (
          <Link
            key={process.slug}
            href={`/processes/${process.slug}`}
            className="flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-gray-12">{process.name}</span>
              <span className="block truncate text-caption text-muted">
                {process.description}
              </span>
            </span>
            <span className="shrink-0 text-caption text-muted">
              {process.schedule ?? "Manual"}
            </span>
            <span
              className={
                process.status === "active"
                  ? "w-16 shrink-0 text-right text-caption text-green-11"
                  : "w-16 shrink-0 text-right text-caption text-muted"
              }
            >
              {statusLabel[process.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
