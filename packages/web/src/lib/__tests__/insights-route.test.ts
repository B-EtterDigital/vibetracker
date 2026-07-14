import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { INSIGHTS_SAMPLE_PROFILE } from "../../app/insights/sample-profile.ts";
import { buildInsightsRunwaySnapshot, buildInsightsRunwaySource } from "../insights-runway.ts";

test("insights route is a route-local explained cost plan", () => {
  const page = readFileSync("packages/web/src/app/insights/page.tsx", "utf8");
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const briefSource = readFileSync("packages/web/src/app/insights/insight-brief.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/insights/insights.css", "utf8");
  const briefStyles = readFileSync("packages/web/src/app/insights/insights-brief.css", "utf8");
  const controls = readFileSync("packages/web/src/app/insights/insights-controls.css", "utf8");
  const ledger = readFileSync("packages/web/src/app/insights/insights-ledger.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/insights/insights-responsive.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/insights/module.sweetspot.json", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

  assert.match(layout, /href="\/insights"/);   // reachable from the header
  assert.match(page, /buildInsightsRunwaySource/);
  assert.match(page, /<RunwayDecisionConsole/);
  assert.match(page, /\.\/insights\.css/);
  assert.match(page, /\.\/insights-brief\.css/);
  assert.match(page, /\.\/insights-controls\.css/);
  assert.match(page, /\.\/insights-ledger\.css/);
  assert.match(page, /\.\/insights-responsive\.css/);
  assert.match(consoleSource, /^"use client";/);
  assert.match(consoleSource, /PLAN_PRESETS/);
  assert.match(consoleSource, /<InsightBrief/);
  assert.match(consoleSource, /type="range"/);
  assert.match(consoleSource, /aria-pressed=/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText/);
  assert.match(consoleSource, /Clipboard access failed/);
  assert.match(consoleSource, /0 usage writes · 0 rank changes · 0 provider changes/);
  assert.match(styles, /\.intel-console/);
  assert.match(styles, /\.intel-decision/);
  assert.match(briefSource, /What this scenario is actually saying/);
  assert.match(briefSource, /Low confidence/);
  assert.match(briefSource, /Read the direction, not the forecast as a promise/);
  assert.match(briefSource, /NEXT DECISION/);
  assert.match(briefSource, /Review <b>\{source\.topProvider\}<\/b> jobs first/);
  assert.match(briefSource, /Most of this buffer comes from the higher limit, not from local savings/);
  assert.match(briefStyles, /\.intel-brief__signals/);
  assert.match(briefStyles, /@media \(max-width: 760px\)/);
  assert.match(controls, /\.intel-presets/);
  assert.match(ledger, /\.intel-math/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /prefers-reduced-motion/);
  assert.match(manifest, /000-vibetracker\.web\.runway-decision-console/);
  assert.doesNotMatch(page, /InsightsDecisionRadarPanel|InsightsBudgetPulsePanel|InsightsDeckPanel/);
  assert.doesNotMatch(consoleSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(briefSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(consoleSource, /type="checkbox"|intel-scope__wave|reviewArmed/);
});

test("insights explains its sample, math, consequence, and confidence boundary in plain language", () => {
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  assert.match(consoleSource, /Example calculation/);
  assert.match(consoleSource, /Not connected to your account/);
  assert.match(consoleSource, /Why the forecast is/);
  assert.match(consoleSource, /average on \{activeDays\} active example days × 30 days/);
  assert.match(consoleSource, /This percentage applies only to/);
  assert.match(consoleSource, /not to the full/);
  assert.match(consoleSource, /Where the result comes from/);
  assert.match(consoleSource, /What is known, estimated, and unchanged/);
  assert.match(consoleSource, /This plan leaves almost no room for a spike/);
  assert.match(consoleSource, /highest observed spend in this example/);
  assert.doesNotMatch(consoleSource, /See the burn|Bend the runway|DELTA LEDGER|LIVE PLAN SIGNAL|Local shadow offset/);
});

test("insights console derives every planning state from the production runway model", () => {
  const source = buildInsightsRunwaySource(INSIGHTS_SAMPLE_PROFILE);
  assert.deepEqual(source, {
    forecastUsd: 645,
    localShadowUsd: 11.6,
    topProvider: "higgsfield",
  });

  const protect = buildInsightsRunwaySnapshot({ ...source, monthlyCapUsd: 500, localShiftPercent: 60 });
  const target = buildInsightsRunwaySnapshot({ ...source, monthlyCapUsd: 650, localShiftPercent: 35 });
  const explore = buildInsightsRunwaySnapshot({ ...source, monthlyCapUsd: 750, localShiftPercent: 10 });

  assert.equal(protect.state, "over");
  assert.equal(target.state, "near");
  assert.equal(explore.state, "under");
  assert.equal(target.adjustedUsd, 640.94);
  assert.equal(target.varianceUsd, 9.06);
  assert.equal(target.stateLabel, "close to the limit");
  assert.match(target.command, /--budget 650 --local-shift 35 --dry-run/);
});
