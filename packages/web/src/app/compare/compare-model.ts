import type { ProfileView } from "../../lib/data";
import { buildProfileBlackBoxReplay } from "../../lib/profile-proof.ts";
import { profileOps } from "../../lib/profile-ops.ts";
import { buildVibeScoreReceipt } from "../../lib/vibe-score.ts";

export const DEFAULT_LEFT_HANDLE = "b-etterdigital";
export const DEFAULT_RIGHT_HANDLE = "cyrill-etter";

export type CompareSide = "left" | "right" | "tie";

export interface CompareParticipant {
  handle: string;
  profileHref: string;
  identityLabel: string;
  evidenceTier: string;
  rankLabel: string;
  publishedLabel: string;
  fingerprint: string;
  operations: number;
  spendUsd: number;
  credits: number;
  providers: number;
  activeDays: number;
  score: number;
  scoreTier: string;
  trustSignals: number;
  totalTokens: number;
}

export interface CompareMetric {
  id: "operations" | "spend" | "score" | "providers" | "activeDays" | "credits";
  label: string;
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  leftMeter: number;
  rightMeter: number;
  leader: CompareSide;
  deltaLabel: string;
  note: string;
}

export interface CompareProviderRow {
  provider: string;
  leftOps: number;
  rightOps: number;
  leftLabel: string;
  rightLabel: string;
  leftMeter: number;
  rightMeter: number;
  leader: CompareSide;
  presence: "shared" | "left_only" | "right_only";
}

export interface PublicComparisonSnapshot {
  left: CompareParticipant;
  right: CompareParticipant;
  fingerprint: string;
  crossTier: boolean;
  comparisonStatus: string;
  metricRows: CompareMetric[];
  providerRows: CompareProviderRow[];
  commonProviders: number;
  leftOnlyProviders: number;
  rightOnlyProviders: number;
  receipt: string;
  guardrails: string[];
}

function int(value: number): string {
  return Number(value).toLocaleString("en-US");
}

function usd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function upper(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/_/g, " ").toUpperCase() : fallback;
}

function published(value: string | null | undefined): string {
  if (!value) return "NOT PUBLISHED";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "DATE UNAVAILABLE" : date.toISOString().slice(0, 10);
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
}

function identityLabel(profile: ProfileView): string {
  if (profile.identityVerified) return `${upper(profile.identityProvider, "IDENTITY")} VERIFIED`;
  if (profile.accountLinked) return "C0VIBE ACCOUNT LINKED";
  return "PUBLIC HANDLE";
}

function stableFingerprint(parts: string[]): string {
  let hash = 2166136261;
  for (const char of parts.join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function leader(left: number, right: number): CompareSide {
  if (left === right) return "tie";
  return left > right ? "left" : "right";
}

function meters(left: number, right: number): [number, number] {
  const max = Math.max(left, right, 0);
  if (max === 0) return [0, 0];
  return [left > 0 ? Math.max(4, (left / max) * 100) : 0, right > 0 ? Math.max(4, (right / max) * 100) : 0];
}

function metric(
  id: CompareMetric["id"],
  label: string,
  leftValue: number,
  rightValue: number,
  format: (value: number) => string,
  note: string,
): CompareMetric {
  const [leftMeter, rightMeter] = meters(leftValue, rightValue);
  const metricLeader = leader(leftValue, rightValue);
  const difference = Math.abs(leftValue - rightValue);
  return {
    id,
    label,
    leftValue,
    rightValue,
    leftLabel: format(leftValue),
    rightLabel: format(rightValue),
    leftMeter,
    rightMeter,
    leader: metricLeader,
    deltaLabel: metricLeader === "tie" ? "EVEN" : `${metricLeader.toUpperCase()} +${format(difference)}`,
    note,
  };
}

export function sanitizeCompareHandle(value: unknown, fallback: string): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return fallback;
  const normalized = candidate.trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9](?:[a-z0-9_.-]{0,62}[a-z0-9])?$/.test(normalized) ? normalized : fallback;
}

export function buildCompareParticipant(profile: ProfileView): CompareParticipant {
  const score = buildVibeScoreReceipt(profile);
  const proof = buildProfileBlackBoxReplay(profile);
  const evidenceTier = upper(profile.latest?.tier, "NOT SYNCED");
  return {
    handle: profile.handle,
    profileHref: `/u/${encodeURIComponent(profile.handle)}`,
    identityLabel: identityLabel(profile),
    evidenceTier,
    rankLabel: profile.rank && profile.rank > 0 ? `#${int(profile.rank)} ON ${evidenceTier} BOARD` : `UNRANKED ON ${evidenceTier} BOARD`,
    publishedLabel: published(profile.latest?.created_at),
    fingerprint: proof.seal,
    operations: profileOps(profile),
    spendUsd: profile.latest?.total_usd ?? 0,
    credits: profile.latest?.total_credits ?? 0,
    providers: profile.providers.length,
    activeDays: activeDays(profile),
    score: score.score,
    scoreTier: score.tier.toUpperCase(),
    trustSignals: profile.trustSignals.length,
    totalTokens: profile.totalTokens ?? 0,
  };
}

