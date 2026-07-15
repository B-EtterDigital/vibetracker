import { PROVIDERS, type ProviderDescriptor } from "../../../adapters/src/registry.ts";
import { providerBrand } from "./provider-brand.ts";

export type SourceAtlasLaneId = "creator" | "builder" | "local" | "regional" | "infra" | "manual";
export type SourceAtlasImpact = "usage" | "local_only" | "manual" | "trust" | "publish";
export type SourceIntakeImpact = "usage" | "trust" | "local_only" | "manual" | "privacy" | "publish";

export interface SourceAtlasNode {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
  status: ProviderDescriptor["status"] | "relay";
  tier: ProviderDescriptor["tier"] | "publish";
  impact: SourceAtlasImpact;
  detail: string;
  meter: number;
  x: number;
  y: number;
}

export interface SourceAtlasLane {
  id: SourceAtlasLaneId;
  call: string;
  label: string;
  note: string;
  count: number;
  built: number;
  verified: number;
  overflow: number;
  nodes: SourceAtlasNode[];
}

export interface SourceAtlasMetric {
  label: string;
  value: string;
  note: string;
}

export interface SourceIntakeStep {
  id: "provider_api" | "mcp_cli_trust" | "local_probe" | "manual_ledger" | "normalize_score" | "reviewed_publish";
  label: string;
  command: string;
  status: string;
  note: string;
  guardrail: string;
  impact: SourceIntakeImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  feeds: {
    usageRows: boolean;
    trustSidecar: boolean;
    localStore: boolean;
    publicProfile: boolean;
  };
  preview: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
  };
}

export interface SourceIntakeStack {
  headline: string;
  subline: string;
  terminalLines: string[];
  steps: SourceIntakeStep[];
  totals: {
    steps: number;
    usageRows: number;
    trustSidecars: number;
    localStores: number;
    publicProfileFeeds: number;
    previewProviderCalls: number;
    previewLedgerWrites: number;
    hiddenUploads: number;
    notUsageSteps: number;
    manualSteps: number;
  };
}

export interface SourceAtlas {
  headline: string;
  terminalLines: string[];
  metrics: SourceAtlasMetric[];
  lanes: SourceAtlasLane[];
  beacons: SourceAtlasNode[];
  relay: SourceAtlasNode;
}

export interface SourceCoverageOrbit {
  id: SourceAtlasLaneId;
  call: string;
  label: string;
  note: string;
  count: number;
  built: number;
  verified: number;
  usage: number;
  trust: number;
  localOnly: number;
  manual: number;
  meter: number;
  orbit: number;
  nodes: SourceAtlasNode[];
  terminalLine: string;
}

export interface SourceCoverageConstellation {
  headline: string;
  subline: string;
  terminalLines: string[];
  relay: SourceAtlasNode;
  orbits: SourceCoverageOrbit[];
  totals: {
    sources: number;
    built: number;
    verified: number;
    usageNodes: number;
    trustNodes: number;
    localOnlyNodes: number;
    manualNodes: number;
    publishNodes: number;
    hiddenUsageBoosts: 0;
  };
}

interface LaneDef {
  id: SourceAtlasLaneId;
  call: string;
  label: string;
  note: string;
  preferred: string[];
  match(provider: ProviderDescriptor): boolean;
}

const CREATOR_CATEGORIES = new Set(["image", "video", "audio", "music", "3d"]);
const REGIONAL_IDS = new Set([
  "qwen",
  "doubao",
  "kimi",
  "deepseek",
  "mistral",
  "perplexity",
  "aleph-alpha",
  "lighton",
  "baidu-wenxin",
  "tencent-hunyuan",
  "iflytek-spark",
  "zhipu",
  "baichuan",
  "01ai",
  "stepfun",
  "siliconflow",
  "modelscope",
  "sarvam",
  "upstage",
  "naver-hyperclova",
  "sakana",
]);

