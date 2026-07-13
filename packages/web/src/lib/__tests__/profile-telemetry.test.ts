import assert from "node:assert/strict";
import test from "node:test";
import type { ChartDay, ProviderSeries } from "../../app/u/[handle]/profile-chart.tsx";
import { buildTelemetryModel } from "../../app/u/[handle]/profile-telemetry-model.ts";

const day = (date: string, value: number): ChartDay => ({ date, usd: value, ops: value * 10, credits: value * 2 });

test("telemetry compares adjacent non-overlapping windows from the latest real day", () => {
  const days = Array.from({ length: 28 }, (_unused, index) => day(`2026-01-${String(index + 1).padStart(2, "0")}`, index + 1));
  const providers: ProviderSeries[] = [
    { id: "alpha", label: "Alpha", color: "#2ee8d6", days },
    { id: "beta", label: "Beta", color: "#ffc64d", days: days.map((entry) => ({ ...entry, usd: entry.usd / 2 })) },
  ];
  const model = buildTelemetryModel(days, providers, 7, "usd");

  assert.ok(model);
  assert.equal(model.current[0].date, "2026-01-22");
  assert.equal(model.previous[0].date, "2026-01-15");
  assert.equal(model.currentTotal, 175);
  assert.equal(model.previousTotal, 126);
  assert.equal(model.delta, 49);
  assert.equal(Number(model.deltaPercent?.toFixed(1)), 38.9);
  assert.deepEqual(model.peak, { date: "2026-01-28", value: 28 });
  assert.equal(model.activeDays, 7);
  assert.deepEqual(model.lead, { label: "Alpha", value: 175, delta: 49 });
});

test("telemetry fills missing dates and sanitizes non-finite or negative quantities", () => {
  const days = [
    day("2026-01-01", 3),
    day("2026-01-08", 8),
    day("2026-01-09", Number.NaN),
    day("2026-01-10", -4),
  ];
  const model = buildTelemetryModel(days, [], 7, "usd");

  assert.ok(model);
  assert.equal(model.current.length, 7);
  assert.equal(model.currentTotal, 8);
  assert.equal(model.previousTotal, 3);
  assert.equal(model.activeDays, 1);
  assert.equal(model.maxBucket, 8);
});

test("telemetry reports a new signal and declines an unusable one-day series", () => {
  const newSignal = buildTelemetryModel([day("2026-01-01", 0), day("2026-01-08", 5)], [], 7, "usd");
  assert.ok(newSignal);
  assert.equal(newSignal.previousTotal, 0);
  assert.equal(newSignal.deltaPercent, null);
  assert.equal(buildTelemetryModel([day("2026-01-08", 5)], [], 7, "usd"), null);
});
