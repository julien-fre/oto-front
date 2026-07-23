import { api } from "@/lib/api";
import type { Connector } from "@/lib/mock-data";

// Shape of oto-mcp's GET /api/me/connectors?verbose=true (subset of
// ConnectorMeta/MyConnector, oto-backend/docs/rest-api.md — snake_case,
// `state` not `status`). Mirrors oto-dashboard's types/api.ts.
type ApiConnector = {
  name: string;
  label: string;
  description: string;
  category: string;
  logo_url: string | null;
  publisher: string;
  namespaces: string[];
  auth_modes: string[];
  secret_kind: string;
  personal_session: boolean;
  state: "not_selected" | "active" | "paused";
};

function mapConnector(c: ApiConnector): Connector {
  return {
    id: c.name,
    name: c.label,
    description: c.description,
    category: c.category,
    logoUrl: c.logo_url,
    publisher: c.publisher,
    status: c.state,
    // No real-backend equivalent (ADR 0030 ownership is per-resource, not
    // per-connector) — the prototype's "owner" field doesn't exist server
    // side, so the Team Access tab starts with no default member selected.
    owner: "",
    namespaces: c.namespaces,
    authModes: c.auth_modes,
    secretKind: c.secret_kind,
    personalSession: c.personal_session,
  };
}

export async function fetchConnectors(): Promise<Connector[]> {
  const { connectors } = await api<{ connectors: ApiConnector[] }>(
    "/api/me/connectors?verbose=true",
  );
  return connectors.map(mapConnector);
}
