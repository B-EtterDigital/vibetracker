import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../core/src/telemetry";
import { safeNextPath } from "../../account/account-session";
import { GitHubAccountLinkError, linkGitHubAccount } from "../../../lib/github-account-link";
import { supabaseServer } from "../../../lib/supabase-server";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();

function accountUrl(origin: string, next: string | null, oauth: "success" | "denied" | "error") {
  const destination = new URL("/account", origin);
  if (next) destination.searchParams.set("next", next);
  destination.searchParams.set("oauth", oauth);
  return destination;
}

function redirect(origin: string, next: string | null, oauth: "success" | "denied" | "error") {
  const response = NextResponse.redirect(accountUrl(origin, next, oauth));
  response.headers.set("cache-control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  if (url.searchParams.has("error")) return redirect(url.origin, next, "denied");

  const code = url.searchParams.get("code");
  if (!code) return redirect(url.origin, next, "error");

  try {
    const client = await supabaseServer();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user?.id || !data.session?.provider_token) {
      throw error ?? new Error("GitHub OAuth did not return a complete session");
    }

    await linkGitHubAccount(data.user.id, data.session.provider_token);
    return redirect(url.origin, next, "success");
  } catch (error) {
    telemetry.captureError(error, {
      area: "web.auth.github-callback",
      severity: error instanceof GitHubAccountLinkError && error.status < 500 ? "warn" : "error",
      code: error instanceof GitHubAccountLinkError ? error.code : "github_callback_failed",
    });
    return redirect(url.origin, next, "error");
  }
}
