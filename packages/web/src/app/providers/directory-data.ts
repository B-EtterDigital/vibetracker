import type { ProviderDescriptor } from "../../../../adapters/src/registry";
import { cliCommand } from "../../lib/cli-command.ts";

export type StatusKey = "verified" | "built" | "proxy" | "manual" | "planned";
export type StatusFilter = "all" | "ready" | StatusKey;
export type DomainFilter = "all" | ProviderDescriptor["domain"];

export const PAGE_SIZES = [12, 24, 48] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const PAGE_SIZE: PageSize = 12;
export const STATUS_KEYS: StatusKey[] = ["verified", "built", "proxy", "manual", "planned"];
export const FEATURED_PROVIDER_IDS = ["midjourney", "leonardo", "cynaps3", "suno", "udio", "runway"] as const;

export const STATUS_WORD: Record<StatusKey, string> = {
  verified: "built · verified",
  built: "built · approximate",
  proxy: "proxy-ready",
  manual: "manual",
  planned: "planned",
};

export const STATUS_LEGEND: Record<StatusKey, string> = {
  verified: "Ships in the CLI and has produced endpoint-attested records.",
  built: "Ships and works, but totals may drift until endpoint verification is complete.",
  proxy: "Captured through a local proxy or log path; no dedicated provider adapter is required.",
  manual: "Tracked with an explicit local command, including amortized subscriptions.",
  planned: "Mapped in the registry, but not built. No hidden or implied coverage.",
};

const STATUS_ORDER: Record<StatusKey, number> = {
  verified: 0,
  built: 1,
  proxy: 2,
  manual: 3,
  planned: 4,
};

const STATUS_SEARCH_WORDS: Record<StatusKey, string> = {
  verified: "verified attested live ready adapter",
  built: "built approximate ready adapter",
  proxy: "proxy local ready",
  manual: "manual subscription ready",
  planned: "planned contribute adapter request",
};

export interface ProviderRow {
  provider: ProviderDescriptor;
  key: StatusKey;
  haystack: string;
  label: string;
  id: string;
}

export interface FeaturedProviderConnection {
  row: ProviderRow;
  protocol: string;
  action: ProviderDirectoryAction;
}

export interface ProviderDirectoryData {
  rows: ProviderRow[];
  statusCounts: Record<StatusKey, number>;
  readyCount: number;
  categories: Array<[string, number]>;
}

export interface ProviderCoverageBrief {
  headline: string;
  summary: string;
  vectorLabel: string;
  coverageLabel: string;
  verifiedCount: number;
  caveatedCount: number;
  plannedCount: number;
  verifiedShare: number;
  caveatedShare: number;
  plannedShare: number;
  decisiveLabel: string;
  nextAction: string;
  recommendedStatus: "verified" | "ready" | "planned";
}

export interface ProviderFilters {
  query: string;
  status: StatusFilter;
  category: string;
  domain: DomainFilter;
}

export type ProviderDirectoryAction =
  | { kind: "copy"; label: string; command: string }
  | { kind: "link"; label: string; href: string };

const GOOD_FIRST_ADAPTERS =
  "https://github.com/B-EtterDigital/vibetracker/blob/main/docs/GOOD_FIRST_ADAPTERS.md";

export function providerActionFor(provider: ProviderDescriptor, key: StatusKey): ProviderDirectoryAction {
  if (provider.id === "midjourney") {
    return {
      kind: "copy",
      label: "import /info total",
      command: cliCommand("import midjourney --images <lifetime-images>"),
    };
  }
  if (key === "verified" || key === "built") {
    return { kind: "copy", label: `connect ${provider.id}`, command: cliCommand(`connect ${provider.id}`) };
  }
  if (key === "proxy") return { kind: "copy", label: "detect", command: cliCommand("detect") };
  if (key === "manual") {
    return {
      kind: "copy",
      label: `add ${provider.id}`,
      command: cliCommand(`add ${provider.id} --usd 20 --note manual`),
    };
  }
  return { kind: "link", label: "contribute", href: GOOD_FIRST_ADAPTERS };
}

