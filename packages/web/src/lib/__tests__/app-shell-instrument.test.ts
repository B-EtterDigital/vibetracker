import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const dock = readFileSync("packages/web/src/components/UsageSignalDock.tsx", "utf8");
const css = readFileSync("packages/web/src/app/globals.css", "utf8");

test("home signal dock opens with a readable usage instrument before advanced telemetry", () => {
  const instrument = dock.indexOf('className="usage-instrument"');
  const diagnostics = dock.indexOf('className="app-shell-diagnostics"');

  assert.ok(instrument >= 0, "usage instrument should render");
  assert.ok(diagnostics > instrument, "advanced telemetry should follow the default instrument");
  assert.match(dock, /Your AI life\./);
  assert.match(dock, /One honest ledger\./);
  assert.match(dock, /aria-label="Five-channel usage signal monitor"/);
  assert.match(dock, /shellStatus\.spectrum\.rails\.map/);
  assert.match(dock, /rail\.bars\.map/);
  assert.match(dock, /hidden uploads: 0/);
  assert.match(dock, /preview only \/\/ 0 writes/);
});

test("global navigation keeps primary actions visible and secondary routes in a menu", () => {
  assert.match(layout, /className="hdr-primary" aria-label="Primary navigation"/);
  assert.match(layout, /className="hdr-cli" href="\/how-to"/);
  assert.match(layout, /<details className="hdr-menu">/);
  assert.match(layout, /aria-label="Open product menu"/);

  for (const route of ["sources", "scan", "proof", "score", "wizard", "motion", "contributors", "passkeys", "roadmap"]) {
    assert.match(layout, new RegExp(`href="/${route}"`));
  }
});

test("instrument CSS preserves desktop hierarchy, mobile fit, focus, and reduced motion", () => {
  assert.match(css, /\.usage-instrument\s*\{/);
  assert.match(css, /\.usage-instrument__channels/);
  assert.match(css, /\.usage-channel__wave/);
  assert.match(css, /\.hdr-menu > summary:focus-visible/);
  assert.match(css, /\.usage-instrument__actions a:hover,[\s\S]*:focus-visible/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.usage-instrument \{ grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.usage-channel/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.usage-channel__wave i/);
});
