import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DocBody } from "@/components/knowledge/doc-body";
import { DocProperties } from "@/components/knowledge/doc-properties";
import { DocRail } from "@/components/knowledge/doc-rail";
import { headingsOf } from "@/lib/doc-outline";
import { DOC_RAIL_COOKIE } from "@/lib/graph-settings";
import { backlinksFor, getDoc, outgoingFor, processesReading } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/knowledge/[slug]">) {
  const { slug } = await params;
  return { title: getDoc(slug)?.title ?? "Knowledge" };
}

export default async function DocPage({ params }: PageProps<"/knowledge/[slug]">) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const backlinks = backlinksFor(slug);
  const outgoing = outgoingFor(slug);
  const readers = processesReading(slug);
  // Server-read so the rail renders in its remembered state with no flash,
  // matching how the sidebar's own state is handled in the root layout.
  const railOpen = (await cookies()).get(DOC_RAIL_COOKIE)?.value !== "closed";

  return (
    // Stacks below the shell breakpoint, splits into two columns above it.
    <div className="flex min-h-full flex-col shell:flex-row">
      <div className="min-w-0 flex-1 px-12 py-6">
        {/* No page <h1>: the top bar's trailing breadcrumb crumb already is
            this document's title, and rendering a second one would duplicate
            it. The properties block is what opens a doc instead. */}
        {/* Centred in whatever width is left over, so opening or closing the
            rail rebalances the page instead of stranding the text against one
            edge. */}
        <div className="mx-auto max-w-[40rem]">
          <DocProperties doc={doc} backlinks={backlinks.length} readers={readers.length} />
          <p className="mt-6 mb-2 text-prose text-gray-11">{doc.excerpt}</p>
          <DocBody blocks={doc.body} />
        </div>
      </div>

      <DocRail
        // Remount per doc so the rail's tab and local-graph controls reset
        // with the document rather than carrying over.
        key={slug}
        defaultOpen={railOpen}
        data={{
          slug,
          backlinks: backlinks.map((d) => ({ slug: d.slug, title: d.title })),
          outgoing: outgoing.map((o) => ({ slug: o.slug, title: o.doc?.title ?? null })),
          readers: readers.map((p) => ({ slug: p.slug, name: p.name })),
          headings: headingsOf(doc.body),
        }}
      />
    </div>
  );
}
