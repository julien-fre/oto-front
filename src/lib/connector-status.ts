import type { Connector } from "@/lib/mock-data";

export type ConnectorStatusKey = "connected" | "degraded" | "pending" | "empty" | "disconnected";

export function connectorStatusKey(connector: Connector): ConnectorStatusKey {
  return connector.condition === "degraded" ? "degraded" : connector.status;
}

export const statusLabels: Record<ConnectorStatusKey, string> = {
  connected: "Connected",
  degraded: "Degraded",
  pending: "Pending access",
  empty: "Connected, no data",
  disconnected: "Not connected",
};

export const statusPillClassName: Record<ConnectorStatusKey, string> = {
  connected: "bg-green-9/15 text-green-11",
  degraded: "bg-amber-9/15 text-amber-11",
  pending: "bg-amber-9/15 text-amber-11",
  empty: "bg-gray-4 text-muted",
  disconnected: "bg-gray-4 text-muted",
};
