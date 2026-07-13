import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const home = readFileSync("packages/web/src/app/page.tsx", "utf8");
const dock = readFileSync("packages/web/src/components/UsageSignalDock.tsx", "utf8");
const css = readFileSync("packages/web/src/app/globals.css", "utf8");

test("root layout and home stay route-neutral while the legacy signal dock remains reusable", () => {
  assert.doesNotMatch(layout, /buildAppShellStatus/);
  assert.doesNotMatch(layout, /UsageSignalDock/);
  assert.doesNotMatch(layout, /app-shell-dock/);
  assert.match(layout, /<main className="wrap">\{children\}<\/main>/);

  assert.doesNotMatch(home, /UsageSignalDock|app-shell-dock/);
  assert.match(home, /<LeaderboardConsole boards=\{\[verified, selfReported\]\} \/>/);
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
// page — and never said the word Leaderboard, so the board (the second-most-important surface
// after a profile) had no name in the nav. Four destinations now, each carrying what it is.
test("header names the leaderboard and explains every primary destination", () => {
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const primary = layout.slice(layout.indexOf('className="hdr-primary"'), layout.indexOf("hdr-actions"));

  assert.match(primary, /<a href="\/" title="[^"]+">Leaderboard<\/a>/);
  assert.ok(primary.indexOf("Leaderboard") < primary.indexOf("Profile"), "leaderboard leads the nav");
  assert.match(primary, />Profile</);
  assert.match(primary, />Sources</);
  assert.match(primary, />Insights</);

  // no unexplained item: every primary link says what it does on hover
  const links = primary.match(/<a href="[^"]+"[^>]*>/g) ?? [];
  assert.equal(links.length, 4, "exactly four primary destinations");
  for (const link of links) assert.match(link, /title="/, `unexplained nav item: ${link}`);

  // the two tier words are no longer top-level nav — they are the boards on the leaderboard page
  assert.doesNotMatch(primary, /Self-reported/);
});
