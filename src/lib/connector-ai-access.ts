import type { Connector } from "@/lib/mock-data";

const secretKindNouns: Record<string, string> = {
  api_key: "an API key",
  oauth: "OAuth",
  basic_auth: "a username and password",
  cookie: "a signed-in browser session",
  fields: "credentials",
  none: "no credential",
};

// One sentence on how the agent authenticates for this connector, given the
// real secretKind/personalSession plus whichever sharing mode is currently
// selected in the Team Access tab (single source of truth — this doesn't
// re-derive its own notion of shared/private).
export function authExplain(connector: Connector, sharing: "private" | "shared"): string {
  const cred = secretKindNouns[connector.secretKind] ?? connector.secretKind;
  if (connector.secretKind === "none") {
    return "The agent reads open data here — no credential is required.";
  }
  if (connector.personalSession) {
    return `The agent connects with ${cred}, using your own personal session — never shared with your org.`;
  }
  return sharing === "shared"
    ? `The agent connects with ${cred} shared across your workspace.`
    : `The agent connects with ${cred} that belongs to you personally.`;
}
