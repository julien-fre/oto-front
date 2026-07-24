"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchProcesses, type ProcessSummary } from "@/lib/processes-api";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; processes: ProcessSummary[] };

export default function ProcessesPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    fetchProcesses()
      .then((processes) => {
        if (!cancelled) setState({ kind: "ready", processes });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Failed to load processes.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <button
          type="button"
          onClick={() => login("/processes")}
          className="rounded-full bg-gray-12 px-4 py-2 text-button text-gray-1"
        >
          Sign in to see your processes
        </button>
      </Centered>
    );
  }

  if (state.kind === "loading") {
    return <Centered>Loading processes…</Centered>;
  }

  if (state.kind === "error") {
    return <Centered>Couldn&apos;t load processes — {state.message}</Centered>;
  }

  if (state.processes.length === 0) {
    return <Centered>No named procedures yet for this org.</Centered>;
  }

  return (
    <div className="px-12 py-6">
      <div className="divide-y divide-gray-5 border-y border-gray-5">
        {state.processes.map((process) => (
          <Link
            key={process.slug}
            href={`/processes/${process.slug}`}
            className="flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-gray-12">{process.name}</span>
              <span className="block truncate text-caption text-muted">
                {process.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
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
