import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";

test("roadmap route leads with an honest interactive navigator and preserves the marked-list appendix", () => {
  const page = readFileSync("packages/web/src/app/roadmap/page.tsx", "utf8");
  const client = readFileSync("packages/web/src/app/roadmap/roadmap-navigator.tsx", "utf8");
  const blueprint = readFileSync("packages/web/src/app/roadmap/roadmap-blueprint.tsx", "utf8");
  const routeStyles = readFileSync("packages/web/src/app/roadmap/roadmap-navigator.css", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.ok(operatorRouteFor("/roadmap"));
  assert.match(page, /buildRoadmapReleaseNavigator/);
  assert.match(page, /<RoadmapNavigator/);
  assert.match(page, /<details className="roadmap-blueprint">/);
  assert.match(page, /<RoadmapBlueprint/);
  assert.equal(page.indexOf("<RoadmapNavigator") < page.indexOf("<details"), true);

  assert.match(client, /role="tablist"/);
  assert.match(client, /ArrowLeft/);
  assert.match(client, /SEARCH MANIFEST/);
  assert.match(client, /NO DATES IN SOURCE/);
  assert.match(client, /QUEUE EMPTY/);
  assert.match(client, /window\.navigator\.clipboard\.writeText/);
  assert.match(client, /No .* capability is encoded/);
  assert.doesNotMatch(client, /quarter|Q[1-4] 20\d\d|ETA:/);

  assert.match(routeStyles, /\.roadmap-navigator__views/);
  assert.match(routeStyles, /\.roadmap-navigator__workbench/);
  assert.match(routeStyles, /\.roadmap-navigator__empty/);
  assert.match(routeStyles, /\.roadmap-navigator__excluded/);
  assert.match(routeStyles, /@media \(max-width: 620px\)/);
  assert.match(routeStyles, /@media \(min-width: 2200px\)/);
  assert.match(routeStyles, /max-width: min\(2640px, 95vw\)/);
  assert.match(routeStyles, /prefers-reduced-motion: reduce/);

  assert.match(blueprint, /buildRoadmapMissionRadar/);
  assert.match(blueprint, /RoadmapMissionRadarPanel/);
  assert.match(blueprint, /roadmap-mission-radar/);
  assert.match(blueprint, /roadmap-mission-terminal/);
  assert.match(blueprint, /roadmap-mission-pulses/);
  assert.match(blueprint, /roadmap-mission-bands/);
  assert.match(blueprint, /roadmap-mission-invariants/);
  assert.match(blueprint, /VTK:\/\/ROADMAP-RADAR\/\/MARKED-LIST\/\/NO-FAKE-BUILT/);
  assert.match(blueprint, /radar@roadmap/);
  assert.match(blueprint, /band\.primaryNumbers/);
  assert.match(blueprint, /band\.guardrail/);
  assert.match(blueprint, /Vibers Unite/);
  assert.match(blueprint, /c0vibe\.app/);
  assert.doesNotMatch(blueprint, /dangerouslySetInnerHTML/);

  assert.match(styles, /\.roadmap-mission-radar/);
  assert.match(styles, /\.roadmap-mission-radar__head/);
  assert.match(styles, /\.roadmap-mission-terminal/);
  assert.match(styles, /\.roadmap-mission-pulses/);
  assert.match(styles, /\.roadmap-mission-bands/);
  assert.match(styles, /\.roadmap-mission-band--trust/);
  assert.match(styles, /\.roadmap-mission-band__numbers/);
  assert.match(styles, /\.roadmap-mission-band__meter i/);
  assert.match(styles, /\.roadmap-mission-invariants/);
});
