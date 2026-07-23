import { api } from "@/lib/api";
import type { Connector, CredentialField } from "@/lib/mock-data";

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
  credential_fields: CredentialField[];
  auth: { method: string; cardinality: string };
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
    credentialFields: c.credential_fields,
    authMethod: c.auth.method,
    authCardinality: c.auth.cardinality,
  };
}

export async function fetchConnectors(): Promise<Connector[]> {
  const { connectors } = await api<{ connectors: ApiConnector[] }>(
    "/api/me/connectors?verbose=true",
  );
  return connectors.map(mapConnector);
}

// Real, generic mutations (oto-backend capabilities/connectors_selection.py) —
// work for any connector, not just api_key ones.
export async function selectConnector(name: string): Promise<void> {
  await api(`/api/me/connectors/${encodeURIComponent(name)}/select`, { method: "POST" });
}

export async function pauseConnector(name: string): Promise<void> {
  await api(`/api/me/connectors/${encodeURIComponent(name)}/pause`, { method: "POST" });
}

export async function unselectConnector(name: string): Promise<void> {
  await api(`/api/me/connectors/${encodeURIComponent(name)}`, { method: "DELETE" });
}

// Generic credential save (ADR 0011) — covers api_key ({key}), basic_auth
// (Planity: {email,password}), and "fields" connectors alike: the server
// packs/encrypts by shape, keyed by each field's real `name`. Doesn't cover
// cookie (Browserbase session flow) or oauth (per-connector redirect) —
// those aren't a form post.
export async function setConnectorCredential(
  name: string,
  fields: Record<string, string>,
): Promise<void> {
  await api(`/api/settings/api-keys/${encodeURIComponent(name)}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
}

export async function deleteConnectorCredential(
  name: string,
  scope: "member" | "org" | "group" = "member",
): Promise<void> {
  const suffix = scope !== "member" ? `?scope=${scope}` : "";
  await api(`/api/settings/api-keys/${encodeURIComponent(name)}${suffix}`, { method: "DELETE" });
}

// Cookie secretKind (brevo, crunchbase, pennylaneged) — hosted Browserbase
// live-view login. `start` opens a remote browser and returns its Live View
// URL (embedded in an iframe for the user to log in); `finalize` verifies
// the session actually authenticated and persists it as the credential.
// Mirrors oto-dashboard's ConnectorSessionConnect.vue — no polling, the user
// clicks "Verify" once they've finished logging in.
export async function startConnectorSession(
  name: string,
): Promise<{ live_view_url: string; context_id: string; session_id: string }> {
  return api(`/api/me/connectors/${encodeURIComponent(name)}/session/start`, { method: "POST" });
}

export async function finalizeConnectorSession(
  name: string,
  ctx: { context_id: string; session_id: string; scope?: "member" | "org" | "group" },
): Promise<{ connected: boolean; scope: string }> {
  return api(`/api/me/connectors/${encodeURIComponent(name)}/session/finalize`, {
    method: "POST",
    body: JSON.stringify(ctx),
  });
}

// Generic federated-MCP OAuth (memento, atlassian, folkmcp… any single-account
// "oauth" connector) — each has its own literal `/api/{name}/oauth/*` routes
// server-side, but the same shape, so one client function covers all of
// them. Mirrors oto-dashboard's getFederatedStatus/startFederatedOauth/
// disconnectFederated. `start` is a full-page redirect (`window.location.href
// = auth_url`), not a fetch — the caller navigates away.
export type FederatedStatus = { connected: boolean; set_at: string | null };

export async function getFederatedStatus(name: string): Promise<FederatedStatus> {
  return api(`/api/${encodeURIComponent(name)}/oauth/status`);
}

export async function startFederatedOauth(name: string): Promise<{ auth_url: string }> {
  return api(`/api/${encodeURIComponent(name)}/oauth/start`);
}

export async function disconnectFederated(name: string): Promise<void> {
  await api(`/api/${encodeURIComponent(name)}/oauth`, { method: "DELETE" });
}
