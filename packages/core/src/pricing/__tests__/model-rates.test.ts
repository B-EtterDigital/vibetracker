import assert from "node:assert/strict";
import { test } from "node:test";
import type { NormalizedRecord } from "../../schema/record.ts";
import {
  estimateTokenUsd,
  MODEL_RATES,
  normalizeModelId,
  unpricedTokenModels,
} from "../model-rates.ts";

function record(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-20T00:00:00.000Z",
    provider: "claude-code",
    category: "coding",
    operation: "session",
    model: "claude-opus-4-8",
    quantity: 2_000_000,
    unit: "token",
    rawAmount: 2_000_000,
    rawUnit: "tokens",
    tokenUsage: { input: 1_000_000, output: 1_000_000, cacheRead: 0, cacheCreate: 0 },
    source: "log",
    confidence: "medium",
    verified: false,
    ...overrides,
  };
}

test("registry preserves the published source metadata and per-model fields", () => {
  assert.equal(MODEL_RATES.asOf, "2026-07-02");
  assert.deepEqual(MODEL_RATES.sources, [
    "https://platform.claude.com/docs/en/about-claude/pricing",
    "https://www.anthropic.com/news/claude-fable-5-mythos-5",
    "https://developers.openai.com/api/docs/pricing",
  ]);
  assert.deepEqual(MODEL_RATES.perMTok["claude-opus-4-8"], {
    input: 5,
    output: 25,
    cacheWrite: 6.25,
    cacheRead: 0.5,
  });
});

test("Claude input, output, cache-read, and cache-create classes use their own rates", () => {
  assert.equal(estimateTokenUsd(record()), 30);
  assert.equal(estimateTokenUsd(record({ tokenUsage: { input: 1_000_000, output: 0, cacheRead: 0, cacheCreate: 0 } })), 5);
  assert.equal(estimateTokenUsd(record({ tokenUsage: { input: 0, output: 1_000_000, cacheRead: 0, cacheCreate: 0 } })), 25);
  assert.equal(estimateTokenUsd(record({ tokenUsage: { input: 0, output: 0, cacheRead: 1_000_000, cacheCreate: 0 } })), 0.5);
  assert.equal(estimateTokenUsd(record({ tokenUsage: { input: 0, output: 0, cacheRead: 0, cacheCreate: 1_000_000 } })), 6.25);
});

test("model normalization removes ledger provider prefixes and terminal dates only", () => {
  assert.equal(normalizeModelId("claude-opus-4-8-20250601"), "claude-opus-4-8");
  assert.equal(normalizeModelId("anthropic/claude-opus-4-8-2025-06-01"), "claude-opus-4-8");
  assert.equal(normalizeModelId("[codex] gpt-5.5"), "gpt-5.5");
  assert.equal(normalizeModelId("openai:gpt-5.6-sol"), "gpt-5.6-sol");
  assert.equal(normalizeModelId("claude-opus-4-8[1m]"), "claude-opus-4-8");
  assert.equal(estimateTokenUsd(record({ model: "anthropic/claude-opus-4-8-20250601" })), 30);
  assert.equal(estimateTokenUsd(record({ model: "claude-opus-4-8[1m]" })), 30);
});

test("OpenAI cachedInput prices cache reads and never invents a cache-write rate", () => {
  assert.equal(estimateTokenUsd(record({
    model: "openai/gpt-5.5",
    tokenUsage: { input: 0, output: 0, cacheRead: 1_000_000, cacheCreate: 0 },
  })), 0.5);
  assert.equal(estimateTokenUsd(record({
    model: "openai/gpt-5.5",
    tokenUsage: { input: 0, output: 0, cacheRead: 0, cacheCreate: 1_000_000 },
  })), 0);
});

test("unpublished and malformed model usage stays undefined", () => {
  assert.equal(estimateTokenUsd(record({ model: "claude-sonnet-unknown" })), undefined);
  assert.equal(estimateTokenUsd(record({ model: undefined })), undefined);
  assert.equal(estimateTokenUsd(record({ tokenUsage: undefined })), undefined);
  assert.equal(estimateTokenUsd(record({
    tokenUsage: { input: -1, output: 0, cacheRead: 0, cacheCreate: 0 },
  })), undefined);
});

test("unpriced model inventory is distinct, volume-summed, sorted, and skips priced rows", () => {
  assert.deepEqual(unpricedTokenModels([
    record({ model: "mystery-model", tokenUsage: { input: 10, output: 2, cacheRead: 3, cacheCreate: 1 } }),
    record({ model: "mystery-model", tokenUsage: { input: 4, output: 0, cacheRead: 0, cacheCreate: 0 } }),
    record({ model: "other-model", tokenUsage: { input: 3, output: 0, cacheRead: 0, cacheCreate: 0 } }),
    record({ model: "already-priced", usdEst: 99 }),
    record(),
  ]), [
    { model: "mystery-model", tokens: 20 },
    { model: "other-model", tokens: 3 },
  ]);
});
