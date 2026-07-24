"use client";

import Link from "next/link";
import { use, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { DocBody } from "@/components/knowledge/doc-body";
import { DocProperties } from "@/components/knowledge/doc-properties";
import { DocRail } from "@/components/knowledge/doc-rail";
import { useKnowledge } from "@/components/knowledge/knowledge-provider";
import { KnowledgeError } from "@/components/knowledge/knowledge-error";
import { cn, focusRing } from "@/lib/cn";
import { DOC_RAIL_COOKIE } from "@/lib/graph-settings";
import { markdownToBlocks } from "@/lib/markdown";

// A doc is addressed by its backend id — docs have no slug (oto-backend
// docs table). Everything renders from the KnowledgeProvider's single fetch;
// the body is the doc's markdown converted to the typed block model.

export default function DocPage({ params }: PageProps<"/knowledge/[id]">) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { state, refresh } = useKnowledge();

  const docId = Number(id);
  const doc =
    state.kind === "ready" && Number.isInteger(docId) ? state.kb.byId.get(docId) : undefined;

  const blocks = useMemo(() => {
    if (!doc || state.kind !== "ready") return [];
    return markdownToBlocks(doc.bodyMd, state.kb.resolveTitle);
  }, [doc, state]);

  // A client page can't export generateMetadata, so the per-doc tab title is
  // set imperatively — the layout's static "Knowledge" covers every earlier
  // state, and the root template appends "· Oto" which is mirrored here.
  useEffect(() => {
    if (doc?.title) document.title = `${doc.title} · Oto`;
  }, [doc?.title]);

  if (authLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <button
          type="button"
          onClick={() => login(`/knowledge/${id}`)}
          className="rounded-full bg-gray-12 px-4 py-2 text-button text-gray-1"
        >
          Sign in to read this doc
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

  if (!doc) {
    return (
      <Centered>
        <p>This page doesn&apos;t exist in the knowledge base — it may have been deleted.</p>
        <Link
          href="/knowledge"
          className={cn(
            "h-7 rounded-full border border-border px-3 text-button leading-7 text-gray-12 hover:bg-gray-2",
            focusRing,
          )}
        >
          Back to Knowledge
        </Link>
      </Centered>
    );
  }

  const backlinks = state.kb.incoming.get(doc.id)?.length ?? 0;
  const outgoing =
    (state.kb.outgoing.get(doc.id)?.length ?? 0) + (state.kb.stubs.get(doc.id)?.length ?? 0);

  return (
    // Stacks below the shell breakpoint, splits into two columns above it.
    <div className="flex min-h-full flex-col shell:flex-row">
      <div className="min-w-0 flex-1 px-12 py-6">
        {/* No page <h1>: the top bar's trailing breadcrumb crumb already is
            this document's title. The properties block is what opens a doc.
            Centred in whatever width is left over, so opening or closing the
            rail rebalances the page. */}
        <div className="mx-auto max-w-[40rem]">
          <DocProperties doc={doc} backlinks={backlinks} outgoing={outgoing} />
          {doc.description && <p className="mt-6 mb-2 text-prose text-gray-11">{doc.description}</p>}
          {blocks.length > 0 ? (
            <DocBody blocks={blocks} />
          ) : (
            <p className="mt-6 text-body text-muted">This page is empty.</p>
          )}
        </div>
      </div>

      <DocRail
        // Remount per doc so the local-graph controls reset with the document
        // rather than carrying over.
        key={doc.id}
        kb={state.kb}
        docId={doc.id}
        defaultOpen={railDefaultOpen()}
      />
    </div>
  );
}

// The rail's collapsed state persists in a cookie. Read client-side: this
// page renders behind auth, which is client-only — there is no server pass
// to disagree with.
function railDefaultOpen(): boolean {
  if (typeof document === "undefined") return true;
  return !document.cookie.split("; ").some((c) => c === `${DOC_RAIL_COOKIE}=closed`);
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-12 py-6 text-body text-muted">
      {children}
    </div>
  );
}
