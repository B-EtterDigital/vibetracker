import { createConsoleTelemetry } from "../../../../core/src/telemetry/index.ts";

const telemetry = createConsoleTelemetry();
const GITHUB_API = "https://api.github.com/repos/B-EtterDigital/vibetracker";
export const GITHUB_REPOSITORY_URL = "https://github.com/B-EtterDigital/vibetracker";

interface GitHubFetchInit extends RequestInit {
  next?: { revalidate: number };
}

export type GitHubFetcher = (input: string, init: GitHubFetchInit) => Promise<Response>;

export interface ContributorPulsePerson {
  login: string;
  contributions: number;
  href: string;
}

export interface ContributorPulseIssue {
  number: number;
  title: string;
  labels: string[];
  href: string;
  updatedAt: string;
}

export interface ContributorPulseLive {
  state: "live";
  repository: "B-EtterDigital/vibetracker";
  repositoryUrl: string;
  defaultBranch: string;
  openIssues: number;
  stars: number;
  forks: number;
  pushedAt: string;
  pushedLabel: string;
  contributors: ContributorPulsePerson[];
  contributorCount: number;
  contributionTotal: number;
  issues: ContributorPulseIssue[];
  fingerprint: string;
}

export interface ContributorPulseUnavailable {
  state: "unavailable";
  repository: "B-EtterDigital/vibetracker";
  repositoryUrl: string;
  message: string;
}

export type ContributorPulse = ContributorPulseLive | ContributorPulseUnavailable;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function finite(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isoDate(value: unknown): string {
  const candidate = text(value);
  const date = new Date(candidate);
  return candidate && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
}

function dateLabel(value: string): string {
  return value ? value.slice(0, 10) : "DATE UNAVAILABLE";
}

function fingerprint(parts: Array<string | number>): string {
  let hash = 2166136261;
  for (const char of parts.join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

async function json(response: Response, area: string): Promise<unknown> {
  if (!response.ok) throw new Error(`${area}: GitHub returned HTTP ${response.status}`);
  return response.json();
}

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "VibeUsage-contributor-pulse",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchGitHubContributorPulse(fetcher: GitHubFetcher = fetch): Promise<ContributorPulseLive> {
  const init: GitHubFetchInit = { headers: headers(), next: { revalidate: 900 } };
  const repositoryRaw = await json(await fetcher(GITHUB_API, init), "contributors.repository");
  const repository = record(repositoryRaw);
  if (!repository) throw new Error("contributors.repository: malformed GitHub response");

  const contributorsRaw = await json(
    await fetcher(`${GITHUB_API}/contributors?per_page=20`, init),
    "contributors.people",
  );
  if (!Array.isArray(contributorsRaw)) throw new Error("contributors.people: malformed GitHub response");
  const contributors = contributorsRaw.map((value): ContributorPulsePerson | null => {
    const person = record(value);
    const login = text(person?.login).slice(0, 64);
    if (!login) return null;
    return {
      login,
      contributions: finite(person?.contributions),
      href: `https://github.com/${encodeURIComponent(login)}`,
    };
  }).filter((person): person is ContributorPulsePerson => Boolean(person));

  const reportedOpenItems = finite(repository.open_issues_count);
  let issues: ContributorPulseIssue[] = [];
  if (reportedOpenItems > 0) {
    const issuesRaw = await json(
      await fetcher(`${GITHUB_API}/issues?state=open&per_page=20`, init),
      "contributors.issues",
    );
    if (!Array.isArray(issuesRaw)) throw new Error("contributors.issues: malformed GitHub response");
    issues = issuesRaw.map((value): ContributorPulseIssue | null => {
      const issue = record(value);
      if (!issue || issue.pull_request) return null;
      const number = Math.floor(finite(issue.number));
      const title = text(issue.title).slice(0, 180);
      if (!number || !title) return null;
      const rawLabels = Array.isArray(issue.labels) ? issue.labels : [];
      const labels = rawLabels.map((label) => text(record(label)?.name).slice(0, 48)).filter(Boolean).slice(0, 5);
      return {
        number,
        title,
        labels,
        href: `${GITHUB_REPOSITORY_URL}/issues/${number}`,
        updatedAt: isoDate(issue.updated_at),
      };
    }).filter((issue): issue is ContributorPulseIssue => Boolean(issue));
  }

  const pushedAt = isoDate(repository.pushed_at);
  const contributionTotal = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0);
  return {
    state: "live",
    repository: "B-EtterDigital/vibetracker",
    repositoryUrl: GITHUB_REPOSITORY_URL,
    defaultBranch: text(repository.default_branch, "main").slice(0, 64),
    openIssues: issues.length,
    stars: finite(repository.stargazers_count),
    forks: finite(repository.forks_count),
    pushedAt,
    pushedLabel: dateLabel(pushedAt),
    contributors,
    contributorCount: contributors.length,
    contributionTotal,
    issues,
    fingerprint: fingerprint([
      pushedAt,
      contributors.length,
      contributionTotal,
      issues.length,
      ...contributors.map((contributor) => `${contributor.login}:${contributor.contributions}`),
    ]),
  };
}

export async function getContributorPulse(): Promise<ContributorPulse> {
  try {
    return await fetchGitHubContributorPulse();
  } catch (error) {
    telemetry.captureError(error, {
      area: "web.contributors.github-pulse",
      severity: "warn",
      repository: "B-EtterDigital/vibetracker",
    });
    return {
      state: "unavailable",
      repository: "B-EtterDigital/vibetracker",
      repositoryUrl: GITHUB_REPOSITORY_URL,
      message: "GitHub repository state is temporarily unavailable. No cached contributor counts were substituted.",
    };
  }
}
