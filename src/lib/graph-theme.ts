// Canvas cannot resolve CSS custom properties, so the handful of design tokens
// the graph paints with are read off the document once and cached. Reading them
// (rather than hardcoding hex) keeps globals.css the single source of truth —
// change a gray there and the graph follows.

import { FRESHNESS_RING } from "./doc-freshness";

export type GraphTheme = {
  background: string;
  link: string;
  linkStrong: string;
  label: string;
  ink: string; // gray-12 — hover fill, focus rings, the "accent" role
  muted: string;
  faint: string;
  stale: string;
  forced: boolean;
};

const FALLBACK: GraphTheme = {
  background: "#ffffff",
  link: "#e0e1e6", // gray-5
  linkStrong: "#1c2024", // gray-12
  label: "#60646c", // gray-11
  ink: "#1c2024", // gray-12
  muted: "#8b8d98", // gray-9
  faint: "#b9bbc6", // gray-8
  stale: FRESHNESS_RING,
  forced: false,
};

function read(styles: CSSStyleDeclaration, name: string, fallback: string) {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function readGraphTheme(): GraphTheme {
  if (typeof window === "undefined") return FALLBACK;

  // Forced-colors mode is invisible to canvas — it repaints the DOM but not our
  // pixels — so we detect it and repaint with system colors instead. Without
  // this the graph stays a low-contrast gray wash in a high-contrast theme.
  if (window.matchMedia?.("(forced-colors: active)").matches) {
    return {
      background: "Canvas",
      link: "GrayText",
      linkStrong: "Highlight",
      label: "CanvasText",
      ink: "Highlight",
      muted: "GrayText",
      faint: "GrayText",
      stale: "CanvasText",
      forced: true,
    };
  }

  const styles = getComputedStyle(document.documentElement);
  return {
    background: read(styles, "--background", FALLBACK.background),
    link: read(styles, "--gray-5", FALLBACK.link),
    linkStrong: read(styles, "--gray-12", FALLBACK.linkStrong),
    label: read(styles, "--gray-11", FALLBACK.label),
    ink: read(styles, "--gray-12", FALLBACK.ink),
    muted: read(styles, "--gray-9", FALLBACK.muted),
    faint: read(styles, "--gray-8", FALLBACK.faint),
    stale: read(styles, "--amber-9", FALLBACK.stale),
    forced: false,
  };
}