export function buildPublicComparison(leftProfile: ProfileView, rightProfile: ProfileView): PublicComparisonSnapshot {
  const left = buildCompareParticipant(leftProfile);
  const right = buildCompareParticipant(rightProfile);
  const crossTier = left.evidenceTier !== right.evidenceTier;
  const fingerprint = stableFingerprint([left.handle, left.fingerprint, right.handle, right.fingerprint]);
  const metricRows: CompareMetric[] = [
    metric("operations", "Counted operations", left.operations, right.operations, int, "Authoritative provider operation totals; submission row count is fallback only."),
    metric("spend", "Estimated spend", left.spendUsd, right.spendUsd, usd, "Public estimated spend from each latest accepted aggregate."),
    metric("score", "Vibe Score", left.score, right.score, (value) => `${int(value)}/100`, "Same public formula: usage mass, rhythm, breadth, and freshness. Trust adds +0."),
    metric("providers", "Provider breadth", left.providers, right.providers, int, "Number of public provider rollups in the latest receipt."),
    metric("activeDays", "Active days", left.activeDays, right.activeDays, int, "Observed daily aggregate rows, with one upload-day fallback when unavailable."),
    metric("credits", "Native credits", left.credits, right.credits, int, "Provider-native credits are shown as published; they are not converted into operations."),
  ];

  const leftProviders = new Map(leftProfile.providers.map((provider) => [provider.provider, provider.ops]));
  const rightProviders = new Map(rightProfile.providers.map((provider) => [provider.provider, provider.ops]));
  const providers = [...new Set([...leftProviders.keys(), ...rightProviders.keys()])];
  const providerRows = providers.map((provider): CompareProviderRow => {
    const leftOps = leftProviders.get(provider) ?? 0;
    const rightOps = rightProviders.get(provider) ?? 0;
    const [leftMeter, rightMeter] = meters(leftOps, rightOps);
    return {
      provider,
      leftOps,
      rightOps,
      leftLabel: int(leftOps),
      rightLabel: int(rightOps),
      leftMeter,
      rightMeter,
      leader: leader(leftOps, rightOps),
      presence: leftOps > 0 && rightOps > 0 ? "shared" : leftOps > 0 ? "left_only" : "right_only",
    };
  }).sort((a, b) => (b.leftOps + b.rightOps) - (a.leftOps + a.rightOps) || a.provider.localeCompare(b.provider));
  const commonProviders = providerRows.filter((provider) => provider.presence === "shared").length;
  const leftOnlyProviders = providerRows.filter((provider) => provider.presence === "left_only").length;
  const rightOnlyProviders = providerRows.filter((provider) => provider.presence === "right_only").length;
  const comparisonStatus = crossTier
    ? "USAGE COMPARABLE / RANKS STAY ON SEPARATE EVIDENCE BOARDS"
    : "USAGE AND BOARD POSITION SHARE THE SAME EVIDENCE TIER";
  const receiptUrl = `https://vibeusage.c0vibe.app/compare?left=${encodeURIComponent(left.handle)}&right=${encodeURIComponent(right.handle)}`;
  const receipt = [
    `VibeUsage public comparison @${left.handle} vs @${right.handle}`,
    `comparison ${fingerprint}`,
    `left ${left.operations} ops | ${usd(left.spendUsd)} | score ${left.score}/100 | ${left.evidenceTier}`,
    `right ${right.operations} ops | ${usd(right.spendUsd)} | score ${right.score}/100 | ${right.evidenceTier}`,
    `provider_overlap ${commonProviders} shared | ${leftOnlyProviders} left-only | ${rightOnlyProviders} right-only`,
    `trust ${left.trustSignals} vs ${right.trustSignals} (NOT USAGE / +0 SCORE)`,
    `rank_comparison ${crossTier ? "blocked_cross_tier" : "same_tier"}`,
    receiptUrl,
  ].join("\n");

  return {
    left,
    right,
    fingerprint,
    crossTier,
    comparisonStatus,
    metricRows,
    providerRows,
    commonProviders,
    leftOnlyProviders,
    rightOnlyProviders,
    receipt,
    guardrails: [
      "USAGE: operations, estimated spend, credits, provider breadth, and activity compare accepted public aggregates only.",
      "SCORE: both profiles use the same public formula. Trust context contributes +0 points.",
      "NOT USAGE: GitHub and creator signals cannot change operations, spend, credits, score, or rank.",
      crossTier
        ? "RANK: these profiles belong to different evidence boards, so the comparison never declares a rank winner."
        : "RANK: both profiles share an evidence board; their displayed ranks still remain source data, not recalculated here.",
      "PRIVACY: prompts, outputs, secrets, raw files, and individual requests are never loaded by this route.",
    ],
  };
}
