import type { Metadata } from "next";
import { ConnectorsBrowser } from "@/components/connectors-browser";
import { PageHeader } from "@/components/page-header";
import { connectors } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Connectors" };

export default function ConnectorsPage() {
  return (
    <div className="max-w-6xl px-12 pt-2 pb-6">
      <PageHeader title="Connectors" />
      <ConnectorsBrowser connectors={connectors} />
    </div>
  );
}
