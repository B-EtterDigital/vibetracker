import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildLeaderboardReadout } from "../../app/home/leaderboard-readout.ts";

const source = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");
const lens = readFileSync("packages/web/src/app/home/leaderboard-lens.ts", "utf8");
const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
const homeCss = readFileSync("packages/web/src/app/home/home.css", "utf8");
const brief = readFileSync("packages/web/src/app/home/leaderboard-brief.tsx", "utf8");
const briefCss = readFileSync("packages/web/src/app/home/leaderboard-brief.css", "utf8");
const uplink = readFileSync("packages/web/src/app/home/signal-uplink.tsx", "utf8");
const uplinkCss = readFileSync("packages/web/src/app/home/signal-uplink.css", "utf8");
const identityClaim = readFileSync("packages/web/src/app/home/identity-claim-rail.tsx", "utf8");
const identityClaimCss = readFileSync("packages/web/src/app/home/identity-claim-rail.css", "utf8");
const fieldInstrument = readFileSync("packages/web/src/app/home/leaderboard-field-instrument.tsx", "utf8");
const fieldInstrumentCss = readFileSync("packages/web/src/app/home/leaderboard-field-instrument.css", "utf8");

test("leaderboard tier changes reset transient search and expansion state", () => {
  assert.match(source, /function selectTier\(nextTier: HomeBoardTier\)/);
  assert.match(source, /setTier\(nextTier\)/);
  assert.match(source, /setQuery\(""\)/);
  assert.match(source, /setExpanded\(false\)/);
});

