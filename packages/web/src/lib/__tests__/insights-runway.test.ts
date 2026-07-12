import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ProfileView } from "../data.ts";
import { buildInsightsRunwaySnapshot, buildInsightsRunwaySource } from "../insights-runway.ts";

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
  trustSignals: [],
};

test("runway source uses the real 30-day pace and keeps local shadow separate", () => {
  assert.deepEqual(buildInsightsRunwaySource(profile), {
    forecastUsd: 645,
    localShadowUsd: 11.6,
    topProvider: "higgsfield",
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
  assert.equal(snapshot.runwayDays, 23);
  assert.equal(snapshot.state, "over");
  assert.equal(snapshot.stateLabel, "above ceiling");
  assert.match(snapshot.command, /--budget 500 --local-shift 35 --dry-run/);
  assert.equal(snapshot.waveform.length, 16);
  assert.equal(snapshot.waveform.every((value) => value >= 12 && value <= 96), true);
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
  assert.equal(snapshot.runwayDays, 99);
  assert.equal(snapshot.state, "under");
  assert.match(snapshot.command, /--budget 1 --local-shift 100 --dry-run/);
});

test("Insights mounts an isolated, accessible planning instrument", () => {
  const page = readFileSync("packages/web/src/app/insights/page.tsx", "utf8");
  const component = readFileSync("packages/web/src/app/insights/runway-decision-console.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/insights/insights.css", "utf8");
  const controls = readFileSync("packages/web/src/app/insights/insights-controls.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/insights/insights-responsive.css", "utf8");

  assert.match(page, /import \{ RunwayDecisionConsole \}/);
  assert.match(page, /<RunwayDecisionConsole/);
  assert.match(component, /type="range"/);
  assert.match(component, /type="checkbox"/);
  assert.match(component, /role="img"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /navigator\.clipboard\.writeText/);
  assert.match(component, /It writes no usage data/);
  assert.match(styles, /\.intel-scope/);
  assert.match(controls, /input\[type="range"\]/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotThrow(() => readFileSync("packages/web/src/app/icon.svg", "utf8"));
});
