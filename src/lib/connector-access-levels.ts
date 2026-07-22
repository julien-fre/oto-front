import type { Connector } from "@/lib/mock-data";

// Real levels a connector's credential can live at, derived from the real
// authModes (byo_user/byo_org/platform) — narrowest (closest) first, matching
// the real product's "nearest wins" cascade (ConnectorInstance.level:
// member < group < org < platform). The real product also has a "group"/team
// level, but that's an org admin delegating an org-capable key to a
// sub-team — not a distinct auth mode a connector exposes — so it isn't
// modeled here; oto-front has no org/team entities to back it honestly.
export type AccessLevel = "individual" | "org" | "platform";

export const accessLevelOrder: AccessLevel[] = ["individual", "org", "platform"];

export const accessLevelLabels: Record<AccessLevel, string> = {
  individual: "Individual (private)",
  org: "Org (shared)",
  platform: "Oto platform key",
};

export const accessLevelHints: Record<AccessLevel, string> = {
  individual: "Just one person",
  org: "Everyone in your workspace",
  platform: "Oto's built-in key — nothing to configure",
};

export function availableAccessLevels(connector: Connector): AccessLevel[] {
  const levels: AccessLevel[] = [];
  if (connector.authModes.includes("byo_user")) levels.push("individual");
  if (connector.authModes.includes("byo_org")) levels.push("org");
  if (connector.authModes.includes("platform")) levels.push("platform");
  return levels;
}
