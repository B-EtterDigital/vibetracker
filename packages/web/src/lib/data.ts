import { supabaseServer } from "./supabase";
import type { LeaderRow, Tier } from "./leaderboard";
import { publicTrustSignals, type ProfileTrustSignal } from "./profile-trust";
import { createConsoleTelemetry } from "../../../core/src/telemetry";
import { normalizeOrchestration, type OrchestrationTrace } from "./profile-orchestration-data";

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

// Browser-capture provider ids carry a "-web" suffix — the same source as the base id. Merge them
// at the loading boundary so EVERY downstream (breadth count, complexity, provider mix, charts)
// sees one canonical source, not two (SMOA re-audit #6).
function canonicalProviderId(id: string): string {
  return id.endsWith("-web") ? id.slice(0, -4) : id;
}
function mergeByCanonicalProvider<T extends { provider: string; ops: number; credits: number; usd: number }>(rows: T[]): T[] {
  const merged = new Map<string, T>();
  for (const row of rows) {
    const provider = canonicalProviderId(row.provider);
    const cur = merged.get(provider);
    if (cur) { cur.ops += row.ops; cur.credits += row.credits; cur.usd += row.usd; }
    else merged.set(provider, { ...row, provider });
  }
  return [...merged.values()];
}

export interface ProfileView {
  handle: string;
  created_at: string;
  isPremium: boolean;
  bio?: string;
  // Self-reported truths the usage data can't reveal (real parallel-agent count, real sub stack).
  selfReportedAgents?: number;
  selfReportedSubs?: string;
  // Local derived orchestration trace from bounded gaps between session timestamps.
  orchestration?: OrchestrationTrace;
  identityVerified?: boolean;
  identityProvider?: string;
  accountLinked?: boolean;
  latest: { total_usd: number; total_credits: number; record_count: number; created_at: string; tier: string } | null;
  providers: Array<{ provider: string; ops: number; credits: number; usd: number }>;
  tools?: Array<{ tool: string; ops: number }>;
  usageDays: Array<{ date: string; ops: number; credits: number; usd: number }>;
  categories: Array<{ category: string; ops: number; credits: number; usd: number }>;
  providerDays: Array<{ provider: string; category?: string | null; date: string; ops: number; credits: number; usd: number }>;
  providerModels: Array<{ provider: string; model: string; category?: string | null; ops: number; credits: number; usd: number }>;
  nativeMetrics?: Array<{ provider: string; category: string; outputUnit: string; outputs: number; durationSeconds: number }>;
  trustSignals: ProfileTrustSignal[];
  // Additive aggregates — optional so demo/fixture ProfileView constructors need not supply them.
  totalTokens?: number;
  crossProviderDays?: number;
  tokenBreakdown?: Array<{ scope: string; input: number; output: number; cacheRead: number; cacheCreation: number }>;
  agents?: Array<{ agent: string; activeDays: number; cost: number; tokens: number }>;
  rank?: number | null;
}

async function latestFor(filter: { user_id: string } | { identity_id: string } | { handle: string }): Promise<ProfileView["latest"] & { id: string } | null> {
  const sb = supabaseServer();
  let q = sb.from("vibetracker_submissions").select("*").order("created_at", { ascending: false }).limit(1);
  q = "user_id" in filter
    ? q.eq("user_id", filter.user_id)
    : "identity_id" in filter
      ? q.eq("identity_id", filter.identity_id)
      : q.eq("handle", filter.handle);
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
    // DESC so a >366-day viber keeps their RECENT days (busiest day, current streak, "since"),
    // not their oldest 366 (SMOA re-audit #5); 800 covers the 730-day complexity tier. Restored to
    // chronological order below for the charts.
    .order("day", { ascending: false })
    .limit(800);
  // Older C0VIBE deployments may not have this additive table yet; profile pages should
  // fall back to the upload-day aggregate instead of failing the public profile.
  if (error) {
    reportOptionalFallback("profile.daily-usage.fallback", error);
    return [];
  }
  return (data ?? []).slice().reverse().map((row) => {
    const r = row as { day?: string; ops?: number; credits?: number; usd?: number };
    return {
      date: String(r.day ?? ""),
      ops: Number(r.ops ?? 0),
      credits: Number(r.credits ?? 0),
      usd: Number(r.usd ?? 0),
    };
  }).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
}

async function categoriesFor(submissionId: string): Promise<ProfileView["categories"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_categories")
    .select("category,ops,credits,usd")
    .eq("submission_id", submissionId)
    .limit(40);
  // Additive table — older C0VIBE deployments predate it. The profile page falls back to
  // a provider-primary category rollup when this returns empty, so it never fails the page.
  if (error) {
    reportOptionalFallback("profile.categories.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { category?: string; ops?: number; credits?: number; usd?: number };
    return {
      category: String(r.category ?? ""),
      ops: Number(r.ops ?? 0),
      credits: Number(r.credits ?? 0),
      usd: Number(r.usd ?? 0),
    };
  }).filter((row) => row.category.length > 0);
}

