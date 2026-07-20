import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../core/src/telemetry";
import { accountCallbackOrigin, safeNextPath } from "../../account/account-session";
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
  const origin = accountCallbackOrigin(request);
  const next = safeNextPath(url.searchParams.get("next"));
  if (url.searchParams.has("error")) return redirect(origin, next, "denied");

  const code = url.searchParams.get("code");
  if (!code) return redirect(origin, next, "error");

  try {
    const client = await supabaseServer();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user?.id || !data.session) {
      throw error ?? new Error("OAuth did not return a complete session");
    }

    // GitHub stays the identity anchor: require the provider token and link the immutable
    // subject. Migrated vibers returning through C0VIBE (WorkOS) complete the same session
    // exchange without a GitHub token and are not routed through GitHub account linking.
    const provider = data.user.app_metadata?.provider
      || data.user.identities?.find((identity) => identity.provider)?.provider
      || "github";
    if (provider === "github") {
      if (!data.session.provider_token) {
        throw new Error("GitHub OAuth did not return a complete session");
      }
      await linkGitHubAccount(data.user.id, data.session.provider_token);
    }
    return redirect(origin, next, "success");
  } catch (error) {
    telemetry.captureError(error, {
      area: "web.auth.github-callback",
      severity: error instanceof GitHubAccountLinkError && error.status < 500 ? "warn" : "error",
      code: error instanceof GitHubAccountLinkError ? error.code : "github_callback_failed",
    });
    return redirect(origin, next, "error");
  }
}
