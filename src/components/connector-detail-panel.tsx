"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectorAccessPicker } from "@/components/connector-access-picker";
import { ConnectorCredentialModal } from "@/components/connector-credential-modal";
import { ConnectorFederatedAccess } from "@/components/connector-federated-access";
import { ConnectorLogo } from "@/components/connector-logo";
import { ConnectorSessionConnect } from "@/components/connector-session-connect";
import { ChevronRightIcon, XIcon } from "@/components/icons";
import { Toggle } from "@/components/toggle";
import { cn, focusRing } from "@/lib/cn";
import { connKind } from "@/lib/connector-kind";
import {
  statusDotClassName,
  statusLabels,
  type ConnectorStatusKey,
} from "@/lib/connector-status";
import {
  deleteConnectorCredential,
  pauseConnector,
  selectConnector,
  setConnectorCredential,
  setGroupSecret,
  setOrgSecret,
  unselectConnector,
  type MeInfo,
} from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";
import { isScopeConfigured, type Scope } from "@/lib/scope";
import { disableTool, enableTool, namespaceOfTool, type Tool } from "@/lib/tools-api";

type Tab = "tools" | "team";
const tabOrder: Tab[] = ["tools", "team"];
const tabLabels: Record<Tab, string> = {
  tools: "Tools",
  team: "Team Access",
};

// What clicking the status pill offers, given the current status.
function statusActions(
  status: ConnectorStatusKey,
): { label: string; next: ConnectorStatusKey }[] {
  if (status === "active") {
    return [
      { label: "Pause", next: "paused" },
      { label: "Uninstall", next: "not_selected" },
    ];
  }
  if (status === "paused") {
    return [
      { label: "Activate", next: "active" },
      { label: "Uninstall", next: "not_selected" },
    ];
  }
  return [{ label: "Activate", next: "active" }];
}

