"use client";
import { createClient } from "@supabase/supabase-js";

// Browser client for reading the signed-in C0VIBE session on the /cli-login page.
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
