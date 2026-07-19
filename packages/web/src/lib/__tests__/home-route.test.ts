import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
const consoleSource = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/home/home.css", "utf8");

test("home route is a compact server-owned leaderboard surface", () => {
  // Redesigned (SMOA lane M): the category-aware board. The server route reads the shareable
  // URL params, parses them into planner-contract filters, and hands them to fetchLeaderboard.
  assert.match(page, /const sp = await searchParams/);
  assert.match(page, /\{ filters, rows \} = await loadBoard\(sp, fetchLeaderboard\)/);
  assert.match(page, /from "\.\.\/lib\/leaderboard-data"/);
  assert.match(page, /<LeaderboardBoard filters=\{filters\} rows=\{rows\} \/>/);
  assert.doesNotMatch(page, /"use client"/);
  assert.doesNotMatch(page, /UsageSignalDock|HomeViberSpectrum|LeaderboardPodiumWavePanel|HomeControlTowerPanel/);
  assert.ok(page.split("\n").length <= 110, "home route should remain an orchestration seam");
});

test("home console keeps trust lanes separate and the repeated workflow efficient", () => {
  assert.match(consoleSource, /"use client"/);
  assert.match(consoleSource, /role="group" aria-label="Leaderboard trust tier"/);
  assert.match(consoleSource, /aria-pressed=\{tier === board\.tier\}/);
  assert.match(consoleSource, /Search handle/);
  assert.match(consoleSource, /filteredRows\.slice\(0, PAGE_SIZE\)/);
  assert.match(consoleSource, /Show all \$\{filteredRows\.length\}/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText\(COMMAND\)/);
  assert.match(consoleSource, /title="Copy VibeTRACKER GUI install command"/);
  assert.doesNotMatch(consoleSource, /aria-label="Copy VibeTRACKER GUI install command"/);
  assert.match(consoleSource, /TRUST \+0 \/\/ MIXED RANKS 0/);
  assert.match(consoleSource, /trust evidence explains context and adds zero/i);
  assert.match(consoleSource, /hidden uploads remain zero/);
  assert.equal((consoleSource.match(/className="home-board__chart"/g) ?? []).length, 1);
  assert.match(consoleSource, /<details className="home-board__encore">/);
  assert.doesNotMatch(consoleSource, /dangerouslySetInnerHTML/);
});

test("home route-local styles stay responsive, stable, and motion-safe", () => {
  assert.match(styles, /\.home-board__runway/);
  assert.match(styles, /\.home-board__table-shell table \{[^}]*table-layout: fixed/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styles, /td\[data-label="Operator"\] \{ grid-column: 2 \/ -1/);
  assert.match(styles, /td:is\(\[data-label="Spend"\], \[data-label="Credits"\], \[data-label="Records"\]\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.home-board :is\(a, button, input, summary\):focus-visible/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/);
  assert.ok(consoleSource.split("\n").length <= 320, "client console should remain below the SMA target");
  assert.ok(styles.split("\n").length <= 500, "route-local styles should remain below the SMA target");
});
