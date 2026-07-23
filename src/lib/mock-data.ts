// Mock content shared by the sidebar and the placeholder pages until the
// back end is integrated. The shapes mirror the two real company-OS repos
// this product replaces (corma-company-os, second-brain), genericized:
// docs carry owner + verified date + source-of-truth pointers, processes have
// a lifecycle + schedule and are composed of skills reused across processes,
// connectors carry Oto's real installation state. Dates are preformatted
// display strings so server and client can never disagree on locale.

import { knowledgeDocs } from "./knowledge-docs";

// Identity colors for nested items — the sidebar marks each doc/process with a
// colored dot so the sub-sections are visually distinct (differentiation, not
// decoration). Ordered so consecutive items in a section read as clearly
// different hues; assigned by position for now, user-assignable later like
// Notion page colors. Every value clears ~3:1 on the gray-2 sidebar.
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

// Document content is a typed block array rather than a markdown string: no
// parser to maintain, total render control, and it forces the block schema the
// back end will eventually serve. Inline references carry a slug, not a URL, so
// a doc that gets renamed never leaves a dead link in prose.
export type Span =
  | string
  | { ref: string } // inline reference to another doc, by slug
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

export type Doc = {
  slug: string;
  title: string;
  category: "company" | "wiki" | "decisions";
  owner: string;
  verifiedAt: string;
  sourceOfTruth?: string;
  excerpt: string;
  links: string[]; // slugs of related docs; a slug with no doc is an unresolved link
  // Stored, never computed from the clock. Dates in this file are preformatted
  // display strings precisely so server and client cannot disagree — deriving
  // staleness from Date.now() would reintroduce the hazard it avoids.
  freshness: "fresh" | "aging" | "stale";
  body: Block[];
};

export type Skill = {
  id: string;
  name: string;
  description: string;
};

export type ProcessRun = {
  ranAt: string;
  durationMinutes: number;
  status: "success" | "failed";
};

export type ProcessVersion = {
  version: number;
  createdAt: string;
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
  // Real tool identifiers (as they appear in `body`'s code spans), for
  // processes pulled from an actual doctrine. Takes over from skillIds in
  // the panel when present — skills are an invented abstraction, this is
  // literally what the procedure calls.
  tools?: string[];
  connectorIds: string[];
  // The knowledge this process reads before it runs. Together with
  // connectorIds this is what makes the knowledge graph a picture of the
  // company rather than of a wiki — see src/lib/knowledge-graph.ts.
  docSlugs: string[];
  outputs: string[];
  // Most recent run first. Empty for processes that have never run (drafts).
  runs: ProcessRun[];
  // Highest version first — versions[0] is the current one.
  versions: ProcessVersion[];
  // The full procedure, block by block, for processes that have one written
  // out (today: only the one pulled from Oto). Optional because most mock
  // processes here only ever got a one-line description.
  body?: Block[];
};

export type Connector = {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string | null;
  publisher: string | null;
  // Oto's real installation state (MyConnector.state) — not a fabricated
  // health matrix. not_selected = never installed, paused = installed but
  // hidden from agents, active = installed and in use.
  status: "not_selected" | "active" | "paused";
  owner: string;
  // Real ConnectorMeta fields (namespaces, auth_modes, secret_kind,
  // personal_session) — power the detail panel's Tools/AI access tabs.
  namespaces: string[];
  authModes: string[];
  secretKind: string;
  personalSession: boolean;
};

