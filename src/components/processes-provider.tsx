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
import { fetchProcesses, type ProcessSummary } from "@/lib/processes-api";

// Same shape and reasoning as knowledge-provider.tsx: the /processes list
// page isn't the only consumer once the sidebar also lists real processes —
// a context keeps the single-fetch property instead of two copies of the
// same request racing each other.

export type ProcessesState =
  | { kind: "idle" } // signed out (or auth still resolving) — nothing to show
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; processes: ProcessSummary[] };

type ProcessesContextValue = {
  state: ProcessesState;
  refresh: () => void;
};

const ProcessesContext = createContext<ProcessesContextValue | null>(null);

export function useProcesses() {
  const context = useContext(ProcessesContext);
  if (!context) throw new Error("useProcesses must be used within ProcessesProvider");
  return context;
}

export function ProcessesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<ProcessesState>({ kind: "idle" });
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
    fetchProcesses()
      .then((processes) => {
        if (!cancelled) setState({ kind: "ready", processes });
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

  const value = useMemo(() => ({ state, refresh }), [state, refresh]);

  return <ProcessesContext.Provider value={value}>{children}</ProcessesContext.Provider>;
}
