import { notFound } from "next/navigation";
import { getProcess } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  return { title: process ? `${process.name} · Usage` : "Processes" };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption text-muted">{label}</span>
      <span className="text-body-medium text-gray-12">{value}</span>
    </div>
  );
}

export default async function ProcessUsagePage({ params }: PageProps<"/processes/[slug]">) {
  const { slug } = await params;
  const process = getProcess(slug);
  if (!process) notFound();
  const { runs } = process;

  if (runs.length === 0) {
    return (
      <p className="text-body text-muted">
        No runs yet.{" "}
        {process.status === "draft"
          ? "This process is still a draft."
          : "It hasn't been triggered."}
      </p>
    );
  }

  const successCount = runs.filter((r) => r.status === "success").length;
  const successRate = Math.round((successCount / runs.length) * 100);
  const avgDuration = Math.round(
    runs.reduce((sum, r) => sum + r.durationMinutes, 0) / runs.length,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Total runs" value={String(runs.length)} />
        <Stat label="Success rate" value={`${successRate}%`} />
        <Stat label="Avg duration" value={`${avgDuration} min`} />
        <Stat label="Last run" value={runs[0].ranAt} />
      </div>
      <section>
        <h2 className="text-body-medium text-gray-12">Recent runs</h2>
        <ul className="mt-4 divide-y divide-gray-5 border-y border-gray-5">
          {runs.map((run) => (
            <li key={run.ranAt} className="flex items-center gap-4 px-2 py-2">
              <span className="min-w-0 flex-1 text-body text-gray-12">{run.ranAt}</span>
              <span className="shrink-0 text-caption text-muted">
                {run.durationMinutes} min
              </span>
              <span
                className={
                  run.status === "success"
                    ? "w-16 shrink-0 text-right text-caption text-green-11"
                    : "w-16 shrink-0 text-right text-caption text-red-11"
                }
              >
                {run.status === "success" ? "Success" : "Failed"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
