import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";

export type ProfileTrustSignal = TrustSignal;

export const GITHUB_LEVEL_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"] as const;

export function isProfileTrustSignal(value: unknown): value is ProfileTrustSignal {
  if (!value || typeof value !== "object") return false;
  const signal = value as Partial<TrustSignal>;
  if (signal.affectsTotals !== false || signal.usageVerified !== false) return false;
  if (signal.kind === "github_activity") {
    return signal.source === "github_cli" && typeof signal.handle === "string" && Array.isArray(signal.days);
  }
  if (signal.kind === "creator_activity") {
    return signal.source === "manual" && typeof signal.handle === "string" && typeof signal.metric === "string";
  }
  if (signal.kind === "higgsfield_mcp") {
    return signal.source === "codex_mcp"
      && signal.provider === "higgsfield"
      && signal.mcpName === "higgsfield"
      && signal.auth === "oauth"
      && signal.enabled === true
      && typeof signal.transport === "string"
      && typeof signal.urlHost === "string";
  }
  return false;
}

export function publicTrustSignals(values: unknown[]): ProfileTrustSignal[] {
  return values.filter(isProfileTrustSignal).slice(0, 8);
}

export function trustSignalTitle(signal: ProfileTrustSignal): string {
  if (signal.kind === "github_activity") return "GitHub activity";
  if (signal.kind === "higgsfield_mcp") return "Higgsfield MCP";
  return `${signal.platform} activity`;
}

export function trustSignalMetric(signal: ProfileTrustSignal): string {
  if (signal.kind === "github_activity") {
    return `${signal.totalContributions.toLocaleString("en-US")} contributions`;
  }
  if (signal.kind === "higgsfield_mcp") {
    return "OAuth MCP enabled";
  }
  return `${signal.count.toLocaleString("en-US")} ${signal.metric}`;
}

export function trustSignalWindow(signal: ProfileTrustSignal): string {
  if (signal.kind === "github_activity") return `${signal.windowDays}d window`;
  if (signal.kind === "higgsfield_mcp") return `${signal.transport} · ${signal.urlHost}`;
  return signal.windowDays ? `${signal.windowDays}d window` : "manual window";
}

export function trustSignalMark(signal: ProfileTrustSignal): string {
  if (signal.kind === "github_activity") return "GH";
  if (signal.kind === "higgsfield_mcp") return "HF";
  return "CR";
}
