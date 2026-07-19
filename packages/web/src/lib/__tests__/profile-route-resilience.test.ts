// Rejection-path proof for the profile route's category rankings (codex CHANGES_REQUESTED, finding 2).
// Category placements are OPTIONAL data: when fetchCategoryRanks rejects, the profile must still
// succeed — loadCategoryRanks degrades to [] (so the `if (categoryRanks.length)` guard adds no
// ProfileRankings panel) and breadcrumbs the failure via the optional-fallback pattern.
//
// The profile route pulls in ~40 modules, none of which loadCategoryRanks needs. So page.tsx is
// transpiled and evaluated with a callable stub for every heavy import (they only have to survive
// module-eval, e.g. the top-level cache(...) call); only the telemetry sink is real, so we can
// observe the breadcrumb. loadCategoryRanks is exercised directly through its injected-fetch seam.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRequire = createRequire(import.meta.url);
const ts = projectRequire("typescript");

const WEB_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const PAGE = resolve(WEB_ROOT, "src/app/u/[handle]/page.tsx");
const pageSource = readFileSync(PAGE, "utf8");

// A callable, property-accessible stand-in for every heavy import the seam does not use.
function anyStub(): object {
  const proxy: object = new Proxy(function () { return proxy; }, {
    get: (_target, prop) => (prop === "then" ? undefined : proxy),
    apply: () => proxy,
    construct: () => proxy,
  });
  return proxy;
}

function loadProfilePage(telemetry: unknown): Record<string, unknown> {
  const output = ts.transpileModule(pageSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stub = anyStub();
  const req = (id: string): unknown =>
    id === "../../../../../core/src/telemetry" ? { createConsoleTelemetry: () => telemetry } : stub;
  new Function("require", "exports", "module", output)(req, loaded.exports, loaded);
  return loaded.exports;
}

test("loadCategoryRanks degrades a rejecting fetch to [] and breadcrumbs the fallback (profile survives)", async () => {
  const breadcrumbs: Array<{ event: string; data: Record<string, unknown>; level: unknown }> = [];
  const telemetry = {
    captureError() {},
    addBreadcrumb(event: string, data: Record<string, unknown>, level: unknown) {
      breadcrumbs.push({ event, data, level });
    },
  };
  const loadCategoryRanks = loadProfilePage(telemetry).loadCategoryRanks as (
    handle: string,
    fetchRanks: (handle: string) => Promise<unknown[]>,
  ) => Promise<unknown[]>;

  const ranks = await loadCategoryRanks("cyrill-etter", () =>
    Promise.reject(Object.assign(new Error("ranks offline"), { code: "PGRST500" })));

  // Independent failure → empty rankings; the render guard then adds no ProfileRankings panel.
  assert.deepEqual(ranks, []);
  assert.equal(breadcrumbs.length, 1);
  assert.equal(breadcrumbs[0].event, "profile.rankings.fallback");
  assert.equal(breadcrumbs[0].level, "warn");
  assert.equal(breadcrumbs[0].data.area, "web.profile.optional-data");
  assert.equal(breadcrumbs[0].data.message, "ranks offline");

  // A resolving fetch is passed straight through — resilience never masks real placements.
  const ok = await loadCategoryRanks("cyrill-etter", async () => [{ category: "coding", rank: 1, of: 9, usd: 100, ops: 5 }]);
  assert.equal(ok.length, 1);
  assert.equal(breadcrumbs.length, 1);
});

test("profile route consumes ranks through the injected seam and only renders the panel when non-empty", () => {
  assert.match(pageSource, /export const loadCategoryRanks = /);
  assert.match(pageSource, /const categoryRanks = isDemo \? \[\] : await loadCategoryRanks\(profile\.handle, fetchCategoryRanks\)/);
  assert.match(pageSource, /if \(categoryRanks\.length\) add\("hero", "full", <ProfileRankings ranks=\{categoryRanks\} key="rankings" \/>\)/);
});
