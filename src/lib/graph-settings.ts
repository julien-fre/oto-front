// The graph's settings, and how they survive a reload.
//
// Obsidian persists the same set to .obsidian/graph.json, debounced 2000ms;
// this mirrors that. Since the section went live (auth-gated, client-only
// rendering) the cookie is read back on the client — there is no server pass
// to keep in sync, and the graph mounts behind a loading state anyway.
//
// One deliberate difference: Obsidian also serialises the live zoom level on
// every zoom action, which is a well-documented cause of sync churn there. We
// do not persist the camera — only the settings.

import type { DisplaySettings } from "@/components/knowledge/graph-canvas";
import { DEFAULT_DISPLAY } from "@/components/knowledge/graph-canvas";
import { DEFAULT_FORCES, type ForceParams } from "./force-graph";
import { DEFAULT_FILTERS, type ColorBy, type GraphFilters } from "./knowledge-graph";

// v2: the flag slots changed meaning when the section went live (processes/
// connectors toggles became notes/sources) — a new key lets stale cookies
// fall back to the new defaults instead of silently hiding sources.
export const GRAPH_COOKIE = "oto_graph_v2";
export const DOC_RAIL_COOKIE = "oto_doc_rail"; // "open" | "closed"
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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
  colorBy: "branch",
  display: DEFAULT_DISPLAY,
  forces: DEFAULT_FORCES,
};

// Persisted as a compact positional string rather than JSON: it rides in a
// cookie on every request, and JSON in a cookie needs escaping that Next's
// store then has to undo.
// Positional flags, in panel order.
const ORDER = [
  "showNotes",
  "showSources",
  "showOrphans",
  "hideUnresolved",
  "arrows",
  "edgeLabels",
] as const;

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

const COLOR_BY_VALUES: ColorBy[] = ["branch", "type", "freshness", "none"];

export function serializeSettings(settings: GraphSettings): string {
  const flags = [
    settings.filters.showNotes,
    settings.filters.showSources,
    settings.filters.showOrphans,
    settings.filters.hideUnresolved,
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
      showNotes: bool(at("showNotes"), DEFAULT_FILTERS.showNotes),
      showSources: bool(at("showSources"), DEFAULT_FILTERS.showSources),
      showOrphans: bool(at("showOrphans"), DEFAULT_FILTERS.showOrphans),
      hideUnresolved: bool(at("hideUnresolved"), DEFAULT_FILTERS.hideUnresolved),
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

/** Client-only: writing cookies during render is illegal on the server. */
export function writeGraphCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
