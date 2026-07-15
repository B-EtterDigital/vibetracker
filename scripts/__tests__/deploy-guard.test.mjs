import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  REFUSALS,
  evaluatePreconditions,
  validateDeployConfig,
} from "../../tools/lib/deploy-guard-core.mjs";

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CONFIG_PATH = join(ROOT, "sma.deploy.json");
const PACKAGE_PATH = join(ROOT, "package.json");
const GITIGNORE_PATH = join(ROOT, ".gitignore");

const config = validateDeployConfig(JSON.parse(readFileSync(CONFIG_PATH, "utf8")));

const facts = (overrides = {}) => ({
  cwdRoot: config.canonicalRoot,
  dirtyCount: 0,
  head: "current",
  branch: "feat/c0vibe-integration",
  upstream: { exists: true, ahead: 0 },
  live: { status: "ok", stamp: { commit: "current", id: "live" } },
  liveCommitKnown: true,
  liveIsAncestor: true,
  ...overrides,
});

const refusalCodes = (overrides, options) => evaluatePreconditions({
  config,
  facts: facts(overrides),
  options,
}).refusals.map((refusal) => refusal.code);

test("deploy config pins the canonical VibeUsage production target", () => {
  assert.equal(config.project, "vibeusage-web");
  assert.equal(config.canonicalRoot, ROOT);
  assert.equal(config.stampPath, "packages/web/public/deploy-stamp.json");
  assert.equal(config.liveStampUrl, "https://vibeusage.c0vibe.app/deploy-stamp.json");
  assert.match(config.deploy, /^netlify deploy --prod --build --site 4c8f274c-f633-4806-9741-bf081773668c\b/);
});

test("deploy command and generated state route through the SMARCH guard", () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_PATH, "utf8"));
  const ignored = readFileSync(GITIGNORE_PATH, "utf8");

  assert.equal(pkg.scripts["deploy:web"], "node tools/sma-deploy-guard.mjs --why");
  assert.match(ignored, /^\.sma\/$/m);
  assert.match(ignored, /^packages\/web\/public\/deploy-stamp\.json$/m);
});

test("every deploy refusal is fail-closed", () => {
  assert.deepEqual(refusalCodes({ cwdRoot: "/tmp/vibeusage-stale-snapshot" }), [REFUSALS.NOT_CANONICAL]);
  assert.deepEqual(refusalCodes({ dirtyCount: 1 }), [REFUSALS.DIRTY]);
  assert.deepEqual(refusalCodes({ upstream: { exists: false, ahead: 0 } }), [REFUSALS.NO_UPSTREAM]);
  assert.deepEqual(refusalCodes({ upstream: { exists: true, ahead: 1 } }), [REFUSALS.UNPUSHED]);
  assert.deepEqual(refusalCodes({ live: { status: "unreachable", error: "offline" } }), [REFUSALS.LIVE_UNREACHABLE]);
  assert.deepEqual(refusalCodes({ liveIsAncestor: false }), [REFUSALS.LIVE_NOT_ANCESTOR]);
});

test("bootstrap and explicit rollback overrides remain attributable", () => {
  const bootstrap = evaluatePreconditions({
    config,
    facts: facts({ live: { status: "missing" } }),
  });
  assert.equal(bootstrap.ok, true);
  assert.match(bootstrap.warnings.join("\n"), /bootstrap/);

  const rollback = evaluatePreconditions({
    config,
    facts: facts({ liveIsAncestor: false }),
    options: { force: "human-confirmed rollback" },
  });
  assert.equal(rollback.ok, true);
  assert.deepEqual(rollback.overrides.map((override) => override.kind), ["force"]);
});

test("guard CLI refuses a dirty canonical tree before build or deploy", () => {
  const dirtyPath = join(ROOT, `.deploy-guard-test-dirty-${process.pid}`);
  writeFileSync(dirtyPath, "intentional test dirt\n");
  let result;
  try {
    result = spawnSync(process.execPath, ["tools/sma-deploy-guard.mjs", "--why", "--", "contract test", "--dry-run"], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } finally {
    rmSync(dirtyPath, { force: true });
  }

  assert.equal(result.status, 11);
  assert.match(result.stderr, /REFUSED dirty-tree/);
  assert.doesNotMatch(result.stdout, /\[deploy-guard\] build:/);
  assert.doesNotMatch(result.stdout, /\[deploy-guard\] deploy:/);
});
