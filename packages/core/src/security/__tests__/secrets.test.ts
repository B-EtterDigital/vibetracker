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

test("redactSecrets covers every key shape that has actually leaked", () => {
  // These are the exact families exposed in prior sessions — each must be scrubbed from any output.
  const values = {
    openaiAdmin: "sk-admin-ABCDEFGHIJKLMNOPQRSTUVWX",
    openrouter: "sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef",
    supabase: "sbp_" + "A".repeat(40),
    runpod: "rpa_ABCDEFGHIJ0123456789KLMNOPQRSTUVWX",
    browserbase: "bb_live_ABCDEFGHIJKLMNOPQRSTUVWX",
    huggingface: "hf_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345",
    fal: "12345678-1234-1234-1234-123456789abc:0123456789abcdef0123456789abcdef",
    clerkSession: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.SflKxwRJSMeKKF2QT4",
  };
  const red = redactSecrets(values) as Record<string, string>;
  for (const [name, raw] of Object.entries(values)) {
    // The distinctive secret body must be gone (a short static prefix like "sk-" alone is fine).
    const body = raw.split(/[-_:.]/).find((p) => p.length >= 12) ?? raw;
    assert.ok(!red[name].includes(body), `${name}: raw secret body must not survive redaction`);
  }
  // scanSecrets also flags them (belt-and-suspenders for the upload guard).
  assert.ok(scanSecrets(values).some((f) => f.kind === "supabase_token"));
  assert.ok(scanSecrets(values).some((f) => f.kind === "fal_key"));
});
