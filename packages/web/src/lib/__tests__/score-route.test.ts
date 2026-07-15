import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
import {
  buildScoreLabSnapshot,
  buildScoreSignalBrief,
  SCORE_LAB_PRESETS,
} from "../../app/score/score-model.ts";

test("score route is a focused interactive production-formula instrument", () => {
  const page = readFileSync("packages/web/src/app/score/page.tsx", "utf8");
  const lab = readFileSync("packages/web/src/app/score/score-lab.tsx", "utf8");
  const model = readFileSync("packages/web/src/app/score/score-model.ts", "utf8");
  const styles = readFileSync("packages/web/src/app/score/score.css", "utf8");
  const controls = readFileSync("packages/web/src/app/score/score-controls.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/score/score-responsive.css", "utf8");
  const brief = readFileSync("packages/web/src/app/score/score-signal-brief.tsx", "utf8");
  const briefStyles = readFileSync("packages/web/src/app/score/score-brief.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/score/module.sweetspot.json", "utf8");

  assert.ok(operatorRouteFor("/score"));
  assert.match(page, /<ScoreLab \/>/);
  assert.match(page, /\.\/score-brief\.css/);
  assert.match(page, /\.\/score\.css/);
  assert.match(page, /\.\/score-controls\.css/);
  assert.match(page, /\.\/score-responsive\.css/);
  assert.match(lab, /^"use client";/);
  assert.match(lab, /buildScoreLabSnapshot/);
  assert.match(lab, /buildScoreSignalBrief/);
  assert.match(lab, /<ScoreSignalBrief brief=\{brief\}/);
  assert.match(lab, /id=\{\`score-\$\{control\.key\}\`\}/);
  assert.match(lab, /name=\{\`score-\$\{control\.key\}\`\}/);
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
  assert.match(responsive, /@media \(min-width: 2200px\)/);
  assert.match(responsive, /\.score-surface \{ width: min\(3200px, 94vw\); \}/);
  assert.match(responsive, /grid-template-columns: 280px minmax\(0, 1\.35fr\) minmax\(760px, 0\.8fr\)/);
  assert.match(responsive, /min-height: 880px/);
  assert.match(responsive, /\.score-instrument h1 \{ font-size: 4rem; \}/);
  assert.match(responsive, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(brief, /READ THIS SCORE \/ LIVE INTERPRETATION/);
  assert.match(brief, /STRONGEST DRIVER/);
  assert.match(brief, /LARGEST OPEN GAIN/);
  assert.match(brief, /SCALE CONTRACT/);
  assert.match(briefStyles, /\.score-signal-brief__equation/);
  assert.match(briefStyles, /article\[data-tone="scale"\]/);
  assert.match(briefStyles, /@media \(min-width: 2200px\)/);
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
    const brief = buildScoreSignalBrief(studio);
    assert.equal(brief.headline, "79 comes from usage. Trust adds zero.");
    assert.equal(brief.currentLabel, "79 usage points");
    assert.equal(brief.ceilingLabel, "92 honest ceiling");
    assert.equal(brief.trustLabel, "8 outside score");
    assert.equal(brief.scale.label, "/100 fixed display");
    assert.equal(brief.scale.value, "92 scoreable max");
    assert.match(brief.scale.note, /8 reserved trust points stay visible at \+0/);
    assert.match(brief.explanation, /fixed display scale/);
    assert.equal(brief.strongest.label, "Usage mass");
    assert.equal(brief.opportunity.label, "Daily rhythm");
    assert.equal(brief.opportunity.value, "10 points open");

    const noTrust = buildScoreLabSnapshot({ ...SCORE_LAB_PRESETS[1].input, trustSignals: 0 });
    const highTrust = buildScoreLabSnapshot({ ...SCORE_LAB_PRESETS[1].input, trustSignals: 5 });
    assert.equal(noTrust.receipt.score, highTrust.receipt.score);
    assert.equal(noTrust.trustContextPoints, 0);
    assert.ok(highTrust.trustContextPoints > 0);
    assert.equal(highTrust.receipt.factors.find((factor) => factor.id === "trust")?.impact, "not_usage");

    const power = buildScoreLabSnapshot(SCORE_LAB_PRESETS[2].input);
    assert.equal(power.receipt.score, 92);
    assert.equal(power.receipt.tier, "legend");
    assert.match(buildScoreSignalBrief(power).explanation, /scoreable formula ceiling, not a missing 8 points/);

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
