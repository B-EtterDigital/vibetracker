import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { ProviderDescriptor } from "../../../../../adapters/src/registry.ts";
import {
  buildRunbook,
  buildSourceCandidates,
  buildStackDiagnosis,
  resolvePreset,
  searchSourceCandidates,
  sourceCollectionPath,
} from "../stack-composer-data.ts";

const providers: ProviderDescriptor[] = [
  { id: "codex", label: "Codex", domain: "ai", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "built", verified: false, method: "local logs" },
  { id: "ollama", label: "Ollama", domain: "ai", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "local proxy" },
  { id: "midjourney", label: "Midjourney", domain: "creative", categories: ["image"], tier: "manual", auth: "none", status: "manual-only", verified: false, method: "manual subscription" },
  { id: "cursor", label: "Cursor", domain: "ai", categories: ["coding"], tier: "log", auth: "apiKey", status: "planned", verified: false, method: "admin usage API" },
];

test("source collection paths never imply a planned adapter is built", () => {
  assert.deepEqual(providers.map(sourceCollectionPath), ["connect", "detect", "manual", "planned"]);
});

test("source search covers domain, auth, method, category, and exact IDs", () => {
  const candidates = buildSourceCandidates(providers);
  assert.deepEqual(searchSourceCandidates(candidates, "codex", "all").map((item) => item.provider.id), ["codex"]);
  assert.deepEqual(searchSourceCandidates(candidates, "creative manual", "all").map((item) => item.provider.id), ["midjourney"]);
  assert.deepEqual(searchSourceCandidates(candidates, "apiKey admin", "ai").map((item) => item.provider.id), ["cursor"]);
});

test("runbook deduplicates detect and keeps planned sources as comments", () => {
  const candidates = buildSourceCandidates([...providers, { ...providers[1], id: "lmstudio", label: "LM Studio" }]);
  const runbook = buildRunbook(candidates);

  assert.equal(runbook.lines.filter((line) => line === "npx vibetrack detect").length, 1);
  assert.match(runbook.text, /npx vibetrack connect codex/);
  assert.match(runbook.text, /npx vibetrack import midjourney --images <lifetime-images> --usd <lifetime-spend>/);
  assert.match(runbook.text, /# planned: cursor/);
  assert.doesNotMatch(runbook.text, /npx vibetrack connect cursor/);
  assert.match(runbook.text, /npx vibetrack sync --receipt/);
  assert.doesNotMatch(runbook.text, /sync --dry-run/);
  assert.match(runbook.text, /# publish stays opt-in: npx vibetrack upload --dry-run/);
  assert.deepEqual(runbook.diagnosis, buildStackDiagnosis(candidates));
});

test("stack diagnosis fails closed and names visibility-only coverage gaps", () => {
  const candidates = buildSourceCandidates(providers);
  const diagnosis = buildStackDiagnosis(candidates);

  assert.equal(diagnosis.state, "partial");
  assert.equal(diagnosis.selectedCount, 4);
  assert.equal(diagnosis.trackableCount, 3);
  assert.equal(diagnosis.automaticCount, 2);
  assert.equal(diagnosis.trackablePercent, 75);
  assert.equal(diagnosis.automaticPercent, 50);
  assert.deepEqual(diagnosis.visibilityOnly, ["Cursor"]);
  assert.match(diagnosis.headline, /3 of 4/);
  assert.match(diagnosis.explanation, /never inflates coverage/);
  assert.match(diagnosis.nextAction, /Cursor/);
});

test("stack diagnosis distinguishes empty, blocked, manual-review, and ready states", () => {
  const candidates = buildSourceCandidates(providers);
  const byId = new Map(candidates.map((candidate) => [candidate.provider.id, candidate]));
  const get = (id: string) => {
    const candidate = byId.get(id);
    assert.ok(candidate);
    return candidate;
  };

  assert.equal(buildStackDiagnosis([]).state, "empty");
  assert.equal(buildStackDiagnosis([get("cursor")]).state, "blocked");
  assert.equal(buildStackDiagnosis([get("codex"), get("midjourney")]).state, "review");
  assert.equal(buildStackDiagnosis([get("codex"), get("ollama")]).state, "ready");
  assert.match(buildStackDiagnosis([get("cursor")]).headline, /None/);
  assert.match(buildStackDiagnosis([get("midjourney")]).nextAction, /manual placeholder/);
});

test("presets resolve only registry-backed IDs", () => {
  const candidates = buildSourceCandidates(providers);
  assert.deepEqual(resolvePreset(candidates, "coding").map((item) => item.provider.id), ["codex", "cursor"]);
});

test("sources workbench explains selected evidence and scales from mobile to 4K", () => {
  const composer = readFileSync("packages/web/src/app/sources/stack-composer.tsx", "utf8");
  const composerStyles = readFileSync("packages/web/src/app/sources/stack-composer.css", "utf8");
  const routeStyles = readFileSync("packages/web/src/app/sources/sources.css", "utf8");

  assert.match(composer, /Selected evidence · source → collection path/);
  assert.match(composer, /STACK READINESS/);
  assert.match(composer, /trackable now/);
  assert.match(composer, /endpoint verified/);
  assert.match(composer, /remove planned/);
  assert.match(composer, /setup command/);
  assert.match(composer, /local discovery/);
  assert.match(composer, /review \/ import/);
  assert.match(composer, /mapped only/);
  assert.match(composer, /AI usage/);
  assert.match(composer, /dev costs/);
  assert.match(composer, /creative subs/);
  assert.match(composer, /candidate\.provider\.method/);
  assert.match(composer, /stack-path--\$\{candidate\.path\}/);
  assert.match(composerStyles, /@media \(max-width: 980px\)[\s\S]*\.stack-runbook \{ order: -1; \}/);
  assert.match(composerStyles, /@media \(min-width: 2200px\)[\s\S]*\.stack-picker__results \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(routeStyles, /@media \(min-width: 2200px\)[\s\S]*max-width: min\(3000px, 95vw\)/);
});