const LANES: LaneDef[] = [
  {
    id: "creator",
    call: "CREATE",
    label: "Creator field",
    note: "Image, video, voice, music, 3D, and design sources are first-class signals.",
    preferred: ["higgsfield", "runway", "replicate", "falai", "comfyui", "suno", "udio", "elevenlabs", "luma", "midjourney"],
    match: (provider) => provider.categories.some((category) => CREATOR_CATEGORIES.has(category)),
  },
  {
    id: "builder",
    call: "BUILD",
    label: "Builder orbit",
    note: "Coding agents and CLIs can add activity context without pretending it is spend.",
    preferred: ["claude-code", "codex-cli", "antigravity", "augment", "roo-code", "cursor", "copilot", "windsurf", "aider"],
    match: (provider) => provider.categories.includes("coding"),
  },
  {
    id: "local",
    call: "LOCAL",
    label: "Local lab",
    note: "Loopback tools stay on-machine until the user reviews aggregate upload.",
    preferred: ["ollama", "lmstudio", "comfyui", "vllm", "llama-cpp", "automatic1111", "forge", "invokeai", "jan"],
    match: (provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs",
  },
  {
    id: "regional",
    call: "GLOBAL",
    label: "Regional mesh",
    note: "Chinese, European, Indian, Korean, and Japanese providers get their own labelled lane.",
    preferred: ["qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity", "sarvam", "upstage"],
    match: (provider) => REGIONAL_IDS.has(provider.id),
  },
  {
    id: "infra",
    call: "POWER",
    label: "AI infra",
    note: "GPU, browser, hosting, CI, database, and deployment spend sit beside model spend.",
    preferred: ["huggingface", "runpod", "browserbase", "devin", "vercel", "supabase", "github-actions", "cloudflare"],
    match: (provider) => provider.domain === "dev" || ["huggingface", "runpod", "browserbase", "devin"].includes(provider.id),
  },
  {
    id: "manual",
    call: "LEDGER",
    label: "Manual ledger",
    note: "Subscriptions and closed products remain useful, but confidence stays visible.",
    preferred: ["midjourney", "canva", "capcut", "adobe-cc", "notion-ai", "poe", "topaz", "gamma"],
    match: (provider) => provider.tier === "manual" || provider.status === "manual-only" || provider.domain === "creative",
  },
];

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function meterFor(provider: ProviderDescriptor): number {
  if (provider.status === "built" && provider.verified) return 96;
  if (provider.status === "built") return 78;
  if (provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs") return 64;
  if (provider.tier === "manual" || provider.status === "manual-only") return 46;
  return 34;
}

function impactFor(provider: ProviderDescriptor): SourceAtlasImpact {
  if (provider.categories.includes("coding") && (provider.tier === "log" || provider.auth === "localLogs")) return "trust";
  if (provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs") return "local_only";
  if (provider.tier === "manual" || provider.status === "manual-only" || provider.domain === "creative") return "manual";
  return "usage";
}

function score(provider: ProviderDescriptor, preferred: string[]): number {
  const preferredIndex = preferred.indexOf(provider.id);
  if (preferredIndex >= 0) return preferredIndex;
  if (provider.status === "built" && provider.verified) return 100;
  if (provider.status === "built") return 200;
  if (provider.tier === "local" || provider.tier === "proxy") return 300;
  if (provider.tier === "manual" || provider.status === "manual-only") return 400;
  return 500;
}

function toNode(provider: ProviderDescriptor, laneIndex: number, index: number): SourceAtlasNode {
  const brand = providerBrand(provider.id);
  return {
    id: provider.id,
    label: provider.label,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    status: provider.status,
    tier: provider.tier,
    impact: impactFor(provider),
    detail: `${provider.tier} / ${provider.status}`,
    meter: meterFor(provider),
    x: 7 + ((index * 17 + laneIndex * 11) % 86),
    y: 11 + ((index * 23 + laneIndex * 13) % 78),
  };
}

function relayNode(): SourceAtlasNode {
  const brand = providerBrand("c0vibe");
  return {
    id: "c0vibe",
    label: "C0VIBE relay",
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    status: "relay",
    tier: "publish",
    impact: "publish",
    detail: "reviewed aggregate profile",
    meter: 100,
    x: 50,
    y: 50,
  };
}

function intakeStep(
  id: SourceIntakeStep["id"],
  providerId: string,
  step: Omit<SourceIntakeStep, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): SourceIntakeStep {
  const brand = providerBrand(providerId);
  return {
    id,
    ...step,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUploads: 0,
    },
  };
}

export function buildSourceIntakeStack(): SourceIntakeStack {
  const steps: SourceIntakeStep[] = [
    intakeStep("provider_api", "higgsfield", {
      label: "Provider API",
      command: "sync --providers",
      status: "USAGE ROWS",
      note: "Hosted APIs, credit ledgers, and receipts become usage only after adapter validation.",
      guardrail: "Preview does not call providers; real sync writes a local receipt first.",
      impact: "usage",
      meter: 94,
      frames: ["api", "$$", "row", "ok"],
      feeds: { usageRows: true, trustSidecar: false, localStore: true, publicProfile: true },
    }),
    intakeStep("mcp_cli_trust", "codex-cli", {
      label: "MCP / CLI trust",
      command: "trust collect",
      status: "NOT USAGE",
      note: "GitHub, Codex, Higgsfield MCP, creator cadence, and package signals stay side evidence.",
      guardrail: "Trust signals never change spend, credits, operations, rank, or score math.",
      impact: "trust",
      meter: 88,
      frames: ["CX", "git", "mcp", "not"],
      feeds: { usageRows: false, trustSidecar: true, localStore: true, publicProfile: true },
    }),
    intakeStep("local_probe", "ollama", {
      label: "Local probe",
      command: "detect --local",
      status: "LOCAL ONLY",
      note: "Ollama, LM Studio, ComfyUI, vLLM, desktop, browser, and LAN probes stay on-machine.",
      guardrail: "No prompts, outputs, files, secrets, or raw local logs are uploaded by detection.",
      impact: "local_only",
      meter: 86,
      frames: ["127", "LM", "CU", "ok"],
      feeds: { usageRows: false, trustSidecar: false, localStore: true, publicProfile: false },
    }),
    intakeStep("manual_ledger", "midjourney", {
      label: "Manual ledger",
      command: "import midjourney --images <lifetime-images>",
      status: "LOW CONF",
      note: "Midjourney's official /info total and manual closed-tool entries remain useful with visible confidence.",
      guardrail: "Manual entries are labelled and never auto-upgrade to verified usage.",
      impact: "manual",
      meter: 64,
      frames: ["MJ", "CA", "POE", "tag"],
      feeds: { usageRows: true, trustSidecar: false, localStore: true, publicProfile: true },
    }),
    intakeStep("normalize_score", "openrouter", {
      label: "Normalize / score",
      command: "score --explain",
      status: "DERIVED",
      note: "Units, estimates, confidence, category mix, freshness, and source mix feed the score receipt.",
      guardrail: "Derived score reads reviewed rows and labels trust context without rank boost.",
      impact: "privacy",
      meter: 90,
      frames: ["unit", "mix", "rank", "ok"],
      feeds: { usageRows: false, trustSidecar: false, localStore: true, publicProfile: true },
    }),
    intakeStep("reviewed_publish", "c0vibe", {
      label: "Reviewed publish",
      command: "upload --dry-run",
      status: "C0VIBE.APP",
      note: "Public profile, leaderboard, score, and heatgrid receive reviewed aggregates only.",
      guardrail: "Dry-run keeps hiddenUploads=0 until the user approves the aggregate bundle.",
      impact: "publish",
      meter: 100,
      frames: ["C0", "app", ">>>", "ok"],
      feeds: { usageRows: false, trustSidecar: false, localStore: false, publicProfile: true },
    }),
  ];

  return {
    headline: "SOURCE INTAKE STACK",
    subline: "A labelled source pipeline for every kind of viber: hosted API usage, MCP evidence, local AI, manual ledgers, score normalization, and reviewed C0VIBE publish.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://SOURCE-INTAKE//ALL-RAILS//C0VIBE.APP"),
      frameLine("provider APIs can create usage rows after validation"),
      frameLine("MCP/CLI/GitHub/creator cadence stays NOT USAGE"),
      frameLine("local probes stay local; manual ledgers stay labelled"),
      frameLine("score/profile/heatgrid read reviewed aggregates"),
      frameLine("dry-run preview calls 0 writes 0 hiddenUploads 0"),
      "+--------------------------------------------------------------+",
    ],
    steps,
    totals: {
      steps: steps.length,
      usageRows: steps.filter((step) => step.feeds.usageRows).length,
      trustSidecars: steps.filter((step) => step.feeds.trustSidecar).length,
      localStores: steps.filter((step) => step.feeds.localStore).length,
      publicProfileFeeds: steps.filter((step) => step.feeds.publicProfile).length,
      previewProviderCalls: steps.reduce((sum, step) => sum + step.preview.providerCalls, 0),
      previewLedgerWrites: steps.reduce((sum, step) => sum + step.preview.ledgerWrites, 0),
      hiddenUploads: steps.reduce((sum, step) => sum + step.preview.hiddenUploads, 0),
      notUsageSteps: steps.filter((step) => step.status === "NOT USAGE" || step.impact === "trust").length,
      manualSteps: steps.filter((step) => step.impact === "manual").length,
    },
  };
}

