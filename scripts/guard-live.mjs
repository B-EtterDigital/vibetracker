#!/usr/bin/env node
// Production watchdog for vibeusage — runs from cron every few minutes.
//
// The failure it ends (2026-07-15, three stale overwrites in one day): agent sessions deploy
// from ephemeral /tmp snapshots of this repo, shipping hours-old UI over fresh production work.
// The guarded deploy script stamps every build with its source tree; this watchdog checks the
// LIVE stamp and, when production is served from any tree other than the canonical one, runs a
// guarded auto-restore from canonical. Canonical is the superset by rule (AGENTS.md): all agents
// edit it directly, so restoring from it never destroys anyone's work.
//
// Fail-soft: network hiccups log and exit; restores are rate-limited so a misbehaving peer can't
// trigger a build war. Install:
//   */5 * * * * <node> scripts/guard-live.mjs >> ~/.vibetracker/guard-live.log 2>&1

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CANONICAL = dirname(dirname(fileURLToPath(import.meta.url)));
const LIVE_STAMP_URL = "https://vibeusage.c0vibe.app/deploy-stamp.json";
const STATE_DIR = join(homedir(), ".vibetracker");
const STATE_FILE = join(STATE_DIR, "guard-live-state.json");
const MIN_RESTORE_GAP_MS = 30 * 60 * 1000; // one auto-restore per 30 min, max

const now = new Date().toISOString();
const log = (msg) => console.log(`[${now}] ${msg}`);

let live = null;
try {
  const res = await fetch(LIVE_STAMP_URL, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (res.ok) live = await res.json();
} catch {
  log("stamp fetch failed (network?) — skipping this round");
  process.exit(0);
}

if (live?.tree === CANONICAL) {
  process.exit(0); // healthy: production is a canonical build — stay quiet
}

log(`⚠ production is NOT a canonical build — stamp=${live?.stamp ?? "MISSING"} tree=${live?.tree ?? "?"} msg="${live?.message ?? "?"}"`);

// rate-limit restores so two deploying agents can never enter a build war
mkdirSync(STATE_DIR, { recursive: true });
let last = 0;
try {
  last = JSON.parse(readFileSync(STATE_FILE, "utf8")).lastRestore ?? 0;
} catch {
  /* first run — no state yet */
}
if (Date.now() - last < MIN_RESTORE_GAP_MS) {
  log("restore skipped — within the 30-minute rate limit. If this repeats, STOP the session deploying from a snapshot tree.");
  process.exit(0);
}
if (existsSync("/tmp/vibeusage-deploy.lock")) {
  log("a guarded deploy is already in flight — letting it finish");
  process.exit(0);
}

writeFileSync(STATE_FILE, JSON.stringify({ lastRestore: Date.now(), reason: live }));
log("→ auto-restoring production from the canonical tree…");
try {
  execSync(
    `node scripts/deploy-web.mjs ${JSON.stringify(`watchdog auto-restore — live was "${live?.message ?? "unstamped"}" from ${live?.tree ?? "unknown tree"}`)}`,
    { cwd: CANONICAL, stdio: "inherit" },
  );
  log("✓ auto-restore complete");
} catch {
  log("✗ auto-restore FAILED — production is still stale; investigate manually");
  process.exit(1);
}
