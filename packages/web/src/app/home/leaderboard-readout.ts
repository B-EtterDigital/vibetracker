export interface BoardReadoutRow {
  handle: string;
  usd: number;
  credits: number;
  ops: number;
  identityVerified: boolean;
}

export interface BoardReadoutSignal {
  id: "concentration" | "unit-cost" | "active-depth" | "identity";
  label: string;
  value: string;
  note: string;
}

export interface BoardReadout {
  summary: string;
  signals: BoardReadoutSignal[];
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function buildLeaderboardReadout(rows: BoardReadoutRow[]): BoardReadout {
  if (!rows.length) {
    return {
      summary: "No ranked signal yet. The field readout will appear after the first valid public usage bundle.",
      signals: [
        { id: "concentration", label: "Spend concentration", value: "—", note: "waiting for ranked spend" },
        { id: "unit-cost", label: "Board unit cost", value: "—", note: "waiting for accepted operations" },
        { id: "active-depth", label: "Active depth", value: "0 / 0", note: "operators carry non-zero usage" },
        { id: "identity", label: "Identity coverage", value: "0 / 0", note: "operators have verified identity" },
      ],
    };
  }

  const totalUsd = rows.reduce((sum, row) => sum + Math.max(0, row.usd), 0);
  const totalOps = rows.reduce((sum, row) => sum + Math.max(0, row.ops), 0);
  const activeRows = rows.filter((row) => row.usd > 0 || row.credits > 0 || row.ops > 0).length;
  const verifiedRows = rows.filter((row) => row.identityVerified).length;
  const leader = rows.reduce((top, row) => row.usd > top.usd ? row : top, rows[0]);
  const concentration = totalUsd > 0 ? Math.max(0, leader.usd) / totalUsd : 0;
  const unitCost = totalOps > 0 ? totalUsd / totalOps : 0;

  const summary = activeRows <= 1
    ? "This is not a competitive field yet: one operator carries the ranked usage."
    : concentration >= 0.75
      ? `The board is top-heavy: @${leader.handle} dominates the current spend signal.`
      : "The ranked usage is distributed enough to compare operators without one profile defining the field.";

  return {
    summary,
    signals: [
      {
        id: "concentration",
        label: "Spend concentration",
        value: percent(concentration),
        note: `of ranked spend belongs to @${leader.handle}`,
      },
      {
        id: "unit-cost",
        label: "Board unit cost",
        value: totalOps > 0 ? `${money.format(unitCost)} / op` : "—",
        note: "estimated USD divided by accepted operations",
      },
      {
        id: "active-depth",
        label: "Active depth",
        value: `${activeRows} / ${rows.length}`,
        note: "operators carry non-zero usage",
      },
      {
        id: "identity",
        label: "Identity coverage",
        value: `${verifiedRows} / ${rows.length}`,
        note: "operators have verified identity",
      },
    ],
  };
}
