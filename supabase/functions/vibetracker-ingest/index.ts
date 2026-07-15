// Supabase Edge Function (Deno) — VibeTRACKER upload ingest for the C0VIBE project.
// Deploy: supabase functions deploy vibetracker-ingest --use-api   (project tnsaqsqajpjbvlpasojt)
//
// Security: verifies the caller's Supabase/WorkOS session (if any) → attested identity;
// handleIngest sets tier from that (never the client), and ONLY aggregates are written to
// the vibetracker_* tables (no individual records / prompts / keys). Writes use the service
// role because RLS gives the public read-only access — the sole write path (no self-promotion).
//
// ⚠ Deploy note: handleIngest is imported from the VibeTRACKER backend; bundle it alongside
//    this function (co-locate or vendor) when deploying into the C0X supabase project.

import { handleIngest } from "../../../packages/backend/src/ingest.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore Deno global provided by the edge runtime
const env = (k: string) => (globalThis as any).Deno?.env.get(k);
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function optionalTrustSignalStorageError(message: string): boolean {
  return /vibetracker_submission_trust_signals|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalDailyUsageStorageError(message: string): boolean {
  return /vibetracker_submission_daily_usage|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalCategoryStorageError(message: string): boolean {
  return /vibetracker_submission_categories|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalProviderDailyStorageError(message: string): boolean {
  return /vibetracker_submission_provider_daily|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalProviderModelStorageError(message: string): boolean {
  return /vibetracker_submission_provider_models|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalNativeMetricStorageError(message: string): boolean {
  return /vibetracker_submission_native_metrics|schema cache|does not exist|relation .* not found/i.test(message);
}

function optionalToolStorageError(message: string): boolean {
  return /vibetracker_submission_tools|schema cache|does not exist|relation .* not found/i.test(message);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// @ts-ignore Deno.serve provided by the edge runtime
(globalThis as any).Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (err) {
    return json({ ok: false, error: `invalid JSON: ${(err as Error).message}` }, 400);
  }

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  // Attested identity: validate the CLI bearer token (compared by hash) → WorkOS user and/or
  // immutable GitHub identity. A later WorkOS link is resolved dynamically from the identity.
  let userId: string | undefined;
  let identityId: string | undefined;
  let identityHandle: string | undefined;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const tokenHash = await sha256Hex(auth.slice(7));
    const { data: tok } = await admin.from("vibetracker_cli_tokens")
      .select("user_id,identity_id,expires_at,revoked").eq("token_hash", tokenHash).maybeSingle();
    if (tok && !tok.revoked && new Date(tok.expires_at) > new Date()) {
      userId = typeof tok.user_id === "string" ? tok.user_id : undefined;
      identityId = typeof tok.identity_id === "string" ? tok.identity_id : undefined;
      if (identityId) {
        const { data: identity } = await admin.from("vibetracker_identities")
          .select("id,user_id,canonical_handle").eq("id", identityId).maybeSingle();
        if (!identity) {
          identityId = undefined;
        } else {
          userId = userId ?? (typeof identity.user_id === "string" ? identity.user_id : undefined);
          identityHandle = typeof identity.canonical_handle === "string" ? identity.canonical_handle : undefined;
        }
      }
      if (userId || identityId) {
        await admin.from("vibetracker_cli_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash);
      }
    }
  }

  // aggregates only; tier from auth. handleIngest is also the shared handle guard:
  // it rejects the reserved "demo" handle (bundled sample profile) by defaulting it to
  // anonymous, so this write path can never insert a row that shadows /u/demo.
  const result = handleIngest(payload, { userId, identityId });
  const publicHandle = identityHandle ?? result.handle;

  if (userId) {
    await admin.from("vibetracker_members").upsert({ user_id: userId }, { onConflict: "user_id" });
  }

  // The viber's own bio: client-supplied free text, capped and stripped of control chars. It is
  // profile decoration only — never usage — so it rides on the submission row, not the aggregates.
  const rawBio = (payload as { bio?: unknown } | null)?.bio;
  const bio = typeof rawBio === "string"
    ? rawBio.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || null
    : null;

  // Token-breakdown + agent (delegation) aggregates ride alongside the bundle as side-channels,
  // like trust signals — no per-record schema change. Validated to finite non-negative numbers.
  const nn = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : 0);
  const rawTokens = (payload as { tokenBreakdown?: { total?: Record<string, unknown>; byProvider?: unknown[] } } | null)?.tokenBreakdown;
  const rawAgents = (payload as { agents?: { crossProviderDays?: unknown; agents?: unknown[] } } | null)?.agents;
  const totalTokens = rawTokens?.total ? Object.values(rawTokens.total).reduce((s: number, v) => s + nn(v), 0) : 0;
  const crossProviderDays = nn(rawAgents?.crossProviderDays);

  // Self-reported truths the data can't reveal (real parallel-agent count, real subscription stack).
  // Client-supplied and clearly labelled self-reported on the profile — never treated as measured.
  const rawSelf = (payload as { selfReported?: { parallelAgents?: unknown; subs?: unknown } } | null)?.selfReported;
  const selfAgentsRaw = Number(rawSelf?.parallelAgents);
  const selfReportedAgents = Number.isFinite(selfAgentsRaw) && selfAgentsRaw > 0 && selfAgentsRaw <= 1000
    ? Math.floor(selfAgentsRaw) : null;
  const selfReportedSubs = typeof rawSelf?.subs === "string"
    ? rawSelf.subs.replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || null : null;

  // Local derived orchestration evidence reconstructed by the CLI from bounded session-event
  // gaps. This is not exact runtime, billing time, human effort, or verified concurrency.
  // Accept JSON numbers only: strings and booleans must never be coerced into public metrics.
  const boundedNumber = (value: unknown, max: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.min(value, max) : 0;
  const boundedInt = (value: unknown, max: number) => Math.floor(boundedNumber(value, max));
  const rawOrch = (payload as { orchestration?: Record<string, unknown> } | null)?.orchestration;
  const orchestration = rawOrch && typeof rawOrch === "object" && !Array.isArray(rawOrch) ? (() => {
    const activityHours = boundedNumber(rawOrch.activityHours, 1_000_000);
    const wallHours = Math.min(boundedNumber(rawOrch.wallHours, 1_000_000), activityHours);
    const filesScanned = boundedInt(rawOrch.filesScanned, 10_000_000);
    const filesAvailable = Math.max(filesScanned, boundedInt(rawOrch.filesAvailable, 10_000_000));
    const sessionFiles = Math.min(boundedInt(rawOrch.sessionFiles, 10_000_000), filesScanned);
    const sampledFiles = Math.min(boundedInt(rawOrch.sampledFiles, 10_000_000), filesScanned);
    return {
      activityHours,
      wallHours,
      overlapRatio: wallHours > 0 ? Math.round((activityHours / wallHours) * 10) / 10 : 0,
      peakOverlap: Math.min(boundedInt(rawOrch.peakOverlap, 100_000), Math.max(1, sessionFiles)),
      nightStarts: boundedInt(rawOrch.nightStarts, 10_000_000),
      longestSpanHours: Math.min(boundedNumber(rawOrch.longestSpanHours, 100_000), activityHours),
      sessionFiles,
      windowDays: Math.max(1, Math.min(31, boundedInt(rawOrch.windowDays, 31))),
      filesAvailable,
      filesScanned,
      sampledFiles,
      readBytes: boundedInt(rawOrch.readBytes, 10_737_418_240),
      limited: rawOrch.limited === true || filesScanned < filesAvailable,
    };
  })() : null;
  const hasOrch = orchestration
    && orchestration.activityHours > 0
    && orchestration.wallHours > 0
    && orchestration.sessionFiles > 0
    && orchestration.filesScanned > 0;

  const { data: sub, error: sErr } = await admin.from("vibetracker_submissions").insert({
    user_id: userId ?? null,
    identity_id: identityId ?? null,
    handle: userId ? null : publicHandle,    // WorkOS rows use account handles; GitHub-first keeps its stable handle
    tier: result.tier,                       // 'attested' | 'self_reported' — never client-supplied
    record_count: result.accepted,
    total_credits: result.totals.credits,
    total_usd: result.totals.usd ?? 0,
    total_tokens: totalTokens,
    cross_provider_days: crossProviderDays,
    self_reported_agents: selfReportedAgents,
    self_reported_subs: selfReportedSubs,
    orchestration: hasOrch ? orchestration : null,
    bio,
  }).select("id").single();
  if (sErr) return json({ ok: false, error: `submission: ${sErr.message}` }, 500);

  if (result.byProvider.length) {
    const rows = result.byProvider.map((r) => ({
      submission_id: sub.id, provider: r.provider, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: bpErr } = await admin.from("vibetracker_submission_providers").insert(rows);
    if (bpErr) {
      const { error: cleanupErr } = await admin.from("vibetracker_submissions").delete().eq("id", sub.id);
      return json({
        ok: false,
        error: `providers: ${bpErr.message}`,
        ...(cleanupErr ? { cleanupError: "partial submission cleanup failed" } : {}),
      }, 500);
    }
  }

  let toolsPersisted = 0;
  let toolWarning: string | undefined;
  if (result.byTool.length) {
    const rows = result.byTool.map((r) => ({
      submission_id: sub.id, tool: r.tool, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: btErr } = await admin.from("vibetracker_submission_tools").insert(rows);
    if (btErr) {
      toolWarning = optionalToolStorageError(btErr.message)
        ? "tool aggregate table not deployed yet; profile falls back to billing providers"
        : `tools: ${btErr.message}`;
    } else {
      toolsPersisted = rows.length;
    }
  }

  let dailyUsagePersisted = 0;
  let dailyUsageWarning: string | undefined;
  if (result.byDay.length) {
    const rows = result.byDay.map((r) => ({
      submission_id: sub.id, day: r.date, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: duErr } = await admin.from("vibetracker_submission_daily_usage").insert(rows);
    if (duErr) {
      dailyUsageWarning = optionalDailyUsageStorageError(duErr.message)
        ? "daily usage aggregate table not deployed yet; profile heatgrid will show upload-day fallback"
        : `daily usage: ${duErr.message}`;
    } else {
      dailyUsagePersisted = rows.length;
    }
  }

  let categoriesPersisted = 0;
  let categoryWarning: string | undefined;
  if (result.byCategory.length) {
    const rows = result.byCategory.map((r) => ({
      submission_id: sub.id, category: r.category, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: bcErr } = await admin.from("vibetracker_submission_categories").insert(rows);
    if (bcErr) {
      categoryWarning = optionalCategoryStorageError(bcErr.message)
        ? "category aggregate table not deployed yet; profile falls back to provider-primary category rollup"
        : `categories: ${bcErr.message}`;
    } else {
      categoriesPersisted = rows.length;
    }
  }

  let providerDailyPersisted = 0;
  let providerDailyWarning: string | undefined;
  if (result.byProviderDay.length) {
    const rows = result.byProviderDay.map((r) => ({
      submission_id: sub.id, provider: r.provider, day: r.date, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: pdErr } = await admin.from("vibetracker_submission_provider_daily").insert(rows);
    if (pdErr) {
      providerDailyWarning = optionalProviderDailyStorageError(pdErr.message)
        ? "provider-daily aggregate table not deployed yet; profile chart shows the combined series only"
        : `provider daily: ${pdErr.message}`;
    } else {
      providerDailyPersisted = rows.length;
    }
  }

  let providerModelsPersisted = 0;
  let providerModelWarning: string | undefined;
  if (result.byProviderModel.length) {
    const rows = result.byProviderModel.map((r) => ({
      submission_id: sub.id, provider: r.provider, model: r.model, ops: r.ops, credits: r.credits, usd: r.usd ?? 0,
    }));
    const { error: pmErr } = await admin.from("vibetracker_submission_provider_models").insert(rows);
    if (pmErr) {
      providerModelWarning = optionalProviderModelStorageError(pmErr.message)
        ? "provider-model aggregate table not deployed yet; profile hides the per-source model list"
        : `provider models: ${pmErr.message}`;
    } else {
      providerModelsPersisted = rows.length;
    }
  }

  let nativeMetricsPersisted = 0;
  let nativeMetricWarning: string | undefined;
  if (result.byNativeMetric.length) {
    const rows = result.byNativeMetric.map((r) => ({
      submission_id: sub.id,
      provider: r.provider,
      category: r.category,
      output_unit: r.outputUnit,
      outputs: r.outputs,
      duration_seconds: r.durationSeconds,
    }));
    const { error: nmErr } = await admin.from("vibetracker_submission_native_metrics").insert(rows);
    if (nmErr) {
      nativeMetricWarning = optionalNativeMetricStorageError(nmErr.message)
        ? "native media aggregate table not deployed yet; profile shows operations without output count or duration"
        : `native metrics: ${nmErr.message}`;
    } else {
      nativeMetricsPersisted = rows.length;
    }
  }

  let trustSignalsPersisted = 0;
  let trustSignalWarning: string | undefined;
  if (result.trustSignals.length) {
    const rows = result.trustSignals.map((signal) => ({
      submission_id: sub.id,
      kind: signal.kind,
      source: signal.source,
      label: signal.label,
      affects_totals: false,
      usage_verified: false,
      payload: signal,
    }));
    const { error: tsErr } = await admin.from("vibetracker_submission_trust_signals").insert(rows);
    if (tsErr) {
      trustSignalWarning = optionalTrustSignalStorageError(tsErr.message)
        ? "trust-signal table not deployed yet; usage upload stored without public proof side rail"
        : `trust signals: ${tsErr.message}`;
    } else {
      trustSignalsPersisted = rows.length;
    }
  }

  // Token breakdown (total + per provider) — soft-fail so an older DB without the table still ingests.
  let tokensPersisted = 0;
  if (rawTokens && (rawTokens.total || Array.isArray(rawTokens.byProvider))) {
    const tokenRow = (scope: string, t: Record<string, unknown> | undefined) => ({
      submission_id: sub.id, scope,
      input: nn(t?.input), output: nn(t?.output), cache_read: nn(t?.cacheRead), cache_creation: nn(t?.cacheCreation),
    });
    const rows = [] as ReturnType<typeof tokenRow>[];
    if (rawTokens.total) rows.push(tokenRow("total", rawTokens.total));
    for (const p of Array.isArray(rawTokens.byProvider) ? rawTokens.byProvider : []) {
      const provider = typeof (p as { provider?: unknown }).provider === "string" ? String((p as { provider: string }).provider).slice(0, 64) : "";
      if (provider) rows.push(tokenRow(provider, p as Record<string, unknown>));
    }
    if (rows.length) {
      const { error } = await admin.from("vibetracker_submission_tokens").insert(rows);
      if (!error) tokensPersisted = rows.length;
    }
  }

  // Agents (cross-provider delegation surface) — soft-fail.
  let agentsPersisted = 0;
  if (rawAgents && Array.isArray(rawAgents.agents)) {
    const rows = rawAgents.agents
      .map((a) => a as Record<string, unknown>)
      .filter((a) => typeof a.agent === "string" && (a.agent as string).length > 0)
      .slice(0, 32)
      .map((a) => ({
        submission_id: sub.id, agent: String(a.agent).slice(0, 64),
        active_days: nn(a.activeDays), cost: Number.isFinite(Number(a.cost)) && Number(a.cost) >= 0 ? Number(a.cost) : 0, tokens: nn(a.tokens),
      }));
    if (rows.length) {
      const { error } = await admin.from("vibetracker_submission_agents").insert(rows);
      if (!error) agentsPersisted = rows.length;
    }
  }

  return json({
    ok: result.ok, handle: publicHandle, tier: result.tier,
    identityVerified: Boolean(userId || identityId),
    identityProvider: identityId ? "github" : userId ? "c0vibe" : null,
    accepted: result.accepted, rejected: result.rejected,
    totals: result.totals, byProvider: result.byProvider,
    byTool: result.byTool,
    toolsPersisted,
    ...(toolWarning ? { toolWarning } : {}),
    byDay: result.byDay,
    byCategory: result.byCategory,
    dailyUsagePersisted,
    ...(dailyUsageWarning ? { dailyUsageWarning } : {}),
    categoriesPersisted,
    ...(categoryWarning ? { categoryWarning } : {}),
    providerDailyPersisted,
    ...(providerDailyWarning ? { providerDailyWarning } : {}),
    providerModelsPersisted,
    ...(providerModelWarning ? { providerModelWarning } : {}),
    nativeMetricsPersisted,
    ...(nativeMetricWarning ? { nativeMetricWarning } : {}),
    trustSignals: result.trustSignals.length,
    trustSignalsPersisted,
    ...(trustSignalWarning ? { trustSignalWarning } : {}),
    totalTokens,
    tokensPersisted,
    agentsPersisted,
    crossProviderDays,
    profileUrl: `/u/${publicHandle}`,
  });
});
