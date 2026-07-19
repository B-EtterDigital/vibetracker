import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBrowserExtension, isRuntimeExtensionPath } from "../browser-extension-build.ts";

const SOURCE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "browser-extension");

test("isRuntimeExtensionPath excludes reserved, tooling, docs, and test files; keeps runtime", () => {
  // Chrome rejects anything starting with "_" — this is the exact name that blocked the user.
  assert.equal(isRuntimeExtensionPath("/x/__tests__"), false);
  assert.equal(isRuntimeExtensionPath("/x/_locales"), false);
  assert.equal(isRuntimeExtensionPath("/x/node_modules"), false);
  assert.equal(isRuntimeExtensionPath("/x/package.json"), false);
  assert.equal(isRuntimeExtensionPath("/x/tsconfig.json"), false);
  assert.equal(isRuntimeExtensionPath("/x/module.sweetspot.json"), false);
  assert.equal(isRuntimeExtensionPath("/x/README.md"), false);
  assert.equal(isRuntimeExtensionPath("/x/connectors.test.ts"), false);
  assert.equal(isRuntimeExtensionPath("/x/background.ts"), false); // TS source never ships
  // runtime files pass
  for (const f of ["manifest.json", "background.js", "popup.html", "popup.css", "popup-model.mjs", "connectors.mjs", "readers.mjs"]) {
    assert.equal(isRuntimeExtensionPath(`/x/${f}`), true, `${f} must be treated as runtime`);
  }
});

test("buildBrowserExtension produces a clean, Chrome-loadable copy (no __tests__, no tooling)", () => {
  const dest = join(tmpdir(), "vt-ext-build-test");
  try {
    const out = buildBrowserExtension(SOURCE, dest);
    assert.equal(out, dest);
    // every runtime file the manifest/background/popup need is present
    for (const f of ["manifest.json", "background.js", "popup.html", "popup.js", "popup.css", "popup-model.mjs", "connectors.mjs", "readers.mjs"]) {
      assert.equal(existsSync(join(dest, f)), true, `missing runtime file: ${f}`);
    }
    // the branded icons (a whole subdirectory) must survive the copy
    for (const size of ["16", "32", "48", "128"]) {
      assert.equal(existsSync(join(dest, "icons", `icon-${size}.png`)), true, `missing icon-${size}.png`);
    }
    // the entries Chrome rejects or doesn't need are gone — this is the regression lock
    assert.equal(existsSync(join(dest, "__tests__")), false, "__tests__ must never be copied");
    assert.equal(existsSync(join(dest, "module.sweetspot.json")), false);
    assert.equal(existsSync(join(dest, "README.md")), false);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});

test("buildBrowserExtension throws on a source without a manifest (never a silent bad build)", () => {
  assert.throws(() => buildBrowserExtension(tmpdir(), join(tmpdir(), "vt-ext-empty")), /manifest\.json/);
});
