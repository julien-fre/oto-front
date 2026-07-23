// Heading anchors, in a module with no "use client" directive: the document
// body renders on the server, and any client code linking to a heading needs
// the same id or the anchor misses.

/** Stable anchor id for a heading. */
export function headingId(text: string) {
  return `h-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
