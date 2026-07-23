"use client";

import { useRef, useState } from "react";
import { ConnectorLogo } from "@/components/connector-logo";
import { cn, focusRing } from "@/lib/cn";
import { connectorColor, getConnectorForTool } from "@/lib/mock-data";

const PREVIEW_DELAY = 300; // matches DocReference's hover-preview wait

/**
 * A tool identifier, inline in a procedure's steps or in the panel's tool
 * list. Styled exactly like a knowledge doc's inline reference — a dot in
 * the connector's identity color, then underlined text — so a raw name like
 * `mcp__folk-crm__create_person` reads as "belongs to Folk" at a glance, and
 * hovering (or focusing) it confirms with that connector's logo + name.
 */
export function ToolReference({ tool, dot = true }: { tool: string; dot?: boolean }) {
  const connector = getConnectorForTool(tool);
  const [preview, setPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreview(true), PREVIEW_DELAY);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreview(false);
  };

  // Not every `code` span is a tool call — some are literal values (a role,
  // an enum, a field name). Those keep the plain inline-code look; only a
  // span that resolves to a real connector gets the dot + underline treatment.
  if (!connector) {
    return (
      <code className="rounded-sm bg-gray-3 px-1 py-0.5 font-mono text-caption text-gray-12">
        {tool}
      </code>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={cn(
          "appearance-none rounded-sm border-0 bg-transparent p-0 text-left font-mono text-caption text-gray-11 underline decoration-gray-7 underline-offset-2 transition-colors duration-100 hover:text-gray-12 motion-reduce:transition-none",
          focusRing,
        )}
      >
        {dot && (
          <span
            className="mr-1 inline-block size-1.5 shrink-0 rounded-full align-baseline"
            style={{ backgroundColor: connectorColor(connector.id) }}
            aria-hidden="true"
          />
        )}
        {tool}
      </button>
      {preview && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 flex animate-fade-in items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-dropdown motion-reduce:animate-none"
        >
          <ConnectorLogo connector={connector} size="sm" />
          <span className="whitespace-nowrap text-caption text-gray-12">{connector.name}</span>
        </span>
      )}
    </span>
  );
}
