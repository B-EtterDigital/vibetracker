import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decomposeViberank,
  parseViberankModels,
  parseViberankDates,
  classifyModel,
  RESIDUAL_MODEL,
  VIBERANK_PROVIDER,
  type ViberankDecomposeInput,
} from "../import-viberank.ts";
import { aggregate } from "../../../core/src/aggregate.ts";

// Mirrors the packet's mock: itemized models sum to $90,485.25, header total $201,519 —
// so a residual of $111,033.75 must be synthesized to reconcile.
const payload: ViberankDecomposeInput = {
  total: 201519,
  joined: "2025-08-19",
  end: "2026-07-12",
  models: [
    { model: "gpt-5.5", usd: 75588.77 },
    { model: "claude-fable-5", usd: 14796.48 },
    { model: "gemini-x", usd: 100 },
  ],
};

const DAY = 86400000;
const inclusiveDays = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T12:00:00.000Z`) - Date.parse(`${a}T12:00:00.000Z`)) / DAY) + 1;

test("decomposeViberank → real providers, reconciled to header total, never viberank-history", () => {
  const recs = decomposeViberank(payload, { end: payload.end });
  const byModel = (m: string) => recs.filter((r) => r.model === m);

  // (a) NEVER the fake legacy provider
  assert.equal(recs.some((r) => r.provider === VIBERANK_PROVIDER), false);
  assert.equal(recs.some((r) => r.provider === "viberank-history"), false);

  // (b) per-model → real provider + coding category
  assert.ok(byModel("gpt-5.5").length > 0);
  assert.ok(byModel("gpt-5.5").every((r) => r.provider === "codex" && r.category === "coding"));
  assert.ok(byModel("claude-fable-5").every((r) => r.provider === "claude-code" && r.category === "coding"));
  assert.ok(byModel("gemini-x").every((r) => r.provider === "gemini-cli" && r.category === "coding"));

  // (c) a residual codex/coding record exists and the grand total reconciles to the header total
  const residual = byModel(RESIDUAL_MODEL);
  assert.ok(residual.length > 0, "expected a residual bucket");
  assert.ok(residual.every((r) => r.provider === "codex" && r.category === "coding"));
  const grand = recs.reduce((a, r) => a + (r.usdEst || 0), 0);
  assert.ok(Math.abs(grand - 201519) < 0.01, `grand total ${grand} must equal 201519 within $0.01`);

  // (d) every record is feed_recon / low confidence, with the exact NormalizedRecord shape
  assert.ok(recs.every((r) => r.source === "feed_recon" && r.confidence === "low"));
  assert.ok(recs.every((r) =>
    r.operation === "import" && r.unit === "credit" && r.rawUnit === "usd" &&
    r.quantity === 0 && r.rawAmount === 0 && r.verified === false && typeof r.usdEst === "number"));

  // (e) records span the inclusive joined..end day range with even per-model per-day shares
  const nDays = inclusiveDays(payload.joined!, payload.end!);
  const distinctDays = new Set(recs.map((r) => r.ts));
  assert.equal(distinctDays.size, nDays);
  assert.equal(recs.length, nDays * 4); // 3 models + 1 residual

  const expected: Record<string, number> = {
    "gpt-5.5": 75588.77,
    "claude-fable-5": 14796.48,
    "gemini-x": 100,
    [RESIDUAL_MODEL]: 201519 - (75588.77 + 14796.48 + 100),
  };
  for (const [model, usd] of Object.entries(expected)) {
    const rs = byModel(model);
    assert.equal(rs.length, nDays, `${model} must have one record per day`);
    assert.equal(new Set(rs.map((r) => r.ts)).size, nDays, `${model} must span every day once`);
    const sum = rs.reduce((a, r) => a + (r.usdEst || 0), 0);
    assert.ok(Math.abs(sum - usd) < 0.01, `${model} daily shares must sum to ${usd} (got ${sum})`);
    const shares = rs.map((r) => r.usdEst || 0);
    assert.ok(Math.max(...shares) - Math.min(...shares) <= 0.01 + 1e-9, `${model} shares must be even to within a cent`);
  }
});

test("decomposeViberank interpolation preserves USD without fabricating operations", () => {
  const recs = decomposeViberank({
    total: 3,
    joined: "2026-07-17",
    end: "2026-07-19",
    models: [{ model: "gpt-5.5", usd: 3 }],
  });

  assert.equal(recs.length, 3);
  assert.ok(recs.every((r) => r.quantity === 0 && r.rawAmount === 0));

  const days = aggregate(recs, "day");
  assert.equal(days.length, 3);
  assert.ok(days.every((day) => day.ops === 0));
  assert.equal(days.reduce((sum, day) => sum + (day.usd ?? 0), 0), 3);
});

test("decomposeViberank reads end from the payload when opts is omitted, and needs no residual when itemized ≥ total", () => {
  // end supplied via payload.end (not opts) — both entry styles must work.
  const recs = decomposeViberank({ total: 90485.25, joined: "2025-08-19", end: "2026-07-12", models: payload.models });
  assert.equal(recs.some((r) => r.model === RESIDUAL_MODEL), false, "no residual when itemized == total");
  const grand = recs.reduce((a, r) => a + (r.usdEst || 0), 0);
  assert.ok(Math.abs(grand - 90485.25) < 0.01);
});

test("decomposeViberank requires an end date (deterministic, no Date.now)", () => {
  assert.throws(() => decomposeViberank({ total: 100, joined: "2025-08-19", models: [] }), /end date is required/);
});

test("classifyModel maps every known family to a real coding provider", () => {
  assert.deepEqual(classifyModel("gpt-5.6-sol"), { provider: "codex", category: "coding" });
  assert.deepEqual(classifyModel("gpt-5-codex"), { provider: "codex", category: "coding" });
  assert.deepEqual(classifyModel("claude-opus-4-8"), { provider: "claude-code", category: "coding" });
  assert.deepEqual(classifyModel("claude-haiku-4-5"), { provider: "claude-code", category: "coding" });
  assert.deepEqual(classifyModel("gemini-2.5-pro"), { provider: "gemini-cli", category: "coding" });
  assert.deepEqual(classifyModel("something-unknown"), { provider: "codex", category: "coding" });
});

test("parseViberankModels + parseViberankDates lock the page-extraction shape (offline snippet)", () => {
  // Mirrors the real server-rendered viberank page: each model is a `font-mono truncate` span
  // immediately followed by a `$AMOUNT` cost span, and "Joined" carries a React SSR comment.
  const row = (model: string, cost: string) =>
    `<span class="text-xs font-mono truncate">${model}</span>` +
    `<span class="font-mono text-xs text-muted flex-shrink-0">$${cost}<span class="text-[10px]">tok</span></span>`;
  const html = [
    `<div><svg></svg>Joined <!-- -->8/19/2025</span></div>`,
    row("gpt-5.5", "75,588.77"),
    row("claude-fable-5", "14,796.48"),
    row("gemini-x", "100.00"),
    // a same-class span that is NOT a model (fails the model-id allowlist) — must be ignored:
    `<span class="font-mono truncate">Total</span><span class="x">$201,519.00</span>`,
  ].join("\n");

  const models = parseViberankModels(html);
  assert.deepEqual(models, [
    { model: "gpt-5.5", usd: 75588.77 },
    { model: "claude-fable-5", usd: 14796.48 },
    { model: "gemini-x", usd: 100 },
  ]);

  const dates = parseViberankDates(html);
  assert.equal(dates.joined, "2025-08-19");
});
