import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";

export type ProfileSignalTone = "usage" | "creator" | "builder" | "local" | "regional" | "trust" | "publish";
export type ProfileSignalImpact = "usage" | "not_usage" | "publish";

export interface ProfileSignalNode {
  id: string;
  label: string;
  mark: string;
  value: string;
  note: string;
  tone: ProfileSignalTone;
  impact: ProfileSignalImpact;
  meter: number;
  x: number;
  y: number;
  brandFrom: string;
  brandTo: string;
  brandInk: string;
}

export interface ProfileSignalLegendItem {
  label: string;
  note: string;
  impact: ProfileSignalImpact;
}

export interface ProfileSignalConstellation {
  headline: string;
  subline: string;
  terminalLines: string[];
  nodes: ProfileSignalNode[];
  legend: ProfileSignalLegendItem[];
}

const CREATOR = new Set(["higgsfield", "replicate", "falai", "runway", "suno", "udio", "elevenlabs", "midjourney", "canva", "adobe-firefly"]);
const BUILDER = new Set(["claude-code", "codex-cli", "codex", "antigravity", "augment", "roo-code", "github"]);
const LOCAL = new Set(["ollama", "lmstudio", "comfyui", "vllm"]);
const REGIONAL = new Set(["qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton"]);
const POSITIONS = [
  [18, 24],
  [42, 13],
  [68, 22],
  [82, 48],
  [60, 72],
  [32, 74],
  [14, 52],
] as const;

function toneFor(providerId: string): ProfileSignalTone {
  const id = providerId.toLowerCase();
  if (CREATOR.has(id)) return "creator";
  if (BUILDER.has(id)) return "builder";
  if (LOCAL.has(id)) return "local";
  if (REGIONAL.has(id)) return "regional";
  return "usage";
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: value >= 100 ? 0 : 2 })}`;
}

function clampMeter(value: number): number {
  return Math.max(24, Math.min(100, Math.round(value)));
}

export function buildProfileSignalConstellation(profile: ProfileView): ProfileSignalConstellation {
  const providers = profile.providers
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))
    .slice(0, POSITIONS.length);
  const maxUsd = Math.max(...providers.map((provider) => provider.usd), 0);
  const maxOps = Math.max(...providers.map((provider) => provider.ops), 1);
  const nodes = providers.map<ProfileSignalNode>((provider, index) => {
    const brand = providerBrand(provider.provider);
    const meterBase = maxUsd > 0 ? (provider.usd / maxUsd) * 100 : (provider.ops / maxOps) * 100;
    const position = POSITIONS[index];
    return {
      id: `provider-${provider.provider}`,
      label: provider.provider,
      mark: brand.mark,
      value: provider.usd > 0 ? usd(provider.usd) : `${provider.ops.toLocaleString("en-US")} ops`,
      note: `${provider.ops.toLocaleString("en-US")} ops feed usage totals.`,
      tone: toneFor(provider.provider),
      impact: "usage",
      meter: clampMeter(meterBase),
      x: position[0],
      y: position[1],
      brandFrom: brand.from,
      brandTo: brand.to,
      brandInk: brand.ink,
    };
  });

  const trustCount = profile.trustSignals.length;
  const latestTier = profile.latest?.tier ?? "not_synced";
  const trustBrand = providerBrand("github");
  nodes.push({
    id: "trust-side-rail",
    label: "Trust side rail",
    mark: "NO",
    value: `${trustCount.toLocaleString("en-US")} signals`,
    note: "Activity evidence only. It never changes spend, credits, operations, or rank.",
    tone: "trust",
    impact: "not_usage",
    meter: trustCount ? 74 : 28,
    x: 48,
    y: 44,
    brandFrom: trustBrand.from,
    brandTo: trustBrand.to,
    brandInk: trustBrand.ink,
  });

  nodes.push({
    id: "c0vibe-relay",
    label: "C0VIBE relay",
    mark: "C0",
    value: latestTier.replace(/_/g, " "),
    note: "Public profile relay appears only after local review and upload.",
    tone: "publish",
    impact: "publish",
    meter: profile.latest ? 88 : 32,
    x: 50,
    y: 92,
    brandFrom: "#36e39b",
    brandTo: "#2ee8d6",
    brandInk: "#071013",
  });

  const usageNodes = nodes.filter((node) => node.impact === "usage").length;
  return {
    headline: "Profile signal constellation",
    subline: usageNodes
      ? `${usageNodes} usage nodes orbit separately from ${trustCount.toLocaleString("en-US")} trust signals.`
      : "No usage nodes yet. The constellation waits for a local sync and reviewed upload.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://PROFILE-CONSTELLATION//PUBLIC//C0VIBE.APP      |",
      "|------------------------------------------------------|",
      `| handle   @${fit(profile.handle, 43)} |`,
      `| usage    ${fit(`${usageNodes} nodes`, 43)} |`,
      `| trust    ${fit(`${trustCount} signals // NOT USAGE`, 43)} |`,
      `| publish  ${fit(latestTier.replace(/_/g, " "), 43)} |`,
      "| motto    VIBERS UNITE                                |",
      "+------------------------------------------------------+",
    ],
    nodes,
    legend: [
      { label: "Usage", note: "Provider spend, credits, and operations count here.", impact: "usage" },
      { label: "Trust", note: "GitHub and creator cadence stay separate: NOT USAGE.", impact: "not_usage" },
      { label: "Publish", note: "C0VIBE profile relay reflects reviewed upload state.", impact: "publish" },
    ],
  };
}
