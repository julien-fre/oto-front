"use client";

import { useState } from "react";
import { Toggle } from "@/components/toggle";

export function ProcessStatusToggle({ initialActive }: { initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);

  return (
    <div className="flex items-center gap-2">
      <Toggle checked={active} onChange={() => setActive((a) => !a)} label="Active" />
      <span className="text-caption text-muted">{active ? "Active" : "Inactive"}</span>
    </div>
  );
}
