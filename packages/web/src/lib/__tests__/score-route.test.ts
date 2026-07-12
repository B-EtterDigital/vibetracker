import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildScoreLabSnapshot,
  SCORE_LAB_PRESETS,
} from "../../app/score/score-model.ts";

test("score route is a focused interactive production-formula instrument", () => {
  const page = readFileSync("packages/web/src/app/score/page.tsx", "utf8");
  const lab = readFileSync("packages/web/src/app/score/score-lab.tsx", "utf8");
  const model = readFileSync("packages/web/src/app/score/score-model.ts", "utf8");
  const styles = readFileSync("packages/web/src/app/score/score.css", "utf8");
  const controls = readFileSync("packages/web/src/app/score/score-controls.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/score/score-responsive.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/score/module.sweetspot.json", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

  assert.match(layout, /href="\/score"><span>04<\/span>Score lab/);
  assert.match(page, /<ScoreLab \/>/);
  assert.match(page, /\.\/score\.css/);
  assert.match(page, /\.\/score-controls\.css/);
  assert.match(page, /\.\/score-responsive\.css/);
  assert.match(lab, /^"use client";/);
  assert.match(lab, /buildScoreLabSnapshot/);
  assert.match(lab, /type="range"/);
  assert.match(lab, /aria-pressed=/);
  assert.match(lab, /navigator\.clipboard\.writeText/);
  assert.match(lab, /Clipboard access failed/);
  assert.match(lab, /trust != usage/);
  assert.match(lab, /\+0 score/);
  assert.match(lab, /Nothing writes to a ledger, profile, or rank/);
  assert.match(model, /buildVibeScoreReceipt/);
  assert.match(model, /factor\.impact === "score"/);
  assert.match(styles, /\.score-gauge/);
  assert.match(styles, /\.score-receipt/);
  assert.match(styles, /\.score-ledger/);
  assert.match(styles, /\.wrap:has\(\.score-surface\)::before/);
  assert.match(controls, /input\[type="range"\]/);
  assert.match(controls, /:focus-visible/);
  assert.match(responsive, /@media \(max-width: 760px\)/);
  assert.match(responsive, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(manifest, /000-vibetracker\.web\.inspectable-score-lab/);
  assert.doesNotMatch(page, /ScoreDatastreamRelayPanel|ScoreFormulaFlightRecorderPanel|ScoreSignalMatrixPanel/);
  assert.doesNotMatch(lab, /dangerouslySetInnerHTML/);
});

test("score lab uses the production formula and quarantines trust context", () => {
  const originalNow = Date.now;
  Date.now = () => Date.UTC(2026, 6, 5, 12, 0, 0);
  try {
    const studio = buildScoreLabSnapshot(SCORE_LAB_PRESETS[1].input);
    assert.equal(studio.receipt.score, 79);
    assert.equal(studio.scoringPoints, studio.receipt.score);
    assert.equal(studio.scoringMax, 92);
    assert.equal(studio.profile.providers.length, 3);
    assert.equal(studio.profile.usageDays.length, 3);

    const noTrust = buildScoreLabSnapshot({ ...SCORE_LAB_PRESETS[1].input, trustSignals: 0 });
    const highTrust = buildScoreLabSnapshot({ ...SCORE_LAB_PRESETS[1].input, trustSignals: 5 });
    assert.equal(noTrust.receipt.score, highTrust.receipt.score);
    assert.equal(noTrust.trustContextPoints, 0);
    assert.ok(highTrust.trustContextPoints > 0);
    assert.equal(highTrust.receipt.factors.find((factor) => factor.id === "trust")?.impact, "not_usage");

    const power = buildScoreLabSnapshot(SCORE_LAB_PRESETS[2].input);
    assert.equal(power.receipt.score, 92);
    assert.equal(power.receipt.tier, "legend");

    const offline = buildScoreLabSnapshot({
      records: 0,
      usd: 500,
      activeDays: 90,
      providers: 10,
      freshnessDays: 0,
      trustSignals: 5,
    });
    assert.equal(offline.receipt.score, 0);
    assert.equal(offline.receipt.tier, "offline");
    assert.equal(offline.profile.providers.length, 0);
  } finally {
    Date.now = originalNow;
  }
});
