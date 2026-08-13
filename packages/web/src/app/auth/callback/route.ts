import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../core/src/telemetry";
import { accountCallbackOrigin, safeNextPath } from "../../account/account-session";
import { GitHubAccountLinkError, linkGitHubAccount } from "../../../lib/github-account-link";
import { supabaseServer } from "../../../lib/supabase-server";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();

function accountUrl(
  origin: string,
  next: string | null,
  oauth: "success" | "denied" | "error",
  intent: string | null,
) {
  const destination = new URL("/account", origin);
  if (next) destination.searchParams.set("next", next);
  if (intent === "c0vibe-link") destination.searchParams.set("intent", intent);
  destination.searchParams.set("oauth", oauth);
  return destination;
}

function redirect(origin: string, next: string | null, oauth: "success" | "denied" | "error", intent: string | null) {
  const response = NextResponse.redirect(accountUrl(origin, next, oauth, intent));
  response.headers.set("cache-control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = accountCallbackOrigin(request);
  const next = safeNextPath(url.searchParams.get("next"));
  const intent = url.searchParams.get("intent") === "c0vibe-link" ? "c0vibe-link" : null;
  if (url.searchParams.has("error")) return redirect(origin, next, "denied", intent);

  const code = url.searchParams.get("code");
  if (!code) return redirect(origin, next, "error", intent);

  try {
    const client = await supabaseServer();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user?.id || !data.session) {
      throw error ?? new Error("OAuth did not return a complete session");
    }

    // GitHub stays the identity anchor. `provider_token` proves THIS callback came from
    // GitHub, even when a migrated/testing account's primary app_metadata provider is still
    // WorkOS. Looking only at that primary provider made reconnect appear successful while
    // leaving the GitHub identity forever pending. WorkOS callbacks carry no GitHub provider
    // token and continue without entering the GitHub linking seam.
    const provider = data.user.app_metadata?.provider
      || data.user.identities?.find((identity) => identity.provider)?.provider
      || "github";
    if (data.session.provider_token) {
      await linkGitHubAccount(data.user.id, data.session.provider_token);
    } else if (provider === "github") {
      throw new Error("GitHub OAuth did not return a complete session");
    }
    return redirect(origin, next, "success", intent);
  } catch (error) {
    telemetry.captureError(error, {
      area: "web.auth.github-callback",
      severity: error instanceof GitHubAccountLinkError && error.status < 500 ? "warn" : "error",
      code: error instanceof GitHubAccountLinkError ? error.code : "github_callback_failed",
    });
    return redirect(origin, next, "error", intent);
  }
}
