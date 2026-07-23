import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ConnectorLogo } from "@/components/connector-logo";
import { getProcess, getSkill, orderedConnectorsForProcess } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  return { title: process ? `${process.name} · Flow` : "Processes" };
}

function FlowStep({
  index,
  label,
  last = false,
  children,
}: {
  index: number;
  label?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-6 left-3 h-full w-px -translate-x-1/2 bg-gray-5"
        />
      )}
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-4 text-caption text-gray-11">
        {index}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {label && <h3 className="text-caption text-muted">{label}</h3>}
        <div className={label ? "mt-1" : undefined}>{children}</div>
      </div>
    </li>
  );
}

export default async function ProcessFlowPage({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  if (!process) notFound();
  const processSkills = process.skillIds.map(getSkill).filter((s) => s !== undefined);
  const processConnectors = orderedConnectorsForProcess(process);

  return (
    <ol className="max-w-prose">
      <FlowStep index={1} label="Trigger">
        <p className="text-body text-gray-12">{process.schedule ?? "Manual — run on demand"}</p>
      </FlowStep>
      {processSkills.map((skill, i) => (
        <FlowStep key={skill.id} index={i + 2} label={i === 0 ? "Skills" : undefined}>
          <p className="text-body text-gray-12">{skill.name}</p>
          <p className="mt-0.5 text-caption text-muted">{skill.description}</p>
        </FlowStep>
      ))}
      <FlowStep index={processSkills.length + 2} label="Connectors">
        <ul className="flex flex-wrap gap-3">
          {processConnectors.map((connector) => (
            <li key={connector.id} className="flex items-center gap-2">
              <ConnectorLogo connector={connector} />
              <span className="text-body text-gray-12">{connector.name}</span>
            </li>
          ))}
        </ul>
      </FlowStep>
      <FlowStep index={processSkills.length + 3} label="Outputs" last>
        <ul className="flex flex-wrap gap-2">
          {process.outputs.map((output) => (
            <li
              key={output}
              className="rounded-full bg-gray-3 px-3 py-1 text-caption text-gray-11"
            >
              {output}
            </li>
          ))}
        </ul>
      </FlowStep>
    </ol>
  );
}
