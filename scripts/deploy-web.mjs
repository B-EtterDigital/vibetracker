#!/usr/bin/env node
// Guarded production deploy for the VibeUsage web app — THE only sanctioned way to deploy.
//
// Born from a real incident (2026-07-15): a second agent session deployed a stale checkout over
// fresh production work — five untitled CLI deploys, no branch/commit metadata, silently
// reverting the live profile. This script makes that class of failure loud and hard to commit:
//
//   1. LOCK      — refuses to run while another `netlify deploy` process is alive, and takes an
//                  atomic lock dir so two guarded deploys can't interleave.
//   2. STAMP     — writes a unique deploy stamp into public/deploy-stamp.json BEFORE building,
//                  so the artifact carries its own provenance (who, when, from which tree).
//   3. FRESH     — clears .next and the .netlify deploy scratch (stale-cache white-page bug,
//                  corrupt-blob race) and builds clean via the same command netlify.toml uses.
//   4. VERIFY    — after "Deploy is live", fetches /deploy-stamp.json from production and FAILS
//                  LOUDLY if it isn't this run's stamp — an overwrite or half-applied deploy can
//                  no longer masquerade as success.
//
// Usage: pnpm deploy:web -- "message describing the deploy"
// Never run `netlify deploy` directly. Canonical tree: ~/DEV/Projects/000_VibeTRACKER.

import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ID = "4c8f274c-f633-4806-9741-bf081773668c"; // vibeusage — pinned, never from dir links
const LIVE_ORIGIN = "https://vibeusage.c0vibe.app";
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WEB = join(ROOT, "packages", "web");
const LOCK_DIR = "/tmp/vibeusage-deploy.lock";

const message = process.argv.slice(2).join(" ").trim() || "guarded deploy";

function fail(reason) {
  console.error(`\n✗ DEPLOY BLOCKED — ${reason}`);
  process.exit(1);
}

// BREAK-GLASS ONLY: the sanctioned deploy path is `pnpm deploy:web` (tools/sma-deploy-guard.mjs,
// full R1–R5 refusals). This script exists solely for the cron watchdog's auto-restore, which must
// work even when the tree is dirty mid-work. It still refuses snapshot trees outright:
const CANONICAL = "/home/bdd-main/DEV/Projects/000_VibeTRACKER";
if (ROOT !== CANONICAL) {
  fail(`running from ${ROOT} — deploys run ONLY from the canonical tree ${CANONICAL}. Snapshots go stale and clobber other lanes.`);
}

// 1 ─ concurrency guards -------------------------------------------------------------------------
const running = spawnSync("pgrep", ["-af", "netlify deploy"], { encoding: "utf8" }).stdout
  .split("\n").filter((l) => l && !l.includes("pgrep")).filter((l) => !l.includes("deploy-web.mjs"));
if (running.length) {
  fail(`another netlify deploy is already running — wait for it:\n${running.join("\n")}`);
}
try {
  mkdirSync(LOCK_DIR); // atomic: fails if a guarded deploy already holds the lock
} catch {
  fail(`lock ${LOCK_DIR} is held — another guarded deploy is in flight. If it crashed: rmdir it.`);
}
const releaseLock = () => { try { rmSync(LOCK_DIR, { recursive: true, force: true }); } catch { /* released with the process */ } };
process.on("exit", releaseLock);
process.on("SIGINT", () => process.exit(130));

// 2 ─ stamp the artifact --------------------------------------------------------------------------
const stamp = {
  stamp: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  at: new Date().toISOString(),
  host: hostname(),
  tree: ROOT,
  message,
};
mkdirSync(join(WEB, "public"), { recursive: true });
writeFileSync(join(WEB, "public", "deploy-stamp.json"), JSON.stringify(stamp, null, 2));
console.log(`→ stamped ${stamp.stamp} (${message})`);

// 3 ─ unlock (if locked), fresh build + deploy ---------------------------------------------------
// Production is kept LOCKED to the last verified deploy (incident 2026-07-15: a second agent's
// stale builds kept overwriting fresh work). Locked deploys still build; they just can't take
// production. Only this script — unlock → deploy → verify → re-lock — publishes.
function api(method, dataJson) {
  const out = spawnSync("netlify", ["api", method, "--data", dataJson], { encoding: "utf8" });
  if (out.status !== 0) return null;
  try { return JSON.parse(out.stdout); } catch { return null; }
}
const before = api("getSite", JSON.stringify({ site_id: SITE_ID }));
const publishedBefore = before?.published_deploy?.id ?? null;
if (publishedBefore && before?.published_deploy?.locked) {
  console.log(`→ unlocking pinned deploy ${publishedBefore}…`);
  api("unlockDeploy", JSON.stringify({ deploy_id: publishedBefore }));
}
for (const scratch of [join(WEB, ".next"), join(WEB, ".netlify", "deploy")]) {
  if (existsSync(scratch)) rmSync(scratch, { recursive: true, force: true });
}
console.log("→ scratch cleared, deploying (fresh build via netlify.toml)…");
try {
  execSync(
    `netlify deploy --prod --build --site ${SITE_ID} --message ${JSON.stringify(message)}`,
    { cwd: ROOT, stdio: "inherit" },
  );
} catch {
  fail("netlify deploy exited non-zero — production was NOT verified. Fix and rerun.");
}

// 4 ─ verify the live site is THIS build ----------------------------------------------------------
console.log("→ verifying production serves this exact build…");
let live = null;
for (let attempt = 1; attempt <= 5; attempt += 1) {
  try {
    const res = await fetch(`${LIVE_ORIGIN}/deploy-stamp.json`, { cache: "no-store" });
    if (res.ok) { live = await res.json(); if (live?.stamp === stamp.stamp) break; }
  } catch { /* transient CDN propagation — retried below */ }
  await new Promise((r) => setTimeout(r, 4000 * attempt));
}
if (live?.stamp !== stamp.stamp) {
  fail(
    `LIVE STAMP MISMATCH — production serves ${live?.stamp ?? "no stamp"} (${live?.at ?? "?"}, "${live?.message ?? "?"}"), expected ${stamp.stamp}.\n` +
    "  Someone else deployed over this build, or the deploy half-applied. Investigate BEFORE redeploying blindly.",
  );
}

// 5 ─ re-lock production to this verified deploy ---------------------------------------------------
const after = api("getSite", JSON.stringify({ site_id: SITE_ID }));
const publishedNow = after?.published_deploy?.id ?? null;
if (publishedNow) {
  const locked = api("lockDeploy", JSON.stringify({ deploy_id: publishedNow }));
  console.log(locked?.locked
    ? `→ production LOCKED to ${publishedNow} — stale deploys can build, never publish`
    : `⚠ could not lock deploy ${publishedNow} — production is unpinned; lock manually: netlify api lockDeploy --data '{"deploy_id":"${publishedNow}"}'`);
} else {
  console.log("⚠ could not resolve the published deploy id — production is unpinned");
}
console.log(`✓ production verified: ${stamp.stamp} — "${message}" is live at ${LIVE_ORIGIN}`);
