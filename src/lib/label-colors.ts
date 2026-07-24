// Identity colors for tree rows and graph nodes — one dot color per item so
// siblings read as distinct (differentiation, not decoration). Ordered so
// consecutive hues contrast; assigned by position/id for now, user-assignable
// later like Notion page colors. Every value clears ~3:1 on the gray-2
// sidebar. Shared by the live knowledge section and the (still mock)
// processes list, so it lives on its own rather than in either's module.
export const LABEL_DOT_COLORS = [
  "#3e63dd", // indigo
  "#0d9488", // teal
  "#c2740a", // amber
  "#e93d82", // pink
  "#3d9a50", // grass
  "#0090ff", // blue
  "#ef5f00", // orange
  "#6e56cf", // violet
  "#ab4aba", // plum
] as const;
