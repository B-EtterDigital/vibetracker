import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildContributorAdapterFoundry,
  buildContributorForge,
  buildContributorLaunchpad,
  buildContributorMissionControl,
  buildContributorQuestBoard,
  contributorForgeSummary,
} from "../contributor-forge.ts";

const badges = [
  { id: "adapter-builder", label: "Adapter Builder", description: "Built a provider adapter." },
  { id: "trust-signal-builder", label: "Trust Signal Builder", description: "Improved trust evidence." },
  { id: "local-ai-mapper", label: "Local AI Mapper", description: "Mapped local AI tools." },
];

test("buildContributorForge creates proof packets without usage or rank impact", () => {
  const packets = buildContributorForge(badges);

  assert.deepEqual(packets.map((packet) => packet.mark), ["AB", "TS", "LA"]);
  assert.equal(packets.every((packet) => packet.rankImpact === "none"), true);
  assert.equal(packets.every((packet) => packet.usageImpact === "not usage"), true);
  assert.equal(packets.every((packet) => packet.terminal.some((line) => /no usage-score mutation/.test(line))), true);
  assert.match(packets[0].command, /adapter scaffold/);
  assert.match(packets[1].proof, /Not-usage/);
  assert.match(packets[2].command, /127\.0\.0\.1/);
});

test("contributorForgeSummary reports public credit lanes honestly", () => {
  const summary = contributorForgeSummary(buildContributorForge(badges));

  assert.equal(summary.lanes, 3);
  assert.equal(summary.rankImpacting, 0);
  assert.equal(summary.notUsage, 3);
  assert.equal(summary.averageMeter > 0, true);
});

test("unknown contributor badges use a safe reviewed fallback", () => {
  const [packet] = buildContributorForge([
    { id: "docs-writer", label: "Docs Writer", description: "Improved docs." },
  ]);

  assert.equal(packet.mark, "VT");
  assert.equal(packet.rankImpact, "none");
  assert.equal(packet.usageImpact, "not usage");
  assert.match(packet.issue, /Useful tracker improvement/);
});

