import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { sha256Hex } from "../../../../lib/cli-auth";

export const runtime = "nodejs";

// CLI polls with its device_code. Returns the token ONCE on approval, then marks claimed.
export async function POST(req: Request) {
  let body: { device_code?: string } = {};
  try { body = await req.json(); } catch { body = {}; }
  const deviceCode = body.device_code;
  if (!deviceCode) return NextResponse.json({ status: "denied" }, { status: 400 });

  const sb = supabaseAdmin();
  const hash = sha256Hex(deviceCode);
  const { data } = await sb.from("vibetracker_cli_auth").select("*").eq("device_code_hash", hash).maybeSingle();

  if (!data || new Date(data.expires_at) < new Date()) return NextResponse.json({ status: "denied" });
  if (data.status === "approved" && data.issued_token) {
    const token = data.issued_token as string;
    await sb.from("vibetracker_cli_auth").update({ status: "claimed", issued_token: null }).eq("device_code_hash", hash);
    return NextResponse.json({ status: "approved", access_token: token });
  }
  return NextResponse.json({ status: data.status === "denied" ? "denied" : "pending" });
}
