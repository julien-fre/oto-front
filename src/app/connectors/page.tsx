import type { Metadata } from "next";
import { ConnectorCategorySection } from "@/components/connector-category-section";
import { PageHeader } from "@/components/page-header";
import { connectors } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Connectors" };

// Same grouping/sort as the real console's category filter: by count desc.
function groupByCategory() {
  const byCategory = new Map<string, typeof connectors>();
  for (const connector of connectors) {
    const group = byCategory.get(connector.category);
    if (group) group.push(connector);
    else byCategory.set(connector.category, [connector]);
  }
  return [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default function ConnectorsPage() {
  const categories = groupByCategory();

  return (
    <div className="px-12 pt-2 pb-6">
      <PageHeader title="Connectors" />
      <div className="mt-8 flex flex-col gap-6">
        {categories.map(([category, categoryConnectors]) => (
          <ConnectorCategorySection
            key={category}
            category={category}
            connectors={categoryConnectors}
          />
        ))}
      </div>
    </div>
  );
}
