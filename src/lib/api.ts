import { getAccessToken } from "@/lib/logto";

// The backend is oto-mcp (REST /api/*) — no server of our own here, same
// rule as oto-dashboard (ADR 0004: the front holds no secrets, the center is
// oto-mcp). Never add a BFF/proxy route without an explicit decision.
const base = (process.env.NEXT_PUBLIC_OTO_MCP_BASE ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Authenticated fetch. Throws on !ok and on a dead Logto session — no
// fallback, no swallowed error; callers render the failure explicitly.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new ApiError(401, "stale_session");
  }
  const resp = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new ApiError(resp.status, (body as { error?: string }).error ?? resp.statusText);
  }
  return resp.json() as Promise<T>;
}
