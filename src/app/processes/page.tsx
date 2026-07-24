"use client";

import { useAuth } from "@/components/auth-provider";
import { ProcessesGraph } from "@/components/processes/processes-graph";

// A graph, not a list — processes linked to the connectors they use, the
// same shape /knowledge?view=graph shows for docs. Loading/error/empty states
// for the process data itself are owned by ProcessesGraph (via
// useProcessesGraph); this page only gates on auth, same as before.
export default function ProcessesPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

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

  return (
    <div className="h-full px-12 py-6">
      <ProcessesGraph />
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
