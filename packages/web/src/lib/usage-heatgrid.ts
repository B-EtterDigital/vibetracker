import type { ProfileView } from "./data.ts";
import { GITHUB_LEVEL_COLORS } from "./profile-trust.ts";

export interface UsageHeatgridCell {
  date: string;
  ops: number;
  usd: number;
  credits: number;
  level: 0 | 1 | 2 | 3 | 4;
  color: (typeof GITHUB_LEVEL_COLORS)[number];
}

export interface UsageHeatgridFillStage {
  sequence: number;
  date: string;
  label: string;
  ops: number;
  usd: number;
  credits: number;
  level: 1 | 2 | 3 | 4;
  color: (typeof GITHUB_LEVEL_COLORS)[number];
  terminalLine: string;
}

export interface UsageHeatgrid {
  headline: string;
  subline: string;
  source: "daily_aggregates" | "upload_day_fallback" | "empty";
  pad: number;
  cells: UsageHeatgridCell[];
  fillStages: UsageHeatgridFillStage[];
  terminalLines: string[];
  totals: {
    activeDays: number;
    ops: number;
    usd: number;
    credits: number;
    peakOps: number;
  };
}

const DAY_MS = 86_400_000;

function dateOnly(value: string | null | undefined): string {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : "";
}

function addDays(date: string, days: number): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  return new Date(parsed + days * DAY_MS).toISOString().slice(0, 10);
}

function levelFor(ops: number, peak: number): 0 | 1 | 2 | 3 | 4 {
  if (ops <= 0 || peak <= 0) return 0;
  const ratio = ops / peak;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function int(value: number): string {
  return value.toLocaleString("en-US");
}

function fillLabel(level: UsageHeatgridFillStage["level"]): string {
  if (level === 1) return "low fill";
  if (level === 2) return "steady fill";
  if (level === 3) return "hot fill";
  return "peak fill";
}

function cellRows(profile: ProfileView): Array<{ date: string; ops: number; usd: number; credits: number }> {
  if (profile.usageDays.length) {
    return profile.usageDays.map((day) => ({
      date: day.date,
      ops: day.ops,
      usd: day.usd,
      credits: day.credits,
    }));
  }
  if (!profile.latest) return [];
  return [{
    date: dateOnly(profile.latest.created_at),
    ops: profile.latest.record_count,
    usd: profile.latest.total_usd,
    credits: profile.latest.total_credits,
  }].filter((row) => row.date);
}

export function buildUsageHeatgrid(profile: ProfileView, windowDays = 91): UsageHeatgrid {
  const rows = cellRows(profile).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
  const source = profile.usageDays.length ? "daily_aggregates" : profile.latest ? "upload_day_fallback" : "empty";
  const end = rows.at(-1)?.date || dateOnly(profile.latest?.created_at) || new Date().toISOString().slice(0, 10);
  const start = addDays(end, -(Math.max(1, windowDays) - 1));
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const visibleRows = Array.from({ length: Math.max(1, windowDays) }, (_, index) => {
    const date = addDays(start, index);
    return byDate.get(date) ?? { date, ops: 0, usd: 0, credits: 0 };
  });
  const peakOps = Math.max(0, ...visibleRows.map((row) => row.ops));
  const cells = visibleRows.map<UsageHeatgridCell>((row) => {
    const level = levelFor(row.ops, peakOps);
    return { ...row, level, color: GITHUB_LEVEL_COLORS[level] };
  });
  const fillStages = cells
    .filter((cell): cell is UsageHeatgridCell & { level: 1 | 2 | 3 | 4 } => cell.level > 0)
    .slice(-8)
    .map<UsageHeatgridFillStage>((cell, index) => {
      const sequence = index + 1;
      const label = fillLabel(cell.level);
      return {
        sequence,
        date: cell.date,
        label,
        ops: cell.ops,
        usd: cell.usd,
        credits: cell.credits,
        level: cell.level,
        color: cell.color,
        terminalLine: `fill ${String(sequence).padStart(2, "0")}/${String(Math.min(8, cells.filter((candidate) => candidate.ops > 0).length)).padStart(2, "0")} ${cell.date} L${cell.level} ${int(cell.ops)} ops ${money(cell.usd)}`,
      };
    });
  const totals = {
    activeDays: cells.filter((cell) => cell.ops > 0).length,
    ops: visibleRows.reduce((sum, row) => sum + row.ops, 0),
    usd: Number(visibleRows.reduce((sum, row) => sum + row.usd, 0).toFixed(2)),
    credits: visibleRows.reduce((sum, row) => sum + row.credits, 0),
    peakOps,
  };
  const pad = new Date(`${start}T00:00:00Z`).getUTCDay();
  const sourceLabel = source === "daily_aggregates" ? "daily aggregate rows" : source === "upload_day_fallback" ? "upload-day aggregate fallback" : "waiting for usage upload";

  return {
    headline: source === "empty" ? "Usage heatgrid waiting for first upload" : `${int(totals.activeDays)} active day${totals.activeDays === 1 ? "" : "s"} in public rhythm`,
    subline: source === "daily_aggregates"
      ? "Daily aggregate rows feed this grid; GitHub activity remains a separate not-usage rail."
      : source === "upload_day_fallback"
        ? "Only upload-level aggregate data exists, so the grid lights the sync day without inventing daily history."
        : "Sync locally and upload reviewed aggregates to light up the public usage rhythm.",
    source,
    pad,
    cells,
    fillStages,
    terminalLines: [
      `VTK://USAGE-HEATGRID//${source.toUpperCase()}//OFFICIAL-GH-COLORS`,
      `source ${sourceLabel}`,
      `active ${int(totals.activeDays)}d // ops ${int(totals.ops)} // est ${money(totals.usd)}`,
      `fill replay ${fillStages.length} stage(s) // visual only // official GitHub scale`,
      "trust heatgrids stay NOT USAGE on the proof side rail",
    ],
    totals,
  };
}

export { GITHUB_LEVEL_COLORS };
