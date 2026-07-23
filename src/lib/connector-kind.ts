import type { Connector } from "@/lib/mock-data";

export type ConnKind = "key" | "session" | "google" | "federated" | "unipile" | "none";

// Which connection widget applies — mirrors oto-dashboard's
// ConnectorConnectionPanel.vue connKind switch (auth.method + auth.cardinality).
// "google" is Google's own multi-account widget (the only multi_account
// connector today); any other single-account "oauth" connector (memento,
// atlassian, folkmcp…) gets the generic federated widget.
export function connKind(connector: Connector): ConnKind {
  switch (connector.authMethod) {
    case "hosted":
      return "unipile";
    case "cookie":
      return "session";
    case "oauth":
      return connector.authCardinality === "multi_account" ? "google" : "federated";
    case "secret":
      return "key";
    default:
      return "none";
  }
}
