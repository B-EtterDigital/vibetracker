import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../../../core/src/telemetry";
import { GitHubAccountLinkError, linkGitHubAccount } from "../../../../../lib/github-account-link";
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
    const linked = await linkGitHubAccount(
      account.user.id,
      typeof body.github_token === "string" ? body.github_token : "",
    );
    return NextResponse.json({
      ok: true,
      identity: linked.identity,
      migrated_submissions: linked.migratedSubmissions,
    });
  } catch (error) {
    const known = error instanceof GitHubAccountLinkError;
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
