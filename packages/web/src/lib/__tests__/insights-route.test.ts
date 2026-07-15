import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { INSIGHTS_SAMPLE_PROFILE } from "../../app/insights/sample-profile.ts";
import { buildPlanScale } from "../../app/insights/plan-scale.ts";
import { buildInsightsEvidenceScope, buildInsightsRunwaySnapshot, buildInsightsRunwaySource } from "../insights-runway.ts";

test("insights route is a route-local explained cost plan", () => {
  const page = readFileSync("packages/web/src/app/insights/page.tsx", "utf8");
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const methodologySource = readFileSync("packages/web/src/app/insights/insight-methodology.tsx", "utf8");
  const briefSource = readFileSync("packages/web/src/app/insights/insight-brief.tsx", "utf8");
  const evidenceSource = readFileSync("packages/web/src/app/insights/insight-evidence-scope.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/insights/insights.css", "utf8");
  const briefStyles = readFileSync("packages/web/src/app/insights/insights-brief.css", "utf8");
  const controls = readFileSync("packages/web/src/app/insights/insights-controls.css", "utf8");
  const scopeStyles = readFileSync("packages/web/src/app/insights/insights-scope.css", "utf8");
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
  assert.match(page, /\.\/insights-scope\.css/);
  assert.match(page, /\.\/insights-ledger\.css/);
  assert.match(page, /\.\/insights-responsive\.css/);
  assert.match(consoleSource, /^"use client";/);
  assert.match(consoleSource, /buildPlanScale/);
  assert.match(consoleSource, /action="\/insights"/);
  assert.match(consoleSource, /name="handle"/);
  assert.ok(consoleSource.includes('pattern="[a-zA-Z0-9_.\\-]{1,64}"'));
  assert.match(consoleSource, /defaultValue=\{isPublic \? handle : requestedHandle\}/);
  assert.match(consoleSource, /Load forecast/);
  assert.match(consoleSource, /Live public profile/);
  assert.match(consoleSource, /Teaching sample/);
  assert.match(consoleSource, /Example usage, translated into a monthly plan/);
  assert.match(consoleSource, /usage translated into a monthly plan/);
  assert.match(consoleSource, /This is not your account\. Use the example to learn the forecast/);
  assert.match(consoleSource, /placeholder="github-handle"/);
  assert.match(consoleSource, /href="\/scan">Create a real scan/);
  assert.doesNotMatch(consoleSource, /Your usage, translated into a monthly plan/);
  assert.doesNotMatch(consoleSource, /intel-sample-flag/);
  assert.match(consoleSource, /data-source=/);
  assert.match(consoleSource, /<InsightBrief/);
  assert.match(consoleSource, /<InsightEvidenceScope source=\{source\}/);
  assert.match(consoleSource, /<InsightMethodology/);
  assert.match(consoleSource, /type="range"/);
  assert.match(consoleSource, /aria-pressed=/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText/);
  assert.match(consoleSource, /intel-readout__verdict/);
  assert.match(consoleSource, /href="#intel-controls-title">Tune assumptions/);
  assert.ok(consoleSource.indexOf('className="intel-readout"') < consoleSource.indexOf('className="intel-mast__copy"'), "the answer precedes the explanation in source order");
  assert.match(methodologySource, /Clipboard access failed/);
  assert.match(consoleSource, /0 usage writes · 0 rank changes · 0 provider changes/);
  assert.match(styles, /\.intel-console/);
  assert.match(styles, /LIVE PUBLIC PROFILE \/ LATEST 30-DAY PACE/);
  assert.match(styles, /\.intel-decision/);
  assert.doesNotMatch(styles, /\.intel-sample-flag/);
  assert.match(styles, /\.intel-readout strong \{[^}]*3\.3rem/);
  assert.doesNotMatch(styles, /\.intel-readout strong \{[^}]*clamp/);
  assert.match(briefSource, /What this scenario is actually saying/);
  assert.match(briefSource, /Thin evidence window/);
  assert.match(briefSource, /Treat the projection as directional until more days arrive/);
  assert.match(briefSource, /No daily rhythm/);
  assert.match(briefSource, /NEXT DECISION/);
  assert.match(briefSource, /Review <b>\{source\.topProvider\}<\/b> jobs first/);
  assert.match(briefSource, /Most of this buffer comes from the higher limit, not from local savings/);
  assert.match(briefStyles, /\.intel-brief__signals/);
  assert.match(briefStyles, /@media \(max-width: 760px\)/);
  assert.match(evidenceSource, /EVIDENCE APERTURE/);
  assert.match(evidenceSource, /Aggregate coverage slots, not calendar order/);
  assert.match(evidenceSource, /scenario floor is/);
  assert.match(scopeStyles, /grid-template-columns: repeat\(15, minmax\(0, 1fr\)\)/);
  assert.match(controls, /\.intel-presets/);
  assert.match(ledger, /\.intel-math/);
  assert.match(ledger, /\.intel-methodology:not\(\[open\]\) > \.intel-methodology__body \{ display: none; \}/);
  assert.match(methodologySource, /Calculation &amp; confidence ledger/);
  assert.match(methodologySource, /Open six calculation rows, provider review, evidence boundaries, formula, and CLI dry run/);
  assert.match(methodologySource, /This page writes nothing/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /\.intel-console \{ display: flex; flex-direction: column; \}/);
  assert.match(responsive, /\.intel-mast \{ order: 1; \}/);
  assert.match(responsive, /\.intel-brief \{ order: 2; \}/);
  assert.match(responsive, /\.intel-profile-picker \{ order: 4; \}/);
  assert.match(responsive, /\.intel-mast__copy \{ order: 2; min-width: 0; width: 100%; max-width: 100%; \}/);
  assert.match(responsive, /\.intel-basis \{ display: flex; min-width: 0; width: 100%; max-width: 100%; overflow-x: auto;/);
  assert.match(scopeStyles, /\.intel-scope__facts \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
  assert.match(scopeStyles, /\.intel-scope > p \{ display: none; \}/);
  assert.match(responsive, /@media \(min-width: 2200px\)/);
  assert.match(responsive, /max-width: min\(2640px, 95vw\)/);
  assert.match(responsive, /\.intel-console \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(responsive, /\.intel-brief \{ grid-column: 1; border-right: 1px solid var\(--intel-line\); \}/);
  assert.match(responsive, /\.intel-mast__copy \{/);
  assert.match(responsive, /\.intel-basis \{ grid-column: 2; grid-row: 1 \/ span 3/);
  assert.match(responsive, /prefers-reduced-motion/);
  assert.match(manifest, /000-vibetracker\.web\.runway-decision-console/);
  assert.doesNotMatch(page, /InsightsDecisionRadarPanel|InsightsBudgetPulsePanel|InsightsDeckPanel/);
  assert.doesNotMatch(consoleSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(briefSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(consoleSource, /type="checkbox"|intel-scope__wave|reviewArmed/);
  assert.ok(consoleSource.split("\n").length < 300, "main client console stays below the SMA target after methodology extraction");
});

test("insights explains its source, math, consequence, and confidence boundary in plain language", () => {
  const consoleSource = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const methodologySource = readFileSync("packages/web/src/app/insights/insight-methodology.tsx", "utf8");
  assert.match(consoleSource, /example numbers · not your account/);
  assert.match(consoleSource, /latest 30-day provider detail/);
  assert.match(consoleSource, /provider totals fallback/);
  assert.match(consoleSource, /01 · OBSERVED/);
  assert.match(consoleSource, /02 · CALENDAR PACE/);
  assert.match(consoleSource, /03 · 30-DAY PLAN/);
  assert.match(consoleSource, /calendar.*active.*idle/);
  assert.match(consoleSource, /latest upload total used as provisional baseline/);
  assert.match(consoleSource, /This percentage applies only to/);
  assert.match(consoleSource, /not to the full/);
  assert.match(methodologySource, /Where the result comes from/);
  assert.match(methodologySource, /Observed source period/);
  assert.match(methodologySource, /Same-rhythm 30-day projection/);
  assert.match(methodologySource, /What is known, estimated, and unchanged/);
  assert.match(consoleSource, /This plan leaves almost no room for a spike/);
  assert.match(methodologySource, /highest observed spend in this \{isPublic \? "public profile" : "example"\}/);
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
    observedUsd: 64.5,
    dailyPaceUsd: 21.5,
    localShadowUsd: 11.6,
    topProvider: "higgsfield",
    activeDays: 3,
    idleDays: 0,
    observedDays: 3,
    windowStart: "2026-07-03",
    windowEnd: "2026-07-05",
    evidenceBasis: "calendar_window",
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

  assert.deepEqual(buildInsightsEvidenceScope(source), {
    confidence: "thin",
    coveragePercent: 10,
    localSensitivityUsd: 1.16,
    projectionMultiplier: 10,
    scenarioFloorUsd: 633.4,
    unobservedDays: 27,
  });
});
