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

test("home route exposes the control tower before the mission spine", () => {
  const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(page, /buildHomeControlTower/);
  assert.match(page, /function HomeBootPanoramaPanel/);
  assert.match(page, /className="home-boot-panorama"/);
  assert.match(page, /VTK:\/\/HOME-BOOT-PANORAMA\/\/LIVE-SHELL\/\/NO-FAKE-USAGE/);
  assert.match(page, /boot@vibetracker/);
  assert.match(page, /Terminal handoff/);
  assert.match(page, /Branded scan theatre/);
  assert.match(page, /Proof boundary/);
  assert.match(page, /Trust side rail/);
  assert.match(page, /C0VIBE public relay/);
  assert.match(page, /trust cannot change spend, rank, score totals, or verified usage/);
  assert.match(page, /No prompt text, output text, secrets, or raw files move/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /C0vibe\.app/);
  assert.match(page, /providerCalls \{tower\.totals\.providerCalls\}/);
  assert.match(page, /hiddenUpload \{tower\.totals\.hiddenUploads\}/);
  assert.match(page, /function HomeControlTowerPanel/);
  assert.match(page, /className="home-control-tower"/);
  assert.match(page, /tower@vibetracker/);
  assert.match(page, /href=\{deck\.href\}/);
  assert.match(page, /tower\.totals\.hiddenUploads/);
  assert.ok(page.indexOf("<HomeBootPanoramaPanel") < page.indexOf("<HomeControlTowerPanel tower={controlTower} />"));
  assert.ok(page.indexOf("<HomeControlTowerPanel tower={controlTower} />") < page.indexOf("<HomeMissionSpinePanel spine={missionSpine} />"));

  assert.match(styles, /\.home-boot-panorama/);
  assert.match(styles, /\.home-boot-panorama__terminal/);
  assert.match(styles, /\.home-boot-panorama__radar/);
  assert.match(styles, /\.home-boot-panorama__rails/);
  assert.match(styles, /\.home-boot-rail/);
  assert.match(styles, /\.home-boot-rail__screen pre:first-child/);
  assert.match(styles, /\.home-boot-rail\[data-impact="NOT USAGE"\]/);
  assert.match(styles, /\.home-boot-panorama__rails \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /\.home-boot-panorama__rails \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /\.home-boot-rail__screen pre:first-child \{ opacity: 1; \}/);
  assert.match(styles, /\.home-control-tower/);
  assert.match(styles, /\.home-control-tower__decks/);
  assert.match(styles, /\.home-control-deck__screen pre:first-child/);
  assert.match(styles, /\.home-control-ledger/);
  assert.match(styles, /WIZARD \/ MOTION \/ SCAN \/ SOURCES \/ SCORE \/ LIFE \/ PROOF \/ PROFILE/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /\.home-control-deck__screen pre:first-child \{ opacity: 1; \}/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.home-control-tower__decks \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /@media \(max-width: 460px\)/);
  assert.match(styles, /\.home-control-tower__decks \{ grid-template-columns: 1fr; \}/);
});
