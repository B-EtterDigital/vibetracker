import assert from "node:assert/strict";
import test from "node:test";
import { buildHomeBoardFieldState } from "../../app/home/leaderboard-field-state.ts";

const empty = { usd: 0, credits: 0, ops: 0, usdLabel: "$0", creditsLabel: "0", opsLabel: "0" };

test("a one-operator field describes coverage without claiming competition", () => {
  const field = buildHomeBoardFieldState([{ ...empty, handle: "alpha", usd: 125 }], "usd");

  assert.equal(field.state, "baseline_pending");
  assert.equal(field.strongestShare, "100%");
  assert.equal(field.activeCount, 1);
  assert.equal(field.comparisonReady, false);
  assert.deepEqual(field.points, [{ label: "@alpha", active: true, share: "100%", x: "50.00%", y: "86.00%" }]);
  assert.match(field.summary, /coverage, not competitive dominance/);
});

test("comparison becomes ready only with two non-zero signals in the selected lens", () => {
  const rows = [
    { ...empty, usd: 75, credits: 10 },
    { ...empty, usd: 25, credits: 0 },
  ];

  const spend = buildHomeBoardFieldState(rows, "usd");
  const credits = buildHomeBoardFieldState(rows, "credits");

  assert.equal(spend.state, "comparable");
  assert.equal(spend.strongestShare, "75.0%");
  assert.equal(spend.comparisonReady, true);
  assert.deepEqual(spend.points.map((point) => point.share), ["75.0%", "25.0%"]);
  assert.deepEqual(spend.points.map((point) => point.x), ["6.00%", "94.00%"]);
  assert.equal(credits.state, "baseline_pending");
  assert.equal(credits.comparisonReady, false);
});

test("zero-only field state never invents a signal", () => {
  const field = buildHomeBoardFieldState([empty, empty], "ops");

  assert.equal(field.state, "empty");
  assert.equal(field.strongestShare, "0%");
  assert.equal(field.activeCount, 0);
  assert.ok(field.points.every((point) => point.active === false && point.y === "4.00%"));
  assert.match(field.summary, /Nothing is inferred or backfilled/);
});