async function providerDaysFor(submissionId: string): Promise<ProfileView["providerDays"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_provider_daily")
    .select("provider,category,day,ops,credits,usd")
    .eq("submission_id", submissionId)
    .order("provider", { ascending: true })
    .order("day", { ascending: true })
    .limit(8000);
  // Additive table — older deployments predate it. The chart falls back to the combined
  // daily series when this returns empty, so per-provider interaction just stays off.
  if (error) {
    reportOptionalFallback("profile.provider-daily.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { provider?: string; category?: string | null; day?: string; ops?: number; credits?: number; usd?: number };
    return {
      provider: String(r.provider ?? ""),
      category: r.category ?? null,
      date: String(r.day ?? ""),
      ops: Number(r.ops ?? 0),
      credits: Number(r.credits ?? 0),
      usd: Number(r.usd ?? 0),
    };
  }).filter((row) => row.provider.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(row.date));
}

async function tokenBreakdownFor(submissionId: string): Promise<ProfileView["tokenBreakdown"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_tokens")
    .select("scope,input,output,cache_read,cache_creation")
    .eq("submission_id", submissionId)
    .limit(40);
  if (error) {
    reportOptionalFallback("profile.tokens.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { scope?: string; input?: number; output?: number; cache_read?: number; cache_creation?: number };
    return {
      scope: String(r.scope ?? ""),
      input: Number(r.input ?? 0),
      output: Number(r.output ?? 0),
      cacheRead: Number(r.cache_read ?? 0),
      cacheCreation: Number(r.cache_creation ?? 0),
    };
  }).filter((row) => row.scope.length > 0);
}

async function agentsFor(submissionId: string): Promise<ProfileView["agents"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_agents")
    .select("agent,active_days,cost,tokens")
    .eq("submission_id", submissionId)
    .order("cost", { ascending: false })
    .limit(32);
  if (error) {
    reportOptionalFallback("profile.agents.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { agent?: string; active_days?: number; cost?: number; tokens?: number };
    return {
      agent: String(r.agent ?? ""),
      activeDays: Number(r.active_days ?? 0),
      cost: Number(r.cost ?? 0),
      tokens: Number(r.tokens ?? 0),
    };
  }).filter((row) => row.agent.length > 0);
}

// The viber's position on the public board for their tier — a "#N global rank" like the C0VIBE
// profile. Ranked by total_usd within the same trust tier; null when the handle isn't on a board.
async function rankFor(handle: string, tier: string): Promise<number | null> {
  const view = tier === "verified" ? "vibetracker_leaderboard_attested" : "vibetracker_leaderboard_self_reported";
  const { data, error } = await supabaseServer()
    .from(view).select("handle,total_usd").order("total_usd", { ascending: false }).limit(500);
  if (error) {
    reportOptionalFallback("profile.rank.fallback", error);
    return null;
  }
  const idx = (data ?? []).findIndex((row) => (row as { handle?: string }).handle === handle);
  return idx >= 0 ? idx + 1 : null;
}

async function providerModelsFor(submissionId: string): Promise<ProfileView["providerModels"]> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_provider_models")
    .select("provider,model,category,ops,credits,usd")
    .eq("submission_id", submissionId)
    .limit(2000);
  if (error) {
    reportOptionalFallback("profile.provider-models.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { provider?: string; model?: string; category?: string | null; ops?: number; credits?: number; usd?: number };
    return {
      provider: String(r.provider ?? ""),
      model: String(r.model ?? ""),
      category: r.category ?? null,
      ops: Number(r.ops ?? 0),
      credits: Number(r.credits ?? 0),
      usd: Number(r.usd ?? 0),
    };
  }).filter((row) => row.provider.length > 0 && row.model.length > 0);
}

async function nativeMetricsFor(submissionId: string): Promise<NonNullable<ProfileView["nativeMetrics"]>> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_native_metrics")
    .select("provider,category,output_unit,outputs,duration_seconds")
    .eq("submission_id", submissionId)
    .limit(2000);
  if (error) {
    reportOptionalFallback("profile.native-metrics.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as {
      provider?: string;
      category?: string;
      output_unit?: string;
      outputs?: number;
      duration_seconds?: number;
    };
    return {
      provider: String(r.provider ?? ""),
      category: String(r.category ?? ""),
      outputUnit: String(r.output_unit ?? ""),
      outputs: Number(r.outputs ?? 0),
      durationSeconds: Number(r.duration_seconds ?? 0),
    };
  }).filter((row) => row.provider.length > 0 && row.category.length > 0 && row.outputUnit.length > 0);
}

