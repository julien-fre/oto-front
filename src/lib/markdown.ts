// Markdown → Block[]. The backend stores docs as markdown (`body_md`,
// oto-backend docs.py) and links them with [[Title]] wikilinks resolved at
// write time (oto-backend db/backlinks.py). This converter turns that into
// the typed block model the renderer already speaks — no dependency, and
// anything it doesn't recognise degrades to a plain paragraph rather than
// breaking the page.
//
// Coverage is deliberately the common-markdown subset a KB actually uses:
// headings, paragraphs, - / * / 1. lists, - [ ] checklists, > quotes,
// ``` fenced code, | pipe tables, --- dividers, and inline **bold**,
// *italic*, `code`, [label](href), and [[wikilinks]].

import type { Block, Span } from "./doc-blocks";

// The backend's exact wikilink pattern (db/backlinks.py:24) — non-greedy, no
// brackets or newline inside, bounded length.
const WIKILINK = /\[\[\s*([^\[\]\n]{1,200}?)\s*\]\]/g;

// Python's str.split() whitespace set, minus U+FEFF (which JS \s includes but
// Python does not treat as whitespace) plus U+0085 and U+001C–1F (which Python
// does and JS does not).
const PY_WHITESPACE = /[\t-\r \x1c-\x1f\x85\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g;

/** The backend's title normalisation (backlinks.py: collapse whitespace +
 *  casefold). JS has no casefold; toLowerCase plus the one Latin mapping that
 *  differs in practice (ß → ss) covers the real corpus. Truly exotic titles
 *  (Cherokee, ligatures beyond fi/fl) could still resolve differently than the
 *  server — accepted. */
export function normalizeTitle(title: string): string {
  return title
    .replace(PY_WHITESPACE, " ")
    .trim()
    .toLowerCase()
    .replace(/\u00df|\u1e9e/g, "ss");
}

/** All [[titles]] cited in a body, deduplicated on the normalised form. */
// Note: like the server, this scans the RAW body — a [[title]] inside a code
// span or fence still counts (backlinks.py does exactly the same). Whitespace-
// only titles are dropped, also like the server (`if t` guard).
export function extractWikilinks(bodyMd: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of bodyMd.matchAll(WIKILINK)) {
    const key = normalizeTitle(match[1]);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(match[1]);
  }
  return out;
}

/** Maps a wikilink title to a doc id, or null for a stub. */
export type TitleResolver = (title: string) => number | null;

// ── Inline spans ─────────────────────────────────────────────────────────────

// One token per alternative, tried in order at each position. Wikilinks first
// (they contain no nested markup), then code (its content is literal), then
// links, bold, italic.
const INLINE =
  /\[\[\s*([^\[\]\n]{1,200}?)\s*\]\]|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|(?<![\w])_([^_\n]+)_(?![\w])/g;

export function parseSpans(text: string, resolve: TitleResolver): Span[] {
  const spans: Span[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) spans.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const id = resolve(m[1]);
      spans.push(id != null ? { ref: String(id) } : { stub: m[1] });
    } else if (m[2] !== undefined) spans.push({ code: m[2] });
    else if (m[3] !== undefined) spans.push({ link: { href: m[4], label: m[3] } });
    else if (m[5] !== undefined) spans.push({ strong: m[5] });
    else if (m[6] !== undefined) spans.push({ em: m[6] });
    else if (m[7] !== undefined) spans.push({ em: m[7] });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push(text.slice(last));
  return spans.length > 0 ? spans : [""];
}

// ── Blocks ───────────────────────────────────────────────────────────────────

const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^```(.*)$/;
const DIVIDER = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;
const UL_ITEM = /^[-*+]\s+(.*)$/;
const CHECK_ITEM = /^[-*+]\s+\[([ xX])\]\s+(.*)$/;
const OL_ITEM = /^\d{1,3}[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const TABLE_ROW = /^\|(.+)$/;
// A separator row is pipes/dashes/colons only, with at least one pipe (so a
// bare --- stays a divider) and a dash run. Covers single-column tables and
// rows without the trailing pipe, like the GFM parsers do.
const TABLE_SEP = (line: string) =>
  /^[|\s:-]+$/.test(line) && line.includes("|") && /-{2,}/.test(line);

function splitTableRow(line: string): string[] {
  // Cells between pipes; escaped \| kept literal.
  return line
    .replace(/^\|/, "")
    .replace(/\|\s*$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

/**
 * Convert a markdown body to blocks. Heading levels compress into the two the
 * design system allows: # and ## → h2, deeper → h3 — a page's title lives in
 * the doc row, not the body, so body headings are always sections.
 */
export function markdownToBlocks(bodyMd: string, resolve: TitleResolver): Block[] {
  const lines = bodyMd.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "p", spans: parseSpans(paragraph.join(" "), resolve) });
    paragraph.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }

    const fence = trimmed.match(FENCE);
    if (fence) {
      flushParagraph();
      // Info strings can carry extras ("js title=x"); the language is the
      // first token. A backtick inside the info string is not a fence.
      const lang = fence[1].trim().split(/\s+/)[0] ?? "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence (or EOF)
      blocks.push({ type: "code", lang, text: body.join("\n") });
      continue;
    }

    const heading = trimmed.match(HEADING);
    if (heading) {
      flushParagraph();
      blocks.push({ type: heading[1].length <= 2 ? "h2" : "h3", text: heading[2].trim() });
      i++;
      continue;
    }

    if (DIVIDER.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    if (TABLE_ROW.test(trimmed) && i + 1 < lines.length && TABLE_SEP(lines[i + 1].trim())) {
      flushParagraph();
      const head = splitTableRow(trimmed);
      i += 2;
      const rows: Span[][][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i].trim())) {
        rows.push(splitTableRow(lines[i].trim()).map((cell) => parseSpans(cell, resolve)));
        i++;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    if (CHECK_ITEM.test(trimmed)) {
      flushParagraph();
      const items: { done: boolean; spans: Span[] }[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(CHECK_ITEM);
        if (!m) break;
        items.push({ done: m[1] !== " ", spans: parseSpans(m[2], resolve) });
        i++;
      }
      blocks.push({ type: "checklist", items });
      continue;
    }

    if (UL_ITEM.test(trimmed)) {
      flushParagraph();
      const items: Span[][] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(UL_ITEM);
        if (!m || CHECK_ITEM.test(lines[i].trim())) break;
        items.push(parseSpans(m[1], resolve));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (OL_ITEM.test(trimmed)) {
      flushParagraph();
      const items: Span[][] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(OL_ITEM);
        if (!m) break;
        items.push(parseSpans(m[1], resolve));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (QUOTE.test(trimmed)) {
      flushParagraph();
      const quoted: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(QUOTE);
        if (!m) break;
        quoted.push(m[1]);
        i++;
      }
      blocks.push({ type: "quote", spans: parseSpans(quoted.join(" "), resolve) });
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }

  flushParagraph();
  return blocks;
}
