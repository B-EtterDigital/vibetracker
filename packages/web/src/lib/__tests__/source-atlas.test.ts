import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
import { readFileSync } from "node:fs";
import { buildSourceAtlas, buildSourceCoverageConstellation, buildSourceIntakeStack } from "../source-atlas.ts";

test("source atlas builds a registry-driven coverage map without fake usage", () => {
  const atlas = buildSourceAtlas();

  assert.equal(atlas.headline, "SOURCE SIGNAL ATLAS");
  assert.deepEqual(atlas.lanes.map((lane) => lane.id), [
    "creator",
    "builder",
    "local",
    "regional",
    "infra",
    "manual",
  ]);
  assert.match(atlas.terminalLines.join("\n"), /SOURCE-ATLAS/);
  assert.match(atlas.terminalLines.join("\n"), /NO-FAKE-USAGE/);
  assert.match(atlas.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(atlas.lanes.every((lane) => lane.count >= lane.nodes.length), true);
  assert.equal(atlas.lanes.every((lane) => lane.nodes.length > 0 && lane.nodes.length <= 10), true);
  assert.equal(atlas.beacons.length, 12);
  assert.equal(atlas.relay.id, "c0vibe");
  assert.equal(atlas.relay.impact, "publish");
});

test("source atlas lanes surface creator, builder, local, regional, infra, and manual sources", () => {
  const atlas = buildSourceAtlas();
  const byLane = new Map(atlas.lanes.map((lane) => [lane.id, lane]));

  const creator = byLane.get("creator");
  assert.ok(creator);
  assert.ok(creator.nodes.some((node) => node.id === "higgsfield"));
  assert.ok(creator.nodes.some((node) => node.id === "runway" || node.id === "replicate"));
  assert.match(creator.note, /first-class/);

  const builder = byLane.get("builder");
  assert.ok(builder);
  assert.ok(builder.nodes.some((node) => node.id === "claude-code"));
  assert.ok(builder.nodes.some((node) => node.impact === "trust" || node.impact === "local_only"));

  const local = byLane.get("local");
  assert.ok(local);
  assert.ok(local.nodes.some((node) => node.id === "ollama"));
  assert.ok(local.nodes.some((node) => node.id === "lmstudio"));
  assert.ok(local.nodes.some((node) => node.id === "comfyui"));
  assert.equal(local.nodes.some((node) => node.impact === "local_only"), true);

  const regional = byLane.get("regional");
  assert.ok(regional);
  assert.ok(regional.nodes.some((node) => node.id === "qwen"));
  assert.ok(regional.nodes.some((node) => node.id === "doubao"));
  assert.ok(regional.nodes.some((node) => node.id === "mistral"));

  const infra = byLane.get("infra");
  assert.ok(infra);
  assert.ok(infra.nodes.some((node) => node.id === "huggingface"));
  assert.ok(infra.nodes.some((node) => node.id === "supabase" || node.id === "vercel"));

  const manual = byLane.get("manual");
  assert.ok(manual);
  assert.ok(manual.nodes.some((node) => node.id === "midjourney"));
  assert.ok(manual.nodes.some((node) => node.id === "canva"));
  assert.equal(manual.nodes.some((node) => node.impact === "manual"), true);
});

test("source atlas nodes carry branded GUI coordinates and confidence meters", () => {
  const atlas = buildSourceAtlas();
  const nodes = [...atlas.lanes.flatMap((lane) => lane.nodes), atlas.relay];

  assert.equal(nodes.every((node) => node.mark.length >= 2), true);
  assert.equal(nodes.every((node) => node.from.startsWith("#") && node.to.startsWith("#")), true);
  assert.equal(nodes.every((node) => node.x >= 0 && node.x <= 100 && node.y >= 0 && node.y <= 100), true);
  assert.equal(nodes.every((node) => node.meter >= 0 && node.meter <= 100), true);
  assert.ok(atlas.metrics.some((metric) => metric.label === "registry signals"));
  assert.ok(atlas.metrics.some((metric) => metric.note.includes("manual evidence")));
});

test("source coverage constellation summarizes all lanes without hidden usage boosts", () => {
  const atlas = buildSourceAtlas();
  const constellation = buildSourceCoverageConstellation(atlas);

  assert.equal(constellation.headline, "Source coverage constellation");
  assert.match(constellation.subline, /creator, builder, local lab, regional AI, infra, manual ledger/);
  assert.match(constellation.terminalLines.join("\n"), /SOURCE-CONSTELLATION/);
  assert.match(constellation.terminalLines.join("\n"), /NO-HIDDEN-USAGE/);
  assert.match(constellation.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(constellation.relay.id, "c0vibe");
  assert.deepEqual(constellation.orbits.map((orbit) => orbit.id), [
    "creator",
    "builder",
    "local",
    "regional",
    "infra",
    "manual",
  ]);
  assert.equal(constellation.orbits.every((orbit) => orbit.nodes.length > 0 && orbit.nodes.length <= 6), true);
  assert.equal(constellation.orbits.every((orbit) => orbit.meter >= 0 && orbit.meter <= 100), true);
  assert.equal(constellation.orbits.every((orbit) => /sources \/\/ built/.test(orbit.terminalLine)), true);
  assert.ok(constellation.orbits.some((orbit) => orbit.trust > 0 || orbit.localOnly > 0 || orbit.manual > 0));
  assert.ok(constellation.totals.sources >= atlas.lanes.reduce((sum, lane) => sum + lane.nodes.length, 0));
  assert.ok(constellation.totals.usageNodes > 0);
  assert.ok(constellation.totals.localOnlyNodes > 0);
  assert.ok(constellation.totals.manualNodes > 0);
  assert.equal(constellation.totals.publishNodes, 1);
  assert.equal(constellation.totals.hiddenUsageBoosts, 0);
});

test("source intake stack labels every source path and preview side effect", () => {
  const stack = buildSourceIntakeStack();

  assert.equal(stack.headline, "SOURCE INTAKE STACK");
  assert.match(stack.subline, /hosted API usage/);
  assert.deepEqual(stack.steps.map((step) => step.id), [
    "provider_api",
    "mcp_cli_trust",
    "local_probe",
    "manual_ledger",
    "normalize_score",
    "reviewed_publish",
  ]);
  assert.deepEqual(stack.steps.map((step) => step.status), [
    "USAGE ROWS",
    "NOT USAGE",
    "LOCAL ONLY",
    "LOW CONF",
    "DERIVED",
    "C0VIBE.APP",
  ]);
  assert.equal(stack.steps.every((step) => step.frames.length === 4), true);
  assert.equal(stack.steps.every((step) => step.from.startsWith("#") && step.to.startsWith("#")), true);
  assert.equal(stack.steps.every((step) => step.preview.providerCalls === 0), true);
  assert.equal(stack.steps.every((step) => step.preview.ledgerWrites === 0), true);
  assert.equal(stack.steps.every((step) => step.preview.hiddenUploads === 0), true);
  assert.equal(stack.terminalLines.every((line) => line.length === 64), true);
  assert.match(stack.terminalLines.join("\n"), /SOURCE-INTAKE/);
  assert.match(stack.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(stack.terminalLines.join("\n"), /hiddenUploads 0/);

  const api = stack.steps.find((step) => step.id === "provider_api");
  const trust = stack.steps.find((step) => step.id === "mcp_cli_trust");
  const local = stack.steps.find((step) => step.id === "local_probe");
  const manual = stack.steps.find((step) => step.id === "manual_ledger");
  const publish = stack.steps.find((step) => step.id === "reviewed_publish");

  assert.equal(api?.feeds.usageRows, true);
  assert.equal(api?.feeds.publicProfile, true);
  assert.equal(trust?.feeds.usageRows, false);
  assert.equal(trust?.feeds.trustSidecar, true);
  assert.match(trust?.guardrail ?? "", /never change spend|never changes spend/);
  assert.equal(local?.feeds.publicProfile, false);
  assert.match(local?.guardrail ?? "", /No prompts/);
  assert.equal(manual?.impact, "manual");
  assert.match(manual?.guardrail ?? "", /never auto-upgrade/);
  assert.match(publish?.guardrail ?? "", /hiddenUploads=0/);
  assert.deepEqual(stack.totals, {
    steps: 6,
    usageRows: 2,
    trustSidecars: 1,
    localStores: 5,
    publicProfileFeeds: 5,
    previewProviderCalls: 0,
    previewLedgerWrites: 0,
    hiddenUploads: 0,
    notUsageSteps: 1,
    manualSteps: 1,
  });
});

test("source composer turns the registry into a bounded local setup runbook", () => {
  const page = readFileSync("packages/web/src/app/sources/page.tsx", "utf8");
  const composer = readFileSync("packages/web/src/app/sources/stack-composer.tsx", "utf8");
  const data = readFileSync("packages/web/src/app/sources/stack-composer-data.ts", "utf8");
  const routeCss = readFileSync("packages/web/src/app/sources/sources.css", "utf8");
  const composerCss = readFileSync("packages/web/src/app/sources/stack-composer.css", "utf8");

  assert.ok(operatorRouteFor("/sources"));
  assert.match(page, /import \{ PROVIDERS \} from/);
  assert.match(page, /SourceStackComposer/);
  assert.match(page, /Compose your source stack\./);
  assert.match(page, /no provider calls/);
  assert.match(page, /no hidden upload/);
  assert.match(page, /provider status board/);
  assert.match(page, /local scan preview/);
  assert.match(page, /proof center/);
  assert.doesNotMatch(page, /buildSourceAtlas|buildAiLifeCockpit|buildCollectionHeroScanBridge/);

  assert.match(composer, /"use client"/);
  assert.match(composer, /type="checkbox"/);
  assert.match(composer, /MAX_STACK_SIZE/);
  assert.match(composer, /copyRunbook/);
  assert.match(composer, /ZERO EXECUTION/);
  assert.match(composer, /stack limit/);
  assert.match(composer, /clipboard blocked/);
  assert.doesNotMatch(composer, /fetch\s*\(/);
  assert.doesNotMatch(composer, /localStorage|sessionStorage/);
  assert.doesNotMatch(composer, /dangerouslySetInnerHTML/);

  assert.match(data, /sourceCollectionPath/);
  assert.match(data, /cliCommand\(`connect \$\{candidate\.provider\.id\}`\)/);
  assert.match(data, /cliCommand\("detect"\)/);
  assert.match(data, /--usd <monthly-usd>/);
  assert.match(data, /# planned:/);
  assert.match(data, /const planned = ordered\.filter\(\(candidate\) => candidate\.path === "planned"\)/);
  assert.match(data, /cliCommand\("sync --receipt"\)/);
  assert.match(data, /cliCommand\("upload --dry-run"\)/);
  assert.doesNotMatch(data, /sync --dry-run/);
  assert.match(data, /# publish stays opt-in/);

  assert.match(routeCss, /\.stack-page-hero/);
  assert.match(routeCss, /\.stack-route-footer/);
  assert.match(composerCss, /\.stack-workbench/);
  assert.match(composerCss, /\.stack-picker__results/);
  assert.match(composerCss, /\.stack-runbook__code/);
  assert.match(composerCss, /\.stack-boundary/);
  assert.match(composerCss, /@media \(max-width: 560px\)/);
  assert.match(composerCss, /prefers-reduced-motion: reduce/);
});
