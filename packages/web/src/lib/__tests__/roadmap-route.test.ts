import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("roadmap route exposes the marked-list mission radar", () => {
  const page = readFileSync("packages/web/src/app/roadmap/page.tsx", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(layout, /href="\/roadmap"><span>09<\/span>Roadmap/);
  assert.match(page, /buildRoadmapMissionRadar/);
  assert.match(page, /RoadmapMissionRadarPanel/);
  assert.match(page, /roadmap-mission-radar/);
  assert.match(page, /roadmap-mission-terminal/);
  assert.match(page, /roadmap-mission-pulses/);
  assert.match(page, /roadmap-mission-bands/);
  assert.match(page, /roadmap-mission-invariants/);
  assert.match(page, /VTK:\/\/ROADMAP-RADAR\/\/MARKED-LIST\/\/NO-FAKE-BUILT/);
  assert.match(page, /radar@roadmap/);
  assert.match(page, /band\.primaryNumbers/);
  assert.match(page, /band\.guardrail/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /c0vibe\.app/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);

  assert.match(styles, /\.roadmap-mission-radar/);
  assert.match(styles, /\.roadmap-mission-radar__head/);
  assert.match(styles, /\.roadmap-mission-terminal/);
  assert.match(styles, /\.roadmap-mission-pulses/);
  assert.match(styles, /\.roadmap-mission-bands/);
  assert.match(styles, /\.roadmap-mission-band--trust/);
  assert.match(styles, /\.roadmap-mission-band__numbers/);
  assert.match(styles, /\.roadmap-mission-band__meter i/);
  assert.match(styles, /\.roadmap-mission-invariants/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});
