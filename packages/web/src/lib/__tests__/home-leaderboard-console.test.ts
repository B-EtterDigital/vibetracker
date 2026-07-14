import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");
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
