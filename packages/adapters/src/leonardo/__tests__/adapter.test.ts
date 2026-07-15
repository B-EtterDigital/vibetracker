import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFixtureClient,
  createHttpClient,
  createLeonardoAdapter,
  normalizeGenerations,
  type LeonardoGeneration,
  type LeonardoMeResponse,
} from "../index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const me = JSON.parse(readFileSync(join(HERE, "..", "__fixtures__", "me.sample.json"), "utf8")) as LeonardoMeResponse;
const generations = (JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "generations.sample.json"), "utf8"),
) as { generations: LeonardoGeneration[] }).generations;
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizes completed generations into exact image counts", () => {
  const records = normalizeGenerations(generations);
  assert.equal(records.length, 2);
  assert.deepEqual(records.map((record) => record.quantity), [4, 2]);
  assert.ok(records.every((record) => record.rawAmount === record.quantity));
  assert.ok(records.every((record) => record.unit === "image" && record.rawUnit === "images"));
  assert.ok(records.every((record) => record.outputUnit === "image" && record.outputQuantity === record.quantity));
  assert.ok(records.every((record) => record.source === "feed_recon" && record.confidence === "high"));
  assert.ok(records.every((record) => record.verified === false));
});

test("resolves the user ID, paginates, and applies the requested date range", async () => {
  const adapter = createLeonardoAdapter(createFixtureClient(me, generations), { pageSize: 2 });
  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30T23:59:59Z" }, ctx);
  assert.equal(all.length, 2);
  assert.equal(all.reduce((sum, record) => sum + record.quantity, 0), 6);
  assert.ok(all.every((record) => record.accountId === "8b96c4f9-8f62-4b18-8e9f-4bf0d37f2c65"));

  const oneDay = await adapter.getUsage(
    { from: "2026-06-02T00:00:00Z", to: "2026-06-02T23:59:59Z" },
    ctx,
  );
  assert.equal(oneDay.length, 1);
  assert.equal(oneDay[0]?.quantity, 2);
});

test("reports only the API token wallet, not unrelated web-plan tokens", async () => {
  const adapter = createLeonardoAdapter(createFixtureClient(me, generations));
  const balance = await adapter.getBalance!(ctx);
  assert.equal(balance.rawAmount, 1000);
  assert.equal(balance.rawUnit, "api_tokens");
  assert.equal(balance.usdEst, undefined);
});

test("surfaces missing identity and client failures through telemetry", async () => {
  let captured = 0;
  const spyCtx = {
    getSecret: async () => undefined,
    telemetry: { captureError() { captured++; }, addBreadcrumb() {} },
  };
  const noIdentity = createLeonardoAdapter(createFixtureClient({ user_details: [{}] }, []));
  await assert.rejects(
    () => noIdentity.getUsage({ from: "2026-06-01", to: "2026-06-30" }, spyCtx),
    /no user ID/,
  );

  const boom = new Error("429 rate limited");
  const failing = createLeonardoAdapter({ async me() { throw boom; }, async generations() { throw boom; } });
  await assert.rejects(
    () => failing.getUsage({ from: "2026-06-01", to: "2026-06-30" }, spyCtx),
    /rate limited/,
  );
  assert.equal(captured, 2);
});

test("fails loudly instead of returning a safety-capped partial history", async () => {
  let captured: unknown;
  const spyCtx = {
    getSecret: async () => undefined,
    telemetry: { captureError(error: unknown) { captured = error; }, addBreadcrumb() {} },
  };
  const adapter = createLeonardoAdapter(createFixtureClient(me, generations), { pageSize: 1, maxPages: 1 });
  await assert.rejects(
    () => adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, spyCtx),
    /safety cap/,
  );
  assert.match(String(captured), /safety cap/);
});

test("HTTP client uses documented bearer endpoints and fails loudly", async () => {
  assert.throws(() => createHttpClient({ apiKey: "" }), /Production API key required/);
  const urls: string[] = [];
  const auth: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    urls.push(String(input));
    auth.push(String((init?.headers as Record<string, string>).Authorization));
    const body = urls.length === 1 ? me : { generations: [] };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  const client = createHttpClient({ apiKey: "prod-key", fetchImpl });
  await client.me();
  await client.generations({ userId: "user/id", limit: 10, offset: 20 });
  assert.equal(urls[0], "https://cloud.leonardo.ai/api/rest/v1/me");
  assert.equal(urls[1], "https://cloud.leonardo.ai/api/rest/v1/generations/user/user%2Fid?limit=10&offset=20");
  assert.deepEqual(auth, ["Bearer prod-key", "Bearer prod-key"]);
});

test("adapter advertises an authoritative feed and balance without claiming a ledger", () => {
  const adapter = createLeonardoAdapter(createFixtureClient(me, generations));
  assert.equal(adapter.id, "leonardo");
  assert.equal(adapter.auth.kind, "apiKey");
  assert.equal(adapter.auth.serverVerifiable, true);
  assert.deepEqual(adapter.capabilities, { ledger: false, balance: true, feed: true });
});
