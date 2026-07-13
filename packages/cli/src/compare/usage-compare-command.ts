import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { renderUsageComparisonHtml } from "./usage-compare-html.ts";
import { buildUsageComparison, renderUsageComparison } from "./usage-compare.ts";

export interface UsageCompareCommandInput {
  argv: string[];
  records: NormalizedRecord[];
  defaultHtmlPath: string;
  generatedAt?: string;
}

export type UsageCompareCommandResult =
  | { kind: "stdout"; format: "terminal" | "json"; text: string }
  | { kind: "html"; path: string; html: string; open: boolean };

function flag(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : undefined;
}

function daysFlag(argv: string[]): number {
  const raw = flag(argv, "--days");
  if (raw == null) return 7;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("--days must be an integer from 1 to 365");
  return days;
}

function asOfFlag(argv: string[], generatedAt?: string): string | undefined {
  const raw = flag(argv, "--as-of") ?? generatedAt;
  if (raw == null) return undefined;
  const timestamp = new Date(raw);
  if (!Number.isFinite(timestamp.getTime())) throw new Error("--as-of must be a valid ISO timestamp");
  return timestamp.toISOString();
}

export function resolveUsageCompareCommand(input: UsageCompareCommandInput): UsageCompareCommandResult {
  const wantsJson = input.argv.includes("--json");
  const wantsHtml = input.argv.includes("--html") || input.argv.includes("--open");
  if (wantsJson && wantsHtml) throw new Error("compare accepts either --json or --html, not both");
  const comparison = buildUsageComparison({
    records: input.records,
    days: daysFlag(input.argv),
    asOf: asOfFlag(input.argv, input.generatedAt),
  });
  if (wantsJson) return { kind: "stdout", format: "json", text: JSON.stringify(comparison, null, 2) };
  if (wantsHtml) {
    return {
      kind: "html",
      path: flag(input.argv, "--out") ?? input.defaultHtmlPath,
      html: renderUsageComparisonHtml(comparison),
      open: input.argv.includes("--open"),
    };
  }
  return { kind: "stdout", format: "terminal", text: renderUsageComparison(comparison) };
}
