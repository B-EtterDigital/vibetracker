import { spawnSync } from "node:child_process";
import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import { formatTable } from "./format.ts";

export interface DesktopActivity {
  provider: string;
  label: string;
  matched: string;
  pid?: string;
}

const PROCESS_PATTERNS: Array<{ provider: string; label: string; pattern: RegExp }> = [
  { provider: "lmstudio", label: "LM Studio", pattern: /\blm[ -]?studio\b/i },
  { provider: "ollama", label: "Ollama", pattern: /\bollama\b/i },
  { provider: "comfyui", label: "ComfyUI", pattern: /\bcomfyui\b/i },
  { provider: "automatic1111", label: "AUTOMATIC1111", pattern: /\b(webui|automatic1111|stable-diffusion-webui)\b/i },
  { provider: "invokeai", label: "InvokeAI", pattern: /\binvokeai\b/i },
  { provider: "cursor", label: "Cursor", pattern: /\bcursor\b/i },
  { provider: "windsurf", label: "Windsurf", pattern: /\bwindsurf\b/i },
  { provider: "claude-code", label: "Claude Code", pattern: /\bclaude\b/i },
  { provider: "codex-cli", label: "Codex CLI", pattern: /(^|\s|\/)codex(\s|$)/i },
];

export function scanDesktopActivity(psOutput?: string): DesktopActivity[] {
  const output = psOutput ?? spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" }).stdout;
  const hits: DesktopActivity[] = [];
  const seen = new Set<string>();
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [pid, ...rest] = trimmed.split(/\s+/);
    const args = rest.join(" ");
    for (const entry of PROCESS_PATTERNS) {
      if (!entry.pattern.test(args)) continue;
      const key = `${entry.provider}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ provider: entry.provider, label: entry.label, matched: args.slice(0, 160), pid });
    }
  }
  return hits;
}

export function desktopActivitiesToRecords(activities: DesktopActivity[], ts = new Date().toISOString()): NormalizedRecord[] {
  return activities.map((activity) => ({
    ts,
    provider: activity.provider,
    category: activity.provider === "cursor" || activity.provider === "windsurf" || activity.provider === "claude-code" || activity.provider === "codex-cli" ? "coding" : activity.provider === "automatic1111" || activity.provider === "comfyui" || activity.provider === "invokeai" ? "image" : "llm",
    operation: "desktop_activity_snapshot",
    quantity: 1,
    unit: "request",
    rawAmount: 1,
    rawUnit: "process",
    source: "local",
    confidence: "low",
    verified: false,
    sessionId: activity.pid ? `pid:${activity.pid}` : "desktop",
  }));
}

export function renderDesktopActivity(activities: DesktopActivity[]): string {
  if (!activities.length) return "No known AI desktop processes detected.";
  return formatTable(["PROVIDER", "PID", "MATCH"], activities.map((activity) => [
    activity.provider,
    activity.pid ?? "-",
    activity.matched,
  ]));
}
