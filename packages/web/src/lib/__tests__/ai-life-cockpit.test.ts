import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAiLifeCockpit } from "../ai-life-cockpit.ts";

test("AI life cockpit summarizes creators, builders, local AI, regional providers, ledgers, and publish", () => {
  const cockpit = buildAiLifeCockpit();

  assert.equal(cockpit.headline, "AI LIFE COCKPIT");
  assert.deepEqual(cockpit.lanes.map((lane) => lane.id), ["creator", "builder", "local", "regional", "manual", "publish"]);
  assert.match(cockpit.subline, /creators, coders, local model users/);
  assert.match(cockpit.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(cockpit.terminalLines.join("\n"), /c0vibe\.app/);
  assert.match(cockpit.terminalLines.join("\n"), /builder NOT USAGE/);
  assert.ok(cockpit.totals.providers > cockpit.totals.built);
  assert.ok(cockpit.totals.built >= cockpit.totals.verified);
});

test("AI life cockpit keeps builder and publish context out of usage totals", () => {
  const cockpit = buildAiLifeCockpit();
  const builder = cockpit.lanes.find((lane) => lane.id === "builder");
  const publish = cockpit.lanes.find((lane) => lane.id === "publish");
  const trustRhythm = cockpit.rhythm.find((item) => item.id === "trust");

  assert.ok(builder);
  assert.equal(builder.impact, "not_usage");
  assert.equal(builder.railLabel, "NOT USAGE");
  assert.match(builder.guardrail, /never changes usage totals/);
  assert.ok(builder.providers.some((provider) => provider.id === "codex-cli"));

  assert.ok(publish);
  assert.equal(publish.impact, "publish");
  assert.equal(publish.value, "dry-run only");
  assert.match(publish.note, /c0vibe\.app/);

  assert.ok(trustRhythm);
  assert.equal(trustRhythm.impact, "not_usage");
  assert.equal(trustRhythm.value, "NOT USAGE");
});

test("AI life cockpit uses provider brand rails and compact terminal rows", () => {
  const cockpit = buildAiLifeCockpit();

  assert.equal(cockpit.terminalLines.every((line) => line.length <= 70), true);
  assert.equal(cockpit.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.equal(cockpit.lanes.every((lane) => lane.from.startsWith("#") && lane.to.startsWith("#") && lane.ink.startsWith("#")), true);
  assert.equal(cockpit.lanes.every((lane) => lane.ascii.length === 4), true);
  assert.equal(cockpit.lanes.every((lane) => lane.providers.length > 0), true);
  assert.equal(cockpit.lanes.flatMap((lane) => lane.providers).every((provider) => provider.mark.length >= 2), true);
});

test("AI life practice passport covers creators, builders, local labs, research, regional AI, and publish", () => {
  const cockpit = buildAiLifeCockpit();
  const passport = cockpit.practice;

  assert.equal(passport.headline, "AI practice passport");
  assert.deepEqual(passport.surfaces.map((surface) => surface.id), [
    "creator-studio",
    "builder-desk",
    "local-lab",
    "research-desk",
    "regional-frontier",
    "public-relay",
  ]);
  assert.deepEqual(passport.surfaces.map((surface) => surface.impact), [
    "usage",
    "not_usage",
    "local_only",
    "privacy",
    "usage",
    "publish",
  ]);
  assert.deepEqual(passport.totals, {
    surfaces: 6,
    usage: 2,
    localOnly: 1,
    notUsage: 1,
    privacy: 1,
    publish: 1,
    averageMeter: passport.totals.averageMeter,
  });
  assert.equal(passport.totals.averageMeter > 0 && passport.totals.averageMeter <= 100, true);
  assert.equal(passport.terminalLines.every((line) => line.length <= 70), true);
  assert.match(passport.terminalLines.join("\n"), /AI-LIFE-PASSPORT/);
  assert.match(passport.terminalLines.join("\n"), /c0vibe\.app/);
  assert.match(passport.terminalLines.join("\n"), /writes 0 ranks/);
  assert.equal(passport.surfaces.every((surface) => surface.providers.length > 0), true);
  assert.equal(passport.surfaces.every((surface) => surface.ascii.length === 4), true);

  const research = passport.surfaces.find((surface) => surface.id === "research-desk");
  assert.ok(research);
  assert.equal(research.impact, "privacy");
  assert.match(research.persona, /Researchers, writers/);
  assert.match(research.command, /export --format markdown --out usage\.md/);
  assert.match(research.boundary, /Notes, sources/);
  assert.ok(research.providers.some((provider) => provider.id === "notion" || provider.id === "obsidian"));

  const builder = passport.surfaces.find((surface) => surface.id === "builder-desk");
  assert.ok(builder);
  assert.equal(builder.railLabel, "NOT USAGE");
  assert.match(builder.boundary, /never mutates usage totals/);

  const local = passport.surfaces.find((surface) => surface.id === "local-lab");
  assert.ok(local);
  assert.equal(local.railLabel, "LOCAL ONLY");
  assert.match(local.boundary, /stay on-machine/);

  const relay = passport.surfaces.find((surface) => surface.id === "public-relay");
  assert.ok(relay);
  assert.equal(relay.value, "dry-run first");
  assert.match(relay.boundary, /not surprise uploads/);
});

test("AI life persona atlas makes the product legible beyond coders", () => {
  const cockpit = buildAiLifeCockpit();
  const atlas = cockpit.persona;

  assert.equal(atlas.headline, "Viber persona atlas");
  assert.match(atlas.subline, /creators, builders, researchers, local model runners/);
  assert.equal(atlas.terminalLines.every((line) => line.length <= 70), true);
  assert.match(atlas.terminalLines.join("\n"), /AI-LIFE-PERSONA-ATLAS/);
  assert.match(atlas.terminalLines.join("\n"), /NOT-JUST-CODERS/);
  assert.match(atlas.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(atlas.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(atlas.personas.map((card) => card.id), [
    "creator",
    "builder",
    "researcher",
    "localist",
    "globalist",
    "operator",
    "publisher",
  ]);
  assert.deepEqual(atlas.personas.map((card) => card.impact), [
    "usage",
    "not_usage",
    "privacy",
    "local_only",
    "usage",
    "privacy",
    "publish",
  ]);
  assert.deepEqual(atlas.totals, {
    personas: 7,
    usage: 2,
    localOnly: 1,
    notUsage: 1,
    privacy: 2,
    publish: 1,
    averageMeter: atlas.totals.averageMeter,
  });
  assert.equal(atlas.totals.averageMeter > 0 && atlas.totals.averageMeter <= 100, true);
  assert.equal(atlas.personas.every((card) => card.providers.length > 0), true);
  assert.equal(atlas.personas.every((card) => card.ascii.length === 4), true);
  assert.equal(atlas.personas.every((card) => card.tracks.length > 12 && card.notTracked.length > 12), true);

  const builder = atlas.personas.find((card) => card.id === "builder");
  assert.ok(builder);
  assert.equal(builder.railLabel, "NOT USAGE");
  assert.match(builder.proof, /\+0 usage/);
  assert.match(builder.notTracked, /AI spend/);

  const researcher = atlas.personas.find((card) => card.id === "researcher");
  assert.ok(researcher);
  assert.equal(researcher.impact, "privacy");
  assert.match(researcher.command, /export --format markdown --out usage\.md/);
  assert.match(researcher.notTracked, /document text/);

  const localist = atlas.personas.find((card) => card.id === "localist");
  assert.ok(localist);
  assert.equal(localist.railLabel, "LOCAL ONLY");
  assert.match(localist.proof, /on-machine/);

  const publisher = atlas.personas.find((card) => card.id === "publisher");
  assert.ok(publisher);
  assert.equal(publisher.railLabel, "PUBLISH");
  assert.match(publisher.proof, /Vibers Unite/);
  assert.match(publisher.notTracked, /surprise uploads/);
});
