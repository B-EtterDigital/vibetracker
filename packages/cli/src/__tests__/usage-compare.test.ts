import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { resolveUsageCompareCommand } from "../compare/usage-compare-command.ts";
import { renderUsageComparisonHtml } from "../compare/usage-compare-html.ts";
import { buildUsageComparison, renderUsageComparison } from "../compare/usage-compare.ts";

const record = (overrides: Partial<NormalizedRecord>): NormalizedRecord => ({
  ts: "2026-07-14T12:00:00Z",
  provider: "openai",
  category: "llm",
  operation: "chat",
  quantity: 10,
  unit: "request",
  rawAmount: 100,
  rawUnit: "tokens",
  usdEst: 20,
  source: "ledger",
  confidence: "high",
  verified: true,
  ...overrides,
});

const records: NormalizedRecord[] = [
  record({}),
  record({ ts: "2026-07-12T12:00:00Z", quantity: 20, usdEst: 30, verified: false }),
  record({ ts: "2026-07-10T12:00:00Z", provider: "ollama", quantity: 40, usdEst: 0, source: "local", confidence: "medium", verified: false }),
  record({ ts: "2026-07-09T12:00:00Z", provider: "manual<unsafe>", category: "image", quantity: 2, rawAmount: 5, rawUnit: "credits", usdEst: 10, source: "manual", confidence: "low", verified: false }),
  record({ ts: "2026-07-07T12:00:00Z", quantity: 10, usdEst: 15 }),
  record({ ts: "2026-07-05T12:00:00Z", provider: "runway", category: "video", quantity: 2, rawAmount: 8, rawUnit: "credits", usdEst: 20, source: "feed_recon", confidence: "medium", verified: false }),
  record({ ts: "2026-07-02T12:00:00Z", provider: "openai", quantity: 10, usdEst: 15 }),
  record({ ts: "2026-06-20T12:00:00Z", provider: "ignored", quantity: 999, usdEst: 999 }),
];

function comparison() {
  return buildUsageComparison({ records, days: 7, asOf: "2026-07-15T00:00:00Z" });
}

test("buildUsageComparison compares adjacent windows without overlap", () => {
  const result = comparison();

  assert.equal(result.schema, "vibetracker.usage-compare/1.0");
  assert.deepEqual(result.current, { records: 4, ops: 72, credits: 5, usdEst: 60, providers: 3, categories: 2 });
  assert.deepEqual(result.previous, { records: 3, ops: 22, credits: 8, usdEst: 50, providers: 2, categories: 2 });
  assert.deepEqual(result.delta.usdEst, { amount: 10, pct: 20, state: "up" });
  assert.deepEqual(result.newProviders.sort(), ["manual<unsafe>", "ollama"]);
  assert.deepEqual(result.dormantProviders, ["runway"]);
  assert.equal(result.proof.verified.current.sharePct, 25);
  assert.equal(result.proof.lowProof.current.sharePct, 25);
  assert.equal(result.proof.lowProof.previous.sharePct, 33.3);
  assert.equal(result.privacy.usageWrites, 0);
  assert.equal(result.privacy.uploads, 0);
});

test("comparison emits proof and provider review actions from real shifts", () => {
  const result = comparison();

  assert.deepEqual(result.actions.map((action) => action.command), [
    "vibetracker audit",
    "vibetracker providers check",
    "vibetracker sync",
  ]);
  assert.equal(result.providers[0].key, "openai");
  assert.equal(result.providers.find((provider) => provider.key === "ollama")?.usdDelta.state, "flat");
  assert.equal(result.providers.find((provider) => provider.key === "runway")?.usdDelta.state, "dormant");
});

test("terminal comparison stays fixed-width and labels estimates and privacy", () => {
  const output = renderUsageComparison(comparison());

  assert.match(output, /VTK:\/\/USAGE-COMPARE\/\/LOCAL-LEDGER\/\/READ-ONLY/);
  assert.match(output, /USD ESTIMATE  \$60\.00~ vs \$50\.00~/);
  assert.match(output, /PROVIDER SHIFTS/);
  assert.match(output, /TRUST: separate NOT USAGE context/);
  assert.match(output, /USAGE WRITES: 0\. UPLOADS: 0/);
  assert.ok(Math.max(...output.split("\n").map((line) => line.length)) <= 78);
});

