import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../../../core/src/telemetry";
import { GitHubIdentityError, verifyGitHubAccessToken } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();

// Settings bridge: requires proof of both identities in the same request. Existing GitHub-first
// tokens and submissions are migrated to the WorkOS/Supabase user by a service-role-only RPC.
export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data: account, error: accountError } = await admin.auth.getUser(authorization.slice(7));
  if (accountError || !account.user?.id) {
    return NextResponse.json({ error: "invalid account session" }, { status: 401 });
  }

  let body: { github_token?: unknown };
  try {
    body = await req.json() as { github_token?: unknown };
  } catch (error) {
    telemetry.captureError(error, { area: "web.auth.github-link.parse", severity: "warn" });
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const profile = await verifyGitHubAccessToken(typeof body.github_token === "string" ? body.github_token : "");
    const { data, error } = await admin.rpc("vibetracker_link_github_identity", {
      p_user_id: account.user.id,
      p_provider_subject: profile.subject,
      p_provider_login: profile.login,
      p_display_name: profile.displayName,
      p_avatar_url: profile.avatarUrl,
    });
    if (error) {
      const conflict = error.code === "23505" || /already linked/i.test(error.message);
      telemetry.captureError(new Error(error.message), {
        area: "web.auth.github-link.persist",
        severity: conflict ? "warn" : "error",
        code: error.code,
        userId: account.user.id,
      });
      return NextResponse.json(
        { error: conflict ? "GitHub identity is already linked to another account" : "account link failed" },
        { status: conflict ? 409 : 500 },
      );
    }

    const linked = Array.isArray(data)
      ? data[0] as { canonical_handle?: string; migrated_submissions?: number } | undefined
      : undefined;
    return NextResponse.json({
      ok: true,
      identity: { provider: "github", handle: linked?.canonical_handle ?? profile.login.toLowerCase() },
      migrated_submissions: Number(linked?.migrated_submissions ?? 0),
    });
  } catch (error) {
    const known = error instanceof GitHubIdentityError;
    telemetry.captureError(error, {
      area: "web.auth.github-link.verify",
      severity: known && error.status < 500 ? "warn" : "error",
      code: known ? error.code : "github_link_failed",
      userId: account.user.id,
    });
    return NextResponse.json(
      { error: known ? error.message : "GitHub identity verification failed" },
      { status: known ? error.status : 500 },
    );
  }
}
