import { createConsoleTelemetry } from "../../../core/src/telemetry";
import { supabaseServer } from "./supabase";
import type {
  CategoryRank,
  LeaderboardCategory,
  LeaderboardFilters,
  LeaderboardRow,
  LeaderboardSort,
} from "./leaderboard-contract";

const telemetry = createConsoleTelemetry();
const MAX_BATCH_ROWS = 10_000;
const CATEGORY_ORDER = ["coding", "image", "video", "music", "audio", "llm", "3d", "other"] as const;
const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);

type ConcreteCategory = CategoryRank["category"];

interface QueryError {
  message: string;
  code?: string;
}

interface IdentityRecord {
  id?: unknown;
  canonical_handle?: unknown;
  display_name?: unknown;
  country?: unknown;
}

interface SubmissionRecord {
  id?: unknown;
  identity_id?: unknown;
  handle?: unknown;
  created_at?: unknown;
  vibetracker_submission_providers?: unknown;
  vibetracker_submission_provider_daily?: unknown;
  vibetracker_submission_provider_models?: unknown;
  vibetracker_submission_daily_usage?: unknown;
}

interface CategoryTotals {
  usd: number;
  ops: number;
}

interface LatestEntry {
  handle: string;
  displayName: string | null;
  country: string | null;
  attested: boolean;
  allTotals: CategoryTotals;
  categoryTotals: Map<ConcreteCategory, CategoryTotals>;
  topCategory: ConcreteCategory | null;
  activeDays: number;
  allModels: Set<string>;
  modelsByCategory: Map<ConcreteCategory, Set<string>>;
}

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    : [];
}

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHandle(value: unknown): string {
  return text(value)?.toLowerCase() ?? "";
}

function category(value: unknown): ConcreteCategory {
  const candidate = normalizeHandle(value);
  return CATEGORY_SET.has(candidate) ? candidate as ConcreteCategory : "other";
}

function country(value: unknown): string | null {
  return typeof value === "string" && /^[a-z]{2}$/.test(value) ? value : null;
}

function queryFailure(area: string, error: QueryError): Error {
  const failure = new Error(`${area}: ${error.message}`, { cause: error });
  telemetry.captureError(failure, {
    area: "web.leaderboard-data.query",
    severity: "error",
    operation: area,
    code: error.code ?? "unknown",
  });
  return failure;
}

