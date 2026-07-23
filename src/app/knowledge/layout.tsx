import type { Metadata } from "next";

// The pages under /knowledge are client components (they fetch from oto-mcp
// with the user's Logto token), and a client page can't export metadata —
// same arrangement as connectors/layout.tsx.
export const metadata: Metadata = { title: "Knowledge" };

export default function KnowledgeLayout({ children }: LayoutProps<"/knowledge">) {
  return children;
}
