export interface AccountIdentity {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  provider: "github" | "account";
}

interface SessionLike {
  user?: {
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }> | null;
  } | null;
}

const CANONICAL_ACCOUNT_ORIGIN = "https://vibeusage.c0vibe.app";

function firstForwardedValue(value: string | null): string {
  return value?.split(",", 1)[0]?.trim().toLowerCase() ?? "";
}

function isVibeUsagePreview(hostname: string): boolean {
  return hostname === "vibeusage.netlify.app" || hostname.endsWith("--vibeusage.netlify.app");
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "";
}

function githubHandle(value: unknown): string {
  const handle = cleanText(value, 39);
  return /^[A-Za-z0-9-]{1,39}$/.test(handle) ? handle : "";
}

function githubAvatar(value: unknown): string | null {
  const candidate = cleanText(value, 500);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    const trusted = url.hostname === "avatars.githubusercontent.com" || url.hostname.endsWith(".githubusercontent.com");
    return url.protocol === "https:" && trusted ? url.toString() : null;
  } catch {
    return null;
  }
}

export function accountIdentityFromSession(session: SessionLike | null): AccountIdentity | null {
  const user = session?.user;
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  const github = user.identities?.find((identity) => identity.provider === "github")?.identity_data ?? {};
  const handle = githubHandle(github.user_name) || githubHandle(metadata.user_name) || githubHandle(metadata.preferred_username);
  const fallback = githubHandle(user.email?.split("@")[0]) || "account";
  const displayName = cleanText(github.full_name, 80) || cleanText(metadata.full_name, 80) || handle || fallback;
  return {
    handle: handle || fallback,
    displayName,
    avatarUrl: githubAvatar(github.avatar_url) || githubAvatar(metadata.avatar_url),
    provider: handle ? "github" : "account",
  };
}

export function safeNextPath(value: string | null | undefined): string | null {
  const candidate = cleanText(value, 300);
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;
  try {
    const url = new URL(candidate, "https://vibeusage.local");
    if (url.origin !== "https://vibeusage.local" || url.pathname === "/account") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function accountCallbackOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstForwardedValue(request.headers.get("host"));

  if (host === "vibeusage.c0vibe.app") return CANONICAL_ACCOUNT_ORIGIN;
  if (host && isVibeUsagePreview(host)) return `https://${host}`;
  if (requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1") return requestUrl.origin;
  if (requestUrl.hostname === "vibeusage.c0vibe.app") return CANONICAL_ACCOUNT_ORIGIN;
  return CANONICAL_ACCOUNT_ORIGIN;
}

export function accountRedirectUrl(origin: string, next?: string | null): string {
  const url = new URL("/auth/callback", origin);
  const safe = safeNextPath(next);
  if (safe) url.searchParams.set("next", safe);
  return url.toString();
}
