import { getLeaderboard } from "../lib/data";
import {
  buildLeaderboardArena,
  formatInt,
  formatUsd,
  type Tier,
} from "../lib/leaderboard";
import {
  LeaderboardConsole,
  type HomeBoardSnapshot,
} from "./home/leaderboard-console";
import "./home/home.css";

export const revalidate = 60;

function unavailableBoard(tier: Tier): HomeBoardSnapshot {
  return {
    tier,
    label: tier === "verified" ? "Verified" : "Self-reported",
    signal: tier === "verified" ? "BACKEND ATTESTED" : "USER DECLARED",
    blurb: tier === "verified"
      ? "Provider-backed aggregate usage. Trust evidence remains separate."
      : "Public user-declared aggregate usage, never mixed with verified rank.",
    status: "error",
    rows: [],
    totals: {
      operators: "0",
      usd: "$0.00",
      credits: "0",
      ops: "0",
    },
  };
}

async function loadBoard(tier: Tier): Promise<HomeBoardSnapshot> {
  try {
    const arena = buildLeaderboardArena(tier, await getLeaderboard(tier));
    return {
      tier,
      label: arena.label,
      signal: tier === "verified" ? "BACKEND ATTESTED" : "USER DECLARED",
      blurb: arena.blurb,
      status: arena.rows.length ? "live" : "waiting",
      totals: {
        operators: formatInt(arena.rows.length),
        usd: formatUsd(arena.totalUsd),
        credits: formatInt(arena.totalCredits),
        ops: formatInt(arena.totalOps),
      },
      rows: arena.rows.map((row) => ({
        handle: row.handle,
        rank: row.rank,
        medal: row.medal,
        usd: row.total_usd,
        usdLabel: formatUsd(row.total_usd),
        creditsLabel: formatInt(row.total_credits),
        opsLabel: formatInt(row.record_count),
      })),
    };
  } catch {
    // getLeaderboard records the diagnostic through VTRS; this is the safe public state.
    return unavailableBoard(tier);
  }
}

export default async function Home() {
  const [verified, selfReported] = await Promise.all([
    loadBoard("verified"),
    loadBoard("self_reported"),
  ]);

  return (
    <div className="home-surface">
      <LeaderboardConsole boards={[verified, selfReported]} />
    </div>
  );
}
