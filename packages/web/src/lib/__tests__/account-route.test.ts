import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
import {
  accountCallbackOrigin,
  accountIdentityFromSession,
  accountRedirectUrl,
  LAST_SIGNED_IN_HANDLE_KEY,
  persistLastSignedInHandle,
  readLastSignedInHandle,
  safeAccountOrigin,
  safeNextPath,
} from "../../app/account/account-session.ts";
import { SUPABASE_BROWSER_AUTH_OPTIONS, SUPABASE_BROWSER_COOKIE_OPTIONS } from "../supabase-browser.ts";
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
const ticker = readFileSync("packages/web/src/components/site-ticker.tsx", "utf8");
const globalStyles = readFileSync("packages/web/src/app/globals.css", "utf8");

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

test("last signed-in handle persists independently from the auth session", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  assert.equal(LAST_SIGNED_IN_HANDLE_KEY, "vtk-last-handle");
  assert.equal(persistLastSignedInHandle(storage, "B-EtterDigital"), "b-etterdigital");
  assert.equal(values.get("vtk-last-handle"), "b-etterdigital");
  assert.equal(readLastSignedInHandle(storage), "b-etterdigital");
  assert.equal(persistLastSignedInHandle(storage, "bad.handle"), "");
  assert.equal(values.get("vtk-last-handle"), "b-etterdigital");

  values.set("vtk-last-handle", "../../evil");
  assert.equal(readLastSignedInHandle(storage), "");
  values.set("vtk-last-handle", "<img src=x onerror=alert(1)>");
  assert.equal(readLastSignedInHandle(storage), "");
});

test("account return paths stay same-origin and avoid account loops", () => {
  assert.equal(safeNextPath("/cli-login?code=ABCD-1234"), "/cli-login?code=ABCD-1234");
  assert.equal(safeNextPath("https://evil.example"), null);
  assert.equal(safeNextPath("//evil.example/path"), null);
  assert.equal(safeNextPath("/account"), null);
  assert.equal(accountRedirectUrl("https://vibeusage.c0vibe.app", "/proof"), "https://vibeusage.c0vibe.app/auth/callback?next=%2Fproof");
  assert.equal(
    accountRedirectUrl("https://vibeusage.c0vibe.app", null, "c0vibe-link"),
    "https://vibeusage.c0vibe.app/auth/callback?intent=c0vibe-link",
  );
  assert.equal(accountRedirectUrl("https://vibeusage.c0vibe.app", null, "unsafe"), "https://vibeusage.c0vibe.app/auth/callback");
});

