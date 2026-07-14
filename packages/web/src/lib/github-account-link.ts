import { GitHubIdentityError, verifyGitHubAccessToken } from "./auth";
import { supabaseAdmin } from "./supabase-admin";

export class GitHubAccountLinkError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GitHubAccountLinkError";
  }
}

export async function linkGitHubAccount(userId: string, providerToken: string) {
  if (!userId || !providerToken) {
    throw new GitHubAccountLinkError("GitHub did not return a usable account proof", 401, "missing_github_proof");
  }

  try {
    const profile = await verifyGitHubAccessToken(providerToken);
    const { data, error } = await supabaseAdmin().rpc("vibetracker_link_github_identity", {
      p_user_id: userId,
      p_provider_subject: profile.subject,
      p_provider_login: profile.login,
      p_display_name: profile.displayName,
      p_avatar_url: profile.avatarUrl,
    });
    if (error) {
      const conflict = error.code === "23505" || /already linked/i.test(error.message);
      throw new GitHubAccountLinkError(
        conflict ? "GitHub identity is already linked to another account" : "Account link failed",
        conflict ? 409 : 500,
        conflict ? "github_identity_conflict" : "github_link_persist_failed",
        { cause: error },
      );
    }

    const linked = Array.isArray(data)
      ? data[0] as { canonical_handle?: string; migrated_submissions?: number } | undefined
      : undefined;
    return {
      identity: { provider: "github" as const, handle: linked?.canonical_handle ?? profile.login.toLowerCase() },
      migratedSubmissions: Number(linked?.migrated_submissions ?? 0),
    };
  } catch (error) {
    if (error instanceof GitHubAccountLinkError) throw error;
    if (error instanceof GitHubIdentityError) {
      throw new GitHubAccountLinkError(error.message, error.status, error.code, { cause: error });
    }
    throw new GitHubAccountLinkError("GitHub identity verification failed", 500, "github_link_failed", { cause: error });
  }
}
