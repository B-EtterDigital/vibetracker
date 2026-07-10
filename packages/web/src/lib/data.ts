import { supabaseServer } from "./supabase";
import type { LeaderRow, Tier } from "./leaderboard";
import { publicTrustSignals, type ProfileTrustSignal } from "./profile-trust";
import { createConsoleTelemetry } from "../../../core/src/telemetry";

const telemetry = createConsoleTelemetry();

interface QueryFailure {
  message: string;
  code?: string;
}

function queryFailure(area: string, error: QueryFailure): Error {
  return new Error(`${area}: ${error.message}`, { cause: error });
}

function reportOptionalFallback(event: string, error: QueryFailure): void {
  telemetry.addBreadcrumb(event, {
    area: "web.profile.optional-data",
    code: error.code ?? "unknown",
    message: error.message,
  }, "warn");
}

// The two public boards map to the C0VIBE-hosted views. "verified" here surfaces the
// attested board (real WorkOS accounts); self-reported stays separate (never mixed).
export async function getLeaderboard(tier: Tier): Promise<LeaderRow[]> {
  const view = tier === "verified" ? "vibetracker_leaderboard_attested" : "vibetracker_leaderboard_self_reported";
  const { data, error } = await supabaseServer()
    .from(view).select("*").order("total_usd", { ascending: false }).limit(100);
  if (error) {
    const failure = queryFailure(`leaderboard(${tier})`, error);
    telemetry.captureError(failure, {
      area: "web.leaderboard.query",
      severity: "error",
      tier,
      view,
      code: error.code,
    });
    throw failure;
  }
  return (data ?? []) as LeaderRow[];
}

export interface ProfileView {
  handle: string;
  created_at: string;
  isPremium: boolean;
  latest: { total_usd: number; total_credits: number; record_count: number; created_at: string; tier: string } | null;
  providers: Array<{ provider: string; ops: number; credits: number; usd: number }>;
  usageDays: Array<{ date: string; ops: number; credits: number; usd: number }>;
  trustSignals: ProfileTrustSignal[];
}

async function latestFor(filter: { user_id: string } | { handle: string }): Promise<ProfileView["latest"] & { id: string } | null> {
  const sb = supabaseServer();
  let q = sb.from("vibetracker_submissions").select("*").order("created_at", { ascending: false }).limit(1);
  q = "user_id" in filter ? q.eq("user_id", filter.user_id) : q.eq("handle", filter.handle);
  const { data, error } = await q;
  if (error) throw queryFailure("profile.latest", error);
  return (data?.[0] as (ProfileView["latest"] & { id: string }) | undefined) ?? null;
}

async function trustSignalsFor(submissionId: string): Promise<ProfileTrustSignal[]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_trust_signals")
    .select("payload")
    .eq("submission_id", submissionId)
    .limit(8);
  // Older C0VIBE deployments may not have this additive table yet; profile pages should
  // still render usage totals while the migration rolls forward.
  if (error) {
    reportOptionalFallback("profile.trust-signals.fallback", error);
    return [];
  }
  return publicTrustSignals((data ?? []).map((row) => (row as { payload?: unknown }).payload));
}

async function usageDaysFor(submissionId: string): Promise<ProfileView["usageDays"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_daily_usage")
    .select("day,ops,credits,usd")
    .eq("submission_id", submissionId)
    .order("day", { ascending: true })
    .limit(366);
  // Older C0VIBE deployments may not have this additive table yet; profile pages should
  // fall back to the upload-day aggregate instead of failing the public profile.
  if (error) {
    reportOptionalFallback("profile.daily-usage.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { day?: string; ops?: number; credits?: number; usd?: number };
    return {
      date: String(r.day ?? ""),
      ops: Number(r.ops ?? 0),
      credits: Number(r.credits ?? 0),
      usd: Number(r.usd ?? 0),
    };
  }).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
}

export async function getProfile(handle: string): Promise<ProfileView | null> {
  try {
    const sb = supabaseServer();
    // Prefer a real C0VIBE account handle; fall back to an anonymous self-reported handle.
    const { data: h, error: handleError } = await sb.from("user_handles")
      .select("user_id,handle,is_premium,created_at").eq("handle", handle).maybeSingle();
    if (handleError) throw queryFailure("profile.handle", handleError);

    const latest = h?.user_id ? await latestFor({ user_id: h.user_id }) : await latestFor({ handle });
    if (!h && !latest) return null;

    let providers: ProfileView["providers"] = [];
    if (latest) {
      const { data, error } = await sb.from("vibetracker_submission_providers")
        .select("provider,ops,credits,usd")
        .eq("submission_id", latest.id);
      if (error) throw queryFailure("profile.providers", error);
      providers = (data ?? []) as ProfileView["providers"];
    }

    const usageDays = latest ? await usageDaysFor(latest.id) : [];
    const trustSignals = latest ? await trustSignalsFor(latest.id) : [];

    return {
      handle: h?.handle ?? handle,
      created_at: h?.created_at ?? latest?.created_at ?? "",
      isPremium: Boolean(h?.is_premium),
      latest: latest ? { total_usd: latest.total_usd, total_credits: latest.total_credits, record_count: latest.record_count, created_at: latest.created_at, tier: latest.tier } : null,
      providers,
      usageDays,
      trustSignals,
    };
  } catch (error) {
    telemetry.captureError(error, {
      area: "web.profile.load",
      severity: "error",
      handle,
    });
    throw error;
  }
}
