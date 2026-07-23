"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";
import { fetchKnowledgeBase, type KnowledgeBase } from "@/lib/knowledge-api";

// One fetch, shared. The connectors section fetches at page level (the
// established pattern), but knowledge data is also consumed by the SHELL —
// the sidebar lists the doc tree and the top bar builds breadcrumbs from
// ancestors — so page-level fetching would mean three copies of the same
// request racing each other. A context keeps the single-fetch property while
// staying inside ADR 0004 (client-only, no BFF).

export type KnowledgeState =
  | { kind: "idle" } // signed out (or auth still resolving) — nothing to show
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; kb: KnowledgeBase };

type KnowledgeContextValue = {
  state: KnowledgeState;
  /** Re-fetch after a mutation or a failure. */
  refresh: () => void;
};

// Until the deployed backend passes AuthzDenied messages through as `detail`
// (fixed in oto-backend but pending deploy), the REST adapter returns bare
// machine slugs. Translate the ones a user can actually hit; once the deploy
// lands, api.ts prefers the server's own sentence and this map only catches
// stragglers.
function humanMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.message) {
      case "no_active_org":
        return "your account has no active organisation yet. Open manage.oto.cx once to join or create one, then try again.";
      case "kb_unavailable":
        return "the knowledge base is being set up — try again in a moment.";
      case "forbidden":
        return "you don't have access to this org's knowledge base.";
      case "stale_session":
        return "your session expired. Sign out and back in.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "something went wrong.";
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

export function useKnowledge() {
  const context = useContext(KnowledgeContext);
  if (!context) throw new Error("useKnowledge must be used within KnowledgeProvider");
  return context;
}

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<KnowledgeState>({ kind: "idle" });
  // Bumping this is the whole refresh mechanism — the effect depends on it.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets to idle on sign-out, not every render; guarded by isAuthenticated
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    fetchKnowledgeBase()
      .then((kb) => {
        if (!cancelled) setState({ kind: "ready", kb });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ kind: "error", message: humanMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, generation]);

  const refresh = useCallback(() => setGeneration((n) => n + 1), []);

  const value = useMemo(() => ({ state, refresh }), [state, refresh]);

  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>;
}
