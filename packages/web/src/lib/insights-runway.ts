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
  localShadowUsd: number;
  topProvider: string;
}

const LOCAL_PROVIDERS = new Set(["ollama", "lmstudio", "comfyui", "vllm", "localai", "jan"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildInsightsRunwaySource(profile: ProfileView): InsightsRunwaySource {
  const activeDays = profile.usageDays.filter((day) => day.usd > 0);
  const dailyUsd = activeDays.length
    ? activeDays.reduce((sum, day) => sum + day.usd, 0) / activeDays.length
    : profile.latest?.total_usd ?? 0;
  const localOps = profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalProviders = profile.providers.filter(
    (provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()) && provider.ops > 0 && provider.usd > 0,
  );
  const nonLocalOps = nonLocalProviders.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalProviders.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps > 0 ? nonLocalUsd / nonLocalOps : 0;
  const topProvider = profile.providers
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];

  return {
    forecastUsd: money(dailyUsd * 30),
    localShadowUsd: money(localOps * nonLocalRate),
    topProvider: topProvider?.provider ?? "none",
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
    command: `vibetracker insights --budget ${monthlyCapUsd} --local-shift ${localShiftPercent} --dry-run`,
  };
}