export function statusKeyOf(provider: ProviderDescriptor): StatusKey {
  if (provider.status === "built" && provider.verified) return "verified";
  if (provider.status === "built") return "built";
  if (provider.tier === "proxy") return "proxy";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  return "planned";
}

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function buildProviderDirectoryData(providers: ProviderDescriptor[]): ProviderDirectoryData {
  const statusCounts: Record<StatusKey, number> = { verified: 0, built: 0, proxy: 0, manual: 0, planned: 0 };
  const categoryCounts = new Map<string, number>();

  const rows = providers.map((provider) => {
    const key = statusKeyOf(provider);
    statusCounts[key] += 1;
    for (const category of provider.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    return {
      provider,
      key,
      label: normalize(provider.label),
      id: normalize(provider.id),
      haystack: normalize([
        provider.label,
        provider.id,
        provider.domain,
        provider.categories.join(" "),
        provider.tier,
        provider.auth,
        provider.status,
        provider.method,
        STATUS_WORD[key],
        STATUS_SEARCH_WORDS[key],
      ].join(" ")),
    } satisfies ProviderRow;
  });

  return {
    rows,
    statusCounts,
    readyCount: statusCounts.verified + statusCounts.built + statusCounts.proxy + statusCounts.manual,
    categories: [...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  };
}

export function featuredProviderRows(rows: ProviderRow[]): ProviderRow[] {
  return FEATURED_PROVIDER_IDS.flatMap((id) => {
    const row = rows.find((candidate) => candidate.provider.id === id);
    return row ? [row] : [];
  });
}

const FEATURED_PROTOCOLS: Record<(typeof FEATURED_PROVIDER_IDS)[number], string> = {
  midjourney: "OFFICIAL /INFO",
  leonardo: "PRODUCTION API",
  cynaps3: "PKCE OAUTH",
  suno: "SESSION FEED",
  udio: "SESSION FEED",
  runway: "ORG LEDGER",
};

export function featuredProviderConnections(rows: ProviderRow[]): FeaturedProviderConnection[] {
  return featuredProviderRows(rows).map((row) => ({
    row,
    protocol: FEATURED_PROTOCOLS[row.provider.id as (typeof FEATURED_PROVIDER_IDS)[number]],
    action: providerActionFor(row.provider, row.key),
  }));
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function plural(count: number, singular: string, pluralValue = `${singular}s`): string {
  return count === 1 ? singular : pluralValue;
}

export function buildProviderCoverageBrief(directory: ProviderDirectoryData): ProviderCoverageBrief {
  const total = directory.rows.length;
  const verifiedCount = directory.statusCounts.verified;
  const caveatedCount = directory.statusCounts.built + directory.statusCounts.proxy + directory.statusCounts.manual;
  const plannedCount = directory.statusCounts.planned;
  const verifiedReadyShare = percent(verifiedCount, directory.readyCount);
  const headline = total === 0
    ? "No provider coverage is mapped yet."
    : directory.readyCount === 0
      ? `${plannedCount} mapped ${plural(plannedCount, "provider")} still need a usable collection path.`
      : verifiedCount === 0
        ? "Usable paths exist, but none have endpoint-attested records yet."
        : caveatedCount === 0
          ? "Every usable provider path is endpoint-verified."
          : `Start with ${verifiedCount} endpoint-verified ${plural(verifiedCount, "rail")}. Treat ${caveatedCount} more as usable with caveats.`;

  return {
    headline,
    summary: "Verified rails have produced endpoint-attested records. Caveated rails can still collect usage through approximate adapters, local proxies, or explicit manual entries.",
    vectorLabel: `V ${verifiedCount} // C ${caveatedCount} // P ${plannedCount}`,
    coverageLabel: `${percent(directory.readyCount, total)}% usable`,
    verifiedCount,
    caveatedCount,
    plannedCount,
    verifiedShare: percent(verifiedCount, total),
    caveatedShare: percent(caveatedCount, total),
    plannedShare: percent(plannedCount, total),
    decisiveLabel: directory.readyCount > 0
      ? `${verifiedReadyShare}% of usable paths are endpoint-verified.`
      : "0 usable paths are available today.",
    nextAction: verifiedCount > 0
      ? "Inspect endpoint-verified rails first when evidence confidence matters most."
      : directory.readyCount > 0
        ? "Inspect usable rails and read each coverage caveat before connecting it."
        : "Inspect planned adapters and choose the next honest collection path to build.",
    recommendedStatus: verifiedCount > 0 ? "verified" : directory.readyCount > 0 ? "ready" : "planned",
  };
}

function relevance(row: ProviderRow, query: string): number {
  if (!query) return STATUS_ORDER[row.key] * 10;
  if (row.id === query) return 0;
  if (row.label === query) return 1;
  if (row.id.startsWith(query)) return 2;
  if (row.label.startsWith(query)) return 3;
  return 10 + STATUS_ORDER[row.key];
}

export function filterProviderRows(rows: ProviderRow[], filters: ProviderFilters): ProviderRow[] {
  const query = normalize(filters.query.trim());
  const tokens = query.split(/\s+/).filter(Boolean);

  return rows
    .filter((row) => {
      if (filters.status === "ready" && row.key === "planned") return false;
      if (filters.status !== "all" && filters.status !== "ready" && row.key !== filters.status) return false;
      if (filters.category !== "all" && !row.provider.categories.some((category) => category === filters.category)) return false;
      if (filters.domain !== "all" && row.provider.domain !== filters.domain) return false;
      return tokens.every((token) => row.haystack.includes(token));
    })
    .sort((a, b) => relevance(a, query) - relevance(b, query) || a.provider.label.localeCompare(b.provider.label));
}

export function pageProviderRows(rows: ProviderRow[], page: number, pageSize: number = PAGE_SIZE) {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(rows.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    pageCount,
    start,
    end: Math.min(start + safePageSize, rows.length),
    rows: rows.slice(start, start + safePageSize),
  };
}
