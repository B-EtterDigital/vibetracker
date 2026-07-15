import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { buildMissionControl, type MissionControl, type MissionControlInput } from "./mission/mission-control.ts";

const FRAME_WIDTH = 78;
const CONTENT_WIDTH = FRAME_WIDTH - 4;

export interface LiveConsoleOptions {
  once: boolean;
  intervalSeconds: number;
  budgetUsd?: number;
  trustEnabled: boolean;
}

export interface LiveConsoleFrameInput {
  records: NormalizedRecord[];
  trustSignals: TrustSignal[];
  generatedAt?: string;
  budgetUsd?: number;
  frame?: number;
  intervalSeconds?: number;
  mode?: "snapshot" | "watch";
}

function valueAfter(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function positiveNumber(argv: string[], flag: string): number | undefined {
  const raw = valueAfter(argv, flag);
  if (raw == null) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${flag} must be a positive number`);
  return value;
}

export function parseLiveConsoleOptions(argv: string[], interactive: boolean): LiveConsoleOptions {
  const intervalSeconds = positiveNumber(argv, "--interval") ?? 5;
  if (intervalSeconds > 60) throw new Error("--interval must be 60 seconds or less");
  const budgetUsd = positiveNumber(argv, "--budget");
  return {
    once: argv.includes("--once") || !interactive,
    intervalSeconds,
    ...(budgetUsd != null ? { budgetUsd } : {}),
    trustEnabled: !argv.includes("--no-trust"),
  };
}

function fit(value: string, width = CONTENT_WIDTH): string {
  return value.length > width ? `${value.slice(0, Math.max(0, width - 3))}...` : value.padEnd(width);
}

function line(value = ""): string {
  return `| ${fit(value)} |`;
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function meter(pct: number, width = 18): string {
  const filled = Math.max(pct > 0 ? 1 : 0, Math.min(width, Math.round((pct / 100) * width)));
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`;
}

function status(mission: MissionControl): string {
  if (!mission.overview.records) return "COLD / CONNECT SOURCE";
  if (mission.forecast.budgetStatus === "over") return "HOT / BUDGET OVER";
  if (mission.forecast.budgetStatus === "near") return "WARM / BUDGET NEAR";
  if (mission.proof.freshness.stale) return "REVIEW / STALE RAIL";
  if (mission.proof.verifiedSharePct < 50) return "REVIEW / PROOF GAP";
  return "NOMINAL / LEDGER LIVE";
}

function providerRows(mission: MissionControl): string[] {
  if (!mission.providers.length) return [line("No provider rail yet. Run: vibetracker init --gui")];
  return mission.providers.slice(0, 5).map((provider, index) => line(
    `${String(index + 1).padStart(2, "0")} ${fit(provider.key, 15)} ${meter(provider.sharePct)} ${provider.sharePct.toFixed(1).padStart(5)}%  ${compact(provider.ops).padStart(6)} ops`,
  ));
}

function latestRows(mission: MissionControl): string[] {
  if (!mission.latest.length) return [line("No activity samples. Raw prompts and outputs are never shown.")];
  return mission.latest.slice(0, 3).map((record) => line(
    `${record.ts.slice(11, 16)}Z  ${fit(record.provider, 14)} ${fit(record.category, 9)} ${fit(record.operation, 18)} ${record.source}`,
  ));
}

function actionRows(mission: MissionControl): string[] {
  return mission.actions.slice(0, 3).map((action, index) => line(
    `${String(index + 1).padStart(2, "0")} ${action.level.toUpperCase().padEnd(6)} ${fit(action.label, 24)} $ ${action.command}`,
  ));
}

export function renderLiveConsole(mission: MissionControl, input: Pick<LiveConsoleFrameInput, "frame" | "intervalSeconds" | "mode"> = {}): string {
  const mode = input.mode ?? "snapshot";
  const interval = input.intervalSeconds ?? 5;
  const frame = input.frame ?? 1;
  const budget = mission.forecast.budgetUsd == null
    ? "budget unset"
    : `${mission.forecast.budgetStatus.toUpperCase()} ${usd(mission.forecast.projected30dUsdEst)}~ / ${usd(mission.forecast.budgetUsd)}`;

  return [
    "+----------------------------------------------------------------------------+",
    line("VTK://LIVE-OPS//LOCAL-LEDGER//READ-ONLY"),
    line(`${status(mission)}  |  ${mode.toUpperCase()} frame ${frame}  |  ${mode === "watch" ? `refresh ${interval}s` : "one shot"}`),
    line(`sampled ${mission.generatedAt}  |  Ctrl-C exits watch mode`),
    "+------------------------------- CORE SIGNALS -------------------------------+",
    line(`${compact(mission.overview.ops)} ops  |  ${mission.overview.records} records  |  ${mission.overview.providers} providers  |  ${mission.overview.categories} categories`),
    line(`${usd(mission.overview.usdEst)}~ all time  |  ${usd(mission.windows.last7d.usdEst)}~ last 7d  |  ${usd(mission.windows.last30d.usdEst)}~ last 30d`),
    line(`${usd(mission.forecast.dailyAvgUsdEst)}~/day  |  30d projection ${usd(mission.forecast.projected30dUsdEst)}~  |  ${budget}`),
    "+----------------------------- PROVIDER TOPOLOGY ----------------------------+",
    ...providerRows(mission),
    "+------------------------------- PROOF MATRIX -------------------------------+",
    line(`verified ${mission.proof.verifiedSharePct.toFixed(1)}%  ${meter(mission.proof.verifiedSharePct, 22)}  ${mission.proof.verifiedRecords}/${mission.overview.records} records`),
    line(`freshness providers: fresh ${mission.proof.freshness.fresh}  warm ${mission.proof.freshness.warm}  stale ${mission.proof.freshness.stale}`),
    line(`integrity ${mission.proof.chainHead.slice(0, 18)}...${mission.proof.chainHead.slice(-12)}  |  trust ${mission.trust.count} NOT USAGE`),
    "+------------------------------ LATEST ACTIVITY -----------------------------+",
    ...latestRows(mission),
    "+------------------------------ OPERATOR QUEUE ------------------------------+",
    ...actionRows(mission),
    "+----------------------------------------------------------------------------+",
    line("READS local aggregate ledger. WRITES 0. UPLOADS 0. PROVIDER CALLS 0."),
    line("Excludes prompts, outputs, secrets, media, and credential values."),
    line("VibeTRACKER // Vibers Unite // vibeusage.c0vibe.app"),
    "+----------------------------------------------------------------------------+",
  ].join("\n");
}

export function buildLiveConsoleFrame(input: LiveConsoleFrameInput): string {
  const missionInput: MissionControlInput = {
    records: input.records,
    trustSignals: input.trustSignals,
    generatedAt: input.generatedAt,
    budgetUsd: input.budgetUsd,
  };
  return renderLiveConsole(buildMissionControl(missionInput), input);
}
