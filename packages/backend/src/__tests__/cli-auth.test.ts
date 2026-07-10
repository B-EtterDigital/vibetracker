import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256Hex, generateDeviceCodes, issueCliToken } from "../cli-auth.ts";

test("device codes: stored hash matches the secret; user code is well-formed", () => {
  const c = generateDeviceCodes();
  assert.equal(c.deviceCodeHash, sha256Hex(c.deviceCode)); // we persist the hash, verify by re-hash
  assert.match(c.userCode, /^[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.ok(c.deviceCode.length >= 40);
});

test("cli token: prefixed, hash matches, and unique per issue", () => {
  const a = issueCliToken();
  const b = issueCliToken();
  assert.match(a.token, /^vt_/);
  assert.equal(a.tokenHash, sha256Hex(a.token)); // raw token never stored; only this hash
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.tokenHash, b.tokenHash);
});
