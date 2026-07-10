#!/usr/bin/env node
// VTRS (VibeTracker Reporting Surface) telemetry audit.
// SMA Gen3 requires actionable telemetry, not silent failure. This scans source
// for suppressed/uninstrumented error handling and banned ignore markers.
//   node scripts/telemetry-audit.mjs           -> report (exit 0)
//   node scripts/telemetry-audit.mjs --strict  -> exit 1 if any violation

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SCAN_DIRS = ["packages"];
const EXTS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"]);
const SKIP = new Set(["node_modules", "dist", "build", ".next", ".netlify", "coverage", ".turbo"]);

const strict = process.argv.includes("--strict");

// Banned patterns: silent catches, no-op promise catches, and the ignore marker.
const RULES = [
  { id: "empty-catch", re: /catch\s*(\([^)]*\))?\s*\{\s*\}/, msg: "empty catch block — route the error to VTRS telemetry" },
  { id: "noop-promise-catch", re: /\.catch\(\s*\(\s*[^)]*\)\s*=>\s*(\{\s*\}|undefined|null|void 0)\s*\)/, msg: "no-op .catch() — report or breadcrumb the failure" },
  { id: "banned-ignore-marker", re: /vtrs-ignore/, msg: "vtrs-ignore is banned — it hides real failures" },
];

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walk(full, out);
    else if (EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

const violations = [];
for (const d of SCAN_DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // Skip comment lines so documentation of the banned patterns isn't flagged.
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      for (const rule of RULES) {
        if (rule.re.test(line)) {
          violations.push({ file: file.replace(ROOT + "/", ""), line: i + 1, rule: rule.id, msg: rule.msg });
        }
      }
    });
  }
}

if (violations.length === 0) {
  console.log("✓ VTRS telemetry audit: 0 violations.");
  process.exit(0);
}

for (const v of violations) console.error(`✗ ${v.file}:${v.line} [${v.rule}] ${v.msg}`);
console.error(`\n${violations.length} telemetry violation(s).`);
process.exit(strict ? 1 : 0);
