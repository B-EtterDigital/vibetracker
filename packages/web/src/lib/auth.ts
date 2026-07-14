// Server-only GitHub identity verification. The caller may present a GitHub CLI/OAuth token,
// but this module uses it once against GitHub's authenticated-user endpoint and returns only
// sanitized public identity fields. Tokens, emails, repository scopes, and credentials never
// enter the database or telemetry payloads.

export interface GitHubIdentityProfile {
  subject: string;
  login: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export class GitHubIdentityError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "GitHubIdentityError";
  }
}

interface GitHubUserResponse {
  id?: unknown;
  login?: unknown;
  name?: unknown;
  avatar_url?: unknown;
}

function githubSubject(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^[1-9][0-9]{0,19}$/.test(value)) return value;
  return null;
}

function cleanDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 100) : null;
}

function cleanAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "avatars.githubusercontent.com" ? url.toString() : null;
  } catch (error) {
    if (error instanceof TypeError) return null;
    throw error;
  }
}

export async function verifyGitHubAccessToken(
  accessToken: string,
  request: typeof fetch = fetch,
): Promise<GitHubIdentityProfile> {
  const token = accessToken.trim();
  if (!token || token.length > 1024 || /\s/.test(token)) {
    throw new GitHubIdentityError("invalid GitHub credential", 400, "invalid_credential");
  }

  let response: Response;
  try {
    response = await request("https://api.github.com/user", {
      method: "GET",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "user-agent": "VibeTRACKER-identity-verifier",
        "x-github-api-version": "2022-11-28",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    throw new GitHubIdentityError(
      error instanceof Error && error.name === "TimeoutError"
        ? "GitHub identity verification timed out"
        : "GitHub identity verification is unavailable",
      503,
      "github_unavailable",
    );
  }

  if (!response.ok) {
    throw new GitHubIdentityError(
      response.status === 401 ? "GitHub credential is invalid or expired" : "GitHub rejected identity verification",
      response.status === 401 ? 401 : 502,
      response.status === 401 ? "github_unauthorized" : "github_rejected",
    );
  }

  let payload: GitHubUserResponse;
  try {
    payload = await response.json() as GitHubUserResponse;
  } catch (error) {
    throw new GitHubIdentityError(
      error instanceof SyntaxError ? "GitHub returned an invalid identity response" : "GitHub identity response failed",
      502,
      "github_invalid_response",
    );
  }

  const subject = githubSubject(payload.id);
  const login = typeof payload.login === "string" ? payload.login.trim() : "";
  if (!subject || !/^[A-Za-z0-9-]{1,39}$/.test(login)) {
    throw new GitHubIdentityError("GitHub identity response is incomplete", 502, "github_invalid_identity");
  }

  return {
    subject,
    login,
    displayName: cleanDisplayName(payload.name),
    avatarUrl: cleanAvatarUrl(payload.avatar_url),
  };
}
