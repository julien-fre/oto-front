"use client";

import { useEffect, useState } from "react";
import { useProcesses } from "@/components/processes-provider";
import { fetchProcess, type RealProcess } from "@/lib/processes-api";

export type ProcessesGraphState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; processes: RealProcess[] };

/**
 * Building process↔connector edges needs each process's full body
 * (RealProcess.tools, via detectTools) — the list endpoint
 * (useProcesses()/ProcessSummary) only has title/description/version, no
 * body_md. So on top of the summaries ProcessesProvider already fetched,
 * this does one GET per process (Promise.all — small payloads, fine at
 * today's/realistic scale; would need pagination if an org ever had
 * hundreds of named doctrines, which isn't the case yet).
 */
export function useProcessesGraph(): ProcessesGraphState {
  const { state: listState } = useProcesses();
  const [state, setState] = useState<ProcessesGraphState>({ kind: "idle" });

  useEffect(() => {
    if (listState.kind !== "ready") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the list state (idle/loading/error) until it's ready to fetch bodies
      setState(listState);
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    Promise.all(listState.processes.map((p) => fetchProcess(p.slug)))
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
  }, [listState]);

  return state;
}
