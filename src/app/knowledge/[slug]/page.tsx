import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getDoc } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/knowledge/[slug]">) {
  const { slug } = await params;
  return { title: getDoc(slug)?.title ?? "Knowledge" };
}

export default async function DocPage({ params }: PageProps<"/knowledge/[slug]">) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const related = doc.links.map(getDoc).filter((d) => d !== undefined);

  return (
    <div className="px-12 pt-2 pb-6">
      <PageHeader title={doc.title} />
      {doc.sourceOfTruth && (
        <p className="mt-4 text-caption text-muted">Source of truth: {doc.sourceOfTruth}</p>
      )}
      <p className="mt-8 max-w-prose text-body text-gray-11">{doc.excerpt}</p>
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-body-medium text-gray-12">Related</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/knowledge/${r.slug}`}
                  className="text-body text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
