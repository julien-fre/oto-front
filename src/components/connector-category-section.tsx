"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import type { Connector } from "@/lib/mock-data";
import { ConnectorCard } from "./connector-card";

export function ConnectorCategorySection({
  category,
  connectors,
  onSelect,
}: {
  category: string;
  connectors: Connector[];
  onSelect: (connector: Connector) => void;
}) {
  const [open, setOpen] = useState(true);
  const groupId = `connector-category-${category}`;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={groupId}
        className={cn(
          "flex h-8 items-center gap-2 rounded-full px-2 hover:bg-interactive-hovered",
          focusRing,
        )}
      >
        <ChevronRightIcon className={cn("text-icon transition-transform", open && "rotate-90")} />
        <h2 className="text-body-medium text-gray-12">{category}</h2>
        <span className="text-caption text-muted">{connectors.length}</span>
      </button>
      {open && (
        <div
          id={groupId}
          className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {connectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onSelect={() => onSelect(connector)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
