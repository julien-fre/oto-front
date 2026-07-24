"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { cn, focusRing } from "@/lib/cn";
import type { MeInfo } from "@/lib/connectors-api";
import { connectorStatusKey, statusLabels, type ConnectorStatusKey } from "@/lib/connector-status";
import type { Connector } from "@/lib/mock-data";
import type { Tool } from "@/lib/tools-api";
import { ConnectorDetailPanel } from "./connector-detail-panel";
import { ConnectorKanbanBoard } from "./connector-kanban-board";

function groupByCategory(connectors: Connector[]) {
  const byCategory = new Map<string, Connector[]>();
  for (const connector of connectors) {
    const group = byCategory.get(connector.category);
    if (group) group.push(connector);
    else byCategory.set(connector.category, [connector]);
  }
  return [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
}

export function ConnectorsBrowser({
  connectors,
  onUpdateConnector,
  tools,
  onUpdateTool,
  meInfo,
  onRefetch,
}: {
  connectors: Connector[];
  onUpdateConnector: (id: string, patch: Partial<Connector>) => void;
  tools: Tool[];
  onUpdateTool: (name: string, patch: Partial<Tool>) => void;
  meInfo: MeInfo;
  onRefetch: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ConnectorStatusKey | null>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = selectedId ? (connectors.find((c) => c.id === selectedId) ?? null) : null;

  // ⌘F/Ctrl+F focuses the in-page search instead of the browser's native
  // find — only while the board is actually interactive (the detail panel
  // makes it `inert`, so native find is the more useful fallback then).
  useEffect(() => {
    if (selected != null) return;
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [selected]);

  function openConnector(connector: Connector) {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(connector.id);
  }

  function closePanel() {
    setSelectedId(null);
    restoreFocusRef.current?.focus();
  }

  // Counts against the full roster (not the filtered set) — same convention
  // as the real console's category dropdown, so a filter's count never
  // changes just because another filter narrowed the list.
  const statusFilters = useMemo(() => {
    const counts = new Map<ConnectorStatusKey, number>();
    for (const c of connectors) {
      const key = connectorStatusKey(c);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return (Object.keys(statusLabels) as ConnectorStatusKey[])
      .filter((key) => (counts.get(key) ?? 0) > 0)
      .map((key) => ({ key, label: statusLabels[key], count: counts.get(key) ?? 0 }));
  }, [connectors]);

  const categories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = connectors.filter((c) => {
      if (status !== null && connectorStatusKey(c) !== status) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle)
      );
    });
    return groupByCategory(filtered);
  }, [connectors, query, status]);

  return (
    <>
      <div className="mt-6 flex h-full min-h-0 flex-col gap-6" inert={selected != null}>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex h-8 w-64 items-center gap-2 rounded-md border border-border px-2">
            <SearchIcon className="shrink-0 text-icon" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search connectors"
              aria-label="Search connectors"
              className="w-full min-w-0 bg-transparent text-body text-gray-12 placeholder:text-placeholder focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus((prev) => (prev === f.key ? null : f.key))}
                aria-pressed={status === f.key}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full px-3 text-button",
                  status === f.key
                    ? "bg-interactive-checked text-gray-12"
                    : "text-muted hover:bg-interactive-hovered",
                  focusRing,
                )}
              >
                {f.label}
                <span className="text-caption text-muted">{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        {categories.length === 0 ? (
          <p className="text-body text-muted">No connectors match your filters.</p>
        ) : (
          <div className="min-h-0 flex-1">
            <ConnectorKanbanBoard categories={categories} onSelect={openConnector} />
          </div>
        )}
      </div>
      <ConnectorDetailPanel
        key={selected?.id ?? "closed"}
        connector={selected}
        onClose={closePanel}
        onUpdateConnector={onUpdateConnector}
        tools={tools}
        onUpdateTool={onUpdateTool}
        meInfo={meInfo}
        onRefetch={onRefetch}
      />
    </>
  );
}
