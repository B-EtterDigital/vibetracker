import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { CreatorPlatform, GitHubContributionDay, TrustSignal } from "../../core/src/schema/trust-signal.ts";

export interface CommandResult {
  status: number | null;
  stdout?: string | Buffer;
  stderr?: string | Buffer;
  error?: { message?: string };
}

export type CommandRunner = (command: string, args: string[]) => CommandResult;

export interface TrustSignalCollectOpts {
  now?: Date;
  windowDays?: number;
  run?: CommandRunner;
}

export const TRUST_SIGNALS_PATH = join(homedir(), ".vibetracker", "trust-signals.json");

const GITHUB_ACTIVITY_QUERY = `
query($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}`;

const num = (v: unknown): number => Number.isFinite(Number(v)) ? Number(v) : 0;
const level = (v: unknown, count: number): 0 | 1 | 2 | 3 | 4 => {
  if (v === "FOURTH_QUARTILE") return 4;
  if (v === "THIRD_QUARTILE") return 3;
  if (v === "SECOND_QUARTILE") return 2;
  if (v === "FIRST_QUARTILE") return 1;
  return count > 0 ? 1 : 0;
};

function contributionDays(coll: any, windowDays: number): GitHubContributionDay[] {
  const weeks = Array.isArray(coll?.contributionCalendar?.weeks) ? coll.contributionCalendar.weeks : [];
  return weeks.flatMap((w: any) => Array.isArray(w?.contributionDays) ? w.contributionDays : [])
    .map((d: any) => {
      const count = num(d?.contributionCount);
      return {
        date: typeof d?.date === "string" ? d.date : "",
        count,
        level: level(d?.contributionLevel, count),
      };
    })
    .filter((d: { date: string }) => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
    .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))
    .slice(-windowDays);
}

function defaultRun(command: string, args: string[]): CommandResult {
  return spawnSync(command, args, { encoding: "utf8", timeout: 8000 });
}

export function collectGitHubActivityTrustSignal(opts: TrustSignalCollectOpts = {}): TrustSignal | null {
  const now = opts.now ?? new Date();
  const requestedDays = Number(opts.windowDays ?? 365);
  const windowDays = Number.isFinite(requestedDays) ? Math.max(1, Math.min(366, Math.floor(requestedDays))) : 365;
  const from = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const to = now.toISOString();
  const run = opts.run ?? defaultRun;
  const res = run("gh", [
    "api",
    "graphql",
    "-f", `query=${GITHUB_ACTIVITY_QUERY}`,
    "-F", `from=${from}`,
    "-F", `to=${to}`,
  ]);
  if (res.status !== 0) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(String(res.stdout ?? ""));
  } catch (_err) {
    return null;
  }
  const viewer = parsed?.data?.viewer;
  const coll = viewer?.contributionsCollection;
  const handle = typeof viewer?.login === "string" ? viewer.login : "";
  if (!handle || !coll) return null;

  return {
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle,
    fetchedAt: to,
    from,
    to,
    windowDays,
    totalContributions: num(coll.contributionCalendar?.totalContributions),
    commitContributions: num(coll.totalCommitContributions),
    issueContributions: num(coll.totalIssueContributions),
    pullRequestContributions: num(coll.totalPullRequestContributions),
    pullRequestReviewContributions: num(coll.totalPullRequestReviewContributions),
    repositoryContributions: num(coll.totalRepositoryContributions),
    days: contributionDays(coll, windowDays),
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  };
}

function valueLine(text: string, key: string): string {
  const found = text.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "mi"));
  return found?.[1]?.trim() ?? "";
}

function urlHost(value: string): string {
  try {
    return new URL(value).host.slice(0, 120);
  } catch (_err) {
    return "";
  }
}

export function collectHiggsfieldMcpTrustSignal(opts: TrustSignalCollectOpts = {}): TrustSignal | null {
  const run = opts.run ?? defaultRun;
  const res = run("codex", ["mcp", "get", "higgsfield"]);
  if (res.status !== 0) return null;
  const output = String(res.stdout ?? "");
  const enabled = /^ *enabled:\s*true\s*$/im.test(output);
  const transport = cleanToken(valueLine(output, "transport"), 40);
  const host = urlHost(valueLine(output, "url"));
  if (!enabled || !transport || !host) return null;
  return {
    kind: "higgsfield_mcp",
    source: "codex_mcp",
    label: "Higgsfield MCP connection evidence (not AI usage)",
    provider: "higgsfield",
    mcpName: "higgsfield",
    transport,
    auth: "oauth",
    urlHost: host,
    enabled: true,
    fetchedAt: (opts.now ?? new Date()).toISOString(),
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.",
  };
}

function cleanToken(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
}

export function collectTrustSignals(opts: TrustSignalCollectOpts = {}): TrustSignal[] {
  const out: TrustSignal[] = [];
  const github = collectGitHubActivityTrustSignal(opts);
  if (github) out.push(github);
  const higgsfield = collectHiggsfieldMcpTrustSignal(opts);
  if (higgsfield) out.push(higgsfield);
  out.push(...loadManualTrustSignals());
  return out;
}

export function loadManualTrustSignals(path = TRUST_SIGNALS_PATH): TrustSignal[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(parsed) ? parsed.filter((s) => s?.kind === "creator_activity" && s?.source === "manual") as TrustSignal[] : [];
  } catch (_err) {
    return [];
  }
}

export function saveManualTrustSignal(signal: TrustSignal, path = TRUST_SIGNALS_PATH): TrustSignal[] {
  const signals = loadManualTrustSignals(path);
  const next = [...signals.filter((s) =>
    !(s.kind === signal.kind
      && "platform" in s
      && "platform" in signal
      && s.platform === signal.platform
      && s.handle === signal.handle
      && s.metric === signal.metric)), signal];
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(next, null, 2), { encoding: "utf8", mode: 0o600 });
  return next;
}

export function createCreatorActivityTrustSignal(input: {
  platform: CreatorPlatform;
  handle: string;
  metric: string;
  count: number;
  url?: string;
  windowDays?: number;
  now?: Date;
}): TrustSignal {
  return {
    kind: "creator_activity",
    source: "manual",
    label: "Creator activity evidence (not AI usage)",
    platform: input.platform,
    handle: input.handle,
    metric: input.metric,
    count: Math.max(0, Math.floor(input.count)),
    ...(input.url ? { url: input.url } : {}),
    fetchedAt: (input.now ?? new Date()).toISOString(),
    ...(input.windowDays ? { windowDays: Math.max(1, Math.floor(input.windowDays)) } : {}),
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Creator/public activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  };
}

export function trustSignalSummary(signals: TrustSignal[]): string {
  if (!signals.length) return "";
  return signals.map((s) => {
    if (s.kind === "github_activity") {
      return `GitHub activity evidence: @${s.handle}, ${s.totalContributions.toLocaleString("en-US")} contributions/${s.windowDays}d (not usage)`;
    }
    if (s.kind === "creator_activity") {
      return `${s.platform} creator evidence: @${s.handle}, ${s.count.toLocaleString("en-US")} ${s.metric}${s.windowDays ? `/${s.windowDays}d` : ""} (not usage)`;
    }
    if (s.kind === "higgsfield_mcp") {
      return `Higgsfield MCP evidence: ${s.transport} OAuth at ${s.urlHost} (not usage)`;
    }
    return s.label;
  }).join("; ");
}
