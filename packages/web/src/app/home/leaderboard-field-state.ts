import type { HomeBoardLensId, HomeBoardLensRow } from "./leaderboard-lens";

const LENS_LABELS: Record<HomeBoardLensId, string> = {
  usd: "Spend",
  credits: "Credits",
  ops: "Records",
};

export interface HomeBoardFieldState {
  state: "empty" | "baseline_pending" | "comparable";
  status: string;
  summary: string;
  lensLabel: string;
  rankedCount: number;
  activeCount: number;
  strongestShare: string;
  comparisonReady: boolean;
  points: HomeBoardFieldPoint[];
}

export interface HomeBoardFieldPoint {
  label: string;
  active: boolean;
  share: string;
  x: string;
  y: string;
}

type FieldRow = HomeBoardLensRow & { handle?: string };

function valueFor(row: HomeBoardLensRow, lens: HomeBoardLensId): number {
  if (lens === "credits") return row.credits;
  if (lens === "ops") return row.ops;
  return row.usd;
}

function share(value: number): string {
  return `${(value * 100).toFixed(value >= 0.995 ? 0 : 1)}%`;
}

export function buildHomeBoardFieldState(
  rows: FieldRow[],
  lens: HomeBoardLensId,
): HomeBoardFieldState {
  const lensLabel = LENS_LABELS[lens];
  const values = rows.map((row) => Math.max(0, valueFor(row, lens)));
  const total = values.reduce((sum, value) => sum + value, 0);
  const activeCount = values.filter((value) => value > 0).length;
  const strongestShare = total > 0 ? Math.max(...values) / total : 0;
  const comparisonReady = activeCount >= 2;
  const visibleRows = rows.slice(0, 10);
  const points = visibleRows.map((row, index) => {
    const value = values[index] ?? 0;
    const laneShare = total > 0 ? value / total : 0;
    const x = visibleRows.length === 1 ? 50 : 6 + (index / Math.max(visibleRows.length - 1, 1)) * 88;
    const y = value > 0 ? 10 + laneShare * 76 : 4;
    return {
      label: row.handle ? `@${row.handle}` : `#${index + 1}`,
      active: value > 0,
      share: share(laneShare),
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
    };
  });

  if (activeCount === 0) {
    return {
      state: "empty",
      status: "NO PUBLIC SIGNAL",
      summary: `No operator carries non-zero ${lensLabel.toLowerCase()} in this lane. Nothing is inferred or backfilled.`,
      lensLabel,
      rankedCount: rows.length,
      activeCount,
      strongestShare: "0%",
      comparisonReady,
      points,
    };
  }

  if (!comparisonReady) {
    return {
      state: "baseline_pending",
      status: "BASELINE PENDING",
      summary: `Only one operator carries non-zero ${lensLabel.toLowerCase()}. A 100% lane share describes coverage, not competitive dominance.`,
      lensLabel,
      rankedCount: rows.length,
      activeCount,
      strongestShare: share(strongestShare),
      comparisonReady,
      points,
    };
  }

  return {
    state: "comparable",
    status: "COMPARISON READY",
    summary: `${activeCount} operators carry non-zero ${lensLabel.toLowerCase()}. Compare this lens without changing the official spend-ranked order.`,
    lensLabel,
    rankedCount: rows.length,
    activeCount,
    strongestShare: share(strongestShare),
    comparisonReady,
    points,
  };
}
