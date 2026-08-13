import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const verifyRoute = readFileSync("packages/web/src/app/api/cli/github-verify/route.ts", "utf8");
const linkRoute = readFileSync("packages/web/src/app/api/identity/github/link/route.ts", "utf8");
const statusRoute = readFileSync("packages/web/src/app/api/identity/github/status/route.ts", "utf8");
const accountLink = readFileSync("packages/web/src/lib/github-account-link.ts", "utf8");
const migration = readFileSync("supabase/migrations/009_vibetracker_github_identity.sql", "utf8");
const cli = readFileSync("packages/cli/src/vibetracker.ts", "utf8");
const login = readFileSync("packages/cli/src/login.ts", "utf8");

test("GitHub device verification exchanges an existing gh credential without persisting it", () => {
  assert.match(verifyRoute, /verifyGitHubAccessToken\(githubToken\)/);
  assert.match(verifyRoute, /vibetracker_verify_github_device/);
  assert.match(verifyRoute, /identity: \{[\s\S]*provider: "github"[\s\S]*verified: true/);
  assert.match(login, /\^\[a-z0-9_\.\-\]\{1,64\}\$/);
  assert.match(cli, /if \(login\.identity\) cfg\.handle = login\.identity\.handle/);
  assert.match(cli, /storeToken\(cfg, login\.accessToken\)/);
  assert.doesNotMatch(migration, /github_token|access_token/);
  assert.doesNotMatch(verifyRoute, /console\.log|github_token:\s*githubToken/);
});

test("WorkOS migration requires both an account session and fresh GitHub proof", () => {
  assert.match(linkRoute, /admin\.auth\.getUser\(authorization\.slice\(7\)\)/);
  assert.match(linkRoute, /linkGitHubAccount/);
  assert.match(accountLink, /verifyGitHubAccessToken\(providerToken\)/);
  assert.match(accountLink, /vibetracker_link_github_identity/);
  assert.match(migration, /already linked to another account/);
  assert.match(migration, /set user_id = p_user_id, identity_id = v_identity\.id/);
});

test("identity migration keeps proof and usage truth separate", () => {
  assert.match(migration, /provider_subject/);
  assert.match(migration, /Raw GitHub credentials and OAuth tokens are never persisted/);
  assert.match(migration, /s\.tier as usage_tier/);
  assert.match(migration, /identity_verified/);
  assert.match(migration, /service_role/);
  assert.match(migration, /No table policies/);
});

test("account identity status requires a real session and returns sanitized link state", () => {
  assert.match(statusRoute, /admin\.auth\.getUser\(authorization\.slice\(7\)\)/);
  assert.match(statusRoute, /\.from\("vibetracker_identities"\)/);
  assert.match(statusRoute, /\.from\("vibetracker_identity_session_aliases"\)/);
  assert.match(statusRoute, /\.eq\("id", alias\.identity_id\)/);
  assert.match(statusRoute, /provider_login, canonical_handle, display_name, avatar_url, verified_at, linked_at/);
  assert.match(statusRoute, /linked: false/);
  assert.match(statusRoute, /\.from\("vibetracker_account_links"\)/);
  assert.match(statusRoute, /c0vibeLinked: Boolean\(c0vibeLink\)/);
  assert.match(statusRoute, /cache-control.*private, no-store/);
  assert.match(statusRoute, /web\.auth\.github-status\.read/);
  assert.match(statusRoute, /web\.auth\.github-status\.alias-read/);
  assert.match(statusRoute, /web\.auth\.github-status\.alias-identity-read/);
  assert.doesNotMatch(statusRoute, /token_hash|issued_token|service_role|github_token/);
});
