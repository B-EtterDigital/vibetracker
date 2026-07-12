import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { INSIGHTS_SAMPLE_PROFILE } from "../../app/insights/sample-profile.ts";
import { buildInsightsRunwaySnapshot, buildInsightsRunwaySource } from "../insights-runway.ts";

test("insights route is a route-local interactive decision console", () => {
  const page = readFileSync("packages/web/src/app/insights/page.tsx", "utf8");
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/insights/insights.css", "utf8");
  const controls = readFileSync("packages/web/src/app/insights/insights-controls.css", "utf8");
  const ledger = readFileSync("packages/web/src/app/insights/insights-ledger.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/insights/insights-responsive.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/insights/module.sweetspot.json", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

  assert.match(layout, /href="\/insights">Insights/);
  assert.match(page, /buildInsightsRunwaySource/);
  assert.match(page, /<RunwayDecisionConsole/);
  assert.match(page, /\.\/insights\.css/);
  assert.match(page, /\.\/insights-controls\.css/);
  assert.match(page, /\.\/insights-ledger\.css/);
  assert.match(page, /\.\/insights-responsive\.css/);
  assert.match(consoleSource, /^"use client";/);
  assert.match(consoleSource, /PLAN_PRESETS/);
  assert.match(consoleSource, /type="range"/);
  assert.match(consoleSource, /type="checkbox"/);
  assert.match(consoleSource, /aria-pressed=/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText/);
  assert.match(consoleSource, /Clipboard access failed/);
  assert.match(consoleSource, /0 totals \/ 0 rank \/ 0 provider writes/);
  assert.match(styles, /\.intel-console/);
  assert.match(styles, /\.intel-scope/);
  assert.match(controls, /\.intel-review/);
  assert.match(ledger, /\.intel-ledger__row\[data-impact="not_spend"\]/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /prefers-reduced-motion/);
  assert.match(manifest, /000-vibetracker\.web\.runway-decision-console/);
  assert.doesNotMatch(page, /InsightsDecisionRadarPanel|InsightsBudgetPulsePanel|InsightsDeckPanel/);
  assert.doesNotMatch(consoleSource, /dangerouslySetInnerHTML/);
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
  assert.match(target.command, /--budget 650 --local-shift 35 --dry-run/);
  assert.equal(target.waveform.length, 16);
});
