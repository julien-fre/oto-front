"use client";

import Markdown from "markdown-to-jsx";
import { useProcessData } from "@/components/process-context";
import { ToolReference } from "@/components/tool-reference";

// A raw markdown string (body_md) instead of the hand-authored typed Block[]
// shape DocBody renders — see the connect-processes-to-backend plan for why
// this is a second, lighter rendering path rather than a md→Block[] parser.
// Element overrides mirror DocBody's classes so real and mock content still
// look identical at a glance.
function InlineCode({ children }: { children: React.ReactNode }) {
  return <ToolReference tool={String(children)} />;
}

const markdownOptions = {
  overrides: {
    h2: { props: { className: "mt-8 first:mt-0 scroll-mt-6 text-body-medium text-gray-12" } },
    h3: { props: { className: "mt-6 first:mt-0 scroll-mt-6 text-body-medium text-gray-12" } },
    p: { props: { className: "mt-3 first:mt-0 text-prose text-gray-12" } },
    ul: {
      props: {
        className: "mt-3 first:mt-0 flex flex-col gap-1 list-disc list-inside marker:text-gray-8",
      },
    },
    ol: {
      props: {
        className:
          "mt-3 first:mt-0 flex flex-col gap-1 list-decimal list-inside marker:text-muted marker:tabular-nums",
      },
    },
    li: { props: { className: "text-prose text-gray-12" } },
    strong: { props: { className: "font-medium text-gray-12" } },
    em: { props: { className: "italic" } },
    a: {
      props: {
        className: "text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12",
      },
    },
    blockquote: {
      props: { className: "mt-4 first:mt-0 border-l-2 border-gray-6 pl-3 text-prose text-gray-11" },
    },
    hr: { props: { className: "mt-6 first:mt-0 border-t border-border" } },
    code: { component: InlineCode },
  },
};

export default function ProcessOverviewPage() {
  const process = useProcessData();

  return (
    <div className="max-w-prose">
      {process.bodyMd ? (
        <Markdown options={markdownOptions}>{process.bodyMd}</Markdown>
      ) : (
        <p className="text-body text-gray-11">{process.description}</p>
      )}
    </div>
  );
}