test("leaderboard search and paging never rewrite the ranked source rows", () => {
  assert.match(source, /active\.rows\.filter\(\(row\) => row\.handle\.toLowerCase\(\)\.includes\(normalized\)\)/);
  assert.match(source, /buildHomeBoardLens\(active\.rows, lensId\)/);
  assert.match(lens, /const visible = rows\.slice\(0, 10\)/);
  assert.match(source, /const visibleRows = expanded \? filteredRows : filteredRows\.slice\(0, PAGE_SIZE\)/);
  assert.doesNotMatch(source, /\.sort\(/);
  assert.doesNotMatch(lens, /\.sort\(/);
});

test("leaderboard runway switches display lenses without changing rank order", () => {
  assert.match(source, /buildHomeBoardLens\(active\.rows, lensId\)/);
  assert.match(source, /role="group" aria-label="Runway display lens"/);
  assert.match(source, /aria-pressed=\{lensId === item\.id\}/);
  assert.match(source, /RANK ORDER UNCHANGED/);
  assert.match(source, /lens\.rows\.map\(\(\{ row, barWidth, valueLabel \}\)/);
  assert.match(lens, /value <= 0 \? "0%"/);
  assert.doesNotMatch(lens, /\.sort\(/);
});

test("leaderboard runway exposes honest comparison readiness beside the unchanged rank", () => {
  assert.match(source, /<LeaderboardFieldInstrument rows=\{active\.rows\} lens=\{lensId\}/);
  assert.match(fieldInstrument, /OPERATOR FIELD/);
  assert.match(fieldInstrument, /Strongest share/);
  assert.match(fieldInstrument, /comparisonReady \? "YES" : "NO"/);
  assert.match(fieldInstrument, /DISTRIBUTION TOPOLOGY/);
  assert.match(fieldInstrument, /NORMALIZED DISPLAY \/\/ ZERO RANK WEIGHT/);
  assert.match(fieldInstrument, /field\.points\.map/);
  assert.match(fieldInstrumentCss, /\.home-field__scope/);
  assert.match(fieldInstrumentCss, /\.home-field__beacon/);
  assert.match(fieldInstrumentCss, /grid-template-columns: minmax\(260px, 0\.72fr\) minmax\(0, 2fr\)/);
  assert.match(fieldInstrumentCss, /@media \(max-width: 900px\)/);
  assert.match(fieldInstrumentCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(page, /\.\/home\/leaderboard-field-instrument\.css/);
});

test("mobile directory gives every metric a stable two-column span", () => {
  assert.match(homeCss, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(homeCss, /td\[data-label="Spend"\] \{ grid-column: 1 \/ 3; \}/);
  assert.match(homeCss, /td\[data-label="Credits"\] \{ grid-column: 3 \/ 5; \}/);
  assert.match(homeCss, /td\[data-label="Records"\] \{ grid-column: 5 \/ 7; \}/);
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

test("leader lock puts the real lane leader ahead of explanation without inventing empty data", () => {
  assert.match(source, /const leader = active\.rows\[0\] \?\? null/);
  assert.match(source, /className="home-board__leader-lock"/);
  assert.match(source, /leader\.usdLabel/);
  assert.match(source, /leader\.opsLabel/);
  assert.match(source, /active\.totals\.operators/);
  assert.match(source, /leaderEvidenceLabel\(leader\)/);
  assert.match(source, /NO RANKED SIGNAL/);
  assert.match(source, /no fallback leader is shown/);
  assert.ok(source.indexOf("home-board__controls") < source.indexOf("home-board__leader-lock"));
  assert.ok(source.indexOf("home-board__leader-lock") < source.indexOf("home-board__boundary"));
  assert.match(homeCss, /\.home-board__leader-lock \{[\s\S]*grid-template-columns: 86px minmax\(190px, 1fr\) auto auto/);
  assert.match(homeCss, /@media \(max-width: 680px\)[\s\S]*\.home-board__leader-lock \{ grid-template-columns: 42px minmax\(0, 1fr\) auto/);
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
  assert.match(source, /role="img" title=\{identityProofLabel\(row\)\} aria-label=\{identityProofLabel\(row\)\}/);
  assert.match(source, /CLI upload; identity not verified/);
  assert.match(source, /home-board__identity-proof--cli/);
  assert.match(source, /<IdentityClaimRail \/>/);
  assert.match(identityClaim, /Claim the blue check\. Keep the ledger\./);
  assert.match(identityClaim, /identity proof never upgrades usage evidence/);
  assert.match(identityClaim, /href="\/account\?next=%2F"/);
  assert.match(identityClaim, /No C0VIBE account required/);
  assert.match(identityClaimCss, /@media \(max-width: 620px\)/);
  assert.match(identityClaimCss, /@media \(prefers-reduced-motion: reduce\)/);
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
  assert.equal(readout.signals[1].value, "$10.00 / record");
  assert.match(readout.signals[1].note, /accepted normalized records/);
  assert.match(source, /<dt>Accepted records<\/dt>/);
  assert.match(lens, /label: "Records"/);
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
  assert.match(briefCss, /width: min\(3200px, 94vw\)/);
  assert.match(briefCss, /var\(--hb-line\)/);
  assert.doesNotMatch(briefCss, /var\(--home-/);
});

test("leaderboard readout has an honest waiting state", () => {
  const readout = buildLeaderboardReadout([]);
  assert.match(readout.summary, /No ranked signal yet/);
  assert.deepEqual(readout.signals.map((signal) => signal.value), ["—", "—", "0 / 0", "0 / 0"]);
});

test("4K leaderboard becomes a two-channel broadcast wall without changing mobile rules", () => {
  assert.match(briefCss, /@media \(min-width: 2200px\)/);
  assert.match(briefCss, /width: min\(3200px, 94vw\)/);
  assert.match(homeCss, /@media \(min-width: 2200px\)/);
  assert.match(homeCss, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(homeCss, /\.home-board h1 \{ font-size: 4rem; \}/);
  assert.match(homeCss, /\.home-board__leader-identity \.home-board__operator \{ font-size: 24px; \}/);
  assert.match(homeCss, /\.home-board__metrics dd \{ font-size: 2rem; \}/);
  assert.match(briefCss, /\.home-readout__signals article \{ min-height: 132px;/);
  assert.match(fieldInstrumentCss, /\.home-board__signal-stage \{ grid-template-columns: 540px minmax\(0, 1fr\); gap: 26px; \}/);
  assert.match(fieldInstrumentCss, /\.home-field__scope \{ height: 220px; \}/);
  assert.match(homeCss, /\.home-board__section-head label \{ grid-template-columns: auto minmax\(260px, 360px\); font-size: 11px; \}/);
  assert.match(homeCss, /\.home-board__section-head input \{ width: 100%; min-width: 0; height: 40px; font-size: 14px; \}/);
  assert.match(homeCss, /\.home-board > \.home-readout \{ grid-column: 1; border-right: 1px solid var\(--hb-line\); \}/);
  assert.match(homeCss, /\.home-board > \.home-board__chart \{ grid-column: 2; min-width: 0; \}/);
  assert.match(homeCss, /\.home-board__leader-lock,[\s\S]*\.home-board__boundary,[\s\S]*grid-column: 1 \/ -1/);
  assert.match(homeCss, /\.home-board__directory,[\s\S]*\.home-board__encore[\s\S]*grid-column: 1 \/ -1/);
  assert.match(homeCss, /@media \(max-width: 680px\)[\s\S]*\.home-surface \{ width: calc\(100vw - 20px\); \}/);
});
