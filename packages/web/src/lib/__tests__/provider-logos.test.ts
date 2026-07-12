import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { hasLogo, logoPath, PROVIDER_LOGO_IDS } from "../provider-logos.ts";
import { providerBrand } from "../provider-brand.ts";

const here = dirname(fileURLToPath(import.meta.url));
const logoDir = resolve(here, "..", "..", "..", "public", "provider-logos");

test("resolver returns a path only for ids with a real asset", () => {
  assert.equal(hasLogo("claude-code"), true);
  assert.equal(logoPath("claude-code"), "/provider-logos/claude-code.svg");
  assert.equal(hasLogo("XAI"), true, "resolution is case-insensitive");
  assert.equal(logoPath("Anthropic"), "/provider-logos/anthropic.svg");

  // OpenAI/Codex (svgrepo) and Runway (svgl) were sourced beyond Simple Icons.
  assert.equal(hasLogo("openai"), true);
  assert.equal(hasLogo("codex"), true);
  assert.equal(logoPath("runway"), "/provider-logos/runway.svg");

  // Providers with no available brand SVG resolve to null -> monogram fallback.
  for (const missing of ["kling", "higgsfield", "udio", "luma", "not-a-provider"]) {
    assert.equal(hasLogo(missing), false, `${missing} should have no logo`);
    assert.equal(logoPath(missing), null, `${missing} should resolve to null`);
  }
});

test("every resolved logo id has a matching bone-colored SVG on disk", () => {
  // Coverage: the hardcoded manifest must equal the actual fetched assets — no
  // dangling path (would 404 in the browser) and no orphan file (would never render).
  const filesOnDisk = readdirSync(logoDir)
    .filter((name) => name.endsWith(".svg"))
    .map((name) => name.slice(0, -4))
    .sort();
  assert.deepEqual([...PROVIDER_LOGO_IDS], filesOnDisk, "manifest must match public/provider-logos/*.svg");

  for (const id of PROVIDER_LOGO_IDS) {
    const svg = readFileSync(resolve(logoDir, `${id}.svg`), "utf8");
    assert.ok(svg.includes("<svg"), `${id}.svg must be a real SVG`);
    assert.ok(!/<html/i.test(svg), `${id}.svg must not be an error page`);
    assert.ok(svg.includes("#eef7f4"), `${id}.svg must be bone (#eef7f4) monochrome`);
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

  // A provider with a brand but no logo keeps mark/from/to/ink and has no logo.
  const noLogo = providerBrand("kling");
  assert.equal(noLogo.logo, undefined);
  assert.equal(noLogo.mark, "KL");
  assert.equal(noLogo.from, "#0f172a");
});
