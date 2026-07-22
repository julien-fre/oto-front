import { keyScopeLabel } from "@/lib/connector-key-scope";
import type { Connector } from "@/lib/mock-data";

const secretKindNouns: Record<string, string> = {
  api_key: "an API key",
  oauth: "OAuth",
  basic_auth: "a username and password",
  cookie: "a signed-in browser session",
  fields: "credentials",
  none: "no credential",
};

// One sentence on how the agent actually authenticates for this connector —
// derived from the real secretKind/personalSession/authModes, not invented.
// Tone borrows from the real console's own connect explainer, rewritten
// fresh in English for this tab.
export function authExplain(connector: Connector): string {
  const cred = secretKindNouns[connector.secretKind] ?? connector.secretKind;
  if (connector.secretKind === "none") {
    return "The agent reads open data here — no credential is required.";
  }
  if (connector.personalSession) {
    return `The agent connects with ${cred}, using your own personal session — never shared with your org.`;
  }
  const scope = keyScopeLabel(connector);
  if (scope === "Shared") {
    return `The agent connects with ${cred} shared across your org.`;
  }
  if (scope === "Private") {
    return `The agent connects with ${cred} that belongs to you personally.`;
  }
  return `The agent connects with ${cred}.`;
}
