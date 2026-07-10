import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadReceiptVault,
  receiptVaultPayload,
  renderReceiptVault,
  renderReceiptVaultHtml,
} from "../receipt-vault.ts";
import { syncReceiptFingerprint, type SyncReceiptPayload } from "../sync-receipt.ts";

function syncReceipt(id: string, generatedAt: string, fresh: number, providerId = "higgsfield"): SyncReceiptPayload {
  const receipt = {
    schema: "vibetracker.sync-receipt/0.1",
    id,
    generatedAt,
    demo: id.includes("demo"),
    storePath: "/tmp/vibetracker/records.jsonl",
    safety: {
      providerCalls: true,
      usageWrites: true,
      uploads: false,
      secretsExported: false,
      promptsExported: false,
      outputsExported: false,
    },
    totals: {
      providers: 1,
      received: fresh + 2,
      accepted: fresh + 1,
      fresh,
      duplicate: 1,
      errors: id.includes("hold") ? 1 : 0,
      usdEst: fresh / 2,
    },
    providers: [
      {
        providerId,
        label: providerId === "codex-cli" ? "Codex CLI" : "Higgsfield",
        rail: providerId === "codex-cli" ? "not_usage" : "usage",
        status: id.includes("hold") ? "error" : "new",
        received: fresh + 2,
        accepted: fresh + 1,
        fresh,
        duplicate: 1,
        usdEst: fresh / 2,
        sourceMix: [{ source: "ledger", count: fresh }],
      },
    ],
  } satisfies Omit<SyncReceiptPayload, "fingerprint">;
  return { ...receipt, fingerprint: syncReceiptFingerprint(receipt) };
}

function writeReceipt(root: string, folder: string, receipt: SyncReceiptPayload): string {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "sync-receipt.json");
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
  return path;
}

function run(args: string[]) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("receipt vault loads nested receipts, sorts newest first, and reports skipped files", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  writeReceipt(root, "old", syncReceipt("sync-old", "2026-07-05T00:00:00.000Z", 4));
  writeReceipt(root, "new", syncReceipt("sync-new", "2026-07-06T00:00:00.000Z", 9, "codex-cli"));
  const badDir = join(root, "bad");
  mkdirSync(badDir, { recursive: true });
  writeFileSync(join(badDir, "sync-receipt.json"), "{not json");

  const load = loadReceiptVault(root);

  assert.deepEqual(load.entries.map((entry) => entry.receipt.id), ["sync-new", "sync-old"]);
  assert.deepEqual(load.entries.map((entry) => entry.fingerprintStatus), ["verified", "verified"]);
  assert.equal(load.skipped.length, 1);
  assert.match(load.skipped[0].error, /JSON|Expected|Unexpected/i);
});

test("receipt vault normalizes legacy receipts and rejects tampered fingerprints", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  const legacyDir = join(root, "legacy");
  mkdirSync(legacyDir, { recursive: true });
  const legacyReceipt = { ...syncReceipt("sync-legacy", "2026-07-06T00:00:00.000Z", 6) } as Partial<SyncReceiptPayload>;
  delete legacyReceipt.fingerprint;
  writeFileSync(join(legacyDir, "sync-receipt.json"), `${JSON.stringify(legacyReceipt, null, 2)}\n`);

  const tamperedDir = join(root, "tampered");
  mkdirSync(tamperedDir, { recursive: true });
  const tampered = syncReceipt("sync-tampered", "2026-07-06T01:00:00.000Z", 8);
  tampered.fingerprint.value = "0000000000000000000000000000000000000000000000000000000000000000";
  writeFileSync(join(tamperedDir, "sync-receipt.json"), `${JSON.stringify(tampered, null, 2)}\n`);

  const load = loadReceiptVault(root);

  assert.deepEqual(load.entries.map((entry) => entry.receipt.id), ["sync-legacy"]);
  assert.equal(load.entries[0].fingerprintStatus, "normalized");
  assert.match(load.entries[0].receipt.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.equal(load.skipped.length, 1);
  assert.match(load.skipped[0].error, /not a VibeTRACKER sync receipt/);
});

