import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInsightsBudgetPulse, buildInsightsPrivateScopeRadar, buildInsightsRoiSwitchboard, buildProfileDecisionBoard, buildProfileIntelligenceDeck } from "../profile-intelligence.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
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
  categories: [], trustSignals: [],
};

test("profile intelligence deck derives forecast and provider efficiency from public aggregates", () => {
  const deck = buildProfileIntelligenceDeck(profile);
  const pace = deck.cards.find((card) => card.id === "pace");
  const forecast = deck.cards.find((card) => card.id === "forecast");
  const cheapest = deck.cards.find((card) => card.id === "cheapest");
  const expensive = deck.cards.find((card) => card.id === "expensive");
  const concentration = deck.cards.find((card) => card.id === "concentration");

  assert.equal(deck.headline, "$645.00 projected 30d pace");
  assert.equal(pace?.value, "$21.50/day");
  assert.equal(forecast?.value, "$645.00");
  assert.equal(cheapest?.value, "claude-code");
  assert.equal(expensive?.value, "higgsfield");
  assert.equal(concentration?.value, "68%");
  assert.match(deck.terminalLines.join("\n"), /ESTIMATE-ONLY/);
});

test("profile intelligence keeps local shadow value separate from spend", () => {
  const deck = buildProfileIntelligenceDeck(profile);
  const local = deck.cards.find((card) => card.id === "local_shadow");

  assert.ok(local);
  assert.equal(local.impact, "not_spend");
  assert.match(local.note, /NOT SPEND/);
  assert.equal(local.status, "400 local ops");
  assert.match(deck.terminalLines.join("\n"), /NOT SPEND/);
});

