import { test } from "node:test";
import assert from "node:assert/strict";
import { runLogin, type AuthTransport } from "../login.ts";

function transport(pollScript: Array<{ status: "pending" | "approved" | "denied"; access_token?: string }>): AuthTransport {
  let i = 0;
  return {
    async start() { return { device_code: "dc_secret", user_code: "WXYZ-1234", verify_url: "https://vibeusage.c0vibe.app/cli-login", interval: 1 }; },
    async poll() { return pollScript[Math.min(i++, pollScript.length - 1)]; },
  };
}
const noop = { sleep: async () => {}, log: () => {} };

test("runLogin opens the verify URL with the user code and returns the token when approved", async () => {
  const opened: string[] = [];
  const t = transport([{ status: "pending" }, { status: "pending" }, { status: "approved", access_token: "tok_123" }]);
  const login = await runLogin(t, { ...noop, open: (u) => opened.push(u), maxAttempts: 10 });
  assert.deepEqual(login, { accessToken: "tok_123", identity: undefined });
  assert.match(opened[0], /cli-login\?code=WXYZ-1234$/);
});

test("runLogin reuses a GitHub CLI session and skips browser approval", async () => {
  const opened: string[] = [];
  let proof: { deviceCode: string; githubToken: string } | undefined;
  const t: AuthTransport = {
    async start() { return { device_code: "dc_secret", user_code: "WXYZ-1234", verify_url: "https://vibeusage.c0vibe.app/cli-login" }; },
    async poll() { return { status: "pending" }; },
    async verifyGithub(deviceCode, githubToken) {
      proof = { deviceCode, githubToken };
      return { status: "approved", access_token: "vt_github", identity: { provider: "github", handle: "B-EtterDigital", verified: true } };
    },
  };
  const login = await runLogin(t, {
    ...noop,
    open: (url) => opened.push(url),
    githubToken: () => "github_secret",
  });
  assert.deepEqual(login, { accessToken: "vt_github", identity: { provider: "github", handle: "b-etterdigital", verified: true } });
  assert.deepEqual(proof, { deviceCode: "dc_secret", githubToken: "github_secret" });
  assert.deepEqual(opened, []);
});

test("runLogin falls back to browser approval when GitHub proof is rejected", async () => {
  const opened: string[] = [];
  const t = transport([{ status: "approved", access_token: "vt_browser" }]);
  t.verifyGithub = async () => { throw new Error("credential expired"); };
  const login = await runLogin(t, {
    ...noop,
    open: (url) => opened.push(url),
    githubToken: () => "github_expired",
  });
  assert.deepEqual(login, { accessToken: "vt_browser", identity: undefined });
  assert.match(opened[0], /cli-login\?code=WXYZ-1234$/);
});

test("runLogin ignores malformed identity metadata without discarding a valid token", async () => {
  const t: AuthTransport = {
    async start() { return { device_code: "dc_secret", user_code: "WXYZ-1234", verify_url: "https://vibeusage.c0vibe.app/cli-login" }; },
    async poll() { return { status: "pending" }; },
    async verifyGithub() {
      return { status: "approved", access_token: "vt_safe", identity: { provider: "github", handle: "../BAD HANDLE", verified: true } };
    },
  };
  const login = await runLogin(t, { ...noop, open: () => {}, githubToken: () => "github_secret" });
  assert.deepEqual(login, { accessToken: "vt_safe", identity: undefined });
});

test("denied authorization throws", async () => {
  const t = transport([{ status: "denied" }]);
  await assert.rejects(runLogin(t, { ...noop, open: () => {}, maxAttempts: 5 }), /denied/);
});

test("no approval within the attempt budget times out", async () => {
  const t = transport([{ status: "pending" }]);
  await assert.rejects(runLogin(t, { ...noop, open: () => {}, maxAttempts: 2 }), /timed out/);
});
