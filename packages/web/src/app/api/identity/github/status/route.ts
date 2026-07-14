import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../../../core/src/telemetry";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();
const noStore = { "cache-control": "private, no-store, max-age=0" };

export async function GET(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: noStore });
  }

  const admin = supabaseAdmin();
  const { data: account, error: accountError } = await admin.auth.getUser(authorization.slice(7));
  if (accountError || !account.user?.id) {
    return NextResponse.json({ error: "invalid account session" }, { status: 401, headers: noStore });
  }

  const { data, error } = await admin
    .from("vibetracker_identities")
    .select("provider_login, canonical_handle, display_name, avatar_url, verified_at, linked_at")
    .eq("user_id", account.user.id)
    .eq("provider", "github")
    .maybeSingle();
  if (error) {
    telemetry.captureError(new Error(error.message), {
      area: "web.auth.github-status.read",
      severity: "error",
      code: error.code,
      userId: account.user.id,
    });
    return NextResponse.json({ error: "identity status failed" }, { status: 500, headers: noStore });
  }
  if (!data) return NextResponse.json({ linked: false }, { headers: noStore });

  return NextResponse.json({
    linked: true,
    identity: {
      provider: "github",
      handle: data.canonical_handle,
      login: data.provider_login,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      verifiedAt: data.verified_at,
      linkedAt: data.linked_at,
    },
  }, { headers: noStore });
}
