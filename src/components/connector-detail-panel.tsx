"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ConnectorCredentialModal } from "@/components/connector-credential-modal";
import { ConnectorFederatedAccess } from "@/components/connector-federated-access";
import { ConnectorLogo } from "@/components/connector-logo";
import { ConnectorSessionConnect } from "@/components/connector-session-connect";
import { Toggle } from "@/components/toggle";
import { ChevronRightIcon, XIcon } from "@/components/icons";
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
  unselectConnector,
} from "@/lib/connectors-api";
import { connectorUsage, team, teams, type Connector } from "@/lib/mock-data";

const linkClassName =
  "text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12";

type Tab = "team" | "tools";
const tabOrder: Tab[] = ["team", "tools"];
const tabLabels: Record<Tab, string> = {
  team: "Team Access",
  tools: "Tools",
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

type Sharing = "private" | "shared";

export function ConnectorDetailPanel({
  connector,
  onClose,
}: {
  connector: Connector | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("team");
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

  // Local, visual-only state — no backend to persist to. Resets per
  // connector for free since the panel remounts via key={connector.id} in
  // connectors-browser.tsx.
  const [status, setStatus] = useState<ConnectorStatusKey>(
    () => connector?.status ?? "not_selected",
  );
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [hasCredential, setHasCredential] = useState(
    () => (connector?.status ?? "not_selected") !== "not_selected",
  );
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [sessionConnectOpen, setSessionConnectOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [enabledNamespaces, setEnabledNamespaces] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((connector?.namespaces ?? []).map((ns) => [ns, true])),
  );
  const [sharing, setSharing] = useState<Sharing>(() =>
    (connector?.authModes ?? []).includes("byo_org") ? "shared" : "private",
  );
  const [enabledTeams, setEnabledTeams] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(teams.map((t) => [t.name, t.members.includes(connector?.owner ?? "")])),
  );
  const [enabledIndividuals, setEnabledIndividuals] = useState<Record<string, boolean>>(() => ({
    [connector?.owner ?? ""]: true,
  }));

  async function applyStatus(next: ConnectorStatusKey) {
    if (!connector) return;
    setStatusPending(true);
    setStatusError(null);
    try {
      if (next === "active") await selectConnector(connector.id);
      else if (next === "paused") await pauseConnector(connector.id);
      else await unselectConnector(connector.id);
      setStatus(next);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusPending(false);
    }
  }

  if (!connector) return null;
  const usage = connectorUsage(connector.id);
  const showPublisher =
    connector.publisher && connector.publisher.toLowerCase() !== connector.name.toLowerCase();
  const kind = connKind(connector);

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
                <div className="flex items-center gap-3">
                  {kind === "session" && hasCredential && (
                    <button
                      type="button"
                      onClick={async () => {
                        setDisconnectError(null);
                        try {
                          await deleteConnectorCredential(connector.id);
                          setHasCredential(false);
                        } catch (err) {
                          setDisconnectError(
                            err instanceof Error ? err.message : "Failed to disconnect.",
                          );
                        }
                      }}
                      className={cn("text-caption", linkClassName, focusRing)}
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      kind === "session" ? setSessionConnectOpen(true) : setCredentialModalOpen(true)
                    }
                    className={cn(
                      "h-7 rounded-full px-3 text-button",
                      hasCredential
                        ? "border border-border text-gray-12 hover:bg-gray-3"
                        : "bg-gray-12 text-background hover:opacity-90",
                      focusRing,
                    )}
                  >
                    {hasCredential ? "Update" : "Connect"}
                  </button>
                </div>
              )}
            </div>
            {disconnectError && <p className="mt-1 text-caption text-red-11">{disconnectError}</p>}

            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-body text-gray-12">Used by</span>
                <span className="text-body text-gray-12">
                  {usage.length === 0
                    ? "No processes"
                    : `${usage.length} process${usage.length === 1 ? "" : "es"}`}
                </span>
              </div>
              {usage.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {usage.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/processes/${p.slug}`}
                        className={cn("text-body", linkClassName, focusRing)}
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
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

          {tab === "team" &&
            (connector.secretKind !== "none" ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(["private", "shared"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSharing(mode)}
                        aria-pressed={sharing === mode}
                        className={cn(
                          "h-7 rounded-full px-3 text-button capitalize",
                          sharing === mode
                            ? "bg-interactive-checked text-gray-12"
                            : "text-muted hover:bg-interactive-hovered",
                          focusRing,
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {sharing === "shared" && (
                    <div className="flex items-center gap-3 text-caption">
                      <button
                        type="button"
                        onClick={() => {
                          setEnabledTeams(Object.fromEntries(teams.map((t) => [t.name, true])));
                          setEnabledIndividuals(Object.fromEntries(team.map((p) => [p, true])));
                        }}
                        className={cn(linkClassName, focusRing)}
                      >
                        Enable all
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEnabledTeams(Object.fromEntries(teams.map((t) => [t.name, false])));
                          setEnabledIndividuals(Object.fromEntries(team.map((p) => [p, false])));
                        }}
                        className={cn(linkClassName, focusRing)}
                      >
                        Disable all
                      </button>
                    </div>
                  )}
                </div>

                {sharing === "private" ? (
                  <p className="text-caption text-muted">Only you can use this key.</p>
                ) : (
                  <>
                    <div>
                      <span className="text-body-medium text-gray-12">Teams</span>
                      <ul className="mt-1 flex flex-col">
                        {teams.map((t) => (
                          <li
                            key={t.name}
                            className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
                          >
                            <span className="text-body text-gray-12">{t.name}</span>
                            <Toggle
                              checked={enabledTeams[t.name] ?? false}
                              onChange={() =>
                                setEnabledTeams((prev) => ({ ...prev, [t.name]: !prev[t.name] }))
                              }
                              label={`Toggle team ${t.name}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-body-medium text-gray-12">Individuals</span>
                      <ul className="mt-1 flex flex-col">
                        {team.map((person) => (
                          <li
                            key={person}
                            className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
                          >
                            <span className="text-body text-gray-12">{person}</span>
                            <Toggle
                              checked={enabledIndividuals[person] ?? false}
                              onChange={() =>
                                setEnabledIndividuals((prev) => ({
                                  ...prev,
                                  [person]: !prev[person],
                                }))
                              }
                              label={`Toggle access for ${person}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-4 text-caption text-muted">
                No credential — nothing to scope access to.
              </p>
            ))}

          {tab === "tools" &&
            (connector.namespaces.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-caption">
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledNamespaces(
                        Object.fromEntries(connector.namespaces.map((ns) => [ns, true])),
                      )
                    }
                    className={cn(linkClassName, focusRing)}
                  >
                    Enable all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledNamespaces(
                        Object.fromEntries(connector.namespaces.map((ns) => [ns, false])),
                      )
                    }
                    className={cn(linkClassName, focusRing)}
                  >
                    Disable all
                  </button>
                </div>
                <ul className="flex flex-col">
                  {connector.namespaces.map((ns) => (
                    <li
                      key={ns}
                      className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
                    >
                      <span className="text-body text-gray-12">{ns}</span>
                      <Toggle
                        checked={enabledNamespaces[ns]}
                        onChange={() =>
                          setEnabledNamespaces((prev) => ({ ...prev, [ns]: !prev[ns] }))
                        }
                        label={`Toggle ${ns}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-caption text-muted">No tools resolved for this connector.</p>
            ))}
        </div>
      </div>

      <ConnectorCredentialModal
        connector={connector}
        open={credentialModalOpen}
        hasCredential={hasCredential}
        onClose={() => setCredentialModalOpen(false)}
        onSave={async (fields) => {
          if (["api_key", "basic_auth", "fields"].includes(connector.secretKind) && fields) {
            await setConnectorCredential(connector.id, fields);
          }
          setHasCredential(true);
          setCredentialModalOpen(false);
        }}
      />

      {sessionConnectOpen && (
        <ConnectorSessionConnect
          connector={connector}
          onClose={() => setSessionConnectOpen(false)}
          onConnected={() => {
            setHasCredential(true);
            setSessionConnectOpen(false);
          }}
        />
      )}
    </>
  );
}
