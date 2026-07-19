import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFileSync } from "node:fs";

import {
  redeemCynaps3WithClerkToken,
  buildOAuthUrl,
  exchangeOAuthCode,
  oauthCredentialsFromTokenResponse,
  oauthCredentialsNeedRefresh,
  oauthProviderPreset,
  pkceChallenge,
  refreshOAuthCredentials,
  validateOAuthCredentialsForPreset,
  waitForOAuthCallback,
} from "../oauth.ts";

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((err) => {
        if (err) reject(err);
        else resolve(typeof address === "object" && address ? address.port : 0);
      });
    });
  });
}

test("PKCE challenge is deterministic and URL-safe", () => {
  const challenge = pkceChallenge("correct-horse-battery-staple");
  assert.match(challenge, /^[A-Za-z0-9_-]+$/);
  assert.equal(challenge, pkceChallenge("correct-horse-battery-staple"));
});

test("OAuth URL includes provider, state, scope, and PKCE challenge", () => {
  const bundle = buildOAuthUrl({
    provider: "huggingface",
    authUrl: "https://provider.example/oauth/authorize",
    tokenUrl: "https://provider.example/oauth/token",
    clientId: "client-123",
    scope: "usage.read",
    redirectUri: "http://127.0.0.1:8787/callback",
    state: "state-123",
    verifier: "verifier-123",
  });
  const url = new URL(bundle.url);
  assert.equal(bundle.provider, "huggingface");
  assert.equal(bundle.state, "state-123");
  assert.equal(bundle.verifier, "verifier-123");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(url.searchParams.get("scope"), "usage.read");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("code_challenge"), pkceChallenge("verifier-123"));
});

