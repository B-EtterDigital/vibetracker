#!/usr/bin/env node
// Lenient typecheck gate. Runs `tsc --noEmit` for every package that has a
// tsconfig.json; passes cleanly during bootstrap when no TypeScript exists yet.

import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKGS = join(ROOT, "packages");

let checked = 0;
let failed = 0;

// Can't run tsc without TypeScript + package deps installed. Skip cleanly until they are
// (esbuild alone, used to build the CLI bundle, does not pull in tsc).
if (!existsSync(join(ROOT, "node_modules", "typescript"))) {
  console.log("✓ typecheck: TypeScript not installed (bundle-only build) — skipping tsc.");
  process.exit(0);
}

if (existsSync(PKGS)) {
  for (const name of readdirSync(PKGS)) {
    const cfg = join(PKGS, name, "tsconfig.json");
    if (!existsSync(cfg)) continue;
    checked++;
    const r = spawnSync("npx", ["tsc", "-p", cfg, "--noEmit"], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) failed++;
  }
}

if (checked === 0) {
  console.log("✓ typecheck: no package tsconfig.json yet (bootstrap) — nothing to check.");
  process.exit(0);
}
console.log(failed ? `✗ typecheck: ${failed}/${checked} package(s) failed.` : `✓ typecheck: ${checked} package(s) clean.`);
process.exit(failed ? 1 : 0);
