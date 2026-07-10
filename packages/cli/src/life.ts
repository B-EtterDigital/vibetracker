import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { aggregate, totals } from "../../core/src/aggregate.ts";
import type { ProviderDescriptor } from "../../adapters/src/registry.ts";
import { PROVIDERS } from "../../adapters/src/registry.ts";
import { formatTable, money } from "./format.ts";
import { renderMissionStrip } from "./mission-strip.ts";
import { providerBrand } from "./provider-brand.ts";

type LifeLaneId = "creator" | "builder" | "local" | "regional" | "manual" | "publish";
type LifeImpact = "usage" | "local_only" | "not_usage" | "privacy" | "publish";

interface LifeLane {
  id: LifeLaneId;
  label: string;
  impact: LifeImpact;
  command: string;
  note: string;
  guardrail: string;
  providerIds: string[];
  ops: number;
  usd: number;
  credits: number;
  catalog: number;
  built: number;
  verified: number;
}

export interface RenderLifeCommandInput {
  records: NormalizedRecord[];
  trustSignals?: TrustSignal[];
  providers?: ProviderDescriptor[];
  mode?: "ledger" | "demo";
}

const frameWidth = 68;
const contentWidth = frameWidth - 4;
const CREATOR_CATEGORIES = new Set(["image", "video", "audio", "music", "3d"]);
const BUILDER_IDS = new Set([
  "claude-code", "codex", "codex-cli", "github", "github-cli", "github-actions", "antigravity",
  "augment", "roo-code", "gemini-cli", "cursor", "windsurf", "aider", "copilot", "devin", "v0", "bolt", "lovable",
]);
const REGIONAL_IDS = new Set([
  "qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity",
  "zai", "glm", "zhipu", "baidu-wenxin", "tencent-hunyuan", "iflytek-spark", "sarvam", "upstage",
]);
const LOCAL_IDS = new Set([
  "ollama", "lmstudio", "comfyui", "vllm", "localai", "jan", "gpt4all", "llama-cpp", "automatic1111",
  "forge", "invokeai", "fooocus", "diffusers-local", "text-generation-webui",
]);

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function int(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function bar(value: number, max: number, width = 12): string {
  if (value <= 0 || max <= 0) return "░".repeat(width);
  const filled = Math.max(1, Math.round((value / max) * width));
  return "█".repeat(Math.min(width, filled)) + "░".repeat(Math.max(0, width - filled));
}

function isCreatorProvider(provider: ProviderDescriptor): boolean {
  return provider.categories.some((category) => CREATOR_CATEGORIES.has(category));
}

function isBuilderProvider(provider: ProviderDescriptor): boolean {
  return BUILDER_IDS.has(provider.id) || provider.categories.includes("coding");
}

function isLocalProvider(provider: ProviderDescriptor): boolean {
  return LOCAL_IDS.has(provider.id) || provider.tier === "local" || provider.auth === "localLogs" || provider.method.toLowerCase().includes("local");
}

function isRegionalProvider(provider: ProviderDescriptor): boolean {
  return REGIONAL_IDS.has(provider.id);
}

function recordMatchesLane(record: NormalizedRecord, lane: LifeLaneId, providers: ProviderDescriptor[]): boolean {
  const provider = providers.find((item) => item.id === record.provider);
  if (lane === "creator") return CREATOR_CATEGORIES.has(record.category) || (provider ? isCreatorProvider(provider) : false);
  if (lane === "builder") return record.category === "coding" || BUILDER_IDS.has(record.provider);
  if (lane === "local") return ["local", "log", "proxy"].includes(record.source) || LOCAL_IDS.has(record.provider);
  if (lane === "regional") return REGIONAL_IDS.has(record.provider);
  if (lane === "manual") return provider?.tier === "manual" || provider?.domain === "creative" || record.source === "manual";
  return false;
}

function providerIdsForLane(lane: LifeLaneId, providers: ProviderDescriptor[]): string[] {
  const filtered = providers.filter((provider) => {
    if (lane === "creator") return isCreatorProvider(provider);
    if (lane === "builder") return isBuilderProvider(provider);
    if (lane === "local") return isLocalProvider(provider);
    if (lane === "regional") return isRegionalProvider(provider);
    if (lane === "manual") return provider.tier === "manual" || provider.domain === "creative";
    return provider.id === "c0vibe";
  });
  return filtered.map((provider) => provider.id);
}

function summarizeLane(
  id: LifeLaneId,
  providers: ProviderDescriptor[],
  records: NormalizedRecord[],
  trustSignals: TrustSignal[],
): LifeLane {
  const providerIds = providerIdsForLane(id, providers);
  const laneRecords = records.filter((record) => recordMatchesLane(record, id, providers));
  const catalogProviders = providers.filter((provider) => providerIds.includes(provider.id));
  const usd = laneRecords.reduce((sum, record) => sum + (record.usdEst ?? 0), 0);
  const credits = laneRecords.reduce((sum, record) => sum + (record.rawUnit === "credits" ? (record.rawAmount ?? 0) : 0), 0);

  const base = {
    id,
    providerIds,
    ops: laneRecords.length,
    usd,
    credits,
    catalog: catalogProviders.length,
    built: catalogProviders.filter((provider) => provider.status === "built").length,
    verified: catalogProviders.filter((provider) => provider.verified).length,
  };

  if (id === "creator") return {
    ...base,
    label: "Creator studio",
    impact: "usage",
    command: "vibetracker sync --creator-tools",
    note: "Image, video, audio, music, and 3D usage reads from provider receipts or honest ledgers.",
    guardrail: "Generated outputs stay local; only usage metadata can publish.",
  };
  if (id === "builder") return {
    ...base,
    ops: trustSignals.length,
    usd: 0,
    credits: 0,
    label: "Builder agents",
    impact: "not_usage",
    command: "vibetracker trust github codex",
    note: "GitHub, Codex, Claude Code, Antigravity, and CLI cadence explain profile context.",
    guardrail: "NOT USAGE: never changes spend, credits, usage totals, or rank.",
  };
  if (id === "local") return {
    ...base,
    label: "Local AI lab",
    impact: "local_only",
    command: "vibetracker detect --local",
    note: "Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM, local logs, and loopback sources get visible rails.",
    guardrail: "Local-only until dry-run review approves an aggregate.",
  };
  if (id === "regional") return {
    ...base,
    label: "Regional AI",
    impact: "usage",
    command: "vibetracker sync --regional",
    note: "Chinese, European, Indian, and adjacent global providers keep labelled confidence.",
    guardrail: "Endpoint confidence and manual fallback are shown honestly.",
  };
  if (id === "manual") return {
    ...base,
    label: "Manual ledgers",
    impact: "privacy",
    command: "vibetracker ledger add --review",
    note: "Creative subscriptions, seats, PDFs, CSVs, and flat monthly plans enter with labels.",
    guardrail: "Self-reported until a provider/backend receipt verifies it.",
  };
  return {
    ...base,
    ops: records.length,
    usd: totals(records).usd ?? 0,
    credits: totals(records).credits,
    catalog: 1,
    built: 1,
    verified: 0,
    label: "C0VIBE relay",
    impact: "publish",
    command: "vibetracker upload --dry-run",
    note: "Vibers Unite at c0vibe.app after local preview, secret scan, and explicit confirmation.",
    guardrail: "Nothing leaves the machine before dry-run review.",
  };
}

function laneBrand(lane: LifeLane): { mark: string; label: string } {
  const preferred = lane.id === "builder" ? "codex-cli"
    : lane.id === "local" ? "ollama"
    : lane.id === "regional" ? "qwen"
    : lane.id === "manual" ? "canva"
    : lane.id === "publish" ? "c0vibe"
    : lane.providerIds[0] ?? "higgsfield";
  const brand = providerBrand(preferred);
  return { mark: brand.mark, label: brand.label };
}

function renderLifeDeck(
  lanes: LifeLane[],
  records: NormalizedRecord[],
  providers: ProviderDescriptor[],
  trustSignals: TrustSignal[],
  mode: "ledger" | "demo",
): string {
  const t = totals(records);
  const built = providers.filter((provider) => provider.status === "built").length;
  const verified = providers.filter((provider) => provider.verified).length;
  const maxOps = Math.max(1, ...lanes.map((lane) => lane.ops));
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://LIFE-COCKPIT//CLI//VIBERS-UNITE"),
    "|----------------------------------------------------------------|",
    frameLine(`${int(t.count)} ops · ${int(t.providers)} active providers · ${int(t.credits)} credits · ${money(t.usd)}`),
    frameLine(`catalog ${providers.length} providers · ${built} built · ${verified} verified · ${trustSignals.length} trust`),
    frameLine(mode === "demo" ? "demo: no writes, no browser open, no upload, no secrets" : "local ledger mode; profile HTML opens only when records exist"),
    frameLine("creator usage | builder NOT USAGE | local-only | regional | manual"),
    frameLine("publish path: dry-run -> Vibers Unite -> c0vibe.app"),
    frameLine("no prompt/content upload; records decide usage; trust explains context"),
    ...lanes.map((lane) => {
      const brand = laneBrand(lane);
      const value = lane.impact === "not_usage"
        ? `${int(lane.ops)} trust`
        : lane.impact === "publish"
          ? `${int(lane.ops)} rows`
          : `${int(lane.ops)} ops ${money(lane.usd)}`;
      return frameLine(`[${brand.mark}] ${fit(lane.label, 15)} ${fit(lane.impact, 10)} ${fit(value, 16)} ${bar(lane.ops, maxOps)}`);
    }),
    "+----------------------------------------------------------------+",
  ].join("\n");
}

