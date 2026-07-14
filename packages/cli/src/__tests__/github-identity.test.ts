import { test } from "node:test";
import assert from "node:assert/strict";
import { readGitHubCliToken } from "../github-identity.ts";

test("readGitHubCliToken returns a trimmed credential from the existing gh session", () => {
  const calls: Array<{ command: string; args: readonly string[] }> = [];
  const token = readGitHubCliToken((command, args) => {
    calls.push({ command, args });
    return { status: 0, stdout: "github-token\n" };
  });
  assert.equal(token, "github-token");
  assert.deepEqual(calls, [{ command: "gh", args: ["auth", "token"] }]);
});

test("readGitHubCliToken fails closed without leaking malformed or unavailable credentials", () => {
  assert.equal(readGitHubCliToken(() => ({ status: 1, stdout: "" })), null);
  assert.equal(readGitHubCliToken(() => ({ status: 0, stdout: "token with spaces" })), null);
  assert.equal(readGitHubCliToken(() => ({ status: 0, stdout: "x".repeat(1025) })), null);
});
