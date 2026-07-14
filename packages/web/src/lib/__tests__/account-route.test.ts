import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { accountIdentityFromSession, accountRedirectUrl, safeNextPath } from "../../app/account/account-session.ts";

const page = readFileSync("packages/web/src/app/account/page.tsx", "utf8");
const consoleSource = readFileSync("packages/web/src/app/account/account-console.tsx", "utf8");
const control = readFileSync("packages/web/src/components/account-control.tsx", "utf8");
const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/account/account.css", "utf8");

test("account identity derives only bounded GitHub display fields", () => {
  const identity = accountIdentityFromSession({ user: {
    email: "fallback@example.com",
    user_metadata: { user_name: "ignored", avatar_url: "https://evil.example/avatar.png" },
    identities: [{ provider: "github", identity_data: {
      user_name: "B-EtterDigital",
      full_name: "Better Digital\u0000",
      avatar_url: "https://avatars.githubusercontent.com/u/123?v=4",
    } }],
  } });
  assert.deepEqual(identity, {
    handle: "B-EtterDigital",
    displayName: "Better Digital",
    avatarUrl: "https://avatars.githubusercontent.com/u/123?v=4",
    provider: "github",
  });
});

test("account identity constrains email-derived fallback handles", () => {
  assert.equal(accountIdentityFromSession({ user: { email: "bad.handle+tag@example.com" } })?.handle, "account");
  assert.equal(accountIdentityFromSession({ user: { email: "safe-handle@example.com" } })?.handle, "safe-handle");
});

test("account return paths stay same-origin and avoid account loops", () => {
  assert.equal(safeNextPath("/cli-login?code=ABCD-1234"), "/cli-login?code=ABCD-1234");
  assert.equal(safeNextPath("https://evil.example"), null);
  assert.equal(safeNextPath("//evil.example/path"), null);
  assert.equal(safeNextPath("/account"), null);
  assert.equal(accountRedirectUrl("https://vibeusage.c0vibe.app", "/proof"), "https://vibeusage.c0vibe.app/account?next=%2Fproof");
});

test("global shell exposes a stable identity control without claiming verification early", () => {
  assert.match(layout, /<AccountControl \/>/);
  assert.match(layout, /href="\/account"/);
  assert.match(control, /api\/identity\/github\/status/);
  assert.match(control, /state === "linked" \? "✓"/);
  assert.doesNotMatch(control, /signInWithOAuth|provider_token|localStorage|sessionStorage/);
});

test("account console supports GitHub OAuth, CLI fallback, local sign-out, and one-time linking", () => {
  assert.match(page, /Verify once\. Keep your CLI history\./);
  assert.match(page, /blue check.*identity only, NOT usage truth/i);
  assert.match(consoleSource, /signInWithOAuth\(\{/);
  assert.match(consoleSource, /provider: "github"/);
  assert.match(consoleSource, /scopes: "read:user"/);
  assert.match(consoleSource, /api\/identity\/github\/link/);
  assert.match(consoleSource, /github_token: providerToken/);
  assert.match(consoleSource, /signOut\(\{ scope: "local" \}\)/);
  assert.match(consoleSource, /npx vibetracker login/);
  assert.match(consoleSource, /GitHub OAuth needs enabling/);
  assert.doesNotMatch(consoleSource, /localStorage|sessionStorage|provider_refresh_token/);
});

test("account layout remains bounded, responsive, and motion-safe", () => {
  assert.match(styles, /grid-template-columns: minmax\(0, \.9fr\) minmax\(480px, 1\.1fr\)/);
  assert.match(styles, /@media \(max-width: 920px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /width: min\(1320px, calc\(100% - 32px\)\)/);
  assert.match(styles, /width: calc\(100% - 16px\)/);
});
