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
  if (!res.ok) throw new Error(`OAuth token exchange failed ${res.status}: ${await res.text()}`);
  return await res.json() as Record<string, unknown>;
}

export function waitForOAuthCallback(opts: {
  port: number;
  state: string;
  timeoutMs?: number;
}): Promise<{ code: string; close: () => void }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${opts.port}`);
      if (url.searchParams.get("state") !== opts.state) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("invalid state");
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
