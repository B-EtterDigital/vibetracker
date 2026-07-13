import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";
import { resolveMissionCommand } from "../mission/mission-command.ts";
import { buildMissionControl, renderMissionControl } from "../mission/mission-control.ts";
import { renderMissionHtml } from "../mission/mission-html.ts";

const record = (overrides: Partial<NormalizedRecord>): NormalizedRecord => ({
  ts: "2026-07-12T12:00:00Z",
  provider: "openai",
  category: "llm",
  operation: "chat",
  quantity: 100,
  unit: "request",
  rawAmount: 1_000,
  rawUnit: "tokens",
  usdEst: 14,
  source: "ledger",
  confidence: "high",
  verified: true,
  ...overrides,
});

const records: NormalizedRecord[] = [
  record({}),
  record({
    ts: "2026-07-10T12:00:00Z",
    provider: "ollama",
    source: "local",
    quantity: 60,
    rawAmount: 60,
    rawUnit: "requests",
    usdEst: 6,
    verified: false,
  }),
  record({
    ts: "2026-07-05T12:00:00Z",
    provider: "runway",
    category: "video",
    operation: "generate",
    quantity: 2,
    unit: "clip",
    rawAmount: 20,
    rawUnit: "credits",
    usdEst: 70,
    source: "feed_recon",
    confidence: "medium",
    verified: false,
  }),
  record({
    ts: "2026-06-01T12:00:00Z",
    provider: "midjourney",
    category: "image",
    operation: "<unsafe>",
    quantity: 1,
    unit: "image",
    rawAmount: 5,
    rawUnit: "credits",
    usdEst: 5,
    source: "manual",
    confidence: "low",
    verified: false,
  }),
];

