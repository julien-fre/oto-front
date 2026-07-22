// Mock content shared by the sidebar and the placeholder pages until the
// back end is integrated. The shapes mirror the two real company-OS repos
// this product replaces (corma-company-os, second-brain), genericized:
// docs carry owner + verified date + source-of-truth pointers, processes have
// a lifecycle + schedule and are composed of skills reused across processes,
// connectors have a status/condition state model. Dates are preformatted
// display strings so server and client can never disagree on locale.

export type Doc = {
  slug: string;
  title: string;
  category: "company" | "wiki" | "decisions";
  owner: string;
  verifiedAt: string;
  sourceOfTruth?: string;
  excerpt: string;
  links: string[]; // slugs of related docs
};

export type Skill = {
  id: string;
  name: string;
  description: string;
};

export type Process = {
  slug: string;
  name: string;
  description: string;
  status: "draft" | "active" | "deprecated";
  kind: "deliverable" | "ops";
  owner: string;
  schedule: string | null; // null = manual / on demand
  skillIds: string[];
  connectorIds: string[];
  outputs: string[];
};

export type Connector = {
  id: string;
  name: string;
  description: string;
  status: "connected" | "pending" | "empty" | "disconnected";
  condition?: "degraded";
  owner: string;
};

export const docs: Doc[] = [
  {
    slug: "context-brief",
    title: "Context brief",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 18, 2026",
    excerpt: "Read this first: what the company sells, to whom, and where everything lives.",
    links: ["overview", "glossary", "how-we-work"],
  },
  {
    slug: "overview",
    title: "Overview",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 14, 2026",
    excerpt: "What we sell, core capabilities, ICP criteria, and the buyer personas.",
    links: ["glossary"],
  },
  {
    slug: "glossary",
    title: "Glossary",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jul 10, 2026",
    sourceOfTruth: "Warehouse · metric definitions win on conflict",
    excerpt: "The definitions and IDs that make queries correct — metrics, events, and their traps.",
    links: [],
  },
  {
    slug: "people",
    title: "People",
    category: "company",
    owner: "Alessandro",
    verifiedAt: "Jul 8, 2026",
    sourceOfTruth: "Notion · Teammate directory wins on conflict",
    excerpt: "Who does what, and who owns which connector and process.",
    links: ["how-we-work"],
  },
  {
    slug: "how-we-work",
    title: "How we work",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jun 30, 2026",
    excerpt: "Rituals, decision rules, and how changes ship.",
    links: ["context-brief"],
  },
  {
    slug: "voice-guide",
    title: "Voice guide",
    category: "company",
    owner: "Julien",
    verifiedAt: "Jun 27, 2026",
    excerpt: "Tone, phrasing rules, and the words we never use.",
    links: [],
  },
  {
    slug: "gtm-architecture",
    title: "GTM architecture",
    category: "wiki",
    owner: "Alessandro",
    verifiedAt: "Jun 20, 2026",
    excerpt: "The full motion from signal to campaign, as one diagram.",
    links: ["overview"],
  },
  {
    slug: "feedback-pipeline-runbook",
    title: "Feedback pipeline runbook and error handling",
    category: "wiki",
    owner: "Julien",
    verifiedAt: "Jun 12, 2026",
    excerpt: "Why the pipeline exists, how each step works, and what to do when it fails.",
    links: ["glossary"],
  },
  {
    slug: "decision-auto-merge",
    title: "Decision: auto-merge with recap",
    category: "decisions",
    owner: "Alessandro",
    verifiedAt: "Jul 20, 2026",
    excerpt: "Changes merge without review; a recap posts to Slack after the fact.",
    links: ["how-we-work"],
  },
];

export const skills: Skill[] = [
  { id: "pull-crm-records", name: "Pull CRM records", description: "Read companies, contacts, and deals from the CRM." },
  { id: "enrich-contact", name: "Enrich contact details", description: "Waterfall enrichment for emails, phones, and firmographics." },
  { id: "score-icp-fit", name: "Score ICP fit", description: "Grade an account against the ICP criteria in the glossary." },
  { id: "collect-hiring-signals", name: "Collect hiring signals", description: "Scan job postings for buying signals." },
  { id: "detect-tech-stack", name: "Detect tech stack", description: "Identify the tools a company already runs." },
  { id: "draft-outreach", name: "Draft outreach copy", description: "Write personalized sequences in the company voice." },
  { id: "sync-crm", name: "Write back to CRM", description: "Push enriched fields and notes to the CRM." },
  { id: "post-slack-digest", name: "Post Slack digest", description: "Publish a fixed-format recap to a channel." },
  { id: "extract-call-feedback", name: "Extract call feedback", description: "Pull bugs, feature asks, and sentiment from call transcripts." },
  { id: "render-report", name: "Render branded report", description: "Assemble data into the branded report template." },
  { id: "file-tickets", name: "File tickets", description: "Open tracked issues from confirmed items." },
];

