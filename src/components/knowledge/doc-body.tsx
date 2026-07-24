import { Fragment } from "react";
import { CircleAlertIcon } from "@/components/icons";
import { ToolReference } from "@/components/tool-reference";
import { cn } from "@/lib/cn";
import { headingId } from "@/lib/doc-outline";
import type { Block, Span } from "@/lib/doc-blocks";
import { DocReference, StubReference } from "./doc-reference";

// Pure rendering over the typed block model (produced from the backend's
// markdown by src/lib/markdown.ts).
//
// Headings come out at text-body-medium rather than a larger size — hierarchy
// on a page comes from weight, colour and spacing, never from introducing a
// font size. The block scale is 12/13px, exactly like everything else.

export function DocSpans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <Fragment key={i}>{renderSpan(span)}</Fragment>
      ))}
    </>
  );
}

function renderSpan(span: Span) {
  if (typeof span === "string") return span;
  if ("ref" in span) return <DocReference docId={span.ref} />;
  if ("stub" in span) return <StubReference title={span.stub} />;
  if ("strong" in span) return <strong className="font-medium text-gray-12">{span.strong}</strong>;
  if ("em" in span) return <em className="italic">{span.em}</em>;
  if ("code" in span) return <ToolReference tool={span.code} />;
  return (
    <a
      href={span.link.href}
      className="text-gray-11 underline decoration-gray-7 underline-offset-2 hover:text-gray-12"
    >
      {span.link.label}
    </a>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 id={headingId(block.text)} className="mt-8 first:mt-0 scroll-mt-6 text-body-medium text-gray-12">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={headingId(block.text)} className="mt-6 first:mt-0 scroll-mt-6 text-body-medium text-gray-12">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="mt-3 first:mt-0 text-prose text-gray-12">
          <DocSpans spans={block.spans} />
        </p>
      );
    case "ul":
      return (
        <ul className="mt-3 first:mt-0 flex flex-col gap-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-prose text-gray-12">
              <span aria-hidden="true" className="shrink-0 text-gray-8">
                &bull;
              </span>
              <span className="min-w-0">
                <DocSpans spans={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-3 first:mt-0 flex flex-col gap-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-prose text-gray-12">
              <span aria-hidden="true" className="w-3 shrink-0 tabular-nums text-muted">
                {i + 1}.
              </span>
              <span className="min-w-0">
                <DocSpans spans={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "checklist":
      return (
        <ul className="mt-3 first:mt-0 flex flex-col gap-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-prose">
              {/* Presentational, not a real checkbox — this document view is
                  read-only, and an input here would promise an interaction
                  that does not exist. */}
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 flex size-3 shrink-0 items-center justify-center rounded-sm border",
                  item.done ? "border-gray-12 bg-gray-12 text-background" : "border-gray-6",
                )}
              >
                {item.done && (
                  <svg viewBox="0 0 12 12" className="size-2.5" fill="none" aria-hidden="true">
                    <path
                      d="m2.5 6 2.5 2.5 4.5-5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className={cn("min-w-0", item.done ? "text-muted" : "text-gray-12")}>
                <span className="sr-only">{item.done ? "Done: " : "Not done: "}</span>
                <DocSpans spans={item.spans} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "table":
      // Breaks out of the prose column to full width and scrolls on its own —
      // the page body must never scroll sideways because of a wide table.
      return (
        <div className="mt-4 first:mt-0 -mx-2 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse">
            <thead>
              <tr className="border-y border-gray-5">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="px-2 py-2 text-left align-top text-caption font-medium text-muted"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-5">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-2 align-top text-prose text-gray-12">
                      <DocSpans spans={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <div className="mt-4 first:mt-0 flex gap-2 rounded-lg bg-gray-2 p-3">
          <span
            className={cn("mt-0.5 shrink-0", block.tone === "warn" ? "text-amber-11" : "text-icon")}
          >
            <CircleAlertIcon />
          </span>
          <p className="min-w-0 text-prose text-gray-12">
            <span className="sr-only">{block.tone === "warn" ? "Warning: " : "Note: "}</span>
            <DocSpans spans={block.spans} />
          </p>
        </div>
      );
    case "code":
      return (
        <pre className="mt-4 first:mt-0 overflow-x-auto rounded-lg bg-gray-2 p-3">
          <code className="font-mono text-caption text-gray-12">{block.text}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote className="mt-4 first:mt-0 border-l-2 border-gray-6 pl-3 text-prose text-gray-11">
          <DocSpans spans={block.spans} />
        </blockquote>
      );
    case "divider":
      return <hr className="mt-6 first:mt-0 border-t border-border" />;
  }
}

export function DocBody({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