async function fetchLatestEntries(): Promise<LatestEntry[]> {
  const sb = supabaseServer();
  const [submissionResult, identityResult] = await Promise.all([
    sb.from("vibetracker_submissions")
      .select(`
        id,identity_id,handle,created_at,
        vibetracker_submission_providers(ops,usd),
        vibetracker_submission_provider_daily(category,day,ops,credits,usd),
        vibetracker_submission_provider_models(category,model),
        vibetracker_submission_daily_usage(day,ops,credits,usd)
      `)
      .order("created_at", { ascending: false })
      .limit(MAX_BATCH_ROWS),
    sb.from("vibetracker_public_identities")
      .select("id,canonical_handle,display_name,country")
      .limit(MAX_BATCH_ROWS),
  ]);

  if (submissionResult.error) throw queryFailure("leaderboard.submissions", submissionResult.error);
  if (identityResult.error) throw queryFailure("leaderboard.identities", identityResult.error);

  const identities = new Map<string, IdentityRecord>();
  for (const identity of (identityResult.data ?? []) as IdentityRecord[]) {
    const id = text(identity.id);
    if (id) identities.set(id, identity);
  }

  // Server ordering makes the first row for an immutable identity or legacy handle its newest.
  // The local sort keeps mocked clients and non-order-preserving adapters deterministic too.
  const ordered = ((submissionResult.data ?? []) as SubmissionRecord[]).slice().sort((a, b) => {
    const aTime = Date.parse(text(a.created_at) ?? "") || 0;
    const bTime = Date.parse(text(b.created_at) ?? "") || 0;
    return bTime - aTime;
  });
  const latest = new Map<string, SubmissionRecord>();
  for (const submission of ordered) {
    const identityId = text(submission.identity_id);
    const legacyHandle = normalizeHandle(submission.handle);
    const key = identityId ? `identity:${identityId}` : legacyHandle ? `handle:${legacyHandle}` : "";
    if (key && !latest.has(key)) latest.set(key, submission);
  }

  const identityHandles = new Set<string>();
  for (const submission of latest.values()) {
    const identityId = text(submission.identity_id);
    const resolvedHandle = identityId ? normalizeHandle(identities.get(identityId)?.canonical_handle) : "";
    if (resolvedHandle) identityHandles.add(resolvedHandle);
  }

  return [...latest.values()].flatMap((submission): LatestEntry[] => {
    const identityId = text(submission.identity_id);
    const identity = identityId ? identities.get(identityId) : undefined;
    const handle = text(identity?.canonical_handle) ?? text(submission.handle);
    if (!handle) return [];
    if (!identityId && identityHandles.has(normalizeHandle(handle))) return [];

    const allTotals = records(submission.vibetracker_submission_providers).reduce<CategoryTotals>(
      (sum, row) => ({ usd: sum.usd + number(row.usd), ops: sum.ops + number(row.ops) }),
      { usd: 0, ops: 0 },
    );

    const categoryTotals = new Map<ConcreteCategory, CategoryTotals>();
    for (const row of records(submission.vibetracker_submission_provider_daily)) {
      const id = category(row.category);
      const current = categoryTotals.get(id) ?? { usd: 0, ops: 0 };
      current.usd += number(row.usd);
      current.ops += number(row.ops);
      categoryTotals.set(id, current);
    }
    const topCategory = [...categoryTotals.entries()]
      .sort(([aCategory, a], [bCategory, b]) => b.usd - a.usd || b.ops - a.ops || aCategory.localeCompare(bCategory))[0]?.[0] ?? null;

    const activeDays = new Set(
      records(submission.vibetracker_submission_daily_usage)
        .filter((row) => number(row.ops) > 0 || number(row.usd) > 0 || number(row.credits) > 0)
        .map((row) => text(row.day))
        .filter((day): day is string => Boolean(day)),
    ).size;

    const allModels = new Set<string>();
    const modelsByCategory = new Map<ConcreteCategory, Set<string>>();
    for (const row of records(submission.vibetracker_submission_provider_models)) {
      const model = text(row.model);
      if (!model) continue;
      const id = category(row.category);
      allModels.add(model);
      const models = modelsByCategory.get(id) ?? new Set<string>();
      models.add(model);
      modelsByCategory.set(id, models);
    }

    return [{
      handle,
      displayName: text(identity?.display_name),
      country: country(identity?.country),
      attested: Boolean(identityId),
      allTotals,
      categoryTotals,
      topCategory,
      activeDays,
      allModels,
      modelsByCategory,
    }];
  });
}

function rowFor(entry: LatestEntry, selected: LeaderboardCategory): LeaderboardRow {
  // The all board uses provider totals by design, which may diverge from the category-row sum.
  const totals = selected === "all"
    ? entry.allTotals
    : entry.categoryTotals.get(selected) ?? { usd: 0, ops: 0 };
  const modelCount = selected === "all"
    ? entry.allModels.size
    : entry.modelsByCategory.get(selected)?.size ?? 0;
  return {
    rank: 0,
    handle: entry.handle,
    displayName: entry.displayName,
    country: entry.country,
    totalUsd: totals.usd,
    totalOps: totals.ops,
    topCategory: entry.topCategory,
    activeDays: entry.activeDays,
    modelCount,
    attested: entry.attested,
  };
}

function rankedRows(entries: LatestEntry[], selected: LeaderboardCategory, sort: LeaderboardSort): LeaderboardRow[] {
  const metric = sort === "ops" ? "totalOps" : "totalUsd";
  const alternate = sort === "ops" ? "totalUsd" : "totalOps";
  return entries
    .map((entry) => rowFor(entry, selected))
    .filter((row) => selected === "all" || row.totalOps > 0 || row.totalUsd > 0)
    .sort((a, b) => b[metric] - a[metric] || b[alternate] - a[alternate] || a.handle.localeCompare(b.handle))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function fetchLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRow[]> {
  const entries = await fetchLatestEntries();
  const limit = filters.limit === undefined
    ? 100
    : Number.isFinite(filters.limit) ? Math.max(0, Math.floor(filters.limit)) : 100;
  return rankedRows(entries, filters.category, filters.sort).slice(0, limit);
}

export async function fetchCategoryRanks(handle: string): Promise<CategoryRank[]> {
  const entries = await fetchLatestEntries();
  const wanted = normalizeHandle(handle);
  if (!wanted) return [];

  return CATEGORY_ORDER.flatMap((selected): CategoryRank[] => {
    const board = rankedRows(entries, selected, "usd");
    const placement = board.find((row) => normalizeHandle(row.handle) === wanted && row.totalOps > 0);
    return placement ? [{
      category: selected,
      rank: placement.rank,
      of: board.length,
      usd: placement.totalUsd,
      ops: placement.totalOps,
    }] : [];
  });
}
