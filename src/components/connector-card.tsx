import type { Connector } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

function statusDisplay(connector: Connector): { label: string; className: string } {
  if (connector.condition === "degraded")
    return { label: "Degraded", className: "bg-amber-9/15 text-amber-11" };
  switch (connector.status) {
    case "connected":
      return { label: "Connected", className: "bg-green-9/15 text-green-11" };
    case "pending":
      return { label: "Pending access", className: "bg-amber-9/15 text-amber-11" };
    case "empty":
      return { label: "Connected, no data", className: "bg-gray-4 text-muted" };
    case "disconnected":
      return { label: "Not connected", className: "bg-gray-4 text-muted" };
  }
}

function ConnectorLogo({ connector }: { connector: Connector }) {
  if (connector.logoUrl) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- external per-connector logos, no fixed domain list to allowlist */}
        <img src={connector.logoUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-4 text-body-medium text-gray-11">
      {connector.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ConnectorCard({ connector }: { connector: Connector }) {
  const status = statusDisplay(connector);
  return (
    <div className="rounded-none border border-border p-3 hover:bg-gray-2">
      <div className="flex items-start justify-between gap-2">
        <ConnectorLogo connector={connector} />
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-caption", status.className)}>
          {status.label}
        </span>
      </div>
      <p className="mt-3 text-body-medium text-gray-12">{connector.name}</p>
      <p className="mt-1 text-caption text-muted">{connector.description}</p>
    </div>
  );
}
