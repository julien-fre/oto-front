import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { GraphIcon, ListIcon } from "@/components/icons";
import { KnowledgeGraph } from "@/components/knowledge/knowledge-graph";
import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { cn, focusRing } from "@/lib/cn";
import { GRAPH_COOKIE, parseSettings } from "@/lib/graph-settings";

export const metadata: Metadata = { title: "Knowledge" };

const VIEWS = [
  { key: "list", label: "List", icon: <ListIcon /> },
  { key: "graph", label: "Graph", icon: <GraphIcon /> },
] as const;

export default async function KnowledgePage({ searchParams }: PageProps<"/knowledge">) {
  const { view } = await searchParams;
  const isGraph = view === "graph";

  // Server-rendered from the cookie so the graph opens configured the way it
  // was left, with no flash of default settings — the same reasoning that puts
  // the sidebar's state in the root layout.
  const settings = parseSettings((await cookies()).get(GRAPH_COOKIE)?.value);

  return (
    // The height chain the graph needs to fill the page: flex column here,
    // shrink-0 on the switcher, min-h-0 flex-1 on the canvas. <main> in the app
    // shell is already flex-1 overflow-y-auto.
    <div className={cn("flex flex-col px-12 py-6", isGraph ? "h-full" : "min-h-full")}>
      <div className="mb-4 flex shrink-0 items-center gap-1">
        {VIEWS.map((item) => {
          const active = (item.key === "graph") === isGraph;
          return (
            <Link
              key={item.key}
              // A plain link, so the view is shareable, survives a reload, and
              // works before hydration.
              href={item.key === "graph" ? "/knowledge?view=graph" : "/knowledge"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-full px-3 text-button transition-colors duration-100 motion-reduce:transition-none",
                active
                  ? "bg-interactive-checked text-gray-12"
                  : "text-muted hover:bg-interactive-hovered",
                focusRing,
              )}
            >
              <span className={active ? "text-gray-12" : "text-icon"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {isGraph ? (
        <div className="min-h-0 flex-1">
          <KnowledgeGraph initialSettings={settings} />
        </div>
      ) : (
        <KnowledgeList />
      )}
    </div>
  );
}
