#!/usr/bin/env node
// SMA Gen3 release-train gate: composes the free-local gates that must pass
// before any shared-hot-path / release change is considered done.

import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  ["Gen3 config", ["node", ["scripts/sma-gen3.mjs", "check"]]],
  ["Telemetry audit (strict)", ["node", ["scripts/telemetry-audit.mjs", "--strict"]]],
  ["Control-plane tests", ["node", ["--test", "scripts/__tests__/**/*.test.mjs"]]],
  ["Package unit tests", ["node", ["--test", "packages/**/__tests__/**/*.test.ts"]]],
  ["Typecheck", ["node", ["scripts/typecheck.mjs"]]],
];

let failed = 0;
for (const [label, [cmd, args]] of steps) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) { failed++; console.error(`✗ ${label} failed`); }
}

console.log(failed ? `\n✗ release gate: ${failed} step(s) failed.` : `\n✓ release gate: all steps passed.`);
process.exit(failed ? 1 : 0);
