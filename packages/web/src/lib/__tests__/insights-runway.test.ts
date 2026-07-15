import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ProfileView } from "../data.ts";
import { buildInsightsEvidenceScope, buildInsightsRunwaySnapshot, buildInsightsRunwaySource } from "../insights-runway.ts";

const profile: ProfileView = {
  handle: "insights-lab",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: false,
  latest: {
    total_usd: 64.5,
    total_credits: 1200,
    record_count: 2400,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 200, credits: 800, usd: 44 },
    { provider: "claude-code", ops: 1800, credits: 300, usd: 14 },
    { provider: "ollama", ops: 400, credits: 100, usd: 6.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 600, credits: 250, usd: 14.5 },
    { date: "2026-07-04", ops: 800, credits: 400, usd: 20 },
    { date: "2026-07-05", ops: 1000, credits: 550, usd: 30 },
  ],
  categories: [], providerDays: [], providerModels: [], trustSignals: [],
};

test("runway source derives a calendar-day pace and keeps eligible local savings separate", () => {
  assert.deepEqual(buildInsightsRunwaySource(profile), {
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
});

test("runway source counts idle gaps in an established 30-day history", () => {
  const source = buildInsightsRunwaySource({
    ...profile,
    usageDays: [
      { date: "2025-01-01", ops: 99_000, credits: 0, usd: 99_000 },
      ...profile.usageDays,
    ],
    providerDays: [
      { provider: "openai", date: "2025-01-01", ops: 1, credits: 0, usd: 99_000 },
      { provider: "higgsfield", date: "2026-07-03", ops: 200, credits: 800, usd: 44 },
      { provider: "claude-code", date: "2026-07-04", ops: 1800, credits: 300, usd: 14 },
      { provider: "ollama", date: "2026-07-05", ops: 400, credits: 100, usd: 6.5 },
    ],
  });

  assert.equal(source.forecastUsd, 64.5);
  assert.equal(source.observedUsd, 64.5);
  assert.equal(source.dailyPaceUsd, 2.15);
  assert.equal(source.topProvider, "higgsfield");
  assert.equal(source.localShadowUsd, 11.6);
  assert.equal(source.activeDays, 3);
  assert.equal(source.idleDays, 27);
  assert.equal(source.observedDays, 30);
  assert.equal(source.windowStart, "2026-06-06");
  assert.equal(source.evidenceBasis, "calendar_window");
  assert.equal(source.providerBasis, "recent_30d");
});

test("runway source keeps upload totals provisional when daily evidence is unavailable", () => {
  const source = buildInsightsRunwaySource({ ...profile, usageDays: [] });

  assert.equal(source.forecastUsd, 64.5);
  assert.equal(source.observedUsd, 64.5);
  assert.equal(source.dailyPaceUsd, 0);
  assert.equal(source.activeDays, 0);
  assert.equal(source.idleDays, 0);
  assert.equal(source.observedDays, 0);
  assert.equal(source.windowStart, null);
  assert.equal(source.evidenceBasis, "upload_total_fallback");
  assert.deepEqual(buildInsightsEvidenceScope(source), {
    confidence: "provisional",
    coveragePercent: 0,
    localSensitivityUsd: 1.16,
    projectionMultiplier: null,
    scenarioFloorUsd: 52.9,
    unobservedDays: 30,
  });
});

test("evidence scope distinguishes broad coverage from extrapolation and local sensitivity", () => {
  const source = buildInsightsRunwaySource({
    ...profile,
    usageDays: [
      { date: "2025-01-01", ops: 1, credits: 0, usd: 1 },
      ...profile.usageDays,
    ],
  });

  assert.deepEqual(buildInsightsEvidenceScope(source), {
    confidence: "broad",
    coveragePercent: 100,
    localSensitivityUsd: 1.16,
    projectionMultiplier: 1,
    scenarioFloorUsd: 52.9,
    unobservedDays: 0,
  });
});

test("runway planner derives an estimate-only over-cap state", () => {
  const snapshot = buildInsightsRunwaySnapshot({
    forecastUsd: 645,
    localShadowUsd: 11.6,
    monthlyCapUsd: 500,
    localShiftPercent: 35,
  });

  assert.equal(snapshot.projectedUsd, 645);
  assert.equal(snapshot.localOffsetUsd, 4.06);
  assert.equal(snapshot.adjustedUsd, 640.94);
  assert.equal(snapshot.varianceUsd, -140.94);
  assert.equal(snapshot.utilizationPercent, 128);
  assert.equal(snapshot.state, "over");
  assert.equal(snapshot.stateLabel, "over budget");
  assert.equal(snapshot.command, "npx vibetrack mission --budget 500");
});

test("runway planner clamps unsafe control values and handles a zero forecast", () => {
  const snapshot = buildInsightsRunwaySnapshot({
    forecastUsd: -40,
    localShadowUsd: 20,
    monthlyCapUsd: 0,
    localShiftPercent: 180,
  });

  assert.equal(snapshot.projectedUsd, 0);
  assert.equal(snapshot.localOffsetUsd, 20);
  assert.equal(snapshot.adjustedUsd, 0);
  assert.equal(snapshot.varianceUsd, 1);
  assert.equal(snapshot.utilizationPercent, 0);
  assert.equal(snapshot.state, "under");
  assert.equal(snapshot.stateLabel, "inside budget");
  assert.equal(snapshot.command, "npx vibetrack mission --budget 1");
});

test("Insights mounts an isolated, accessible planning instrument", () => {
  const page = readFileSync("packages/web/src/app/insights/page.tsx", "utf8");
  const component = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const brief = readFileSync("packages/web/src/app/insights/insight-brief.tsx", "utf8");
  const methodology = readFileSync("packages/web/src/app/insights/insight-methodology.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/insights/insights.css", "utf8");
  const controls = readFileSync("packages/web/src/app/insights/insights-controls.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/insights/insights-responsive.css", "utf8");

  assert.match(page, /import \{ RunwayDecisionConsole \}/);
  assert.match(page, /<RunwayDecisionConsole/);
  assert.match(component, /type="range"/);
  assert.match(brief, /role="img"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /navigator\.clipboard\.writeText/);
  assert.match(methodology, /This page writes nothing/);
  assert.match(component, /<InsightMethodology/);
  assert.match(styles, /\.intel-comparison/);
  assert.match(controls, /input\[type="range"\]/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(component, /type="checkbox"|waveform/);
  assert.doesNotThrow(() => readFileSync("packages/web/src/app/icon.svg", "utf8"));
});
