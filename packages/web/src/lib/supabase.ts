import { createClient } from "@supabase/supabase-js";

// Public, read-only client for the leaderboard/profile pages. RLS allows anon SELECT
// only; all writes go through the ingest edge function (service role). Never ship the
// service-role key to the browser.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
