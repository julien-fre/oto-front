"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import type { Connector, CredentialField } from "@/lib/mock-data";
import type { Scope } from "@/lib/scope";

// Mock-data fallback when a connector has no real credentialFields (only
// populated for connectors fetched from the backend) — a guess, not
// invented field names, so the form still renders something reasonable.
function guessFieldsFor(secretKind: string): CredentialField[] {
  switch (secretKind) {
    case "api_key":
      return [{ name: "key", label: "API key", secret: true, required: true, help: "" }];
    case "basic_auth":
      return [
        { name: "email", label: "Email", secret: false, required: true, help: "" },
        { name: "password", label: "Password", secret: true, required: true, help: "" },
      ];
    case "cookie":
      return [{ name: "cookie", label: "Session cookie", secret: true, required: true, help: "" }];
    case "fields":
      return [{ name: "value", label: "Credentials", secret: true, required: true, help: "" }];
    default:
      return [];
  }
}

export function ConnectorCredentialModal({
  connector,
  open,
  scope,
  hasCredential,
  onClose,
  onSave,
}: {
  connector: Connector;
  open: boolean;
  // Which level this modal instance targets — chosen by the caller (the
  // access dropdown row clicked), not picked inside the modal.
  scope: Scope;
  hasCredential: boolean;
  onClose: () => void;
  // Populated only for kinds oto-front actually persists (api_key,
  // basic_auth, fields) — keyed by each field's real `name`. cookie/oauth
  // call onSave() with nothing, since neither is a form post.
  onSave: (fields: Record<string, string> | undefined, scope: Scope) => void | Promise<void>;
}) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const fields = connector.credentialFields?.length
    ? connector.credentialFields
    : guessFieldsFor(connector.secretKind);
  // hasCredential reflects whichever scope this modal instance targets —
  // the caller (the access dropdown) already knows that per-scope state
  // from providerStatus, so the modal just renders it.
  const title = hasCredential ? `Update ${connector.name}` : `Connect ${connector.name}`;

  async function handleSave(values?: Record<string, string>) {
    setSaving(true);
    setError(null);
    try {
      await onSave(values, scope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-4 shadow-high"
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
              onClick={() => handleSave()}
              disabled={saving}
              className={cn(
                "h-8 rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90 disabled:opacity-60",
                focusRing,
              )}
            >
              {saving ? "Connecting…" : "Connect with OAuth"}
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                // api_key/basic_auth/fields are the only kinds oto-front
                // actually persists — cookie still just guesses a field for
                // display, nothing real to post it to yet.
                const values =
                  connector.secretKind !== "cookie"
                    ? Object.fromEntries(fields.map((f) => [f.name, (data.get(f.name) as string) ?? ""]))
                    : undefined;
                handleSave(values);
              }}
              className="flex flex-col gap-3"
            >
              {fields.map((field, i) => (
                <div key={field.name}>
                  <label className="text-caption text-gray-12">{field.label}</label>
                  <input
                    ref={i === 0 ? firstFieldRef : undefined}
                    name={field.name}
                    type={field.secret ? "password" : "text"}
                    required={field.required}
                    className={cn(
                      "mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-body text-gray-12 placeholder:text-placeholder focus:outline-none",
                      focusRing,
                    )}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "h-8 self-start rounded-full bg-gray-12 px-3 text-button text-background hover:opacity-90 disabled:opacity-60",
                  focusRing,
                )}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          )}
          {error && <p className="text-caption text-red-11">{error}</p>}
        </div>
      </div>
    </>
  );
}
