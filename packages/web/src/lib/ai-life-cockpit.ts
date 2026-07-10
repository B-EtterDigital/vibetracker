import { PROVIDERS, type ProviderDescriptor } from "../../../adapters/src/registry.ts";
import { providerBrand } from "./provider-brand.ts";

export type AiLifeCockpitImpact = "usage" | "local_only" | "not_usage" | "privacy" | "publish";

export interface AiLifeCockpitProvider {
  id: string;
  label: string;
  status: ProviderDescriptor["status"];
  method: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface AiLifeCockpitLane {
  id: "creator" | "builder" | "local" | "regional" | "manual" | "publish";
  label: string;
  value: string;
  command: string;
  impact: AiLifeCockpitImpact;
  railLabel: string;
  meter: number;
  note: string;
  guardrail: string;
  ascii: string[];
  providers: AiLifeCockpitProvider[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface AiLifeCockpitRhythm {
  id: string;
  label: string;
  value: string;
  note: string;
  impact: AiLifeCockpitImpact;
}

export interface AiLifePracticeSurface {
  id: "creator-studio" | "builder-desk" | "local-lab" | "research-desk" | "regional-frontier" | "public-relay";
  label: string;
  persona: string;
  railLabel: string;
  impact: AiLifeCockpitImpact;
  value: string;
  command: string;
  capture: string;
  boundary: string;
  meter: number;
  ascii: string[];
  providers: AiLifeCockpitProvider[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface AiLifePracticePassport {
  headline: string;
  subline: string;
  terminalLines: string[];
  surfaces: AiLifePracticeSurface[];
  totals: {
    surfaces: number;
    usage: number;
    localOnly: number;
    notUsage: number;
    privacy: number;
    publish: number;
    averageMeter: number;
  };
}

export interface AiLifePersonaCard {
  id: "creator" | "builder" | "researcher" | "localist" | "globalist" | "operator" | "publisher";
  label: string;
  persona: string;
  railLabel: string;
  impact: AiLifeCockpitImpact;
  command: string;
  tracks: string;
  notTracked: string;
  proof: string;
  meter: number;
  ascii: string[];
  providers: AiLifeCockpitProvider[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface AiLifePersonaAtlas {
  headline: string;
  subline: string;
  terminalLines: string[];
  personas: AiLifePersonaCard[];
  totals: {
    personas: number;
    usage: number;
    localOnly: number;
    notUsage: number;
    privacy: number;
    publish: number;
    averageMeter: number;
  };
}

export interface AiLifeCockpit {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: AiLifeCockpitLane[];
  rhythm: AiLifeCockpitRhythm[];
  persona: AiLifePersonaAtlas;
  practice: AiLifePracticePassport;
  totals: {
    providers: number;
    built: number;
    verified: number;
    local: number;
    manual: number;
  };
}

const CREATOR_CATEGORIES = new Set(["image", "video", "audio", "music", "3d"]);
const BUILDER_IDS = new Set([
  "claude-code", "codex", "codex-cli", "github", "github-cli", "github-actions", "antigravity",
  "augment", "roo-code", "gemini-cli", "cursor", "windsurf", "aider", "copilot", "devin", "v0", "bolt", "lovable",
]);
const REGIONAL_IDS = new Set([
  "qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity",
  "zai", "glm", "zhipu", "baidu-wenxin", "tencent-hunyuan", "iflytek-spark", "sarvam", "upstage",
]);

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function terminalLine(value: string): string {
  return `| ${fit(value, 66)} |`;
}

function isCreator(provider: ProviderDescriptor): boolean {
  return provider.categories.some((category) => CREATOR_CATEGORIES.has(category));
}

function isBuilder(provider: ProviderDescriptor): boolean {
  return BUILDER_IDS.has(provider.id) || provider.categories.includes("coding");
}

function isLocal(provider: ProviderDescriptor): boolean {
  return provider.tier === "local" || provider.auth === "localLogs" || provider.method.toLowerCase().includes("local");
}

function isRegional(provider: ProviderDescriptor): boolean {
  return REGIONAL_IDS.has(provider.id);
}

function toCockpitProvider(provider: ProviderDescriptor): AiLifeCockpitProvider {
  const brand = providerBrand(provider.id);
  return {
    id: provider.id,
    label: provider.label,
    status: provider.status,
    method: provider.method,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function meterFor(providers: ProviderDescriptor[], fallback = 18): number {
  if (!providers.length) return fallback;
  const built = providers.filter((provider) => provider.status === "built").length;
  const verified = providers.filter((provider) => provider.verified).length;
  const score = 24 + providers.length * 4 + built * 10 + verified * 12;
  return Math.max(fallback, Math.min(100, score));
}

function brandFor(id: string) {
  const brand = providerBrand(id);
  return { mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function prioritize(providers: ProviderDescriptor[], firstIds: string[]): ProviderDescriptor[] {
  const rank = new Map(firstIds.map((id, index) => [id, index]));
  return providers.slice().sort((a, b) => {
    const rankA = rank.get(a.id) ?? 99;
    const rankB = rank.get(b.id) ?? 99;
    return rankA - rankB || a.label.localeCompare(b.label);
  });
}

function lane(
  id: AiLifeCockpitLane["id"],
  label: string,
  command: string,
  impact: AiLifeCockpitImpact,
  railLabel: string,
  providers: ProviderDescriptor[],
  note: string,
  guardrail: string,
  ascii: string[],
  brandId: string,
): AiLifeCockpitLane {
  const built = providers.filter((provider) => provider.status === "built").length;
  const verified = providers.filter((provider) => provider.verified).length;
  const value = impact === "not_usage"
    ? `${providers.length} signals`
    : impact === "publish"
      ? "dry-run only"
      : `${built}/${providers.length} built`;

  return {
    id,
    label,
    value,
    command,
    impact,
    railLabel,
    meter: impact === "publish" ? 100 : meterFor(providers, impact === "not_usage" ? 72 : 28),
    note: verified ? `${verified} verified source${verified === 1 ? "" : "s"}. ${note}` : note,
    guardrail,
    ascii,
    providers: providers.slice(0, 8).map(toCockpitProvider),
    ...brandFor(brandId),
  };
}

function practiceSurface(
  id: AiLifePracticeSurface["id"],
  label: string,
  persona: string,
  railLabel: string,
  impact: AiLifeCockpitImpact,
  value: string,
  command: string,
  capture: string,
  boundary: string,
  meter: number,
  ascii: string[],
  providers: ProviderDescriptor[],
  brandId: string,
): AiLifePracticeSurface {
  return {
    id,
    label,
    persona,
    railLabel,
    impact,
    value,
    command,
    capture,
    boundary,
    meter,
    ascii,
    providers: providers.slice(0, 6).map(toCockpitProvider),
    ...brandFor(brandId),
  };
}

function personaCard(
  id: AiLifePersonaCard["id"],
  label: string,
  persona: string,
  railLabel: string,
  impact: AiLifeCockpitImpact,
  command: string,
  tracks: string,
  notTracked: string,
  proof: string,
  meter: number,
  ascii: string[],
  providers: ProviderDescriptor[],
  brandId: string,
): AiLifePersonaCard {
  return {
    id,
    label,
    persona,
    railLabel,
    impact,
    command,
    tracks,
    notTracked,
    proof,
    meter,
    ascii,
    providers: providers.slice(0, 5).map(toCockpitProvider),
    ...brandFor(brandId),
  };
}

export function buildAiLifeCockpit(): AiLifeCockpit {
  const creator = PROVIDERS.filter(isCreator);
  const builder = prioritize(PROVIDERS.filter(isBuilder), ["codex-cli", "github", "claude-code", "antigravity", "github-actions"]);
  const local = prioritize(PROVIDERS.filter(isLocal), ["ollama", "lmstudio", "comfyui", "vllm", "claude-code"]);
  const regional = prioritize(PROVIDERS.filter(isRegional), ["qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity"]);
  const manual = PROVIDERS.filter((provider) => provider.tier === "manual" || provider.domain === "creative");
  const research = prioritize(
    [
      ...PROVIDERS.filter((provider) => ["perplexity", "notebooklm"].includes(provider.id)),
      toVirtualProvider("notion", "Notion", "manual workspace export"),
      toVirtualProvider("obsidian", "Obsidian", "local markdown vault export"),
      toVirtualProvider("zotero", "Zotero", "research reference ledger"),
    ],
    ["perplexity", "notebooklm", "notion", "obsidian", "zotero"],
  );
  const built = PROVIDERS.filter((provider) => provider.status === "built");
  const verified = built.filter((provider) => provider.verified);

  const lanes: AiLifeCockpitLane[] = [
    lane(
      "creator",
      "Creator studio",
      "vibetracker sync --creator-tools",
      "usage",
      "USAGE",
      creator,
      "Image, video, audio, music, and 3D tools report as source-labelled usage or honest manual rails.",
      "Generated media never leaves the machine; only usage metadata and reviewed aggregates can publish.",
      ["[HF] video  [RW]", "[RP] image  [FA]", "[11] voice  [SU]", "[UD] song   [3D]"],
      "higgsfield",
    ),
    lane(
      "builder",
      "Builder agents",
      "vibetracker trust github codex",
      "not_usage",
      "NOT USAGE",
      builder,
      "GitHub, Codex, Claude Code, Antigravity, and adjacent CLIs can strengthen profile trust.",
      "Builder cadence is a trust signal only; it never changes usage totals, spend, credits, or rank.",
      ["+CX+ diff", "|GH| push", "|CC| logs", "+--+ trust"],
      "codex-cli",
    ),
    lane(
      "local",
      "Local AI lab",
      "vibetracker detect --local",
      "local_only",
      "LOCAL ONLY",
      local,
      "Ollama, LM Studio, ComfyUI, vLLM, local logs, and loopback services get first-class visibility.",
      "Local sources stay on-machine until the user reviews an aggregate upload.",
      ["127.0.0.1", "[OL]-[LM]", "[CU]-API", "LAN only"],
      "ollama",
    ),
    lane(
      "regional",
      "Regional AI",
      "vibetracker sync --regional",
      "usage",
      "USAGE",
      regional,
      "Chinese, European, Indian, and adjacent global providers keep their own labelled rail.",
      "Endpoint confidence and manual fallback state stay visible instead of pretending every adapter is equal.",
      ["QW DB KM", "MI AA LO", "PX DS GL", "world AI"],
      "qwen",
    ),
    lane(
      "manual",
      "Manual ledgers",
      "vibetracker ledger add --review",
      "privacy",
      "REVIEW",
      manual,
      "Subscriptions, seats, and creative tools enter through guided ledgers with amortization labels.",
      "Manual entries are self-reported until verified by a provider or backend receipt.",
      ["seat/sub", "CSV/PDF", "redact", "review"],
      "canva",
    ),
    lane(
      "publish",
      "C0VIBE relay",
      "vibetracker upload --dry-run",
      "publish",
      "PUBLISH",
      [toVirtualProvider("c0vibe", "C0VIBE", "reviewed aggregate publish")],
      "Vibers Unite at c0vibe.app only after local preview, secret scan, and explicit confirmation.",
      "Nothing leaves the machine before dry-run review.",
      ["C0VIBE", "review", "YES?", "UNITE"],
      "c0vibe",
    ),
  ];
  const practiceSurfaces: AiLifePracticeSurface[] = [
    practiceSurface(
      "creator-studio",
      "Creator studio",
      "Video, image, voice, music, and 3D vibers",
      "USAGE",
      "usage",
      `${creator.length} creator sources`,
      "vibetracker sync --creator-tools",
      "credits, generations, render counts, model IDs",
      "Media outputs stay local; only metadata and reviewed aggregates can publish.",
      meterFor(creator, 32),
      ["VIDEO ", "IMAGE ", "VOICE ", "MUSIC "],
      creator,
      "higgsfield",
    ),
    practiceSurface(
      "builder-desk",
      "Builder desk",
      "Coders, agent operators, and GitHub-heavy builders",
      "NOT USAGE",
      "not_usage",
      `${builder.length} trust signals`,
      "vibetracker trust github codex",
      "commit cadence, package signals, CLI connection state",
      "Builder cadence is profile context only and never mutates usage totals.",
      meterFor(builder, 72),
      ["CODEX ", "GITHUB", "CLI   ", "TRUST "],
      builder,
      "codex-cli",
    ),
    practiceSurface(
      "local-lab",
      "Local AI lab",
      "Ollama, LM Studio, ComfyUI, vLLM, and LAN-first users",
      "LOCAL ONLY",
      "local_only",
      `${local.length} local sources`,
      "vibetracker detect --local",
      "loopback probes, local workflow imports, proxy receipts",
      "Prompts, outputs, files, and raw local logs stay on-machine.",
      meterFor(local, 44),
      ["127.0 ", "OLLAMA", "COMFY ", "LAN   "],
      local,
      "ollama",
    ),
    practiceSurface(
      "research-desk",
      "Research desk",
      "Researchers, writers, note-takers, and knowledge workers",
      "REVIEW",
      "privacy",
      `${research.length} research rails`,
      "vibetracker export --target notion --dry-run",
      "workspace exports, reference counts, note vault receipts",
      "Notes, sources, document text, and private paths require redaction preview.",
      meterFor(research, 58),
      ["NOTES ", "PAPERS", "VAULT ", "REVIEW"],
      research,
      "perplexity",
    ),
    practiceSurface(
      "regional-frontier",
      "Regional frontier",
      "Qwen, Doubao, Kimi, Mistral, Aleph Alpha, and global AI explorers",
      "USAGE",
      "usage",
      `${regional.length} regional rails`,
      "vibetracker sync --regional",
      "provider-specific auth, usage shape, and confidence labels",
      "Manual, proxy, and API confidence stay labelled until verified.",
      meterFor(regional, 36),
      ["QW DB ", "KIMI  ", "MI AA ", "WORLD "],
      regional,
      "qwen",
    ),
    practiceSurface(
      "public-relay",
      "Public relay",
      "People who want a profile, score, badge, and public proof",
      "PUBLISH",
      "publish",
      "dry-run first",
      "vibetracker upload --dry-run",
      "reviewed aggregates, labelled trust sidecars, explicit publish",
      "C0VIBE receives reviewed aggregate proof, not surprise uploads.",
      100,
      ["C0VIBE", "SCORE ", "BADGE ", "UNITE "],
      [toVirtualProvider("c0vibe", "C0VIBE", "reviewed aggregate publish")],
      "c0vibe",
    ),
  ];
  const practiceAverage = Math.round(practiceSurfaces.reduce((sum, surface) => sum + surface.meter, 0) / practiceSurfaces.length);
  const personaCards: AiLifePersonaCard[] = [
    personaCard(
      "creator",
      "Creator",
      "I make video, images, audio, music, or 3D with AI.",
      "USAGE",
      "usage",
      "vibetracker sync --creator-tools",
      "credits, generations, renders, model IDs, provider cost",
      "media files, prompt bodies, private projects",
      "Usage counts after adapter validation or reviewed manual ledger.",
      meterFor(creator, 40),
      ["MAKE  ", "MEDIA ", "COST  ", "PROOF "],
      creator,
      "higgsfield",
    ),
    personaCard(
      "builder",
      "Builder",
      "I use agents, coding CLIs, GitHub, and automation.",
      "NOT USAGE",
      "not_usage",
      "vibetracker trust github codex",
      "commit cadence, package activity, CLI connection evidence",
      "AI spend, credits, token totals, verified usage rank",
      "Builder evidence is a trust sidecar and changes +0 usage.",
      meterFor(builder, 72),
      ["CODE  ", "AGENT ", "TRUST ", "+0USE "],
      builder,
      "codex-cli",
    ),
    personaCard(
      "researcher",
      "Researcher",
      "I research, write, note-take, summarize, and cite.",
      "REVIEW",
      "privacy",
      "vibetracker export --target notion --dry-run",
      "workspace exports, note counts, reference ledgers",
      "document text, sources, local paths, private notes",
      "Research rails require redaction preview before profile use.",
      meterFor(research, 58),
      ["READ  ", "NOTES ", "VAULT ", "MASK  "],
      research,
      "perplexity",
    ),
    personaCard(
      "localist",
      "Local lab",
      "I run Ollama, LM Studio, ComfyUI, vLLM, or LAN tools.",
      "LOCAL ONLY",
      "local_only",
      "vibetracker detect --local",
      "loopback services, local workflow receipts, proxy totals",
      "raw logs, prompts, outputs, files, LAN content",
      "Local AI stays on-machine until aggregate dry-run review.",
      meterFor(local, 48),
      ["127.0 ", "LOCAL ", "MODEL ", "DRYRUN"],
      local,
      "ollama",
    ),
    personaCard(
      "globalist",
      "Global explorer",
      "I use Chinese, European, Indian, and frontier AI providers.",
      "USAGE",
      "usage",
      "vibetracker sync --regional",
      "provider IDs, confidence, usage shape, translated units",
      "unverified green checks, blended regions, hidden manual data",
      "Regional rails keep API, proxy, and manual confidence visible.",
      meterFor(regional, 42),
      ["QW DB ", "KIMI  ", "EU AI ", "WORLD "],
      regional,
      "qwen",
    ),
    personaCard(
      "operator",
      "Operator",
      "I manage subscriptions, seats, invoices, CSV/PDF exports.",
      "REVIEW",
      "privacy",
      "vibetracker ledger add --review",
      "subscription amortization, seats, ledgers, estimates",
      "bank secrets, invoice bodies, private account metadata",
      "Manual ledgers stay self-reported until provider proof exists.",
      meterFor(manual, 50),
      ["CSV   ", "SEATS ", "AMORT ", "REVIEW"],
      manual,
      "canva",
    ),
    personaCard(
      "publisher",
      "Publisher",
      "I want a public profile, badge, score, and proof page.",
      "PUBLISH",
      "publish",
      "vibetracker upload --dry-run",
      "reviewed aggregate usage, labelled trust, public tiers",
      "surprise uploads, raw content, hidden profile writes",
      "C0VIBE publish is explicit: preview first, then Vibers Unite.",
      100,
      ["C0VIBE", "SCORE ", "BADGE ", "UNITE "],
      [toVirtualProvider("c0vibe", "C0VIBE", "reviewed aggregate publish")],
      "c0vibe",
    ),
  ];
  const personaAverage = Math.round(personaCards.reduce((sum, card) => sum + card.meter, 0) / personaCards.length);

  return {
    headline: "AI LIFE COCKPIT",
    subline: "One first-screen instrument for creators, coders, local model users, regional AI explorers, manual subscription ledgers, and C0VIBE publish proof.",
    terminalLines: [
      "+--------------------------------------------------------------------+",
      terminalLine("VTK://AI-LIFE-COCKPIT//CREATORS-CODERS-LOCAL-GLOBAL"),
      "|--------------------------------------------------------------------|",
      terminalLine(`catalog ${fit(PROVIDERS.length, 5)} built ${fit(built.length, 5)} verified ${fit(verified.length, 5)} local ${fit(local.length, 5)}`),
      terminalLine(`creator ${fit(creator.length, 5)} builder ${fit(builder.length, 5)} regional ${fit(regional.length, 5)} manual ${fit(manual.length, 5)}`),
      terminalLine("lanes: creator usage | builder NOT USAGE | local-only | regional | manual review"),
      terminalLine("publish: dry-run -> Vibers Unite -> c0vibe.app"),
      terminalLine("trust/profile evidence never mutates spend or usage"),
      "+--------------------------------------------------------------------+",
    ],
    lanes,
    persona: {
      headline: "Viber persona atlas",
      subline: "A first-read map for every kind of AI user: creators, builders, researchers, local model runners, global provider explorers, operators, and public profile publishers.",
      terminalLines: [
        "+--------------------------------------------------------------------+",
        terminalLine("VTK://AI-LIFE-PERSONA-ATLAS//NOT-JUST-CODERS//ALL-VIBERS"),
        "|--------------------------------------------------------------------|",
        terminalLine(`personas ${fit(personaCards.length, 5)} usage ${fit(personaCards.filter((card) => card.impact === "usage").length, 5)} local ${fit(personaCards.filter((card) => card.impact === "local_only").length, 5)}`),
        terminalLine(`trust ${fit(personaCards.filter((card) => card.impact === "not_usage").length, 5)} review ${fit(personaCards.filter((card) => card.impact === "privacy").length, 5)} publish ${fit(personaCards.filter((card) => card.impact === "publish").length, 5)}`),
        terminalLine("each persona shows tracked metadata and blocked private content"),
        terminalLine("Vibers Unite // c0vibe.app // no mixed ranks"),
        "+--------------------------------------------------------------------+",
      ],
      personas: personaCards,
      totals: {
        personas: personaCards.length,
        usage: personaCards.filter((card) => card.impact === "usage").length,
        localOnly: personaCards.filter((card) => card.impact === "local_only").length,
        notUsage: personaCards.filter((card) => card.impact === "not_usage").length,
        privacy: personaCards.filter((card) => card.impact === "privacy").length,
        publish: personaCards.filter((card) => card.impact === "publish").length,
        averageMeter: personaAverage,
      },
    },
    practice: {
      headline: "AI practice passport",
      subline: "One labelled passport for creator work, builder trust, local labs, research and writing, regional AI, and public C0VIBE relay.",
      terminalLines: [
        "+--------------------------------------------------------------------+",
        terminalLine("VTK://AI-LIFE-PASSPORT//CREATOR-BUILDER-LOCAL-RESEARCH"),
        "|--------------------------------------------------------------------|",
        terminalLine(`surfaces ${fit(practiceSurfaces.length, 5)} usage ${fit(practiceSurfaces.filter((surface) => surface.impact === "usage").length, 5)} local ${fit(practiceSurfaces.filter((surface) => surface.impact === "local_only").length, 5)}`),
        terminalLine(`trust ${fit(practiceSurfaces.filter((surface) => surface.impact === "not_usage").length, 5)} privacy ${fit(practiceSurfaces.filter((surface) => surface.impact === "privacy").length, 5)} publish ${fit(practiceSurfaces.filter((surface) => surface.impact === "publish").length, 5)}`),
        terminalLine("research exports and local labs require dry-run review"),
        terminalLine("Vibers Unite // c0vibe.app // passport writes 0 ranks"),
        "+--------------------------------------------------------------------+",
      ],
      surfaces: practiceSurfaces,
      totals: {
        surfaces: practiceSurfaces.length,
        usage: practiceSurfaces.filter((surface) => surface.impact === "usage").length,
        localOnly: practiceSurfaces.filter((surface) => surface.impact === "local_only").length,
        notUsage: practiceSurfaces.filter((surface) => surface.impact === "not_usage").length,
        privacy: practiceSurfaces.filter((surface) => surface.impact === "privacy").length,
        publish: practiceSurfaces.filter((surface) => surface.impact === "publish").length,
        averageMeter: practiceAverage,
      },
    },
    rhythm: [
      {
        id: "scan",
        label: "Scan cadence",
        value: "wake/auth/fetch/check/review",
        note: "Every lane has visible state before the next command runs.",
        impact: "usage",
      },
      {
        id: "privacy",
        label: "Machine boundary",
        value: "local-first",
        note: "Secrets, raw outputs, and local records stay put until preview.",
        impact: "privacy",
      },
      {
        id: "trust",
        label: "Trust labels",
        value: "NOT USAGE",
        note: "GitHub, Codex, and publishing cadence explain context only.",
        impact: "not_usage",
      },
      {
        id: "relay",
        label: "Public relay",
        value: "Vibers Unite",
        note: "C0VIBE receives reviewed aggregates, not surprise uploads.",
        impact: "publish",
      },
    ],
    totals: {
      providers: PROVIDERS.length,
      built: built.length,
      verified: verified.length,
      local: local.length,
      manual: manual.length,
    },
  };
}

function toVirtualProvider(id: string, label: string, method: string): ProviderDescriptor {
  return {
    id,
    label,
    domain: "ai",
    categories: ["other"],
    tier: "manual",
    auth: "none",
    status: "planned",
    verified: false,
    method,
  };
}
