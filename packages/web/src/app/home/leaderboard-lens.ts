export const HOME_BOARD_LENSES = [
  { id: "usd", label: "Spend", title: "Spend runway", meta: "ESTIMATED USD // DISPLAY LENS" },
  { id: "credits", label: "Credits", title: "Credit runway", meta: "NATIVE CREDITS // DISPLAY LENS" },
  { id: "ops", label: "Records", title: "Record runway", meta: "ACCEPTED NORMALIZED RECORDS // DISPLAY LENS" },
] as const;

export type HomeBoardLensId = (typeof HOME_BOARD_LENSES)[number]["id"];

export interface HomeBoardLensRow {
  usd: number;
  credits: number;
  ops: number;
  usdLabel: string;
  creditsLabel: string;
  opsLabel: string;
}

export interface HomeBoardLens<T extends HomeBoardLensRow> {
  id: HomeBoardLensId;
  title: string;
  meta: string;
  rows: Array<{
    row: T;
    barWidth: string;
    valueLabel: string;
  }>;
}

function valueFor(row: HomeBoardLensRow, lens: HomeBoardLensId): number {
  if (lens === "credits") return row.credits;
  if (lens === "ops") return row.ops;
  return row.usd;
}

function labelFor(row: HomeBoardLensRow, lens: HomeBoardLensId): string {
  if (lens === "credits") return row.creditsLabel;
  if (lens === "ops") return row.opsLabel;
  return row.usdLabel;
}

export function buildHomeBoardLens<T extends HomeBoardLensRow>(rows: T[], lens: HomeBoardLensId): HomeBoardLens<T> {
  const config = HOME_BOARD_LENSES.find((item) => item.id === lens) ?? HOME_BOARD_LENSES[0];
  const visible = rows.slice(0, 10);
  const maxValue = Math.max(...visible.map((row) => valueFor(row, lens)), 1);

  return {
    id: config.id,
    title: config.title,
    meta: config.meta,
    rows: visible.map((row) => {
      const value = valueFor(row, lens);
      return {
        row,
        barWidth: value <= 0 ? "0%" : `${Math.max((value / maxValue) * 100, 1.5)}%`,
        valueLabel: labelFor(row, lens),
      };
    }),
  };
}
