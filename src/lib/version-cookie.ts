// Shared by the server root layout (read) and the client VersionProvider
// (write) so the cookie name and format cannot drift — same pattern as
// sidebar-cookies.ts.

export const VERSION_COOKIE = "oto_version"; // "v0" | "v1"
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type AppVersion = "v0" | "v1";

// V0 is the default: Flow and Usage aren't built out yet, so new visitors
// should land on the trimmed-down view rather than see unfinished tabs.
export function parseVersion(raw: string | undefined): AppVersion {
  return raw === "v1" ? "v1" : "v0";
}
