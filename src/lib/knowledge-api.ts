// The knowledge section's API surface: oto-mcp's org Knowledge Base.
//
// Two calls make the whole read path (both REST bindings of capabilities —
// oto-backend capabilities/kb.py and capabilities/docs.py):
//   POST /api/me/kb   {op:"get"}                → the org's KB project
//   POST /api/me/docs {op:"list", project_id}   → every page, with body_md
//
// Everything else — the tree, the link graph, backlinks, freshness — is
// derived client-side in knowledge-model.ts (pure, re-exported here so
// consumers have one import surface).

import { api } from "./api";
import { assembleKnowledgeBase, type ApiDoc } from "./knowledge-model";

export * from "./knowledge-model";

export async function fetchKnowledgeBase() {
  const kb = await api<{ project_id: number; name: string }>("/api/me/kb", {
    method: "POST",
    body: JSON.stringify({ op: "get" }),
  });
  const list = await api<{ project_id: number; docs: ApiDoc[] }>("/api/me/docs", {
    method: "POST",
    body: JSON.stringify({ op: "list", project_id: kb.project_id }),
  });
  return assembleKnowledgeBase(kb.project_id, kb.name, list.docs, Date.now());
}
