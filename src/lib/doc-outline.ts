// Outline helpers, deliberately in a module with no "use client" directive:
// the document body renders on the server and the rail renders on the client,
// and both need the same heading ids or the outline's anchors miss.

import type { Block } from "./mock-data";

export type Heading = { level: 2 | 3; text: string };

/** Stable anchor id for a heading, shared by the renderer and the outline. */
export function headingId(text: string) {
  return `h-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function headingsOf(blocks: Block[]): Heading[] {
  return blocks
    .filter((b): b is Extract<Block, { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({ level: b.type === "h2" ? (2 as const) : (3 as const), text: b.text }));
}
