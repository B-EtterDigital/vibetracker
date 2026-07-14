import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync("packages/web/src/app/life/page.tsx", "utf8");
const cockpit = readFileSync("packages/web/src/app/life/local-cockpit.tsx", "utf8");
const data = readFileSync("packages/web/src/app/life/local-cockpit-data.ts", "utf8");
const css = readFileSync("packages/web/src/app/life/life.css", "utf8");
const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

test("AI Life is a real consent-driven local usage cockpit", () => {
  assert.match(layout, /href="\/life"/);
  assert.match(page, /import \{ LocalCockpit \} from "\.\/local-cockpit"/);
  assert.match(page, /return <LocalCockpit \/>/);
  assert.match(cockpit, /^"use client"/);
  assert.match(cockpit, /Your AI spend\. Live from this machine\./);
  assert.match(cockpit, /npx vibetrack api serve --port 8765/);
  assert.match(cockpit, /SESSION TOKEN/);
  assert.match(cockpit, /CONNECT LOCAL/);
  assert.match(cockpit, /disabled=\{connection === "connecting" \|\| !token\.trim\(\)/);
  assert.match(cockpit, /LOCAL NETWORK PERMISSION REQUIRED/);
  assert.match(cockpit, /Allow Local Network Access for this site/);
  assert.match(cockpit, /TRACKED SPEND/);
  assert.match(cockpit, /30D FORECAST/);
  assert.match(cockpit, /LEDGER RHYTHM/);
  assert.match(cockpit, /SOURCE PRESSURE/);
  assert.match(cockpit, /DECISION TAPE/);
  assert.doesNotMatch(page, /href="\/u\/anonymous"/);
  assert.doesNotMatch(page, /Six rails, one tracker/);
});

test("local cockpit keeps the token and aggregate ledger on loopback", () => {
  assert.match(cockpit, /new URLSearchParams\(window\.location\.hash\.slice\(1\)\)/);
  assert.match(cockpit, /window\.history\.replaceState/);
  assert.match(cockpit, /http:\/\/127\.0\.0\.1:\$\{port\}\/stats/);
  assert.match(cockpit, /http:\/\/127\.0\.0\.1:\$\{port\}\/insights/);
  assert.match(cockpit, /authorization: `Bearer \$\{token\}`/);
  assert.match(cockpit, /name: "local-network-access" as PermissionName/);
  assert.match(cockpit, /cache: "no-store"/);
  assert.match(cockpit, /does not request \/records, store the session token, or upload your ledger/);
  assert.doesNotMatch(cockpit, /\/records[`"']/);
  assert.doesNotMatch(cockpit, /localStorage|sessionStorage/);
  assert.match(data, /parseLocalStats/);
  assert.match(data, /parseLocalInsights/);
  assert.match(data, /buildCockpitSnapshot/);
});

test("local cockpit layout is stable on desktop mobile and reduced motion", () => {
  assert.match(css, /width: min\(1320px, calc\(100% - 32px\)\)/);
  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns: repeat\(21, minmax\(3px, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(cockpit, /notation: "compact"/);
  assert.doesNotMatch(css, /font-size:\s*clamp\(/);
});
