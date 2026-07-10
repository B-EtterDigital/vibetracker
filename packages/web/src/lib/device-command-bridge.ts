import type { DeviceAuthState } from "./device-auth.ts";
import { deviceAuthStatusLabel, splitDeviceCode } from "./device-auth.ts";
import { providerBrand } from "./provider-brand.ts";

export type DeviceCommandBridgeImpact = "identity" | "not_usage" | "local_only" | "privacy" | "publish";

export interface DeviceCommandBridgeCommand {
  id: "login" | "doctor" | "sync" | "audit" | "dry-run" | "publish";
  label: string;
  command: string;
  impact: DeviceCommandBridgeImpact;
  status: string;
  note: string;
  surprise: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface DeviceCommandBridge {
  headline: string;
  subline: string;
  codeLabel: string;
  terminalLines: string[];
  ticker: string[];
  totals: Record<DeviceCommandBridgeImpact, number>;
  commands: DeviceCommandBridgeCommand[];
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function brand(id: string) {
  return providerBrand(id);
}

function codeLabel(code: string): string {
  return splitDeviceCode(code).join(" ");
}

function commandStatus(state: DeviceAuthState, code: string): string {
  if (state === "done") return "approved";
  if (state === "error") return "retry";
  if (state === "working") return "approving";
  return code ? "ready" : "waiting";
}

function withBrand(command: Omit<DeviceCommandBridgeCommand, "mark" | "from" | "to" | "ink">, brandId: string): DeviceCommandBridgeCommand {
  const b = brand(brandId);
  return { ...command, mark: b.mark, from: b.from, to: b.to, ink: b.ink };
}

export function buildDeviceCommandBridge(state: DeviceAuthState, code: string): DeviceCommandBridge {
  const hasCode = Boolean(code);
  const issued = state === "done";
  const status = commandStatus(state, code);
  const codeValue = hasCode ? codeLabel(code) : "NO CODE";
  const commands: DeviceCommandBridgeCommand[] = [
    withBrand({
      id: "login",
      label: "Approve identity",
      command: "vibetracker login",
      impact: "identity",
      status,
      note: hasCode ? `Match ${codeValue} in the terminal before approving.` : "Open this page from the terminal login link.",
      surprise: "terminal handoff",
      meter: issued ? 100 : state === "working" ? 82 : hasCode ? 66 : 34,
      frames: [
        " CLI CODE  \n BROWSER   \n MATCH     ",
        hasCode ? `${fit(codeValue, 10)}\n session  \n approve  ` : " NO CODE  \n waiting  \n terminal ",
      ],
    }, "c0vibe"),
    withBrand({
      id: "doctor",
      label: "Health preview",
      command: "vibetracker doctor",
      impact: "not_usage",
      status: "safe preview",
      note: "Shows local health and surprise art without provider calls, uploads, or secret reads.",
      surprise: "Higgsfield prism and Codex cube preview",
      meter: 72,
      frames: [
        " HF PRISM \n CX CUBE  \n PREVIEW  ",
        " no calls \n no upload\n no secret",
      ],
    }, "higgsfield"),
    withBrand({
      id: "sync",
      label: "Collect locally",
      command: "vibetracker sync",
      impact: "local_only",
      status: issued ? "ready" : "after login",
      note: "Collects configured provider usage into the local ledger; nothing leaves the machine.",
      surprise: "provider scan reel",
      meter: issued ? 86 : 56,
      frames: [
        " SOURCES  \n -> LOCAL \n LEDGER   ",
        " HF/CX/OL \n scanline \n local    ",
      ],
    }, "codex-cli"),
    withBrand({
      id: "audit",
      label: "Review proof",
      command: "vibetracker audit",
      impact: "privacy",
      status: "review",
      note: "Checks source mix, freshness, coverage gaps, and trust side rails before sharing.",
      surprise: "coverage gate",
      meter: 78,
      frames: [
        " MIX      \n FRESH    \n GAPS     ",
        " TRUST    \n not use  \n labelled ",
      ],
    }, "github"),
    withBrand({
      id: "dry-run",
      label: "Preview upload",
      command: "vibetracker upload --dry-run",
      impact: "privacy",
      status: issued ? "available" : "needs token",
      note: "Shows the aggregate bundle and redaction boundary before anything is sent.",
      surprise: "redaction scanner",
      meter: issued ? 84 : 52,
      frames: [
        " DRY RUN  \n bundle   \n preview  ",
        " prompts  \n outputs  \n blocked  ",
      ],
    }, "openai"),
    withBrand({
      id: "publish",
      label: "Publish aggregate",
      command: "vibetracker upload",
      impact: "publish",
      status: issued ? "manual" : "locked",
      note: "Only this command can send reviewed aggregates to c0vibe.app.",
      surprise: "Vibers Unite relay",
      meter: issued ? 92 : 44,
      frames: [
        " C0VIBE   \n profile  \n score    ",
        " VIBERS   \n UNITE    \n public   ",
      ],
    }, "c0vibe"),
  ];
  const totals = commands.reduce<Record<DeviceCommandBridgeImpact, number>>((acc, command) => {
    acc[command.impact] += 1;
    return acc;
  }, { identity: 0, not_usage: 0, local_only: 0, privacy: 0, publish: 0 });

  return {
    headline: issued ? "Approved. Run the local-first scan path." : "First-run command bridge",
    subline: "The browser approves identity. The terminal still controls scan, review, dry-run, and publish.",
    codeLabel: codeValue,
    commands,
    totals,
    ticker: commands.map((command) => `${command.status.toUpperCase()} // ${command.command}`),
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://FIRST-RUN-COMMAND-BRIDGE//NO-AUTO-UPLOAD"),
      "|--------------------------------------------------------------|",
      frameLine(`state ${deviceAuthStatusLabel(state)} // code ${codeValue}`),
      frameLine("1 login identity // 2 doctor safe preview"),
      frameLine("3 sync local ledger // 4 audit privacy gate"),
      frameLine("5 upload --dry-run preview // 6 upload manual publish"),
      frameLine("surprises HF prism // Codex cube // local sonar"),
      frameLine("Vibers Unite // c0vibe.app // user controls upload"),
      "+--------------------------------------------------------------+",
    ],
  };
}
