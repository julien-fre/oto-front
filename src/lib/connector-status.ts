import type { Connector } from "@/lib/mock-data";

// Oto's real installation states (ConnectorState / connectorVerdict.ts strict
// color semantics), not a fabricated health matrix: olive/active = resolved
// and in use, saffron/paused = installed but hidden from agents, faint/
// not_selected = never installed.
export type ConnectorStatusKey = Connector["status"];

export function connectorStatusKey(connector: Connector): ConnectorStatusKey {
  return connector.status;
}

export const statusLabels: Record<ConnectorStatusKey, string> = {
  active: "Active",
  paused: "Paused",
  not_selected: "Not installed",
};

export const statusPillClassName: Record<ConnectorStatusKey, string> = {
  active: "bg-green-9/15 text-green-11",
  paused: "bg-amber-9/15 text-amber-11",
  not_selected: "bg-gray-4 text-muted",
};
