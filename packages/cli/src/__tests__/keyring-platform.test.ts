import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { keyringForPlatform, type KeyringRunner } from "../keyring.ts";

type Call = { bin: string; args: string[]; input?: string };

// Simulates the macOS `security` CLI backed by an in-memory store, recording every invocation.
function macMock() {
  const store = new Map<string, string>();
  const calls: Call[] = [];
  const run: KeyringRunner = (bin, args, input) => {
    calls.push({ bin, args, input });
    const a = args.indexOf("-a") >= 0 ? args[args.indexOf("-a") + 1] : "";
    if (args[0] === "add-generic-password") {
      store.set(a, args.indexOf("-w") >= 0 ? args[args.indexOf("-w") + 1] : "");
      return { status: 0, stdout: "" };
    }
    if (args[0] === "find-generic-password") {
      return store.has(a) ? { status: 0, stdout: store.get(a)! + "\n" } : { status: 44, stdout: "" };
    }
    if (args[0] === "delete-generic-password") { store.delete(a); return { status: 0, stdout: "" }; }
    return { status: 1, stdout: "" };
  };
  return { run, calls };
}

// Simulates Windows DPAPI as a reversible base64 transform (the real crypto runs only on Windows).
function winMock() {
  const calls: Call[] = [];
  const run: KeyringRunner = (bin, args, input) => {
    calls.push({ bin, args, input });
    const script = args[args.length - 1];
    if (script.includes("Unprotect(")) return { status: 0, stdout: Buffer.from(input ?? "", "base64").toString("utf8") };
    if (script.includes("Protect(")) return { status: 0, stdout: Buffer.from(input ?? "", "utf8").toString("base64") };
    return { status: 1, stdout: "" };
  };
  return { run, calls };
}

test("keyringForPlatform selects a working backend per platform (linux → libsecret interface)", () => {
  const linux = keyringForPlatform("linux");
  for (const m of ["available", "get", "set", "clear"]) assert.equal(typeof (linux as any)[m], "function");
  assert.equal(typeof keyringForPlatform("darwin", macMock().run).set, "function");
  assert.equal(typeof keyringForPlatform("freebsd").get, "function"); // unknown → libsecret fallback
});

test("macOS Keychain backend round-trips; get/clear never carry the secret in argv", () => {
  const { run, calls } = macMock();
  const kr = keyringForPlatform("darwin", run);
  kr.set("suno", "sessionCookie", "SECRET_COOKIE");
  assert.equal(kr.get("suno", "sessionCookie"), "SECRET_COOKIE");
  kr.clear("suno", "sessionCookie");
  assert.equal(kr.get("suno", "sessionCookie"), undefined);

  const finds = calls.filter((c) => c.args[0] === "find-generic-password");
  const deletes = calls.filter((c) => c.args[0] === "delete-generic-password");
  assert.ok(finds.length > 0 && deletes.length > 0);
  for (const c of [...finds, ...deletes]) assert.equal(c.args.includes("SECRET_COOKIE"), false, "read/delete must be argv-safe");
});

test("Windows DPAPI backend is fully argv-safe (secret only ever crosses stdin) and encrypts at rest", () => {
  const vault = join(tmpdir(), "vt-keyring-win-test");
  rmSync(vault, { recursive: true, force: true });
  const { run, calls } = winMock();
  try {
    const kr = keyringForPlatform("win32", run, vault);
    kr.set("udio", "sessionToken", "SECRET_TOKEN");
    assert.equal(kr.get("udio", "sessionToken"), "SECRET_TOKEN");

    // the secret must NEVER appear in any command's argv — only in stdin (input)
    for (const c of calls) assert.equal(c.args.some((a) => a.includes("SECRET_TOKEN")), false, "no secret in argv");
    assert.ok(calls.some((c) => c.input === "SECRET_TOKEN"), "the secret crosses via stdin");

    // the on-disk blob is the base64 ciphertext, not the plaintext
    const file = join(vault, "udio__sessionToken.dpapi");
    assert.equal(existsSync(file), true);
    assert.equal(readFileSync(file, "utf8").includes("SECRET_TOKEN"), false, "at-rest blob is not plaintext");

    kr.clear("udio", "sessionToken");
    assert.equal(existsSync(file), false);
    assert.equal(kr.get("udio", "sessionToken"), undefined);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("Windows DPAPI set() throws loudly when PowerShell/DPAPI is unavailable", () => {
  const failing: KeyringRunner = () => ({ status: 1, stdout: "" });
  const kr = keyringForPlatform("win32", failing, join(tmpdir(), "vt-keyring-unused"));
  assert.throws(() => kr.set("suno", "sessionCookie", "x"), /DPAPI store failed/);
});
