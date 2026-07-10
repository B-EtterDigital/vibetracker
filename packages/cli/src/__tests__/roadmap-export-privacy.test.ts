import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import parquet from "parquetjs-lite";
import { renderAcceptedRoadmap, roadmapJson } from "../roadmap.ts";
import { parseExportFormat, renderUsageExport, writeParquetExport } from "../export.ts";
import { renderPrivacyScreen } from "../privacy.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";

const records: NormalizedRecord[] = [{
  ts: "2026-07-05T12:00:00Z",
  provider: "higgsfield",
  category: "video",
  operation: "generate",
  model: "soul",
  quantity: 1,
  unit: "credit",
  rawAmount: 12,
  rawUnit: "credits",
  usdEst: 0.12,
  source: "ledger",
  confidence: "high",
  verified: false,
}];

test("roadmap renderer exposes accepted items and not fake-built claims", () => {
  const text = renderAcceptedRoadmap();
  assert.match(text, /73 selected improvements/);
  assert.match(text, /Browser extension capture/);
  assert.match(text, /C0VIBE-ready mobile profile page/);
  assert.match(text, /not claimed as verified API proof/i);
  assert.match(text, /Poe is tracked through manual credit\/subscription ledgers/);
  assert.equal(JSON.stringify(roadmapJson()).includes("Receipt/invoice email import"), false);
});

test("privacy screen states upload boundaries", () => {
  const text = renderPrivacyScreen();
  assert.match(text, /VTK:\/\/PRIVACY-AIRLOCK\/\/WHAT-LEAVES\/\/LOCAL-FIRST/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app \/\/ no prompt or output upload/);
  assert.match(text, /UPLOAD: accepted usage rows \+ aggregates \+ integrity hashes/);
  assert.match(text, /TRUST: GitHub\/Higgsfield\/social context sidecar, NOT USAGE/);
  assert.match(text, /BLOCK: prompts, outputs, API keys, secrets, generated media/);
  assert.match(text, /GATE: dry-run preview -> secret scan -> explicit upload/);
  assert.match(text, /PROOF: ledger seal \+ bundle sign \+ private aggregate export/);
  assert.match(text, /Nothing leaves during normal local commands/);
  assert.match(text, /vibetracker upload/);
  assert.match(text, /GitHub activity is a separate trust signal/);
});

test("usage export renders json, csv, and markdown", () => {
  assert.equal(parseExportFormat("md"), "markdown");
  assert.match(renderUsageExport(records, "json"), /"schema": "vibetracker.export\/0.1"/);
  assert.match(renderUsageExport(records, "csv"), /^ts,provider,category/m);
  assert.match(renderUsageExport(records, "markdown"), /# VibeTRACKER Export/);
  assert.match(renderUsageExport(records, "markdown"), /Suitable for Obsidian vaults and Notion Markdown import/);
});

test("usage export writes readable parquet", async () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-parquet-"));
  try {
    const out = join(dir, "usage.parquet");
    await writeParquetExport(out, records);
    const reader = await parquet.ParquetReader.openFile(out);
    try {
      const cursor = reader.getCursor();
      const row = await cursor.next();
      assert.equal(row.provider, "higgsfield");
      assert.equal(row.category, "video");
    } finally {
      await reader.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
