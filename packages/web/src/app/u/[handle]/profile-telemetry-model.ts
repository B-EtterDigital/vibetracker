import type { ChartDay, ProviderSeries } from "./profile-chart";

export type TelemetryMetric = "usd" | "ops" | "credits";
export type TelemetryRange = 7 | 30 | 90;

export interface TelemetryPoint {
  date: string;
  value: number;
}

export interface TelemetryModel {
  current: TelemetryPoint[];
  previous: TelemetryPoint[];
  currentTotal: number;
  previousTotal: number;
  delta: number;
  deltaPercent: number | null;
  activeDays: number;
  peak: TelemetryPoint;
  lead: { label: string; value: number; delta: number } | null;
  maxBucket: number;
  currentLabel: string;
  previousLabel: string;
}

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TELEMETRY_RANGES: TelemetryRange[] = [7, 30, 90];

function stamp(date: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : Number.NaN;
}

function isoDate(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function shortTelemetryDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}` : date;
}

function metricValue(day: ChartDay | undefined, metric: TelemetryMetric): number {
  const value = day?.[metric] ?? 0;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function providerTotal(provider: ProviderSeries, from: number, to: number, metric: TelemetryMetric): number {
  return provider.days.reduce((total, day) => {
    const time = stamp(day.date);
    return time >= from && time <= to ? total + metricValue(day, metric) : total;
  }, 0);
}

export function buildTelemetryModel(
  days: ChartDay[],
  providers: ProviderSeries[],
  range: TelemetryRange,
  metric: TelemetryMetric,
): TelemetryModel | null {
  const valid = days
    .filter((day) => Number.isFinite(stamp(day.date)))
    .slice()
    .sort((a, b) => stamp(a.date) - stamp(b.date));
  if (valid.length < 2) return null;

  const end = stamp(valid[valid.length - 1].date);
  const currentStart = end - (range - 1) * DAY_MS;
  const previousEnd = currentStart - DAY_MS;
  const previousStart = previousEnd - (range - 1) * DAY_MS;
  const byDate = new Map(valid.map((day) => [day.date, day]));
  const points = (from: number): TelemetryPoint[] => Array.from({ length: range }, (_unused, index) => {
    const date = isoDate(from + index * DAY_MS);
    return { date, value: metricValue(byDate.get(date), metric) };
  });
  const current = points(currentStart);
  const previous = points(previousStart);
  const currentTotal = current.reduce((total, point) => total + point.value, 0);
  const previousTotal = previous.reduce((total, point) => total + point.value, 0);
  const delta = currentTotal - previousTotal;
  const deltaPercent = previousTotal > 0 ? (delta / previousTotal) * 100 : currentTotal > 0 ? null : 0;
  const activeDays = current.filter((point) => point.value > 0).length;
  const peak = current.reduce((best, point) => point.value > best.value ? point : best, current[0]);
  const lead = providers
    .map((provider) => {
      const value = providerTotal(provider, currentStart, end, metric);
      const before = providerTotal(provider, previousStart, previousEnd, metric);
      return { label: provider.label, value, delta: value - before };
    })
    .filter((provider) => provider.value > 0)
    .sort((a, b) => b.value - a.value)[0] ?? null;

  return {
    current,
    previous,
    currentTotal,
    previousTotal,
    delta,
    deltaPercent,
    activeDays,
    peak,
    lead,
    maxBucket: Math.max(1, ...current.map((point) => point.value), ...previous.map((point) => point.value)),
    currentLabel: `${shortTelemetryDate(current[0].date)}–${shortTelemetryDate(current[current.length - 1].date)}`,
    previousLabel: `${shortTelemetryDate(previous[0].date)}–${shortTelemetryDate(previous[previous.length - 1].date)}`,
  };
}
