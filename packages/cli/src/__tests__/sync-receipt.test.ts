import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSyncReceiptFiles, renderSyncReceiptHtml, syncReceiptPayload, type SyncReceiptInput } from "../sync-receipt.ts";

function fixture(): SyncReceiptInput {
  return {
    id: "sync-2026-07-06T00-00-00-000Z",
    generatedAt: "2026-07-06T00:00:00.000Z",
    storePath: "/tmp/vibetracker/records.jsonl",
    providerIds: ["higgsfield", "codex-cli", "ollama"],
    demo: true,
    checkpoints: [
      {
        providerId: "higgsfield",
        label: "Higgsfield",
        status: "new",
        received: 12,
        accepted: 10,
        fresh: 8,
        duplicate: 2,
        usd: 4.2,
        sourceMix: [
          { source: "ledger", count: 6 },
          { source: "feed_recon", count: 2 },
        ],
        hint: "validated records appended to the local ledger",
      },
      {
        providerId: "codex-cli",
        label: "Codex CLI",
        status: "up_to_date",
        received: 3,
        accepted: 3,
        fresh: 0,
        duplicate: 3,
        sourceMix: [{ source: "log", count: 3 }],
        hint: "trust/build context stays labelled",
      },
      {
        providerId: "ollama",
        label: "Ollama",
        status: "error",
        received: 0,
        accepted: 0,
        fresh: 0,
        duplicate: 0,
        error: "not running / unreachable",
        hint: "fix: vibetracker detect",
      },
    ],
  };
}

function run(args: string[], home: string) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, HOME: home, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("sync receipt payload summarizes collection without upload claims", () => {
  const payload = syncReceiptPayload(fixture());

  assert.equal(payload.schema, "vibetracker.sync-receipt/0.1");
  assert.equal(payload.demo, true);
  assert.equal(payload.fingerprint.algorithm, "sha256");
  assert.equal(payload.fingerprint.basis, "canonical-payload-without-fingerprint");
  assert.match(payload.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.equal(syncReceiptPayload(fixture()).fingerprint.value, payload.fingerprint.value);
  assert.equal(payload.safety.providerCalls, true);
  assert.equal(payload.safety.usageWrites, true);
  assert.equal(payload.safety.uploads, false);
  assert.equal(payload.safety.secretsExported, false);
  assert.equal(payload.safety.promptsExported, false);
  assert.equal(payload.safety.outputsExported, false);
  assert.deepEqual(payload.totals, {
    providers: 3,
    received: 15,
    accepted: 13,
    fresh: 8,
    duplicate: 5,
    errors: 1,
    usdEst: 4.2,
  });
  assert.deepEqual(payload.providers.map((provider) => provider.rail), ["usage", "not_usage", "hold"]);
});

test("sync receipt html is static, branded, and explicit about local writes", () => {
  const html = renderSyncReceiptHtml(fixture());
  const payload = syncReceiptPayload(fixture());

  assert.match(html, /VibeTRACKER Sync Receipt/);
  assert.match(html, /VTK:\/\/SYNC-RECEIPT\/\/BLACK-BOX\/\/LOCAL-FIRST/);
  assert.match(html, /Vibers Unite/);
  assert.match(html, /Provider calls and local usage writes happened/);
  assert.match(html, /uploads no/);
  assert.match(html, /prompts no/);
  assert.match(html, /VTK:\/\/RECEIPT-REPLAY\/\/SOURCE-TO-LEDGER\/\/NO-SECRETS/);
  assert.match(html, /Black Box Replay/);
  assert.match(html, /Provider calls, validation, local ledger writes, and no-upload boundaries/);
  assert.match(html, /01 call/);
  assert.match(html, /02 verify/);
  assert.match(html, /03 ledger/);
  assert.match(html, /04 upload/);
  assert.match(html, /VTK:\/\/RECEIPT-DATASTREAM\/\/SOURCE-TO-SCORE\/\/NO-TRUST-SPEND/);
  assert.match(html, /Source To Ledger Chain/);
  assert.match(html, /Accepted usage rows can feed the score, profile, heatgrid, and public relay after review/);
  assert.match(html, /score\/profile\s+usage rows only after approved upload/);
  assert.match(html, /trust signals\s+visible side rail, not spend/);
  assert.match(html, /excluded from usage score/);
  assert.match(html, /held before ledger/);
  assert.match(html, /VTK:\/\/RECEIPT-SEAL\/\/SHA256\/\/LOCAL-PROOF/);
  assert.match(html, /Receipt Fingerprint/);
  assert.match(html, /canonical local receipt JSON/);
  assert.match(html, /public relay waits for upload review/);
  assert.match(html, new RegExp(payload.fingerprint.value.slice(0, 8)));
  assert.match(html, /ledger:6 \/ feed_recon:2/);
  assert.match(html, /hold:not running \/ unreachable/);
  assert.match(html, /Higgsfield/);
  assert.match(html, /Codex CLI/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /\bInter\b/);
});

test("sync receipt files include html and machine-readable json", () => {
  const files = buildSyncReceiptFiles(fixture());

  assert.deepEqual(files.map((file) => file.path), ["sync-receipt.html", "sync-receipt.json"]);
  assert.doesNotMatch(files[0].content, /<script/i);
  const payload = JSON.parse(files[1].content);
  assert.equal(payload.schema, "vibetracker.sync-receipt/0.1");
  assert.match(payload.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.equal(payload.safety.uploads, false);
});

test("sync --demo --receipt writes local receipt files under temp home", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-receipt-home-"));
  const out = join(home, "receipt");
  const result = run(["sync", "--demo", "--receipt", "--out", out], home);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /sync receipt/);
  assert.match(result.stdout, /no upload/);
  assert.equal(existsSync(join(out, "sync-receipt.html")), true);
  assert.equal(existsSync(join(out, "sync-receipt.json")), true);
  const html = readFileSync(join(out, "sync-receipt.html"), "utf8");
  assert.match(html, /VibeTRACKER Sync Receipt/);
  assert.doesNotMatch(html, /<script/i);
  const payload = JSON.parse(readFileSync(join(out, "sync-receipt.json"), "utf8"));
  assert.equal(payload.schema, "vibetracker.sync-receipt/0.1");
  assert.equal(payload.demo, true);
  assert.equal(payload.safety.uploads, false);
  assert.equal(payload.providers.length >= 3, true);
});
