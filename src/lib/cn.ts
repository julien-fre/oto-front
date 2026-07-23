export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

// The vertical rule that shows which rows belong to the group above them —
// shared by the sidebar's folder/section tree and anywhere else that nests
// items the same way. Lives outside any "use client" module: a plain string
// export from a client component file resolves to a server-reference stub
// (not the string) when imported into a Server Component.
export const treeGuide = "ml-3 border-l border-gray-5 pl-1";
