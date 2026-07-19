import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectEntries, parseSession } from "../index.ts";
import { toRecords } from "../normalize.ts";
import { priceFor } from "../pricing.ts";

// A well-formed session: model in turn_context, an early null-info token_count,
// then two populated cumulative token_count events (the last is the session total).
const VALID = [
  '{"timestamp":"2026-03-27T10:00:00.000Z","type":"session_meta","payload":{"id":"s1"}}',
  '{"timestamp":"2026-03-27T10:00:01.000Z","type":"turn_context","payload":{"model":"gpt-5.5"}}',
  '{"timestamp":"2026-03-27T10:00:02.000Z","type":"event_msg","payload":{"type":"token_count","info":null}}',
  '{"timestamp":"2026-03-27T10:00:03.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":5000,"cached_input_tokens":2000,"output_tokens":1000,"reasoning_output_tokens":200,"total_tokens":6000}}}}',
  '{"timestamp":"2026-03-27T10:05:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":10000,"cached_input_tokens":4000,"output_tokens":2000,"reasoning_output_tokens":500,"total_tokens":12000}}}}',
  '{"timestamp":"2026-03-27T10:05:01.000Z","type":"response_item","payload":{"role":"assistant"}}',
].join("\n");

test("parseSession uses the LAST cumulative total, resolves model, computes non-cached input", () => {
  const e = parseSession(VALID)!;
  assert.ok(e, "entry should be produced");
  assert.equal(e.model, "gpt-5.5");
  assert.equal(e.totalTokens, 12000);      // last cumulative, not the earlier 6000
  assert.equal(e.nonCachedInput, 6000);    // max(0, 10000 - 4000)
  assert.equal(e.cachedInput, 4000);
  assert.equal(e.output, 2000);            // output already folds in reasoning
  assert.equal(e.reasoningOutput, 500);    // informational subset; not added to raw total
  assert.equal(e.ts, "2026-03-27T10:05:01.000Z"); // last line timestamp
});

test("toRecords normalizes to a coding session record with a priced USD estimate", () => {
  const rec = toRecords([parseSession(VALID)!])[0];
  assert.equal(rec.provider, "codex");
  assert.equal(rec.category, "coding");
  assert.equal(rec.operation, "session");
  assert.equal(rec.model, "gpt-5.5");
  assert.equal(rec.quantity, 12000);
  assert.equal(rec.unit, "token");
  assert.equal(rec.rawAmount, 12000);
  assert.equal(rec.rawUnit, "tokens");
  assert.deepEqual(rec.tokenUsage, {
    input: 6000,
    output: 2000,
    cacheRead: 4000,
    cacheCreate: 0,
    reasoningOutput: 500,
  });
  assert.equal(rec.source, "log");
  assert.equal(rec.confidence, "medium");
  assert.equal(rec.verified, false);
  // gpt-5.5 rate (per Mtok): input 1.25, cachedInput 0.125, output 10.
  // 6000*1.25 + 4000*0.125 + 2000*10 = 7500 + 500 + 20000 = 28000 / 1e6 = 0.028
  assert.equal(rec.usdEst, 0.028);
});

test("parseSession skips a session with no populated token_count", () => {
  const noTokens = [
    '{"timestamp":"2026-03-27T11:00:00.000Z","type":"turn_context","payload":{"model":"gpt-5.4"}}',
    '{"timestamp":"2026-03-27T11:00:01.000Z","type":"event_msg","payload":{"type":"token_count","info":null}}',
    '{"timestamp":"2026-03-27T11:00:02.000Z","type":"response_item","payload":{"role":"assistant"}}',
  ].join("\n");
  assert.equal(parseSession(noTokens), null);
});

test("parseSession skips a session with no turn_context model", () => {
  const noModel = [
    '{"timestamp":"2026-03-27T11:00:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":100,"cached_input_tokens":0,"output_tokens":50,"reasoning_output_tokens":0,"total_tokens":150}}}}',
  ].join("\n");
  assert.equal(parseSession(noModel), null);
});

test("parseSession takes the LAST model when it changes mid-session", () => {
  const multi = [
    '{"timestamp":"2026-03-27T12:00:00.000Z","type":"turn_context","payload":{"model":"gpt-5.4"}}',
    '{"timestamp":"2026-03-27T12:01:00.000Z","type":"turn_context","payload":{"model":"gpt-5.6-sol"}}',
    '{"timestamp":"2026-03-27T12:02:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":3000,"cached_input_tokens":0,"output_tokens":1000,"reasoning_output_tokens":0,"total_tokens":4000}}}}',
  ].join("\n");
  assert.equal(parseSession(multi)!.model, "gpt-5.6-sol");
});

test("priceFor is first-match-wins: gpt-5.5 full rate, mini cheaper, non-Codex undefined", () => {
  assert.equal(priceFor("gpt-5.5")!.input, 1.25 / 1e6);
  assert.equal(priceFor("gpt-5.5")!.output, 10 / 1e6);
  // gpt-5.4-mini must fall to the mini rule, not the 5.4 rule (negative lookahead).
  assert.equal(priceFor("gpt-5.4-mini")!.input, 0.25 / 1e6);
  assert.equal(priceFor("gpt-5.4-mini")!.output, 2 / 1e6);
  assert.equal(priceFor("gpt-5-codex")!.input, 1.25 / 1e6);
  assert.equal(priceFor("gpt-5.6-sol")!.output, 10 / 1e6);
  assert.equal(priceFor("gpt-5")!.input, 1.25 / 1e6); // family fallback
  assert.equal(priceFor("dall-e-3"), undefined);      // non-Codex model -> no estimate
});

test("collectEntries walks a sessions tree, skips empties, and derives ts from the path", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-sessions-"));
  const day = join(root, "2026", "03", "27");
  mkdirSync(day, { recursive: true });
  writeFileSync(join(day, "rollout-valid.jsonl"), VALID);
  // No top-level timestamps anywhere -> ts must come from the YYYY/MM/DD path.
  writeFileSync(
    join(day, "rollout-nots.jsonl"),
    [
      '{"type":"turn_context","payload":{"model":"gpt-5.4"}}',
      '{"type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":2000,"cached_input_tokens":0,"output_tokens":500,"reasoning_output_tokens":0,"total_tokens":2500}}}}',
    ].join("\n"),
  );
  // No populated token usage -> skipped entirely.
  writeFileSync(
    join(day, "rollout-empty.jsonl"),
    '{"timestamp":"2026-03-27T09:00:00.000Z","type":"turn_context","payload":{"model":"gpt-5.4"}}',
  );

  const entries = collectEntries(root);
  assert.equal(entries.length, 2); // valid + nots; empty skipped
  const nots = entries.find((e) => e.model === "gpt-5.4")!;
  assert.equal(nots.ts, "2026-03-27T00:00:00.000Z"); // path-derived fallback

  const recs = toRecords(entries);
  assert.equal(recs.length, 2);
  assert.ok(recs.every((r) => r.provider === "codex" && r.category === "coding"));
});
