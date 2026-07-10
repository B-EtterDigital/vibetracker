import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats } from "../stats.ts";
import type { NormalizedRecord } from "../schema/record.ts";

const rec = (o: Partial<NormalizedRecord>): NormalizedRecord => ({
  ts: "2026-06-01T10:00:00Z", provider: "openai", category: "llm", operation: "usage",
  quantity: 1, unit: "request", rawAmount: 1, rawUnit: "usd", source: "ledger",
  confidence: "high", verified: false, ...o,
});

const recs: NormalizedRecord[] = [
  rec({ ts: "2026-06-01T10:00:00Z", provider: "openai", category: "llm", model: "gpt-4o", usdEst: 5, accountId: "personal", profileId: "main", teamId: "solo" }),
  rec({ ts: "2026-06-02T10:00:00Z", provider: "higgsfield", category: "image", model: "Nano Banana Pro", rawUnit: "credits", usdEst: 0.02, accountId: "studio", profileId: "client-a", teamId: "creative" }),
  rec({ ts: "2026-06-03T10:00:00Z", provider: "ollama", category: "llm", model: "llama3", rawUnit: "tokens", usdEst: 0.5, source: "local", accountId: "personal", profileId: "local-lab", teamId: "solo" }),
];

test("computeStats breaks down by every dimension + date range", () => {
  const s = computeStats(recs);
  assert.equal(s.totals.count, 3);
  assert.equal(s.totals.providers, 3);
  assert.equal(s.byProvider.length, 3);
  assert.deepEqual(new Set(s.byCategory.map((r) => r.key)), new Set(["llm", "image"]));
  assert.deepEqual(s.byAccount.map((r) => r.key), ["personal", "studio"]);
  assert.deepEqual(new Set(s.byProfile.map((r) => r.key)), new Set(["main", "client-a", "local-lab"]));
  assert.deepEqual(s.byTeam.map((r) => r.key), ["solo", "creative"]);
  assert.equal(s.byDay.length, 3);
  assert.deepEqual(s.byDay.map((r) => r.key), ["2026-06-01", "2026-06-02", "2026-06-03"]); // chronological
  assert.ok(s.range.from!.startsWith("2026-06-01") && s.range.to!.startsWith("2026-06-03"));
});

test("localSavingsUsd sums usd of local-sourced records only", () => {
  assert.equal(computeStats(recs).localSavingsUsd, 0.5); // the ollama (local) row
});

test("empty input is safe", () => {
  const s = computeStats([]);
  assert.equal(s.totals.count, 0);
  assert.deepEqual(s.range, {});
});
