import { api } from "@/lib/api";

// Shape of oto-mcp's GET /api/me/orgs (oto-backend/oto_mcp/capabilities/
// orgs_reads.py:_list_my_orgs) — every org the user belongs to, plus which
// one is currently active.
type ApiOrg = {
  id: number;
  name: string;
  logo_url: string | null;
  member_count: number;
  my_role: string;
  active: boolean;
};

export type OrgSummary = {
  id: number;
  name: string;
  logoUrl: string | null;
  memberCount: number;
  role: string;
  active: boolean;
};

function mapOrg(o: ApiOrg): OrgSummary {
  return {
    id: o.id,
    name: o.name,
    logoUrl: o.logo_url,
    memberCount: o.member_count,
    role: o.my_role,
    active: o.active,
  };
}

export async function fetchOrgs(): Promise<OrgSummary[]> {
  const { orgs } = await api<{ orgs: ApiOrg[]; active_org: number | null }>("/api/me/orgs");
  return orgs.map(mapOrg);
}

// PUT /api/me/active-org (orgs.py::_set_home_org) — sets the persistent HOME
// org, the default every API call without an explicit org token resolves to.
// UI-only by design (no MCP binding — an agent must never mutate a user's
// default across conversations); this is exactly that UI. Takes effect
// immediately for every subsequent request, no reload needed
// (org_store.set_active_org is a plain column write, read fresh per request).
export async function switchOrg(orgId: number): Promise<{ id: number; name: string | null }> {
  const result = await api<{ home_org: number; active_org: number; name: string | null }>(
    "/api/me/active-org",
    { method: "PUT", body: JSON.stringify({ org: String(orgId) }) },
  );
  return { id: result.active_org, name: result.name };
}
