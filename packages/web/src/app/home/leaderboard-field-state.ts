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
}

function valueFor(row: HomeBoardLensRow, lens: HomeBoardLensId): number {
  if (lens === "credits") return row.credits;
  if (lens === "ops") return row.ops;
  return row.usd;
}

function share(value: number): string {
  return `${(value * 100).toFixed(value >= 0.995 ? 0 : 1)}%`;
}

export function buildHomeBoardFieldState(
  rows: HomeBoardLensRow[],
  lens: HomeBoardLensId,
): HomeBoardFieldState {
  const lensLabel = LENS_LABELS[lens];
  const values = rows.map((row) => Math.max(0, valueFor(row, lens)));
  const total = values.reduce((sum, value) => sum + value, 0);
  const activeCount = values.filter((value) => value > 0).length;
  const strongestShare = total > 0 ? Math.max(...values) / total : 0;
  const comparisonReady = activeCount >= 2;

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
  };
}
