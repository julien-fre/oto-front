"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { GraphIcon, ListIcon } from "@/components/icons";
import { KnowledgeGraph } from "@/components/knowledge/knowledge-graph";
import { KnowledgeError } from "@/components/knowledge/knowledge-error";
import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { useKnowledge } from "@/components/knowledge/knowledge-provider";
import { cn, focusRing } from "@/lib/cn";


const VIEWS = [
  { key: "list", label: "List", icon: <ListIcon /> },
  { key: "graph", label: "Graph", icon: <GraphIcon /> },
] as const;

// useSearchParams needs a Suspense boundary above it, so the page is a thin
// wrapper around the real content.
export default function KnowledgePage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeView />
    </Suspense>
  );
}

function KnowledgeView() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { state, refresh } = useKnowledge();
  const isGraph = useSearchParams().get("view") === "graph";

  if (authLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <button
          type="button"
          onClick={() => login("/knowledge")}
          className="rounded-full bg-gray-12 px-4 py-2 text-button text-gray-1"
        >
          Sign in to see your knowledge base
        </button>
      </Centered>
    );
  }

  if (state.kind === "idle" || state.kind === "loading") {
    return <Centered>Loading knowledge base…</Centered>;
  }

  if (state.kind === "error") {
    return (
      <Centered>
        <KnowledgeError message={state.message} onRetry={refresh} />
      </Centered>
    );
  }

  return (
    // The height chain the graph needs to fill the page: flex column here,
    // shrink-0 on the switcher, min-h-0 flex-1 on the canvas. <main> in the
    // app shell is already flex-1 overflow-y-auto.
    <div className={cn("flex flex-col px-12 py-6", isGraph ? "h-full" : "min-h-full")}>
      <div className="mb-4 flex shrink-0 items-center gap-1">
        {VIEWS.map((item) => {
          const active = (item.key === "graph") === isGraph;
          return (
            <Link
              key={item.key}
              // A plain link, so the view is shareable and survives a reload.
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
          <KnowledgeGraph kb={state.kb} />
        </div>
      ) : (
        <KnowledgeList kb={state.kb} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-12 py-6 text-body text-muted">
      {children}
    </div>
  );
}
