"use client";

import { useEffect, useState } from "react";
import { ScopePicker } from "@/components/scope-picker";
import { XIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { finalizeConnectorSession, startConnectorSession, type MeInfo } from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";
import { availableScopesFor, type Scope } from "@/lib/scope";

// Cookie secretKind (brevo, crunchbase, pennylaneged) — a hosted Browserbase
// remote browser the user logs into via Live View, then a manual "Verify"
// click (no polling). Mirrors oto-dashboard's ConnectorSessionConnect.vue.
//
// Mounted only while open (parent renders it conditionally, not via an
// `open` prop toggle) — so every open is a genuinely fresh mount with clean
// initial state, no reset-in-effect needed, and a fresh Browserbase session
// starts on mount, matching the dashboard's "reopen = new session" behavior.
export function ConnectorSessionConnect({
  connector,
  meInfo,
  onClose,
  onConnected,
}: {
  connector: Connector;
  meInfo: MeInfo;
  onClose: () => void;
  onConnected: (scope: Scope) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ context_id: string; session_id: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [scope, setScope] = useState<Scope>("member");
  const availableScopes = availableScopesFor(connector, meInfo);

  useEffect(() => {
    let cancelled = false;
    startConnectorSession(connector.id)
      .then((res) => {
        if (cancelled) return;
        setLiveUrl(res.live_view_url);
        setCtx({ context_id: res.context_id, session_id: res.session_id });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to open a remote browser.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connector.id]);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onClose]);

  async function verify() {
    if (!ctx) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await finalizeConnectorSession(connector.id, { ...ctx, scope });
      if (res.connected) {
        onConnected(scope);
      } else {
        setError("Not connected yet — finish logging in, then try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Log in to ${connector.name}`}
        className="fixed left-1/2 top-1/2 z-50 flex h-[70vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-high"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <p className="text-body-medium text-gray-12">Log in to {connector.name}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-icon hover:bg-interactive-hovered",
              focusRing,
            )}
          >
            <XIcon />
          </button>
        </div>

        {availableScopes.length > 1 && (
          <div className="flex shrink-0 items-center border-b border-border px-4 py-2">
            <ScopePicker scopes={availableScopes} value={scope} onChange={setScope} />
          </div>
        )}

        <div className="relative flex-1 bg-gray-2">
          {loading && (
            <div className="flex h-full items-center justify-center text-body text-muted">
              Opening a remote browser…
            </div>
          )}
          {!loading && liveUrl && (
            <iframe
              src={liveUrl}
              title={`${connector.name} login`}
              className="size-full border-0"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3">
          {error && <p className="text-caption text-red-11">{error}</p>}
          <button
            type="button"
            onClick={verify}
            disabled={!ctx || verifying || loading}
            className={cn(
              "ml-auto h-8 shrink-0 rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90 disabled:opacity-60",
              focusRing,
            )}
          >
            {verifying ? "Verifying…" : "I've logged in — verify"}
          </button>
        </div>
      </div>
    </>
  );
}