export const processes: Process[] = [
  {
    slug: "lead-list-builder",
    name: "Lead list builder",
    description: "Build a scored, enriched cold list from a plain-language brief and push it to a campaign.",
    status: "active",
    kind: "deliverable",
    owner: "Alessandro",
    schedule: null,
    skillIds: [
      "enrich-contact",
      "score-icp-fit",
      "collect-hiring-signals",
      "detect-tech-stack",
      "draft-outreach",
      "sync-crm",
    ],
    connectorIds: ["hubspot", "lemlist", "slack"],
    outputs: ["CRM list", "Campaign", "Slack recap"],
  },
  {
    slug: "weekly-feedback-report",
    name: "Weekly feedback report",
    description: "Turn the week's call transcripts into a report, tickets, and a Slack recap.",
    status: "active",
    kind: "deliverable",
    owner: "Julien",
    schedule: "Mon 09:00",
    skillIds: ["extract-call-feedback", "render-report", "post-slack-digest", "file-tickets"],
    connectorIds: ["fireflies", "notion", "slack", "linear"],
    outputs: ["Report page", "Linear tickets", "Slack recap"],
  },
  {
    slug: "competitor-watch",
    name: "Competitor watch",
    description: "Monitor competitor accounts for engagement signals and start outreach.",
    status: "active",
    kind: "deliverable",
    owner: "Alessandro",
    schedule: "Mon + Thu 07:00",
    skillIds: ["collect-hiring-signals", "detect-tech-stack", "draft-outreach", "post-slack-digest"],
    connectorIds: ["hubspot", "lemlist", "slack"],
    outputs: ["Campaign", "Slack recap"],
  },
  {
    slug: "churn-alerts",
    name: "Churn alerts",
    description: "Watch product usage for drop-off patterns and alert the account owner.",
    status: "active",
    kind: "ops",
    owner: "Julien",
    schedule: "Daily 08:00",
    skillIds: ["pull-crm-records", "post-slack-digest"],
    connectorIds: ["amplitude", "hubspot", "slack"],
    outputs: ["Slack alert"],
  },
  {
    slug: "workspace-health-check",
    name: "Workspace health check",
    description: "Probe every connector, flag stale docs, and report drift before it bites.",
    status: "active",
    kind: "ops",
    owner: "Alessandro",
    schedule: "Daily 08:00",
    skillIds: ["post-slack-digest"],
    connectorIds: ["notion", "slack", "snowflake"],
    outputs: ["Slack heartbeat"],
  },
  {
    slug: "founder-content-drafts",
    name: "Founder content drafts",
    description: "Draft daily social posts in the founder's voice for review by emoji.",
    status: "draft",
    kind: "deliverable",
    owner: "Julien",
    schedule: null,
    skillIds: ["draft-outreach", "post-slack-digest"],
    connectorIds: ["slack"],
    outputs: ["Slack drafts"],
  },
  {
    slug: "invoice-sync",
    name: "Invoice sync",
    description: "Reconcile invoices between billing and accounting, flag mismatches.",
    status: "deprecated",
    kind: "ops",
    owner: "Alessandro",
    schedule: null,
    skillIds: ["pull-crm-records", "sync-crm"],
    connectorIds: ["hubspot"],
    outputs: ["Ledger updates"],
  },
];

export const connectors: Connector[] = [
  { id: "hubspot", name: "HubSpot", description: "Read and update CRM records.", status: "connected", owner: "Alessandro" },
  { id: "slack", name: "Slack", description: "Post digests and read owner channels.", status: "connected", owner: "Alessandro" },
  { id: "notion", name: "Notion", description: "Read and write workspace pages.", status: "connected", owner: "Julien" },
  { id: "linear", name: "Linear", description: "Create and track issues.", status: "connected", owner: "Julien" },
  { id: "gmail", name: "Gmail", description: "Send and read email on behalf of the workspace.", status: "connected", owner: "Alessandro" },
  { id: "lemlist", name: "Lemlist", description: "Create and monitor outreach campaigns.", status: "connected", owner: "Alessandro" },
  { id: "amplitude", name: "Amplitude", description: "Query product analytics cohorts.", status: "connected", condition: "degraded", owner: "Julien" },
  { id: "snowflake", name: "Snowflake", description: "Query the data warehouse.", status: "pending", owner: "Alessandro" },
  { id: "fireflies", name: "Fireflies", description: "Pull meeting transcripts.", status: "empty", owner: "Julien" },
];

export const getDoc = (slug: string) => docs.find((d) => d.slug === slug);
export const getProcess = (slug: string) => processes.find((p) => p.slug === slug);
export const getSkill = (id: string) => skills.find((s) => s.id === id);
export const getConnector = (id: string) => connectors.find((c) => c.id === id);

// How many processes use a given connector — the "used by N" signal both
// company OSs track by hand today.
export const connectorUsage = (id: string) =>
  processes.filter((p) => p.status !== "deprecated" && p.connectorIds.includes(id)).length;
