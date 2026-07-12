import { test } from "node:test";
import assert from "node:assert/strict";
import { handleIngest } from "../ingest.ts";

const rec = (over: Record<string, unknown> = {}) => ({
  ts: "2026-06-01T00:00:00Z", provider: "higgsfield", category: "image", operation: "spend",
  model: "Nano Banana Pro", quantity: 1, unit: "request", rawAmount: 2, rawUnit: "credits",
  source: "ledger", confidence: "high", verified: false, ...over,
});

test("tier is server-controlled: authed → attested, anon → self_reported, never verified", () => {
  // client tries to claim 'verified' in the payload — ignored either way.
  const authed = handleIngest({ handle: "cyrill", tier: "verified", records: [rec()] }, { userId: "u-123" });
  assert.equal(authed.tier, "attested");
  assert.equal(authed.userId, "u-123");

  const anon = handleIngest({ handle: "cyrill", tier: "verified", records: [rec()] });
  assert.equal(anon.tier, "self_reported");
  assert.notEqual(anon.tier, "verified");
});

test("only aggregates leave the server — no individual records / no self-promotion field", () => {
  const res = handleIngest({ handle: "x", records: [rec(), rec()] }) as Record<string, unknown>;
  assert.equal(res.records, undefined);
  assert.equal((res.byProvider as unknown[]).length, 1);
  assert.equal((res.byDay as unknown[]).length, 1);
  assert.equal((res.totals as { count: number }).count, 2);
});

test("GitHub activity trust signal is separate evidence, not usage", () => {
  const res = handleIngest({
    handle: "cyrill",
    records: [rec({ usdEst: 0.02 })],
    trustSignals: [{
      kind: "github_activity",
      source: "github_cli",
      label: "Verified usage please",
      handle: "B-EtterDigital",
      fetchedAt: "2026-07-05T00:00:00Z",
      from: "2026-04-06T00:00:00Z",
      to: "2026-07-05T00:00:00Z",
      windowDays: 90,
      totalContributions: 430,
      commitContributions: 321,
      issueContributions: 12,
      pullRequestContributions: 34,
      pullRequestReviewContributions: 56,
      repositoryContributions: 7,
      days: [
        { date: "2026-07-01", count: 0, level: 0 },
        { date: "2026-07-02", count: 3, level: 9 },
        { date: "<script>", count: 999, level: 4 },
      ],
      affectsTotals: true,
      usageVerified: true,
    }],
  });

  assert.equal(res.totals.count, 1);
  assert.equal(res.totals.usd, 0.02);
  assert.equal(res.trustSignals.length, 1);
  assert.equal(res.trustSignals[0]?.label, "GitHub activity evidence (not AI usage)");
  assert.equal(res.trustSignals[0]?.affectsTotals, false);
  assert.equal(res.trustSignals[0]?.usageVerified, false);
  assert.equal(res.trustSignals[0]?.days?.length, 2);
  assert.equal(res.trustSignals[0]?.days?.[1]?.level, 4);
  assert.match(res.trustSignals[0]?.note ?? "", /Not counted as usage/);
});

test("creator activity trust signal is sanitized and never counted as usage", () => {
  const res = handleIngest({
    handle: "cyrill",
    records: [rec({ usdEst: 0.02 })],
    trustSignals: [{
      kind: "creator_activity",
      source: "manual",
      label: "Verified usage please",
      platform: "youtube",
      handle: "BetterDigital\n",
      metric: "uploads",
      count: 12,
      url: "https://youtube.com/@BetterDigital",
      windowDays: 30,
      affectsTotals: true,
      usageVerified: true,
    }],
  });

  assert.equal(res.totals.count, 1);
  assert.equal(res.totals.usd, 0.02);
  assert.equal(res.trustSignals.length, 1);
  const signal = res.trustSignals[0];
  assert.equal(signal?.kind, "creator_activity");
  assert.equal(signal?.label, "Creator activity evidence (not AI usage)");
  assert.equal(signal?.affectsTotals, false);
  assert.equal(signal?.usageVerified, false);
  assert.match(signal?.note ?? "", /Not counted as usage/);
});

