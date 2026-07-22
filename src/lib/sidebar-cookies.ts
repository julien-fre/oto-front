// Shared by the server root layout (read) and the client SidebarProvider
// (write) so names and formats cannot drift.

export const SIDEBAR_COOKIE = "oto_sidebar"; // "open" | "closed"
// v2: the Knowledge section gained category folders, so the set of group ids
// changed — a new key lets saved state fall back to the new defaults instead
// of showing the new folders collapsed.
export const GROUPS_COOKIE = "oto_sidebar_groups_v2"; // comma-joined expanded group ids

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_EXPANDED = [
  "knowledge",
  "processes",
  "knowledge-company",
  "knowledge-wiki",
  "knowledge-decisions",
];

// Next's cookie store URI-decodes values before we see them, so the raw value
// here is already the plain comma-joined list — decoding again could throw on
// malformed cookies.
export function parseGroups(raw: string | undefined): string[] {
  if (raw === undefined) return DEFAULT_EXPANDED;
  return raw.split(",").filter(Boolean);
}

export function serializeGroups(ids: string[]): string {
  return encodeURIComponent(ids.join(","));
}

// Client-only: writing cookies during render is illegal on the server, so the
// provider persists via document.cookie.
export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
