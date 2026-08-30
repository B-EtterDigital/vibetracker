import { NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { createConsoleTelemetry } from "../../../../../core/src/telemetry";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { workosAuthorizationPath } from "../../../lib/workos-account-link";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();
const noStore = { "cache-control": "private, no-store, max-age=0" };

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: noStore });
  }

  const admin = supabaseAdmin();
  const { data: account, error: accountError } = await admin.auth.getUser(authorization.slice(7));
  if (accountError || !account.user?.id) {
    return NextResponse.json({ error: "invalid account session" }, { status: 401, headers: noStore });
  }

  const { data, error } = await admin.rpc("vibetracker_create_workos_link_claim", {
    p_user_id: account.user.id,
    p_ttl_seconds: 600,
  });
  if (error) {
    const missingIdentity = /github_identity_not_linked/.test(error.message);
    telemetry.captureError(new Error(error.message), {
      area: "web.auth.c0vibe-bridge.create",
      severity: missingIdentity ? "warn" : "error",
      code: error.code,
      userId: account.user.id,
    });
    return NextResponse.json(
      { error: missingIdentity ? "github identity is not linked" : "account bridge unavailable" },
      { status: missingIdentity ? 409 : 500, headers: noStore },
    );
  }

  const claim = Array.isArray(data) ? data[0] : data;
  if (claim?.already_linked === true) {
    const { data: link, error: linkError } = await admin
      .from("vibetracker_account_links")
      .select("workos_user_id")
      .eq("source_user_id", account.user.id)
      .maybeSingle();
    if (linkError || !link?.workos_user_id) {
      telemetry.captureError(new Error(linkError?.message || "existing WorkOS link receipt is missing"), {
        area: "web.auth.workos-link.read",
        severity: "error",
        code: linkError?.code,
        userId: account.user.id,
      });
      return NextResponse.json({ error: "account bridge unavailable" }, { status: 500, headers: noStore });
    }

    const { user: workosUser } = await withAuth();
    if (workosUser && workosUser.id !== link.workos_user_id) {
      return NextResponse.json({ error: "this GitHub identity is linked to another C0VIBE account" }, { status: 409, headers: noStore });
    }
    if (workosUser) return NextResponse.json({ linked: true }, { headers: noStore });
    return NextResponse.json({
      linked: false,
      authorizationUrl: "/auth/workos/login?returnTo=%2Faccount",
    }, { headers: noStore });
  }
  if (typeof claim?.claim_token !== "string") {
    telemetry.captureError(new Error("C0VIBE bridge claim receipt is incomplete"), {
      area: "web.auth.c0vibe-bridge.receipt",
      severity: "error",
      userId: account.user.id,
    });
    return NextResponse.json({ error: "account bridge unavailable" }, { status: 502, headers: noStore });
  }

  try {
    return NextResponse.json({
      linked: false,
      authorizationUrl: workosAuthorizationPath(claim.claim_token),
      expiresAt: claim.expires_at,
    }, { headers: noStore });
  } catch (error) {
    telemetry.captureError(error instanceof Error ? error : new Error(String(error)), {
      area: "web.auth.workos-link.redirect",
      severity: "error",
      userId: account.user.id,
    });
    return NextResponse.json({ error: "WorkOS authorization path is invalid" }, { status: 500, headers: noStore });
  }
}
