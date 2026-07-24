import type { MeInfo } from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";

export type Scope = "member" | "org" | "group";

export const scopeLabels: Record<Scope, string> = {
  member: "Just me",
  org: "My org",
  group: "My team",
};

// Mirrors the backend's own gate (oto_mcp/providers.py::org_secret_meta,
// oto_mcp/roles.py:45-86): a shared scope is only offered when the
// connector is org-shareable (`byo_org` in auth_modes) AND the viewer
// actually admins that scope — matches what session_finalize/org.secret.set/
// group.secret.set would accept, so the picker never offers an option the
// backend would 403 on.
export function availableScopesFor(connector: Connector, meInfo: MeInfo): Scope[] {
  const shareable = connector.authModes.includes("byo_org");
  const canGroup = shareable && meInfo.groupRole === "group_admin";
  const canOrg = shareable && meInfo.orgRole === "org_admin";
  return ["member", ...(canGroup ? (["group"] as const) : []), ...(canOrg ? (["org"] as const) : [])];
}

// Whether `scope` has a credential/session configured, per providerStatus —
// computed regardless of which rung actually wins the cascade (access.py::
// status_for walks the whole cascade for status, not just the winner).
export function isScopeConfigured(status: Connector["providerStatus"], scope: Scope): boolean {
  if (!status) return false;
  if (scope === "member") return Boolean(status.user_key_configured) || status.session_set_at != null;
  if (scope === "group") return Boolean(status.group_secret_configured);
  return Boolean(status.org_secret_configured);
}
