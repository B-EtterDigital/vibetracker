// Live board ticker — the looping strip above the header. Every number is REAL, computed from
// the same leaderboard views and submissions the boards render; nothing is mocked. Rendered on
// the server (revalidates with the layout), animated with a pure-CSS marquee that respects
// prefers-reduced-motion. The item list is duplicated once so the loop is seamless.

import { supabaseServer } from "../lib/supabase";
import { createConsoleTelemetry } from "../../../core/src/telemetry";
import { CLI_RUNNER } from "../lib/cli-command.ts";

const telemetry = createConsoleTelemetry();

interface TickerFacts {
  leaderHandle: string;
  leaderUsd: number;
  vibers: number;
  totalUsd: number;
  totalTokens: number;
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  return String(Math.round(n));
}

async function tickerFacts(): Promise<TickerFacts | null> {
  try {
    const sb = supabaseServer();
    const [{ data: rows, error }, { data: tokenRows, error: tokenError }] = await Promise.all([
      sb.from("vibetracker_leaderboard_self_reported")
        .select("handle,total_usd")
        .order("total_usd", { ascending: false })
        .limit(500),
      sb.from("vibetracker_submissions")
        .select("handle,total_tokens,created_at")
        .not("total_tokens", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (error || !rows?.length) {
      if (error) telemetry.addBreadcrumb("web.ticker.leaderboard_unavailable", { message: error.message }, "warn");
      return null;
    }
    // one token figure per handle — the newest submission wins (rows arrive newest-first)
    const tokensByHandle = new Map<string, number>();
    if (tokenError) {
      telemetry.addBreadcrumb("web.ticker.tokens_unavailable", { message: tokenError.message }, "warn");
    }
    for (const row of (tokenRows ?? []) as Array<{ handle: string | null; total_tokens: number | null }>) {
      if (row.handle && row.total_tokens && !tokensByHandle.has(row.handle)) {
        tokensByHandle.set(row.handle, row.total_tokens);
      }
    }
    const leaders = rows as Array<{ handle: string; total_usd: number }>;
    return {
      leaderHandle: leaders[0].handle,
      leaderUsd: leaders[0].total_usd,
      vibers: leaders.length,
      totalUsd: leaders.reduce((sum, r) => sum + (r.total_usd ?? 0), 0),
      totalTokens: [...tokensByHandle.values()].reduce((sum, t) => sum + t, 0),
    };
  } catch (err) {
    telemetry.captureError(err, { area: "web.ticker.facts", severity: "warn" });
    return null;
  }
}

export async function SiteTicker() {
  const facts = await tickerFacts();
  if (!facts) return null;

  const items = [
    `${facts.leaderHandle} leads at ${fmtUsd(facts.leaderUsd)}`,
    `run ${CLI_RUNNER} to join`,
    `${facts.vibers} viber${facts.vibers === 1 ? "" : "s"} on the board`,
    `${fmtUsd(facts.totalUsd)} tracked`,
    ...(facts.totalTokens > 0 ? [`${fmtTokens(facts.totalTokens)} tokens burned`] : []),
  ];

  const strip = (keyPrefix: string, hidden: boolean) => (
    <span className="vticker-strip" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span className="vticker-item" key={`${keyPrefix}-${i}`}>
          {item}
          <i aria-hidden="true">·</i>
        </span>
      ))}
    </span>
  );

  return (
    <aside className="vticker" aria-label="Live board stats">
      <div className="vticker-track">
        {strip("a", false)}
        {strip("b", true)}
      </div>
    </aside>
  );
}
