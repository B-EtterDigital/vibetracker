import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
import { readFileSync } from "node:fs";

const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const home = readFileSync("packages/web/src/app/page.tsx", "utf8");
const dock = readFileSync("packages/web/src/components/UsageSignalDock.tsx", "utf8");
const css = readFileSync("packages/web/src/app/globals.css", "utf8");
const logo = readFileSync("packages/web/public/brand/vibeusage-logo.png");
const reliabilityBoundaries = [
  "packages/web/src/app/error.tsx",
  "packages/web/src/app/not-found.tsx",
  "packages/web/src/app/u/[handle]/loading.tsx",
  "packages/web/src/app/u/[handle]/not-found.tsx",
].map((file) => readFileSync(file, "utf8"));

test("root layout and home stay route-neutral while the legacy signal dock remains reusable", () => {
  assert.doesNotMatch(layout, /buildAppShellStatus/);
  assert.doesNotMatch(layout, /UsageSignalDock/);
  assert.doesNotMatch(layout, /app-shell-dock/);
  assert.match(layout, /<main className="wrap">\{children\}<\/main>/);

  assert.doesNotMatch(home, /UsageSignalDock|app-shell-dock/);
  assert.match(home, /<LeaderboardBoard filters=\{filters\} rows=\{rows\} \/>/);
});

test("root shell owns reliability styles without route-boundary preload duplication", () => {
  assert.match(layout, /import "\.\/reliability\.css"/);
  for (const boundary of reliabilityBoundaries) {
    assert.doesNotMatch(boundary, /reliability\.css/);
    assert.match(boundary, /className="vrel/);
  }
});

test("home signal dock preserves separated usage rails with compact diagnostics", () => {
  assert.match(dock, /buildAppShellStatus/);
  assert.match(dock, /aria-label="Five-channel usage signal monitor"/);
  assert.match(dock, /shellStatus\.spectrum\.rails\.map/);
  assert.match(dock, /rail\.bars\.map/);
  assert.match(dock, /hidden uploads: 0/);
  assert.match(dock, /className="usage-diagnostics"/);
  assert.doesNotMatch(dock, /shellStatus\.(signals|commands|beacons)\.map/);
  assert.doesNotMatch(dock, /app-shell-(commands|beacons|constellation|unite-relay)/);
});

test("home-owned dock escapes the route content width without affecting other pages", () => {
  assert.match(css, /\.wrap > \.app-shell-dock/);
  assert.match(css, /\.usage-diagnostics/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.usage-diagnostics/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.wrap > \.app-shell-dock/);
});

// The header used to open with "Verified" and "Self-reported" — two tier words for the same
// page — and never said the word Leaderboard, so the board had no name in the nav. Four
// destinations now carry the repeat workflows; the example profile remains in the product menu.
test("header names the leaderboard and explains every primary destination", () => {
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const primary = layout.slice(layout.indexOf('className="hdr-primary"'), layout.indexOf("hdr-actions"));

  assert.match(primary, /<a href="\/" title="[^"]+">Leaderboard<\/a>/);
  assert.ok(primary.indexOf("Leaderboard") < primary.indexOf("Compare"), "leaderboard leads the nav");
  assert.match(primary, />Compare</);
  assert.match(primary, />Sources</);
  assert.match(primary, />Insights</);
  assert.doesNotMatch(primary, />Profile</);
  assert.deepEqual(operatorRouteFor("/u/demo"), {
    index: "01",
    href: "/u/demo",
    label: "Profile",
    description: "usage, disciplines, models, rhythm",
    lane: "read",
  });

  // no unexplained item: every primary link says what it does on hover
  const links = primary.match(/<a href="[^"]+"[^>]*>/g) ?? [];
  assert.equal(links.length, 4, "exactly four primary destinations");
  for (const link of links) assert.match(link, /title="/, `unexplained nav item: ${link}`);

  // the two tier words are no longer top-level nav — they are the boards on the leaderboard page
  assert.doesNotMatch(primary, /Self-reported/);
});

test("header ships the generated VibeUsage mark without displacing identity controls", () => {
  assert.doesNotMatch(layout, /import Image from "next\/image"/);
  assert.match(layout, /className="brand" aria-label="VibeUsage home"/);
  assert.match(layout, /src="\/brand\/vibeusage-logo\.png"/);
  assert.match(layout, /<img[\s\S]*width="1400"[\s\S]*height="299"/);
  assert.match(layout, /<AccountControl \/>/);
  assert.match(css, /\.brand img \{[\s\S]*width: clamp\(160px, 14vw, 198px\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.hdr \.brand img \{ width: clamp\(148px, 45vw, 178px\)/);
  assert.match(css, /\.hdr-menu > nav \{[\s\S]*width: min\(420px, calc\(100% - 28px\)\)/);
  assert.doesNotMatch(css, /\.hdr-menu > nav \{[\s\S]*width: min\(420px, calc\(100vw - 28px\)\)/);
  assert.match(css, /\.hdr-menu:not\(\[open\]\) > nav \{ display: none; \}/);

  assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(logo.readUInt32BE(16), 1400);
  assert.equal(logo.readUInt32BE(20), 299);
  assert.equal(logo[25], 6, "logo stays RGBA so the header background remains visible");
  assert.ok(logo.byteLength < 300_000, "header asset stays below 300 KB");
});
