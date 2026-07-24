// The processes graph's settings, and how they survive a reload. Mirrors
// graph-settings.ts's mechanism exactly (see that file's own header for the
// Obsidian-parity reasoning); this domain's filter set is smaller — no
// "branch"/"freshness" dimension, no unresolved-node concept — so the
// serialized shape is shorter, not because the mechanism differs.

import type { DisplaySettings } from "@/components/knowledge/graph-canvas";
import { DEFAULT_DISPLAY } from "@/components/knowledge/graph-canvas";
import { COOKIE_MAX_AGE, writeGraphCookie } from "./graph-settings";
import { DEFAULT_FORCES, type ForceParams } from "./force-graph";
import { DEFAULT_FILTERS, type ColorBy, type GraphFilters } from "./processes-graph";

export const GRAPH_COOKIE = "oto_processes_graph_v1";
export { writeGraphCookie };

export type GraphSettings = {
  filters: GraphFilters;
  colorBy: ColorBy;
  display: DisplaySettings;
  forces: ForceParams;
};

export const DEFAULT_SETTINGS: GraphSettings = {
  // The search term is deliberately not part of the defaults that persist —
  // reopening the graph still filtered by a query you typed last week is
  // disorienting, and it is the one setting with no visible control at rest.
  filters: DEFAULT_FILTERS,
  colorBy: "type",
  display: DEFAULT_DISPLAY,
  forces: DEFAULT_FORCES,
};

// Positional flags, in panel order.
const ORDER = ["showProcesses", "showConnectors", "showOrphans", "arrows", "edgeLabels"] as const;

function bool(value: string | undefined, fallback: boolean) {
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

function num(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = value ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const COLOR_BY_VALUES: ColorBy[] = ["type", "none"];

export function serializeSettings(settings: GraphSettings): string {
  const flags = [
    settings.filters.showProcesses,
    settings.filters.showConnectors,
    settings.filters.showOrphans,
    settings.display.arrows,
    settings.display.edgeLabels,
  ]
    .map((on) => (on ? "1" : "0"))
    .join("");

  return [
    flags,
    settings.colorBy,
    settings.display.textFade,
    settings.display.nodeSize,
    settings.display.linkThickness,
    settings.forces.center,
    settings.forces.repel,
    settings.forces.linkForce,
    settings.forces.linkDistance,
  ].join("~");
}

export function parseSettings(raw: string | undefined): GraphSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const parts = raw.split("~");
  const flags = parts[0] ?? "";
  const at = (name: (typeof ORDER)[number]) => flags[ORDER.indexOf(name)];
  const colorBy = COLOR_BY_VALUES.includes(parts[1] as ColorBy)
    ? (parts[1] as ColorBy)
    : DEFAULT_SETTINGS.colorBy;

  return {
    filters: {
      query: "",
      showProcesses: bool(at("showProcesses"), DEFAULT_FILTERS.showProcesses),
      showConnectors: bool(at("showConnectors"), DEFAULT_FILTERS.showConnectors),
      showOrphans: bool(at("showOrphans"), DEFAULT_FILTERS.showOrphans),
    },
    colorBy,
    display: {
      arrows: bool(at("arrows"), DEFAULT_DISPLAY.arrows),
      edgeLabels: bool(at("edgeLabels"), DEFAULT_DISPLAY.edgeLabels),
      textFade: num(parts[2], DEFAULT_DISPLAY.textFade, -3, 3),
      nodeSize: num(parts[3], DEFAULT_DISPLAY.nodeSize, 0.1, 5),
      linkThickness: num(parts[4], DEFAULT_DISPLAY.linkThickness, 0.1, 5),
    },
    forces: {
      center: num(parts[5], DEFAULT_FORCES.center, 0, 1),
      repel: num(parts[6], DEFAULT_FORCES.repel, 0, 20),
      linkForce: num(parts[7], DEFAULT_FORCES.linkForce, 0, 1),
      linkDistance: num(parts[8], DEFAULT_FORCES.linkDistance, 30, 500),
    },
  };
}

export { COOKIE_MAX_AGE };