test("OAuth callbacks prefer the canonical public host over Netlify's deploy URL", () => {
  const production = new Request("https://6a574a33eabc1336f651c7d4--vibeusage.netlify.app/auth/callback", {
    headers: { host: "vibeusage.c0vibe.app" },
  });
  const forwarded = new Request("https://6a574a33eabc1336f651c7d4--vibeusage.netlify.app/auth/callback", {
    headers: { "x-forwarded-host": "vibeusage.c0vibe.app, internal.netlify" },
  });
  const preview = new Request("https://deploy-preview-42--vibeusage.netlify.app/auth/callback", {
    headers: { host: "deploy-preview-42--vibeusage.netlify.app" },
  });
  const spoofed = new Request("https://internal.example/auth/callback", {
    headers: { host: "evil.example" },
  });
  const local = new Request("http://localhost:3000/auth/callback");

  assert.equal(accountCallbackOrigin(production), "https://vibeusage.c0vibe.app");
  assert.equal(accountCallbackOrigin(forwarded), "https://vibeusage.c0vibe.app");
  assert.equal(accountCallbackOrigin(preview), "https://deploy-preview-42--vibeusage.netlify.app");
  assert.equal(accountCallbackOrigin(spoofed), "https://vibeusage.c0vibe.app");
  assert.equal(accountCallbackOrigin(local), "http://localhost:3000");
  assert.match(callback, /const origin = accountCallbackOrigin\(request\)/);
  assert.doesNotMatch(callback, /redirect\(url\.origin/);
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

// Transpiles and executes the standalone C0VIBE sign-in component so its render can be driven
// by the WorkOS availability seam (the `available` prop) and asserted as real output markup.
function loadC0vibeSignIn() {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const react = projectRequire("react");
  const jsxRuntime = projectRequire("react/jsx-runtime");
  const source = readFileSync("packages/web/src/app/account/account-c0vibe-signin.tsx", "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "react") return react;
    if (id === "react/jsx-runtime") return jsxRuntime;
    throw new Error(`unexpected account-c0vibe-signin import: ${id}`);
  };
  new Function("require", "exports", "module", output)(stubRequire, loaded.exports, loaded);
  return {
    AccountC0vibeSignIn: loaded.exports.AccountC0vibeSignIn as (props: unknown) => unknown,
    createElement: react.createElement as (type: unknown, props: unknown) => unknown,
    renderToStaticMarkup: projectRequire("react-dom/server").renderToStaticMarkup as (node: unknown) => string,
  };
}

test("C0VIBE sign-in renders only when WorkOS availability is true", () => {
  const { AccountC0vibeSignIn, createElement, renderToStaticMarkup } = loadC0vibeSignIn();
  const noop = () => {};

  // Availability false (the state today: link-only bridge, WorkOS provider disabled) -> nothing renders.
  const hidden = renderToStaticMarkup(createElement(AccountC0vibeSignIn, { available: false, disabled: false, onClick: noop }));
  assert.equal(hidden, "");

  // Availability true -> the C0VIBE button renders with the gradient class and stacked-button label.
  const visible = renderToStaticMarkup(createElement(AccountC0vibeSignIn, { available: true, disabled: false, onClick: noop }));
  assert.match(visible, /sign in with C0VIBE/);
  assert.match(visible, /class="account-console__c0vibe"/);
  assert.doesNotMatch(visible, /disabled/);

  // Busy state disables the button while it stays visible.
  const disabled = renderToStaticMarkup(createElement(AccountC0vibeSignIn, { available: true, disabled: true, onClick: noop }));
  assert.match(disabled, /disabled/);
});

test("account console offers C0VIBE sign-in beside GitHub through the existing WorkOS bridge", () => {
  // GitHub sign-in and the stacked C0VIBE option share the one signins column.
  assert.match(consoleSource, /sign in with GitHub/);
  assert.match(consoleSource, /className="account-console__signins"/);
  // The console owns the availability seam and passes it to the render-gated C0VIBE component.
  assert.match(consoleSource, /setWorkosProvider\(availability\.workos\)/);
  assert.match(consoleSource, /<AccountC0vibeSignIn available=\{workosProvider\} disabled=\{busy\} onClick=\{signInWithC0VIBE\} \/>/);
  // The C0VIBE handler drives the existing bridge (POST /api/account-bridge, which builds the URL
  // via c0vibeAuthorizationUrl) for a returning viber, and the WorkOS provider for a cold sign-in.
  assert.match(consoleSource, /async function signInWithC0VIBE\(\)/);
  assert.match(consoleSource, /await linkToC0VIBE\(\)/);
  assert.match(consoleSource, /fetch\("\/api\/account-bridge"/);
  assert.match(consoleSource, /provider: "workos"/);
  // The cold redirect origin is clamped to the account allowlist before it reaches the provider.
  assert.match(consoleSource, /safeAccountOrigin\(window\.location\.origin\)/);
  assert.match(consoleSource, /redirectTo: accountRedirectUrl\(origin, next\)/);
  // The C0VIBE surface (entry + linked-state bridge button) reuses the exact .vflip-btn gradient.
  assert.match(consoleSource, /className="account-console__c0vibe"/);
  assert.match(styles, /linear-gradient\(120deg, #2ee8d6, #f28c33, #ffc64d\) border-box/);
  // Helper copy names both identity paths for migrated vibers.
  assert.match(consoleSource, /GitHub or your C0VIBE account — migrated vibers can use either\./);
});

test("account redirect origin is clamped to the canonical + preview allowlist", () => {
  assert.equal(safeAccountOrigin("https://vibeusage.c0vibe.app"), "https://vibeusage.c0vibe.app");
  assert.equal(safeAccountOrigin("https://deploy-preview-42--vibeusage.netlify.app"), "https://deploy-preview-42--vibeusage.netlify.app");
  assert.equal(safeAccountOrigin("https://vibeusage.netlify.app"), "https://vibeusage.netlify.app");
  assert.equal(safeAccountOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(safeAccountOrigin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  assert.equal(safeAccountOrigin("https://evil.example"), "https://vibeusage.c0vibe.app");
  assert.equal(safeAccountOrigin("http://vibeusage.c0vibe.app"), "https://vibeusage.c0vibe.app");
  assert.equal(safeAccountOrigin("not a url"), "https://vibeusage.c0vibe.app");
});

test("OAuth callback links GitHub proofs even for migrated accounts and completes WorkOS sessions without a GitHub token", () => {
  // Provider is derived from the exchanged session, not assumed.
  assert.match(callback, /const provider = data\.user\.app_metadata\?\.provider/);
  assert.match(callback, /data\.user\.identities\?\.find\(\(identity\) => identity\.provider\)\?\.provider/);
  // A provider token identifies the current GitHub callback even when app_metadata still
  // names WorkOS as the migrated account's primary provider.
  assert.match(callback, /if \(data\.session\.provider_token\) \{/);
  assert.match(callback, /await linkGitHubAccount\(data\.user\.id, data\.session\.provider_token\)/);
  assert.match(callback, /else if \(provider === "github"\) \{/);
  // A non-GitHub return still reaches the success redirect without being routed through linking.
  const linkIndex = callback.indexOf("linkGitHubAccount(data.user.id");
  const successIndex = callback.lastIndexOf('return redirect(origin, next, "success", intent)');
  assert.ok(linkIndex >= 0 && successIndex > linkIndex);
  assert.doesNotMatch(callback, /console\.log|provider_token.*searchParams|github_token/);
});

test("global shell exposes an obvious GitHub sign-in control without requiring C0VIBE", () => {
  assert.match(layout, /<AccountControl \/>/);
  assert.ok(operatorRouteFor("/account"));
  assert.match(control, /api\/identity\/github\/status/);
  assert.match(control, /\? "Sign in with GitHub"/);
  assert.match(control, /\? "Continue setup"/);
  assert.match(control, /state === "session" \? "#c0vibe-connection"/);
  assert.match(control, /GitHub or your C0VIBE account — migrated vibers can use either\./);
  assert.match(control, /usePathname\(\)/);
  assert.match(control, /account\?next=\$\{encodeURIComponent\(pathname \|\| "\/"\)\}/);
  assert.match(control, /payload\.identity\?\.avatarUrl/);
  assert.match(control, /state === "linked" && avatarUrl \? <i>✓<\/i>/);
  assert.match(control, /data-short-label=\{shortLabel\}/);
  assert.match(control, /state === "linked" \? "✓"/);
  assert.match(control, /signInWithOAuth\(\{/);
  assert.match(control, /provider: "github"/);
  assert.match(control, /accountRedirectUrl\(window\.location\.origin, pathname \|\| "\/"\)/);
  assert.match(control, /scopes: "read:user user:email"/);
  assert.match(control, /telemetry\.captureError\(error, \{ area: "web\.auth\.header-oauth", severity: "warn" \}\)/);
  assert.match(control, /setState\("unavailable"\)/);
  assert.match(control, /readLastSignedInHandle\(window\.localStorage\)/);
  assert.match(control, /persistLastSignedInHandle\(window\.localStorage, nextHandle\)/);
  assert.match(control, /const profileHref = profileHandle \? `\/u\/\$\{profileHandle\}` : null/);
  assert.match(consoleSource, /Connect VibeUsage in four clear steps\./);
  assert.match(consoleSource, /Verify this GitHub identity/);
  assert.match(consoleSource, /Link this identity to C0VIBE/);
  assert.match(consoleSource, /params\.get\("intent"\) === "c0vibe-link"/);
  assert.match(styles, /\.account-c0vibe-guide/);
  assert.match(control, /data-state=\{profileState\}/);
  assert.match(control, /\{profileHref \? \(/);
  assert.match(control, /<a className=\{styles\.control\}/);
  assert.match(controlCss, /min-width: 136px/);
  assert.match(controlCss, /\.mark img/);
  assert.match(controlCss, /\.mark i/);
  assert.match(controlCss, /content: attr\(data-short-label\)/);
  assert.match(controlCss, /\.profileLink\[data-state="signed-out"\]/);
  assert.doesNotMatch(control, /provider_token|sessionStorage/);
});

test("signed-out topbar keeps the retained public profile beside the sign-in chip", () => {
  const profileChip = control.indexOf("{profileHref ? (");
  const signInChip = control.indexOf("<a className={styles.control}");

  assert.ok(profileChip >= 0 && signInChip > profileChip);
  assert.match(control, /const profileState = state === "signed-out" \? "signed-out" : "active"/);
  assert.match(control, /data-state=\{profileState\} href=\{profileHref\}/);
  assert.match(control, /const directSignIn = state === "signed-out"/);
  assert.match(controlCss, /\.profileLink\[data-state="signed-out"\]/);
});

test("global shell ticker uses live board data and remains motion-safe", () => {
  assert.match(layout, /import \{ SiteTicker \}/);
  assert.match(layout, /<SiteTicker \/>/);
  assert.match(ticker, /vibetracker_leaderboard_self_reported/);
  assert.match(ticker, /vibetracker_submissions/);
  assert.match(layout, /import \{ CLI_RUNNER \} from "\.\.\/lib\/cli-command\.ts"/);
  assert.match(ticker, /`run \$\{CLI_RUNNER\} to join`/);
  assert.match(layout, /<code>\{CLI_RUNNER\}<\/code>/);
  assert.match(ticker, /telemetry\.captureError/);
  assert.match(ticker, /aria-label="Live board stats"/);
  assert.match(ticker, /aria-hidden=\{hidden \|\| undefined\}/);
  assert.match(globalStyles, /@keyframes vticker-roll/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("account console uses real GitHub OAuth when available and the verified CLI path otherwise", () => {
  assert.match(page, /Sign in with GitHub\. Keep your usage history\./);
  assert.match(page, /Both resolve to one GitHub identity, not a full C0VIBE account/);
  assert.match(page, /browser session or existing CLI/);
  assert.match(page, /blue check.*identity only, NOT usage truth/i);
  assert.match(page, /aria-label="Account migration custody receipt"/);
  assert.match(page, /1 IDENTITY \/ 0 CREDENTIAL COPIES/);
  assert.match(page, /The raw GitHub token is checked once and never stored/);
  assert.match(page, /Provider credentials remain local and are never copied into settings/);
  assert.match(page, /<dt>profile forks<\/dt><dd>0<\/dd>/);
  assert.match(page, /<dt>migration claim<\/dt><dd>10 min<\/dd>/);
  assert.match(consoleSource, /signInWithOAuth\(\{/);
  assert.match(consoleSource, /provider: "github"/);
  assert.match(consoleSource, /scopes: "read:user user:email"/);
  assert.match(consoleSource, /sign in with GitHub/);
  assert.match(consoleSource, /const CLI_COMMAND = cliCommand\("login"\)/);
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
  assert.match(consoleSource, /view public profile/);
  assert.match(consoleSource, /return to previous view/);
  assert.match(consoleSource, /aria-label="Identity ledger"/);
  assert.match(consoleSource, /<small>Usage proof<\/small><b>separate<\/b>/);
  assert.match(consoleSource, /<small>C0VIBE<\/small><b>\{bridgeState === "linked" \? "linked" : "optional"\}<\/b>/);
  assert.match(consoleSource, /signOut\(\{ scope: "local" \}\)/);
  assert.doesNotMatch(consoleSource, /localStorage|sessionStorage|provider_refresh_token/);
});

test("OAuth callback exchanges the one-time code server-side and links the GitHub subject", () => {
  assert.match(browserClient, /createBrowserClient/);
  assert.deepEqual(SUPABASE_BROWSER_AUTH_OPTIONS, {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  });
  assert.deepEqual(SUPABASE_BROWSER_COOKIE_OPTIONS, {
    maxAge: 60 * 60 * 24 * 400,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  assert.match(browserClient, /auth: SUPABASE_BROWSER_AUTH_OPTIONS/);
  assert.match(browserClient, /cookieOptions: SUPABASE_BROWSER_COOKIE_OPTIONS/);
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
  assert.match(styles, /width: min\(2640px, 95vw\)/);
  assert.match(styles, /margin-left: 50%/);
  assert.match(styles, /transform: translateX\(-50%\)/);
  assert.match(styles, /\.account-custody__route \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /account-console__oauth li > span \{ color: #5ba9ff/);
  assert.match(styles, /account-console__entry-actions/);
  assert.match(styles, /account-identity__primary-link/);
  assert.match(styles, /account-identity__ledger/);
  assert.match(styles, /account-console__proof-tabs button\[aria-pressed="true"\]/);
  assert.match(styles, /account-console__oauth li small/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /width: min\(1320px, calc\(100% - 32px\)\)/);
  assert.match(styles, /width: calc\(100% - 16px\)/);
});
