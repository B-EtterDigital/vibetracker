// Rejection-path proof for the home leaderboard route (codex CHANGES_REQUESTED, finding 1).
// The board is OPTIONAL data: when fetchLeaderboard rejects, the route must not crash — it renders
// the existing empty-board state and breadcrumbs the failure via the optional-fallback pattern.
//
// The route is a real server component built from JSX, so we render it. `node --test` strips types
// but does not transform JSX, so page.tsx and its rendered children are transpiled through the
// `typescript` package (jsx: ReactJSX) and evaluated with a tiny recursive module loader. Only the
// leaderboard data layer and the telemetry sink are stubbed; the board component, its params, and
// the contract are the real modules so the empty state we assert is the one users actually see.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRequire = createRequire(import.meta.url);
const ts = projectRequire("typescript");
const renderToStaticMarkup = projectRequire("react-dom/server").renderToStaticMarkup as (node: unknown) => string;

const WEB_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const PAGE = resolve(WEB_ROOT, "src/app/page.tsx");

function resolveTs(fromDir: string, id: string): string {
  const base = resolve(fromDir, id);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts"), resolve(base, "index.tsx")];
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;
  throw new Error(`cannot resolve ${id} from ${fromDir}`);
}

// Transpile-and-run loader: real project files are compiled on demand and cached; requested import
// strings in `stubs` short-circuit to a stub; `.css` side-effect imports resolve to nothing.
function makeLoader(stubs: Record<string, unknown>) {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const load = (absPath: string): Record<string, unknown> => {
    const cached = cache.get(absPath);
    if (cached) return cached.exports;
    const output = ts.transpileModule(readFileSync(absPath, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const mod = { exports: {} as Record<string, unknown> };
    cache.set(absPath, mod);
    const dir = dirname(absPath);
    const req = (id: string): unknown => {
      if (Object.prototype.hasOwnProperty.call(stubs, id)) return stubs[id];
      if (id.endsWith(".css")) return {};
      if (id.startsWith(".")) return load(resolveTs(dir, id));
      return projectRequire(id);
    };
    new Function("require", "exports", "module", output)(req, mod.exports, mod);
    return mod.exports;
  };
  return load;
}

function spyTelemetry() {
  const breadcrumbs: Array<{ event: string; data: Record<string, unknown>; level: unknown }> = [];
  return {
    breadcrumbs,
    telemetry: {
      captureError() {},
      addBreadcrumb(event: string, data: Record<string, unknown>, level: unknown) {
        breadcrumbs.push({ event, data, level });
      },
    },
  };
}

test("home route renders the empty board (not a crash) and breadcrumbs when fetchLeaderboard rejects", async () => {
  const spy = spyTelemetry();
  const load = makeLoader({
    "../lib/leaderboard-data": {
      fetchLeaderboard: () => Promise.reject(Object.assign(new Error("board offline"), { code: "PGRST500" })),
    },
    "../../../core/src/telemetry": { createConsoleTelemetry: () => spy.telemetry },
  });
  const Home = load(PAGE).default as (props: { searchParams: Promise<Record<string, string>> }) => Promise<unknown>;

  const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({}) }));

  // The route survived and rendered the real, existing empty-board state.
  assert.match(html, /class="vlb-empty"/);
  assert.match(html, /no vibers on this board yet/);
  // The failure was surfaced through the optional-fallback breadcrumb, never silently swallowed.
  assert.equal(spy.breadcrumbs.length, 1);
  assert.equal(spy.breadcrumbs[0].event, "home.leaderboard.fallback");
  assert.equal(spy.breadcrumbs[0].level, "warn");
  assert.equal(spy.breadcrumbs[0].data.area, "web.home.optional-data");
});

test("home route still renders real rows and raises no fallback when fetchLeaderboard resolves", async () => {
  const spy = spyTelemetry();
  const load = makeLoader({
    "../lib/leaderboard-data": {
      fetchLeaderboard: async () => [
        { rank: 1, handle: "ada", displayName: "Ada", country: null, totalUsd: 100, totalOps: 5, topCategory: null, activeDays: 0, modelCount: 0, attested: true },
      ],
    },
    "../../../core/src/telemetry": { createConsoleTelemetry: () => spy.telemetry },
  });
  const Home = load(PAGE).default as (props: { searchParams: Promise<Record<string, string>> }) => Promise<unknown>;

  const html = renderToStaticMarkup(await Home({ searchParams: Promise.resolve({}) }));

  assert.match(html, /href="\/u\/ada"/);
  assert.doesNotMatch(html, /no vibers on this board yet/);
  assert.equal(spy.breadcrumbs.length, 0);
});
