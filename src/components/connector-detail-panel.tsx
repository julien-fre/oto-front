"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { keyScopeLabel } from "@/lib/connector-key-scope";
import { connectorStatusKey, statusLabels, statusPillClassName } from "@/lib/connector-status";
import type { Connector } from "@/lib/mock-data";

const secretKindLabels: Record<string, string> = {
  api_key: "API key",
  oauth: "OAuth",
  basic_auth: "Basic auth",
  cookie: "Session cookie",
  fields: "Custom fields",
  none: "None (open data)",
};

type Tab = "tools" | "privacy";

export function ConnectorDetailPanel({
  connector,
  onClose,
}: {
  connector: Connector | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("tools");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const open = connector != null;

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  if (!connector) return null;
  const statusKey = connectorStatusKey(connector);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/20"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={connector.name}
        className="fixed inset-y-0 right-0 z-40 flex w-96 flex-col border-l border-border bg-background shadow-high"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <p className="text-title text-gray-12">{connector.name}</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-icon hover:bg-interactive-hovered",
              focusRing,
            )}
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-body text-gray-11">{connector.description}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-body text-gray-12">Status</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-caption",
                statusPillClassName[statusKey],
              )}
            >
              {statusLabels[statusKey]}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-body text-gray-12">API key</span>
            <span className="rounded-full bg-gray-4 px-2 py-0.5 text-caption text-gray-11">
              {keyScopeLabel(connector)}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-1 border-b border-border">
            {(["tools", "privacy"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-selected={tab === t}
                role="tab"
                className={cn(
                  "h-8 border-b-2 px-1 text-button capitalize",
                  tab === t
                    ? "border-gray-12 text-gray-12"
                    : "border-transparent text-muted hover:text-gray-12",
                  focusRing,
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "tools" ? (
            connector.namespaces.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {connector.namespaces.map((ns) => (
                  <li
                    key={ns}
                    className="rounded-full bg-gray-3 px-3 py-1 text-caption text-gray-11"
                  >
                    {ns}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-caption text-muted">No tools resolved for this connector.</p>
            )
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body text-gray-11">Credential type</span>
                <span className="text-body text-gray-12">
                  {secretKindLabels[connector.secretKind] ?? connector.secretKind}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-gray-11">Session</span>
                <span className="text-body text-gray-12">
                  {connector.personalSession ? "Personal — your own login" : "Not personal"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
