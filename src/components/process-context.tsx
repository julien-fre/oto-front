"use client";

import { createContext, useContext } from "react";
import type { RealProcess } from "@/lib/processes-api";

// Set once by [slug]/layout.tsx after it fetches the doctrine, so the
// overview page (page.tsx) can render the same data without re-fetching the
// same slug a second time.
export const ProcessContext = createContext<RealProcess | null>(null);

export function useProcessData(): RealProcess {
  const process = useContext(ProcessContext);
  if (!process) throw new Error("useProcessData must be used within the process layout");
  return process;
}
