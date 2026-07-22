// Shared by the server root layout (read) and the client SidebarProvider
// (write) so names and formats cannot drift.

export const SIDEBAR_COOKIE = "oto_sidebar"; // "open" | "closed"
export const GROUPS_COOKIE = "oto_sidebar_groups"; // comma-joined expanded group ids
export const WIDTH_COOKIE = "oto_sidebar_width"; // px, as a plain number string

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_EXPANDED = ["knowledge", "processes"];

export const DEFAULT_SIDEBAR_WIDTH = 240; // matches the old fixed w-60
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 360;
export const RAIL_WIDTH = 48; // matches Rail's w-12

export function clampWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

export function parseWidth(raw: string | undefined): number {
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? clampWidth(n) : DEFAULT_SIDEBAR_WIDTH;
}

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