export function ConnectorDetailPanel({
  connector,
  onClose,
  onUpdateConnector,
  tools,
  onUpdateTool,
  meInfo,
  onRefetch,
}: {
  connector: Connector | null;
  onClose: () => void;
  onUpdateConnector: (id: string, patch: Partial<Connector>) => void;
  tools: Tool[];
  onUpdateTool: (name: string, patch: Partial<Tool>) => void;
  meInfo: MeInfo;
  onRefetch: () => void;
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

  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [credentialModal, setCredentialModal] = useState<{ scope: Scope } | null>(null);
  const [sessionConnect, setSessionConnect] = useState<{ scope: Scope } | null>(null);
  const [removingScope, setRemovingScope] = useState<Scope | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [toolPending, setToolPending] = useState<Record<string, boolean>>({});
  const [toolError, setToolError] = useState<Record<string, string>>({});

  // One clear path for every scope, both connector mechanisms — the
  // generic vault clear (DELETE /api/settings/api-keys/{name}?scope=…)
  // works for keyed AND session/cookie connectors alike (confirmed:
  // api_key_clear doesn't gate on secret_kind). Always refetch after: which
  // rung now wins (providerStatus.mode) can shift in ways not worth
  // re-deriving client-side.
  async function removeAccess(scope: Scope) {
    if (!connector) return;
    setRemovingScope(scope);
    setRemoveError(null);
    try {
      await deleteConnectorCredential(connector.id, scope);
      onRefetch();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setRemovingScope(null);
    }
  }

  async function toggleTool(tool: Tool) {
    if (toolPending[tool.name]) return;
    setToolPending((prev) => ({ ...prev, [tool.name]: true }));
    setToolError((prev) => ({ ...prev, [tool.name]: "" }));
    try {
      if (tool.enabled) await disableTool(tool.name);
      else await enableTool(tool.name);
      onUpdateTool(tool.name, { enabled: !tool.enabled });
    } catch (err) {
      setToolError((prev) => ({
        ...prev,
        [tool.name]: err instanceof Error ? err.message : "Failed to update tool.",
      }));
    } finally {
      setToolPending((prev) => ({ ...prev, [tool.name]: false }));
    }
  }

  async function applyStatus(next: ConnectorStatusKey) {
    if (!connector) return;
    setStatusPending(true);
    setStatusError(null);
    try {
      if (next === "active") await selectConnector(connector.id);
      else if (next === "paused") await pauseConnector(connector.id);
      else await unselectConnector(connector.id);
      onUpdateConnector(connector.id, { status: next });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusPending(false);
    }
  }

  if (!connector) return null;
  const status = connector.status;
  const showPublisher =
    connector.publisher && connector.publisher.toLowerCase() !== connector.name.toLowerCase();
  const kind = connKind(connector);
  const connectorTools = tools.filter((t) => connector.namespaces.includes(namespaceOfTool(t.name)));

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-30 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={connector.name}
        className="fixed inset-y-2 right-2 z-40 flex w-96 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-high"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <ConnectorLogo connector={connector} />
            <div className="min-w-0">
              <p className="truncate text-title text-gray-12">{connector.name}</p>
              {showPublisher && (
                <p className="truncate text-caption text-muted">{connector.publisher}</p>
              )}
            </div>
          </div>
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
          <div className="flex flex-col rounded-lg bg-gray-2 p-3">
            <div className="relative flex items-center justify-between">
              <span className="text-body text-gray-12">Status</span>
              <button
                type="button"
                onClick={() => setStatusMenuOpen((o) => !o)}
                disabled={statusPending}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-button text-gray-12 hover:bg-gray-3 disabled:opacity-60",
                  focusRing,
                )}
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", statusDotClassName[status])} />
                {statusPending ? "Updating…" : statusLabels[status]}
                <ChevronRightIcon className="rotate-90 text-icon" />
              </button>
              {statusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-background py-1 shadow-dropdown"
                  >
                    {statusActions(status).map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setStatusMenuOpen(false);
                          void applyStatus(a.next);
                        }}
                        className={cn(
                          "block w-full px-3 py-1.5 text-left text-body text-gray-12 hover:bg-gray-2",
                          focusRing,
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {statusError && <p className="mt-1 text-caption text-red-11">{statusError}</p>}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-body text-gray-12">Access</span>
              {kind === "none" ? (
                <span className="text-caption text-muted">No access needed</span>
              ) : kind === "federated" ? (
                <ConnectorFederatedAccess connector={connector} />
              ) : kind === "google" || kind === "unipile" ? (
                <span className="text-caption text-muted">Not supported in oto-front yet</span>
              ) : (
                <ConnectorAccessPicker
                  connector={connector}
                  meInfo={meInfo}
                  removingScope={removingScope}
                  removeError={removeError}
                  onConfigure={(scope) =>
                    kind === "session" ? setSessionConnect({ scope }) : setCredentialModal({ scope })
                  }
                  onRemove={(scope) => void removeAccess(scope)}
                />
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 border-b border-border">
            {tabOrder.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-selected={tab === t}
                role="tab"
                className={cn(
                  "h-8 border-b-2 px-1 text-button",
                  tab === t
                    ? "border-gray-12 text-gray-12"
                    : "border-transparent text-muted hover:text-gray-12",
                  focusRing,
                )}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>

          {tab === "tools" &&
            (connectorTools.length > 0 ? (
              <ul className="mt-4 flex flex-col">
                {connectorTools.map((tool) => (
                  <li
                    key={tool.name}
                    className="flex flex-col gap-1 border-t border-border py-2 first:border-t-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <code className="text-body text-gray-12">{tool.name}</code>
                        {tool.description && (
                          <p className="mt-0.5 text-caption text-muted">{tool.description}</p>
                        )}
                      </div>
                      {tool.protected ? (
                        <span className="shrink-0 text-caption text-muted">Always on</span>
                      ) : (
                        <Toggle
                          checked={tool.enabled}
                          onChange={() => void toggleTool(tool)}
                          label={`Toggle ${tool.name}`}
                        />
                      )}
                    </div>
                    {toolError[tool.name] && (
                      <p className="text-caption text-red-11">{toolError[tool.name]}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-caption text-muted">No tools resolved for this connector.</p>
            ))}

          {tab === "team" && (
            <p className="mt-4 text-caption text-muted">Team-scoped access is coming soon.</p>
          )}
        </div>
      </div>

      <ConnectorCredentialModal
        connector={connector}
        open={credentialModal != null}
        scope={credentialModal?.scope ?? "member"}
        hasCredential={
          credentialModal ? isScopeConfigured(connector.providerStatus, credentialModal.scope) : false
        }
        onClose={() => setCredentialModal(null)}
        onSave={async (fields, scope: Scope) => {
          if (["api_key", "basic_auth", "fields"].includes(connector.secretKind) && fields) {
            const fieldCount = connector.credentialFields?.length ?? 1;
            if (scope === "member") {
              await setConnectorCredential(connector.id, fields);
            } else if (scope === "org" && meInfo.activeOrgId != null) {
              await setOrgSecret(meInfo.activeOrgId, connector.id, fieldCount, fields);
            } else if (scope === "group" && meInfo.activeGroupId != null) {
              await setGroupSecret(meInfo.activeGroupId, connector.id, fieldCount, fields);
            }
          }
          // Which rung now wins can shift regardless of scope — refetch for
          // truthful providerStatus rather than hand-rolling the cascade.
          onRefetch();
          setCredentialModal(null);
        }}
      />

      {sessionConnect && (
        <ConnectorSessionConnect
          connector={connector}
          scope={sessionConnect.scope}
          onClose={() => setSessionConnect(null)}
          onConnected={() => {
            onRefetch();
            setSessionConnect(null);
          }}
        />
      )}
    </>
  );
}
