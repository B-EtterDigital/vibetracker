#!/usr/bin/env node
// Workspace typecheck gate. Every package with a tsconfig must provide and run
// its own TypeScript compiler; a missing compiler is a gate failure, never a skip.

import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKGS = join(ROOT, "packages");

let checked = 0;
let failed = 0;

if (existsSync(PKGS)) {
  for (const name of readdirSync(PKGS)) {
    const packageRoot = join(PKGS, name);
    const cfg = join(packageRoot, "tsconfig.json");
    if (!existsSync(cfg)) continue;
    checked++;
    const compiler = join(packageRoot, "node_modules", "typescript", "bin", "tsc");
    if (!existsSync(compiler)) {
      failed++;
      console.error(`✗ typecheck: ${name} has tsconfig.json but no package-local TypeScript compiler.`);
      continue;
    }
    const r = spawnSync(process.execPath, [compiler, "-p", cfg, "--noEmit"], {
      cwd: packageRoot,
      stdio: "inherit",
    });
    if (r.status !== 0) failed++;
  }
}

if (checked === 0) {
  console.log("✓ typecheck: no package tsconfig.json yet (bootstrap) — nothing to check.");
  process.exit(0);
}
console.log(failed ? `✗ typecheck: ${failed}/${checked} package(s) failed.` : `✓ typecheck: ${checked} package(s) clean.`);
process.exit(failed ? 1 : 0);
