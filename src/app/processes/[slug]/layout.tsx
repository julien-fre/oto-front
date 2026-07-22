import { notFound } from "next/navigation";
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
    <div className="pb-6">
      <div className="sticky top-0 z-20 bg-background px-12 pt-2">
        <div className="relative flex items-center justify-end gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <ProcessStatusToggle
              key={`status-${slug}`}
              initialActive={process.status === "active"}
            />
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
          {/* Centered on the title row itself (not a row of its own) — the
              capsule's vertical center lines up with the title bar's. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto">
              <ProcessTabs slug={slug} />
            </div>
          </div>
        </div>
        <div className="mt-6 border-b border-border" />
      </div>
      <div className="px-12">{props.children}</div>
    </div>
  );
}
