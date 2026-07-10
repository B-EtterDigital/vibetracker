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
  runwayDays: number;
  state: InsightsRunwayState;
  stateLabel: string;
  capMarkerPercent: number;
  adjustedMarkerPercent: number;
  waveform: number[];
  command: string;
}

export interface InsightsRunwaySource {
  forecastUsd: number;
  localShadowUsd: number;
  topProvider: string;
}

const SIGNAL_SHAPE = [0.56, 0.72, 0.84, 0.66, 0.93, 0.78, 0.61, 0.88, 0.74, 0.98, 0.69, 0.82, 0.64, 0.9, 0.76, 0.58];
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
  const runwayDays = adjustedUsd === 0
    ? 99
    : Math.min(99, Math.max(1, Math.round(monthlyCapUsd / (adjustedUsd / 30))));
  const state: InsightsRunwayState = adjustedUsd > monthlyCapUsd
    ? "over"
    : utilizationPercent >= 90
      ? "near"
      : "under";
  const stateLabel = state === "over" ? "above ceiling" : state === "near" ? "near ceiling" : "inside runway";
  const scaleMax = Math.max(projectedUsd, monthlyCapUsd, 1);
  const capMarkerPercent = Math.round(clamp((monthlyCapUsd / scaleMax) * 100, 6, 96));
  const adjustedMarkerPercent = Math.round(clamp((adjustedUsd / scaleMax) * 100, 4, 98));
  const signalBase = clamp(adjustedMarkerPercent, 18, 92);
  const waveform = SIGNAL_SHAPE.map((shape, index) => {
    const cadence = index % 3 === 0 ? 7 : index % 3 === 1 ? -3 : 3;
    return Math.round(clamp(signalBase * shape + cadence, 12, 96));
  });

  return {
    projectedUsd,
    localOffsetUsd,
    adjustedUsd,
    varianceUsd,
    utilizationPercent,
    runwayDays,
    state,
    stateLabel,
    capMarkerPercent,
    adjustedMarkerPercent,
    waveform,
    command: `vibetracker insights --budget ${monthlyCapUsd} --local-shift ${localShiftPercent} --dry-run`,
  };
}
