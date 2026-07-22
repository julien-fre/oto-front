import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProcessStatusToggle } from "@/components/process-status-toggle";
import { ProcessTabs } from "@/components/process-tabs";
import { ProcessVersionMenu } from "@/components/process-version-menu";
import { cn, focusRing } from "@/lib/cn";
import { getProcess } from "@/lib/mock-data";

export default async function ProcessLayout(props: LayoutProps<"/processes/[slug]">) {
  const { slug } = await props.params;
  const process = getProcess(slug);
  if (!process) notFound();

  return (
    <div className="px-12 pt-2 pb-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title={process.name} />
        <div className="flex shrink-0 items-center gap-3">
          <ProcessStatusToggle key={`status-${slug}`} initialActive={process.status === "active"} />
          <ProcessVersionMenu key={`versions-${slug}`} versions={process.versions} />
          <button
            type="button"
            className={cn(
              "flex h-7 shrink-0 items-center rounded-full border border-border px-3 text-button text-gray-12 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none",
              focusRing,
            )}
          >
            Share
          </button>
        </div>
      </div>
      <div className="mt-6 -mx-12 border-b border-border" />
      <div className="mt-4">
        <ProcessTabs slug={slug} />
      </div>
      <div className="mt-8">{props.children}</div>
    </div>
  );
}
