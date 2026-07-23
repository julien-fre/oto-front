import { notFound } from "next/navigation";
import { ConnectorLogo } from "@/components/connector-logo";
import { getConnector, getProcess, getSkill } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  return { title: getProcess(slug)?.name ?? "Processes" };
}

export default async function ProcessOverviewPage({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  if (!process) notFound();
  const processSkills = process.skillIds.map(getSkill).filter((s) => s !== undefined);
  const processConnectors = process.connectorIds
    .map(getConnector)
    .filter((c) => c !== undefined);
  const currentVersion = process.versions[0];

  return (
    <div className="flex flex-col gap-8 shell:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <p className="max-w-prose text-body text-gray-11">{process.description}</p>
        <section>
          <h2 className="text-body-medium text-gray-12">Outputs</h2>
          <p className="mt-1 text-caption text-muted">{process.outputs.join(", ")}</p>
        </section>
      </div>

      <aside className="w-full shrink-0 rounded-xl bg-gray-2 p-4 shell:w-72">
        <div className="flex flex-col gap-5">
          <PanelSection title="Version">
            <div className="flex items-center justify-between">
              <span className="text-body-medium text-gray-12">V{currentVersion.version}</span>
              <span className="text-caption text-muted">{currentVersion.createdAt}</span>
            </div>
          </PanelSection>

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

          <PanelSection title="Connectors">
            <ul className="flex flex-col gap-2">
              {processConnectors.map((connector) => (
                <li key={connector.id} className="flex items-center gap-2">
                  <ConnectorLogo connector={connector} />
                  <span className="text-body text-gray-12">{connector.name}</span>
                </li>
              ))}
            </ul>
          </PanelSection>
        </div>
      </aside>
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
