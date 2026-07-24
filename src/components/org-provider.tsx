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
import { useKnowledge } from "@/components/knowledge/knowledge-provider";
import { useProcesses } from "@/components/processes-provider";
import { ApiError } from "@/lib/api";
import { fetchOrgs, switchOrg, type OrgSummary } from "@/lib/orgs-api";

// Same shape and reasoning as ProcessesProvider/KnowledgeProvider: the
// sidebar's org button (every page) and the switcher menu both need this,
// one fetch shared instead of racing two.

export type OrgState =
  | { kind: "idle" } // signed out (or auth still resolving) — nothing to show
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; orgs: OrgSummary[] };

type OrgContextValue = {
  state: OrgState;
  /** Undefined until state is "ready" — the org currently marked `active`. */
  activeOrg: OrgSummary | undefined;
  refresh: () => void;
  /** Sets the persistent home org, then refetches this list plus every other
   *  org-scoped provider (processes, knowledge) so the rest of the app stops
   *  showing the previous org's data. Throws on failure — callers show it. */
  switchOrg: (orgId: number) => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
}

// Mounted INSIDE KnowledgeProvider/ProcessesProvider (not just alongside) —
// switching org needs to trigger their refresh, which means calling their
// hooks, which requires being their descendant.
export function OrgProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refresh: refreshProcesses } = useProcesses();
  const { refresh: refreshKnowledge } = useKnowledge();
  const [state, setState] = useState<OrgState>({ kind: "idle" });
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
    fetchOrgs()
      .then((orgs) => {
        if (!cancelled) setState({ kind: "ready", orgs });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "something went wrong.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, generation]);

  const refresh = useCallback(() => setGeneration((n) => n + 1), []);

  const switchOrgAction = useCallback(
    async (orgId: number) => {
      await switchOrg(orgId);
      refresh();
      refreshProcesses();
      refreshKnowledge();
    },
    [refresh, refreshProcesses, refreshKnowledge],
  );

  const activeOrg = state.kind === "ready" ? state.orgs.find((o) => o.active) : undefined;

  const value = useMemo(
    () => ({ state, activeOrg, refresh, switchOrg: switchOrgAction }),
    [state, activeOrg, refresh, switchOrgAction],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
