import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import { buildVibeScoreReceipt, type VibeScoreReceipt } from "./vibe-score.ts";

export type ProfileHeroBridgeImpact = "score" | "usage" | "not_usage" | "publish";

export interface ProfileHeroBridgeStage {
  id: "score" | "usage" | "rhythm" | "source" | "trust" | "relay";
  label: string;
  value: string;
  route: string;
  note: string;
  guardrail: string;
  impact: ProfileHeroBridgeImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  terminalLine: string;
}

export interface ProfileHeroBridge {
  headline: string;
  subline: string;
  terminalLines: string[];
  shareLine: string;
  totals: {
    score: number;
    usageStages: number;
    notUsageStages: number;
    publishStages: number;
    activeDays: number;
    providers: number;
    usageWrites: number;
  };
  stages: ProfileHeroBridgeStage[];
}

function int(value: number): string {
  return value.toLocaleString("en-US");
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function line(text: string, width = 52): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function meterFrom(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return clamp(Math.round((value / max) * 100));
}

function stage(
  id: ProfileHeroBridgeStage["id"],
  providerId: string,
  stage: Omit<ProfileHeroBridgeStage, "id" | "mark" | "from" | "to" | "ink" | "terminalLine">,
): ProfileHeroBridgeStage {
  const brand = providerBrand(providerId);
  return {
    id,
    ...stage,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    terminalLine: line(`${id.padEnd(7)} ${stage.value} // ${stage.impact === "not_usage" ? "NOT USAGE" : stage.impact.toUpperCase()}`),
  };
}

export function buildProfileHeroBridge(
  profile: ProfileView,
  receipt: VibeScoreReceipt = buildVibeScoreReceipt(profile),
): ProfileHeroBridge {
  const latest = profile.latest;
  const totalOps = latest?.record_count ?? 0;
  const totalUsd = latest?.total_usd ?? 0;
  const activeDays = profile.usageDays.filter((day) => day.ops > 0).length || (latest ? 1 : 0);
  const topProvider = profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops)[0];
  const providerId = topProvider?.provider ?? "c0vibe";
  const trustSignals = profile.trustSignals.length;

  const stages: ProfileHeroBridgeStage[] = [
    stage("score", "c0vibe", {
      label: "Vibe Score",
      value: `${receipt.score}/100`,
      route: "score://receipt",
      note: receipt.headline,
      guardrail: "Score is derived from reviewed aggregate rows plus a labelled trust side rail.",
      impact: "score",
      meter: receipt.score,
    }),
    stage("usage", providerId, {
      label: "Usage mass",
      value: `${int(totalOps)} ops`,
      route: "usage://accepted-aggregate",
      note: `${usd(totalUsd)} estimated spend from accepted usage records.`,
      guardrail: "Usage values come from reviewed aggregate submissions, not trust or social context.",
      impact: "usage",
      meter: meterFrom(totalOps, Math.max(1, totalOps, 1200)),
    }),
    stage("rhythm", providerId, {
      label: "Daily rhythm",
      value: `${int(activeDays)} active day${activeDays === 1 ? "" : "s"}`,
      route: "daily://heatgrid",
      note: profile.usageDays.length ? "Fed by daily aggregate rows." : "Fallback uses upload-day rhythm until daily rows exist.",
      guardrail: "Daily rows are aggregate rhythm data, not raw prompt or output history.",
      impact: "usage",
      meter: meterFrom(activeDays, 30),
    }),
    stage("source", providerId, {
      label: "Source mix",
      value: `${int(profile.providers.length)} provider${profile.providers.length === 1 ? "" : "s"}`,
      route: "provider://fanout",
      note: topProvider ? `Lead provider ${topProvider.provider} at ${usd(topProvider.usd)} est.` : "No provider fanout yet.",
      guardrail: "Provider mix stays usage-only; creator and GitHub context live on the side rail.",
      impact: "usage",
      meter: meterFrom(profile.providers.length, 6),
    }),
    stage("trust", trustSignals ? "github" : "codex-cli", {
      label: "Trust side rail",
      value: `${int(trustSignals)} signal${trustSignals === 1 ? "" : "s"}`,
      route: "trust://not-usage",
      note: "NOT USAGE. Trust context cannot alter spend, credits, ops, rank, or verified status.",
      guardrail: "Trust is visible context only and has zero usage writes.",
      impact: "not_usage",
      meter: trustSignals ? clamp(18 + trustSignals * 18) : 8,
    }),
    stage("relay", "c0vibe", {
      label: "C0VIBE relay",
      value: latest ? "public" : "waiting",
      route: "publish://c0vibe.app",
      note: latest ? "Vibers Unite after reviewed aggregate publish." : "Run the local wizard and review before upload.",
      guardrail: "Public profile relay is explicit; no hidden upload or background publishing.",
      impact: "publish",
      meter: latest ? 100 : 16,
    }),
  ];

  return {
    headline: latest ? `@${profile.handle} signal bridge` : `@${profile.handle} signal bridge waiting`,
    subline: "A first-glance command board that shows how score, usage rhythm, source mix, trust context, and C0VIBE publish stay separated.",
    terminalLines: [
      "+------------------------------------------------------+",
      line(`VTK://PROFILE-HERO-BRIDGE//@${profile.handle}`),
      line(`score ${String(receipt.score).padStart(3, "0")}/100 // ${receipt.tier} // c0vibe.app`),
      line(`usage ${int(totalOps)} ops // ${usd(totalUsd)} est`),
      line(`days ${int(activeDays)} // providers ${int(profile.providers.length)} // top ${providerId}`),
      line(`trust ${int(trustSignals)} NOT USAGE // usageWrites 0`),
      line("Vibers Unite // first-glance profile proof"),
      "+------------------------------------------------------+",
    ],
    shareLine: receipt.shareLine,
    totals: {
      score: receipt.score,
      usageStages: stages.filter((item) => item.impact === "usage" || item.impact === "score").length,
      notUsageStages: stages.filter((item) => item.impact === "not_usage").length,
      publishStages: stages.filter((item) => item.impact === "publish").length,
      activeDays,
      providers: profile.providers.length,
      usageWrites: 0,
    },
    stages,
  };
}