async function toolsFor(submissionId: string): Promise<NonNullable<ProfileView["tools"]>> {
  const { data, error } = await supabaseServer()
    .from("vibetracker_submission_tools")
    .select("tool,ops")
    .eq("submission_id", submissionId)
    .order("ops", { ascending: false })
    .limit(2000);
  if (error) {
    reportOptionalFallback("profile.tools.fallback", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { tool?: string; ops?: number };
    return { tool: String(r.tool ?? ""), ops: Number(r.ops ?? 0) };
  }).filter((row) => row.tool.length > 0 && row.ops > 0);
}

export async function getProfile(handle: string): Promise<ProfileView | null> {
  try {
    const sb = supabaseServer();
    // Prefer a real C0VIBE account handle; fall back to an anonymous self-reported handle.
    const { data: h, error: handleError } = await sb.from("user_handles")
      .select("user_id,handle,is_premium,created_at").eq("handle", handle).maybeSingle();
    if (handleError) throw queryFailure("profile.handle", handleError);

    const { data: identity, error: identityError } = await sb.from("vibetracker_public_identities")
      .select("id,provider,canonical_handle,verified_at,created_at,account_linked,is_premium")
      .eq("canonical_handle", handle.toLowerCase()).maybeSingle();
    // The identity bridge is additive. During a rolling migration, existing WorkOS and anonymous
    // profiles must keep rendering instead of turning a missing view into a public outage.
    if (identityError) reportOptionalFallback("profile.identity.fallback", identityError);

    const latest = identity?.id
      ? await latestFor({ identity_id: identity.id })
      : h?.user_id
        ? await latestFor({ user_id: h.user_id })
        : await latestFor({ handle });
    if (!h && !identity && !latest) return null;

    let providers: ProfileView["providers"] = [];
    if (latest) {
      const { data, error } = await sb.from("vibetracker_submission_providers")
        .select("provider,ops,credits,usd")
        .eq("submission_id", latest.id);
      if (error) throw queryFailure("profile.providers", error);
      providers = mergeByCanonicalProvider((data ?? []) as ProfileView["providers"]);
    }

    const usageDays = latest ? await usageDaysFor(latest.id) : [];
    const categories = latest ? await categoriesFor(latest.id) : [];
    const providerDays = latest ? await providerDaysFor(latest.id) : [];
    const providerModels = latest ? await providerModelsFor(latest.id) : [];
    const nativeMetrics = latest ? await nativeMetricsFor(latest.id) : [];
    const tools = latest ? await toolsFor(latest.id) : [];
    const trustSignals = latest ? await trustSignalsFor(latest.id) : [];
    const tokenBreakdown = latest ? await tokenBreakdownFor(latest.id) : [];
    const agents = latest ? await agentsFor(latest.id) : [];
    const rank = latest ? await rankFor(identity?.canonical_handle ?? h?.handle ?? handle, latest.tier) : null;

    return {
      handle: identity?.canonical_handle ?? h?.handle ?? handle,
      created_at: identity?.created_at ?? h?.created_at ?? latest?.created_at ?? "",
      isPremium: Boolean(identity?.is_premium ?? h?.is_premium),
      // The viber's own bio, set with `npx vibetrack profile --bio` and carried on the submission.
      // Additive column — older rows return undefined and the profile shows the "add a bio" hint.
      bio: (latest as { bio?: string | null } | null)?.bio?.trim() || undefined,
      identityVerified: Boolean(identity?.verified_at || h?.user_id),
      identityProvider: identity?.provider ?? (h?.user_id ? "c0vibe" : undefined),
      accountLinked: Boolean(identity?.account_linked || h?.user_id),
      latest: latest ? { total_usd: latest.total_usd, total_credits: latest.total_credits, record_count: latest.record_count, created_at: latest.created_at, tier: latest.tier } : null,
      providers,
      usageDays,
      categories,
      providerDays,
      providerModels,
      nativeMetrics,
      tools,
      trustSignals,
      totalTokens: Number((latest as { total_tokens?: number } | null)?.total_tokens ?? 0),
      crossProviderDays: Number((latest as { cross_provider_days?: number } | null)?.cross_provider_days ?? 0),
      selfReportedAgents: (latest as { self_reported_agents?: number | null } | null)?.self_reported_agents ?? undefined,
      selfReportedSubs: (latest as { self_reported_subs?: string | null } | null)?.self_reported_subs ?? undefined,
      orchestration: normalizeOrchestration((latest as { orchestration?: unknown } | null)?.orchestration),
      tokenBreakdown,
      agents,
      rank,
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
