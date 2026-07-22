import type { Doc } from "@/lib/mock-data";

// Freshness is the one property of a doc that is genuinely *state*, so it is
// the one allowed to speak in colour. Mapped in one place, next to the type,
// the way connector-status.ts does it — never inlined at a call site, or the
// dot and its label drift apart.
//
// Tone follows the design system's meaning for each hue: green is healthy,
// amber is a warning. A doc past its review date is a warning, not an error,
// so it never goes red — red is reserved for something actually broken.

export type Freshness = Doc["freshness"];

export const freshnessLabel: Record<Freshness, string> = {
  fresh: "Verified",
  aging: "Review soon",
  stale: "Needs review",
};

export const freshnessDotClassName: Record<Freshness, string> = {
  fresh: "bg-green-9",
  aging: "bg-gray-6",
  stale: "bg-amber-9",
};

export const freshnessTextClassName: Record<Freshness, string> = {
  fresh: "text-gray-12",
  aging: "text-muted",
  stale: "text-amber-11",
};

/** The hex the graph canvas paints a stale node's ring with. Matches amber-9. */
export const FRESHNESS_RING = "#ffc53d";

/** "Verified Jul 18, 2026" when fresh, the state name otherwise. */
export function freshnessSummary(doc: Pick<Doc, "freshness" | "verifiedAt">) {
  return doc.freshness === "fresh"
    ? `${freshnessLabel.fresh} ${doc.verifiedAt}`
    : freshnessLabel[doc.freshness];
}
