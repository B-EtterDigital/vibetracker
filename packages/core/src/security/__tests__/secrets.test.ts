import { test } from "node:test";
import assert from "node:assert/strict";
import { redactSecrets, scanSecrets } from "../secrets.ts";

test("scanSecrets finds sensitive fields and token-shaped values", () => {
  const findings = scanSecrets({
    apiKey: "sk-123456789012345678901234",
    nested: { model: "safe", note: "Bearer abcdefghijklmnopqrstuvwxyz123456" },
  });
  assert.ok(findings.some((f) => f.kind === "sensitive_field" && f.path === "$.apiKey"));
  assert.ok(findings.some((f) => f.kind === "openai_key"));
  assert.ok(findings.some((f) => f.kind === "bearer_token"));
});

test("redactSecrets removes suspicious values without mutating original", () => {
  const input = { token: "ghp_abcdefghijklmnopqrstuvwxyz123456", model: "not secret" };
  const redacted = redactSecrets(input);
  assert.equal(redacted.token, "[REDACTED]");
  assert.equal(redacted.model, "not secret");
  assert.notEqual(redacted, input);
});
