import { test } from "node:test";
import assert from "node:assert/strict";
import { extractOpenAIUsage } from "../proxy.ts";

const resp = { id: "x", model: "llama3.1", usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 } };

test("extracts token usage from an OpenAI-compatible response", () => {
  const r = extractOpenAIUsage(resp, { provider: "ollama", source: "local" })!;
  assert.equal(r.provider, "ollama");
  assert.equal(r.model, "llama3.1");
  assert.equal(r.rawAmount, 150);
  assert.equal(r.rawUnit, "tokens");
  assert.equal(r.source, "local");
});

test("applies per-token pricing when given", () => {
  const r = extractOpenAIUsage(resp, { provider: "openrouter", usdPerInputToken: 0.000003, usdPerOutputToken: 0.000015 })!;
  assert.equal(r.usdEst, 0.00105); // 100*3e-6 + 50*15e-6
});

test("no usage / non-object → null", () => {
  assert.equal(extractOpenAIUsage({ model: "x" }, { provider: "p" }), null);
  assert.equal(extractOpenAIUsage("nope", { provider: "p" }), null);
  assert.equal(extractOpenAIUsage({ usage: { total_tokens: 0 } }, { provider: "p" }), null);
});
