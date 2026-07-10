// Control-plane tests: prove the classifier + validator behave, and that the
// live sma.gen3.json is structurally valid. Run: node --test scripts/__tests__
import { test } from "node:test";
import assert from "node:assert/strict";
import { globToRegExp, classifyFile, classifyChangeset, validateConfig, loadConfig } from "../lib/sma-gen3.mjs";

test("globToRegExp: ** crosses path segments, * does not", () => {
  assert.ok(globToRegExp("packages/adapters/**").test("packages/adapters/src/suno/index.ts"));
  assert.ok(globToRegExp("packages/*/index.ts").test("packages/cli/index.ts"));
  assert.ok(!globToRegExp("packages/*/index.ts").test("packages/cli/src/index.ts"));
  assert.ok(globToRegExp("package.json").test("package.json"));
  assert.ok(!globToRegExp("package.json").test("packages/cli/package.json"));
});

const cfg = loadConfig();

test("live sma.gen3.json is valid", () => {
  const { ok, errors } = validateConfig(cfg);
  assert.equal(ok, true, "errors: " + errors.join("; "));
});

test("cost policy is free-local-first", () => {
  assert.equal(cfg.costPolicy.paidServicesEnabledByDefault, false);
});

test("shared hot path wins over module (auth submit surface)", () => {
  const r = classifyFile("packages/web/src/app/api/submit/route.ts", cfg);
  assert.equal(r.lane, "shared-hot-path");
});

test("adapter file resolves to the right partition", () => {
  const r = classifyFile("packages/adapters/src/higgsfield/index.ts", cfg);
  assert.equal(r.lane, "single-module");
  assert.equal(r.owner, "adapters");
  assert.equal(r.partition, "higgsfield");
});

test("core is a shared contract surface", () => {
  const r = classifyFile("packages/core/src/schema/record.ts", cfg);
  assert.equal(r.lane, "shared-hot-path");
});

test("agent context receipts are serialized SMA control-plane evidence", () => {
  const r = classifyFile(".smarch/agent-context/example-edit.ndjson", cfg);
  assert.equal(r.lane, "shared-hot-path");
  assert.equal(r.owner, "sma-control-plane");
  assert.deepEqual(r.gates, ["agent-preflight", "affected-ci"]);
});

test("maintainer policy and planning files stay inside the SMA control plane", () => {
  for (const file of [".gitignore", "CONTRIBUTING.md", "PLAN.md"]) {
    const r = classifyFile(file, cfg);
    assert.equal(r.lane, "shared-hot-path", file);
    assert.equal(r.owner, "sma-control-plane", file);
  }
});

test("unknown path is unmapped", () => {
  const r = classifyFile("random/thing.txt", cfg);
  assert.equal(r.lane, "unmapped");
});

test("changeset spanning two modules is multi-module", () => {
  const r = classifyChangeset(
    ["packages/cli/src/index.ts", "packages/adapters/src/suno/index.ts"], cfg);
  assert.equal(r.lane, "multi-module");
  assert.deepEqual(new Set(r.modulesTouched), new Set(["cli", "adapters"]));
});

test("changeset touching a hot path is serialized", () => {
  const r = classifyChangeset(
    ["packages/cli/src/index.ts", "package.json"], cfg);
  assert.equal(r.lane, "shared-hot-path");
});
