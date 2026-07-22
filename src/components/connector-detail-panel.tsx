"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ConnectorLogo } from "@/components/connector-logo";
import { Toggle } from "@/components/toggle";
import { XIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import { authExplain } from "@/lib/connector-ai-access";
import { connectorStatusKey, statusLabels, statusPillClassName } from "@/lib/connector-status";
import { connectorUsage, team, teams, type Connector } from "@/lib/mock-data";

const secretKindLabels: Record<string, string> = {
  api_key: "API key",
  oauth: "OAuth",
  basic_auth: "Basic auth",
  cookie: "Session cookie",
  fields: "Custom fields",
  none: "None (open data)",
};

const linkClassName =
  "text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12";

type Tab = "team" | "tools" | "access";
const tabOrder: Tab[] = ["team", "tools", "access"];
const tabLabels: Record<Tab, string> = {
  team: "Team Access",
  tools: "Tools",
  access: "AI Access",
};

type Sharing = "private" | "shared";

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

  // Local, visual-only state — no backend to persist to. Resets per
  // connector for free since the panel remounts via key={connector.id} in
  // connectors-browser.tsx.
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

  if (!connector) return null;
  const statusKey = connectorStatusKey(connector);
  const usage = connectorUsage(connector.id);

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-30 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={connector.name}
        className="fixed inset-y-0 right-0 z-40 flex w-96 flex-col border-l border-border bg-background shadow-high"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <ConnectorLogo connector={connector} />
            <div className="min-w-0">
              <p className="truncate text-title text-gray-12">{connector.name}</p>
              {connector.publisher && (
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
            <span className="text-body text-gray-12">Access</span>
            <span className="rounded-full bg-gray-4 px-2 py-0.5 text-caption capitalize text-gray-11">
              {connector.secretKind === "none" ? "Open data" : sharing}
            </span>
          </div>

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

          {tab === "access" && (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-body text-gray-11">{authExplain(connector, sharing)}</p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-body text-gray-12">Credential type</span>
                <span className="text-body text-gray-11">
                  {secretKindLabels[connector.secretKind] ?? connector.secretKind}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
