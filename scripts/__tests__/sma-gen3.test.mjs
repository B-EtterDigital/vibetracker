// Control-plane tests: prove the classifier + validator behave, and that the
// live sma.gen3.json is structurally valid. Run: node --test scripts/__tests__
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  globToRegExp,
  classifyFile,
  classifyChangeset,
  validateConfig,
  loadConfig,
} from "../lib/sma-gen3.mjs";

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

test("every declared brick manifest exists and belongs to this project", () => {
  assert.equal(cfg.brickManifestPolicy.required, true);
  assert.equal(cfg.brickManifestPolicy.projectId, cfg.project.graphifyProjectId);
  assert.ok(cfg.brickManifestPolicy.manifests.length > cfg.modules.length);

  for (const manifestPath of cfg.brickManifestPolicy.manifests) {
    const manifest = JSON.parse(readFileSync(join(REPO_ROOT, manifestPath), "utf8"));
    assert.equal(manifest.schema_version, "1.0.0", manifestPath);
    assert.equal(manifest.source.project, cfg.project.graphifyProjectId, manifestPath);
    assert.ok(manifest.brick.id, manifestPath);
    assert.ok(manifest.boundaries.owned_paths.length > 0, manifestPath);
  }
});

test("missing brick manifests fail the portable Gen3 check", () => {
  const broken = structuredClone(cfg);
  broken.brickManifestPolicy.manifests[0] = "packages/missing/module.sweetspot.json";
  const { ok, errors } = validateConfig(broken);
  assert.equal(ok, false);
  assert.ok(errors.some((error) => error.includes("missing brick manifest")));
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

test("brick manifests and the local registry are serialized SMA control-plane evidence", () => {
  for (const file of ["packages/web/module.sweetspot.json", ".sweetspot/modules.json"]) {
    const r = classifyFile(file, cfg);
    assert.equal(r.lane, "shared-hot-path", file);
    assert.equal(r.owner, "sma-control-plane", file);
  }
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
