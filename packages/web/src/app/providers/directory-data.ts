import type { ProviderDescriptor } from "../../../../adapters/src/registry";

export type StatusKey = "verified" | "built" | "proxy" | "manual" | "planned";
export type StatusFilter = "all" | "ready" | StatusKey;
export type DomainFilter = "all" | ProviderDescriptor["domain"];

export const PAGE_SIZE = 24;
export const STATUS_KEYS: StatusKey[] = ["verified", "built", "proxy", "manual", "planned"];

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

export interface ProviderDirectoryData {
  rows: ProviderRow[];
  statusCounts: Record<StatusKey, number>;
  readyCount: number;
  categories: Array<[string, number]>;
}

export interface ProviderFilters {
  query: string;
  status: StatusFilter;
  category: string;
  domain: DomainFilter;
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

export function pageProviderRows(rows: ProviderRow[], page: number, pageSize = PAGE_SIZE) {
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
