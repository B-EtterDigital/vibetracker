import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { generateDeviceCodes } from "../../../../lib/cli-auth";

export const runtime = "nodejs";

// CLI device-flow: create a pending code. Public (no auth) — approval requires a session.
export async function POST() {
  const { deviceCode, userCode, deviceCodeHash } = generateDeviceCodes();
  const { error } = await supabaseAdmin()
    .from("vibetracker_cli_auth")
    .insert({ device_code_hash: deviceCodeHash, user_code: userCode, status: "pending" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    device_code: deviceCode,
    user_code: userCode,
    verify_url: "https://vibeusage.c0vibe.app/cli-login",
    interval: 3,
    expires_in: 600,
  });
}
