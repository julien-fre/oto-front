"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConnectorsBrowser } from "@/components/connectors-browser";
import { fetchConnectors, type MeInfo } from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";
import { fetchTools, type Tool } from "@/lib/tools-api";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; connectors: Connector[]; tools: Tool[]; meInfo: MeInfo };

export default function ConnectorsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(() => {
    return Promise.all([fetchConnectors(), fetchTools()]).then(
      ([{ connectors, meInfo }, tools]) => {
        setState({ kind: "ready", connectors, tools, meInfo });
      },
    );
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    load().catch((err: unknown) => {
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
  }, [authLoading, isAuthenticated, load]);

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

  function updateConnector(id: string, patch: Partial<Connector>) {
    setState((prev) =>
      prev.kind === "ready"
        ? { ...prev, connectors: prev.connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
        : prev,
    );
  }

  function updateTool(name: string, patch: Partial<Tool>) {
    setState((prev) =>
      prev.kind === "ready"
        ? { ...prev, tools: prev.tools.map((t) => (t.name === name ? { ...t, ...patch } : t)) }
        : prev,
    );
  }

  // Best-effort background refresh (e.g. after an org/group-scope credential
  // change) — a failure here shouldn't blow away an already-loaded page.
  function refetch() {
    void load().catch(() => {});
  }

  return (
    <div className="flex h-full flex-col px-12 py-6">
      <ConnectorsBrowser
        connectors={state.connectors}
        onUpdateConnector={updateConnector}
        tools={state.tools}
        onUpdateTool={updateTool}
        meInfo={state.meInfo}
        onRefetch={refetch}
      />
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
