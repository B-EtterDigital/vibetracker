import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";
import { buildMissionControl, renderMissionControl } from "./mission-control.ts";
import { renderMissionHtml } from "./mission-html.ts";

export interface MissionCommandInput {
  argv: string[];
  records: NormalizedRecord[];
  trustSignals: TrustSignal[];
  defaultHtmlPath: string;
  generatedAt?: string;
}

export type MissionCommandResult =
  | { kind: "stdout"; format: "terminal" | "json"; text: string }
  | { kind: "html"; path: string; html: string; open: boolean };

function flag(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : undefined;
}

function budgetFlag(argv: string[]): number | undefined {
  const raw = flag(argv, "--budget");
  if (raw == null) return undefined;
  const budget = Number(raw);
  if (!Number.isFinite(budget) || budget <= 0) throw new Error("--budget must be a positive number");
  return budget;
}

export function resolveMissionCommand(input: MissionCommandInput): MissionCommandResult {
  const wantsJson = input.argv.includes("--json");
  const wantsHtml = input.argv.includes("--html") || input.argv.includes("--open");
  if (wantsJson && wantsHtml) throw new Error("mission accepts either --json or --html, not both");

  const mission = buildMissionControl({
    records: input.records,
    trustSignals: input.trustSignals,
    generatedAt: input.generatedAt,
    budgetUsd: budgetFlag(input.argv),
  });
  if (wantsJson) return { kind: "stdout", format: "json", text: JSON.stringify(mission, null, 2) };
  if (wantsHtml) {
    return {
      kind: "html",
      path: flag(input.argv, "--out") ?? input.defaultHtmlPath,
      html: renderMissionHtml(mission),
      open: input.argv.includes("--open"),
    };
  }
  return { kind: "stdout", format: "terminal", text: renderMissionControl(mission) };
}
