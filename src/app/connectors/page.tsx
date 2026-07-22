import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { connectors, connectorUsage } from "@/lib/mock-data";
import type { Connector } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Connectors" };

function statusDisplay(connector: Connector): { label: string; className: string } {
  if (connector.condition === "degraded")
    return { label: "Degraded", className: "text-amber-11" };
  switch (connector.status) {
    case "connected":
      return { label: "Connected", className: "text-green-11" };
    case "pending":
      return { label: "Pending access", className: "text-amber-11" };
    case "empty":
      return { label: "Connected, no data", className: "text-muted" };
    case "disconnected":
      return { label: "Not connected", className: "text-muted" };
  }
}

export default function ConnectorsPage() {
  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Connectors"
        caption="The tools this workspace is connected to."
      />
      <div className="mt-8 divide-y divide-gray-5 border-y border-gray-5">
        {connectors.map((connector) => {
          const status = statusDisplay(connector);
          const usage = connectorUsage(connector.id);
          return (
            <div key={connector.id} className="flex items-baseline gap-4 px-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-gray-12">
                  {connector.name}
                </span>
                <span className="block truncate text-caption text-muted">
                  {connector.description}
                </span>
              </span>
              <span className="shrink-0 text-caption text-muted">
                {usage === 1 ? "1 process" : `${usage} processes`}
              </span>
              <span className={`w-32 shrink-0 text-right text-caption ${status.className}`}>
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
