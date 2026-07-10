import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { buildOAuthUrl, exchangeOAuthCode, pkceChallenge, waitForOAuthCallback } from "../oauth.ts";

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