test("OAuth code exchange posts x-www-form-urlencoded PKCE payload", async () => {
  const calls: Array<{ url: string; body: string; headers: HeadersInit | undefined }> = [];
  const token = await exchangeOAuthCode({
    tokenUrl: "https://provider.example/oauth/token",
    clientId: "client-123",
    redirectUri: "http://127.0.0.1:8787/callback",
    code: "code-456",
    verifier: "verifier-123",
    fetchImpl: async (url, init) => {
      calls.push({
        url: String(url),
        body: String(init?.body),
        headers: init?.headers,
      });
      return new Response(JSON.stringify({ access_token: "tok_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(token.access_token, "tok_123");
  assert.equal(calls[0]?.url, "https://provider.example/oauth/token");
  assert.match(calls[0]?.body ?? "", /grant_type=authorization_code/);
  assert.match(calls[0]?.body ?? "", /code_verifier=verifier-123/);
});

test("Cynaps3 preset pins the read-only producer contract and allows staged client overrides", () => {
  const preset = oauthProviderPreset("cynaps3", {});
  assert.ok(preset);
  assert.equal(preset.clientId, "musicmation-skill-4290992cf2f40370");
  assert.equal(preset.scope, "usage:read");
  assert.equal(preset.requireRotatingRefresh, true);
  // the oauth-server matches redirects verbatim; localhost:19876 is the registered CLI callback
  assert.equal(preset.redirectUri, "http://localhost:19876/callback");
  assert.equal(
    preset.authUrl,
    "https://content.7cycle.life/oauth/authorize",
  );
  assert.equal(
    preset.tokenUrl,
    "https://tvsvttguftnatztsedyx.supabase.co/functions/v1/oauth-server/token",
  );
  assert.equal(
    oauthProviderPreset("cynaps3", { VT_CYNAPS3_OAUTH_CLIENT_ID: "staged-client" })?.clientId,
    "staged-client",
  );
  assert.equal(oauthProviderPreset("openai", {}), undefined);
});

test("OAuth token response becomes rotation-safe local credentials", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z");
  const credentials = oauthCredentialsFromTokenResponse({
    access_token: "access-1",
    token_type: "Bearer",
    refresh_token: "refresh-1",
    expires_in: 3600,
  }, now);
  assert.deepEqual(credentials, {
    token: "access-1",
    refreshToken: "refresh-1",
    expiresAt: "2026-07-15T13:00:00.000Z",
  });
  assert.equal(oauthCredentialsNeedRefresh(credentials, now), false);
  assert.equal(oauthCredentialsNeedRefresh(credentials, now + 3_550_000), true);
  assert.throws(
    () => oauthCredentialsFromTokenResponse({ access_token: "dpop", token_type: "DPoP" }),
    /not supported/,
  );
});

test("Cynaps3 refuses an authorization response that cannot refresh safely", () => {
  const preset = oauthProviderPreset("cynaps3", {})!;
  assert.throws(
    () => validateOAuthCredentialsForPreset(preset, { token: "access-only" }),
    /rotating refresh credentials/,
  );
  assert.doesNotThrow(() => validateOAuthCredentialsForPreset(preset, {
    token: "access",
    refreshToken: "refresh",
    expiresAt: "2026-07-15T13:00:00.000Z",
  }));
});

test("OAuth token errors redact credentials returned by a hostile endpoint", async () => {
  await assert.rejects(
    () => exchangeOAuthCode({
      tokenUrl: "https://provider.example/oauth/token",
      clientId: "client-123",
      redirectUri: "http://127.0.0.1:8787/callback",
      code: "code-456",
      verifier: "verifier-123",
      fetchImpl: async () => new Response(JSON.stringify({
        error: "invalid_grant",
        error_description: `refresh_token=${"s".repeat(60)}`,
      }), { status: 400 }),
    }),
    (error: unknown) => {
      assert.match((error as Error).message, /invalid_grant/);
      assert.doesNotMatch((error as Error).message, /s{20}/);
      return true;
    },
  );
});

test("expired Cynaps3 OAuth credentials rotate before provider sync", async () => {
  const preset = oauthProviderPreset("cynaps3", {})!;
  let requestBody = "";
  const refreshed = await refreshOAuthCredentials({
    preset,
    credentials: {
      token: "access-old",
      refreshToken: "refresh-old",
      expiresAt: "2026-07-15T11:59:00.000Z",
    },
    now: Date.parse("2026-07-15T12:00:00.000Z"),
    fetchImpl: async (_url, init) => {
      requestBody = String(init?.body);
      return new Response(JSON.stringify({
        access_token: "access-new",
        token_type: "Bearer",
        refresh_token: "refresh-new",
        expires_in: 7200,
      }), { status: 200 });
    },
  });
  assert.match(requestBody, /grant_type=refresh_token/);
  assert.match(requestBody, /client_id=musicmation-skill-4290992cf2f40370/);
  assert.match(requestBody, /refresh_token=refresh-old/);
  assert.deepEqual(refreshed, {
    token: "access-new",
    refreshToken: "refresh-new",
    expiresAt: "2026-07-15T14:00:00.000Z",
  });
});

test("expired OAuth without a refresh token fails closed", async () => {
  await assert.rejects(
    () => refreshOAuthCredentials({
      preset: oauthProviderPreset("cynaps3", {})!,
      credentials: { token: "expired", expiresAt: "2026-07-15T11:00:00.000Z" },
      now: Date.parse("2026-07-15T12:00:00.000Z"),
    }),
    /run vibetracker connect cynaps3/,
  );
});

test("connect routes preset OAuth before the manual secret prompt and sync refreshes first", () => {
  const cli = readFileSync("packages/cli/src/vibetracker.ts", "utf8");
  const presetBranch = cli.indexOf("const preset = oauthProviderPreset(provider)");
  const manualPrompt = cli.indexOf("if (missingNow.length && process.stdin.isTTY)");
  assert.ok(presetBranch > 0 && presetBranch < manualPrompt);
  assert.match(cli, /if \(preset && !hasExplicitCreds\)/);
  assert.match(cli, /Object\.assign\(creds, await authorizeOAuthProvider/);
  assert.match(cli, /await refreshOAuthCredentials\(\{ preset, credentials: current \}\)/);
  assert.match(cli, /await resolveFreshProviderCreds\(id, cfg\)/);
});

test("OAuth callback validates state and returns code", async () => {
  const port = await freePort();
  const pending = waitForOAuthCallback({ port, state: "expected-state", timeoutMs: 2_000 });
  await new Promise<void>((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/callback?state=expected-state&code=code-789`, (res) => {
      res.resume();
      res.on("end", resolve);
    }).on("error", reject);
  });
  const callback = await pending;
  try {
    assert.equal(callback.code, "code-789");
  } finally {
    callback.close();
  }
});

test("OAuth callback reports cancellation immediately", async () => {
  const port = await freePort();
  const pending = waitForOAuthCallback({ port, state: "expected-state", timeoutMs: 2_000 });
  const rejected = assert.rejects(pending, /OAuth authorization failed: User cancelled/);
  await new Promise<void>((resolve, reject) => {
    http.get(
      `http://127.0.0.1:${port}/callback?state=expected-state&error=access_denied&error_description=User+cancelled`,
      (res) => {
        res.resume();
        res.on("end", resolve);
      },
    ).on("error", reject);
  });
  await rejected;
});

test("redeemCynaps3WithClerkToken drives the first-party headless connect end to end", async () => {
  const calls: Array<{ url: string; body: string }> = [];
  let issuedState = "";
  const fetchImpl = (async (url: string | URL, init?: { body?: unknown }) => {
    const u = String(url);
    const body = String(init?.body ?? "");
    calls.push({ url: u, body });
    if (u.endsWith("/authorize")) {
      const parsed = JSON.parse(body) as Record<string, string>;
      assert.equal(parsed.client_id, "musicmation-skill-4290992cf2f40370");
      assert.equal(parsed.redirect_uri, "http://localhost:19876/callback");
      assert.equal(parsed.clerk_token, "CLERK_SESSION_JWT");
      assert.ok(parsed.state.length >= 32, "state respects the 32-char server minimum");
      assert.equal(parsed.code_challenge_method, "S256");
      issuedState = parsed.state;
      return new Response(JSON.stringify({
        redirect_uri: `http://localhost:19876/callback?code=AUTHCODE123&state=${parsed.state}`,
      }), { status: 200 });
    }
    // token exchange
    assert.match(body, /grant_type=authorization_code/);
    assert.match(body, /code=AUTHCODE123/);
    assert.match(body, /code_verifier=/);
    return new Response(JSON.stringify({
      access_token: "access-new", token_type: "Bearer", refresh_token: "refresh-new", expires_in: 3600,
    }), { status: 200 });
  }) as unknown as typeof fetch;

  const credentials = await redeemCynaps3WithClerkToken("CLERK_SESSION_JWT", { fetchImpl });
  assert.equal(credentials.token, "access-new");
  assert.equal(credentials.refreshToken, "refresh-new");
  assert.ok(credentials.expiresAt, "rotating credentials carry an expiry");
  assert.equal(calls.length, 2, "authorize + token exchange, nothing else");
  assert.ok(issuedState.length >= 32);
});

test("redeemCynaps3WithClerkToken maps a 401 to the friendly expired-session message", async () => {
  const fetchImpl = (async () => new Response(JSON.stringify({ error: "login_required" }), { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(
    () => redeemCynaps3WithClerkToken("stale", { fetchImpl }),
    /session expired mid-connect — click Connect again/,
  );
});