test("receipt vault payload is read-only and aggregates receipt totals", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  writeReceipt(root, "a", syncReceipt("sync-a", "2026-07-06T00:00:00.000Z", 6));
  writeReceipt(root, "b", syncReceipt("sync-b", "2026-07-06T01:00:00.000Z", 3, "codex-cli"));

  const payload = receiptVaultPayload(loadReceiptVault(root), "2026-07-06T02:00:00.000Z");

  assert.equal(payload.schema, "vibetracker.receipt-vault/0.1");
  assert.equal(payload.safety.receiptFileReads, true);
  assert.equal(payload.safety.providerCalls, false);
  assert.equal(payload.safety.usageWrites, false);
  assert.equal(payload.safety.uploads, false);
  assert.equal(payload.safety.secretsRead, false);
  assert.equal(payload.totals.receipts, 2);
  assert.equal(payload.totals.providers, 2);
  assert.equal(payload.totals.fresh, 9);
  assert.equal(payload.totals.accepted, 11);
  assert.equal(payload.totals.duplicate, 2);
  assert.equal(payload.totals.usdEst, 4.5);
});

test("receipt vault renderers keep the terminal style and script-free GUI", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  writeReceipt(root, "a", syncReceipt("sync-demo-a", "2026-07-06T00:00:00.000Z", 6));
  const payload = receiptVaultPayload(loadReceiptVault(root), "2026-07-06T02:00:00.000Z");
  const text = renderReceiptVault(payload);
  const html = renderReceiptVaultHtml(payload);

  assert.match(text, /RECEIPT-VAULT/);
  assert.match(text, /provider calls no/);
  assert.match(text, /sha256 checked/);
  assert.match(text, /verified\s+[a-f0-9]{12}/);
  assert.match(text, /Vibers Unite/);
  assert.match(html, /VibeTRACKER Receipt Vault/);
  assert.match(html, /Receipt<br>Vault/);
  assert.match(html, /sync-demo-a/);
  assert.match(html, /VTK:\/\/VAULT-TIMELINE\/\/RECEIPT-FLIGHT-RECORDER\/\/READ-ONLY/);
  assert.match(html, /Vault Timeline/);
  assert.match(html, /VTK:\/\/VAULT-CUSTODY\/\/SHA256\/\/LOCAL-ONLY/);
  assert.match(html, /Custody Wall/);
  assert.match(html, /Every current receipt carries a deterministic SHA-256 seal/);
  assert.match(html, /verified/);
  assert.match(html, /sha256:[a-f0-9]{12}/);
  assert.match(html, /Receipts replay newest to oldest from local JSON only/);
  assert.match(html, /no provider calls, usage writes, uploads, prompt exports, output exports, or secret reads/);
  assert.match(html, /01 DEMO\s+verified\s+[a-f0-9]{12} fresh\s+6 accepted\s+7/);
  assert.match(html, /fresh 6 \/\/ accepted 7 \/\/ duplicate 1 \/\/ holds 0/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /\bInter\b/);
});

test("receipts command exposes JSON vault metadata", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  writeReceipt(root, "a", syncReceipt("sync-a", "2026-07-06T00:00:00.000Z", 6));
  const result = run(["receipts", "--dir", root, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema, "vibetracker.receipt-vault/0.1");
  assert.equal(payload.safety.providerCalls, false);
  assert.equal(payload.safety.usageWrites, false);
  assert.equal(payload.totals.receipts, 1);
});

test("receipt-vault command writes a script-free static index", () => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-vault-"));
  const out = join(root, "index.html");
  writeReceipt(root, "a", syncReceipt("sync-a", "2026-07-06T00:00:00.000Z", 6));
  const result = run(["receipt-vault", "--dir", root, "--html", "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /receipt vault/);
  assert.match(result.stdout, /no provider calls/);
  assert.equal(existsSync(out), true);
  const html = readFileSync(out, "utf8");
  assert.match(html, /VibeTRACKER Receipt Vault/);
  assert.match(html, /Vault Timeline/);
  assert.match(html, /RECEIPT-FLIGHT-RECORDER/);
  assert.match(html, /Custody Wall/);
  assert.match(html, /VAULT-CUSTODY/);
  assert.doesNotMatch(html, /<script/i);
});
