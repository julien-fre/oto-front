import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProcessTabs } from "@/components/process-tabs";
import { getProcess } from "@/lib/mock-data";

const statusLabel = { active: "Active", draft: "Draft", deprecated: "Deprecated" } as const;

export default async function ProcessLayout(props: LayoutProps<"/processes/[slug]">) {
  const { slug } = await props.params;
  const process = getProcess(slug);
  if (!process) notFound();

  return (
    <div className="px-12 pt-2 pb-6">
      <PageHeader title={process.name} />
      <p className="mt-4 text-caption">
        <span className={process.status === "active" ? "text-green-11" : "text-muted"}>
          {statusLabel[process.status]}
        </span>
        <span className="text-muted">
          {" · "}
          {process.schedule ?? "Manual"}
          {" · "}
          {process.owner}
        </span>
      </p>
      <div className="mt-6 -mx-12 border-b border-border" />
      <div className="mt-4">
        <ProcessTabs slug={slug} />
      </div>
      <div className="mt-8">{props.children}</div>
    </div>
  );
}
