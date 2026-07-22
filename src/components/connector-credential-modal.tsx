"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import type { Connector } from "@/lib/mock-data";

// What kind of field(s) this connector's credential needs — derived from the
// real secretKind, not invented. oauth has no fields at all (a connect
// button instead); "fields" covers connectors whose exact field schema
// oto-front doesn't model, so it gets one neutral field rather than
// fabricated field names.
function credentialFieldsFor(secretKind: string): { label: string; type: string }[] {
  switch (secretKind) {
    case "api_key":
      return [{ label: "API key", type: "password" }];
    case "basic_auth":
      return [
        { label: "Username", type: "text" },
        { label: "Password", type: "password" },
      ];
    case "cookie":
      return [{ label: "Session cookie", type: "password" }];
    case "fields":
      return [{ label: "Credentials", type: "password" }];
    default:
      return [];
  }
}

export function ConnectorCredentialModal({
  connector,
  open,
  hasCredential,
  onClose,
  onSave,
}: {
  connector: Connector;
  open: boolean;
  hasCredential: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    (firstFieldRef.current ?? closeButtonRef.current)?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  if (!open) return null;
  const fields = credentialFieldsFor(connector.secretKind);
  const title = hasCredential ? `Update ${connector.name}` : `Connect ${connector.name}`;

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-4 shadow-high"
      >
        <div className="flex items-center justify-between">
          <p className="text-body-medium text-gray-12">{title}</p>
          <button
            ref={closeButtonRef}
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

        <div className="mt-4 flex flex-col gap-3">
          {connector.secretKind === "oauth" ? (
            <button
              type="button"
              onClick={onSave}
              className={cn(
                "h-8 rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90",
                focusRing,
              )}
            >
              Connect with OAuth
            </button>
          ) : (
            <>
              {fields.map((field, i) => (
                <div key={field.label}>
                  <label className="text-caption text-gray-12">{field.label}</label>
                  <input
                    ref={i === 0 ? firstFieldRef : undefined}
                    type={field.type}
                    className={cn(
                      "mt-1 h-8 w-full border border-border bg-background px-2 text-body text-gray-12 placeholder:text-placeholder focus:outline-none",
                      focusRing,
                    )}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={onSave}
                className={cn(
                  "h-8 self-start rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90",
                  focusRing,
                )}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
