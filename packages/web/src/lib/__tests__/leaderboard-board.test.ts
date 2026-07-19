import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  boardHref,
  categoryPillLabel,
  disciplineLabel,
  flagEmoji,
  formatBoardUsd,
  formatCompactInt,
  isTopThree,
  loadBoard,
  parseLeaderboardFilters,
  rankLabel,
  rowInfoLine,
} from "../../app/leaderboard-params.ts";
import { LEADERBOARD_CATEGORIES, type LeaderboardRow } from "../leaderboard-contract.ts";

const board = readFileSync("packages/web/src/app/home/leaderboard-board.tsx", "utf8");
const boardCss = readFileSync("packages/web/src/app/home/leaderboard.css", "utf8");
const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
const rankings = readFileSync("packages/web/src/app/u/[handle]/profile-rankings.tsx", "utf8");
const rankingsCss = readFileSync("packages/web/src/app/u/[handle]/profile-rankings.css", "utf8");
const profilePage = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");

function row(overrides: Partial<LeaderboardRow>): LeaderboardRow {
  return {
    rank: 1,
    handle: "cyrill-etter",
    totalUsd: 1000,
    totalOps: 100,
    attested: false,
    ...overrides,
  };
}

// ---- FILTER RAIL: every pill + the sort toggle -------------------------------------------------

