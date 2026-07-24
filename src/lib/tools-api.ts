import { api } from "@/lib/api";

// Real per-tool catalog (oto-mcp's /api/me/tools + /api/me/tools/registry) —
// server-wide, not connector-scoped; callers filter by namespace themselves
// (see namespaceOfTool below) to get a connector's tools.
export type Tool = {
  name: string;
  description: string;
  source: "native" | "federated";
  enabled: boolean;
  protected: boolean;
};

// Mirrors oto_mcp/tool_visibility.py::namespace_of — namespace is always the
// first token before `_` (e.g. "slack_send_message" -> "slack").
export function namespaceOfTool(name: string): string {
  return name.split("_", 1)[0];
}

export async function fetchTools(): Promise<Tool[]> {
  const [{ tools: registry }, { tools: states }] = await Promise.all([
    api<{
      tools: { name: string; description: string; source: "native" | "federated" }[];
    }>("/api/me/tools/registry"),
    api<{ tools: { name: string; enabled: boolean; protected: boolean }[] }>("/api/me/tools"),
  ]);
  const stateByName = new Map(states.map((s) => [s.name, s]));
  return registry.map((r) => ({
    ...r,
    enabled: stateByName.get(r.name)?.enabled ?? true,
    protected: stateByName.get(r.name)?.protected ?? false,
  }));
}

// Backend REST verbs are inverted from what they read like: POST disables,
// DELETE enables (oto_mcp/api_routes.py::my_tools_disable/my_tools_enable).
export async function disableTool(name: string): Promise<void> {
  await api(`/api/me/tools/${encodeURIComponent(name)}`, { method: "POST" });
}

export async function enableTool(name: string): Promise<void> {
  await api(`/api/me/tools/${encodeURIComponent(name)}`, { method: "DELETE" });
}
