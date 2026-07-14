import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../core/src/telemetry";
import { c0vibeAuthorizationUrl } from "../../../lib/c0vibe-account-bridge";
import { supabaseAdmin } from "../../../lib/supabase-admin";

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
    return NextResponse.json({ linked: true }, { headers: noStore });
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
      authorizationUrl: c0vibeAuthorizationUrl(claim.claim_token, process.env.C0VIBE_AUTH_ORIGIN),
      expiresAt: claim.expires_at,
    }, { headers: noStore });
  } catch (error) {
    telemetry.captureError(error instanceof Error ? error : new Error(String(error)), {
      area: "web.auth.c0vibe-bridge.redirect",
      severity: "error",
      userId: account.user.id,
    });
    return NextResponse.json({ error: "C0VIBE auth origin is invalid" }, { status: 500, headers: noStore });
  }
}