function renderLaneTable(lanes: LifeLane[]): string {
  return formatTable(
    ["LANE", "IMPACT", "NOW", "CATALOG", "COMMAND"],
    lanes.map((lane) => [
      lane.label,
      lane.impact === "not_usage" ? "NOT USAGE" : lane.impact,
      lane.impact === "not_usage" ? `${lane.ops} trust` : `${lane.ops} ops ${money(lane.usd)}`,
      `${lane.built}/${lane.catalog} built`,
      lane.command,
    ]),
  );
}

function laneState(lane: LifeLane, mode: "ledger" | "demo"): string {
  if (mode === "demo") return lane.ops > 0 || lane.catalog > 0 ? "DEMO" : "WAIT";
  if (lane.impact === "not_usage") return lane.ops > 0 ? "TRUST" : "READY";
  if (lane.impact === "publish") return lane.ops > 0 ? "DRYRUN" : "LOCKED";
  if (lane.ops > 0) return "LIVE";
  return lane.catalog > 0 ? "READY" : "WAIT";
}

function renderLifeSignalRoom(lanes: LifeLane[], records: NormalizedRecord[], trustSignals: TrustSignal[], mode: "ledger" | "demo"): string {
  const byId = new Map(lanes.map((lane) => [lane.id, lane]));
  const rooms: Array<{ id: LifeLaneId; title: string; motion: string }> = [
    { id: "creator", title: "creator prism", motion: "Higgsfield turn / media receipts" },
    { id: "builder", title: "diff cube", motion: "Codex + GitHub cadence, NOT USAGE" },
    { id: "local", title: "local sonar", motion: "Ollama + LM Studio + ComfyUI loopback" },
    { id: "regional", title: "world rail", motion: "Qwen / Mistral / Kimi labelled confidence" },
    { id: "manual", title: "ledger drawer", motion: "creator seats, PDFs, CSVs, self-report" },
    { id: "publish", title: "C0 relay", motion: "dry-run gate -> c0vibe.app" },
  ];
  const source = mode === "demo" ? "DEMO ONLY" : records.length ? "LOCAL LEDGER" : "NO LEDGER";

  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://LIFE-SIGNAL-ROOM//AI-LIFE//VIBERS-UNITE"),
    "|----------------------------------------------------------------|",
    frameLine("Vibers Unite // c0vibe.app // local proof before publish"),
    frameLine(`${source} · ${int(records.length)} usage rows · ${int(trustSignals.length)} trust signals`),
    frameLine("signal counts are lane views; trust never changes usage totals"),
    ...rooms.map((room) => {
      const lane = byId.get(room.id);
      if (!lane) return frameLine(`[??] ${fit(room.title, 13)} WAIT   missing lane map`);
      const brand = laneBrand(lane);
      const metric = lane.impact === "not_usage"
        ? `${int(lane.ops)} trust`
        : lane.impact === "publish"
          ? `${int(records.length)} rows`
          : `${int(lane.ops)} ops`;
      return frameLine(`[${brand.mark}] ${fit(room.title, 13)} ${fit(laneState(lane, mode), 6)} ${fit(lane.impact, 10)} ${fit(metric, 9)} ${room.motion}`);
    }),
    frameLine("surprise rail: prism -> diff cube -> sonar -> C0 relay"),
    "+----------------------------------------------------------------+",
  ].join("\n");
}

