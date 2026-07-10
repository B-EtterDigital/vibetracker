import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHomeControlTower } from "../home-control-tower.ts";

test("home control tower maps the product routes without side effects", () => {
  const tower = buildHomeControlTower();

  assert.equal(tower.headline, "CONTROL TOWER");
  assert.match(tower.subline, /first-screen route flight deck/);
  assert.deepEqual(tower.decks.map((deck) => deck.id), [
    "wizard",
    "motion",
    "scan",
    "sources",
    "score",
    "life",
    "proof",
    "profile",
  ]);
  assert.deepEqual(tower.decks.map((deck) => deck.href), [
    "/wizard",
    "/motion",
    "/scan",
    "/sources",
    "/score",
    "/life",
    "/proof",
    "/u/demo",
  ]);
  assert.equal(tower.decks.every((deck) => deck.frames.length === 4), true);
  assert.equal(tower.decks.every((deck) => deck.checks.length === 3), true);
  assert.equal(tower.decks.every((deck) => deck.meter >= 90 && deck.meter <= 100), true);
  assert.equal(tower.decks.every((deck) => Object.values(deck.sideEffects).every((value) => value === 0)), true);
  assert.deepEqual(tower.totals, {
    decks: 8,
    routes: 8,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUploads: 0,
    promptReads: 0,
    outputReads: 0,
    publishWrites: 0,
    zeroSideEffects: true,
    notUsageDecks: 1,
    localOnlyDecks: 2,
  });
});

test("home control tower terminal labels routes, side effects, and c0vibe relay", () => {
  const tower = buildHomeControlTower();
  const terminal = tower.terminalLines.join("\n");

  assert.match(terminal, /HOME-CONTROL-TOWER/);
  assert.match(terminal, /ROUTE-FLIGHT-DECK/);
  assert.match(terminal, /providerCalls 0/);
  assert.match(terminal, /uploads 0/);
  assert.match(terminal, /promptReads 0/);
  assert.match(terminal, /outputReads 0/);
  assert.match(terminal, /wizard motion scan sources score life proof profile/);
  assert.match(terminal, /Vibers Unite/);
  assert.match(terminal, /c0vibe\.app/);
  assert.equal(tower.terminalLines.every((line) => line.length === 66), true);
});

test("home route retires the control tower from the default leaderboard instrument", () => {
  const page = readFileSync("packages/web/src/app/page.tsx", "utf8");

  assert.match(page, /LeaderboardConsole/);
  assert.doesNotMatch(page, /buildHomeControlTower|HomeBootPanoramaPanel|HomeControlTowerPanel|home-control-tower/);
});
