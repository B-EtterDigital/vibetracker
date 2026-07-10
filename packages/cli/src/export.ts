import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import { computeStats } from "../../core/src/stats.ts";

export type ExportFormat = "json" | "csv" | "markdown" | "parquet";

const FIELDS: Array<keyof NormalizedRecord> = [
  "ts",
  "provider",
  "category",
  "operation",
  "model",
  "quantity",
  "unit",
  "rawAmount",
  "rawUnit",
  "usdEst",
  "source",
  "confidence",
  "verified",
  "accountId",
  "profileId",
  "teamId",
  "sessionId",
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll("\"", "\"\"")}"` : s;
}

export function renderUsageExport(records: NormalizedRecord[], format: ExportFormat): string {
  if (format === "json") return JSON.stringify({ schema: "vibetracker.export/0.1", count: records.length, records }, null, 2);
  if (format === "parquet") return "Parquet is a binary export. Use writeParquetExport(path, records).";
  if (format === "csv") {
    const header = FIELDS.join(",");
    const rows = records.map((record) => FIELDS.map((field) => csvCell(record[field])).join(","));
    return [header, ...rows].join("\n") + "\n";
  }
  const stats = computeStats(records);
  const providerRows = stats.byProvider.map((row) =>
    `| ${row.key} | ${row.count} | ${row.raw || 0} | ${row.usd != null ? `$${row.usd.toFixed(2)}` : "-"} |`,
  ).join("\n");
  const categoryRows = stats.byCategory.map((row) =>
    `| ${row.key} | ${row.count} | ${row.raw || 0} | ${row.usd != null ? `$${row.usd.toFixed(2)}` : "-"} |`,
  ).join("\n");
  return [
    "# VibeTRACKER Export",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Records: ${records.length}`,
    `Estimated spend: ${stats.totals.usd != null ? `$${stats.totals.usd.toFixed(2)}` : "-"}`,
    `Range: ${stats.range.from ? `${stats.range.from.slice(0, 10)} to ${stats.range.to?.slice(0, 10)}` : "-"}`,
    "",
    "## By Provider",
    "",
    "| Provider | Records | Native amount | USD est |",
    "| --- | ---: | ---: | ---: |",
    providerRows || "| - | 0 | 0 | - |",
    "",
    "## By Category",
    "",
    "| Category | Records | Native amount | USD est |",
    "| --- | ---: | ---: | ---: |",
    categoryRows || "| - | 0 | 0 | - |",
    "",
    "## Notes",
    "",
    "- This file is an export of local VibeTRACKER records.",
    "- Trust signals are intentionally separate from usage records.",
    "- Suitable for Obsidian vaults and Notion Markdown import.",
    "",
  ].join("\n");
}

export function parseExportFormat(value?: string): ExportFormat {
  if (value === "csv" || value === "markdown" || value === "md" || value === "json" || value === "parquet") {
    return value === "md" ? "markdown" : value;
  }
  return "json";
}

export function writeUsageExport(path: string, payload: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, payload, "utf8");
}

interface ParquetRuntime {
  ParquetSchema: new (schema: Record<string, unknown>) => unknown;
  ParquetWriter: {
    openFile(schema: unknown, path: string): Promise<{
      appendRow(record: Record<string, unknown>): Promise<void>;
      close(): Promise<void>;
    }>;
  };
}

async function loadParquet(): Promise<ParquetRuntime> {
  const mod = await import("parquetjs-lite") as unknown as { default?: ParquetRuntime } & ParquetRuntime;
  return mod.default ?? mod;
}

export async function writeParquetExport(path: string, records: NormalizedRecord[]): Promise<void> {
  mkdirSync(dirname(path), { recursive: true });
  const parquet = await loadParquet();
  const schema = new parquet.ParquetSchema({
    ts: { type: "UTF8" },
    provider: { type: "UTF8" },
    category: { type: "UTF8" },
    operation: { type: "UTF8" },
    model: { type: "UTF8", optional: true },
    quantity: { type: "DOUBLE" },
    unit: { type: "UTF8" },
    rawAmount: { type: "DOUBLE" },
    rawUnit: { type: "UTF8" },
    usdEst: { type: "DOUBLE", optional: true },
    source: { type: "UTF8" },
    confidence: { type: "UTF8" },
    verified: { type: "BOOLEAN" },
    accountId: { type: "UTF8", optional: true },
    profileId: { type: "UTF8", optional: true },
    teamId: { type: "UTF8", optional: true },
    sessionId: { type: "UTF8", optional: true },
  });
  const writer = await parquet.ParquetWriter.openFile(schema, path);
  try {
    for (const record of records) await writer.appendRow(record as unknown as Record<string, unknown>);
  } finally {
    await writer.close();
  }
}
