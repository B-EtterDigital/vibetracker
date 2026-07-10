import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMissionStrip } from "../mission-strip.ts";

test("mission strip renders c0vibe motto, trust boundary, and fixed width", () => {
  const text = renderMissionStrip({
    surface: "total",
    title: "Usage command relay",
    ops: 12,
    providers: 3,
    credits: 99,
    usd: 42.5,
    localSavingsUsd: 7.25,
    topProvider: "higgsfield",
    range: "grouped by provider",
    next: "vibetracker stats -> insights",
  });

  assert.match(text, /VTK:\/\/MISSION-STRIP\/\/TOTAL\/\/VIBERS-UNITE/);
  assert.match(text, /c0vibe\.app/);
  assert.match(text, /12 ops · 3 providers · 99 credits · est spend \$42\.50/);
  assert.match(text, /\[HF\] Higgsfield · #ff4fd8->#7c5cff/);
  assert.match(text, /trust\/builder\/social signals separate · NOT USAGE/);
  assert.match(text, /surprise cadence: queue -> scan beat -> checkpoint encore/);
  for (const line of text.split("\n")) assert.equal(line.length, 66);
});

test("mission strip handles empty insight state without fake provider proof", () => {
  const text = renderMissionStrip({
    surface: "insights",
    title: "Insight command relay",
    ops: 0,
    providers: 0,
    credits: 0,
    usd: 0,
    spendLabel: "30d forecast",
    next: "vibetracker sync --demo",
    empty: true,
  });

  assert.match(text, /range no records yet/);
  assert.match(text, /top rail none yet/);
  assert.match(text, /30d forecast \$0\.00/);
});
