import { notFound } from "next/navigation";
import { ProcessTabs } from "@/components/process-tabs";
import { getProcess } from "@/lib/mock-data";

export default async function ProcessLayout(props: LayoutProps<"/processes/[slug]">) {
  const { slug } = await props.params;
  const process = getProcess(slug);
  if (!process) notFound();

  return (
    <div className="px-12 pt-3 pb-6">
      <div className="border-b border-border" />
      <div className="mt-4">
        <ProcessTabs slug={slug} />
      </div>
      <div className="mt-8">{props.children}</div>
    </div>
  );
}
