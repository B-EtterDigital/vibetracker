import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildLeaderboardReadout } from "../../app/home/leaderboard-readout.ts";

const source = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");
const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
const brief = readFileSync("packages/web/src/app/home/leaderboard-brief.tsx", "utf8");
const briefCss = readFileSync("packages/web/src/app/home/leaderboard-brief.css", "utf8");
const uplink = readFileSync("packages/web/src/app/home/signal-uplink.tsx", "utf8");
const uplinkCss = readFileSync("packages/web/src/app/home/signal-uplink.css", "utf8");

test("leaderboard tier changes reset transient search and expansion state", () => {
  assert.match(source, /function selectTier\(nextTier: HomeBoardTier\)/);
  assert.match(source, /setTier\(nextTier\)/);
  assert.match(source, /setQuery\(""\)/);
  assert.match(source, /setExpanded\(false\)/);
});

test("leaderboard search and paging never rewrite the ranked source rows", () => {
  assert.match(source, /active\.rows\.filter\(\(row\) => row\.handle\.toLowerCase\(\)\.includes\(normalized\)\)/);
  assert.match(source, /const chartRows = active\.rows\.slice\(0, 10\)/);
  assert.match(source, /const visibleRows = expanded \? filteredRows : filteredRows\.slice\(0, PAGE_SIZE\)/);
  assert.doesNotMatch(source, /\.sort\(/);
});

test("leaderboard degraded and waiting states do not invent usage", () => {
  assert.match(source, /Board temporarily unavailable/);
  assert.match(source, /no fallback usage is invented/);
  assert.match(source, /isWaitingEmpty/);
  assert.match(source, /<SignalUplink/);
  assert.match(uplink, /No public bundle yet/);
  assert.match(uplink, /no reviewed aggregate usage/);
  assert.match(uplink, /Nothing is generated, uploaded, or ranked on this screen/);
  assert.match(uplink, /never enters leaderboard totals/);
  assert.doesNotMatch(uplink, /\$\d|total_usd|record_count/);
});

test("empty leaderboard exposes a responsive accessible local-to-public uplink", () => {
  assert.match(uplink, /aria-label="Local usage to public leaderboard path"/);
  assert.match(uplink, /Usage records stay on this device/);
  assert.match(uplink, /Inspect the aggregate before upload/);
  assert.match(uplink, /GitHub or C0VIBE proves the operator/);
  assert.match(uplink, /Rank appears only after a valid upload/);
  assert.match(uplink, /aria-live="polite"/);
  assert.match(uplinkCss, /@media \(max-width: 680px\)/);
  assert.match(uplinkCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(uplinkCss, /animation: none/);
});

test("leaderboard distinguishes verified identity from handle-only CLI uploads", () => {
  assert.match(source, /function IdentityProof/);
  assert.match(source, /GitHub identity verified/);
  assert.match(source, /identity-attested CLI usage/);
  assert.match(source, /CLI upload; identity not verified/);
  assert.match(source, /home-board__identity-proof--cli/);
});

test("leaderboard explains concentration, unit cost, active depth, and identity coverage without changing rank", () => {
  const readout = buildLeaderboardReadout([
    { handle: "alpha", usd: 900, credits: 12, ops: 90, identityVerified: true },
    { handle: "beta", usd: 100, credits: 0, ops: 10, identityVerified: false },
    { handle: "idle", usd: 0, credits: 0, ops: 0, identityVerified: false },
  ]);

  assert.match(readout.summary, /top-heavy/);
  assert.deepEqual(readout.signals.map((signal) => signal.id), ["concentration", "unit-cost", "active-depth", "identity"]);
  assert.equal(readout.signals[0].value, "90%");
  assert.equal(readout.signals[1].value, "$10.00 / op");
  assert.equal(readout.signals[2].value, "2 / 3");
  assert.equal(readout.signals[3].value, "1 / 3");
  assert.match(brief, /What the ranking actually means/);
  assert.match(brief, /ZERO RANK WEIGHT/);
  assert.match(source, /<LeaderboardBrief rows=\{active\.rows\}/);
  assert.match(page, /credits: row\.total_credits/);
  assert.match(page, /ops: row\.record_count/);
  assert.match(page, /\.\/home\/leaderboard-brief\.css/);
  assert.match(briefCss, /@media \(max-width: 560px\)/);
  assert.match(briefCss, /@media \(min-width: 2200px\)/);
  assert.match(briefCss, /width: min\(1760px, calc\(100vw - 120px\)\)/);
  assert.match(briefCss, /var\(--hb-line\)/);
  assert.doesNotMatch(briefCss, /var\(--home-/);
});

test("leaderboard readout has an honest waiting state", () => {
  const readout = buildLeaderboardReadout([]);
  assert.match(readout.summary, /No ranked signal yet/);
  assert.deepEqual(readout.signals.map((signal) => signal.value), ["—", "—", "0 / 0", "0 / 0"]);
});
