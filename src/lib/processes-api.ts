import { api } from "@/lib/api";
import { KNOWN_TOOL_IDS } from "@/lib/mock-data";

// Shape of oto-mcp's GET /api/me/instructions (oto-backend/oto_mcp/capabilities/
// orgs_instructions.py:_instructions_list) — the base doctrine plus the org's
// named instructions index. We only ever show the named ones as processes.
type ApiInstructionSummary = {
  slug: string;
  title: string;
  description: string;
  version: number;
  updated_at: string | null;
};

export type ProcessSummary = {
  slug: string;
  name: string;
  description: string;
  version: number;
  updatedAt: string | null;
};

function mapSummary(i: ApiInstructionSummary): ProcessSummary {
  return {
    slug: i.slug,
    name: i.title,
    description: i.description,
    version: i.version,
    updatedAt: i.updated_at,
  };
}

export async function fetchProcesses(): Promise<ProcessSummary[]> {
  const { instructions } = await api<{ instructions: ApiInstructionSummary[] }>(
    "/api/me/instructions",
  );
  return instructions.map(mapSummary);
}

// Shape of GET /api/me/instructions/{slug} (_instruction_get) — no
// referenced_tools/versions[]/_org here, those are MCP-only enrichments.
type ApiInstruction = {
  slug: string;
  title: string;
  description: string;
  version: number;
  body_md: string;
  set_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RealProcess = {
  slug: string;
  name: string;
  description: string;
  version: number;
  bodyMd: string;
  updatedAt: string | null;
  // Derived client-side from bodyMd text — no backend field ties a doctrine
  // to "its" tools/connectors (that link only exists on a Project, MCP-only).
  // An oto-front heuristic, not backend-verified data.
  tools: string[];
};

// Scans raw markdown for the exact tool identifiers we know how to map to a
// connector (KNOWN_TOOL_IDS, from mock-data.ts's TOOL_CONNECTORS) — a plain
// substring search, not a markdown parse, since these tokens only ever appear
// inside inline code spans in practice.
export function detectTools(bodyMd: string): string[] {
  return KNOWN_TOOL_IDS.filter((tool) => bodyMd.includes(tool));
}

export async function fetchProcess(slug: string): Promise<RealProcess> {
  const instr = await api<ApiInstruction>(`/api/me/instructions/${encodeURIComponent(slug)}`);
  return {
    slug: instr.slug,
    name: instr.title,
    description: instr.description,
    version: instr.version,
    bodyMd: instr.body_md,
    updatedAt: instr.updated_at,
    tools: detectTools(instr.body_md),
  };
}

// Shape of GET /api/me/instructions/{slug}/versions (_instruction_versions →
// org_store.list_instruction_versions: "SELECT version, title, set_by,
// created_at ... ORDER BY version DESC", most recent first). `set_by` is an
// opaque platform sub id with no resolvable display name over this API, so
// it's dropped rather than shown as a raw id.
type ApiInstructionVersion = {
  version: number;
  title: string;
  set_by: string | null;
  created_at: string | null;
};

export type ProcessVersion = {
  version: number;
  title: string;
  createdAt: string | null;
};

export async function fetchProcessVersions(slug: string): Promise<ProcessVersion[]> {
  const { versions } = await api<{ slug: string; versions: ApiInstructionVersion[] }>(
    `/api/me/instructions/${encodeURIComponent(slug)}/versions`,
  );
  return versions.map((v) => ({ version: v.version, title: v.title, createdAt: v.created_at }));
}

// POST /api/me/instructions/{slug}/revert (org_admin only) — copies an old
// version's content into a BRAND-NEW version; it does not rewind the version
// number (reverting v3 to v1's content produces v4, not v1). Callers should
// refetch both the process and its version list afterwards.
export async function revertProcess(
  slug: string,
  version: number,
): Promise<{ version: number; revertedFrom: number }> {
  const result = await api<{ ok: boolean; slug: string; version: number; reverted_from: number }>(
    `/api/me/instructions/${encodeURIComponent(slug)}/revert`,
    { method: "POST", body: JSON.stringify({ version }) },
  );
  return { version: result.version, revertedFrom: result.reverted_from };
}
