export type TrustSignalKind = "github_activity" | "creator_activity" | "higgsfield_mcp";
export type TrustSignalSource = "github_cli" | "manual" | "codex_mcp";
export type TrustSignalConfidence = "activity_evidence";
export type CreatorPlatform = "youtube" | "x" | "linkedin" | "huggingface" | "npm" | "pypi";

export interface GitHubContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubActivityTrustSignal {
  kind: "github_activity";
  source: "github_cli";
  label: "GitHub activity evidence (not AI usage)";
  handle: string;
  fetchedAt: string;
  from: string;
  to: string;
  windowDays: number;
  totalContributions: number;
  commitContributions: number;
  issueContributions: number;
  pullRequestContributions: number;
  pullRequestReviewContributions: number;
  repositoryContributions: number;
  days?: GitHubContributionDay[];
  confidence: TrustSignalConfidence;
  affectsTotals: false;
  usageVerified: false;
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.";
}

export interface CreatorActivityTrustSignal {
  kind: "creator_activity";
  source: "manual";
  label: "Creator activity evidence (not AI usage)";
  platform: CreatorPlatform;
  handle: string;
  metric: string;
  count: number;
  url?: string;
  fetchedAt: string;
  windowDays?: number;
  confidence: TrustSignalConfidence;
  affectsTotals: false;
  usageVerified: false;
  note: "Creator/public activity evidence only. Not counted as usage, spend, credits, or verified provider data.";
}

export interface HiggsfieldMcpTrustSignal {
  kind: "higgsfield_mcp";
  source: "codex_mcp";
  label: "Higgsfield MCP connection evidence (not AI usage)";
  provider: "higgsfield";
  mcpName: "higgsfield";
  transport: string;
  auth: "oauth";
  urlHost: string;
  enabled: boolean;
  fetchedAt: string;
  confidence: TrustSignalConfidence;
  affectsTotals: false;
  usageVerified: false;
  note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.";
}

export type TrustSignal = GitHubActivityTrustSignal | CreatorActivityTrustSignal | HiggsfieldMcpTrustSignal;