// The corpus itself lives in its own file purely for size — this stays the
// single import surface for every consumer.
export const docs: Doc[] = knowledgeDocs;

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
  // Real doctrine pulled from Oto (org "Atlas", oto_procedure slug
  // "vendor-contact-sourcing", v3) — everything else in this array is
  // invented. Oto's doctrine model has no schedule or run-history fields,
  // so those stay null/empty until Oto exposes them.
  {
    slug: "vendor-contact-sourcing",
    name: "Sourcing contacts éditeurs (AI Ark → Folk → Lemlist)",
    description:
      "Extrait du groupe Folk « Providers » les entreprises avec un avis mais sans contact lié, trouve leur CEO / Head of Marketing / Head of Branding via AI Ark, les repousse dans Folk sous ce même groupe, puis les pousse vers la campagne Lemlist dédiée à l'outreach vendors.",
    status: "active",
    kind: "deliverable",
    owner: "Julien",
    schedule: null,
    skillIds: [],
    tools: [
      "mcp__folk-crm__list_companies",
      "mcp__folk-crm__get_company_context",
      "aiark_company_search",
      "aiark_people_search",
      "mcp__folk-crm__search_people_by_email",
      "mcp__folk-crm__create_person",
      "mcp__folk-crm__bulk_add_to_group",
      "aiark_credits",
    ],
    connectorIds: ["folk", "aiark", "lemlist"],
    docSlugs: [],
    outputs: ["Folk contacts", "Lemlist campaign"],
    runs: [],
    versions: [
      { version: 3, createdAt: "Jul 22, 2026" },
      { version: 2, createdAt: "Jul 22, 2026" },
      { version: 1, createdAt: "Jul 22, 2026" },
    ],
    body: [
      { type: "h2", text: "Contexte" },
      {
        type: "p",
        spans: [
          "Cette procédure est le sous-bloc « recherche de contacts » du volet éditeurs de la stratégie d'outreach Softatlas (voir page KB « Outreach — Acquisition utilisateurs & éditeurs »). Elle part des entreprises déjà présentes dans Folk (groupe « Providers ») qui ont un avis sur Softatlas mais aucun contact rattaché, et en ressort des contacts qualifiés repoussés dans Folk et Lemlist.",
        ],
      },
      { type: "h2", text: "Rôles ciblés (par entreprise, jusqu'à 3 contacts)" },
      {
        type: "ol",
        items: [
          [
            { strong: "CEO / Fondateur" },
            " — seniority ",
            { code: "founder" },
            "/",
            { code: "owner" },
            "/",
            { code: "c_suite" },
            ", title contient CEO / Chief Executive Officer / Founder.",
          ],
          [
            { strong: "Head of Marketing" },
            " — department ",
            { code: "marketing" },
            ", seniority ",
            { code: "head" },
            "/",
            { code: "director" },
            "/",
            { code: "vp" },
            ".",
          ],
          [
            { strong: "Head of Branding / Brand" },
            " — title contient brand / branding / brand marketing.",
          ],
        ],
      },
      { type: "h2", text: "Étapes" },
      { type: "h3", text: "1. Extraire les entreprises cibles (Folk)" },
      {
        type: "p",
        spans: [
          "Dans le groupe Folk ",
          { strong: "« Providers »" },
          ", lister les entreprises (",
          { code: "mcp__folk-crm__list_companies" },
          ", filtré sur ce groupe) puis ne garder que celles qui :",
        ],
      },
      {
        type: "ul",
        items: [
          ["ont un ", { strong: "avis" }, " (review) renseigné sur Softatlas (champ personnalisé avis/reviews) ;"],
          [
            { strong: "n'ont aucune personne (contact) rattachée" },
            " dans Folk (vérifier via ",
            { code: "mcp__folk-crm__get_company_context" },
            " — liste des personnes liées vide).",
          ],
        ],
      },
      {
        type: "p",
        spans: ["C'est cette liste filtrée (entreprise + domaine/site) qui alimente les étapes suivantes."],
      },
      { type: "h3", text: "2. Rechercher les contacts (AI Ark)" },
      { type: "p", spans: ["Pour chaque entreprise filtrée à l'étape 1, et pour chaque rôle ciblé :"] },
      {
        type: "ul",
        items: [
          [
            { code: "aiark_company_search" },
            ' avec account: {"domain": {"any": {"include": ["<domaine>"]}}} pour confirmer/normaliser l\'entité si besoin.',
          ],
          [
            { code: "aiark_people_search" },
            " avec ",
            { code: "account" },
            " filtré sur le domaine et ",
            { code: "contact" },
            " filtré selon le rôle (cf. section rôles ciblés).",
          ],
        ],
      },
      {
        type: "p",
        spans: ["Garder le meilleur match par rôle (le plus senior / le plus proche du titre recherché)."],
      },
      { type: "h3", text: "3. Vérifier les doublons" },
      {
        type: "p",
        spans: [
          { code: "mcp__folk-crm__search_people_by_email" },
          " sur chaque contact obtenu — ne pas recréer une fiche Folk existante, la mettre à jour si besoin (poste, entreprise).",
        ],
      },
      { type: "h3", text: "4. Repousser vers Folk, sous le groupe Providers" },
      {
        type: "ul",
        items: [
          [
            { code: "mcp__folk-crm__create_person" },
            " pour chaque nouveau contact (prénom, nom, email, poste), ",
            { strong: "rattaché à l'entreprise déjà présente dans Folk" },
            ".",
          ],
          [
            { code: "mcp__folk-crm__bulk_add_to_group" },
            " pour ajouter ces contacts au ",
            { strong: "même groupe « Providers »" },
            " que leur entreprise (pas un groupe séparé) — les contacts apparaissent ainsi directement rattachés à leur fiche entreprise dans ce groupe.",
          ],
        ],
      },
      { type: "h3", text: "5. Pousser vers Lemlist" },
      {
        type: "p",
        spans: [
          "Ajouter les contacts (email, prénom, nom, société, poste) à la campagne Lemlist dédiée « Outreach Vendors — Claim & Review ». Si le connecteur Lemlist n'est pas encore activé sur l'org, l'activer d'abord (",
          { code: "oto_connector" },
          " op=select, name=lemlist).",
        ],
      },
      { type: "h2", text: "Garde-fous" },
      {
        type: "ul",
        items: [
          [
            "Ne traiter que les entreprises du groupe « Providers » ayant un avis ET aucune personne liée — ne pas re-traiter celles qui ont déjà au moins un contact.",
          ],
          ["Ne jamais pousser un contact deux fois dans la même campagne Lemlist."],
          ["Vérifier les crédits disponibles (", { code: "aiark_credits" }, ") avant un run sur un grand nombre d'entreprises."],
          [
            "Une entreprise sans contact trouvé pour un rôle donné est journalisée comme « non trouvé », pas bloquant pour les autres rôles.",
          ],
        ],
      },
      { type: "h2", text: "Sortie attendue" },
      {
        type: "p",
        spans: [
          "Pour chaque run : nombre d'entreprises traitées (groupe Providers, avis sans contact), contacts trouvés par rôle, contacts créés/mis à jour dans Folk sous le groupe Providers, contacts poussés dans la campagne Lemlist.",
        ],
      },
    ],
  },
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
    docSlugs: ["icp", "lead-scoring", "enrichment-waterfall", "outreach-playbook", "crm-hygiene", "glossary"],
    outputs: ["CRM list", "Campaign", "Slack recap"],
    runs: [
      { ranAt: "Jul 21, 2026 14:32", durationMinutes: 6, status: "success" },
      { ranAt: "Jul 18, 2026 09:14", durationMinutes: 7, status: "success" },
      { ranAt: "Jul 14, 2026 16:05", durationMinutes: 5, status: "success" },
      { ranAt: "Jul 9, 2026 11:47", durationMinutes: 8, status: "failed" },
    ],
    versions: [
      { version: 3, createdAt: "Jul 18, 2026" },
      { version: 2, createdAt: "Jul 2, 2026" },
      { version: 1, createdAt: "Jun 14, 2026" },
    ],
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
    connectorIds: ["notion", "slack"],
    docSlugs: ["feedback-pipeline-runbook", "glossary", "voice-guide"],
    outputs: ["Report page", "Tickets", "Slack recap"],
    runs: [
      { ranAt: "Jul 20, 2026 09:00", durationMinutes: 12, status: "success" },
      { ranAt: "Jul 13, 2026 09:00", durationMinutes: 11, status: "success" },
      { ranAt: "Jul 6, 2026 09:00", durationMinutes: 14, status: "success" },
    ],
    versions: [
      { version: 2, createdAt: "Jul 11, 2026" },
      { version: 1, createdAt: "Jun 20, 2026" },
    ],
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
    docSlugs: ["competitors", "icp", "outreach-playbook"],
    outputs: ["Campaign", "Slack recap"],
    runs: [
      { ranAt: "Jul 21, 2026 07:00", durationMinutes: 4, status: "success" },
      { ranAt: "Jul 17, 2026 07:00", durationMinutes: 4, status: "success" },
      { ranAt: "Jul 14, 2026 07:00", durationMinutes: 3, status: "success" },
    ],
    versions: [{ version: 1, createdAt: "May 30, 2026" }],
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
    connectorIds: ["zohoanalytics", "hubspot", "slack"],
    docSlugs: ["glossary", "data-model", "people"],
    outputs: ["Slack alert"],
    runs: [
      { ranAt: "Jul 21, 2026 08:00", durationMinutes: 2, status: "success" },
      { ranAt: "Jul 20, 2026 08:00", durationMinutes: 2, status: "success" },
      { ranAt: "Jul 19, 2026 08:00", durationMinutes: 2, status: "success" },
    ],
    versions: [
      { version: 2, createdAt: "Jul 5, 2026" },
      { version: 1, createdAt: "Jun 8, 2026" },
    ],
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
    connectorIds: ["notion", "slack"],
    docSlugs: ["connector-conventions", "agent-runbook", "security-posture"],
    outputs: ["Slack heartbeat"],
    runs: [
      { ranAt: "Jul 21, 2026 08:00", durationMinutes: 3, status: "success" },
      { ranAt: "Jul 20, 2026 08:00", durationMinutes: 3, status: "success" },
      { ranAt: "Jul 19, 2026 08:00", durationMinutes: 9, status: "failed" },
    ],
    versions: [
      { version: 3, createdAt: "Jul 15, 2026" },
      { version: 2, createdAt: "Jun 22, 2026" },
      { version: 1, createdAt: "Jun 1, 2026" },
    ],
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
    docSlugs: ["voice-guide", "overview"],
    outputs: ["Slack drafts"],
    runs: [],
    versions: [{ version: 1, createdAt: "Jul 19, 2026" }],
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
    docSlugs: ["data-model", "reporting-stack"],
    outputs: ["Ledger updates"],
    runs: [{ ranAt: "Mar 2, 2026 10:00", durationMinutes: 5, status: "success" }],
    versions: [
      { version: 4, createdAt: "Feb 20, 2026" },
      { version: 3, createdAt: "Jan 12, 2026" },
      { version: 2, createdAt: "Dec 3, 2025" },
      { version: 1, createdAt: "Nov 8, 2025" },
    ],
  },
];

