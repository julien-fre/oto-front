"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConnectorsBrowser } from "@/components/connectors-browser";
import { fetchConnectors } from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; connectors: Connector[] };

export default function ConnectorsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    fetchConnectors()
      .then((connectors) => {
        if (!cancelled) setState({ kind: "ready", connectors });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Failed to load connectors.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <button
          type="button"
          onClick={() => login("/connectors")}
          className="rounded-full bg-gray-12 px-4 py-2 text-button text-gray-1"
        >
          Sign in to see your connectors
        </button>
      </Centered>
    );
  }

  if (state.kind === "loading") {
    return <Centered>Loading connectors…</Centered>;
  }

  if (state.kind === "error") {
    return <Centered>Couldn&apos;t load connectors — {state.message}</Centered>;
  }

  return (
    <div className="flex h-full flex-col px-12 py-6">
      <ConnectorsBrowser connectors={state.connectors} />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-12 py-6 text-body text-muted">
      {children}
    </div>
  );
}
