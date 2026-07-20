"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const SUPABASE_BROWSER_AUTH_OPTIONS = {
  autoRefreshToken: true,
  detectSessionInUrl: true,
  persistSession: true,
} as const;

export const SUPABASE_BROWSER_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 400,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

export function supabaseBrowserConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("VibeUsage auth is not configured in this environment");
  browserClient ??= createBrowserClient(url, key, {
    auth: SUPABASE_BROWSER_AUTH_OPTIONS,
    cookieOptions: SUPABASE_BROWSER_COOKIE_OPTIONS,
  });
  return browserClient;
}

export async function authProviderAvailability(signal?: AbortSignal): Promise<{ github: boolean; workos: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { github: false, workos: false };

  const response = await fetch(`${url}/auth/v1/settings`, {
    cache: "no-store",
    headers: { apikey: key },
    signal,
  });
  if (!response.ok) throw new Error(`Auth provider check failed (${response.status})`);
  const payload = await response.json() as { external?: Record<string, boolean> };
  return {
    github: payload.external?.github === true,
    workos: payload.external?.workos === true,
  };
}
