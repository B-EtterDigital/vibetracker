// Home = the category-aware public leaderboard (SMOA lane M redesign, 2026-07-20). A server
// component: it reads the shareable URL search params (?cat=music&sort=ops), parses them into the
// planner-contract LeaderboardFilters, and hands those straight to fetchLeaderboard. The board is
// rendered exactly from what the data layer returns — no invented rows, flags, or ranks.
//
// Resilience: the leaderboard is optional data. If fetchLeaderboard rejects, the route does NOT
// crash — it breadcrumbs the failure (mirroring data.ts's reportOptionalFallback) and renders the
// existing empty-board state. loadBoard(sp, fetchLeaderboard) is the injected-fetch seam.
import { fetchLeaderboard } from "../lib/leaderboard-data";
import type { LeaderboardRow } from "../lib/leaderboard-contract";
import { LeaderboardBoard } from "./home/leaderboard-board";
import { loadBoard, parseLeaderboardFilters } from "./leaderboard-params";
import { createConsoleTelemetry } from "../../../core/src/telemetry";
import "./home/home.css";
import "./home/leaderboard.css";

const telemetry = createConsoleTelemetry();

// Mirrors data.ts's reportOptionalFallback: a degraded optional data load is a warn breadcrumb
// routed to VTRS, never a thrown page.
function reportOptionalFallback(event: string, error: unknown): void {
  const e = error as { message?: string; code?: string };
  telemetry.addBreadcrumb(event, {
    area: "web.home.optional-data",
    code: e?.code ?? "unknown",
    message: e?.message ?? String(error),
  }, "warn");
}

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Optional data: a failed board load degrades to the empty state, never a crashed route.
  let filters = parseLeaderboardFilters(sp);
  let rows: LeaderboardRow[] = [];
  try {
    ({ filters, rows } = await loadBoard(sp, fetchLeaderboard));
  } catch (error) {
    reportOptionalFallback("home.leaderboard.fallback", error);
  }

  return (
    <div className="home-surface">
      <LeaderboardBoard filters={filters} rows={rows} />
    </div>
  );
}
