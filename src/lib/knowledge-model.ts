// The knowledge section's data model, derived client-side from the backend's
// flat doc list. Pure — no fetching, no browser APIs — so it is testable and
// importable from anywhere. The fetch lives in knowledge-api.ts.
//
// Link resolution deliberately mirrors the server's own algorithm
// (oto-backend db/backlinks.py): same regex, same whitespace-collapse +
// casefold normalisation, smallest id wins a title tie, a page never links
// itself, and an unmatched [[title]] is a stub. Freshness mirrors
// doc_lint.py: stale = not touched in 90 days.

import { extractWikilinks, normalizeTitle } from "./markdown";
import { LABEL_DOT_COLORS } from "./label-colors";

export type DocKind = "doc" | "note" | "source";

export type KnowledgeDoc = {
  id: number;
  parentId: number | null;
  title: string;
  /** The curated chapô — empty unless someone set it explicitly. */
  description: string;
  /** description, or a first-line derivation from the body — for list rows,
   *  previews and graph excerpts. The doc page's lede uses `description`
   *  alone, so the derivation never duplicates the opening paragraph. */
  summary: string;
  bodyMd: string;
  kind: DocKind;
  createdAt: string;
  updatedAt: string;
  /** Content ETag — pass back as expected_rev on a future update. */
  rev: string;
  isPublic: boolean;
  publicUrl: string | null;
  freshness: "fresh" | "stale";
};

export type KnowledgeBase = {
  projectId: number;
  name: string;
  docs: KnowledgeDoc[];
  byId: Map<number, KnowledgeDoc>;
  /** Tree index: parentId (null = top level) → ordered children. */
  children: Map<number | null, KnowledgeDoc[]>;
  /** Resolved [[wikilink]] targets per doc. */
  outgoing: Map<number, number[]>;
  /** Unresolved [[wikilink]] titles per doc — the backend's "liens-souches". */
  stubs: Map<number, string[]>;
  /** Reverse of outgoing — the backlinks. */
  incoming: Map<number, number[]>;
  /** Top-level ancestor of each doc — the branch it belongs to. */
  branchOf: Map<number, number>;
  resolveTitle: (title: string) => number | null;
};

// Raw REST shapes (snake_case), per capabilities/docs.py _view().
export type ApiDoc = {
  id: number;
  project_id: number;
  parent_id: number | null;
  title: string | null;
  description: string | null;
  position: number | null;
  body_md: string | null;
  kind: string;
  created_at: string;
  updated_at: string;
  rev: string;
  public: boolean;
  public_url: string | null;
};

// The lint rule's staleness horizon (oto-backend doc_lint.py, default
// stale_days=90) — reproduced client-side so the section doesn't need a
// second request just for freshness.
const STALE_DAYS = 90;

// Timestamps arrive as "YYYY-MM-DD HH:MM:SS" (the backend's row factory strips
// tzinfo without converting — oto-backend db/_conn.py). Treated as UTC here,
// which holds as long as the managed Postgres session timezone is UTC; if the
// dates ever read shifted, that assumption is where to look.
export function parseDocDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Jul 23, 2026" — month names hardcoded so server locale can't leak in. */
export function formatDocDate(value: string): string {
  const d = parseDocDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Identity color for a doc — stable per id, same palette as the sidebar. */
export function docAccentColor(id: number): string {
  return LABEL_DOT_COLORS[id % LABEL_DOT_COLORS.length];
}

/** First prose-looking line of a body, cropped — the client-side equivalent
 *  of the backend's derive_description (db/projects.py), which the REST list
 *  view does not apply. */
function deriveSummary(bodyMd: string): string {
  for (const raw of bodyMd.split("\n")) {
    const line = raw.trim();
    if (!line || /^[#>|`\-*+\d]/.test(line)) continue;
    const text = line.replace(/\[\[|\]\]|[*_`]/g, "");
    return text.length > 140 ? `${text.slice(0, 139).trimEnd()}…` : text;
  }
  return "";
}

function mapDoc(raw: ApiDoc, now: number): KnowledgeDoc {
  const updated = parseDocDate(raw.updated_at);
  const stale =
    !Number.isNaN(updated.getTime()) && now - updated.getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
  const description = raw.description ?? "";
  return {
    id: raw.id,
    parentId: raw.parent_id,
    title: raw.title ?? "",
    description,
    summary: description || deriveSummary(raw.body_md ?? ""),
    bodyMd: raw.body_md ?? "",
    kind: raw.kind === "note" || raw.kind === "source" ? raw.kind : "doc",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    rev: raw.rev,
    isPublic: raw.public,
    publicUrl: raw.public_url,
    freshness: stale ? "stale" : "fresh",
  };
}

/** Derive every index the section needs from the flat doc list. Pure. */
export function assembleKnowledgeBase(
  projectId: number,
  name: string,
  rawDocs: ApiDoc[],
  now: number,
): KnowledgeBase {
  const docs = rawDocs.map((raw) => mapDoc(raw, now));
  const byId = new Map(docs.map((d) => [d.id, d]));

  // The list arrives ordered by (parent, position, title) — grouping keeps
  // sibling order, so the tree renders the way the backend curates it.
  const children = new Map<number | null, KnowledgeDoc[]>();
  for (const doc of docs) {
    const key = doc.parentId != null && byId.has(doc.parentId) ? doc.parentId : null;
    const siblings = children.get(key);
    if (siblings) siblings.push(doc);
    else children.set(key, [doc]);
  }

  // Title index for wikilink resolution: smallest id wins a tie, exactly like
  // the server's _rank (backlinks.py).
  const byTitle = new Map<string, number>();
  for (const doc of docs) {
    const key = normalizeTitle(doc.title);
    if (!key) continue;
    const existing = byTitle.get(key);
    if (existing === undefined || doc.id < existing) byTitle.set(key, doc.id);
  }
  const resolveTitle = (title: string) => byTitle.get(normalizeTitle(title)) ?? null;

  const outgoing = new Map<number, number[]>();
  const stubs = new Map<number, string[]>();
  const incoming = new Map<number, number[]>();
  for (const doc of docs) {
    const targets: number[] = [];
    const missing: string[] = [];
    for (const title of extractWikilinks(doc.bodyMd)) {
      const target = resolveTitle(title);
      if (target == null) missing.push(title);
      else if (target !== doc.id && !targets.includes(target)) targets.push(target);
    }
    outgoing.set(doc.id, targets);
    stubs.set(doc.id, missing);
    for (const target of targets) {
      const back = incoming.get(target);
      if (back) back.push(doc.id);
      else incoming.set(target, [doc.id]);
    }
  }

  // Walk each doc up to its top-level ancestor; a cycle (shouldn't happen,
  // but rows are data) falls back to the doc itself.
  const branchOf = new Map<number, number>();
  for (const doc of docs) {
    let cursor = doc;
    const seen = new Set<number>([doc.id]);
    while (cursor.parentId != null) {
      const parent = byId.get(cursor.parentId);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      cursor = parent;
    }
    branchOf.set(doc.id, cursor.id);
  }

  return { projectId, name, docs, byId, children, outgoing, stubs, incoming, branchOf, resolveTitle };
}
