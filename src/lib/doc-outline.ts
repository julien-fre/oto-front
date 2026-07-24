// Heading anchors, shared so every consumer of a heading id computes the
// same slug — the renderer stamps them, anything linking to a section reads
// them.

/** Stable anchor id for a heading. */
export function headingId(text: string) {
  return `h-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
