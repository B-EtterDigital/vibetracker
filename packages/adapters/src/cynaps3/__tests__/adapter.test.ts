import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CYNAPS3_STATS_URL,
  createCynaps3Adapter,
  createFixtureClient,
  createHttpClient,
  normalizeEvents,
  parseStatsPage,
  type Cynaps3StatsPage,
} from "../index.ts";
import { getProvider } from "../../registry.ts";
import { vibeCategoryFor } from "../../../../core/src/vibe-categories.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = parseStatsPage(JSON.parse(readFileSync(
  join(HERE, "..", "__fixtures__", "stats-v1.sample.json"),
  "utf8",
)));
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

function page(events: Cynaps3StatsPage["events"], nextCursor: string | null): Cynaps3StatsPage {
  return {
    ...fixture,
    events,
    page: { nextCursor, hasMore: nextCursor !== null },
  };
}

test("normalizes authoritative Musicmation operations without inventing USD", () => {
  const records = normalizeEvents(fixture.events, fixture.account.id);
  assert.equal(records.length, 3);
  assert.deepEqual(records.map((record) => record.quantity), [1, 1, 1]);
  assert.equal(records.reduce((sum, record) => sum + record.rawAmount, 0), 18);
  assert.equal(records.reduce((sum, record) => sum + (record.outputQuantity ?? 0), 0), 4);
  assert.equal(records.reduce((sum, record) => sum + (record.durationSeconds ?? 0), 0), 482.5);
  assert.ok(records.every((record) => record.provider === "cynaps3" && record.category === "music"));
  assert.ok(records.every((record) => record.unit === "request" && record.rawUnit === "credits"));
  assert.ok(records.every((record) => record.outputUnit === "track"));
  assert.ok(records.every((record) => record.source === "ledger" && record.confidence === "high"));
  assert.ok(records.every((record) => !record.verified && record.usdEst === undefined));
  assert.ok(records.every((record) => record.toolId === "cynaps3" && record.sourceEventId));
});

test("schema v2 keeps Cynaps3 as the tool while upstream billing remains one provider event", () => {
  const v2 = parseStatsPage({
    ...fixture,
    schemaVersion: 2,
    events: [{
      ...fixture.events[0],
      toolId: "cynaps3",
      providerId: "suno",
      billingOwner: "upstream-provider",
      upstreamEventId: "suno_clip_123",
    }],
  });
  const [record] = normalizeEvents(v2.events, v2.account.id);
  assert.equal(record?.provider, "suno");
  assert.equal(record?.toolId, "cynaps3");
  assert.equal(record?.sourceEventId, "suno_clip_123");
  assert.equal(record?.rawAmount, fixture.events[0]?.creditsConsumed);
  assert.equal(record?.quantity, 1);
  assert.throws(() => parseStatsPage({
    ...fixture,
    schemaVersion: 2,
    events: [{
      ...fixture.events[0],
      toolId: "cynaps3",
      providerId: "suno",
      billingOwner: "upstream-provider",
    }],
  }), /upstreamEventId is required/);
});

test("paginates exact range records and keeps one operation per source event", async () => {
  const pages = [page(fixture.events.slice(0, 2), "cursor-page-2"), page(fixture.events.slice(2), null)];
  const adapter = createCynaps3Adapter(createFixtureClient(pages), { pageSize: 2 });
  const records = await adapter.getUsage(
    { from: "2026-07-14T00:00:00Z", to: "2026-07-14T23:59:59Z" },
    ctx,
  );
  assert.equal(records.length, 3);
  assert.equal(records.reduce((sum, record) => sum + record.quantity, 0), 3);
  assert.ok(records.every((record) => record.accountId === "acct_musicmation_fixture"));
});

test("fails closed on schema drift and inconsistent summary math", () => {
  assert.throws(() => parseStatsPage({ ...fixture, schemaVersion: 3 }), /schemaVersion 1 or 2/);
  assert.throws(() => parseStatsPage({
    ...fixture,
    summary: { ...fixture.summary, operations: 99 },
  }), /must equal operations/);
  assert.throws(() => parseStatsPage({
    ...fixture,
    page: { hasMore: true, nextCursor: null },
  }), /hasMore and nextCursor disagree/);
});

test("rejects duplicate events, out-of-range events, and partial safety-capped history", async () => {
  const duplicate = createCynaps3Adapter(createFixtureClient([
    page([fixture.events[0]!], "next"),
    page([fixture.events[0]!], null),
  ]));
  await assert.rejects(
    () => duplicate.getUsage({ from: "2026-07-01", to: "2026-07-31" }, ctx),
    /duplicate event id/,
  );

  const outside = createCynaps3Adapter(createFixtureClient([page([fixture.events[0]!], null)]));
  await assert.rejects(
    () => outside.getUsage({ from: "2026-07-15", to: "2026-07-16" }, ctx),
    /outside the requested range/,
  );

  const capped = createCynaps3Adapter(createFixtureClient([page([fixture.events[0]!], "next")]), { maxPages: 1 });
  await assert.rejects(
    () => capped.getUsage({ from: "2026-07-01", to: "2026-07-31" }, ctx),
    /safety cap/,
  );
});

test("rejects distinct Cynaps3 envelopes that point at one billed upstream event", async () => {
  const base = {
    ...fixture.events[0]!,
    toolId: "cynaps3" as const,
    providerId: "suno",
    billingOwner: "upstream-provider" as const,
    upstreamEventId: "suno_clip_duplicated",
  };
  const duplicate = createCynaps3Adapter(createFixtureClient([{
    ...fixture,
    schemaVersion: 2,
    events: [{ ...base, id: "cynaps_op_1" }, { ...base, id: "cynaps_op_2" }],
  }]));
  await assert.rejects(
    () => duplicate.getUsage({ from: "2026-07-01", to: "2026-07-31" }, ctx),
    /duplicate billed event suno:suno_clip_duplicated/,
  );
});

test("HTTP client sends only the scoped bearer token and documented query", async () => {
  assert.throws(() => createHttpClient({ accessToken: "" }), /usage:read/);
  let requestedUrl = "";
  let requestedAuth = "";
  const client = createHttpClient({
    accessToken: "cynaps-oauth-token",
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      requestedAuth = String((init?.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify(fixture), { status: 200 });
    },
  });
  await client.stats({
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-31T23:59:59.000Z",
    cursor: "opaque cursor",
    limit: 100,
  });
  const url = new URL(requestedUrl);
  assert.equal(`${url.origin}${url.pathname}`, CYNAPS3_STATS_URL);
  assert.equal(url.searchParams.get("cursor"), "opaque cursor");
  assert.equal(url.searchParams.get("limit"), "100");
  assert.equal(requestedAuth, "Bearer cynaps-oauth-token");
});

test("adapter advertises the verified music ledger without claiming a balance", () => {
  const adapter = createCynaps3Adapter(createFixtureClient([fixture]));
  assert.equal(adapter.id, "cynaps3");
  assert.deepEqual(adapter.categories, ["music"]);
  assert.equal(adapter.auth.kind, "oauth");
  assert.equal(adapter.auth.serverVerifiable, true);
  assert.deepEqual(adapter.capabilities, { ledger: true, balance: false, feed: true });
});

test("registry listing routes Cynaps3 into the Music specialization", () => {
  const provider = getProvider("cynaps3");
  assert.ok(provider);
  assert.equal(provider.label, "Cynaps3 Musicmation");
  assert.equal(provider.status, "built");
  assert.equal(provider.verified, false);
  assert.equal(vibeCategoryFor(provider.categories[0]).id, "music");
});
