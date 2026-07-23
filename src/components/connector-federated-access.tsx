"use client";

import { useEffect, useState } from "react";
import { cn, focusRing } from "@/lib/cn";
import {
  disconnectFederated,
  getFederatedStatus,
  startFederatedOauth,
} from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";

const linkClassName =
  "text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12";

// Generic federated-MCP OAuth (memento and similar single-account oauth
// connectors) — a full-page redirect to the provider, then back. No popup,
// no polling: the component just refetches status on mount, same as
// oto-dashboard's ConnectorFederatedWidget.vue relies on remount-after-
// navigation-back rather than an in-page callback.
export function ConnectorFederatedAccess({ connector }: { connector: Connector }) {
  const [status, setStatus] = useState<"loading" | "error" | { connected: boolean }>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFederatedStatus(connector.id)
      .then((res) => {
        if (!cancelled) setStatus({ connected: res.connected });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [connector.id]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { auth_url } = await startFederatedOauth(connector.id);
      window.location.href = auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start connection.");
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnectFederated(connector.id);
      setStatus({ connected: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <span className="text-caption text-muted">Checking…</span>;
  }
  if (status === "error") {
    return <span className="text-caption text-red-11">Couldn&apos;t load status</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        {status.connected && (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className={cn("text-caption disabled:opacity-60", linkClassName, focusRing)}
          >
            Disconnect
          </button>
        )}
        <button
          type="button"
          onClick={connect}
          disabled={busy || status.connected}
          className={cn(
            "h-7 rounded-full px-3 text-button disabled:opacity-60",
            status.connected
              ? "border border-border text-gray-12"
              : "bg-gray-12 text-background hover:opacity-90",
            focusRing,
          )}
        >
          {status.connected ? "Connected" : busy ? "Connecting…" : "Connect"}
        </button>
      </div>
      {error && <p className="text-caption text-red-11">{error}</p>}
    </div>
  );
}
