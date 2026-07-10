import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRecords, parseSince } from "../filter.ts";
import type { NormalizedRecord } from "../schema/record.ts";

const rec = (o: Partial<NormalizedRecord>): NormalizedRecord => ({
  ts: "2026-06-01T10:00:00Z", provider: "openai", category: "llm", operation: "usage",
  quantity: 1, unit: "request", rawAmount: 1, rawUnit: "usd", source: "ledger",
  confidence: "high", verified: false, ...o,
});

const recs: NormalizedRecord[] = [
  rec({ ts: "2026-06-01T10:00:00Z", provider: "openai", category: "llm", model: "gpt-4o", usdEst: 5, accountId: "personal", profileId: "main", teamId: "solo" }),
  rec({ ts: "2026-06-02T10:00:00Z", provider: "higgsfield", category: "image", model: "Nano Banana Pro", rawUnit: "credits", usdEst: 0.02, accountId: "client-a", profileId: "client", teamId: "studio" }),
  rec({ ts: "2026-06-03T10:00:00Z", provider: "ollama", category: "llm", model: "llama3", rawUnit: "tokens", usdEst: 0.5, source: "local", accountId: "personal", profileId: "local", teamId: "solo" }),
];

test("parseSince handles relative windows and ISO dates", () => {
  const now = Date.parse("2026-07-01T00:00:00Z");
  assert.ok(parseSince("30d", now).startsWith("2026-06-01"));
  assert.ok(parseSince("24h", now).startsWith("2026-06-30"));
  assert.equal(parseSince("2026-01-15", now), "2026-01-15T00:00:00.000Z");
  assert.throws(() => parseSince("garbage", now));
});

test("filterRecords: provider / category / model-substring / source / minUsd / range", () => {
  assert.equal(filterRecords(recs, { providers: ["openai"] }).length, 1);
  assert.equal(filterRecords(recs, { categories: ["image"] }).length, 1);
  assert.equal(filterRecords(recs, { models: ["gpt"] }).length, 1);            // substring match
  assert.equal(filterRecords(recs, { sources: ["local"] })[0].provider, "ollama");
  assert.equal(filterRecords(recs, { minUsd: 1 }).length, 1);                  // only the $5 row
  assert.equal(filterRecords(recs, { accounts: ["personal"] }).length, 2);
  assert.equal(filterRecords(recs, { profiles: ["client"] })[0].provider, "higgsfield");
  assert.equal(filterRecords(recs, { teams: ["studio"] })[0].provider, "higgsfield");
  assert.equal(filterRecords(recs, { from: "2026-06-02T00:00:00Z" }).length, 2);
  assert.equal(filterRecords(recs, { from: "2026-06-02T00:00:00Z", to: "2026-06-02T23:59:59Z" }).length, 1);
});