const githubTrust: TrustSignal = {
  kind: "github_activity",
  source: "github_cli",
  label: "GitHub activity evidence (not AI usage)",
  handle: "viber",
  fetchedAt: "2026-07-13T12:00:00Z",
  from: "2025-07-13T12:00:00Z",
  to: "2026-07-13T12:00:00Z",
  windowDays: 365,
  totalContributions: 1234,
  commitContributions: 1000,
  issueContributions: 30,
  pullRequestContributions: 100,
  pullRequestReviewContributions: 100,
  repositoryContributions: 4,
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

function mission() {
  return buildMissionControl({
    records,
    trustSignals: [githubTrust],
    generatedAt: "2026-07-13T12:00:00Z",
    budgetUsd: 50,
  });
}

test("buildMissionControl derives current windows, proof, burn, and actions from real records", () => {
  const result = mission();

  assert.equal(result.schema, "vibetracker.mission-control/1.0");
  assert.equal(result.overview.records, 4);
  assert.equal(result.overview.ops, 163);
  assert.equal(result.overview.usdEst, 95);
  assert.equal(result.overview.credits, 25);
  assert.equal(result.windows.last7d.ops, 160);
  assert.equal(result.windows.last7d.usdEst, 20);
  assert.equal(result.windows.last30d.usdEst, 90);
  assert.equal(result.forecast.dailyAvgUsdEst, 2.86);
  assert.equal(result.forecast.projected30dUsdEst, 85.8);
  assert.equal(result.forecast.budgetStatus, "over");
  assert.equal(result.proof.verifiedSharePct, 25);
  assert.deepEqual(result.proof.freshness, { fresh: 2, warm: 1, stale: 1 });
  assert.deepEqual(result.proof.staleProviders, ["midjourney"]);
  assert.equal(result.localAi.ops, 60);
  assert.equal(result.localAi.hostedEquivalentUsdEst, 6);
  assert.equal(result.trust.affectsUsage, false);
  assert.equal(result.trust.usageVerified, false);
  assert.deepEqual(result.actions.map((action) => action.command), [
    "vibetracker insights --budget 50",
    "vibetracker sync",
    "vibetracker audit",
  ]);
});

test("terminal mission control labels estimates, privacy, proof, and trust separation", () => {
  const output = renderMissionControl(mission());

  assert.match(output, /VTK:\/\/MISSION-CONTROL\/\/LOCAL-LEDGER\/\/READ-ONLY/);
  assert.match(output, /163 ops\s+4 records\s+4 providers/);
  assert.match(output, /projected 30d \$85\.80~/);
  assert.match(output, /budget gate OVER - \$85\.80~ projected \/ \$50\.00 cap/);
  assert.match(output, /Provider ledger/);
  assert.match(output, /github_activity: @viber .* NOT USAGE/);
  assert.match(output, /PRIVACY: excludes prompts, outputs, secrets, media/);
  assert.match(output, /USAGE: read-only\. WRITES: 0\. UPLOADS: 0/);
  assert.equal(Math.max(...output.split("\n").map((row) => row.length)), 78);
});

test("HTML mission control is responsive, escaped, static, and script-free", () => {
  const html = renderMissionHtml(mission());

  assert.match(html, /VibeTRACKER Mission Control/);
  assert.match(html, /VTK:\/\/MISSION-CONTROL\/\/LOCAL-LEDGER/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /@media\(min-width:2200px\)/);
  assert.match(html, /SEPARATE · NOT USAGE/);
  assert.match(html, /Usage read only · writes 0 · uploads 0/);
  assert.match(html, /&lt;unsafe&gt;/);
  assert.doesNotMatch(html, /<unsafe>/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /src=["']https?:/i);
  assert.doesNotMatch(html, /linear-gradient/i);
});

test("resolveMissionCommand supports terminal, JSON, HTML, open, and validation", () => {
  const base = { argv: ["mission"], records, trustSignals: [githubTrust], defaultHtmlPath: "/tmp/mission.html", generatedAt: "2026-07-13T12:00:00Z" };
  const terminal = resolveMissionCommand(base);
  const json = resolveMissionCommand({ ...base, argv: ["mission", "--json"] });
  const html = resolveMissionCommand({ ...base, argv: ["pulse", "--open", "--out", "/tmp/pulse.html"] });

  assert.equal(terminal.kind, "stdout");
  assert.equal(terminal.kind === "stdout" && terminal.format, "terminal");
  assert.equal(json.kind, "stdout");
  assert.equal(json.kind === "stdout" && JSON.parse(json.text).overview.ops, 163);
  assert.equal(html.kind, "html");
  assert.equal(html.kind === "html" && html.path, "/tmp/pulse.html");
  assert.equal(html.kind === "html" && html.open, true);
  assert.throws(() => resolveMissionCommand({ ...base, argv: ["now", "--budget", "zero"] }), /positive number/);
  assert.throws(() => resolveMissionCommand({ ...base, argv: ["mission", "--json", "--html"] }), /either --json or --html/);
});

test("empty mission control gives real-source recovery without synthetic usage", () => {
  const result = buildMissionControl({ records: [], generatedAt: "2026-07-13T12:00:00Z" });

  assert.equal(result.overview.ops, 0);
  assert.equal(result.forecast.projected30dUsdEst, 0);
  assert.deepEqual(result.actions.map((action) => action.command), [
    "vibetracker init --gui",
    "vibetracker doctor",
    "vibetracker detect",
  ]);
  assert.doesNotMatch(renderMissionControl(result), /sync --demo/);
});

test("CLI mission aliases route JSON and static HTML without a configured ledger", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-mission-home-"));
  const jsonResult = spawnSync(process.execPath, ["bin/vibetracker.mjs", "now", "--json", "--no-trust"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, HOME: home, VT_NO_ANIM: "1", VT_NO_SURPRISES: "1" },
  });
  const out = join(home, "mission.html");
  const htmlResult = spawnSync(process.execPath, ["bin/vibetracker.mjs", "pulse", "--html", "--out", out, "--no-trust"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, HOME: home, VT_NO_ANIM: "1", VT_NO_SURPRISES: "1" },
  });

  assert.equal(jsonResult.status, 0, jsonResult.stderr);
  assert.equal(JSON.parse(jsonResult.stdout).overview.ops, 0);
  assert.equal(htmlResult.status, 0, htmlResult.stderr);
  assert.match(htmlResult.stdout, /mission control/);
  const html = readFileSync(out, "utf8");
  assert.match(html, /No trust context discovered/);
  assert.doesNotMatch(html, /<script/i);
});
