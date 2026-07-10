// SMA Gen3 control-plane library for VibeTRACKER.
// Portable, zero-dependency lane classifier + config validator.
// Mirrors the C0X control plane; specialised via sma.gen3.json.

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(HERE, "..", "..");

export function loadConfig(root = REPO_ROOT) {
  const raw = readFileSync(join(root, "sma.gen3.json"), "utf8");
  return JSON.parse(raw);
}

// Convert an SMA glob ("packages/adapters/**", "src/*.ts") to an anchored RegExp.
// `**` matches any characters incl. `/`; `*` matches any run except `/`.
export function globToRegExp(glob) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**` (optionally followed by `/`) → match across path segments
        i++;
        if (glob[i + 1] === "/") i++;
        re += ".*";
      } else {
        re += "[^/]*";
      }
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(re + "$");
}

export function matchesAny(file, patterns = []) {
  return patterns.some((p) => globToRegExp(p).test(file));
}

// Classify a single file into a lane owner.
// Precedence: shared hot path (serialized) > module (with partition) > unmapped.
export function classifyFile(file, config) {
  const norm = file.replace(/^\.\//, "");

  for (const hp of config.sharedHotPaths ?? []) {
    if (matchesAny(norm, hp.paths)) {
      // collect every hot path this file touches (union of gates)
      const touched = (config.sharedHotPaths ?? []).filter((h) => matchesAny(norm, h.paths));
      const gates = [...new Set(touched.flatMap((h) => h.requiredGates ?? []))];
      const risk = touched.some((h) => h.risk === "high") ? "high"
        : touched.some((h) => h.risk === "medium") ? "medium" : "low";
      return { file: norm, lane: "shared-hot-path", owner: touched.map((h) => h.id).join("+"), risk, gates };
    }
  }

  for (const m of config.modules ?? []) {
    if (matchesAny(norm, m.excludePaths ?? [])) continue;
    if (matchesAny(norm, m.paths)) {
      let partition = null;
      for (const wp of m.workPartitions ?? []) {
        if (matchesAny(norm, wp.excludePaths ?? [])) continue;
        if (matchesAny(norm, wp.paths)) { partition = wp; break; }
      }
      const gates = partition?.requiredLocalGates ?? m.requiredLocalGates
        ?? config.moduleDefaults?.requiredLocalGates ?? [];
      return {
        file: norm, lane: "single-module", owner: m.id,
        partition: partition?.id ?? null, risk: "module-local", gates,
      };
    }
  }

  return { file: norm, lane: "unmapped", owner: null, risk: "unknown", gates: [] };
}

// Roll a changeset up into one overall lane + the union of required gates.
export function classifyChangeset(files, config) {
  const perFile = files.map((f) => classifyFile(f, config));
  const hot = perFile.filter((r) => r.lane === "shared-hot-path");
  const mods = new Set(perFile.filter((r) => r.lane === "single-module").map((r) => r.owner));
  const unmapped = perFile.filter((r) => r.lane === "unmapped");

  let lane;
  if (hot.length) lane = "shared-hot-path";
  else if (mods.size > 1) lane = "multi-module";
  else if (mods.size === 1) lane = "single-module";
  else lane = "unmapped";

  const gates = [...new Set(perFile.flatMap((r) => r.gates))];
  return {
    lane,
    modulesTouched: [...mods],
    sharedHotPaths: [...new Set(hot.map((r) => r.owner))],
    unmappedCount: unmapped.length,
    requiredGates: gates,
    files: perFile,
  };
}

export function gitChangedFiles(root = REPO_ROOT) {
  const run = (args) => {
    try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }); }
    catch { return ""; }
  };
  const tracked = run(["diff", "--name-only", "HEAD"]);
  const staged = run(["diff", "--name-only", "--cached"]);
  const untracked = run(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set((tracked + staged + untracked).split("\n").map((s) => s.trim()).filter(Boolean))];
}

// Structural validation of sma.gen3.json. Returns { ok, errors, warnings }.
export function validateConfig(config, root = REPO_ROOT) {
  const errors = [];
  const warnings = [];

  if (config.schemaVersion !== 1) errors.push(`schemaVersion must be 1 (got ${config.schemaVersion})`);
  if (config.costPolicy?.paidServicesEnabledByDefault !== false)
    errors.push("costPolicy.paidServicesEnabledByDefault must be false (free-local-first)");
  if (!Array.isArray(config.modules) || config.modules.length === 0)
    errors.push("modules[] must be a non-empty array");
  if (!Array.isArray(config.sharedHotPaths)) errors.push("sharedHotPaths[] must be an array");
  if (!Array.isArray(config.ciTiers) || config.ciTiers.length === 0)
    warnings.push("ciTiers[] is empty — no CI tiers defined");

  const manifestPolicy = config.brickManifestPolicy;
  if (manifestPolicy?.required !== true) {
    errors.push("brickManifestPolicy.required must be true");
  }
  if (manifestPolicy?.projectId !== config.project?.graphifyProjectId) {
    errors.push("brickManifestPolicy.projectId must match project.graphifyProjectId");
  }
  if (!Array.isArray(manifestPolicy?.manifests) || manifestPolicy.manifests.length === 0) {
    errors.push("brickManifestPolicy.manifests[] must be a non-empty array");
  }

  const ids = new Set();
  for (const m of config.modules ?? []) {
    if (!m.id) errors.push("a module is missing an id");
    else if (ids.has(m.id)) errors.push(`duplicate module id: ${m.id}`);
    else ids.add(m.id);
    if (!Array.isArray(m.paths) || m.paths.length === 0) errors.push(`module ${m.id}: paths[] required`);
    if (!m.manifest) errors.push(`module ${m.id}: manifest path required`);
    else if (!manifestPolicy?.manifests?.includes(m.manifest))
      errors.push(`module ${m.id}: manifest must be declared by brickManifestPolicy`);
    if (!Array.isArray(m.requiredLocalGates) || m.requiredLocalGates.length === 0)
      warnings.push(`module ${m.id}: no requiredLocalGates`);
  }

  // module-vs-module ownership overlap (exact glob-string collision)
  const mods = config.modules ?? [];
  for (let i = 0; i < mods.length; i++) {
    for (let j = i + 1; j < mods.length; j++) {
      const shared = (mods[i].paths ?? []).filter((p) => (mods[j].paths ?? []).includes(p));
      if (shared.length) errors.push(`modules ${mods[i].id} and ${mods[j].id} both own: ${shared.join(", ")}`);
    }
  }

  for (const hp of config.sharedHotPaths ?? []) {
    if (!hp.id) errors.push("a sharedHotPath is missing an id");
    if (!Array.isArray(hp.paths) || hp.paths.length === 0) errors.push(`sharedHotPath ${hp.id}: paths[] required`);
    if (!["high", "medium", "low"].includes(hp.risk)) warnings.push(`sharedHotPath ${hp.id}: risk should be high|medium|low`);
    if (!Array.isArray(hp.requiredGates) || hp.requiredGates.length === 0) warnings.push(`sharedHotPath ${hp.id}: no requiredGates`);
  }

  const manifestPaths = manifestPolicy?.manifests ?? [];
  const seenManifestPaths = new Set();
  const seenBrickIds = new Set();
  for (const manifestPath of manifestPaths) {
    if (seenManifestPaths.has(manifestPath)) {
      errors.push(`duplicate brick manifest path: ${manifestPath}`);
      continue;
    }
    seenManifestPaths.add(manifestPath);

    const absolutePath = join(root, manifestPath);
    if (!existsSync(absolutePath)) {
      errors.push(`missing brick manifest: ${manifestPath}`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(readFileSync(absolutePath, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`invalid brick manifest ${manifestPath}: ${message}`);
      continue;
    }

    if (manifest.schema_version !== "1.0.0")
      errors.push(`brick manifest ${manifestPath}: schema_version must be 1.0.0`);
    if (!manifest.brick?.id) errors.push(`brick manifest ${manifestPath}: brick.id required`);
    else if (seenBrickIds.has(manifest.brick.id)) errors.push(`duplicate brick id: ${manifest.brick.id}`);
    else seenBrickIds.add(manifest.brick.id);
    if (manifest.source?.project !== manifestPolicy.projectId)
      errors.push(`brick manifest ${manifestPath}: source.project must be ${manifestPolicy.projectId}`);
    if (!Array.isArray(manifest.boundaries?.owned_paths) || manifest.boundaries.owned_paths.length === 0)
      errors.push(`brick manifest ${manifestPath}: boundaries.owned_paths[] required`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
