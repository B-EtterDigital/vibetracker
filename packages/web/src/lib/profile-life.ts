import type { ProfileView } from "./data";

type LifeTone = "usage" | "creator" | "builder" | "local" | "regional" | "infra" | "trust" | "publish";
type UsageImpact = "usage" | "not_usage";

export interface ProfileLifeTile {
  id: "spend" | "ops" | "credits" | "providers" | "trust" | "relay";
  label: string;
  value: string;
  note: string;
  tone: LifeTone;
  usageImpact: UsageImpact;
}

export interface ProfileLifeLane {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: LifeTone;
  meter: number;
  providerIds: string[];
  usageImpact: UsageImpact;
}

export interface ProfileLifeDashboard {
  headline: string;
  subline: string;
  terminalLines: string[];
  tiles: ProfileLifeTile[];
  lanes: ProfileLifeLane[];
}

const CREATOR = new Set([
  "higgsfield", "replicate", "falai", "runway", "luma", "elevenlabs", "suno", "udio", "kling",
  "midjourney", "canva", "adobe-firefly", "heygen", "synthesia", "comfyui",
]);
const BUILDER = new Set([
  "claude-code", "codex", "codex-cli", "github", "github-cli", "antigravity", "augment", "roo-code",
  "gemini-cli", "cursor", "windsurf", "aider", "copilot", "devin", "v0", "bolt", "lovable",
]);
const LOCAL = new Set([
  "ollama", "lmstudio", "comfyui", "vllm", "localai", "jan", "gpt4all", "llama-cpp", "automatic1111",
  "forge", "invokeai", "fooocus", "diffusers-local", "text-generation-webui",
]);
const REGIONAL = new Set([
  "qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity", "zai",
  "glm", "zhipu", "baidu-wenxin", "tencent-hunyuan", "iflytek-spark", "sarvam", "upstage",
]);
const INFRA = new Set(["runpod", "browserbase", "vercel", "github-actions", "supabase", "cloudflare", "netlify"]);

function int(n: number | null | undefined): string {
  return n == null ? "0" : Number(n).toLocaleString("en-US");
}

function usd(n: number | null | undefined): string {
  return `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(6, Math.min(100, Math.round((part / total) * 100)));
}

function laneFor(provider: string): { id: string; label: string; tone: LifeTone } {
  const id = provider.toLowerCase();
  if (LOCAL.has(id)) return { id: "local", label: "Local AI lab", tone: "local" };
  if (BUILDER.has(id)) return { id: "builder", label: "Builder agents", tone: "builder" };
  if (CREATOR.has(id)) return { id: "creator", label: "Creator studio", tone: "creator" };
  if (REGIONAL.has(id)) return { id: "regional", label: "Regional AI", tone: "regional" };
  if (INFRA.has(id)) return { id: "infra", label: "AI infrastructure", tone: "infra" };
  return { id: "usage", label: "General AI usage", tone: "usage" };
}

export function buildProfileLifeDashboard(profile: ProfileView): ProfileLifeDashboard {
  const latest = profile.latest;
  const providers = profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider));
  const top = providers[0];
  const totalUsd = latest?.total_usd ?? 0;
  const totalOps = latest?.record_count ?? 0;
  const totalCredits = latest?.total_credits ?? 0;
  const trustCount = profile.trustSignals.length;
  const tier = (latest?.tier ?? "not_synced").replace(/_/g, " ");

  const laneMap = new Map<string, { label: string; tone: LifeTone; usd: number; ops: number; credits: number; providerIds: string[] }>();
  for (const provider of providers) {
    const meta = laneFor(provider.provider);
    const lane = laneMap.get(meta.id) ?? { label: meta.label, tone: meta.tone, usd: 0, ops: 0, credits: 0, providerIds: [] };
    lane.usd += provider.usd;
    lane.ops += provider.ops;
    lane.credits += provider.credits;
    lane.providerIds.push(provider.provider);
    laneMap.set(meta.id, lane);
  }

  const lanes: ProfileLifeLane[] = [...laneMap.entries()]
    .map(([id, lane]) => ({
      id,
      label: lane.label,
      value: lane.usd > 0 ? usd(lane.usd) : `${int(lane.ops)} ops`,
      note: `${int(lane.ops)} ops across ${lane.providerIds.length} provider${lane.providerIds.length === 1 ? "" : "s"}.`,
      tone: lane.tone,
      meter: pct(lane.usd || lane.ops, totalUsd || totalOps),
      providerIds: lane.providerIds.slice(0, 5),
      usageImpact: "usage" as const,
    }))
    .sort((a, b) => b.meter - a.meter || a.label.localeCompare(b.label));

  lanes.push({
    id: "trust",
    label: "Trust side rail",
    value: int(trustCount),
    note: "GitHub and creator cadence explain context but never change spend, credits, rank, or verified usage.",
    tone: "trust",
    meter: trustCount ? Math.min(100, 24 + trustCount * 16) : 8,
    providerIds: [],
    usageImpact: "not_usage",
  });

  const tiles: ProfileLifeTile[] = [
    { id: "spend", label: "AI spend", value: latest ? usd(totalUsd) : "$0.00", note: "Usage datastream only.", tone: "usage", usageImpact: "usage" },
    { id: "ops", label: "Operations", value: int(totalOps), note: "Messages, generations, jobs.", tone: "builder", usageImpact: "usage" },
    { id: "credits", label: "Credits", value: int(totalCredits), note: "Provider-native units.", tone: "creator", usageImpact: "usage" },
    { id: "providers", label: "Source mix", value: int(providers.length), note: top ? `Top source: ${top.provider}.` : "No provider rows yet.", tone: "local", usageImpact: "usage" },
    { id: "trust", label: "Trust signals", value: int(trustCount), note: "NOT USAGE. Side evidence only.", tone: "trust", usageImpact: "not_usage" },
    { id: "relay", label: "C0VIBE relay", value: tier.toUpperCase(), note: "Vibers Unite at c0vibe.app.", tone: "publish", usageImpact: "not_usage" },
  ];

  const terminalLines = [
    `$ vibetracker profile @${profile.handle} --public`,
    latest ? `[usage] ${int(totalOps)} ops / ${usd(totalUsd)} / ${int(providers.length)} providers` : "[usage] no uploaded usage bundle yet",
    `[mix] ${lanes.filter((lane) => lane.usageImpact === "usage").map((lane) => `${lane.id}:${lane.value}`).join(" | ") || "waiting for first provider"}`,
    `[trust] ${int(trustCount)} signals // NOT USAGE // rank impact none`,
    `[relay] Vibers Unite // c0vibe.app // ${tier}`,
  ];

  return {
    headline: latest ? `${usd(totalUsd)} across ${int(totalOps)} operations` : "No usage bundle published yet",
    subline: top ? `${top.provider} leads the current public mix.` : "Connect and upload from the local wizard to light up this profile.",
    terminalLines,
    tiles,
    lanes,
  };
}
