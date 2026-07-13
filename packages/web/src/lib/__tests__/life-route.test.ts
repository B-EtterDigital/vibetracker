import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("AI life dashboard is exposed as a first-class labelled route", () => {
  const page = readFileSync("packages/web/src/app/life/page.tsx", "utf8");
  const lifeStyles = readFileSync("packages/web/src/app/life/life.css", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(layout, /href="\/life"/);   // reachable from the header
  // ---- new calm whole-practice composition (old broadcast-theatre pins replaced) ----
  assert.match(page, /import \{ CopyChip \} from "\.\/life-chips"/);
  assert.match(page, /import "\.\/life\.css"/);
  assert.match(lifeStyles, /\.wrap:has\(> \.vlife\)::before/);
  assert.match(lifeStyles, /white-space: normal/);
  assert.match(page, /title: "VibeUsage AI Life"/);
  assert.match(page, /One picture of your whole AI practice: creation, coding, local labs/);
  assert.match(page, /Your whole AI practice, not just coding spend/);
  assert.match(page, /Six rails, one tracker\./);
  assert.match(page, /Usage, trust, local-only, and publish stay separate and labeled\./);
  assert.match(page, /vlife-hero/);
  assert.match(page, /vlife-rails/);
  assert.match(page, /vlife-card/);
  assert.match(page, /Creator studio/);
  assert.match(page, /command: "vibetracker sync",/);
  assert.match(page, /Builder desk/);
  assert.match(page, /command: "vibetracker trust list",/);
  assert.match(page, /Local AI lab/);
  assert.match(page, /command: "vibetracker detect",/);
  assert.match(page, /Research desk/);
  assert.match(page, /command: "vibetracker export --format md",/);
  assert.match(page, /Regional frontier/);
  assert.match(page, /command: "vibetracker providers --all",/);
  assert.match(page, /Public relay/);
  assert.match(page, /vibetracker upload --dry-run/);
  assert.match(page, /vlife-strip/);
  assert.match(page, /usage · trust · local-only · publish — four rails, never mixed\./);
  assert.match(page, /vlife-cta/);
  assert.match(page, /See it live/);
  assert.match(page, /href="\/u\/anonymous"/);
  assert.match(page, /a live profile →/);
  assert.match(page, /href="\/providers"/);
  assert.match(page, /the provider directory →/);
  assert.match(page, /CopyChip command="npx vibetrack init"/);
  assert.match(page, /"--panel-i"/);
  // old broadcast theatre and its lib-builder wiring must be gone from the page
  assert.doesNotMatch(page, /buildAiLifeCockpit/);
  assert.doesNotMatch(page, /AiLifeBroadcastWallPanel/);
  assert.doesNotMatch(page, /AiLifePersonaAtlasPanel/);
  assert.doesNotMatch(page, /life-broadcast-wall/);
  assert.doesNotMatch(page, /life-constellation/);
  assert.doesNotMatch(page, /life-practice-passport/);
  assert.doesNotMatch(page, /VTK:\/\//);
  assert.doesNotMatch(page, /Vibers Unite/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});
