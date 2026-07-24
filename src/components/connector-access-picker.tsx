"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import type { MeInfo } from "@/lib/connectors-api";
import type { Connector } from "@/lib/mock-data";
import { availableScopesFor, isScopeConfigured, scopeLabels, type Scope } from "@/lib/scope";

// Short label for the collapsed button face — the fuller "Resolved via…"
// phrasing lives in the menu instead, where there's room for it.
function faceLabel(connector: Connector, meInfo: MeInfo): string {
  const status = connector.providerStatus;
  switch (status?.mode) {
    case "user":
      return "Update";
    case "group":
      return `${meInfo.activeGroupName ?? "Team"} key`;
    case "org":
      return `${meInfo.activeOrgName ?? "Org"} key`;
    case "platform":
      return "oto's key";
    default:
      return "Connect";
  }
}

export function ConnectorAccessPicker({
  connector,
  meInfo,
  removingScope,
  removeError,
  onConfigure,
  onRemove,
}: {
  connector: Connector;
  meInfo: MeInfo;
  removingScope: Scope | null;
  removeError: string | null;
  onConfigure: (scope: Scope) => void;
  onRemove: (scope: Scope) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scopes = availableScopesFor(connector, meInfo);
  const status = connector.providerStatus;

  return (
    <div className="relative flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full px-3 text-button",
          status?.mode && status.mode !== "forbidden" && status.mode !== "over_quota"
            ? "border border-border text-gray-12 hover:bg-gray-3"
            : "bg-gray-12 text-background hover:opacity-90",
          focusRing,
        )}
      >
        {faceLabel(connector, meInfo)}
        <ChevronRightIcon className="rotate-90 text-icon" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-background py-1 shadow-dropdown"
          >
            {scopes.map((scope) => {
              const configured = isScopeConfigured(status, scope);
              const isWinner =
                status?.mode === (scope === "member" ? "user" : scope);
              return (
                <div
                  key={scope}
                  role="menuitem"
                  className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-gray-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onConfigure(scope);
                    }}
                    className={cn("flex flex-1 items-center gap-2 text-left text-body", focusRing)}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        isWinner ? "bg-green-9" : configured ? "bg-gray-9" : "bg-gray-5",
                      )}
                    />
                    <span className="text-gray-12">{scopeLabels[scope]}</span>
                    {!configured && <span className="text-caption text-muted">Not set</span>}
                  </button>
                  {configured && (
                    <button
                      type="button"
                      disabled={removingScope === scope}
                      onClick={() => {
                        setMenuOpen(false);
                        onRemove(scope);
                      }}
                      className={cn(
                        "shrink-0 text-caption text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12 disabled:opacity-60",
                        focusRing,
                      )}
                    >
                      {removingScope === scope ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              );
            })}
            {status?.platform_key_label != null && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    status.mode === "platform" ? "bg-green-9" : "bg-gray-9",
                  )}
                />
                <span className="text-body text-muted">
                  oto&apos;s shared key ({status.platform_key_label})
                </span>
              </div>
            )}
          </div>
        </>
      )}
      {removeError && <p className="text-caption text-red-11">{removeError}</p>}
    </div>
  );
}
