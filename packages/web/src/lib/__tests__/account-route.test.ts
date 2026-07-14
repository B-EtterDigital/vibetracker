import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { accountIdentityFromSession, accountRedirectUrl, safeNextPath } from "../../app/account/account-session.ts";
import { c0vibeAuthorizationUrl, c0vibeBridgeMessage } from "../c0vibe-account-bridge.ts";

const page = readFileSync("packages/web/src/app/account/page.tsx", "utf8");
const consoleSource = readFileSync("packages/web/src/app/account/account-console.tsx", "utf8");
const control = readFileSync("packages/web/src/components/account-control.tsx", "utf8");
const controlCss = readFileSync("packages/web/src/components/account-control.module.css", "utf8");
const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/account/account.css", "utf8");
const callback = readFileSync("packages/web/src/app/auth/callback/route.ts", "utf8");
const browserClient = readFileSync("packages/web/src/lib/supabase-browser.ts", "utf8");
const serverClient = readFileSync("packages/web/src/lib/supabase-server.ts", "utf8");
const bridgeRoute = readFileSync("packages/web/src/app/api/account-bridge/route.ts", "utf8");

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
  assert.equal(accountRedirectUrl("https://vibeusage.c0vibe.app", "/proof"), "https://vibeusage.c0vibe.app/auth/callback?next=%2Fproof");
});

test("C0VIBE migration uses a bounded one-time claim and fixed WorkOS entrypoint", () => {
  const token = "ab".repeat(32);
  assert.equal(c0vibeAuthorizationUrl(token), `https://c0vibe.app/auth/workos/authkit?via=vibeusage&bridge=${token}`);
  assert.throws(() => c0vibeAuthorizationUrl(token, "https://evil.example"), /invalid C0VIBE auth origin/);
  assert.match(c0vibeBridgeMessage("conflict"), /already linked to another account/);
  assert.match(bridgeRoute, /admin\.auth\.getUser\(authorization\.slice\(7\)\)/);
  assert.match(bridgeRoute, /vibetracker_create_workos_link_claim/);
  assert.match(bridgeRoute, /p_ttl_seconds: 600/);
  assert.match(bridgeRoute, /c0vibeAuthorizationUrl/);
  assert.match(consoleSource, /link to C0VIBE/);
  assert.match(consoleSource, /window\.location\.assign\(payload\.authorizationUrl\)/);
  assert.doesNotMatch(bridgeRoute, /email.*claim|provider_token|localStorage|sessionStorage/);
});

test("global shell exposes an obvious GitHub sign-in control without requiring C0VIBE", () => {
  assert.match(layout, /<AccountControl \/>/);
  assert.match(layout, /href="\/account"/);
  assert.match(control, /api\/identity\/github\/status/);
  assert.match(control, /\? "Sign in GitHub"/);
  assert.match(control, /\? "Finish setup"/);
  assert.match(control, /no C0VIBE account required/);
  assert.match(control, /data-short-label=\{shortLabel\}/);
  assert.match(control, /state === "linked" \? "✓"/);
  assert.match(controlCss, /min-width: 136px/);
  assert.match(controlCss, /content: attr\(data-short-label\)/);
  assert.doesNotMatch(control, /signInWithOAuth|provider_token|localStorage|sessionStorage/);
});

test("account console uses real GitHub OAuth when available and the verified CLI path otherwise", () => {
  assert.match(page, /Sign in with GitHub\. Keep your usage history\./);
  assert.match(page, /Both resolve to one GitHub identity, not a full C0VIBE account/);
  assert.match(page, /browser session or existing CLI/);
  assert.match(page, /blue check.*identity only, NOT usage truth/i);
  assert.match(consoleSource, /signInWithOAuth\(\{/);
  assert.match(consoleSource, /provider: "github"/);
  assert.match(consoleSource, /scopes: "read:user user:email"/);
  assert.match(consoleSource, /sign in with GitHub/);
  assert.match(consoleSource, /const CLI_COMMAND = "npx vibetracker login"/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText\(CLI_COMMAND\)/);
  assert.match(consoleSource, /verify this machine/);
  assert.match(consoleSource, /GitHub CLI verification is live now/);
  assert.match(consoleSource, /onClick=\{signIn\}/);
  assert.match(consoleSource, /onClick=\{copyCliCommand\}/);
  assert.match(consoleSource, /role="group" aria-label="Identity path explanation"/);
  assert.match(consoleSource, /aria-pressed=\{proofChannel === "browser"\}/);
  assert.match(consoleSource, /Browser sign-in gives this site a session/);
  assert.match(consoleSource, /The raw GitHub token is used once.*never persisted by VibeTRACKER/);
  assert.match(consoleSource, /OAuth and GitHub CLI proof resolve to the same immutable subject/);
  assert.match(consoleSource, /signOut\(\{ scope: "local" \}\)/);
  assert.doesNotMatch(consoleSource, /localStorage|sessionStorage|provider_refresh_token/);
});

test("OAuth callback exchanges the one-time code server-side and links the GitHub subject", () => {
  assert.match(browserClient, /createBrowserClient/);
  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookieStore\.getAll\(\)/);
  assert.match(serverClient, /cookieStore\.set\(name, value, options\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /data\.session\.provider_token/);
  assert.match(callback, /linkGitHubAccount\(data\.user\.id, data\.session\.provider_token\)/);
  assert.match(callback, /safeNextPath\(url\.searchParams\.get\("next"\)\)/);
  assert.match(callback, /cache-control.*private, no-store/);
  assert.doesNotMatch(callback, /console\.log|provider_token.*searchParams|github_token/);
});

test("account layout remains bounded, responsive, and motion-safe", () => {
  assert.match(styles, /grid-template-columns: minmax\(0, \.9fr\) minmax\(480px, 1\.1fr\)/);
  assert.match(styles, /@media \(max-width: 920px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(min-width: 2200px\)/);
  assert.match(styles, /width: min\(1680px, calc\(100% - 64px\)\)/);
  assert.match(styles, /account-console__oauth li > span \{ color: #5ba9ff/);
  assert.match(styles, /account-console__entry-actions/);
  assert.match(styles, /account-console__proof-tabs button\[aria-pressed="true"\]/);
  assert.match(styles, /account-console__oauth li small/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /width: min\(1320px, calc\(100% - 32px\)\)/);
  assert.match(styles, /width: calc\(100% - 16px\)/);
});
