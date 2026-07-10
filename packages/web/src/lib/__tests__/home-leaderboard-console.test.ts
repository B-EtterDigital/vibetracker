import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");

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
  assert.match(source, /No ranked operators yet/);
  assert.match(source, /until reviewed aggregate usage arrives/);
});
