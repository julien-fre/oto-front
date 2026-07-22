import { notFound } from "next/navigation";
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

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-body text-gray-11">{process.description}</p>
      <section>
        <h2 className="text-body-medium text-gray-12">Skills</h2>
        <p className="mt-1 text-caption text-muted">
          The actions this process is composed of. A skill can be reused by other processes.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {processSkills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-full bg-gray-3 px-3 py-1 text-caption text-gray-11"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-body-medium text-gray-12">Connectors</h2>
        <p className="mt-1 text-caption text-muted">
          {processConnectors.map((c) => c.name).join(", ")}
        </p>
      </section>
      <section>
        <h2 className="text-body-medium text-gray-12">Outputs</h2>
        <p className="mt-1 text-caption text-muted">{process.outputs.join(", ")}</p>
      </section>
    </div>
  );
}
