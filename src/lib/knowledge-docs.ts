// The knowledge corpus. Split out of mock-data.ts purely for size — every
// consumer still imports from "@/lib/mock-data", which re-exports `docs` from
// here. The type import is erased at build time, so the two files do not form a
// runtime cycle.
//
// Shapes and content mirror the two real company-OS repos this product replaces
// (corma-company-os, second-brain), genericized: shallow (three folders, no
// nesting), small (a few dozen docs), dense with tables, and heavily
// cross-linked. Two links point at slugs that have no doc — `runbook-escalation`
// and `data-coverage-audit` — on purpose: they are the unresolved links the
// graph renders as phantom nodes and the outgoing-links list marks "Not created
// yet".

import type { Doc } from "./mock-data";

export const knowledgeDocs: Doc[] = [
  // ── Company ──────────────────────────────────────────────────────────────
  {
    slug: "context-brief",
    title: "Context brief",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 18, 2026",
    freshness: "fresh",
    excerpt: "Read this first: what the company sells, to whom, and where everything lives.",
    links: ["overview", "glossary", "people", "how-we-work", "gtm-architecture"],
    body: [
      {
        type: "p",
        spans: [
          "This is the first document any agent or teammate reads. It exists to make every later run correct by default: what we sell, who we sell it to, and which document wins when two disagree. Everything else in ",
          { strong: "Knowledge" },
          " hangs off this page.",
        ],
      },
      { type: "h2", text: "The one-paragraph version" },
      {
        type: "p",
        spans: [
          "Otomata builds Oto, an automation layer for small B2B teams: prospection, French company data, CRM, email, and a knowledge base that keeps agent runs grounded. We sell to founders and RevOps leads at 5–50 person companies, mostly in France. Full positioning is in ",
          { ref: "overview" },
          "; the buyer definition is in ",
          { ref: "icp" },
          ".",
        ],
      },
      { type: "h2", text: "Where everything lives" },
      {
        type: "table",
        head: ["Thing", "Home", "Owner"],
        rows: [
          [[{ strong: "Definitions and IDs" }], [{ ref: "glossary" }], ["Julien"]],
          [[{ strong: "Who does what" }], [{ ref: "people" }], ["Alessandro"]],
          [[{ strong: "How changes ship" }], [{ ref: "how-we-work" }], ["Julien"]],
          [[{ strong: "The GTM motion" }], [{ ref: "gtm-architecture" }], ["Alessandro"]],
          [[{ strong: "Tone and phrasing" }], [{ ref: "voice-guide" }], ["Julien"]],
        ],
      },
      { type: "h2", text: "Reading order" },
      {
        type: "ol",
        items: [
          ["This brief."],
          [{ ref: "overview" }, " — what we sell and to whom."],
          [{ ref: "glossary" }, " — the definitions that make a query correct."],
          [{ ref: "how-we-work" }, " — rituals, decision rules, how things ship."],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "If this document and a warehouse metric disagree, the warehouse wins. Source-of-truth routing is decided per-domain in ",
          { ref: "decision-source-of-truth" },
          " — never resolve a conflict by editing whichever page is easier to change.",
        ],
      },
      { type: "h2", text: "What good looks like" },
      {
        type: "p",
        spans: [
          "A new teammate should be able to answer ",
          { em: "“what do we sell, to whom, and who owns it”" },
          " after reading this page alone. An agent should be able to run a process without asking a clarifying question. If either fails, this page is wrong, not the reader.",
        ],
      },
    ],
  },
  {
    slug: "overview",
    title: "Overview",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 14, 2026",
    freshness: "fresh",
    excerpt: "What we sell, core capabilities, ICP criteria, and the buyer personas.",
    links: ["glossary", "icp", "pricing", "competitors"],
    body: [
      {
        type: "p",
        spans: [
          "Oto is the company brain: connectors to the tools a team already runs, processes that compose reusable skills, and a knowledge base that keeps both grounded. It is sold as one product, not a platform with modules.",
        ],
      },
      { type: "h2", text: "Core capabilities" },
      {
        type: "ul",
        items: [
          [{ strong: "Prospection" }, " — search, enrichment, deliverability, and outreach across a waterfall of providers. See ", { ref: "enrichment-waterfall" }, "."],
          [{ strong: "French company data" }, " — SIRENE, Légifrance, FINESS, cadastre, and the rest of the open-data surface. See ", { ref: "decision-french-first" }, "."],
          [{ strong: "CRM and comms" }, " — HubSpot, Folk, Attio, Slack, Google, hosted LinkedIn/WhatsApp."],
          [{ strong: "Knowledge" }, " — the docs an agent reads before it acts."],
        ],
      },
      { type: "h2", text: "Who buys" },
      {
        type: "p",
        spans: [
          "Founders and RevOps leads at 5–50 person B2B companies. The full definition, including the disqualifiers, is in ",
          { ref: "icp" },
          ". Packaging and price points are in ",
          { ref: "pricing" },
          ".",
        ],
      },
      { type: "h2", text: "Why we win" },
      {
        type: "p",
        spans: [
          "Two reasons, and they are the only two worth saying out loud: the French data coverage is genuinely deeper than the US-first tools, and the knowledge layer means an agent run is grounded in the customer's own definitions rather than a generic prompt. Everything else is table stakes — see ",
          { ref: "competitors" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "glossary",
    title: "Glossary",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jul 10, 2026",
    sourceOfTruth: "Warehouse · metric definitions win on conflict",
    freshness: "fresh",
    excerpt: "The definitions and IDs that make queries correct — metrics, events, and their traps.",
    links: ["data-model", "reporting-stack"],
    body: [
      {
        type: "p",
        spans: [
          "This page exists to disambiguate, not to educate. Every term here has been the subject of at least one wrong number. If a definition is missing, the correct move is to add it here, not to guess in a query.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        spans: [
          "The warehouse is the source of truth for every metric on this page. Where a dashboard disagrees, the dashboard is stale. See ",
          { ref: "decision-source-of-truth" },
          ".",
        ],
      },
      { type: "h2", text: "Metrics" },
      {
        type: "table",
        head: ["Term", "Definition", "The trap"],
        rows: [
          [
            [{ strong: "MRR" }],
            ["Sum of active subscription monthly value, excluding one-off services."],
            ["Billing shows gross, including services. Always route through the warehouse."],
          ],
          [
            [{ strong: "Active account" }],
            ["An org with ≥1 process run in the trailing 30 days."],
            ["Not “has a login”. Seat count and activity are unrelated."],
          ],
          [
            [{ strong: "Qualified lead" }],
            ["Matches ICP criteria and has a verified work email."],
            ["Enrichment can return a catch-all address; that is not verified. See ", { ref: "enrichment-waterfall" }, "."],
          ],
          [
            [{ strong: "Churn" }],
            ["Subscription ended, measured at period end, not at cancel-request time."],
            ["Cancel requests and churn differ by up to a month."],
          ],
        ],
      },
      { type: "h2", text: "Identifiers" },
      {
        type: "ul",
        items: [
          [{ code: "org_id" }, " — the Oto workspace. The only identifier that is stable forever."],
          [{ code: "siren" }, " / ", { code: "siret" }, " — French legal entity and establishment. A company has one ", { code: "siren" }, " and many ", { code: "siret" }, "."],
          [{ code: "connector_id" }, " — matches the id in the connectors registry, never the display name."],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "Never join on company name. Ever. Use ",
          { code: "siren" },
          " for French entities and the CRM's own id everywhere else — the full rule is in ",
          { ref: "data-model" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "people",
    title: "People",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 8, 2026",
    sourceOfTruth: "Notion · Teammate directory wins on conflict",
    freshness: "aging",
    excerpt: "Who does what, and who owns which connector and process.",
    links: ["how-we-work", "onboarding"],
    body: [
      {
        type: "p",
        spans: [
          "Ownership here means “the person who decides”, not “the person who does the work”. Every process, connector, and doc has exactly one owner.",
        ],
      },
      {
        type: "table",
        head: ["Person", "Owns", "Escalate to them for"],
        rows: [
          [
            [{ strong: "Alessandro" }],
            ["GTM processes, prospection connectors, company docs"],
            ["Positioning, pricing, anything customer-facing"],
          ],
          [
            [{ strong: "Julien" }],
            ["Ops processes, data and finance connectors, the wiki"],
            ["Data correctness, incidents, agent behavior"],
          ],
        ],
      },
      { type: "h2", text: "Rotation" },
      {
        type: "p",
        spans: [
          "There is no on-call rotation at two people — whoever owns the failing thing picks it up. When that stops being workable, ",
          { ref: "incident-response" },
          " gets a rotation section and this line goes away.",
        ],
      },
    ],
  },
  {
    slug: "how-we-work",
    title: "How we work",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jun 30, 2026",
    freshness: "aging",
    excerpt: "Rituals, decision rules, and how changes ship.",
    links: ["decision-auto-merge", "incident-response", "voice-guide"],
    body: [
      {
        type: "p",
        spans: [
          "Two people, no process theatre. The rules below exist because their absence cost us something specific, not because they are best practice.",
        ],
      },
      { type: "h2", text: "Decision rules" },
      {
        type: "ul",
        items: [
          ["The owner decides. Disagreement is resolved by the owner, not by consensus."],
          ["A decision that changes behavior gets a doc in ", { strong: "Decisions" }, ". A decision that does not, does not."],
          ["Reversible decisions ship immediately. Irreversible ones wait a day."],
        ],
      },
      { type: "h2", text: "How changes ship" },
      {
        type: "p",
        spans: [
          "Changes merge without review and a recap posts to Slack after the fact — the reasoning is in ",
          { ref: "decision-auto-merge" },
          ". When something breaks, ",
          { ref: "incident-response" },
          " takes over.",
        ],
      },
      { type: "h2", text: "Rituals" },
      {
        type: "table",
        head: ["When", "What", "Output"],
        rows: [
          [["Mon 09:00"], ["Weekly feedback report runs"], ["Report page, tickets, Slack recap"]],
          [["Daily 08:00"], ["Workspace health check"], ["Slack heartbeat"]],
          [["Friday"], ["Verify one stale doc"], ["An updated ", { strong: "Verified" }, " date"]],
        ],
      },
      {
        type: "quote",
        spans: [
          "If a document has not been verified this quarter, treat it as a rumor.",
        ],
      },
    ],
  },
  {
    slug: "voice-guide",
    title: "Voice guide",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jun 27, 2026",
    freshness: "aging",
    excerpt: "Tone, phrasing rules, and the words we never use.",
    links: ["outreach-playbook", "overview"],
    body: [
      {
        type: "p",
        spans: [
          "One voice across product copy, outreach, and support. Plain, specific, and short. The test: would you say this sentence out loud to a customer?",
        ],
      },
      { type: "h2", text: "Rules" },
      {
        type: "ul",
        items: [
          ["Sentence case everywhere. Never Title Case A Button."],
          ["Name the action with a verb and a noun: ", { code: "New process" }, ", not ", { code: "Create" }, "."],
          ["Errors say what happened and what to do next."],
          ["Numerals, curly quotes, the ellipsis character. No ", { em: "please" }, ", no superlatives."],
        ],
      },
      { type: "h2", text: "Words we do not use" },
      {
        type: "table",
        head: ["Never", "Instead", "Why"],
        rows: [
          [[{ code: "project" }], [{ code: "process" }], ["Product vocabulary — see ", { ref: "decision-processes-not-projects" }, "."]],
          [[{ code: "successfully" }], ["nothing"], ["“Contact deleted” is already the success message."]],
          [[{ code: "leverage" }, ", ", { code: "seamless" }], ["the plain word"], ["Marketing register, not ours."]],
        ],
      },
      {
        type: "p",
        spans: [
          "Outreach has its own constraints on top of these — see ",
          { ref: "outreach-playbook" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "icp",
    title: "ICP and segments",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 16, 2026",
    freshness: "fresh",
    excerpt: "Who we sell to, the qualifying signals, and the disqualifiers that save a week.",
    links: ["glossary", "lead-scoring", "competitors"],
    body: [
      {
        type: "p",
        spans: [
          "The ICP is a filter, not a description. Its job is to disqualify fast. A lead that fails any hard disqualifier below is dropped regardless of how good the rest of the fit looks.",
        ],
      },
      { type: "h2", text: "Qualifying" },
      {
        type: "table",
        head: ["Dimension", "Fits", "Weight"],
        rows: [
          [["Headcount"], ["5–50"], ["High"]],
          [["Geography"], ["France, then Benelux"], ["High"]],
          [["Motion"], ["Outbound-led B2B"], ["High"]],
          [["Stack"], ["Has a CRM already"], ["Medium"]],
          [["Trigger"], ["Hiring a first SDR or RevOps"], ["Medium"]],
        ],
      },
      { type: "h2", text: "Hard disqualifiers" },
      {
        type: "ul",
        items: [
          ["Under 5 people — no one owns the process."],
          ["Enterprise procurement — the sales cycle outlives the contract value."],
          ["No CRM and no intention of adopting one."],
        ],
      },
      {
        type: "p",
        spans: [
          "How these turn into a number is ",
          { ref: "lead-scoring" },
          "; the terms used here are defined in ",
          { ref: "glossary" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "pricing",
    title: "Pricing and packaging",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 12, 2026",
    freshness: "fresh",
    excerpt: "One plan, usage-based on runs, with bring-your-own keys as the default.",
    links: ["overview", "glossary"],
    body: [
      {
        type: "p",
        spans: [
          "One plan. Complexity in pricing costs more in explanation than it earns in revenue at this size.",
        ],
      },
      {
        type: "table",
        head: ["Component", "Price", "Notes"],
        rows: [
          [["Platform"], ["€290 / month"], ["Unlimited seats"]],
          [["Runs"], ["€0.40 / run"], ["A run is one process execution — see ", { ref: "glossary" }, "."]],
          [["Provider costs"], ["Passed through"], ["Bring-your-own keys by default"]],
        ],
      },
      {
        type: "callout",
        tone: "note",
        spans: [
          "Bring-your-own keys is a pricing decision as much as a security one — it keeps provider cost off our margin. See ",
          { ref: "decision-byo-keys" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "competitors",
    title: "Competitive landscape",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jun 24, 2026",
    freshness: "stale",
    excerpt: "Who we lose to, who we beat, and the two claims that actually move a deal.",
    links: ["overview", "icp"],
    body: [
      {
        type: "p",
        spans: [
          "Competitors are grouped by what the buyer was going to do instead, which is more useful than grouping by product category.",
        ],
      },
      {
        type: "table",
        head: ["Alternative", "We win when", "We lose when"],
        rows: [
          [["A US prospection suite"], ["French data matters"], ["The team is US-focused and already trained"]],
          [["An agency"], ["They want to own the motion"], ["They want it done for them"]],
          [["n8n / Make in-house"], ["No one wants to maintain it"], ["They have an engineer who enjoys it"]],
          [["Nothing"], ["A trigger exists"], ["No trigger — this is most losses"]],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "This page is past its review date. Treat the competitor list as directionally right and the specifics as unverified.",
        ],
      },
    ],
  },
  {
    slug: "security-posture",
    title: "Security posture",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jul 6, 2026",
    freshness: "aging",
    excerpt: "How credentials are stored, what agents can reach, and what we tell buyers.",
    links: ["decision-byo-keys", "connector-conventions", "incident-response"],
    body: [
      {
        type: "p",
        spans: [
          "The short version for a buyer: secrets live in an encrypted vault, agents reach only the namespaces a human enabled, and we hold as few provider keys as possible.",
        ],
      },
      { type: "h2", text: "Credentials" },
      {
        type: "ul",
        items: [
          ["Secrets are encrypted at rest and never returned by any read API."],
          ["Bring-your-own keys is the default, per ", { ref: "decision-byo-keys" }, "."],
          ["Personal-session connectors are scoped to the individual, never shared org-wide."],
        ],
      },
      { type: "h2", text: "Agent access" },
      {
        type: "p",
        spans: [
          "An agent can call a connector namespace only if it is explicitly enabled. The registry conventions that make this enforceable are in ",
          { ref: "connector-conventions" },
          ". When something is reached that should not have been, ",
          { ref: "incident-response" },
          " applies.",
        ],
      },
      {
        type: "checklist",
        items: [
          { done: true, spans: ["Encrypted secret vault"] },
          { done: true, spans: ["Per-namespace agent scoping"] },
          { done: true, spans: ["Audit trail on every run"] },
          { done: false, spans: ["SOC 2 — not started, not promised to anyone"] },
        ],
      },
    ],
  },

  // ── Wiki ─────────────────────────────────────────────────────────────────
  {
    slug: "gtm-architecture",
    title: "GTM architecture",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jun 20, 2026",
    freshness: "stale",
    excerpt: "The full motion from signal to campaign, as one diagram.",
    links: [
      "lead-scoring",
      "enrichment-waterfall",
      "outreach-playbook",
      "crm-hygiene",
      "reporting-stack",
    ],
    body: [
      {
        type: "p",
        spans: [
          "One motion, five stages, each owned by a process. This page is the map; each stage links to the runbook that operates it.",
        ],
      },
      {
        type: "table",
        head: ["Stage", "Process", "Detail"],
        rows: [
          [["1. Signal"], ["Competitor watch"], [{ ref: "icp" }]],
          [["2. Enrich"], ["Lead list builder"], [{ ref: "enrichment-waterfall" }]],
          [["3. Score"], ["Lead list builder"], [{ ref: "lead-scoring" }]],
          [["4. Reach"], ["Lead list builder"], [{ ref: "outreach-playbook" }]],
          [["5. Record"], ["Lead list builder"], [{ ref: "crm-hygiene" }]],
        ],
      },
      { type: "h2", text: "Where it breaks" },
      {
        type: "ul",
        items: [
          ["Stage 2 → 3: an unverified email scores as qualified. Guard is in ", { ref: "enrichment-waterfall" }, "."],
          ["Stage 5: a write-back without a stable id creates a duplicate. See ", { ref: "crm-hygiene" }, "."],
        ],
      },
      {
        type: "p",
        spans: [
          "Numbers for every stage come from ",
          { ref: "reporting-stack" },
          ", not from the tools' own dashboards.",
        ],
      },
    ],
  },
  {
    slug: "feedback-pipeline-runbook",
    title: "Feedback pipeline runbook and error handling",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jun 12, 2026",
    freshness: "stale",
    excerpt: "Why the pipeline exists, how each step works, and what to do when it fails.",
    links: ["glossary", "incident-response", "reporting-stack", "agent-runbook"],
    body: [
      {
        type: "p",
        spans: [
          "The weekly feedback report turns call transcripts into a report, tickets, and a Slack recap. It runs Monday 09:00. This page is what you read when it did not.",
        ],
      },
      { type: "h2", text: "Steps" },
      {
        type: "ol",
        items: [
          ["Pull the week's transcripts."],
          ["Extract bugs, feature asks, and sentiment."],
          ["Render the branded report."],
          ["File tickets for confirmed items."],
          ["Post the Slack recap."],
        ],
      },
      { type: "h2", text: "Failure modes" },
      {
        type: "table",
        head: ["Symptom", "Cause", "Fix"],
        rows: [
          [
            ["Empty report, no error"],
            ["No transcripts in range"],
            ["Expected on a quiet week. Confirm in the source before investigating."],
          ],
          [
            ["Report renders, tickets do not"],
            ["Tracker connector paused"],
            ["Re-activate it, then re-run step 4 alone."],
          ],
          [
            ["Duplicate tickets"],
            ["Re-run without clearing state"],
            ["Close the duplicates by hand. The idempotency fix is not shipped."],
          ],
          [
            ["Sentiment inverted"],
            ["Prompt drift"],
            ["Check the definitions in ", { ref: "glossary" }, " before touching the prompt."],
          ],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "Re-running the whole process to fix step 4 files every ticket twice. Re-run the failed step, not the process.",
        ],
      },
      { type: "h2", text: "Escalation" },
      {
        type: "p",
        spans: [
          "If two consecutive runs fail, it is an incident — follow ",
          { ref: "incident-response" },
          ". Agent-side debugging conventions are in ",
          { ref: "agent-runbook" },
          ".",
        ],
      },
      {
        type: "code",
        lang: "bash",
        text: "# re-run one step against last week's window\noto run weekly-feedback-report --step file-tickets --since 2026-07-13",
      },
    ],
  },
  {
    slug: "data-model",
    title: "Data model",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 4, 2026",
    freshness: "aging",
    excerpt: "The entities, the identifiers that join them, and the joins that are forbidden.",
    links: ["glossary", "crm-hygiene", "decision-source-of-truth"],
    body: [
      {
        type: "p",
        spans: [
          "Four entities carry everything: org, company, person, run. Anything else is a view over these.",
        ],
      },
      {
        type: "table",
        head: ["Entity", "Key", "Joins to"],
        rows: [
          [[{ code: "org" }], [{ code: "org_id" }], ["Everything. The tenant boundary."]],
          [[{ code: "company" }], [{ code: "siren" }, " (FR) or CRM id"], [{ code: "person" }, ", ", { code: "run" }]],
          [[{ code: "person" }], ["verified email"], [{ code: "company" }]],
          [[{ code: "run" }], [{ code: "run_id" }], ["process, connector set, outputs"]],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "Forbidden joins: company name to company name, and unverified email to person. Both produce silently wrong counts rather than errors — which is why they are the two that keep happening. Definitions in ",
          { ref: "glossary" },
          ".",
        ],
      },
      {
        type: "p",
        spans: [
          "Which system wins per entity is decided in ",
          { ref: "decision-source-of-truth" },
          ". The CRM-side consequences are in ",
          { ref: "crm-hygiene" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "connector-conventions",
    title: "Connector conventions",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 9, 2026",
    freshness: "fresh",
    excerpt: "Naming, namespaces, auth modes, and the state model every connector follows.",
    links: ["decision-byo-keys", "agent-runbook", "security-posture"],
    body: [
      {
        type: "p",
        spans: [
          "Every connector in the registry follows the same shape, so an agent can reason about one it has never seen.",
        ],
      },
      { type: "h2", text: "The state model" },
      {
        type: "table",
        head: ["State", "Means", "Agent can call it"],
        rows: [
          [[{ code: "not_selected" }], ["Never installed"], ["No"]],
          [[{ code: "paused" }], ["Installed, hidden from agents"], ["No"]],
          [[{ code: "active" }], ["Installed and in use"], ["Yes, for enabled namespaces only"]],
        ],
      },
      { type: "h2", text: "Rules" },
      {
        type: "ul",
        items: [
          [{ code: "id" }, " is lowercase, no punctuation, and never changes. The display name may."],
          ["Namespaces are the unit of agent permission, not the connector."],
          ["Auth modes are ", { code: "byo_org" }, ", ", { code: "byo_user" }, ", ", { code: "platform" }, " — default to bring-your-own per ", { ref: "decision-byo-keys" }, "."],
          ["A connector with ", { code: "personal_session" }, " is scoped to one person. Never share it org-wide — see ", { ref: "security-posture" }, "."],
        ],
      },
      {
        type: "code",
        lang: "json",
        text: '{\n  "id": "hunter",\n  "namespaces": ["hunter"],\n  "auth_modes": ["byo_org", "byo_user", "platform"],\n  "secret_kind": "api_key",\n  "personal_session": false\n}',
      },
    ],
  },
  {
    slug: "agent-runbook",
    title: "Agent runbook",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 15, 2026",
    freshness: "fresh",
    excerpt: "What an agent reads before a run, how it reports failure, and what it must never do.",
    links: ["glossary", "how-we-work", "connector-conventions", "incident-response"],
    body: [
      {
        type: "p",
        spans: [
          "Knowledge exists to make agent runs correct. This page is the contract between the two.",
        ],
      },
      { type: "h2", text: "Before a run" },
      {
        type: "ol",
        items: [
          ["Read ", { ref: "context-brief" }, "."],
          ["Read ", { ref: "glossary" }, " for any term in the brief you will act on."],
          ["Read the process's own runbook."],
          ["Confirm every connector it needs is ", { code: "active" }, "."],
        ],
      },
      { type: "h2", text: "Never" },
      {
        type: "ul",
        items: [
          ["Guess a definition. If it is not in ", { ref: "glossary" }, ", stop and ask."],
          ["Call a paused connector, or a namespace that is not enabled."],
          ["Resolve a source-of-truth conflict on its own judgment."],
          ["Fail silently. A run that produced nothing must say so."],
        ],
      },
      {
        type: "callout",
        tone: "note",
        spans: [
          "A missing capability is a signal, not a dead end: report the gap rather than working around it. That is how the registry learns what to add — same principle as ",
          { ref: "how-we-work" },
          "'s rule that reversible things ship immediately.",
        ],
      },
    ],
  },
  {
    slug: "reporting-stack",
    title: "Reporting stack",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 2, 2026",
    freshness: "aging",
    excerpt: "Where every number comes from, and why the tools' own dashboards are not it.",
    links: ["data-model", "glossary", "decision-source-of-truth"],
    body: [
      {
        type: "p",
        spans: [
          "One warehouse, one set of definitions, one place a number can come from. Tool dashboards are for operating the tool, never for reporting.",
        ],
      },
      {
        type: "table",
        head: ["Question", "Ask", "Never ask"],
        rows: [
          [["MRR"], ["Warehouse"], ["Billing dashboard"]],
          [["Active accounts"], ["Warehouse"], ["Seat count"]],
          [["Pipeline"], ["CRM, via the warehouse mirror"], ["CRM UI"]],
          [["Deliverability"], ["Provider, direct"], ["— it is the only exception"]],
        ],
      },
      {
        type: "p",
        spans: [
          "Definitions live in ",
          { ref: "glossary" },
          "; the joins that make them computable are in ",
          { ref: "data-model" },
          "; the routing rule is ",
          { ref: "decision-source-of-truth" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "onboarding",
    title: "Onboarding a new teammate",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jul 17, 2026",
    freshness: "fresh",
    excerpt: "Day one to first shipped change, as a checklist.",
    links: ["context-brief", "how-we-work", "people", "agent-runbook", "voice-guide"],
    body: [
      {
        type: "p",
        spans: [
          "The goal is a shipped change by day three. Reading comes before access, because access without context is how the first incident happens.",
        ],
      },
      { type: "h2", text: "Day one — read" },
      {
        type: "checklist",
        items: [
          { done: true, spans: [{ ref: "context-brief" }] },
          { done: true, spans: [{ ref: "how-we-work" }] },
          { done: true, spans: [{ ref: "people" }, " — know who decides what"] },
          { done: false, spans: [{ ref: "voice-guide" }, " — before writing anything customer-facing"] },
          { done: false, spans: [{ ref: "agent-runbook" }, " — before running a process"] },
        ],
      },
      { type: "h2", text: "Day two — access" },
      {
        type: "ul",
        items: [
          ["Workspace, with your own keys where the connector supports it."],
          ["Read-only on the warehouse until you have shipped once."],
        ],
      },
      { type: "h2", text: "Day three — ship" },
      {
        type: "p",
        spans: [
          "Pick a doc that is past its verify date and fix it. It is a real change, it is reversible, and it teaches the corpus faster than reading it twice.",
        ],
      },
    ],
  },
  {
    slug: "incident-response",
    title: "Incident response",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 11, 2026",
    freshness: "fresh",
    excerpt: "What counts as an incident, who picks it up, and what gets written down after.",
    links: ["people", "agent-runbook", "runbook-escalation"],
    body: [
      {
        type: "p",
        spans: [
          "An incident is: customer data was wrong, customer data was exposed, or a process failed twice in a row. Everything else is a bug.",
        ],
      },
      { type: "h2", text: "The four steps" },
      {
        type: "ol",
        items: [
          [{ strong: "Stop the bleeding" }, " — pause the process or the connector. Do not debug first."],
          [{ strong: "Say it out loud" }, " — post in Slack, even at 2am, even if you are about to fix it."],
          [{ strong: "Fix" }, " — the owner in ", { ref: "people" }, " leads."],
          [{ strong: "Write it down" }, " — a decision doc if behavior changes, a runbook line if it does not."],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "Pausing a connector stops every process that uses it, not just the failing one. Check the usage list before you pause.",
        ],
      },
      {
        type: "p",
        spans: [
          "Agent-specific failure conventions are in ",
          { ref: "agent-runbook" },
          ". The escalation ladder for customer-impacting incidents is still unwritten: ",
          { ref: "runbook-escalation" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "lead-scoring",
    title: "Lead scoring rubric",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jul 13, 2026",
    freshness: "fresh",
    excerpt: "How ICP criteria become a number, and what each band means for the next action.",
    links: ["icp", "glossary", "enrichment-waterfall"],
    body: [
      {
        type: "p",
        spans: [
          "The score exists to order a list, not to make a decision. A high score with no trigger is still a bad first email.",
        ],
      },
      {
        type: "table",
        head: ["Signal", "Points", "Source"],
        rows: [
          [["Headcount 5–50"], ["30"], ["Enrichment"]],
          [["France"], ["25"], ["SIRENE"]],
          [["Has a CRM"], ["20"], ["Tech stack detection"]],
          [["Hiring SDR / RevOps"], ["15"], ["Job postings"]],
          [["Verified work email"], ["10"], [{ ref: "enrichment-waterfall" }]],
        ],
      },
      {
        type: "table",
        head: ["Band", "Score", "Next action"],
        rows: [
          [["A"], ["80+"], ["Personalized first touch"]],
          [["B"], ["55–79"], ["Sequence"]],
          [["C"], ["< 55"], ["Do not contact"]],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "A catch-all address is not a verified email and must not earn its 10 points. This is the single most common scoring bug — the definition is in ",
          { ref: "glossary" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "outreach-playbook",
    title: "Outreach playbook",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jul 7, 2026",
    freshness: "aging",
    excerpt: "Sequence shape, personalization budget, and the rules that keep a domain deliverable.",
    links: ["voice-guide", "icp", "crm-hygiene"],
    body: [
      {
        type: "p",
        spans: [
          "Three touches, one channel to start, and a real reason for the first email. Volume is capped by deliverability, not by ambition.",
        ],
      },
      { type: "h2", text: "Sequence" },
      {
        type: "table",
        head: ["Touch", "Day", "Shape"],
        rows: [
          [["1"], ["0"], ["The trigger, one line on it, one question"]],
          [["2"], ["4"], ["A concrete example, no re-pitch"]],
          [["3"], ["11"], ["Close the loop, offer to stop"]],
        ],
      },
      { type: "h2", text: "Hard limits" },
      {
        type: "ul",
        items: [
          ["50 sends per domain per day. No exceptions for a good week."],
          ["Never contact band C — see ", { ref: "lead-scoring" }, "."],
          ["Copy follows ", { ref: "voice-guide" }, ". No exclamation marks, no ", { em: "quick question" }, "."],
        ],
      },
      {
        type: "p",
        spans: [
          "Every reply is written back to the CRM the same day, per ",
          { ref: "crm-hygiene" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "enrichment-waterfall",
    title: "Enrichment waterfall",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jul 5, 2026",
    freshness: "aging",
    excerpt: "Provider order, stop conditions, and what counts as verified.",
    links: ["connector-conventions", "data-model", "lead-scoring"],
    body: [
      {
        type: "p",
        spans: [
          "Providers are tried in cost order, not accuracy order, and the waterfall stops at the first verified result. Trying every provider on every contact is how the enrichment bill triples.",
        ],
      },
      {
        type: "table",
        head: ["Order", "Provider", "Stop when"],
        rows: [
          [["1"], ["Hunter"], ["Verified, deliverable"]],
          [["2"], ["FullEnrich"], ["Verified, deliverable"]],
          [["3"], ["Kaspr"], ["Verified, deliverable"]],
          [["4"], ["ZeroBounce"], ["Verification only — never a source"]],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          { strong: "Verified" },
          " means deliverable and not a catch-all. A catch-all result ends the waterfall as a ",
          { em: "failure" },
          ", not a success — otherwise it flows into ",
          { ref: "lead-scoring" },
          " as a qualified lead.",
        ],
      },
      {
        type: "p",
        spans: [
          "Results are written against the identifiers in ",
          { ref: "data-model" },
          ". Provider registration follows ",
          { ref: "connector-conventions" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "crm-hygiene",
    title: "CRM hygiene",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jun 18, 2026",
    freshness: "stale",
    excerpt: "Write-back rules, duplicate prevention, and the fields an agent may touch.",
    links: ["data-model", "decision-source-of-truth", "glossary"],
    body: [
      {
        type: "p",
        spans: [
          "The CRM is an output, not a database. Anything an agent writes must be reconstructible from a run.",
        ],
      },
      { type: "h2", text: "Write-back rules" },
      {
        type: "ul",
        items: [
          ["Match on the CRM's own id, never on name or email. See ", { ref: "data-model" }, "."],
          ["Agents may write enrichment fields and notes. Never stage, owner, or amount."],
          ["Every agent-written note carries its ", { code: "run_id" }, "."],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "This page is past its review date, and the field list has drifted at least once since. Confirm against the CRM before relying on the ",
          { em: "may write" },
          " list.",
        ],
      },
    ],
  },

  // ── Decisions ────────────────────────────────────────────────────────────
  {
    slug: "decision-auto-merge",
    title: "Decision: auto-merge with recap",
    category: "decisions",
    owner: "Alessandro",
    verifiedAt: "Jul 20, 2026",
    freshness: "fresh",
    excerpt: "Changes merge without review; a recap posts to Slack after the fact.",
    links: ["how-we-work"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "Changes merge without review. A recap posts to Slack after the fact, and anyone can revert without discussion.",
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "p",
        spans: [
          "At two people, review was a queue, not a quality gate — the reviewer was always the person who already knew about the change. The recap preserves the only thing review was actually delivering: awareness.",
        ],
      },
      { type: "h2", text: "What would reverse it" },
      {
        type: "p",
        spans: [
          "A third person, or one revert that costs more than an hour. Revisit alongside ",
          { ref: "how-we-work" },
          " when either happens.",
        ],
      },
    ],
  },
  {
    slug: "decision-no-shared-package",
    title: "Decision: no shared package",
    category: "decisions",
    owner: "Julien",
    verifiedAt: "Jul 19, 2026",
    freshness: "fresh",
    excerpt: "Skills are copied between processes rather than extracted into a library.",
    links: ["agent-runbook", "decision-processes-not-projects"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "Common code is copied between processes. There is no shared package, and there will not be one until the same skill appears in six processes unchanged.",
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "p",
        spans: [
          "The observed cost of duplication so far is a few hours of re-editing. The observed cost of a shared package elsewhere was every process breaking together. Duplication is the cheaper failure at this size.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        spans: [
          "This is the pain Oto's reusable-skills model is meant to solve for customers — a process is a bundle of skills precisely so they do not face this trade-off. See ",
          { ref: "decision-processes-not-projects" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "decision-source-of-truth",
    title: "Decision: source-of-truth routing",
    category: "decisions",
    owner: "Julien",
    verifiedAt: "Jul 21, 2026",
    freshness: "fresh",
    excerpt: "Every domain names one winning system, and docs carry the pointer.",
    links: ["glossary", "data-model", "people"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "Each domain names exactly one system that wins on conflict, and every doc that touches that domain carries the pointer in its ",
          { strong: "Source of truth" },
          " property.",
        ],
      },
      {
        type: "table",
        head: ["Domain", "Wins", "Loses"],
        rows: [
          [["Metrics"], ["Warehouse"], ["Every dashboard"]],
          [["People and roles"], ["Notion directory"], ["This corpus"]],
          [["Company identity (FR)"], ["SIRENE"], ["CRM records"]],
          [["Pipeline"], ["CRM"], ["Spreadsheets"]],
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "p",
        spans: [
          "Conflicts were being resolved by editing whichever page was easier to change, which meant the wrong number won roughly half the time. Naming the winner in advance removes the judgment call. Definitions in ",
          { ref: "glossary" },
          ", joins in ",
          { ref: "data-model" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "decision-processes-not-projects",
    title: "Decision: processes, not projects",
    category: "decisions",
    owner: "Alessandro",
    verifiedAt: "Jul 20, 2026",
    freshness: "fresh",
    excerpt: "The product vocabulary is “process” everywhere — in the UI, the types, and the docs.",
    links: ["how-we-work", "overview"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "The unit of automation is a ",
          { strong: "process" },
          ", never a “project”. This holds in UI labels, type names, identifiers, and documentation. Skills are parts of a process and never appear as a top-level concept.",
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "p",
        spans: [
          "“Project” implies a thing that ends. These run on a schedule, forever, and are owned rather than completed. The word was also already taken by every project-management tool a buyer has open in another tab. See ",
          { ref: "voice-guide" },
          " for the enforcement rule.",
        ],
      },
    ],
  },
  {
    slug: "decision-byo-keys",
    title: "Decision: bring-your-own keys by default",
    category: "decisions",
    owner: "Julien",
    verifiedAt: "Jul 19, 2026",
    freshness: "fresh",
    excerpt: "Customers supply their own provider credentials unless there is a reason not to.",
    links: ["security-posture", "connector-conventions", "pricing"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "Connectors default to ",
          { code: "byo_org" },
          " or ",
          { code: "byo_user" },
          ". A platform-provided key is the exception and needs a stated reason.",
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "ul",
        items: [
          [{ strong: "Margin" }, " — provider cost stays off our books. See ", { ref: "pricing" }, "."],
          [{ strong: "Blast radius" }, " — we hold fewer credentials worth stealing. See ", { ref: "security-posture" }, "."],
          [{ strong: "Rate limits" }, " — a heavy customer cannot exhaust everyone else's quota."],
        ],
      },
      {
        type: "p",
        spans: [
          "The registry fields that express this are documented in ",
          { ref: "connector-conventions" },
          ".",
        ],
      },
    ],
  },
  {
    slug: "decision-french-first",
    title: "Decision: France-first data coverage",
    category: "decisions",
    owner: "Alessandro",
    verifiedAt: "Jun 22, 2026",
    freshness: "stale",
    excerpt: "Depth on French open data beats breadth across Europe.",
    links: ["icp", "competitors", "data-coverage-audit"],
    body: [
      { type: "h2", text: "Decision" },
      {
        type: "p",
        spans: [
          "We go deep on French open data — SIRENE, Légifrance, FINESS, cadastre, urbanisme — before adding a second country. Greece and the European registries stay shallow.",
        ],
      },
      { type: "h2", text: "Why" },
      {
        type: "p",
        spans: [
          "Depth is the only claim that wins against a US suite, and it is the one thing they will not copy for a market this size. Breadth would make us a worse version of them everywhere. See ",
          { ref: "competitors" },
          " and ",
          { ref: "icp" },
          ".",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        spans: [
          "Past its review date, and the second-country question is now live. The coverage audit that should inform it does not exist yet: ",
          { ref: "data-coverage-audit" },
          ".",
        ],
      },
    ],
  },
];