export function buildSourceAtlas(): SourceAtlas {
  const lanes = LANES.map<SourceAtlasLane>((lane, laneIndex) => {
    const matches = PROVIDERS
      .filter(lane.match)
      .sort((a, b) => score(a, lane.preferred) - score(b, lane.preferred) || a.label.localeCompare(b.label));
    const nodes = matches.slice(0, 10).map((provider, index) => toNode(provider, laneIndex, index));
    return {
      id: lane.id,
      call: lane.call,
      label: lane.label,
      note: lane.note,
      count: matches.length,
      built: matches.filter((provider) => provider.status === "built").length,
      verified: matches.filter((provider) => provider.status === "built" && provider.verified).length,
      overflow: Math.max(0, matches.length - nodes.length),
      nodes,
    };
  });

  const total = PROVIDERS.length;
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const local = PROVIDERS.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length;
  const manual = PROVIDERS.filter((provider) => provider.tier === "manual" || provider.status === "manual-only" || provider.domain === "creative").length;
  const regional = PROVIDERS.filter((provider) => REGIONAL_IDS.has(provider.id)).length;
  const relay = relayNode();

  return {
    headline: "SOURCE SIGNAL ATLAS",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SOURCE-ATLAS//REGISTRY-DRIVEN//NO-FAKE-USAGE   |",
      "|------------------------------------------------------|",
      `| sources  ${fit(total, 6)} built ${fit(built, 6)} verified ${fit(verified, 5)} |`,
      `| local    ${fit(local, 6)} manual ${fit(manual, 5)} regional ${fit(regional, 3)} |`,
      "|------------------------------------------------------|",
      "| creator / builder / local / regional / infra / ledger |",
      "| C0VIBE relay lights only after review and redaction   |",
      "| Vibers Unite // c0vibe.app                           |",
      "+------------------------------------------------------+",
    ],
    metrics: [
      { label: "registry signals", value: String(total), note: "Every dot comes from the provider registry." },
      { label: "built collectors", value: String(built), note: "Implemented adapters, proxies, or local importers." },
      { label: "local/private", value: String(local), note: "Loopback and local-log sources start on this machine." },
      { label: "manual lanes", value: String(manual), note: "Subscriptions stay labelled as manual evidence." },
    ],
    lanes,
    beacons: lanes.flatMap((lane) => lane.nodes.slice(0, 2)),
    relay,
  };
}