function renderProviderOrbit(records: NormalizedRecord[]): string {
  const rows = aggregate(records, "provider").slice(0, 5);
  if (!rows.length) return "provider orbit waiting for first usage source";
  const max = Math.max(...rows.map((row) => row.raw));
  return rows.map((row) => {
    const brand = providerBrand(row.key);
    return `[${brand.mark}] ${brand.label} ${row.count} ops ${bar(row.raw, max, 8)}`;
  }).join("\n");
}

export function renderLifeCommand(input: RenderLifeCommandInput): string {
  const providers = input.providers ?? PROVIDERS;
  const records = input.records;
  const trustSignals = input.trustSignals ?? [];
  const mode = input.mode ?? "ledger";
  const lanes = (["creator", "builder", "local", "regional", "manual", "publish"] as LifeLaneId[])
    .map((id) => summarizeLane(id, providers, records, trustSignals));
  const topProvider = aggregate(records, "provider")[0]?.key;
  const t = totals(records);

  return [
    renderMissionStrip({
      surface: "life",
      title: "AI life command relay",
      ops: t.count,
      providers: t.providers,
      credits: t.credits,
      usd: t.usd,
      topProvider,
      range: mode === "demo" ? "range offline demo" : records.length ? "range local ledger" : "range no records yet",
      next: mode === "demo" ? "vibetracker init --gui -> real sync" : records.length ? "vibetracker upload --dry-run -> c0vibe.app" : "vibetracker init --gui -> sync",
      empty: !records.length,
    }),
    renderLifeDeck(lanes, records, providers, trustSignals, mode),
    "",
    renderLifeSignalRoom(lanes, records, trustSignals, mode),
    "",
    "AI LIFE LANES",
    renderLaneTable(lanes),
    "",
    "Provider orbit",
    renderProviderOrbit(records),
    "",
    "Guardrails",
    ...lanes.map((lane) => `  - ${lane.label}: ${lane.guardrail}`),
  ].join("\n");
}