test("profile intelligence has a safe waiting state", () => {
  const deck = buildProfileIntelligenceDeck({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(deck.headline, "Cost intelligence waiting for usage");
  assert.equal(deck.cards[0].value, "waiting");
  assert.equal(deck.cards[1].value, "$0.00");
  assert.equal(deck.cards[2].status, "no rate");
  assert.equal(deck.cards[5].impact, "not_spend");
  assert.equal(deck.cards.every((card) => card.meter >= 0 && card.meter <= 100), true);
});

test("profile decision board turns estimates into no-write actions", () => {
  const board = buildProfileDecisionBoard(profile);

  assert.equal(board.headline, "5 recommended decisions");
  assert.deepEqual(board.actions.map((action) => action.id), [
    "burn-alert",
    "workflow-review",
    "local-shift",
    "focus-check",
    "publish-review",
  ]);
  assert.deepEqual(board.actions.map((action) => action.impact), [
    "estimate",
    "estimate",
    "not_spend",
    "estimate",
    "no_write",
  ]);
  assert.equal(board.terminalLines.every((line) => line.length === 64), true);
  assert.match(board.terminalLines.join("\n"), /INSIGHTS-DECISIONS/);
  assert.match(board.terminalLines.join("\n"), /NO-WRITES/);
  assert.match(board.terminalLines.join("\n"), /NOT SPEND/);
  assert.match(board.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(board.totals, {
    actions: 5,
    estimate: 3,
    notSpend: 1,
    noWrite: 1,
    averageMeter: 67,
  });

  const burn = board.actions.find((action) => action.id === "burn-alert");
  assert.ok(burn);
  assert.equal(burn.value, "$645.00 / 30d");
  assert.match(burn.command, /--budget 500/);

  const workflow = board.actions.find((action) => action.id === "workflow-review");
  assert.ok(workflow);
  assert.equal(workflow.value, "higgsfield");
  assert.equal(workflow.status, "$0.220/op");

  const local = board.actions.find((action) => action.id === "local-shift");
  assert.ok(local);
  assert.equal(local.value, "$11.60");
  assert.match(local.proof, /NOT SPEND/);

  const publish = board.actions.find((action) => action.id === "publish-review");
  assert.ok(publish);
  assert.equal(publish.value, "C0VIBE ready");
  assert.equal(publish.impact, "no_write");
  assert.match(publish.proof, /never write usage records/);
});

test("profile decision board has a safe waiting state", () => {
  const board = buildProfileDecisionBoard({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(board.headline, "Decision board waiting for usage");
  assert.equal(board.actions[0].value, "waiting");
  assert.equal(board.actions[1].status, "no rate");
  assert.equal(board.actions[4].value, "waiting");
  assert.equal(board.actions[4].meter, 18);
  assert.equal(board.actions.every((action) => action.meter >= 0 && action.meter <= 100), true);
});

test("insights budget pulse labels burn, provider pressure, local shadow, and no-write review", () => {
  const pulse = buildInsightsBudgetPulse(profile);
  const terminal = pulse.terminalLines.join("\n");

  assert.equal(pulse.headline, "$645.00 budget pulse");
  assert.match(pulse.subline, /no-write command bridge/);
  assert.match(terminal, /INSIGHTS-BUDGET-PULSE/);
  assert.match(terminal, /NO-WRITES/);
  assert.match(terminal, /hiddenUploads 0/);
  assert.match(terminal, /promptReads 0/);
  assert.match(terminal, /outputReads 0/);
  assert.match(terminal, /totalMutations 0/);
  assert.equal(pulse.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(pulse.lanes.map((lane) => lane.id), [
    "daily-pace",
    "forecast",
    "provider-pressure",
    "expensive-workflow",
    "local-shadow",
    "review-gate",
  ]);
  assert.deepEqual(pulse.lanes.map((lane) => lane.impact), [
    "estimate",
    "estimate",
    "estimate",
    "estimate",
    "not_spend",
    "no_write",
  ]);
  assert.deepEqual(pulse.totals, {
    lanes: 6,
    estimates: 4,
    notSpend: 1,
    noWrite: 1,
    usageWrites: 0,
    totalMutations: 0,
  });
  assert.equal(pulse.lanes.every((lane) => lane.frames.length === 3), true);
  assert.equal(pulse.lanes.every((lane) => lane.transcript.length === 3), true);
  assert.equal(pulse.lanes.every((lane) => lane.from.startsWith("#") && lane.to.startsWith("#")), true);
  assert.match(pulse.lanes.find((lane) => lane.id === "local-shadow")?.guardrail ?? "", /never counts as billable spend/);
  assert.match(pulse.lanes.find((lane) => lane.id === "review-gate")?.transcript.join("\n") ?? "", /hiddenUploads 0/);
});

test("insights ROI switchboard exposes planning deltas without mutating usage", () => {
  const roi = buildInsightsRoiSwitchboard(profile);
  const terminal = roi.terminalLines.join("\n");

  assert.equal(roi.headline, "$187.44 planning delta visible");
  assert.match(roi.subline, /Estimate-only decision levers/);
  assert.match(terminal, /INSIGHTS-ROI-SWITCHBOARD/);
  assert.match(terminal, /NO-WRITES/);
  assert.match(terminal, /NOT SPEND/);
  assert.match(terminal, /hiddenUploads 0/);
  assert.match(terminal, /promptReads 0/);
  assert.match(terminal, /totalMutations 0/);
  assert.equal(roi.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(roi.levers.map((lever) => lever.id), [
    "budget-cap",
    "rate-swap",
    "local-repeat",
    "provider-mix",
    "publish-proof",
  ]);
  assert.deepEqual(roi.levers.map((lever) => lever.impact), [
    "estimate",
    "estimate",
    "not_spend",
    "estimate",
    "no_write",
  ]);
  assert.deepEqual(roi.totals, {
    levers: 5,
    estimates: 3,
    notSpend: 1,
    noWrite: 1,
    usageWrites: 0,
    totalMutations: 0,
    planningEstimateUsd: 187.44,
    localShadowUsd: 11.6,
  });
  assert.equal(roi.levers.every((lever) => lever.screen.length === 3), true);
  assert.equal(roi.levers.every((lever) => lever.proof.length === 3), true);
  assert.equal(roi.levers.every((lever) => lever.from.startsWith("#") && lever.to.startsWith("#")), true);
  assert.equal(roi.levers.find((lever) => lever.id === "rate-swap")?.value, "$42.44");
  assert.match(roi.levers.find((lever) => lever.id === "local-repeat")?.guardrail ?? "", /NOT SPEND/);
  assert.match(roi.levers.find((lever) => lever.id === "publish-proof")?.guardrail ?? "", /NO WRITE/);
});

test("insights private scope radar labels account profile and team splits as local only", () => {
  const radar = buildInsightsPrivateScopeRadar(profile);
  const terminal = radar.terminalLines.join("\n");

  assert.equal(radar.headline, "Private scope radar armed");
  assert.match(radar.subline, /account, profile, and team\/org separation/);
  assert.match(terminal, /INSIGHTS-PRIVATE-SCOPE/);
  assert.match(terminal, /LOCAL-ONLY/);
  assert.match(terminal, /account profile team filters stay private/);
  assert.match(terminal, /publicWrites 0/);
  assert.match(terminal, /rankMutations 0/);
  assert.match(terminal, /hiddenUploads 0/);
  assert.match(terminal, /promptReads 0/);
  assert.match(terminal, /outputReads 0/);
  assert.equal(radar.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(radar.lanes.map((lane) => lane.id), ["account", "profile", "team", "publish"]);
  assert.deepEqual(radar.lanes.map((lane) => lane.impact), ["private", "private", "private", "no_write"]);
  assert.deepEqual(radar.totals, {
    lanes: 4,
    privateRails: 3,
    publicWrites: 0,
    rankMutations: 0,
    hiddenUploads: 0,
  });
  assert.equal(radar.lanes.every((lane) => lane.frames.length === 3), true);
  assert.equal(radar.lanes.every((lane) => lane.proof.length === 3), true);
  assert.match(radar.lanes.find((lane) => lane.id === "account")?.command ?? "", /--account/);
  assert.match(radar.lanes.find((lane) => lane.id === "profile")?.guardrail ?? "", /PRIVATE/);
  assert.match(radar.lanes.find((lane) => lane.id === "team")?.guardrail ?? "", /Team\/org scope is usage-only context/);
  assert.match(radar.lanes.find((lane) => lane.id === "publish")?.guardrail ?? "", /NO WRITE/);
});

test("insights ROI switchboard has a safe waiting state", () => {
  const roi = buildInsightsRoiSwitchboard({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(roi.headline, "ROI switchboard waiting for usage");
  assert.equal(roi.levers[0].value, "waiting");
  assert.equal(roi.levers[1].status, "no rated pair");
  assert.equal(roi.levers[2].impact, "not_spend");
  assert.equal(roi.levers[4].value, "waiting");
  assert.equal(roi.levers.every((lever) => lever.meter >= 0 && lever.meter <= 100), true);
  assert.equal(roi.totals.usageWrites, 0);
  assert.equal(roi.totals.totalMutations, 0);
});
