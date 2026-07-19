import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

export interface OAuthStartOptions {
  provider: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  scope?: string;
  redirectUri: string;
  state?: string;
  verifier?: string;
}

export interface OAuthUrlBundle {
  provider: string;
  state: string;
  verifier: string;
  url: string;
}

export interface OAuthProviderPreset {
  provider: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  scope: string;
  requireRotatingRefresh?: boolean;
  // Exact registered redirect URI — OAuth servers with strict allowlists (cynaps3) match it
  // verbatim, so the CLI must use THIS instead of composing http://127.0.0.1:<port>/callback.
  redirectUri?: string;
}

export interface StoredOAuthCredentials {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

// PRODUCTION endpoints per the Cynaps3 integration contract
// (sunomation/docs/integrations/vibeusage.md, 2026-07-15). These live on the Cynaps3/SUNOMATION
// Supabase project — NOT on the VibeUsage backend (tnsaqsqajpjbvlpasojt, which hosts
// vibetracker-ingest); pointing there answered invalid_client (real incident 2026-07-19).
const CYNAPS3_OAUTH_BASE =
  "https://tvsvttguftnatztsedyx.supabase.co/functions/v1/oauth-server";

export function oauthProviderPreset(
  provider: string,
  env: Record<string, string | undefined> = process.env,
): OAuthProviderPreset | undefined {
  if (provider !== "cynaps3") return undefined;
  return {
    provider,
    authUrl: `${CYNAPS3_OAUTH_BASE}/authorize`,
    tokenUrl: `${CYNAPS3_OAUTH_BASE}/token`,
    clientId: env.VT_CYNAPS3_OAUTH_CLIENT_ID?.trim() || "musicmation-skill-4290992cf2f40370",
    scope: "usage:read",
    requireRotatingRefresh: true,
    // the client's allowlist matches redirect URIs verbatim; localhost:19876 is the CLI slot
    redirectUri: "http://localhost:19876/callback",
  };
}

function b64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function createPkceVerifier(): string {
  return b64url(randomBytes(32));
}

export function pkceChallenge(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

export function buildOAuthUrl(opts: OAuthStartOptions): OAuthUrlBundle {
  // 24 random bytes → 32 b64url chars: the Cynaps3 oauth-server requires state ≥ 32 characters
  // (18 bytes = 24 chars was silently rejected with invalid_request — real incident 2026-07-19).
  const state = opts.state ?? b64url(randomBytes(24));
  const verifier = opts.verifier ?? createPkceVerifier();
  const url = new URL(opts.authUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", pkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  if (opts.scope) url.searchParams.set("scope", opts.scope);
  return { provider: opts.provider, state, verifier, url: url.toString() };
}

export async function exchangeOAuthCode(opts: {
  tokenUrl: string;
  clientId: string;
  redirectUri: string;
  code: string;
  verifier: string;
  fetchImpl?: typeof fetch;
}): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    code: opts.code,
    code_verifier: opts.verifier,
  });
  const res = await (opts.fetchImpl ?? fetch)(opts.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw tokenResponseError(res, await res.text());
  return await res.json() as Record<string, unknown>;
}

function safeOAuthDetail(detail: string): string {
  let message = detail;
  try {
    const parsed = JSON.parse(detail) as Record<string, unknown>;
    message = [parsed.error, parsed.error_description]
      .filter((part): part is string => typeof part === "string")
      .join(": ");
  } catch {
    // Plain-text OAuth errors are allowed, but still pass through redaction below.
  }
  return message
    .replace(/(?:access_token|refresh_token|client_secret|code_verifier|code)\s*[=:]\s*[^\s&,;}]+/gi, "credential=[redacted]")
    .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function tokenResponseError(res: Response, detail: string): Error {
  const safe = safeOAuthDetail(detail);
  return new Error(`OAuth token request failed ${res.status}${safe ? `: ${safe}` : ""}`);
}

export function oauthCredentialsFromTokenResponse(
  value: Record<string, unknown>,
  now = Date.now(),
): StoredOAuthCredentials {
  const accessToken = typeof value.access_token === "string" ? value.access_token.trim() : "";
  if (!accessToken) throw new Error("OAuth token response did not include access_token");
  if (typeof value.token_type === "string" && value.token_type.toLowerCase() !== "bearer") {
    throw new Error(`OAuth token type ${value.token_type} is not supported by the local CLI`);
  }

  const refreshToken = typeof value.refresh_token === "string" ? value.refresh_token.trim() : "";
  const expiresIn = typeof value.expires_in === "number" ? value.expires_in : Number(value.expires_in);
  const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
    ? new Date(now + expiresIn * 1_000).toISOString()
    : undefined;
  return {
    token: accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
  };
}

export function oauthCredentialsNeedRefresh(
  credentials: StoredOAuthCredentials,
  now = Date.now(),
  skewMs = 60_000,
): boolean {
  if (!credentials.expiresAt) return false;
  const expiresAt = Date.parse(credentials.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now + skewMs;
}

export function validateOAuthCredentialsForPreset(
  preset: OAuthProviderPreset,
  credentials: StoredOAuthCredentials,
): StoredOAuthCredentials {
  if (preset.requireRotatingRefresh && (!credentials.refreshToken || !credentials.expiresAt)) {
    throw new Error(`${preset.provider} OAuth response did not include rotating refresh credentials`);
  }
  return credentials;
}

export async function refreshOAuthCredentials(opts: {
  preset: OAuthProviderPreset;
  credentials: StoredOAuthCredentials;
  now?: number;
  fetchImpl?: typeof fetch;
}): Promise<StoredOAuthCredentials> {
  const now = opts.now ?? Date.now();
  if (!oauthCredentialsNeedRefresh(opts.credentials, now)) return opts.credentials;
  if (!opts.credentials.refreshToken) {
    throw new Error(`${opts.preset.provider} OAuth token expired; run vibetracker connect ${opts.preset.provider}`);
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: opts.preset.clientId,
    refresh_token: opts.credentials.refreshToken,
  });
  const res = await (opts.fetchImpl ?? fetch)(opts.preset.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw tokenResponseError(res, await res.text());
  const refreshed = oauthCredentialsFromTokenResponse(
    await res.json() as Record<string, unknown>,
    now,
  );
  if (!refreshed.refreshToken) {
    throw new Error(`${opts.preset.provider} OAuth refresh did not rotate refresh_token`);
  }
  return refreshed;
}

export function waitForOAuthCallback(opts: {
  port: number;
  state: string;
  // omitted → 127.0.0.1 (safe default) · null → all interfaces (for `localhost` redirects that
  // may resolve to ::1, where a 127.0.0.1-only listener would never see the callback)
  host?: string | null;
  timeoutMs?: number;
}): Promise<{ code: string; close: () => void }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${opts.port}`);
      if (url.pathname !== "/callback") {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("not found");
        return;
      }
      if (url.searchParams.get("state") !== opts.state) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("invalid state");
        return;
      }
      const providerError = url.searchParams.get("error");
      if (providerError) {
        const detail = safeOAuthDetail(url.searchParams.get("error_description") ?? providerError);
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("VibeTRACKER OAuth authorization was not completed. You can close this tab.");
        server.close();
        reject(new Error(`OAuth authorization failed${detail ? `: ${detail}` : ""}`));
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("missing code");
        return;
      }
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("VibeTRACKER OAuth connected. You can close this tab.");
      resolve({ code, close: () => server.close() });
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error("OAuth callback timed out"));
      // 5 minutes: a human has to notice the tab, log in, and approve — 2 minutes proved too short
    }, opts.timeoutMs ?? 300_000);
    server.on("close", () => clearTimeout(timer));
    server.on("error", reject);
    // default 127.0.0.1; explicit null = all interfaces (localhost redirects may resolve to ::1)
    server.listen(opts.port, opts.host === null ? undefined : (opts.host ?? "127.0.0.1"));
  });
}
