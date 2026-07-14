import assert from "node:assert/strict";
import test from "node:test";
import { buildHomeBoardLens, HOME_BOARD_LENSES } from "../../app/home/leaderboard-lens.ts";

const rows = [
  { handle: "alpha", usd: 100, credits: 40, ops: 5, usdLabel: "$100", creditsLabel: "40", opsLabel: "5" },
  { handle: "zero", usd: 0, credits: 20, ops: 0, usdLabel: "$0", creditsLabel: "20", opsLabel: "0" },
  { handle: "tail", usd: 25, credits: 0, ops: 10, usdLabel: "$25", creditsLabel: "0", opsLabel: "10" },
];

test("leaderboard lenses expose spend, credits, and operations without reordering ranks", () => {
  assert.deepEqual(HOME_BOARD_LENSES.map((lens) => lens.id), ["usd", "credits", "ops"]);

  for (const id of ["usd", "credits", "ops"] as const) {
    const lens = buildHomeBoardLens(rows, id);
    assert.deepEqual(lens.rows.map(({ row }) => row.handle), ["alpha", "zero", "tail"]);
  }
});

test("leaderboard lenses normalize each metric against its own real maximum", () => {
  const spend = buildHomeBoardLens(rows, "usd");
  const credits = buildHomeBoardLens(rows, "credits");
  const ops = buildHomeBoardLens(rows, "ops");

  assert.deepEqual(spend.rows.map((row) => [row.barWidth, row.valueLabel]), [["100%", "$100"], ["0%", "$0"], ["25%", "$25"]]);
  assert.deepEqual(credits.rows.map((row) => [row.barWidth, row.valueLabel]), [["100%", "40"], ["50%", "20"], ["0%", "0"]]);
  assert.deepEqual(ops.rows.map((row) => [row.barWidth, row.valueLabel]), [["50%", "5"], ["0%", "0"], ["100%", "10"]]);
});

test("zero-only leaderboard lenses render no synthetic activity", () => {
  const zero = [{ usd: 0, credits: 0, ops: 0, usdLabel: "$0", creditsLabel: "0", opsLabel: "0" }];
  for (const id of ["usd", "credits", "ops"] as const) {
    assert.equal(buildHomeBoardLens(zero, id).rows[0].barWidth, "0%");
  }
});
