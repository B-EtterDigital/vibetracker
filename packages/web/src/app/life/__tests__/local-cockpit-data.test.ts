import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCockpitSnapshot, parseLocalInsights, parseLocalStats } from "../local-cockpit-data.ts";

test("local cockpit derives a bounded view from aggregate payloads only", () => {
  const stats = parseLocalStats({
    range: { from: "2026-07-01T00:00:00Z", to: "2026-07-14T00:00:00Z" },
    totals: { count: 14, credits: 20, usd: 100, providers: 2 },
    byProvider: [
      { key: "codex-cli", count: 10, ops: 80, raw: 80, usd: 75 },
      { key: "higgsfield", count: 4, ops: 20, raw: 20, usd: 25 },
    ],
    byDay: [
      { key: "2026-07-13", count: 6, ops: 40, raw: 40, usd: 30 },
      { key: "2026-07-14", count: 8, ops: 60, raw: 60, usd: 70 },
    ],
    localSavingsUsd: 12,
    rawPrompt: "must be ignored",
  });
  const insights = parseLocalInsights({
    generatedAt: "2026-07-14T01:00:00Z",
    forecast: { trailingDays: 30, dailyAvgUsd: 3.33, projected30dUsd: 99.9 },
    alerts: ["top workflow dominates spend"],
    expensiveWorkflows: [{ key: "codex-cli/coding/session", records: 10, usd: 75 }],
    overlaps: [{ category: "coding", providers: ["codex-cli", "claude-code"] }],
    localSavingsUsd: 12,
  });
  const snapshot = buildCockpitSnapshot(stats, insights);

  assert.equal(snapshot.totals.operations, 100);
  assert.equal(snapshot.totals.projected30dUsd, 99.9);
  assert.equal(snapshot.providers[0].share, 75);
  assert.equal(snapshot.providers[0].spendShare, 75);
  assert.equal(snapshot.providers[0].recordsShare, 10 / 14 * 100);
  assert.equal(snapshot.providers[0].costPerRecord, 7.5);
  assert.equal(snapshot.daily[1].level, 100);
  assert.equal(snapshot.daily[1].spendLevel, 100);
  assert.equal(snapshot.daily[1].recordsLevel, 100);
  assert.equal(snapshot.workflows[0].key, "codex-cli/coding/session");
  assert.equal("rawPrompt" in snapshot, false);
});

test("local cockpit preserves separate spend and accepted-record lenses", () => {
  const stats = parseLocalStats({
    range: {},
    totals: { count: 10, credits: 0, usd: 10, providers: 2 },
    byProvider: [
      { key: "high-spend", count: 1, ops: 10, usd: 9 },
      { key: "high-volume", count: 9, ops: 90, usd: 1 },
    ],
    byDay: [
      { key: "2026-07-13", count: 9, ops: 90, usd: 1 },
      { key: "2026-07-14", count: 1, ops: 10, usd: 9 },
    ],
  });
  const insights = parseLocalInsights({ forecast: {}, generatedAt: "2026-07-14T00:00:00Z" });
  const snapshot = buildCockpitSnapshot(stats, insights);

  assert.equal(snapshot.providers[0].spendShare, 90);
  assert.equal(snapshot.providers[0].recordsShare, 10);
  assert.equal(snapshot.providers[1].spendShare, 10);
  assert.equal(snapshot.providers[1].recordsShare, 90);
  assert.equal(snapshot.daily[0].spendLevel, 100 / 9);
  assert.equal(snapshot.daily[0].recordsLevel, 100);
  assert.equal(snapshot.daily[1].spendLevel, 100);
  assert.equal(snapshot.daily[1].recordsLevel, 100 / 9);
});

test("local cockpit retains candidates that lead either honest lens", () => {
  const stats = parseLocalStats({
    range: {},
    totals: { count: 1_012, credits: 0, usd: 1_006, providers: 13 },
    byProvider: Array.from({ length: 13 }, (_, index) => ({
      key: `provider-${index}`,
      count: index === 12 ? 1_000 : 1,
      ops: 1,
      usd: index === 0 ? 1_000 : 0.5,
    })),
    byDay: [],
  });
  const insights = parseLocalInsights({ forecast: {} });
  const snapshot = buildCockpitSnapshot(stats, insights);

  assert.equal(snapshot.providers.length, 12);
  assert.equal(snapshot.providers.some((provider) => provider.key === "provider-0"), true);
  assert.equal(snapshot.providers.some((provider) => provider.key === "provider-12"), true);
});

test("local cockpit fails closed on malformed root contracts", () => {
  assert.throws(() => parseLocalStats(null), /stats payload is not an object/);
  assert.throws(() => parseLocalStats({ totals: null }), /stats totals is not an object/);
  assert.throws(() => parseLocalInsights({ forecast: null }), /insights forecast is not an object/);
});
