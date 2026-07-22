import type { Connector } from "@/lib/mock-data";

// Derived from the real auth_modes (byo_org/platform = one key for
// everyone = shared; byo_user-only = each person supplies their own =
// private), not a separate invented field. secretKind "none" means there's
// no credential at all (open data).
export function keyScopeLabel(connector: Connector): string {
  if (connector.secretKind === "none") return "No credential required";
  if (connector.authModes.includes("byo_org") || connector.authModes.includes("platform"))
    return "Shared";
  if (connector.authModes.includes("byo_user")) return "Private";
  return "—";
}
