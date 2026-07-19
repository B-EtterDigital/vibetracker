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
}

export interface StoredOAuthCredentials {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

const CYNAPS3_OAUTH_BASE =
  "https://tnsaqsqajpjbvlpasojt.supabase.co/functions/v1/oauth-server";

export function oauthProviderPreset(
  provider: string,
  env: Record<string, string | undefined> = process.env,
): OAuthProviderPreset | undefined {
  if (provider !== "cynaps3") return undefined;
  return {
    provider,
    authUrl: `${CYNAPS3_OAUTH_BASE}/authorize`,
    tokenUrl: `${CYNAPS3_OAUTH_BASE}/token`,
    clientId: env.VT_CYNAPS3_OAUTH_CLIENT_ID?.trim() || "vibeusage-cli",
    scope: "usage:read",
    requireRotatingRefresh: true,
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
  const state = opts.state ?? b64url(randomBytes(18));
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
    }, opts.timeoutMs ?? 120_000);
    server.on("close", () => clearTimeout(timer));
    server.on("error", reject);
    server.listen(opts.port, "127.0.0.1");
  });
}
