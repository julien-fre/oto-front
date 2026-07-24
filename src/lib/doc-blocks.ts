// The document block model — what the renderer consumes. Produced from a
// backend doc's markdown body by src/lib/markdown.ts. Typed blocks rather
// than raw markdown at render time, so the renderer keeps total control over
// typography and the inline reference component.
//
// Moved out of mock-data.ts when the knowledge section went live against
// oto-backend (docs are `body_md` markdown rows there — see
// oto-backend/oto_mcp/capabilities/docs.py).

export type Span =
  | string
  | { ref: string } // resolved reference to another doc — the doc id, as a string
  | { stub: string } // a [[wikilink]] whose title matches no doc ("lien-souche")
  | { em: string }
  | { strong: string }
  | { code: string }
  | { link: { href: string; label: string } };

export type Block =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; spans: Span[] }
  | { type: "ul" | "ol"; items: Span[][] }
  | { type: "checklist"; items: { done: boolean; spans: Span[] }[] }
  | { type: "table"; head: string[]; rows: Span[][][] }
  | { type: "callout"; tone: "note" | "warn"; spans: Span[] }
  | { type: "code"; lang: string; text: string }
  | { type: "quote"; spans: Span[] }
  | { type: "divider" };
