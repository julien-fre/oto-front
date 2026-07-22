import type { Connector } from "@/lib/mock-data";
import { cn, focusRing } from "@/lib/cn";
import { ConnectorLogo } from "@/components/connector-logo";
import { connectorStatusKey, statusLabels, statusPillClassName } from "@/lib/connector-status";

export function ConnectorCard({
  connector,
  onSelect,
}: {
  connector: Connector;
  onSelect: () => void;
}) {
  const statusKey = connectorStatusKey(connector);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border border-border bg-background p-4 text-left hover:bg-gray-3",
        focusRing,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <ConnectorLogo connector={connector} />
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-caption",
            statusPillClassName[statusKey],
          )}
        >
          {statusLabels[statusKey]}
        </span>
      </div>
      <p className="mt-3 truncate text-body-medium text-gray-12">{connector.name}</p>
      <p className="mt-1 line-clamp-2 h-8 text-caption text-muted">{connector.description}</p>
    </button>
  );
}
