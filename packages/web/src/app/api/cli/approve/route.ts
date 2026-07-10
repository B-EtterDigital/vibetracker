import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { issueCliToken } from "../../../../lib/cli-auth";

export const runtime = "nodejs";

// Approve a device code — REQUIRES the caller's C0VIBE/WorkOS session (Bearer). Binds the
// code to the user, issues a CLI token (stored hashed), and opts them into the leaderboard.
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const sb = supabaseAdmin();
  const { data: u } = await sb.auth.getUser(auth.slice(7));
  const userId = u.user?.id;
  if (!userId) return NextResponse.json({ error: "invalid session" }, { status: 401 });

  let body: { user_code?: string } = {};
  try { body = await req.json(); } catch { body = {}; }
  const userCode = String(body.user_code ?? "").toUpperCase();

  const { data: row } = await sb.from("vibetracker_cli_auth").select("*").eq("user_code", userCode).maybeSingle();
  if (!row || new Date(row.expires_at) < new Date() || row.status !== "pending") {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  const { token, tokenHash } = issueCliToken();
  const ins = await sb.from("vibetracker_cli_tokens").insert({ token_hash: tokenHash, user_id: userId });
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  await sb.from("vibetracker_cli_auth").update({ status: "approved", user_id: userId, issued_token: token }).eq("user_code", userCode);
  await sb.from("vibetracker_members").upsert({ user_id: userId }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true });
}