test("contributor launchpad gives open-source vibers a proof-first route", () => {
  const launchpad = buildContributorLaunchpad(buildContributorForge(badges));

  assert.equal(launchpad.headline, "Contributor launchpad");
  assert.deepEqual(launchpad.lanes.map((lane) => lane.id), [
    "read-sdk",
    "scaffold-adapter",
    "redact-fixture",
    "run-harness",
    "privacy-review",
    "publish-credit",
  ]);
  assert.deepEqual(launchpad.lanes.map((lane) => lane.impact), [
    "docs",
    "adapter",
    "fixture",
    "test",
    "privacy",
    "publish",
  ]);
  assert.equal(launchpad.terminalLines.every((line) => line.length === 64), true);
  assert.match(launchpad.terminalLines.join("\n"), /CONTRIBUTOR-LAUNCHPAD/);
  assert.match(launchpad.terminalLines.join("\n"), /rankImpact 0/);
  assert.match(launchpad.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(launchpad.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(launchpad.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(launchpad.lanes.every((lane) => lane.usageImpact === "not usage"), true);
  assert.equal(launchpad.lanes.every((lane) => lane.rankImpact === "none"), true);
  assert.equal(launchpad.lanes.every((lane) => lane.frames.length === 3), true);
  assert.equal(launchpad.lanes.every((lane) => lane.checklist.length === 4), true);
  assert.equal(launchpad.lanes.every((lane) => lane.meter > 0 && lane.meter <= 100), true);
  assert.deepEqual(launchpad.totals, {
    lanes: 6,
    packets: 3,
    docs: 1,
    adapters: 1,
    fixtures: 1,
    tests: 1,
    privacy: 1,
    publish: 1,
    notUsage: 6,
    rankImpacting: 0,
    averageMeter: 88,
  });

  const docs = launchpad.lanes.find((lane) => lane.id === "read-sdk");
  assert.ok(docs);
  assert.equal(docs.path, "docs/ADAPTER_SDK.md");
  assert.match(docs.guardrail, /NOT USAGE/);

  const adapter = launchpad.lanes.find((lane) => lane.id === "scaffold-adapter");
  assert.ok(adapter);
  assert.equal(adapter.path, "packages/adapters/src/<provider>/index.ts");
  assert.match(adapter.command, /adapter scaffold/);

  const fixture = launchpad.lanes.find((lane) => lane.id === "redact-fixture");
  assert.ok(fixture);
  assert.match(fixture.path, /__fixtures__\/usage\.sample\.json/);
  assert.match(fixture.guardrail, /prompts/);

  const harness = launchpad.lanes.find((lane) => lane.id === "run-harness");
  assert.ok(harness);
  assert.equal(harness.path, "packages/adapters/src/__tests__/");
  assert.match(harness.command, /node --test/);

  const privacy = launchpad.lanes.find((lane) => lane.id === "privacy-review");
  assert.ok(privacy);
  assert.equal(privacy.path, "docs/compliance/TRUST_MODEL.md");
  assert.match(privacy.command, /dry-run/);

  const publish = launchpad.lanes.find((lane) => lane.id === "publish-credit");
  assert.ok(publish);
  assert.equal(publish.path, "contributors/badges.json");
  assert.match(publish.note, /c0vibe\.app/);
  assert.match(publish.guardrail, /never changes/);
});

test("contributor mission control turns open-source work into not-usage rails", () => {
  const control = buildContributorMissionControl(buildContributorForge(badges));

  assert.equal(control.headline, "Open-source mission control");
  assert.deepEqual(control.rails.map((rail) => rail.id), [
    "adapter-wave",
    "evidence-rail",
    "privacy-gate",
    "local-lab",
    "c0vibe-publish",
  ]);
  assert.deepEqual(control.rails.map((rail) => rail.impact), [
    "coverage",
    "not_usage",
    "privacy",
    "local_only",
    "publish",
  ]);
  assert.equal(control.terminalLines.every((line) => line.length === 64), true);
  assert.match(control.terminalLines.join("\n"), /NOT-USAGE/);
  assert.match(control.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(control.totals.badges, badges.length);
  assert.equal(control.totals.rankImpacting, 0);
  assert.equal(control.totals.notUsage, badges.length);
  assert.equal(control.rails.every((rail) => rail.terminal.length === 4), true);
  assert.equal(control.rails.every((rail) => rail.meter > 0 && rail.meter <= 100), true);

  const evidence = control.rails.find((rail) => rail.id === "evidence-rail");
  assert.ok(evidence);
  assert.match(evidence.guardrail, /NOT USAGE/);
  assert.match(evidence.command, /npx vibetrack trust list/);

  const local = control.rails.find((rail) => rail.id === "local-lab");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.match(local.command, /127\.0\.0\.1/);

  const publish = control.rails.find((rail) => rail.id === "c0vibe-publish");
  assert.ok(publish);
  assert.equal(publish.impact, "publish");
  assert.match(publish.note, /C0VIBE profiles/);
  assert.match(publish.guardrail, /never change usage rank/);
});

test("contributor adapter foundry separates open-source credit from usage rank", () => {
  const foundry = buildContributorAdapterFoundry(buildContributorForge(badges));

  assert.equal(foundry.headline, "Adapter foundry");
  assert.deepEqual(foundry.lanes.map((lane) => lane.id), [
    "adapter-kit",
    "fixture-bay",
    "regional-wave",
    "local-runner-lab",
    "trust-sidecar",
    "publish-credit",
  ]);
  assert.equal(foundry.terminalLines.every((line) => line.length === 64), true);
  assert.match(foundry.terminalLines.join("\n"), /ADAPTER-FOUNDRY/);
  assert.match(foundry.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(foundry.terminalLines.join("\n"), /NOT USAGE/);
  assert.equal(foundry.lanes.every((lane) => lane.usageImpact === "not usage"), true);
  assert.equal(foundry.lanes.every((lane) => lane.rankImpact === "none"), true);
  assert.equal(foundry.lanes.every((lane) => lane.terminal.length === 4), true);
  assert.equal(foundry.totals.notUsage, foundry.lanes.length);
  assert.equal(foundry.totals.rankImpacting, 0);
  assert.equal(foundry.totals.averageMeter > 0, true);

  const regional = foundry.lanes.find((lane) => lane.id === "regional-wave");
  assert.ok(regional);
  assert.equal(regional.impact, "regional");
  assert.match(regional.command, /qwen/);
  assert.deepEqual(regional.marks, ["QW", "DB", "KM", "MI", "AA"]);
  assert.match(regional.terminal.join("\n"), /mistral/);

  const local = foundry.lanes.find((lane) => lane.id === "local-runner-lab");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.match(local.command, /127\.0\.0\.1/);
  assert.match(local.value, /Ollama/);

  const trust = foundry.lanes.find((lane) => lane.id === "trust-sidecar");
  assert.ok(trust);
  assert.equal(trust.value, "NOT USAGE");
  assert.match(trust.guardrail, /Cannot mutate/);

  const publish = foundry.lanes.find((lane) => lane.id === "publish-credit");
  assert.ok(publish);
  assert.match(publish.value, /C0VIBE/);
  assert.match(publish.note, /C0VIBE/);
  assert.match(publish.guardrail, /never usage rank/);
});

test("contributor quest board gives concrete open-source tasks without usage rank impact", () => {
  const board = buildContributorQuestBoard(buildContributorForge(badges));

  assert.equal(board.headline, "Contributor quest board");
  assert.deepEqual(board.quests.map((quest) => quest.id), [
    "first-adapter",
    "redacted-fixture",
    "trust-sidecar",
    "local-detector",
    "regional-provider",
    "publish-badge",
  ]);
  assert.deepEqual(board.quests.map((quest) => quest.difficulty), [
    "starter",
    "starter",
    "focused",
    "focused",
    "advanced",
    "starter",
  ]);
  assert.equal(board.terminalLines.every((line) => line.length === 64), true);
  assert.match(board.terminalLines.join("\n"), /CONTRIBUTOR-QUESTS/);
  assert.match(board.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(board.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(board.quests.every((quest) => quest.usageImpact === "not usage"), true);
  assert.equal(board.quests.every((quest) => quest.rankImpact === "none"), true);
  assert.equal(board.quests.every((quest) => quest.terminal.length === 4), true);
  assert.equal(board.quests.every((quest) => quest.checklist.length === 4), true);
  assert.equal(board.quests.every((quest) => quest.meter > 0 && quest.meter <= 100), true);
  assert.deepEqual(board.totals, {
    quests: 6,
    proofPackets: 3,
    starter: 3,
    advanced: 1,
    notUsage: 6,
    rankImpacting: 0,
    localFirst: 1,
    averageMeter: 89,
  });

  const regional = board.quests.find((quest) => quest.id === "regional-provider");
  assert.ok(regional);
  assert.deepEqual(regional.marks, ["QW", "DB", "KM", "MI", "AA"]);
  assert.match(regional.command, /qwen/);

  const local = board.quests.find((quest) => quest.id === "local-detector");
  assert.ok(local);
  assert.match(local.command, /127\.0\.0\.1/);
  assert.match(local.guardrail, /Prompts/);

  const trust = board.quests.find((quest) => quest.id === "trust-sidecar");
  assert.ok(trust);
  assert.match(trust.guardrail, /never changes spend/);

  const publish = board.quests.find((quest) => quest.id === "publish-badge");
  assert.ok(publish);
  assert.match(publish.guardrail, /never changes usage rank/);
});

test("contributors blueprint preserves the complete forge contract behind the focused intake route", () => {
  const page = readFileSync(new URL("../../app/contributors/page.tsx", import.meta.url), "utf8");
  const blueprint = readFileSync(new URL("../../app/contributors/contributor-blueprint.tsx", import.meta.url), "utf8");
  const intake = readFileSync(new URL("../../app/contributors/contributor-intake.tsx", import.meta.url), "utf8");
  const intakeStyles = readFileSync(new URL("../../app/contributors/contributor-intake.css", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  assert.match(page, /async function ContributorsPage/);
  assert.match(page, /getContributorPulse/);
  assert.match(page, /<ContributorIntake/);
  assert.match(page, /<details className="contributor-blueprint">/);
  assert.match(page, /<ContributorBlueprint/);
  assert.equal(page.indexOf("<ContributorIntake" ) < page.indexOf("<details"), true);
  assert.match(intake, /role="tablist"/);
  assert.match(intake, /ArrowLeft/);
  assert.match(intake, /navigator\.clipboard\.writeText\(selected\.command\)/);
  assert.match(intake, /No maintainer-labelled issue exists yet/);
  assert.match(intake, /No cached contributor counts were substituted|no cached values substituted/i);
  assert.match(intake, /USAGE IMPACT/);
  assert.match(intake, /RANK IMPACT/);
  assert.doesNotMatch(intakeStyles, /radial-gradient|conic-gradient/);
  assert.match(intakeStyles, /@media \(max-width: 620px\)/);
  assert.match(intakeStyles, /@media \(min-width: 2200px\)/);
  assert.match(intakeStyles, /max-width: min\(2640px, 95vw\)/);
  assert.match(intakeStyles, /prefers-reduced-motion: reduce/);
  assert.match(blueprint, /ContributorSignalRelayPanel/);
  assert.match(blueprint, /contributorRelayStages/);
  assert.match(blueprint, /contributorRelayFrames/);
  assert.match(blueprint, /className="contributor-relay"/);
  assert.match(blueprint, /CONTRIBUTOR-SIGNAL-RELAY/);
  assert.match(blueprint, /SDK -> fixture -> harness -> publish/);
  assert.match(blueprint, /Vibers Unite \/ c0vibe\.app/);
  assert.match(blueprint, /rank impact: none/);
  assert.match(blueprint, /buildContributorLaunchpad/);
  assert.match(blueprint, /ContributorLaunchpadPanel/);
  assert.match(blueprint, /className="contributor-launchpad"/);
  assert.match(blueprint, /launchpad\.lanes\.map/);
  assert.match(blueprint, /lane\.checklist\.map/);
  assert.match(blueprint, /buildContributorQuestBoard/);
  assert.match(blueprint, /ContributorQuestBoardPanel/);
  assert.match(blueprint, /className="contributor-quest-board"/);
  assert.equal(blueprint.indexOf("<ContributorSignalRelayPanel"), blueprint.lastIndexOf("<ContributorSignalRelayPanel"));
  assert.equal(blueprint.indexOf("<ContributorSignalRelayPanel") < blueprint.indexOf("<ContributorLaunchpadPanel"), true);
  assert.equal(blueprint.indexOf("<ContributorLaunchpadPanel"), blueprint.lastIndexOf("<ContributorLaunchpadPanel"));
  assert.equal(blueprint.indexOf("<ContributorLaunchpadPanel") < blueprint.indexOf("<ContributorQuestBoardPanel"), true);
  assert.equal(blueprint.indexOf("<ContributorQuestBoardPanel"), blueprint.lastIndexOf("<ContributorQuestBoardPanel"));
  assert.equal(blueprint.indexOf("<ContributorQuestBoardPanel") < blueprint.indexOf("<ContributorAdapterFoundryPanel"), true);
  assert.match(styles, /\.contributor-relay/);
  assert.match(styles, /\.contributor-relay__terminal/);
  assert.match(styles, /\.contributor-relay__screen/);
  assert.match(styles, /\.contributor-relay__stages/);
  assert.match(styles, /\.contributor-relay-stage/);
  assert.match(styles, /\.contributor-relay-stage__meter i/);
  assert.match(styles, /\.contributor-launchpad/);
  assert.match(styles, /\.contributor-launchpad__terminal/);
  assert.match(styles, /\.contributor-launchpad__lanes/);
  assert.match(styles, /\.contributor-launch-lane/);
  assert.match(styles, /\.contributor-launch-lane__screen/);
  assert.match(styles, /\.contributor-launch-lane__checklist/);
  assert.match(styles, /\.contributor-launch-lane footer em::before/);
  assert.match(styles, /\.contributor-quest-board/);
  assert.match(styles, /\.contributor-quest-card__checks/);
  assert.match(styles, /\.contributor-quest-card__meter i/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /\.contributor-launch-lane__screen pre:first-child/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 460px\)/);
});