export const connectors: Connector[] = [
  {
    id: "serper",
    name: "Serper",
    description: "recherche web",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/serper.dev?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Serper",
    status: "active",
    owner: "Alessandro",
    namespaces: ["serper"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "hunter",
    name: "Hunter.io",
    description: "emails",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/hunter.io?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Hunter.io",
    status: "active",
    owner: "Julien",
    namespaces: ["hunter"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "sirene",
    name: "INSEE SIRENE",
    description: "données entreprise FR",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/insee.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "INSEE",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["fr"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "droit",
    name: "Info légale FR",
    description: "jurisprudence, codes consolidés, conventions collectives (open data DILA/Légifrance)",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/legifrance.gouv.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Légifrance / DILA",
    status: "paused",
    owner: "Julien",
    namespaces: ["juris", "loi", "ccn"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "attio",
    name: "Attio",
    description: "CRM",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/attio.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Attio",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["attio"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "lemlist",
    name: "Lemlist",
    description: "cold outreach",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/lemlist.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "lemlist",
    status: "active",
    owner: "Julien",
    namespaces: ["lemlist"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "kaspr",
    name: "Kaspr",
    description: "enrichissement",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/kaspr.io?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Kaspr",
    status: "active",
    owner: "Alessandro",
    namespaces: ["kaspr"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "pennylane",
    name: "Pennylane",
    description: "compta",
    category: "Finance",
    logoUrl: "https://img.logo.dev/pennylane.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Pennylane",
    status: "active",
    owner: "Julien",
    namespaces: ["pennylane"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "messagerie Slack (bot token xoxb- et/ou user token xoxp-)",
    category: "Comms",
    logoUrl: "https://img.logo.dev/slack.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Slack",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["slack"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "fullenrich",
    name: "FullEnrich",
    description: "enrichissement waterfall",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/fullenrich.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "FullEnrich",
    status: "paused",
    owner: "Julien",
    namespaces: ["fullenrich"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "folk",
    name: "Folk",
    description: "CRM",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/folk.app?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Folk",
    status: "active",
    owner: "Alessandro",
    namespaces: ["folk"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "unipile",
    name: "Messagerie hébergée (Unipile)",
    description: "LinkedIn + WhatsApp + Telegram + Instagram + Messenger + X/Twitter hébergés (recherche/scrape/messagerie)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/unipile.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Unipile",
    status: "active",
    owner: "Julien",
    namespaces: ["unipile", "whatsapp", "telegram", "instagram", "messenger", "twitter"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "topograph",
    name: "Topograph",
    description: "KYB — données & documents entreprise (registres européens)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/topograph.co?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Otomata",
    status: "active",
    owner: "Alessandro",
    namespaces: ["topograph"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "resend",
    name: "Resend",
    description: "envoi d'email transactionnel (clé de l'org)",
    category: "Autres",
    logoUrl: null,
    publisher: "Resend",
    status: "active",
    owner: "Julien",
    namespaces: ["resend"],
    authModes: ["byo_org"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "scaleway",
    name: "Scaleway TEM (email)",
    description: "envoi d'email transactionnel via ton compte Scaleway TEM (domaine vérifié chez Scaleway)",
    category: "Autres",
    logoUrl: null,
    publisher: "Scaleway",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["scaleway"],
    authModes: ["byo_org"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "silae",
    name: "Silae",
    description: "paie FR (lecture) — API Silae Paie v1",
    category: "Finance",
    logoUrl: "https://img.logo.dev/silae.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Silae",
    status: "paused",
    owner: "Julien",
    namespaces: ["silae"],
    authModes: ["byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "gocardless",
    name: "GoCardless",
    description: "prélèvements SEPA (lecture)",
    category: "Finance",
    logoUrl: "https://img.logo.dev/gocardless.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "GoCardless",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["gocardless"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "folkmcp",
    name: "Folk (MCP)",
    description: "CRM Folk via son MCP officiel (fédéré, OAuth per-user)",
    category: "Autres",
    logoUrl: null,
    publisher: "Otomata",
    status: "active",
    owner: "Julien",
    namespaces: ["folkmcp"],
    authModes: ["byo_user"],
    secretKind: "oauth",
    personalSession: false,
  },
  {
    id: "planity",
    name: "Planity",
    description: "agenda + caisse Planity (RDV, clients, CA, stats) — MCP fédéré",
    category: "Métier",
    logoUrl: "https://img.logo.dev/planity.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Planity",
    status: "active",
    owner: "Alessandro",
    namespaces: ["planity"],
    authModes: ["byo_user"],
    secretKind: "basic_auth",
    personalSession: false,
  },
  {
    id: "aiark",
    name: "AI Ark",
    description: "people & company search via LinkedIn",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/ai-ark.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "AI Ark",
    status: "active",
    owner: "Julien",
    namespaces: ["aiark"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "cognism",
    name: "Cognism",
    description: "B2B contact & company search, reveal, and identity enrichment",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/cognism.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Cognism",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["cognism"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "crunchbase",
    name: "Crunchbase",
    description: "fiches société/personne (session Browserbase)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/crunchbase.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Crunchbase",
    status: "paused",
    owner: "Julien",
    namespaces: ["crunchbase"],
    authModes: ["byo_user"],
    secretKind: "cookie",
    personalSession: true,
  },
  {
    id: "brevoauto",
    name: "Brevo (automation)",
    description: "automations marketing (session Browserbase)",
    category: "Automatisation",
    logoUrl: "https://img.logo.dev/brevo.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Brevo",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["brevoauto"],
    authModes: ["byo_user"],
    secretKind: "cookie",
    personalSession: true,
  },
  {
    id: "pennylaneged",
    name: "Pennylane GED",
    description: "bac documentaire Pennylane (session Browserbase)",
    category: "Finance",
    logoUrl: "https://img.logo.dev/pennylane.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Pennylane",
    status: "active",
    owner: "Julien",
    namespaces: ["pennylaneged"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "cookie",
    personalSession: true,
  },
  {
    id: "google",
    name: "Google",
    description: "Gmail + Tasks + Calendar + Sheets + Drive + Chat (OAuth)",
    category: "Comms",
    logoUrl: "https://img.logo.dev/google.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Google",
    status: "active",
    owner: "Alessandro",
    namespaces: ["gmail", "tasks", "calendar", "sheets", "drive", "chat"],
    authModes: ["byo_user"],
    secretKind: "oauth",
    personalSession: true,
  },
  {
    id: "culture",
    name: "Culture (open data)",
    description: "entreprises du spectacle vivant — open data Ministère de la Culture",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/culture.gouv.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Ministère de la Culture",
    status: "active",
    owner: "Julien",
    namespaces: ["culture"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "reddit",
    name: "Reddit",
    description: "recherche & lecture de posts/subreddits (API publique)",
    category: "Web",
    logoUrl: "https://img.logo.dev/reddit.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Reddit",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["reddit"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "gr",
    name: "Data GR",
    description: "entreprises Grèce — registre GEMI + VIES (open data)",
    category: "Data GR",
    logoUrl: null,
    publisher: "GEMI / VIES",
    status: "paused",
    owner: "Julien",
    namespaces: ["gr"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "foncier",
    name: "Foncier",
    description: "géocodage, cadastre, bâti, risques/ICPE, solaire, immobilier (open data)",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/data.gouv.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "État (open data)",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["foncier"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "urba",
    name: "Urbanisme",
    description: "zonage PLU/GPU, risques, QPV, EPFIF, socio-démo commune (open data)",
    category: "Autres",
    logoUrl: "https://img.logo.dev/geoportail-urbanisme.gouv.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Otomata",
    status: "active",
    owner: "Julien",
    namespaces: ["urba"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "sante",
    name: "Santé",
    description: "établissements FINESS + évaluations ESSMS HAS (open data)",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/has-sante.fr?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "HAS / FINESS",
    status: "active",
    owner: "Alessandro",
    namespaces: ["sante"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "osm",
    name: "OpenStreetMap",
    description: "points d'intérêt OSM par tag sur une zone (parkings, équipements, commerces) — recensement exhaustif via Overpass (open data)",
    category: "Autres",
    logoUrl: null,
    publisher: "Otomata",
    status: "active",
    owner: "Julien",
    namespaces: ["osm"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "frenchtech",
    name: "French Tech",
    description: "annuaire écosystème d'une capitale French Tech (startups/structures/prestataires) + événements, appels à projet, financements + French Tech Central (open data, défaut Aix-Marseille)",
    category: "Data FR",
    logoUrl: "https://img.logo.dev/lafrenchtech.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "La French Tech (open data)",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["frenchtech"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "infosec",
    name: "Infosec",
    description: "empreinte numérique d'un domaine : whois/RDAP, DNS, posture e-mail (SPF/DMARC), sous-domaines (CT), TLS, headers de sécurité (recon passif)",
    category: "Infosec",
    logoUrl: null,
    publisher: "Otomata (OSINT)",
    status: "paused",
    owner: "Julien",
    namespaces: ["infosec"],
    authModes: [],
    secretKind: "none",
    personalSession: false,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM (contacts, companies, deals, tickets, notes)",
    category: "Prospection",
    logoUrl: null,
    publisher: "HubSpot",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["hubspot"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "brevo",
    name: "Brevo",
    description: "emailing & CRM (contacts, listes, transactionnel, campagnes, deals)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/brevo.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Brevo",
    status: "active",
    owner: "Julien",
    namespaces: ["brevo"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "apollo",
    name: "Apollo.io",
    description: "prospection B2B (organizations, people, job postings)",
    category: "Prospection",
    logoUrl: null,
    publisher: "Apollo",
    status: "active",
    owner: "Alessandro",
    namespaces: ["apollo"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "zerobounce",
    name: "ZeroBounce",
    description: "vérification de délivrabilité email",
    category: "Prospection",
    logoUrl: null,
    publisher: "ZeroBounce",
    status: "active",
    owner: "Julien",
    namespaces: ["zerobounce"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "hithorizons",
    name: "HitHorizons",
    description: "données entreprise européennes (recherche + détails)",
    category: "Prospection",
    logoUrl: null,
    publisher: "HitHorizons",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["hithorizons"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "phantombuster",
    name: "Phantombuster",
    description: "agents d'automatisation (launch + résultats)",
    category: "Prospection",
    logoUrl: null,
    publisher: "Phantombuster",
    status: "paused",
    owner: "Julien",
    namespaces: ["phantombuster"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "pages, bases de données, blocs (lecture + écriture)",
    category: "Knowledge",
    logoUrl: null,
    publisher: "Notion",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["notion"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "figma",
    name: "Figma",
    description: "fichiers, export d'images, commentaires, FigJam",
    category: "Design",
    logoUrl: null,
    publisher: "Figma",
    status: "active",
    owner: "Julien",
    namespaces: ["figma"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Management API (projets, config auth, logs)",
    category: "Dev",
    logoUrl: null,
    publisher: "Supabase",
    status: "active",
    owner: "Alessandro",
    namespaces: ["supabase"],
    authModes: ["byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    description: "CRM Zoho (CRUD modules, notes)",
    category: "Prospection",
    logoUrl: null,
    publisher: "Zoho",
    status: "active",
    owner: "Julien",
    namespaces: ["zoho"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "zohodesk",
    name: "Zoho Desk",
    description: "support Zoho Desk (tickets, threads, contacts)",
    category: "Comms",
    logoUrl: null,
    publisher: "Zoho",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["zohodesk"],
    authModes: ["byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "zohoanalytics",
    name: "Zoho Analytics",
    description: "Zoho Analytics (workspaces, vues, export, requêtes SQL)",
    category: "Knowledge",
    logoUrl: null,
    publisher: "Zoho",
    status: "paused",
    owner: "Julien",
    namespaces: ["zohoanalytics"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM Salesforce (Contacts, Accounts/companies, Leads, Opportunities, notes)",
    category: "Prospection",
    logoUrl: null,
    publisher: "Salesforce",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["salesforce"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    description: "ATS — candidats, jobs, candidatures, notes (Harvest API)",
    category: "Recrutement",
    logoUrl: "https://img.logo.dev/greenhouse.io?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Greenhouse",
    status: "active",
    owner: "Julien",
    namespaces: ["greenhouse"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "lever",
    name: "Lever",
    description: "ATS — opportunities (candidats), postings, stages, notes",
    category: "Recrutement",
    logoUrl: "https://img.logo.dev/lever.co?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Lever",
    status: "active",
    owner: "Alessandro",
    namespaces: ["lever"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "ashby",
    name: "Ashby",
    description: "ATS — candidates, jobs, applications, notes",
    category: "Recrutement",
    logoUrl: "https://img.logo.dev/ashbyhq.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Ashby",
    status: "active",
    owner: "Julien",
    namespaces: ["ashby"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "teamtailor",
    name: "Teamtailor",
    description: "ATS — candidats, jobs, candidatures (JSON:API)",
    category: "Recrutement",
    logoUrl: "https://img.logo.dev/teamtailor.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Teamtailor",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["teamtailor"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "recruitee",
    name: "Recruitee",
    description: "ATS — candidats, offers (postes), notes",
    category: "Recrutement",
    logoUrl: "https://img.logo.dev/recruitee.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Recruitee",
    status: "paused",
    owner: "Julien",
    namespaces: ["recruitee"],
    authModes: ["byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "serpapi",
    name: "SerpApi",
    description: "recherche multi-moteurs (Google verticals, Bing, YouTube, Walmart, Amazon, jobs…)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/serpapi.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "SerpApi",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["serpapi"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "searchapi",
    name: "SearchApi",
    description: "recherche multi-moteurs (Google verticals, YouTube, Bing, jobs, news, maps, scholar…)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/searchapi.io?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "SearchApi",
    status: "active",
    owner: "Julien",
    namespaces: ["searchapi"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "brightdata",
    name: "Bright Data",
    description: "scraping & SERP via proxy (coquille vide — à implémenter)",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/brightdata.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Bright Data",
    status: "active",
    owner: "Alessandro",
    namespaces: ["brightdata"],
    authModes: ["byo_org", "byo_user", "platform"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "cloro",
    name: "Cloro",
    description: "veille AI-search (ChatGPT, Gemini, Perplexity…) + SERP Google JSON",
    category: "Prospection",
    logoUrl: "https://img.logo.dev/cloro.dev?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Cloro",
    status: "active",
    owner: "Julien",
    namespaces: ["cloro"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "n8n",
    name: "n8n",
    description: "automatisation de workflows — workflows + exécutions (API publique)",
    category: "Automatisation",
    logoUrl: "https://img.logo.dev/n8n.io?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "n8n",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["n8n"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "make",
    name: "Make",
    description: "automatisation de workflows — scénarios, exécution, logs (API v2)",
    category: "Automatisation",
    logoUrl: "https://img.logo.dev/make.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Make",
    status: "paused",
    owner: "Julien",
    namespaces: ["make"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "fields",
    personalSession: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "automatisation — actions exposées (AI Actions) + exécution",
    category: "Automatisation",
    logoUrl: "https://img.logo.dev/zapier.com?token=pk_Hvj44EaUSjmsX5fB3VGBXA&size=256&format=png&retina=true",
    publisher: "Zapier",
    status: "not_selected",
    owner: "Alessandro",
    namespaces: ["zapier"],
    authModes: ["byo_org", "byo_user"],
    secretKind: "api_key",
    personalSession: false,
  },
  {
    id: "http",
    name: "HTTP",
    description: "connecte n'importe quelle API HTTP à oto : renseigne l'URL de base, le mode d'auth (bearer / clé en header ou query / basic / oauth2) et le secret correspondant. oto stocke le secret (coffre chiffré) et tape l'API directement, en lecture seule (GET).",
    category: "Autres",
    logoUrl: null,
    publisher: "Otomata",
    status: "active",
    owner: "Julien",
    namespaces: ["http"],
    authModes: ["byo_org"],
    secretKind: "fields",
    personalSession: false,
  },
];

// Knowledge is a tree: the section holds category folders, each holding docs.
// Folder ids match Doc["category"] so a doc always knows its folder.
export const knowledgeFolders = [
  { id: "company", label: "Company" },
  { id: "wiki", label: "Wiki" },
  { id: "decisions", label: "Decisions" },
] as const satisfies readonly { id: Doc["category"]; label: string }[];

export const docsInFolder = (category: Doc["category"]) =>
  docs.filter((d) => d.category === category);

// Identity color by position in the full list, so a doc keeps its color
// regardless of which folder it sits in.
export const docColor = (slug: string) =>
  LABEL_DOT_COLORS[Math.max(0, docs.findIndex((d) => d.slug === slug)) % LABEL_DOT_COLORS.length];

export const processColor = (slug: string) =>
  LABEL_DOT_COLORS[
    Math.max(0, processes.findIndex((p) => p.slug === slug)) % LABEL_DOT_COLORS.length
  ];

export const getDoc = (slug: string) => docs.find((d) => d.slug === slug);
export const getProcess = (slug: string) => processes.find((p) => p.slug === slug);
export const getSkill = (id: string) => skills.find((s) => s.id === id);
export const getConnector = (id: string) => connectors.find((c) => c.id === id);

// Maps a real tool identifier, as it appears verbatim in a doc/process body's
// `code` spans (e.g. `mcp__folk-crm__create_person`), to the connector that
// backs it. Explicit rather than pattern-matched on the tool name — MCP
// namespaces (`folk-crm`) don't always match the connector id (`folk`), and
// guessing wrong would silently mislink a tool to the wrong logo.
const TOOL_CONNECTORS: Record<string, string> = {
  "mcp__folk-crm__list_companies": "folk",
  "mcp__folk-crm__get_company_context": "folk",
  "mcp__folk-crm__search_people_by_email": "folk",
  "mcp__folk-crm__create_person": "folk",
  "mcp__folk-crm__bulk_add_to_group": "folk",
  aiark_company_search: "aiark",
  aiark_people_search: "aiark",
  aiark_credits: "aiark",
};

export const getConnectorForTool = (tool: string) => {
  const connectorId = TOOL_CONNECTORS[tool];
  return connectorId ? getConnector(connectorId) : undefined;
};

// Connectors and tools in the order the procedure actually calls them, not
// the order they happen to be listed in connectorIds/tools — a connector's
// slot is set by its first tool's position, so the panel always reads as "in
// order of first use" even if those arrays get reordered independently.
export const orderedConnectorsForProcess = (process: Process): Connector[] => {
  const ordered = new Map<string, Connector>();
  for (const tool of process.tools ?? []) {
    const connector = getConnectorForTool(tool);
    if (connector && !ordered.has(connector.id)) ordered.set(connector.id, connector);
  }
  // Connectors with no tool tying them to a specific step (e.g. one only
  // used for a manual/UI action) keep connectorIds' order, after the ones
  // usage already placed.
  for (const id of process.connectorIds) {
    if (!ordered.has(id)) {
      const connector = getConnector(id);
      if (connector) ordered.set(id, connector);
    }
  }
  return [...ordered.values()];
};

export const toolsForConnector = (process: Process, connectorId: string): string[] =>
  (process.tools ?? []).filter((tool) => getConnectorForTool(tool)?.id === connectorId);

export const connectorUsage = (connectorId: string): Process[] =>
  processes.filter((p) => p.status !== "deprecated" && p.connectorIds.includes(connectorId));

// Which docs point at this one. The Doc shape only stores outgoing links, so
// backlinks are always a scan — cheap at this size, and it keeps a doc's own
// record from having to be kept in sync with its referrers.
export const backlinksFor = (slug: string): Doc[] =>
  docs.filter((d) => d.slug !== slug && d.links.includes(slug));

// Outgoing links, with slugs that have no doc preserved rather than dropped —
// those are the unresolved links the graph draws as phantom nodes and the
// links list marks "Not created yet".
export const outgoingFor = (slug: string): { slug: string; doc: Doc | undefined }[] =>
  (getDoc(slug)?.links ?? []).map((target) => ({ slug: target, doc: getDoc(target) }));

// Processes that read this doc before they run.
export const processesReading = (slug: string): Process[] =>
  processes.filter((p) => p.status !== "deprecated" && p.docSlugs.includes(slug));

// The only two people in this mock workspace — reused wherever a connector
// needs an access-grant list, not a magic array inlined at the call site.
export const team = ["Alessandro", "Julien"] as const;

// Lightweight team groupings for connector sharing scope — split along the
// same lines the rest of the mock data already implies (Alessandro owns the
// GTM-flavored docs/processes, Julien the ops/eng-flavored ones).
export const teams: { name: string; members: string[] }[] = [
  { name: "GTM", members: ["Alessandro"] },
  { name: "Ops", members: ["Julien"] },
];
