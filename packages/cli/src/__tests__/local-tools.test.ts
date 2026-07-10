import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { captureEventToRecord } from "../api-server.ts";
import { providerCapabilityChecks } from "../capability-check.ts";
import { scanDesktopActivity, desktopActivitiesToRecords } from "../desktop-activity.ts";
import { redactFixture } from "../fixture.ts";
import { createRoiNote, loadRoiNotes, saveRoiNotes } from "../roi-notes.ts";
import { loadOrCreateSigningKey, signBundle, verifySignedBundle } from "../signing.ts";
import type { ProviderDescriptor } from "../../../adapters/src/registry.ts";

test("signing creates verifiable Ed25519 bundles", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-signing-"));
  try {
    const key = loadOrCreateSigningKey(join(dir, "key.json"), "2026-07-05T00:00:00Z");
    const signed = signBundle({ count: 1, records: [] }, key, "2026-07-05T00:00:00Z");
    assert.equal(verifySignedBundle(signed), true);
    assert.equal(verifySignedBundle({ ...signed, payload: { count: 2 } }), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fixture redaction writes redacted JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-fixture-"));
  try {
    const src = join(dir, "raw.json");
    const out = join(dir, "fixture.json");
    writeFileSync(src, JSON.stringify({ apiKey: "sk-testSECRET", usage: [{ amount: 1 }] }));
    const result = redactFixture(src, out);
    assert.equal(result.findings.length > 0, true);
    assert.match(readFileSync(out, "utf8"), /\[REDACTED/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ROI notes persist separately from usage records", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-roi-"));
  try {
    const path = join(dir, "roi.json");
    const note = createRoiNote({
      from: "2026-07-01",
      to: "2026-07-05",
      note: "Finished client video pack",
      valueUsd: 1200,
      tags: ["client"],
      createdAt: "2026-07-05T00:00:00Z",
    });
    saveRoiNotes(path, [note]);
    assert.equal(loadRoiNotes(path)[0].valueUsd, 1200);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("capability checks classify provider freshness actions", () => {
  const providers: ProviderDescriptor[] = [
    { id: "verified", label: "Verified", domain: "ai", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: true, method: "ok" },
    { id: "proxy", label: "Proxy", domain: "ai", categories: ["llm"], tier: "proxy", auth: "apiKey", status: "planned", verified: false, method: "proxy" },
  ];
  const checks = providerCapabilityChecks(providers);
  assert.equal(checks[0].state, "verified");
  assert.equal(checks[1].state, "proxy_ready");
});

test("desktop scan maps running AI processes to local activity records", () => {
  const activities = scanDesktopActivity("123 ollama serve\n456 /usr/bin/cursor --type=gpu\n");
  assert.equal(activities.length, 2);
  const records = desktopActivitiesToRecords(activities, "2026-07-05T00:00:00Z");
  assert.equal(records[0].source, "local");
  assert.equal(records[1].category, "coding");
});

test("desktop scan does not treat .codex paths as a Codex CLI process", () => {
  const activities = scanDesktopActivity("123 /tmp/.codex/extension-host chrome-extension://id\n456 /usr/bin/codex exec\n");
  assert.equal(activities.filter((activity) => activity.provider === "codex-cli").length, 1);
});

test("browser capture event becomes a low-confidence local record", () => {
  const record = captureEventToRecord({ url: "https://chatgpt.com/c/abc", title: "ChatGPT" });
  assert.equal(record.provider, "openai-web");
  assert.equal(record.operation, "browser_capture");
  assert.equal(record.confidence, "low");
  assert.equal(record.verified, false);
});
