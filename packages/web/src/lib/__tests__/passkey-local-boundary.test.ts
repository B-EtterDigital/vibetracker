import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPasskeyBoundarySnapshot } from "../passkey-local-boundary.ts";

test("local passkey boundary keeps GitHub as account authority and usage frozen", () => {
  const snapshot = buildPasskeyBoundarySnapshot({ state: "asserted", supported: true, hasCredential: true });

  assert.equal(snapshot.stateLabel, "authenticator responded locally");
  assert.equal(snapshot.browserLabel, "secure WebAuthn context");
  assert.equal(snapshot.localReferenceLabel, "stored in this browser");
  assert.equal(snapshot.accountAuthority, "GitHub / C0VIBE server");
  assert.equal(snapshot.serverVerified, false);
  assert.equal(snapshot.usageMutations, 0);
  assert.equal(snapshot.rankDelta, 0);
  assert.deepEqual(snapshot.rails.map((rail) => rail.id), ["account", "authenticator", "usage"]);
  assert.equal(snapshot.rails[0].value, "GitHub first");
  assert.match(snapshot.rails[1].note, /does not send the assertion/);
  assert.match(snapshot.rails[2].note, /do not validate provider usage/);
});

test("local passkey boundary exposes unsupported and empty states without promotion", () => {
  const snapshot = buildPasskeyBoundarySnapshot({ state: "idle", supported: false, hasCredential: false });

  assert.equal(snapshot.stateLabel, "no local key reference");
  assert.equal(snapshot.browserLabel, "WebAuthn unavailable");
  assert.equal(snapshot.localReferenceLabel, "none stored");
  assert.equal(snapshot.serverVerified, false);
});
