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

// Shape of GET /api/me's `providers[name]` (access.py::status_for) — a
// completely separate axis from `state` above: whether a credential is
// actually configured (and at which level of the sharing cascade), not
// whether the connector is installed/activated. Mirrors oto-dashboard's
// types/api.ts::ProviderStatus (subset used here).
export type ProviderStatus = {
  mode: "user" | "group" | "org" | "platform" | "forbidden" | "over_quota";
  user_key_configured?: boolean;
  group_secret_configured?: boolean;
  org_secret_configured?: boolean;
  session_set_at?: string | null;
  group_session_set_at?: string | null;
  org_session_set_at?: string | null;
  // A team's shared key that's reachable but not currently active (not the
  // winning cascade rung) — set only when mode === "forbidden".
  team_key_group?: { id: number; name: string } | null;
  platform_key_label?: string | null;
};

export type MeInfo = {
  activeOrgId: number | null;
  activeOrgName: string | null;
  activeGroupId: number | null;
  activeGroupName: string | null;
  orgRole: string;
  groupRole: string | null;
};

type Me = {
  providers: Record<string, ProviderStatus | undefined>;
  active_org: number | null;
  active_org_name: string | null;
  active_group: number | null;
  active_group_name: string | null;
  org_role: string;
  group_role: string | null;
};

function mapConnector(c: ApiConnector, providerStatus: ProviderStatus | undefined): Connector {
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
    credentialConfigured:
      Boolean(providerStatus?.user_key_configured) || providerStatus?.session_set_at != null,
    providerStatus,
  };
}

export async function fetchConnectors(): Promise<{ connectors: Connector[]; meInfo: MeInfo }> {
  const [{ connectors }, me] = await Promise.all([
    api<{ connectors: ApiConnector[] }>("/api/me/connectors?verbose=true"),
    api<Me>("/api/me"),
  ]);
  return {
    connectors: connectors.map((c) => mapConnector(c, me.providers[c.name])),
    meInfo: {
      activeOrgId: me.active_org,
      activeOrgName: me.active_org_name,
      activeGroupId: me.active_group,
      activeGroupName: me.active_group_name,
      orgRole: me.org_role,
      groupRole: me.group_role,
    },
  };
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

// Mirrors credentials_store.secret_from_input's own branching (backend
// requirement, not a style choice): connectors with <=1 secret field must
// get `api_key`, connectors with >=2 must get `fields` — sending the wrong
// shape is rejected.
function secretBody(
  fieldCount: number,
  values: Record<string, string>,
): { api_key: string } | { fields: Record<string, string> } {
  if (fieldCount <= 1) return { api_key: Object.values(values)[0] ?? "" };
  return { fields: values };
}

// Org/group-shared keyed credential (ADR 0012/0009 capabilities, NOT the
// member-scope api-keys route above) — org_secret_meta on the backend 400s
// with provider_not_shareable unless the connector has "byo_org" in
// auth_modes (see scope.ts::availableScopesFor, same gate mirrored client-
// side). Clearing reuses deleteConnectorCredential(name, scope) above —
// same generic vault clear_credential, no separate delete route needed.
export async function setOrgSecret(
  orgId: number,
  provider: string,
  fieldCount: number,
  values: Record<string, string>,
): Promise<void> {
  await api(`/api/orgs/${orgId}/secrets/${encodeURIComponent(provider)}`, {
    method: "PUT",
    body: JSON.stringify(secretBody(fieldCount, values)),
  });
}

export async function setGroupSecret(
  groupId: number,
  provider: string,
  fieldCount: number,
  values: Record<string, string>,
): Promise<void> {
  await api(`/api/groups/${groupId}/secrets/${encodeURIComponent(provider)}`, {
    method: "PUT",
    body: JSON.stringify(secretBody(fieldCount, values)),
  });
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
