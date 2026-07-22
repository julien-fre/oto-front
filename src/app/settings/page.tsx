import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="px-8 py-6">
      <PageHeader title="Settings" caption="Workspace preferences and account." />
      <p className="mt-8 text-body text-muted">
        No settings yet. Connect the back end to manage your workspace.
      </p>
    </div>
  );
}