test("HTML comparison is responsive, escaped, static, and script-free", () => {
  const html = renderUsageComparisonHtml(comparison());

  assert.match(html, /VibeTRACKER Usage Compare/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /header\.hero\{grid-template-columns:1fr/);
  assert.match(html, /@media\(min-width:2200px\)/);
  assert.match(html, /manual&lt;unsafe&gt;/);
  assert.match(html, /<strong>manual&lt;unsafe&gt;<\/strong><span class="rise">NEW<\/span>/);
  assert.match(html, /<strong>runway<\/strong><span class="fall">DORMANT<\/span>/);
  assert.doesNotMatch(html, /manual<unsafe>/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /src=["']https?:/i);
  assert.doesNotMatch(html, /linear-gradient/i);
  assert.match(html, /USAGE READ ONLY<\/strong> · WRITES 0 · UPLOADS 0/);
});

test("command adapter supports aliases, deterministic JSON, HTML, and validation", () => {
  const base = { argv: ["compare", "--days", "7", "--as-of", "2026-07-15T00:00:00Z"], records, defaultHtmlPath: "/tmp/compare.html" };
  const terminal = resolveUsageCompareCommand(base);
  const json = resolveUsageCompareCommand({ ...base, argv: [...base.argv, "--json"] });
  const html = resolveUsageCompareCommand({ ...base, argv: ["delta", "--open", "--out", "/tmp/delta.html"], generatedAt: "2026-07-15T00:00:00Z" });

  assert.equal(terminal.kind, "stdout");
  assert.equal(terminal.kind === "stdout" && terminal.format, "terminal");
  assert.equal(json.kind, "stdout");
  assert.equal(json.kind === "stdout" && JSON.parse(json.text).delta.usdEst.pct, 20);
  assert.equal(html.kind, "html");
  assert.equal(html.kind === "html" && html.path, "/tmp/delta.html");
  assert.equal(html.kind === "html" && html.open, true);
  assert.throws(() => resolveUsageCompareCommand({ ...base, argv: ["trend", "--days", "0"] }), /integer from 1 to 365/);
  assert.throws(() => resolveUsageCompareCommand({ ...base, argv: ["compare", "--as-of", "never"] }), /valid ISO/);
  assert.throws(() => resolveUsageCompareCommand({ ...base, argv: ["compare", "--json", "--html"] }), /either --json or --html/);
});

test("empty comparison and CLI aliases never synthesize usage", () => {
  const empty = buildUsageComparison({ records: [], days: 30, asOf: "2026-07-15T00:00:00Z" });
  assert.equal(empty.current.ops, 0);
  assert.equal(empty.previous.ops, 0);
  assert.deepEqual(empty.actions.map((action) => action.command), ["vibetracker sync"]);

  const home = mkdtempSync(join(tmpdir(), "vibetracker-compare-home-"));
  const jsonResult = spawnSync(process.execPath, ["bin/vibetracker.mjs", "trend", "--json", "--days", "30", "--as-of", "2026-07-15T00:00:00Z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, HOME: home, VT_NO_ANIM: "1", VT_NO_SURPRISES: "1" },
  });
  const out = join(home, "compare.html");
  const htmlResult = spawnSync(process.execPath, ["bin/vibetracker.mjs", "delta", "--html", "--out", out, "--as-of", "2026-07-15T00:00:00Z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, HOME: home, VT_NO_ANIM: "1", VT_NO_SURPRISES: "1" },
  });
  assert.equal(jsonResult.status, 0, jsonResult.stderr);
  assert.equal(JSON.parse(jsonResult.stdout).current.ops, 0);
  assert.equal(htmlResult.status, 0, htmlResult.stderr);
  assert.match(htmlResult.stdout, /usage comparison/);
  assert.doesNotMatch(readFileSync(out, "utf8"), /<script/i);
});