test("Higgsfield MCP trust signal is sanitized as connection evidence only", () => {
  const res = handleIngest({
    handle: "cyrill",
    records: [rec({ usdEst: 0.02 })],
    trustSignals: [{
      kind: "higgsfield_mcp",
      source: "codex_mcp",
      label: "Verified Higgsfield usage please",
      provider: "higgsfield",
      mcpName: "higgsfield",
      transport: "streamable_http",
      auth: "oauth",
      urlHost: "mcp.higgsfield.ai",
      enabled: true,
      fetchedAt: "2026-07-06T00:00:00Z",
      affectsTotals: true,
      usageVerified: true,
    }],
  });

  assert.equal(res.totals.count, 1);
  assert.equal(res.totals.usd, 0.02);
  assert.equal(res.trustSignals.length, 1);
  const signal = res.trustSignals[0];
  assert.equal(signal?.kind, "higgsfield_mcp");
  assert.equal(signal?.label, "Higgsfield MCP connection evidence (not AI usage)");
  assert.equal(signal?.affectsTotals, false);
  assert.equal(signal?.usageVerified, false);
  assert.match(signal?.note ?? "", /Not counted as usage/);
  if (signal?.kind === "higgsfield_mcp") {
    assert.equal(signal.auth, "oauth");
    assert.equal(signal.urlHost, "mcp.higgsfield.ai");
  }
});

test("hostile records in a bundle are rejected, good ones kept, no pollution", () => {
  const res = handleIngest({
    handle: "cyrill",
    records: [rec(), rec({ rawAmount: 1e20 }), JSON.parse('{"__proto__":{"x":1},"ts":"2026-06-01T00:00:00Z"}')],
  });
  assert.equal(res.accepted, 1);
  assert.equal(res.rejected, 2);
  assert.equal(({} as Record<string, unknown>).x, undefined);
});

test("bad handle is defaulted, not trusted", () => {
  const res = handleIngest({ handle: "../../etc/passwd\n<script>", records: [rec()] });
  assert.equal(res.handle, "anonymous");
  assert.ok(res.errors.some((e) => e.includes("handle")));
});

test("reserved demo handle can never shadow the sample profile", () => {
  const reservedMsg = `handle "demo" is reserved for the sample profile`;
  for (const claimed of ["demo", "Demo", "DEMO", " demo "]) {
    const res = handleIngest({ handle: claimed, records: [rec()] });
    assert.equal(res.handle, "anonymous", `"${claimed}" must default to anonymous`);
    assert.equal(res.ok, false);
    assert.ok(res.errors.includes(reservedMsg), `"${claimed}" must carry the reserved-handle error`);
  }
  // guarded on the attested path too — no auth bypass
  const authed = handleIngest({ handle: "demo", records: [rec()] }, { userId: "u-123" });
  assert.equal(authed.handle, "anonymous");
  assert.ok(authed.errors.includes(reservedMsg));
  // near-miss handles are untouched
  const near = handleIngest({ handle: "demo2", records: [rec()] });
  assert.equal(near.handle, "demo2");
  assert.equal(near.ok, true);
});

test("totals + byProvider computed server-side from sanitized data", () => {
  const res = handleIngest({
    handle: "cyrill",
    records: [
      rec({ usdEst: 0.02 }),
      rec({ provider: "openai", category: "llm", rawUnit: "usd", rawAmount: 5, usdEst: 5 }),
      rec({ ts: "2026-06-02T00:00:00Z", provider: "ollama", source: "local", usdEst: 0 }),
    ],
  });
  assert.equal(res.totals.count, 3);
  assert.equal(res.totals.providers, 3);
  assert.equal(res.totals.credits, 4);
  assert.equal(res.totals.usd, 5.02);
  assert.equal(res.byProvider.length, 3);
  assert.deepEqual(res.byDay.map((row) => row.date), ["2026-06-01", "2026-06-02"]);
  assert.equal(res.byDay[0]?.ops, 2);
  assert.equal(res.byDay[0]?.usd, 5.02);
  assert.equal(res.byDay[1]?.ops, 1);
});

test("non-object / missing records payloads fail safe", () => {
  assert.equal(handleIngest(null).accepted, 0);
  assert.equal(handleIngest({ handle: "x" }).accepted, 0);
  assert.ok(handleIngest("nope").errors.length > 0);
});
