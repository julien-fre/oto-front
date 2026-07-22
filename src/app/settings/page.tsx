import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="px-12 py-6">
      <p className="mt-8 text-body text-muted">
        No settings yet. Connect the back end to manage your workspace.
      </p>
    </div>
  );
}
