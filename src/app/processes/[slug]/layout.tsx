import { notFound } from "next/navigation";
import { ProcessTabs } from "@/components/process-tabs";
import { getProcess } from "@/lib/mock-data";

export default async function ProcessLayout(props: LayoutProps<"/processes/[slug]">) {
  const { slug } = await props.params;
  const process = getProcess(slug);
  if (!process) notFound();

  return (
    <div className="px-12 pb-6">
      <div className="pt-4">
        <ProcessTabs slug={slug} />
      </div>
      <div className="mt-8">{props.children}</div>
    </div>
  );
}
