import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { hasLogo, logoPath, PROVIDER_LOGO_IDS, PROVIDER_LOGO_FILES } from "../provider-logos.ts";
import { providerBrand } from "../provider-brand.ts";

const here = dirname(fileURLToPath(import.meta.url));
const logoDir = resolve(here, "..", "..", "..", "public", "provider-logos");

test("resolver returns a path only for ids with a real asset", () => {
  assert.equal(hasLogo("claude-code"), true);
  assert.equal(logoPath("claude-code"), "/provider-logos/claude-code.svg");
  assert.equal(hasLogo("XAI"), true, "resolution is case-insensitive");
  assert.equal(logoPath("Anthropic"), "/provider-logos/anthropic.svg");

  // OpenAI/Codex (svgrepo) and Runway (svgl) were sourced beyond Simple Icons.
  assert.equal(logoPath("runway"), "/provider-logos/runway.svg");

  // Brands with no public SVG use their original-colour favicon/apple-touch-icon PNG.
  assert.equal(logoPath("higgsfield"), "/provider-logos/higgsfield.png");
  assert.equal(logoPath("falai"), "/provider-logos/falai.png");
  assert.equal(logoPath("openclaw"), "/provider-logos/openclaw.png");
  // 2026-07-19: real brand favicons landed for the browser-Bridge sources too.
  for (const id of ["midjourney", "udio", "leonardo", "seaart", "tensorart", "pixverse", "vidu"]) {
    assert.equal(logoPath(id), `/provider-logos/${id}.png`, `${id} now has a real logo`);
  }

  // Providers with no available brand asset resolve to null -> monogram fallback.
  for (const missing of ["kling", "haiper", "luma", "devin", "not-a-provider"]) {
    assert.equal(hasLogo(missing), false, `${missing} should have no logo`);
    assert.equal(logoPath(missing), null, `${missing} should resolve to null`);
  }
});

test("every resolved logo id has a matching asset on disk", () => {
  // Coverage: the hardcoded manifest must equal the actual fetched assets — no dangling path
  // (would 404 in the browser). SVGs are additionally checked to be bone monochrome; PNGs are
  // brand-coloured apple-touch-icons and only need to exist.
  for (const id of PROVIDER_LOGO_IDS) {
    const file = PROVIDER_LOGO_FILES[id];
    const path = resolve(logoDir, file);
    assert.ok(existsSync(path), `${file} must exist on disk`);
    if (file.endsWith(".svg")) {
      const svg = readFileSync(path, "utf8");
      assert.ok(svg.includes("<svg"), `${file} must be a real SVG`);
      assert.ok(!/<html/i.test(svg), `${file} must not be an error page`);
      assert.ok(svg.includes("#eef7f4"), `${file} must be bone (#eef7f4) monochrome`);
    }
  }
});

test("providerBrand exposes logo for logo providers and keeps monogram fields intact", () => {
  const withLogo = providerBrand("claude-code");
  assert.equal(withLogo.logo, "/provider-logos/claude-code.svg");
  // Fallback fields are preserved so the chip background + monogram still work.
  assert.equal(withLogo.mark, "CC");
  assert.equal(withLogo.from, "#d97757");

  // A logo id that has no explicit brand entry still gets its logo (via fallback branch).
  assert.equal(providerBrand("grok").logo, "/provider-logos/grok.svg");

  // Higgsfield now carries a PNG logo while keeping its monogram fields.
  assert.equal(providerBrand("higgsfield").logo, "/provider-logos/higgsfield.png");

  // A provider with a brand but no logo keeps mark/from/to/ink and has no logo.
  const noLogo = providerBrand("kling");
  assert.equal(noLogo.logo, undefined);
  assert.equal(noLogo.mark, "KL");
  assert.equal(noLogo.from, "#0f172a");
});
