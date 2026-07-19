export interface NativeUsageMetric {
  provider: string;
  category: string;
  outputUnit: string;
  outputs: number;
  durationSeconds: number;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function pluralUnit(unit: string, count: number): string {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "lyrics") return "lyrics"; // uncountable noun — never "lyricss", at any count
  if (count === 1) return normalized;
  if (normalized === "file") return "files";
  if (normalized === "track") return "tracks";
  if (normalized === "variation") return count === 1 ? "variation" : "variations";
  if (normalized === "image") return "images";
  if (normalized === "clip") return "clips";
  return `${normalized || "output"}s`; // 'import' → 'imports', and any other future op type
}

export function formatMediaDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
  return `${remainder}s`;
}

export function nativeUsageLine(metrics: readonly NativeUsageMetric[] | undefined, category: string): string | null {
  const units = new Map<string, number>();
  let durationSeconds = 0;
  for (const metric of metrics ?? []) {
    if (metric.category !== category) continue;
    if (Number.isFinite(metric.outputs) && metric.outputs >= 0) {
      units.set(metric.outputUnit, (units.get(metric.outputUnit) ?? 0) + metric.outputs);
    }
    if (Number.isFinite(metric.durationSeconds) && metric.durationSeconds >= 0) {
      durationSeconds += metric.durationSeconds;
    }
  }

  const parts = [...units.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([unit, count]) => `${formatCount(count)} ${pluralUnit(unit, count)}`);
  if (durationSeconds > 0) {
    const medium = category === "music" || category === "audio"
      ? "generated audio"
      : category === "video"
        ? "generated footage"
        : "generated media";
    parts.push(`${formatMediaDuration(durationSeconds)} ${medium}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
