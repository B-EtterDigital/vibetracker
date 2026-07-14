import assert from "node:assert/strict";
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ccusageToCodingTelemetry, collectCodingTelemetry } from "../coding-telemetry.ts";
import { findCcJson } from "../import-ccusage.ts";

test("ccusage snapshot -> measured tokens and honest agent-presence aggregates", () => {
  const daily = [
    { modelBreakdowns: [{ modelName: "gpt-5.5", inputTokens: 1e6, outputTokens: 1e5, cacheReadTokens: 8e6, cacheCreationTokens: 5e5 }],
      metadata: { agents: ["codex", "claude", "codex"] } },
    { modelBreakdowns: [{ modelName: "claude-opus-4-8", inputTokens: 5e5, outputTokens: 5e4, cacheReadTokens: 4e6, cacheCreationTokens: 2e5 }],
      metadata: { agents: ["claude"] } },
  ];
  const t = ccusageToCodingTelemetry(daily)!;
  assert.ok(t, "telemetry produced");
  // token totals are summed from real per-model tokens (measured)
  assert.equal(t.tokenBreakdown.total.cacheRead, 12e6);
  assert.equal(t.tokenBreakdown.total.input, 1.5e6);
  // per-provider split maps models to codex/claude
  assert.ok(t.tokenBreakdown.byProvider.some((p) => p.provider === "codex"));
  assert.ok(t.tokenBreakdown.byProvider.some((p) => p.provider === "claude-code"));
  // Agent names are measured presence only; cc.json does not attribute their cost or tokens.
  const codex = t.agents.agents.find((a) => a.agent === "codex")!;
  const claude = t.agents.agents.find((a) => a.agent === "claude")!;
  assert.equal(codex.activeDays, 1);
  assert.equal(claude.activeDays, 2);
  assert.equal(codex.cost, 0);
  assert.equal(codex.tokens, 0);
  // Cross-provider days come from model providers, not the number of agent names.
  assert.equal(t.agents.crossProviderDays, 0);
});

test("cross-provider days require multiple measured model providers on the same day", () => {
  const t = ccusageToCodingTelemetry([{
    modelBreakdowns: [
      { modelName: "gpt-5.5", inputTokens: 10 },
      { modelName: "claude-opus-4-8", outputTokens: 5 },
    ],
    metadata: { agents: ["codex"] },
  }])!;
  assert.equal(t.agents.crossProviderDays, 1);
});

test("empty ccusage input yields null (no fabricated aggregates)", () => {
  assert.equal(ccusageToCodingTelemetry([]), null);
});

test("findCcJson selects the newest existing snapshot", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-ccusage-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const older = join(dir, "older.json");
  const newer = join(dir, "newer.json");
  writeFileSync(older, "{}");
  writeFileSync(newer, "{}");
  utimesSync(older, new Date(1_700_000_000_000), new Date(1_700_000_000_000));
  utimesSync(newer, new Date(1_800_000_000_000), new Date(1_800_000_000_000));
  assert.equal(findCcJson([older, newer]), newer);
});

test("collector reports malformed snapshots through VTRS", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-ccusage-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "cc.json");
  writeFileSync(path, "{not-json");
  const errors: Array<{ err: unknown; context: Record<string, unknown> }> = [];
  const result = collectCodingTelemetry({
    path,
    telemetry: {
      captureError(err, context) { errors.push({ err, context }); },
      addBreadcrumb() {},
    },
  });
  assert.equal(result, null);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].context.area, "cli.coding-telemetry.snapshot");
  assert.equal(errors[0].context.severity, "warn");
  assert.equal(errors[0].context.file, "cc.json");
});
