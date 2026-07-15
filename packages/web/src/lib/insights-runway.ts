import type { ProfileView } from "./data";

export type InsightsRunwayState = "under" | "near" | "over";

export interface InsightsRunwayInput {
  forecastUsd: number;
  localShadowUsd: number;
  monthlyCapUsd: number;
  localShiftPercent: number;
}

export interface InsightsRunwaySnapshot {
  projectedUsd: number;
  localOffsetUsd: number;
  adjustedUsd: number;
  varianceUsd: number;
  utilizationPercent: number;
  state: InsightsRunwayState;
  stateLabel: string;
  command: string;
}

export interface InsightsRunwaySource {
  forecastUsd: number;
  observedUsd: number;
  dailyPaceUsd: number;
  localShadowUsd: number;
  topProvider: string;
  activeDays: number;
  idleDays: number;
  observedDays: number;
  windowStart: string | null;
  windowEnd: string | null;
  evidenceBasis: "calendar_window" | "upload_total_fallback";
  providerBasis: "recent_30d" | "profile_totals";
}

export type InsightsEvidenceConfidence = "provisional" | "thin" | "partial" | "broad";

export interface InsightsEvidenceScope {
  confidence: InsightsEvidenceConfidence;
  coveragePercent: number;
  localSensitivityUsd: number;
  projectionMultiplier: number | null;
  scenarioFloorUsd: number;
  unobservedDays: number;
}

const LOCAL_PROVIDERS = new Set(["ollama", "lmstudio", "comfyui", "vllm", "localai", "jan"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayDistance(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

function recentWindow(profile: ProfileView): {
  start: string | null;
  end: string | null;
  days: ProfileView["usageDays"];
  observedDays: number;
} {
  const dated = profile.usageDays
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const end = dated.at(-1)?.date ?? null;
  if (!end) return { start: null, end: null, days: [], observedDays: 0 };
  const cutoff = new Date(Date.parse(`${end}T00:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10);
  const days = dated.filter((day) => day.date >= cutoff && day.date <= end);
  const hasEarlierHistory = dated.some((day) => day.date < cutoff);
  const start = hasEarlierHistory ? cutoff : days[0]?.date ?? end;
  return { start, end, days, observedDays: Math.min(30, dayDistance(start, end)) };
}

function providersForWindow(profile: ProfileView, start: string | null, end: string | null): {
  providers: ProfileView["providers"];
  basis: InsightsRunwaySource["providerBasis"];
} {
  if (!start || !end) return { providers: profile.providers, basis: "profile_totals" };
  const rows = profile.providerDays.filter((day) => day.date >= start && day.date <= end);
  if (!rows.length) return { providers: profile.providers, basis: "profile_totals" };

  const totals = new Map<string, ProfileView["providers"][number]>();
  for (const row of rows) {
    const current = totals.get(row.provider) ?? { provider: row.provider, ops: 0, credits: 0, usd: 0 };
    current.ops += row.ops;
    current.credits += row.credits;
    current.usd += row.usd;
    totals.set(row.provider, current);
  }
  return { providers: [...totals.values()], basis: "recent_30d" };
}

export function buildInsightsRunwaySource(profile: ProfileView): InsightsRunwaySource {
  const window = recentWindow(profile);
  const activeDays = window.days.filter((day) => day.usd > 0);
  const observedUsd = money(activeDays.length
    ? activeDays.reduce((sum, day) => sum + day.usd, 0)
    : profile.latest?.total_usd ?? 0);
  const evidenceBasis: InsightsRunwaySource["evidenceBasis"] = window.observedDays
    ? "calendar_window"
    : "upload_total_fallback";
  const dailyPaceUsd = evidenceBasis === "calendar_window"
    ? money(observedUsd / window.observedDays)
    : 0;
  const providerWindow = providersForWindow(profile, window.start, window.end);
  const localOps = providerWindow.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalProviders = providerWindow.providers.filter(
    (provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()) && provider.ops > 0 && provider.usd > 0,
  );
  const nonLocalOps = nonLocalProviders.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalProviders.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps > 0 ? nonLocalUsd / nonLocalOps : 0;
  const topProvider = providerWindow.providers
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];

  return {
    forecastUsd: evidenceBasis === "calendar_window" ? money((observedUsd / window.observedDays) * 30) : observedUsd,
    observedUsd,
    dailyPaceUsd,
    localShadowUsd: money(localOps * nonLocalRate),
    topProvider: topProvider?.provider ?? "none",
    activeDays: activeDays.length,
    idleDays: Math.max(0, window.observedDays - activeDays.length),
    observedDays: window.observedDays,
    windowStart: window.start,
    windowEnd: window.end,
    evidenceBasis,
    providerBasis: providerWindow.basis,
  };
}

export function buildInsightsRunwaySnapshot(input: InsightsRunwayInput): InsightsRunwaySnapshot {
  const projectedUsd = money(Math.max(0, input.forecastUsd));
  const localShadowUsd = Math.max(0, input.localShadowUsd);
  const monthlyCapUsd = money(Math.max(1, input.monthlyCapUsd));
  const localShiftPercent = Math.round(clamp(input.localShiftPercent, 0, 100));
  const localOffsetUsd = money(localShadowUsd * (localShiftPercent / 100));
  const adjustedUsd = money(Math.max(0, projectedUsd - localOffsetUsd));
  const varianceUsd = money(monthlyCapUsd - adjustedUsd);
  const utilizationPercent = Math.round((adjustedUsd / monthlyCapUsd) * 100);
  const state: InsightsRunwayState = adjustedUsd > monthlyCapUsd
    ? "over"
    : utilizationPercent >= 90
      ? "near"
      : "under";
  const stateLabel = state === "over" ? "over budget" : state === "near" ? "close to the limit" : "inside budget";

  return {
    projectedUsd,
    localOffsetUsd,
    adjustedUsd,
    varianceUsd,
    utilizationPercent,
    state,
    stateLabel,
    command: `npx vibetrack mission --budget ${monthlyCapUsd}`,
  };
}

export function buildInsightsEvidenceScope(source: InsightsRunwaySource): InsightsEvidenceScope {
  const observedDays = clamp(Math.round(source.observedDays), 0, 30);
  const confidence: InsightsEvidenceConfidence = source.evidenceBasis === "upload_total_fallback"
    ? "provisional"
    : observedDays >= 21
      ? "broad"
      : observedDays >= 7
        ? "partial"
        : "thin";

  return {
    confidence,
    coveragePercent: Math.round((observedDays / 30) * 100),
    localSensitivityUsd: money(Math.max(0, source.localShadowUsd) * 0.1),
    projectionMultiplier: observedDays > 0 ? Math.round((30 / observedDays) * 10) / 10 : null,
    scenarioFloorUsd: money(Math.max(0, source.forecastUsd - source.localShadowUsd)),
    unobservedDays: 30 - observedDays,
  };
}
