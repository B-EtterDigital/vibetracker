import { test } from "node:test";
import assert from "node:assert/strict";

import { createFixtureUsageClient } from "../_shared/http-usage.ts";
import { createQwenAdapter } from "../qwen/index.ts";
import { createDoubaoAdapter } from "../doubao/index.ts";
import { createKimiAdapter } from "../kimi/index.ts";
import { createMistralAdapter } from "../mistral/index.ts";
import { createPerplexityAdapter } from "../perplexity/index.ts";
import { createAlephAlphaAdapter } from "../aleph-alpha/index.ts";
import { createLightOnAdapter } from "../lighton/index.ts";
import { createAdapterFromConfig } from "../index.ts";

const range = { from: "2026-07-01T00:00:00Z", to: "2026-07-31T23:59:59Z" };
const ctx = {
  getSecret: async () => undefined,
  telemetry: {
    captureError: () => undefined,
    addBreadcrumb: () => undefined,
  },
};

test("regional API adapters normalize usage ledger items", async () => {
  const makers = [
    createQwenAdapter,
    createDoubaoAdapter,
    createKimiAdapter,
    createMistralAdapter,
    createPerplexityAdapter,
    createAlephAlphaAdapter,
    createLightOnAdapter,
  ];
  for (const make of makers) {
    const adapter = make(createFixtureUsageClient([{
      ts: "2026-07-05T12:00:00Z",
      model: "regional-model",
      amount: 1200,
      unit: "token",
      rawUnit: "tokens",
      usd: 0.24,
      category: "llm",
    }]));
    const records = await adapter.getUsage(range, ctx);
    assert.equal(records.length, 1, adapter.id);
    assert.equal(records[0]?.provider, adapter.id);
    assert.equal(records[0]?.category, "llm");
    assert.equal(records[0]?.source, "ledger");
    assert.equal(records[0]?.verified, false);
    assert.equal(records[0]?.rawAmount, 1200);
  }
});

test("provider factory wires new regional providers and oauth bearer tokens", () => {
  for (const id of ["qwen", "doubao", "kimi", "mistral", "perplexity", "aleph-alpha", "lighton"]) {
    const adapter = createAdapterFromConfig(id, { token: "oauth-or-api-token" });
    assert.equal(adapter.id, id);
    assert.equal(adapter.auth.kind, "apiKey");
  }
  assert.throws(() => createAdapterFromConfig("perplexity", {}), /apiKey\/token/);
});
