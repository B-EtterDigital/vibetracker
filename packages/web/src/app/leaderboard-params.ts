// Pure, JSX-free helpers for the category-aware leaderboard redesign (SMOA run 2026-07-20,
// lane M). Everything the board needs to turn URL search params into planner-contract filters,
// and to derive a row's presentational strings, lives here so it can be unit-tested by real
// execution (node --test strips types but does not transform JSX, so the rendering components
// stay untested-by-import; their logic is proven here instead).
//
// This module treats leaderboard-contract.ts as read-only law and never fabricates data.

import {
  LEADERBOARD_CATEGORIES,
  type LeaderboardCategory,
  type LeaderboardFilters,
  type LeaderboardRow,
  type LeaderboardSort,
} from "../lib/leaderboard-contract.ts";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse the shareable URL (?cat=music&sort=ops) into the planner's LeaderboardFilters.
 * Unknown / missing params fall back to the "all" board sorted by spend — never an error.
 */
export function parseLeaderboardFilters(searchParams: SearchParams): LeaderboardFilters {
  const catRaw = (firstParam(searchParams.cat) ?? "").toLowerCase();
  const sortRaw = (firstParam(searchParams.sort) ?? "").toLowerCase();
  const category: LeaderboardCategory = (LEADERBOARD_CATEGORIES as readonly string[]).includes(catRaw)
    ? (catRaw as LeaderboardCategory)
    : "all";
  const sort: LeaderboardSort = sortRaw === "ops" ? "ops" : "usd";
  return { category, sort };
}

/**
 * Load a board through an injected fetcher. Keeping the fetch as a parameter is the seam the
 * unit test mocks: it proves the parsed category + sort flow into fetchLeaderboard verbatim,
 * with zero dependency on the parallel lane's real data module.
 */
export async function loadBoard(
  searchParams: SearchParams,
  fetchLeaderboard: (filters: LeaderboardFilters) => Promise<LeaderboardRow[]>,
): Promise<{ filters: LeaderboardFilters; rows: LeaderboardRow[] }> {
  const filters = parseLeaderboardFilters(searchParams);
  const rows = await fetchLeaderboard(filters);
  return { filters, rows };
}

/** Build a clean, shareable href, omitting the two defaults so the base board stays at "/". */
export function boardHref(category: LeaderboardCategory, sort: LeaderboardSort): string {
  const parts: string[] = [];
  if (category !== "all") parts.push(`cat=${category}`);
  if (sort !== "usd") parts.push(`sort=${sort}`);
  return parts.length ? `/?${parts.join("&")}` : "/";
}

/** Uppercase pill label for a category (ALL, CODING, IMAGE, …, 3D, OTHER). */
export function categoryPillLabel(category: LeaderboardCategory): string {
  return category.toUpperCase();
}

const DISCIPLINE_LABELS: Record<string, string> = {
  coding: "Coding",
  image: "Image",
  video: "Video",
  music: "Music",
  audio: "Audio",
  llm: "LLM",
  "3d": "3D",
  other: "Other",
};

/** Readable label for a viber's topCategory string; falls back to the raw value, never invents. */
export function disciplineLabel(category: string): string {
  const key = category.trim().toLowerCase();
  if (DISCIPLINE_LABELS[key]) return DISCIPLINE_LABELS[key];
  return category.trim();
}

/**
 * Turn an ISO 3166-1 alpha-2 code into a regional-indicator flag emoji. Returns null for any
 * unset / malformed code so the row renders NO placeholder — honesty over decoration.
 */
export function flagEmoji(country: string | null | undefined): string | null {
  if (!country) return null;
  const cc = country.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) return null;
  const base = 0x1f1e6; // regional indicator symbol letter A
  const a = base + (cc.charCodeAt(0) - 97);
  const b = base + (cc.charCodeAt(1) - 97);
  return String.fromCodePoint(a, b);
}

/**
 * The dim info line under a handle: "topCategory label · N models · N active days".
 * Any null / zero part is omitted; an all-null row yields "".
 */
export function rowInfoLine(row: Pick<LeaderboardRow, "topCategory" | "modelCount" | "activeDays">): string {
  const parts: string[] = [];
  if (row.topCategory) parts.push(disciplineLabel(row.topCategory));
  if (typeof row.modelCount === "number" && row.modelCount > 0) {
    parts.push(`${row.modelCount} model${row.modelCount === 1 ? "" : "s"}`);
  }
  if (typeof row.activeDays === "number" && row.activeDays > 0) {
    parts.push(`${row.activeDays} active day${row.activeDays === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

/** API-equivalent USD in the compact "$75.8K" house style. Non-positive → "$0". */
export function formatBoardUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "$0";
  const tier = (unit: number, suffix: string): string => {
    const s = (n / unit).toFixed(1).replace(/\.0$/, "");
    return `$${s}${suffix}`;
  };
  if (n >= 1e9) return tier(1e9, "B");
  if (n >= 1e6) return tier(1e6, "M");
  if (n >= 1e3) return tier(1e3, "K");
  return `$${Math.round(n)}`;
}

/** Compact integer for the dim ops line, matching the USD magnitude style (12.8K, 1.2M). */
export function formatCompactInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "0";
  const tier = (unit: number, suffix: string): string => {
    const s = (n / unit).toFixed(1).replace(/\.0$/, "");
    return `${s}${suffix}`;
  };
  if (n >= 1e9) return tier(1e9, "B");
  if (n >= 1e6) return tier(1e6, "M");
  if (n >= 1e3) return tier(1e3, "K");
  return String(Math.round(n));
}

/** Two-digit dim rank ("01", "12"); ranks past 99 render their full number. */
export function rankLabel(rank: number): string {
  return rank < 100 ? String(rank).padStart(2, "0") : String(rank);
}

/** Top-3 rows carry the mint emphasis treatment. */
export function isTopThree(rank: number): boolean {
  return rank >= 1 && rank <= 3;
}
