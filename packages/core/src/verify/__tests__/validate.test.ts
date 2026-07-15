import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecord, ingestRecords, sanitizeText } from "../validate.ts";
import { trustLevel, isRankable } from "../trust.ts";

const good = {
  ts: "2026-06-01T00:00:00Z", provider: "higgsfield", category: "image",
  operation: "spend", model: "Nano Banana Pro", quantity: 1, unit: "request",
  rawAmount: 2, rawUnit: "credits", source: "ledger", confidence: "high", verified: false,
};

test("sanitizeText strips ANSI/terminal escapes and control chars", () => {
  assert.equal(sanitizeText("\x1b[31mHACK\x1b[0m\x07"), "HACK");
  assert.equal(sanitizeText("line1\nline2\tx"), "line1line2x");
  assert.equal(sanitizeText("A".repeat(500)).length, 200);
});

test("a hostile model name (ANSI injection) is neutralized, not rejected", () => {
  const res = validateRecord({ ...good, model: "\x1b[2J\x1b[1;1H OWNED \x07" });
  assert.equal(res.ok, true);
  assert.equal(res.sanitized!.model, "OWNED"); // escape sequence inert
});

test("absurd / non-finite / negative amounts are rejected", () => {
  assert.equal(validateRecord({ ...good, rawAmount: 1e20 }).ok, false);
  assert.equal(validateRecord({ ...good, rawAmount: Infinity }).ok, false);
  assert.equal(validateRecord({ ...good, rawAmount: -5 }).ok, false);
  assert.equal(validateRecord({ ...good, rawAmount: "1e999" }).ok, false);
});

test("prototype-pollution keys are rejected and never pollute", () => {
  const poisoned = JSON.parse(
    '{"__proto__":{"polluted":true},"ts":"2026-06-01T00:00:00Z","provider":"x","category":"llm","operation":"o","quantity":1,"unit":"token","rawAmount":1,"rawUnit":"tokens","source":"ledger","confidence":"high","verified":false}',
  );
  const res = validateRecord(poisoned);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.includes("__proto__")));
  assert.equal(({} as Record<string, unknown>).polluted, undefined); // no pollution
});

test("an untrusted upload can NOT self-certify as verified", () => {
  const res = validateRecord({ ...good, verified: true }, { untrustedSource: true });
  assert.equal(res.sanitized!.verified, false);
  assert.equal(trustLevel(res.sanitized!), "self_reported");
  assert.equal(isRankable(res.sanitized!), false); // excluded from ranked boards
});

test("unknown category/source/unit are coerced to safe defaults", () => {
  const res = validateRecord({ ...good, category: "malware", source: "evil", unit: "pwn" });
  assert.equal(res.sanitized!.category, "other");
  assert.equal(res.sanitized!.source, "manual");
  assert.equal(res.sanitized!.unit, "request");
});

test("native media metrics survive the whitelist without changing operation quantity", () => {
  const res = validateRecord({
    ...good,
    quantity: 1,
    outputQuantity: 2,
    outputUnit: "track",
    durationSeconds: 241.25,
  });
  assert.equal(res.ok, true);
  assert.equal(res.sanitized!.quantity, 1);
  assert.equal(res.sanitized!.outputQuantity, 2);
  assert.equal(res.sanitized!.outputUnit, "track");
  assert.equal(res.sanitized!.durationSeconds, 241.25);
});

test("malformed or partial native media metrics fail closed", () => {
  for (const candidate of [
    { outputQuantity: -1, outputUnit: "track" },
    { outputQuantity: Infinity, outputUnit: "track" },
    { outputQuantity: 1 },
    { outputUnit: "track" },
    { outputQuantity: 1, outputUnit: "song" },
    { durationSeconds: 30 },
    { outputQuantity: 1, outputUnit: "track", durationSeconds: -1 },
  ]) {
    assert.equal(validateRecord({ ...good, ...candidate }).ok, false, JSON.stringify(candidate));
  }
});

test("ingestRecords separates accepted from rejected without dropping silently", () => {
  const { accepted, rejected } = ingestRecords([good, { ...good, rawAmount: -1 }, "not-an-object"]);
  assert.equal(accepted.length, 1);
  assert.equal(rejected.length, 2);
  assert.equal(rejected[0].index, 1);
});

test("verified backend-fetched data is rankable", () => {
  const res = validateRecord({ ...good, verified: true }); // trusted source (no untrustedSource flag)
  assert.equal(res.sanitized!.verified, true);
  assert.equal(isRankable(res.sanitized!), true);
});
