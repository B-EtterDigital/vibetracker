import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const home = readFileSync("packages/web/src/app/page.tsx", "utf8");
const dock = readFileSync("packages/web/src/components/UsageSignalDock.tsx", "utf8");
const css = readFileSync("packages/web/src/app/globals.css", "utf8");

test("root layout stays route-neutral while home owns the usage signal dock", () => {
  assert.doesNotMatch(layout, /buildAppShellStatus/);
  assert.doesNotMatch(layout, /UsageSignalDock/);
  assert.doesNotMatch(layout, /app-shell-dock/);
  assert.match(layout, /<main className="wrap">\{children\}<\/main>/);

  assert.match(home, /import \{ UsageSignalDock \}/);
  assert.match(home, /<UsageSignalDock \/>/);
  assert.ok(home.indexOf("<UsageSignalDock />") < home.indexOf('<section className="hero">'));
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
