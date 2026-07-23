import { notFound } from "next/navigation";
import { DocBody } from "@/components/knowledge/doc-body";
import { getProcess } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  return { title: getProcess(slug)?.name ?? "Processes" };
}

export default async function ProcessOverviewPage({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  if (!process) notFound();

  return process.body ? (
    <div className="max-w-prose">
      <DocBody blocks={process.body} />
    </div>
  ) : (
    <p className="max-w-prose text-body text-gray-11">{process.description}</p>
  );
}
