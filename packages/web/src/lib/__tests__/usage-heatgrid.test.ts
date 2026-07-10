import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUsageHeatgrid, GITHUB_LEVEL_COLORS } from "../usage-heatgrid.ts";
import type { ProfileView } from "../data.ts";

const baseProfile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 30.5,
    total_credits: 420,
    record_count: 1200,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 300, credits: 250, usd: 20 },
    { provider: "codex-cli", ops: 700, credits: 120, usd: 8 },
    { provider: "ollama", ops: 200, credits: 50, usd: 2.5 },
  ],
  usageDays: [
    { date: "2026-07-01", ops: 10, credits: 5, usd: 0.5 },
    { date: "2026-07-02", ops: 50, credits: 15, usd: 2 },
    { date: "2026-07-03", ops: 100, credits: 25, usd: 8 },
  ],
  trustSignals: [],
};

test("usage heatgrid uses official GitHub contribution colors for usage rhythm", () => {
  const grid = buildUsageHeatgrid(baseProfile, 7);

  assert.equal(GITHUB_LEVEL_COLORS[0], "#161b22");
  assert.equal(GITHUB_LEVEL_COLORS[4], "#39d353");
  assert.equal(grid.source, "daily_aggregates");
  assert.equal(grid.cells.length, 7);
  assert.equal(grid.cells.some((cell) => cell.level === 4 && cell.color === "#39d353"), true);
  assert.equal(grid.cells.every((cell) => GITHUB_LEVEL_COLORS.includes(cell.color)), true);
  assert.equal(grid.fillStages.every((stage) => GITHUB_LEVEL_COLORS.includes(stage.color)), true);
  assert.match(grid.terminalLines.join("\n"), /OFFICIAL-GH-COLORS/);
});

test("usage heatgrid exposes a deterministic official-color fill replay", () => {
  const grid = buildUsageHeatgrid(baseProfile, 7);

  assert.deepEqual(grid.fillStages.map((stage) => stage.date), [
    "2026-07-01",
    "2026-07-02",
    "2026-07-03",
  ]);
  assert.deepEqual(grid.fillStages.map((stage) => stage.sequence), [1, 2, 3]);
  assert.deepEqual(grid.fillStages.map((stage) => stage.level), [1, 2, 4]);
  assert.equal(grid.fillStages[0]?.label, "low fill");
  assert.equal(grid.fillStages[2]?.label, "peak fill");
  assert.match(grid.fillStages[2]?.terminalLine ?? "", /fill 03\/03 2026-07-03 L4 100 ops \$8\.00/);
  assert.match(grid.terminalLines.join("\n"), /fill replay 3 stage\(s\) \/\/ visual only \/\/ official GitHub scale/);
  assert.match(grid.terminalLines.join("\n"), /trust heatgrids stay NOT USAGE/);
});

test("usage heatgrid prefers daily aggregates and summarizes only usage totals", () => {
  const grid = buildUsageHeatgrid(baseProfile, 7);

  assert.equal(grid.totals.activeDays, 3);
  assert.equal(grid.totals.ops, 160);
  assert.equal(grid.totals.usd, 10.5);
  assert.equal(grid.totals.credits, 45);
  assert.match(grid.subline, /Daily aggregate rows/);
  assert.match(grid.terminalLines.join("\n"), /trust heatgrids stay NOT USAGE/);
});

test("usage heatgrid falls back to upload day without inventing history", () => {
  const grid = buildUsageHeatgrid({ ...baseProfile, usageDays: [] }, 7);

  assert.equal(grid.source, "upload_day_fallback");
  assert.equal(grid.totals.activeDays, 1);
  assert.equal(grid.totals.ops, 1200);
  assert.equal(grid.cells.filter((cell) => cell.ops > 0)[0]?.date, "2026-07-05");
  assert.equal(grid.fillStages.length, 1);
  assert.match(grid.fillStages[0]?.terminalLine ?? "", /fill 01\/01 2026-07-05 L4 1,200 ops \$30\.50/);
  assert.match(grid.subline, /without inventing daily history/);
});

test("usage heatgrid empty state does not create usage cells", () => {
  const grid = buildUsageHeatgrid({ ...baseProfile, latest: null, providers: [], usageDays: [] }, 7);

  assert.equal(grid.source, "empty");
  assert.equal(grid.totals.activeDays, 0);
  assert.equal(grid.totals.ops, 0);
  assert.equal(grid.cells.every((cell) => cell.level === 0), true);
  assert.equal(grid.fillStages.length, 0);
});
