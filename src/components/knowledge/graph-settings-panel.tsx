"use client";

import { useState, type ReactNode } from "react";
import { ChevronRightIcon, RotateIcon, SearchIcon, XIcon } from "@/components/icons";
import { Slider } from "@/components/slider";
import { Toggle } from "@/components/toggle";
import { cn, focusRing } from "@/lib/cn";
import { FORCE_RANGES } from "@/lib/force-graph";
import { DEFAULT_SETTINGS, type GraphSettings } from "@/lib/graph-settings";
import { COLOR_BY_LABELS, type ColorBy } from "@/lib/knowledge-graph";
import { DISPLAY_RANGES } from "./graph-canvas";

// Obsidian's four groups, in Obsidian's fixed order, all collapsed at rest.
// The one substitution is Groups -> Color by: Obsidian's colour groups are
// saved search queries, which needs its whole query language (path:, tag:,
// [property:value], regex, booleans) before the feature means anything. A
// fixed dimension picker buys the same "colour tells me something" payoff
// without shipping a query engine.
type Group = "filters" | "color" | "display" | "forces";

const GROUP_LABELS: Record<Group, string> = {
  filters: "Filters",
  color: "Color by",
  display: "Display",
  forces: "Forces",
};

function Section({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "flex h-7 w-full items-center gap-1 rounded-full pl-1 pr-2 text-icon transition-colors duration-100 hover:bg-interactive-hovered motion-reduce:transition-none",
          focusRing,
        )}
      >
        <ChevronRightIcon
          className={cn(
            "shrink-0 transition-[rotate] duration-150 motion-reduce:transition-none",
            open && "rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-left text-body-medium text-gray-12">
          {label}
        </span>
      </button>
      <div id={id} hidden={!open} className="flex flex-col gap-1 pb-2 pl-1">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-2 py-0.5">
      <span className="min-w-0">
        <span className="block truncate text-caption text-gray-12">{label}</span>
        {hint && <span className="block truncate text-caption text-muted">{hint}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function GraphSettingsPanel({
  settings,
  onChange,
  onReset,
  onClose,
}: {
  settings: GraphSettings;
  onChange: (next: GraphSettings) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  // All four start collapsed, matching Obsidian's factory defaults — the panel
  // is a reference you open, not a dashboard you read.
  const [open, setOpen] = useState<Group | null>(null);
  const toggle = (group: Group) => setOpen((prev) => (prev === group ? null : group));

  const setFilters = (patch: Partial<GraphSettings["filters"]>) =>
    onChange({ ...settings, filters: { ...settings.filters, ...patch } });
  const setDisplay = (patch: Partial<GraphSettings["display"]>) =>
    onChange({ ...settings, display: { ...settings.display, ...patch } });
  const setForces = (patch: Partial<GraphSettings["forces"]>) =>
    onChange({ ...settings, forces: { ...settings.forces, ...patch } });

  return (
    <div className="flex w-72 flex-col rounded-lg border border-border bg-background shadow-dropdown">
      <div className="flex h-8 shrink-0 items-center justify-between gap-1 border-b border-border pl-3 pr-1">
        <span className="text-caption text-muted">Graph settings</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onReset}
            aria-label="Restore default settings"
            title="Restore default settings"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
              focusRing,
            )}
          >
            <RotateIcon />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close graph settings"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-icon transition-[background-color,scale] duration-100 hover:bg-interactive-hovered active:scale-95 motion-reduce:transition-none",
              focusRing,
            )}
          >
            <XIcon />
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-2 py-1">
        <Section
          id="graph-filters"
          label={GROUP_LABELS.filters}
          open={open === "filters"}
          onToggle={() => toggle("filters")}
        >
          <div
            className={cn(
              "mb-1 flex h-7 items-center gap-2 rounded-md border border-border px-2",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
            )}
          >
            <SearchIcon className="shrink-0 text-icon" />
            <input
              type="text"
              value={settings.filters.query}
              onChange={(event) => setFilters({ query: event.target.value })}
              placeholder="Search files"
              aria-label="Filter the graph"
              className="w-full min-w-0 bg-transparent text-caption text-gray-12 placeholder:text-placeholder focus:outline-none"
            />
          </div>
          <ToggleRow
            label="Notes"
            hint="Pages written by agents"
            checked={settings.filters.showNotes}
            onChange={() => setFilters({ showNotes: !settings.filters.showNotes })}
          />
          <ToggleRow
            label="Sources"
            hint="Imported material"
            checked={settings.filters.showSources}
            onChange={() => setFilters({ showSources: !settings.filters.showSources })}
          />
          <ToggleRow
            label="Orphans"
            hint="Docs with no links"
            checked={settings.filters.showOrphans}
            onChange={() => setFilters({ showOrphans: !settings.filters.showOrphans })}
          />
          {/* Obsidian's label, inverted sense and all: on means hide. Keeping
              the shipped wording matters more than fixing it. */}
          <ToggleRow
            label="Existing docs only"
            hint="Hide links to docs that don't exist"
            checked={settings.filters.hideUnresolved}
            onChange={() => setFilters({ hideUnresolved: !settings.filters.hideUnresolved })}
          />
        </Section>

        <Section
          id="graph-color"
          label={GROUP_LABELS.color}
          open={open === "color"}
          onToggle={() => toggle("color")}
        >
          <div className="flex flex-wrap gap-1 py-1">
            {(Object.keys(COLOR_BY_LABELS) as ColorBy[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...settings, colorBy: option })}
                aria-pressed={settings.colorBy === option}
                className={cn(
                  "flex h-7 items-center rounded-full px-3 text-caption",
                  settings.colorBy === option
                    ? "bg-interactive-checked text-gray-12"
                    : "text-muted hover:bg-interactive-hovered",
                  focusRing,
                )}
              >
                {COLOR_BY_LABELS[option]}
              </button>
            ))}
          </div>
        </Section>

        <Section
          id="graph-display"
          label={GROUP_LABELS.display}
          open={open === "display"}
          onToggle={() => toggle("display")}
        >
          <ToggleRow
            label="Arrows"
            hint="Show link direction when zoomed in"
            checked={settings.display.arrows}
            onChange={() => setDisplay({ arrows: !settings.display.arrows })}
          />
          <ToggleRow
            label="Relation labels"
            hint="Name the link under the cursor"
            checked={settings.display.edgeLabels}
            onChange={() => setDisplay({ edgeLabels: !settings.display.edgeLabels })}
          />
          <Slider
            label="Text fade"
            value={settings.display.textFade}
            {...DISPLAY_RANGES.textFade}
            format={(v) => v.toFixed(1)}
            onChange={(textFade) => setDisplay({ textFade })}
          />
          <Slider
            label="Node size"
            value={settings.display.nodeSize}
            {...DISPLAY_RANGES.nodeSize}
            format={(v) => v.toFixed(1)}
            onChange={(nodeSize) => setDisplay({ nodeSize })}
          />
          <Slider
            label="Link thickness"
            value={settings.display.linkThickness}
            {...DISPLAY_RANGES.linkThickness}
            format={(v) => v.toFixed(1)}
            onChange={(linkThickness) => setDisplay({ linkThickness })}
          />
        </Section>

        <Section
          id="graph-forces"
          label={GROUP_LABELS.forces}
          open={open === "forces"}
          onToggle={() => toggle("forces")}
        >
          <Slider
            label="Center force"
            value={settings.forces.center}
            {...FORCE_RANGES.center}
            format={(v) => v.toFixed(2)}
            onChange={(center) => setForces({ center })}
          />
          <Slider
            label="Repel force"
            value={settings.forces.repel}
            {...FORCE_RANGES.repel}
            format={(v) => v.toFixed(1)}
            onChange={(repel) => setForces({ repel })}
          />
          <Slider
            label="Link force"
            value={settings.forces.linkForce}
            {...FORCE_RANGES.linkForce}
            format={(v) => v.toFixed(2)}
            onChange={(linkForce) => setForces({ linkForce })}
          />
          <Slider
            label="Link distance"
            value={settings.forces.linkDistance}
            {...FORCE_RANGES.linkDistance}
            format={(v) => String(Math.round(v))}
            onChange={(linkDistance) => setForces({ linkDistance })}
          />
        </Section>
      </div>
    </div>
  );
}

export { DEFAULT_SETTINGS };
