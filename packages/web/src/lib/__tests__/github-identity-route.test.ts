import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const verifyRoute = readFileSync("packages/web/src/app/api/cli/github-verify/route.ts", "utf8");
const linkRoute = readFileSync("packages/web/src/app/api/identity/github/link/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/009_vibetracker_github_identity.sql", "utf8");

test("GitHub device verification exchanges an existing gh credential without persisting it", () => {
  assert.match(verifyRoute, /verifyGitHubAccessToken\(githubToken\)/);
  assert.match(verifyRoute, /vibetracker_verify_github_device/);
  assert.match(verifyRoute, /identity: \{[\s\S]*provider: "github"[\s\S]*verified: true/);
  assert.doesNotMatch(migration, /github_token|access_token/);
  assert.doesNotMatch(verifyRoute, /console\.log|github_token:\s*githubToken/);
});

test("WorkOS migration requires both an account session and fresh GitHub proof", () => {
  assert.match(linkRoute, /admin\.auth\.getUser\(authorization\.slice\(7\)\)/);
  assert.match(linkRoute, /verifyGitHubAccessToken/);
  assert.match(linkRoute, /vibetracker_link_github_identity/);
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
