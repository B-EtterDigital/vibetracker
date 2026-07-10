import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../../../adapters/src/registry.ts";
import { EXPLICIT_PROVIDER_BRAND_IDS, hasProviderBrand, providerBrand } from "../provider-brand.ts";

test("CLI provider brand map covers every registry provider with terminal identity", () => {
  const missing = PROVIDERS.map((provider) => provider.id).filter((id) => !hasProviderBrand(id));

  assert.deepEqual(missing, []);
  assert.ok(EXPLICIT_PROVIDER_BRAND_IDS.length >= PROVIDERS.length);
  assert.equal(PROVIDERS.every((provider) => EXPLICIT_PROVIDER_BRAND_IDS.includes(provider.id)), true);

  for (const provider of PROVIDERS) {
    const brand = providerBrand(provider.id);
    assert.equal(brand.id, provider.id);
    assert.equal(typeof brand.label, "string");
    assert.ok(brand.label.length > 0);
    assert.match(brand.mark, /^[A-Z0-9]{1,2}$/);
    assert.match(brand.from, /^#[0-9a-f]{6}$/i);
    assert.match(brand.to, /^#[0-9a-f]{6}$/i);
    assert.match(brand.ink, /^#[0-9a-f]{6}$/i);
  }
});

test("CLI provider brand keeps exact headline palettes and registry-backed regional tones", () => {
  assert.equal(providerBrand("higgsfield").mark, "HF");
  assert.equal(providerBrand("higgsfield").from, "#ff4fd8");
  assert.equal(providerBrand("c0vibe").mark, "C0");
  assert.equal(providerBrand("codex-cli").to, "#3b82f6");

  assert.equal(providerBrand("tencent-hunyuan").mark, "TH");
  assert.equal(providerBrand("zhipu").mark, "ZB");
  assert.equal(providerBrand("baidu-wenxin").from, "#1677ff");
  assert.equal(providerBrand("mistral").from, "#ff7000");
  assert.equal(providerBrand("luma").mark, "LU");
  assert.equal(providerBrand("vllm").to, "#a78bfa");
  assert.equal(providerBrand("jan").mark, "JN");
  assert.equal(providerBrand("gpt4all").mark, "G4");
  assert.equal(providerBrand("llama-cpp").mark, "LC");
  assert.equal(providerBrand("forge").mark, "FG");
  assert.equal(providerBrand("invokeai").mark, "IN");
  assert.equal(providerBrand("diffusers-local").mark, "DF");
  assert.equal(providerBrand("supabase").label, "Supabase");

  assert.equal(hasProviderBrand("not-a-real-provider"), false);
  assert.equal(providerBrand("not-a-real-provider").mark, "NA");
});
