"use client";

import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConnectorLogo } from "@/components/connector-logo";
import { ProcessContext } from "@/components/process-context";
import { ProcessTabs } from "@/components/process-tabs";
import { ProcessVersionMenu } from "@/components/process-version-menu";
import { ToolReference } from "@/components/tool-reference";
import { ApiError } from "@/lib/api";
import { connectorColor, orderedConnectorsForProcess, toolsForConnector } from "@/lib/mock-data";
import { fetchProcess, type RealProcess } from "@/lib/processes-api";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; process: RealProcess };

// The Version/Connectors/Tools panel belongs to the process, not to any one
// tab — it lives in the layout so Overview, Flow, and Usage all show the
// same aside instead of each re-deriving and re-rendering it. No status
// badge or Active toggle here: a real doctrine has no status field (see the
// connect-processes-to-backend plan) — that control only ever meant anything
// for the invented mock processes, which are gone.
export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const loadProcess = useCallback(() => {
    let cancelled = false;
    fetchProcess(slug)
      .then((process) => {
        if (!cancelled) setState({ kind: "ready", process });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          notFound();
          return;
        }
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to load this process.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    return loadProcess();
  }, [authLoading, isAuthenticated, loadProcess]);

  // No generateMetadata here — a client route can't export it. Matches the
  // root layout's title template (title.template: "%s · Oto") by hand.
  useEffect(() => {
    if (state.kind === "ready") document.title = `${state.process.name} · Oto`;
  }, [state]);

  if (authLoading || state.kind === "loading") {
    return <Centered>Loading…</Centered>;
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <button
          type="button"
          onClick={() => login(`/processes/${slug}`)}
          className="rounded-full bg-gray-12 px-4 py-2 text-button text-gray-1"
        >
          Sign in to see this process
        </button>
      </Centered>
    );
  }

  if (state.kind === "error") {
    return <Centered>Couldn&apos;t load this process — {state.message}</Centered>;
  }

  const { process } = state;
  const processConnectors = orderedConnectorsForProcess({ tools: process.tools, connectorIds: [] });

  return (
    <ProcessContext.Provider value={process}>
      <div className="px-12 pb-6">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-background pt-4 pb-4">
          <ProcessTabs slug={slug} />
        </div>

        <div className="mt-4 flex flex-col gap-8 shell:flex-row">
          <div className="min-w-0 flex-1">{children}</div>

          <aside className="sticky top-[3.75rem] z-10 w-full shrink-0 self-start rounded-xl border border-border bg-gray-2 p-4 shell:w-72">
            <div className="flex flex-col gap-5">
              <ProcessVersionMenu
                slug={slug}
                version={process.version}
                updatedAt={process.updatedAt}
                onReverted={loadProcess}
              />

              {processConnectors.length > 0 && (
                <PanelSection title="Connectors">
                  <ul className="flex flex-col gap-3">
                    {processConnectors.map((connector) => {
                      const tools = toolsForConnector({ tools: process.tools }, connector.id);
                      return (
                        <li key={connector.id}>
                          <div className="flex items-center gap-2">
                            <ConnectorLogo connector={connector} size="sm" />
                            <span className="text-caption text-gray-12">{connector.name}</span>
                          </div>
                          {tools.length > 0 && (
                            <ul
                              className="mt-1.5 ml-3 flex flex-col gap-1 border-l pl-2"
                              style={{ borderColor: connectorColor(connector.id) }}
                            >
                              {tools.map((tool) => (
                                <li key={tool}>
                                  <ToolReference tool={tool} dot={false} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </PanelSection>
              )}
            </div>
          </aside>
        </div>
      </div>
    </ProcessContext.Provider>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-caption text-muted">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-12 py-6 text-body text-muted">
      {children}
    </div>
  );
}
