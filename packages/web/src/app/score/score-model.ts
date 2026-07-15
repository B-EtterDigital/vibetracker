import type { ProfileView } from "../../lib/data.ts";
import { buildVibeScoreReceipt, type VibeScoreReceipt } from "../../lib/vibe-score.ts";

export interface ScoreLabInput {
  records: number;
  usd: number;
  activeDays: number;
  providers: number;
  freshnessDays: number;
  trustSignals: number;
}

export interface ScoreLabPreset {
  id: "starter" | "studio" | "power";
  label: string;
  detail: string;
  mark: string;
  input: ScoreLabInput;
}

export interface ScoreLabSnapshot {
  profile: ProfileView;
  receipt: VibeScoreReceipt;
  scoringPoints: number;
  scoringMax: number;
  trustContextPoints: number;
}

export interface ScoreSignalBrief {
  headline: string;
  explanation: string;
  equation: string;
  currentLabel: string;
  ceilingLabel: string;
  trustLabel: string;
  strongest: { label: string; value: string; note: string };
  opportunity: { label: string; value: string; note: string };
}

export const SCORE_LAB_PRESETS: readonly ScoreLabPreset[] = [
  {
    id: "starter",
    label: "Fresh start",
    detail: "A few active days and two connected usage sources.",
    mark: "NEW",
    input: { records: 120, usd: 9, activeDays: 3, providers: 2, freshnessDays: 0, trustSignals: 1 },
  },
  {
    id: "studio",
    label: "Creator studio",
    detail: "A mixed three-source workflow with a recent upload.",
    mark: "LAB",
    input: { records: 1200, usd: 42.5, activeDays: 3, providers: 3, freshnessDays: 0, trustSignals: 2 },
  },
  {
    id: "power",
    label: "Power operator",
    detail: "Deep rhythm and broad source coverage near formula max.",
    mark: "MAX",
    input: { records: 8400, usd: 390, activeDays: 30, providers: 7, freshnessDays: 0, trustSignals: 4 },
  },
];

