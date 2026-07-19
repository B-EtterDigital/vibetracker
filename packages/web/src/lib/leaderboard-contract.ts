// Planner-authored data contract for the category-aware leaderboard (SMOA run 2026-07-20).
// Lane L implements fetchLeaderboard/fetchCategoryRanks against these shapes; lane M renders
// them. Both lanes treat this file as read-only law; contract changes go through the planner.

export const LEADERBOARD_CATEGORIES = [
  "all",
  "coding",
  "image",
  "video",
  "music",
  "audio",
  "llm",
  "3d",
  "other",
] as const;
export type LeaderboardCategory = (typeof LEADERBOARD_CATEGORIES)[number];

export type LeaderboardSort = "usd" | "ops";

export interface LeaderboardFilters {
  category: LeaderboardCategory; // "all" = totals across categories
  sort: LeaderboardSort;
  limit?: number; // default 100
}

export interface LeaderboardRow {
  rank: number; // 1-based within the filtered board
  handle: string;
  displayName?: string | null;
  // ISO 3166-1 alpha-2, lowercase (e.g. "ch"); null = viber hasn't set one → render no flag
  country?: string | null;
  totalUsd: number; // API-equivalent USD within the filter
  totalOps: number;
  // the viber's highest-usd category (for the "all" board's info chip); null when unknown
  topCategory?: string | null;
  activeDays?: number | null;
  modelCount?: number | null;
  attested: boolean;
}

export interface CategoryRank {
  category: Exclude<LeaderboardCategory, "all">;
  rank: number; // 1-based
  of: number; // board size for that category (honesty caption: "#3 of 41 vibers")
  usd: number;
  ops: number;
}
