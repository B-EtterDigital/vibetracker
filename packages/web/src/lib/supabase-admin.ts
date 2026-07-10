import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY: the service role bypasses RLS. Only import this in route handlers /
// server actions — NEVER in a client component. This is the sole leaderboard write path.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("service-role env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}
