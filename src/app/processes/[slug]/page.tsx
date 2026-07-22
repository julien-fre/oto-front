import { notFound } from "next/navigation";
import { getConnector, getProcess, getSkill } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  return { title: getProcess(slug)?.name ?? "Processes" };
}

const statusLabel = { active: "Active", draft: "Draft", deprecated: "Deprecated" } as const;

export default async function ProcessPage({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  if (!process) notFound();
  const processSkills = process.skillIds.map(getSkill).filter((s) => s !== undefined);
  const processConnectors = process.connectorIds
    .map(getConnector)
    .filter((c) => c !== undefined);

  return (
    <div className="px-12 py-6">
      <p className="text-caption">
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
      <section className="mt-8">
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
      <section className="mt-8">
        <h2 className="text-body-medium text-gray-12">Connectors</h2>
        <p className="mt-1 text-caption text-muted">
          {processConnectors.map((c) => c.name).join(", ")}
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-body-medium text-gray-12">Outputs</h2>
        <p className="mt-1 text-caption text-muted">{process.outputs.join(", ")}</p>
      </section>
    </div>
  );
}
