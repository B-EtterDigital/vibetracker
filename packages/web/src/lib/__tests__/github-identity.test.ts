import { test } from "node:test";
import assert from "node:assert/strict";
import { GitHubIdentityError, verifyGitHubAccessToken } from "../auth.ts";

test("GitHub verifier returns only sanitized public identity fields", async () => {
  let authorization = "";
  const profile = await verifyGitHubAccessToken("secret-token", async (_input, init) => {
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return Response.json({
      id: 123456,
      login: "B-EtterDigital",
      name: "  Better\u0000 Digital  ",
      email: "private@example.com",
      avatar_url: "https://avatars.githubusercontent.com/u/123456?v=4",
    });
  });
  assert.equal(authorization, "Bearer secret-token");
  assert.deepEqual(profile, {
    subject: "123456",
    login: "B-EtterDigital",
    displayName: "Better Digital",
    avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  });
  assert.equal("email" in profile, false);
  assert.equal(JSON.stringify(profile).includes("secret-token"), false);
});

test("GitHub verifier rejects expired credentials and malformed identities without echoing tokens", async () => {
  await assert.rejects(
    verifyGitHubAccessToken("expired-secret", async () => new Response(null, { status: 401 })),
    (error: unknown) => error instanceof GitHubIdentityError
      && error.code === "github_unauthorized"
      && !error.message.includes("expired-secret"),
  );
  await assert.rejects(
    verifyGitHubAccessToken("valid-secret", async () => Response.json({ id: null, login: "<script>" })),
    /identity response is incomplete/,
  );
});
