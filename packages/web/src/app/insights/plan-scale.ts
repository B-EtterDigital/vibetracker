export interface PlanPreset {
  id: "strict" | "balanced" | "buffer";
  label: string;
  detail: string;
  cap: number;
  shift: number;
}

export interface PlanScale {
  presets: PlanPreset[];
  min: number;
  max: number;
  step: number;
}

function budgetStep(forecastUsd: number): number {
  if (forecastUsd >= 100_000) return 10_000;
  if (forecastUsd >= 10_000) return 1_000;
  if (forecastUsd >= 1_000) return 100;
  if (forecastUsd >= 200) return 25;
  return 10;
}

function roundedBudget(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

export function buildPlanScale(forecastUsd: number): PlanScale {
  const forecast = Number.isFinite(forecastUsd) ? Math.max(0, forecastUsd) : 0;
  const step = budgetStep(forecast);
  const baseline = roundedBudget(forecast || step * 5, step);
  const strict = roundedBudget(baseline * 0.8, step);
  const buffer = roundedBudget(baseline * 1.2, step);
  const max = roundedBudget(Math.max(buffer * 1.75, baseline + step * 8), step);

  return {
    min: step,
    max,
    step,
    presets: [
      { id: "strict", label: "Strict", detail: "tighter limit · 60% local", cap: strict, shift: 60 },
      { id: "balanced", label: "Current pace", detail: "forecast-sized limit · 35% local", cap: baseline, shift: 35 },
      { id: "buffer", label: "More buffer", detail: "20% headroom · 10% local", cap: buffer, shift: 10 },
    ],
  };
}
