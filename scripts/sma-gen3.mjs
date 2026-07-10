#!/usr/bin/env node
// SMA Gen3 lane classifier CLI for VibeTRACKER.
//   node scripts/sma-gen3.mjs                       -> print control-plane summary
//   node scripts/sma-gen3.mjs --changed-file <path> -> classify one file's lane
//   node scripts/sma-gen3.mjs --json                -> classify current git changeset (JSON)
//   node scripts/sma-gen3.mjs check                 -> validate sma.gen3.json (exit 1 on error)

import {
  loadConfig, classifyFile, classifyChangeset, gitChangedFiles, validateConfig,
} from "./lib/sma-gen3.mjs";

const argv = process.argv.slice(2);
const config = loadConfig();

function getFlag(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

if (argv.includes("check") || argv.includes("--check")) {
  const { ok, errors, warnings } = validateConfig(config);
  for (const w of warnings) console.warn(`⚠ warning: ${w}`);
  if (ok) {
    console.log(`✓ sma.gen3.json valid — ${config.modules.length} modules, ${config.brickManifestPolicy.manifests.length} brick manifests, ${config.sharedHotPaths.length} shared hot paths, ${config.ciTiers.length} CI tiers.`);
    process.exit(0);
  }
  for (const e of errors) console.error(`✗ error: ${e}`);
  process.exit(1);
}

const changedFile = getFlag("--changed-file");
if (changedFile) {
  const r = classifyFile(changedFile, config);
  console.log(JSON.stringify(r, null, 2));
  console.log(`\nlane: ${r.lane}${r.owner ? ` (${r.owner}${r.partition ? " / " + r.partition : ""})` : ""}`);
  process.exit(0);
}

if (argv.includes("--json") || argv.includes("json")) {
  const files = gitChangedFiles();
  const result = classifyChangeset(files, config);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

// Default: human-readable control-plane summary.
console.log(`VibeTRACKER SMA Gen3 — ${config.project?.id ?? "project"}`);
console.log(`\nModules (fast lane when non-overlapping):`);
for (const m of config.modules) {
  const parts = m.workPartitions?.length ? ` [${m.workPartitions.length} partitions]` : "";
  console.log(`  • ${m.label.padEnd(10)} ${m.paths.join(", ")}${parts}`);
}
console.log(`\nShared hot paths (serialized, one owner):`);
for (const hp of config.sharedHotPaths) {
  console.log(`  • ${hp.id.padEnd(30)} risk=${hp.risk}`);
}
console.log(`\nRun \`node scripts/sma-gen3.mjs --json\` to classify your current changeset.`);