test("filter rail renders every contract category pill plus the SPEND/OPS sort toggle", () => {
  // All nine categories in the exact contract order the pills must show.
  assert.deepEqual([...LEADERBOARD_CATEGORIES], [
    "all", "coding", "image", "video", "music", "audio", "llm", "3d", "other",
  ]);
  assert.match(board, /LEADERBOARD_CATEGORIES\.map\(\(category\)/);
  assert.match(board, /className="vlb-pill"/);
  assert.match(board, /\{categoryPillLabel\(category\)\}/);
  // Pills are shareable <a> links (server component, no client JS), active-marked.
  assert.match(board, /href=\{boardHref\(category, filters\.sort\)\}/);
  assert.match(board, /data-active=\{active \? "true" : undefined\}/);
  assert.doesNotMatch(board, /"use client"/);
  // Sort toggle exposes both SPEND and OPS as links that preserve the category.
  assert.match(board, /id: "usd", label: "SPEND"/);
  assert.match(board, /id: "ops", label: "OPS"/);
  assert.match(board, /href=\{boardHref\(filters\.category, sortOption\.id\)\}/);
  // Uppercase pill labels for each category.
  assert.equal(categoryPillLabel("music"), "MUSIC");
  assert.equal(categoryPillLabel("3d"), "3D");
});

// ---- CATEGORY + SORT PARAMS FLOW INTO fetchLeaderboard (mocked) --------------------------------

test("category and sort params flow verbatim into fetchLeaderboard", async () => {
  const calls: unknown[] = [];
  const mockFetch = async (filters: unknown) => {
    calls.push(filters);
    return [] as LeaderboardRow[];
  };
  const { filters, rows } = await loadBoard({ cat: "music", sort: "ops" }, mockFetch);
  assert.deepEqual(calls[0], { category: "music", sort: "ops" });
  assert.deepEqual(filters, { category: "music", sort: "ops" });
  assert.deepEqual(rows, []);
});

test("unknown / missing params fall back to the all board sorted by spend", () => {
  assert.deepEqual(parseLeaderboardFilters({}), { category: "all", sort: "usd" });
  assert.deepEqual(parseLeaderboardFilters({ cat: "bogus", sort: "sideways" }), { category: "all", sort: "usd" });
  assert.deepEqual(parseLeaderboardFilters({ cat: ["3d"], sort: ["ops"] }), { category: "3d", sort: "ops" });
  assert.deepEqual(parseLeaderboardFilters({ cat: "MUSIC" }), { category: "music", sort: "usd" });
});

test("home page is a server component that parses params and calls fetchLeaderboard through the seam", () => {
  assert.match(page, /from "\.\.\/lib\/leaderboard-data"/);
  assert.match(page, /import \{ LeaderboardBoard \}/);
  assert.match(page, /const sp = await searchParams/);
  assert.match(page, /\{ filters, rows \} = await loadBoard\(sp, fetchLeaderboard\)/);
  assert.match(page, /<LeaderboardBoard filters=\{filters\} rows=\{rows\} \/>/);
  assert.doesNotMatch(page, /"use client"/);
});

test("shareable hrefs omit the two defaults so the base board stays at root", () => {
  assert.equal(boardHref("all", "usd"), "/");
  assert.equal(boardHref("music", "usd"), "/?cat=music");
  assert.equal(boardHref("all", "ops"), "/?sort=ops");
  assert.equal(boardHref("music", "ops"), "/?cat=music&sort=ops");
});

// ---- ROWS: flag only when country present -----------------------------------------------------

test("board rows render a flag only when a country is set (no placeholder)", () => {
  // JSX guards the flag on a truthy derived value.
  assert.match(board, /const flag = flagEmoji\(row\.country\)/);
  assert.match(board, /\{flag \? \(/);
  // Real derivation: valid alpha-2 -> emoji; unset / malformed -> null (nothing rendered).
  assert.equal(flagEmoji("ch"), "🇨🇭");
  assert.equal(flagEmoji("US"), "🇺🇸");
  assert.equal(flagEmoji(null), null);
  assert.equal(flagEmoji(undefined), null);
  assert.equal(flagEmoji(""), null);
  assert.equal(flagEmoji("usa"), null);
  assert.equal(flagEmoji("1"), null);
});

test("row info line omits null parts and pluralizes honestly", () => {
  assert.equal(
    rowInfoLine(row({ topCategory: "image", modelCount: 3, activeDays: 12 })),
    "Image · 3 models · 12 active days",
  );
  assert.equal(rowInfoLine(row({ topCategory: "music", modelCount: 1, activeDays: 1 })), "Music · 1 model · 1 active day");
  assert.equal(rowInfoLine(row({ topCategory: null, modelCount: null, activeDays: null })), "");
  assert.equal(rowInfoLine(row({ topCategory: "coding", modelCount: 0, activeDays: 5 })), "Coding · 5 active days");
});

test("board usd uses the compact $75.8K house style; ops are compact too", () => {
  assert.equal(formatBoardUsd(75800), "$75.8K");
  assert.equal(formatBoardUsd(1_200_000), "$1.2M");
  assert.equal(formatBoardUsd(2_000), "$2K");
  assert.equal(formatBoardUsd(950), "$950");
  assert.equal(formatBoardUsd(0), "$0");
  assert.equal(formatBoardUsd(null), "$0");
  assert.equal(formatCompactInt(12_800), "12.8K");
  assert.equal(formatCompactInt(0), "0");
  assert.equal(rankLabel(1), "01");
  assert.equal(rankLabel(42), "42");
  assert.equal(rankLabel(103), "103");
});

// ---- TOP-3 emphasis ---------------------------------------------------------------------------

test("top-3 rows carry the mint emphasis class and mint rank digits", () => {
  assert.equal(isTopThree(1), true);
  assert.equal(isTopThree(3), true);
  assert.equal(isTopThree(4), false);
  assert.match(board, /vlb-row--top/);
  assert.match(board, /data-top3=\{top \? "true" : undefined\}/);
  assert.match(boardCss, /\.vlb-row--top \{/);
  assert.match(boardCss, /\.vlb-row--top \.vlb-rank \{ color: var\(--vlb-accent\); \}/);
});

// ---- ATTESTED marker --------------------------------------------------------------------------

test("attested rows show the attested marker", () => {
  assert.match(board, /\{row\.attested \? \(/);
  assert.match(board, /className="vlb-attested"/);
  assert.match(board, /aria-label="identity-attested usage"/);
  assert.match(boardCss, /\.vlb-attested \{/);
});

// ---- EMPTY STATE + mobile ---------------------------------------------------------------------

test("empty board shows the honest first-viber invite and no horizontal scroll on mobile", () => {
  assert.match(board, /rows\.length \?/);
  assert.match(board, /no vibers on this board yet — be the first: npx vibetrack/);
  assert.match(boardCss, /\.vlb-empty \{/);
  assert.match(boardCss, /@media \(max-width: 767px\)/);
  assert.match(boardCss, /grid-template-areas:/);
  assert.match(boardCss, /@media \(prefers-reduced-motion: reduce\)/);
});

// ---- ROW anatomy ------------------------------------------------------------------------------

test("each row is a link to the viber profile with rank, handle, usd, and ops", () => {
  assert.match(board, /href=\{`\/u\/\$\{row\.handle\}`\}/);
  assert.match(board, /className="vlb-rank"/);
  assert.match(board, /className="vlb-handle"/);
  assert.match(board, /className="vlb-usd"/);
  assert.match(board, /className="vlb-ops"/);
  assert.match(board, /\{rankLabel\(row\.rank\)\}/);
  assert.match(board, /\{formatBoardUsd\(row\.totalUsd\)\}/);
});

// ---- PROFILE RANKINGS PANEL -------------------------------------------------------------------

test("rankings panel renders one card per rank and nothing when empty", () => {
  assert.match(rankings, /if \(!ranks\.length\) return null;/);
  assert.match(rankings, /LEADERBOARD PLACEMENTS/);
  assert.match(rankings, /ranks\.map\(\(rank\)/);
  assert.match(rankings, /className=\{`vrank-card\$\{top \? " vrank-card--top" : ""\}`\}/);
  assert.match(rankings, /#\{rank\.rank\}/);
  assert.match(rankings, /\{disciplineLabel\(rank\.category\)\.toUpperCase\(\)\}/);
  assert.match(rankings, /of \{rank\.of\} vibers/);
  assert.match(rankings, /\{formatBoardUsd\(rank\.usd\)\}/);
  // Top-3 placements read mint, the rest bone.
  assert.match(rankings, /data-top3=\{top \? "true" : undefined\}/);
  assert.match(rankingsCss, /grid-template-columns: repeat\(auto-fit, minmax\(140px, 1fr\)\)/);
  assert.match(rankingsCss, /\.vrank-pos\[data-top3="true"\] \{ color: #2ee8d6; \}/);
});

test("rankings fixtures: a top-3 card and its labels derive exactly from the data", () => {
  // Proves the label/format helpers the panel maps over produce the honest card text.
  assert.equal(disciplineLabel("3d").toUpperCase(), "3D");
  assert.equal(disciplineLabel("music").toUpperCase(), "MUSIC");
  assert.equal(formatBoardUsd(41_200), "$41.2K");
  assert.equal(isTopThree(3), true);
  assert.equal(isTopThree(41), false);
});

test("profile page fetches category ranks and renders the placements panel near identity", () => {
  assert.match(profilePage, /import \{ ProfileRankings \}/);
  assert.match(profilePage, /import \{ fetchCategoryRanks \} from "\.\.\/\.\.\/\.\.\/lib\/leaderboard-data"/);
  assert.match(profilePage, /const categoryRanks = isDemo \? \[\] : await loadCategoryRanks\(profile\.handle, fetchCategoryRanks\)/);
  assert.match(profilePage, /if \(categoryRanks\.length\) add\("hero", "full", <ProfileRankings ranks=\{categoryRanks\} key="rankings" \/>\)/);
});
