"use client";

import { useRef, useState } from "react";
import { ConnectorLogo } from "@/components/connector-logo";
import { getConnectorForTool } from "@/lib/mock-data";

const PREVIEW_DELAY = 300; // matches DocReference's hover-preview wait

/**
 * A tool identifier, inline in a procedure's steps or in the panel's tool
 * list. When the tool resolves to a real connector, hovering (or focusing)
 * it shows that connector's logo + name — so a raw name like
 * `mcp__folk-crm__create_person` reads as "Folk" without losing the exact
 * call the procedure makes.
 */
export function ToolReference({ tool }: { tool: string }) {
  const connector = getConnectorForTool(tool);
  const [preview, setPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (!connector) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreview(true), PREVIEW_DELAY);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreview(false);
  };

  return (
    <span className="relative inline-block">
      <code
        tabIndex={connector ? 0 : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className="rounded-sm bg-gray-3 px-1 py-0.5 font-mono text-caption text-gray-12"
      >
        {tool}
      </code>
      {preview && connector && (
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