const PROVIDER_IDS = [
  "higgsfield",
  "replicate",
  "ollama",
  "openai",
  "suno",
  "elevenlabs",
  "falai",
  "runway",
  "claude-code",
  "comfyui",
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function normalizeScoreLabInput(input: ScoreLabInput): ScoreLabInput {
  return {
    records: Math.round(clamp(input.records, 0, 10_000)),
    usd: Math.round(clamp(input.usd, 0, 500) * 100) / 100,
    activeDays: Math.round(clamp(input.activeDays, 0, 90)),
    providers: Math.round(clamp(input.providers, 0, PROVIDER_IDS.length)),
    freshnessDays: Math.round(clamp(input.freshnessDays, 0, 90)),
    trustSignals: Math.round(clamp(input.trustSignals, 0, 5)),
  };
}

function dayIso(nowMs: number, daysAgo: number): string {
  return new Date(nowMs - daysAgo * 86_400_000).toISOString().slice(0, 10);
}

export function buildScoreLabProfile(input: ScoreLabInput, nowMs = Date.now()): ProfileView {
  const value = normalizeScoreLabInput(input);
  const hasUsage = value.records > 0;
  const providerCount = hasUsage ? value.providers : 0;
  const dayCount = hasUsage ? value.activeDays : 0;

  const providers: ProfileView["providers"] = Array.from({ length: providerCount }, (_, index) => ({
    provider: PROVIDER_IDS[index],
    ops: Math.max(1, Math.round(value.records / Math.max(1, providerCount))),
    credits: Math.max(0, Math.round(value.records * 0.72 / Math.max(1, providerCount))),
    usd: Math.round(value.usd * 100 / Math.max(1, providerCount)) / 100,
  }));

  const usageDays: ProfileView["usageDays"] = Array.from({ length: dayCount }, (_, index) => ({
    date: dayIso(nowMs, dayCount - index - 1),
    ops: Math.max(1, Math.round(value.records / Math.max(1, dayCount))),
    credits: Math.max(0, Math.round(value.records * 0.72 / Math.max(1, dayCount))),
    usd: Math.round(value.usd * 100 / Math.max(1, dayCount)) / 100,
  }));

  const trustSignals: ProfileView["trustSignals"] = Array.from(
    { length: value.trustSignals },
    (_, index): ProfileView["trustSignals"][number] => ({
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle: "score-lab",
    fetchedAt: new Date(nowMs).toISOString(),
    from: dayIso(nowMs, 29),
    to: dayIso(nowMs, 0),
    windowDays: 30,
    totalContributions: 24 + index * 7,
    commitContributions: 16 + index * 4,
    issueContributions: 2,
    pullRequestContributions: 4 + index,
    pullRequestReviewContributions: 2,
    repositoryContributions: 0,
    days: [],
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
    }),
  );

  return {
    handle: "score-lab",
    created_at: dayIso(nowMs, 120),
    isPremium: false,
    latest: hasUsage ? {
      total_usd: value.usd,
      total_credits: Math.round(value.records * 0.72),
      record_count: value.records,
      created_at: new Date(nowMs - value.freshnessDays * 86_400_000).toISOString(),
      tier: "attested",
    } : null,
    providers,
    usageDays,
    categories: hasUsage ? [{ category: "coding", ops: value.records, credits: Math.round(value.records * 0.72), usd: value.usd }] : [],
    providerDays: [],
    providerModels: [],
    trustSignals,
  };
}

export function buildScoreLabSnapshot(input: ScoreLabInput, nowMs = Date.now()): ScoreLabSnapshot {
  const profile = buildScoreLabProfile(input, nowMs);
  const receipt = buildVibeScoreReceipt(profile);
  const scoringFactors = receipt.factors.filter((factor) => factor.impact === "score");
  const trustFactor = receipt.factors.find((factor) => factor.id === "trust");

  return {
    profile,
    receipt,
    scoringPoints: scoringFactors.reduce((sum, factor) => sum + factor.points, 0),
    scoringMax: scoringFactors.reduce((sum, factor) => sum + factor.max, 0),
    trustContextPoints: trustFactor?.points ?? 0,
  };
}

const FACTOR_ACTION: Record<string, string> = {
  usage: "More accepted records or attached spend can fill this rail.",
  rhythm: "More distinct active days can fill this rail.",
  coverage: "More providers with accepted usage can fill this rail.",
  freshness: "A newer reviewed upload can recover this rail.",
};

export function buildScoreSignalBrief(snapshot: ScoreLabSnapshot): ScoreSignalBrief {
  const scoringFactors = snapshot.receipt.factors.filter((factor) => factor.impact === "score");
  const strongest = [...scoringFactors].sort((left, right) =>
    right.points - left.points || right.max - left.max || left.label.localeCompare(right.label)
  )[0];
  const opportunity = [...scoringFactors].sort((left, right) =>
    (right.max - right.points) - (left.max - left.points) ||
    right.max - left.max ||
    left.label.localeCompare(right.label)
  )[0];
  const trustReserve = Math.max(0, 100 - snapshot.scoringMax);
  const openPoints = opportunity ? Math.max(0, opportunity.max - opportunity.points) : 0;

  return {
    headline: snapshot.receipt.score > 0
      ? `${snapshot.receipt.score} comes from usage. Trust adds zero.`
      : "No reviewed usage means no score yet.",
    explanation:
      `${snapshot.receipt.score}/100 is the raw sum of four accepted-usage rails. ` +
      `Those rails top out at ${snapshot.scoringMax}; the separate ${trustReserve}-point trust lane stays visible but is excluded from scoring.`,
    equation: `${scoringFactors.map((factor) => `${factor.label.toLowerCase()} ${factor.points}`).join(" + ")} = ${snapshot.scoringPoints}`,
    currentLabel: `${snapshot.scoringPoints} usage points`,
    ceilingLabel: `${snapshot.scoringMax} honest ceiling`,
    trustLabel: `${trustReserve} outside score`,
    strongest: {
      label: strongest?.label ?? "Usage rails",
      value: strongest ? `+${strongest.points} / ${strongest.max}` : "+0",
      note: strongest?.note ?? "A reviewed upload starts the formula.",
    },
    opportunity: {
      label: opportunity?.label ?? "Usage rails",
      value: openPoints > 0 ? `${openPoints} points open` : "ceiling reached",
      note: openPoints > 0
        ? FACTOR_ACTION[opportunity?.id ?? ""] ?? "Change the accepted-usage input to inspect this rail."
        : "All accepted-usage rails are saturated; trust still remains +0.",
    },
  };
}
