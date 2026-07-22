import type { Metadata } from "next";
import { ConnectorsBrowser } from "@/components/connectors-browser";
import { connectors } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Connectors" };

export default function ConnectorsPage() {
  return (
    <div className="flex h-full flex-col px-12 py-6">
      <ConnectorsBrowser connectors={connectors} />
    </div>
  );
}