function demoRecord(provider: string, category: NormalizedRecord["category"], rawAmount: number, rawUnit: string, usdEst: number | undefined, source: NormalizedRecord["source"], operation: string, model: string): NormalizedRecord {
  return {
    ts: "2026-07-06T12:00:00Z",
    provider,
    category,
    operation,
    model,
    quantity: 1,
    unit: rawUnit === "credits" ? "credit" : rawUnit === "tokens" ? "token" : rawUnit === "seconds" ? "second" : "request",
    rawAmount,
    rawUnit,
    usdEst,
    source,
    confidence: source === "manual" ? "medium" : "high",
    verified: source === "ledger",
  };
}

export function lifeDemoInput(): Pick<RenderLifeCommandInput, "records" | "trustSignals" | "mode"> {
  const records: NormalizedRecord[] = [
    demoRecord("higgsfield", "video", 120, "credits", 18.4, "ledger", "generate_video", "soul-v1"),
    demoRecord("replicate", "image", 44, "seconds", 6.8, "ledger", "prediction", "flux-dev"),
    demoRecord("suno", "music", 30, "credits", 3.2, "feed_recon", "song", "v4"),
    demoRecord("ollama", "llm", 82000, "tokens", undefined, "local", "chat", "llama3.1"),
    demoRecord("comfyui", "image", 18, "request", undefined, "local", "workflow", "sdxl-local"),
    demoRecord("qwen", "llm", 36000, "tokens", 1.4, "ledger", "chat", "qwen-max"),
    demoRecord("mistral", "llm", 21000, "tokens", 1.1, "ledger", "chat", "mistral-large"),
    demoRecord("canva", "image", 1, "request", 12.99, "manual", "monthly-seat", "pro"),
  ];
  const trustSignals: TrustSignal[] = [
    {
      kind: "github_activity",
      source: "github_cli",
      label: "GitHub activity evidence (not AI usage)",
      handle: "demo-viber",
      fetchedAt: "2026-07-06T12:00:00Z",
      from: "2026-04-07T12:00:00Z",
      to: "2026-07-06T12:00:00Z",
      windowDays: 90,
      totalContributions: 418,
      commitContributions: 276,
      issueContributions: 22,
      pullRequestContributions: 44,
      pullRequestReviewContributions: 63,
      repositoryContributions: 13,
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
    },
    {
      kind: "creator_activity",
      source: "manual",
      label: "Creator activity evidence (not AI usage)",
      platform: "youtube",
      handle: "demo-viber",
      metric: "uploads",
      count: 12,
      fetchedAt: "2026-07-06T12:00:00Z",
      windowDays: 30,
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Creator/public activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
    },
  ];
  return { records, trustSignals, mode: "demo" };
}
