// Freshness is the one property of a doc that is genuinely *state*, so it is
// the one allowed to speak in colour. Mapped in one place, next to the type,
// the way connector-status.ts does it — never inlined at a call site, or the
// dot and its label drift apart.
//
// Two states, matching the backend's lint rule (oto-backend doc_lint.py):
// a page is stale once it hasn't been touched for 90 days — a warning, not an
// error, so it wears amber and never red. The client computes it from
// updated_at with the same horizon (see knowledge-api.ts) rather than making
// a second request for op=lint.

export type Freshness = "fresh" | "stale";

export const freshnessLabel: Record<Freshness, string> = {
  fresh: "Up to date",
  stale: "Needs review",
};

export const freshnessDotClassName: Record<Freshness, string> = {
  fresh: "bg-green-9",
  stale: "bg-amber-9",
};

export const freshnessTextClassName: Record<Freshness, string> = {
  fresh: "text-gray-12",
  stale: "text-amber-11",
};

/** The hex the graph canvas paints a stale node's ring with. Matches amber-9. */
export const FRESHNESS_RING = "#ffc53d";
