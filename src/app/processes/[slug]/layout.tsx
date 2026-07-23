import { notFound } from "next/navigation";
import { ConnectorLogo } from "@/components/connector-logo";
import { ProcessStatusToggle } from "@/components/process-status-toggle";
import { ProcessTabs } from "@/components/process-tabs";
import { ToolReference } from "@/components/tool-reference";
import {
  connectorColor,
  getSkill,
  getProcess,
  orderedConnectorsForProcess,
  toolsForConnector,
} from "@/lib/mock-data";

// The Version/Connectors/Tools panel belongs to the process, not to any one
// tab — it lives in the layout so Overview, Flow, and Usage all show the
// same aside instead of each re-deriving and re-rendering it.
export default async function ProcessLayout(props: LayoutProps<"/processes/[slug]">) {
  const { slug } = await props.params;
  const process = getProcess(slug);
  if (!process) notFound();
  const processSkills = process.skillIds.map(getSkill).filter((s) => s !== undefined);
  const processConnectors = orderedConnectorsForProcess(process);
  const currentVersion = process.versions[0];

  return (
    <div className="px-12 pb-6">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-background pt-4 pb-4">
        <ProcessTabs slug={slug} />
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <ProcessStatusToggle key={`status-${slug}`} initialActive={process.status === "active"} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-8 shell:flex-row">
        <div className="min-w-0 flex-1">{props.children}</div>

        <aside className="sticky top-[3.75rem] z-10 w-full shrink-0 self-start rounded-xl border border-border bg-gray-2 p-4 shell:w-72">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-body-medium text-gray-12">Version {currentVersion.version}</span>
              <span className="text-caption text-muted">{currentVersion.createdAt}</span>
            </div>

            <PanelSection title="Connectors">
              <ul className="flex flex-col gap-3">
                {processConnectors.map((connector) => {
                  const tools = process.tools ? toolsForConnector(process, connector.id) : undefined;
                  return (
                    <li key={connector.id}>
                      <div className="flex items-center gap-2">
                        <ConnectorLogo connector={connector} size="sm" />
                        <span className="text-caption text-gray-12">{connector.name}</span>
                      </div>
                      {tools && tools.length > 0 && (
                        <ul
                          className="mt-1.5 ml-3 flex flex-col gap-1 border-l pl-2"
                          style={{ borderColor: connectorColor(connector.id) }}
                        >
                          {tools.map((tool) => (
                            <li key={tool}>
                              <ToolReference tool={tool} dot={false} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </PanelSection>

            {!process.tools && processSkills.length > 0 && (
              <PanelSection title="Skills">
                <ul className="flex flex-wrap gap-2">
                  {processSkills.map((skill) => (
                    <li
                      key={skill.id}
                      className="rounded-full bg-gray-3 px-3 py-1 text-caption text-gray-11"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </PanelSection>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-caption text-muted">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