export function buildSourceCoverageConstellation(atlas: SourceAtlas = buildSourceAtlas()): SourceCoverageConstellation {
  const impactCount = (lane: SourceAtlasLane, impact: SourceAtlasImpact): number =>
    lane.nodes.filter((node) => node.impact === impact).length;
  const safeCount = (value: number): number => Math.max(1, value);
  const maxCount = safeCount(Math.max(...atlas.lanes.map((lane) => lane.count)));
  const orbits = atlas.lanes.map<SourceCoverageOrbit>((lane, index) => {
    const usage = impactCount(lane, "usage");
    const trust = impactCount(lane, "trust");
    const localOnly = impactCount(lane, "local_only");
    const manual = impactCount(lane, "manual");
    const meter = Math.min(100, Math.round((lane.count / maxCount) * 100));
    return {
      id: lane.id,
      call: lane.call,
      label: lane.label,
      note: lane.note,
      count: lane.count,
      built: lane.built,
      verified: lane.verified,
      usage,
      trust,
      localOnly,
      manual,
      meter,
      orbit: 38 + index * 7,
      nodes: lane.nodes.slice(0, 6),
      terminalLine: `${lane.call.padEnd(6)} ${String(lane.count).padStart(3)} sources // built ${String(lane.built).padStart(2)} // verified ${String(lane.verified).padStart(2)} // ${trust + localOnly + manual} guarded`,
    };
  });

  const nodes = atlas.lanes.flatMap((lane) => lane.nodes);
  const totals = {
    sources: atlas.lanes.reduce((sum, lane) => sum + lane.count, 0),
    built: atlas.lanes.reduce((sum, lane) => sum + lane.built, 0),
    verified: atlas.lanes.reduce((sum, lane) => sum + lane.verified, 0),
    usageNodes: nodes.filter((node) => node.impact === "usage").length,
    trustNodes: nodes.filter((node) => node.impact === "trust").length,
    localOnlyNodes: nodes.filter((node) => node.impact === "local_only").length,
    manualNodes: nodes.filter((node) => node.impact === "manual").length,
    publishNodes: 1,
    hiddenUsageBoosts: 0 as const,
  };

  return {
    headline: "Source coverage constellation",
    subline: "A registry-derived orbital view for every viber lane: creator, builder, local lab, regional AI, infra, manual ledger, and the reviewed C0VIBE relay.",
    terminalLines: [
      "+--------------------------------------------------------------------+",
      "| VTK://SOURCE-CONSTELLATION//REGISTRY-ORBIT//NO-HIDDEN-USAGE       |",
      `| sources ${String(totals.sources).padStart(3)} // built ${String(totals.built).padStart(3)} // verified ${String(totals.verified).padStart(3)} // publish ${totals.publishNodes}       |`,
      "| creator + builder + local + regional + infra + ledger stay labelled|",
      "| trust/local/manual rails are visible and add 0 hidden usage boosts |",
      "| Vibers Unite // C0vibe.app // map first, upload only after review  |",
      "+--------------------------------------------------------------------+",
    ],
    relay: atlas.relay,
    orbits,
    totals,
  };
}
