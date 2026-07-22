import type { Connector } from "@/lib/mock-data";
import { ConnectorCard } from "./connector-card";

export function ConnectorKanbanBoard({
  categories,
  onSelect,
}: {
  categories: [string, Connector[]][];
  onSelect: (connector: Connector) => void;
}) {
  return (
    <div className="flex h-full min-h-0 gap-4 overflow-x-auto">
      {categories.map(([category, categoryConnectors]) => (
        <div
          key={category}
          className="flex h-full w-72 shrink-0 flex-col gap-3 rounded-lg bg-gray-2 p-3"
        >
          <div className="flex shrink-0 items-center gap-2 px-1">
            <h2 className="text-body-medium text-gray-12">{category}</h2>
            <span className="text-caption text-muted">{categoryConnectors.length}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {categoryConnectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                onSelect={() => onSelect(connector)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
