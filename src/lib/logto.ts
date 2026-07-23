import LogtoClient, { UserScope } from "@logto/browser";

// Auth against the self-hosted Logto tenant (auth.oto.ninja) — PKCE, audience
// = the oto-mcp API resource. Mirrors oto-dashboard's src/composables/useAuth.ts.
const endpoint = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!;
const appId = process.env.NEXT_PUBLIC_LOGTO_APP_ID!;
const resource = process.env.NEXT_PUBLIC_LOGTO_AUDIENCE!;

export const OTO_MCP_RESOURCE = resource;

export const logto = new LogtoClient({
  endpoint,
  appId,
  resources: [resource],
  scopes: [UserScope.Identities],
});

// Purges the SDK's persisted PKCE state (`logto:*` keys in local/session
// storage). Needed to recover from a stale state left by a previous
// tenant/appId or a doubled sign-in attempt, which otherwise fails
// handleSignInCallback with "State mismatched". Our own keys are unprefixed
// and survive.
export function purgeLogtoStorage(): void {
  for (const store of [window.localStorage, window.sessionStorage]) {
    Object.keys(store)
      .filter((k) => k.startsWith("logto"))
      .forEach((k) => store.removeItem(k));
  }
}

// Plain function (not a hook) so the fetch wrapper in lib/api.ts can call it
// outside of component render — only isAuthenticated/userSub need React state.
export async function getAccessToken(): Promise<string> {
  const token = await logto.getAccessToken(OTO_MCP_RESOURCE);
  // @logto/browser can return undefined on a dead session instead of
  // throwing — fail loudly rather than send "Bearer undefined".
  if (!token) throw new Error("stale_session");
  return token;
}
