import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { INSIGHTS_SAMPLE_PROFILE } from "../../app/insights/sample-profile.ts";
import { buildPlanScale } from "../../app/insights/plan-scale.ts";
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
  assert.match(page, /getProfile/);
  assert.match(page, /buildDemoProfile/);
  assert.match(page, /searchParams: Promise/);
  assert.match(page, /PUBLIC_HANDLE_RE/);
  assert.match(page, /No published VibeUsage profile exists/);
  assert.match(page, /<RunwayDecisionConsole/);
  assert.match(page, /\.\/insights\.css/);
  assert.match(page, /\.\/insights-brief\.css/);
  assert.match(page, /\.\/insights-controls\.css/);
  assert.match(page, /\.\/insights-ledger\.css/);
  assert.match(page, /\.\/insights-responsive\.css/);
  assert.match(consoleSource, /^"use client";/);
  assert.match(consoleSource, /buildPlanScale/);
  assert.match(consoleSource, /action="\/insights"/);
  assert.match(consoleSource, /name="handle"/);
  assert.match(consoleSource, /defaultValue=\{isPublic \? handle : requestedHandle\}/);
  assert.match(consoleSource, /Analyze profile/);
  assert.match(consoleSource, /Live public profile/);
  assert.match(consoleSource, /data-source=/);
  assert.match(consoleSource, /<InsightBrief/);
  assert.match(consoleSource, /type="range"/);
  assert.match(consoleSource, /aria-pressed=/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText/);
  assert.match(consoleSource, /Clipboard access failed/);
  assert.match(consoleSource, /0 usage writes · 0 rank changes · 0 provider changes/);
  assert.match(styles, /\.intel-console/);
  assert.match(styles, /LIVE PUBLIC PROFILE \/ LATEST 30-DAY PACE/);
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

test("insights explains its source, math, consequence, and confidence boundary in plain language", () => {
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  assert.match(consoleSource, /explicit example data · not your account/);
  assert.match(consoleSource, /latest 30-day provider detail/);
  assert.match(consoleSource, /provider totals fallback/);
  assert.match(consoleSource, /Why the forecast is/);
  assert.match(consoleSource, /average on \{activeDays\} \{observationLabel\} × 30 days/);
  assert.match(consoleSource, /This percentage applies only to/);
  assert.match(consoleSource, /not to the full/);
  assert.match(consoleSource, /Where the result comes from/);
  assert.match(consoleSource, /What is known, estimated, and unchanged/);
  assert.match(consoleSource, /This plan leaves almost no room for a spike/);
  assert.match(consoleSource, /highest observed spend in this \{isPublic \? "public profile" : "example"\}/);
  assert.doesNotMatch(consoleSource, /See the burn|Bend the runway|DELTA LEDGER|LIVE PLAN SIGNAL|Local shadow offset/);
});

test("insights budget controls scale to the profile instead of capping power users at $1k", () => {
  const small = buildPlanScale(645);
  assert.deepEqual(small.presets.map((preset) => preset.cap), [525, 650, 775]);
  assert.equal(small.step, 25);
  assert.ok(small.max > 1000);

  const power = buildPlanScale(90_900);
  assert.deepEqual(power.presets.map((preset) => preset.cap), [73_000, 91_000, 109_000]);
  assert.equal(power.step, 1000);
  assert.ok(power.max >= 190_000);

  const empty = buildPlanScale(Number.NaN);
  assert.deepEqual(empty.presets.map((preset) => preset.cap), [40, 50, 60]);
});

test("insights console derives every planning state from the production runway model", () => {
  const source = buildInsightsRunwaySource(INSIGHTS_SAMPLE_PROFILE);
  assert.deepEqual(source, {
    forecastUsd: 645,
    localShadowUsd: 11.6,
    topProvider: "higgsfield",
    activeDays: 3,
    windowStart: "2026-06-06",
    windowEnd: "2026-07-05",
    providerBasis: "profile_totals",
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
