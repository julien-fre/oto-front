import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Knowledge" };

export default function KnowledgePage() {
  return (
    <div className="px-12 py-6">
      <div className="divide-y divide-gray-5 border-y border-gray-5">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/knowledge/${doc.slug}`}
            className="flex items-baseline gap-4 px-2 py-2 transition-colors duration-100 hover:bg-gray-2 motion-reduce:transition-none"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-gray-12">{doc.title}</span>
              <span className="block truncate text-caption text-muted">{doc.excerpt}</span>
            </span>
            <span className="shrink-0 text-caption text-muted">
              Verified {doc.verifiedAt}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
