import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS, getProvider, providersInDomain } from "../registry.ts";

test("provider catalog has unique ids and broad global creator coverage", () => {
  const ids = PROVIDERS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["qwen", "doubao", "mistral", "aleph-alpha", "veo", "poe", "midjourney", "comfyui", "ollama", "lmstudio", "suno", "udio", "heygen"]) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
  assert.ok(PROVIDERS.filter((p) => p.categories.includes("video")).length >= 15);
  assert.ok(PROVIDERS.filter((p) => p.categories.includes("audio")).length >= 12);
  assert.ok(PROVIDERS.filter((p) => p.categories.includes("3d")).length >= 5);
});

test("provider catalog keeps non-AI subscriptions separate from metered AI", () => {
  assert.ok(providersInDomain("creative").includes("canva"));
  assert.ok(providersInDomain("dev").includes("supabase"));
  assert.ok(providersInDomain("ai").includes("higgsfield"));
});

test("manual-only and unverified API providers are labelled honestly", () => {
  assert.equal(getProvider("poe")?.status, "manual-only");
  assert.equal(getProvider("perplexity")?.status, "built");
  assert.equal(getProvider("perplexity")?.verified, false);
  assert.equal(getProvider("mistral")?.verified, false);
  assert.match(getProvider("poe")?.method ?? "", /manual/);
  assert.equal(getProvider("midjourney")?.status, "manual-only");
  assert.equal(getProvider("midjourney")?.verified, false);
  assert.match(getProvider("midjourney")?.method ?? "", /official \/info lifetime-image import/);
});
