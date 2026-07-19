// OS-keyring-backed credential storage (libsecret via `secret-tool`).
//
// WHY: credentials must never sit in plaintext on disk (config.json). This keeps them in the OS
// keyring instead. Values are passed to `secret-tool` over stdin — never argv — so they never
// appear in the process list. Redaction/scanning of arbitrary output lives in
// core/src/security/secrets.ts (scanSecrets / redactSecrets); this module is storage only.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SERVICE = "vibetracker";

// A minimal, injectable command runner so the macOS/Windows backends are unit-testable off their
// native OS: returns exit status + stdout, and passes any secret ONLY via `input` (stdin) where the
// underlying tool supports it. Never throws — status carries failure.
export type KeyringRunner = (bin: string, args: string[], input?: string) => { status: number; stdout: string };

function defaultRunner(): KeyringRunner {
  return (bin, args, input) => {
    try {
      const stdout = execFileSync(bin, args, {
        input,
        stdio: [input !== undefined ? "pipe" : "ignore", "pipe", "ignore"],
        encoding: "utf8",
      });
      return { status: 0, stdout: stdout ?? "" };
    } catch (err) {
      const e = err as { status?: number; stdout?: string };
      return { status: typeof e.status === "number" ? e.status : 1, stdout: typeof e.stdout === "string" ? e.stdout : "" };
    }
  };
}

export interface KeyringBackend {
  available(): boolean;
  get(account: string, field: string): string | undefined;
  set(account: string, field: string, value: string): void;
  clear(account: string, field: string): void;
}

// libsecret backend. Get/clear fail soft (a locked/absent keyring falls back to env vars), but
// available() reports the truth so migration never silently drops a secret, and set() throws loudly
// so a failed store is never mistaken for success.
function secretToolBackend(): KeyringBackend {
  let availableCache: boolean | null = null;
  return {
    // secret-tool has no --version/--help exit-0 probe, so verify the keyring is actually usable
    // with a real store→lookup→clear round-trip on a sentinel, cached for the rest of the process.
    available() {
      if (availableCache !== null) return availableCache;
      const probe = ["service", SERVICE, "account", "_probe", "field", "_probe"];
      try {
        execFileSync("secret-tool", ["store", "--label", `${SERVICE} probe`, ...probe], { input: "1", stdio: ["pipe", "ignore", "ignore"] });
        const v = execFileSync("secret-tool", ["lookup", ...probe], { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" });
        execFileSync("secret-tool", ["clear", ...probe], { stdio: "ignore" });
        availableCache = v === "1";
      } catch {
        availableCache = false;
      }
      return availableCache;
    },
    get(account, field) {
      try {
        const out = execFileSync("secret-tool", ["lookup", "service", SERVICE, "account", account, "field", field], {
          stdio: ["ignore", "pipe", "ignore"], encoding: "utf8",
        });
        return out && out.length > 0 ? out : undefined; // lookup prints the value with no trailing newline
      } catch {
        return undefined; // non-zero exit = not found
      }
    },
    set(account, field, value) {
      const label = `${SERVICE}/${account}/${field}`;
      execFileSync("secret-tool", ["store", "--label", label, "service", SERVICE, "account", account, "field", field], {
        input: value, stdio: ["pipe", "ignore", "ignore"],
      });
    },
    clear(account, field) {
      try { execFileSync("secret-tool", ["clear", "service", SERVICE, "account", account, "field", field], { stdio: "ignore" }); } catch { /* absent = already clear */ }
    },
  };
}

// macOS backend — the built-in `security` CLI (login Keychain, encrypted + ACL'd at rest).
// get/clear are argv-safe (the value is read from the store, never passed in). set() must pass the
// value via `-w <value>` because `security` has no stdin input for the password — a sub-second argv
// window, still a large improvement over a plaintext config file; env-var overrides avoid it.
function macKeychainBackend(run: KeyringRunner): KeyringBackend {
  let availableCache: boolean | null = null;
  const acct = (account: string, field: string) => `${account}:${field}`;
  return {
    available() {
      if (availableCache !== null) return availableCache;
      const a = acct("_probe", "_probe");
      const set = run("security", ["add-generic-password", "-U", "-a", a, "-s", SERVICE, "-w", "1"]);
      const got = run("security", ["find-generic-password", "-a", a, "-s", SERVICE, "-w"]);
      run("security", ["delete-generic-password", "-a", a, "-s", SERVICE]);
      availableCache = set.status === 0 && got.status === 0 && got.stdout.replace(/\n$/, "") === "1";
      return availableCache;
    },
    get(account, field) {
      const r = run("security", ["find-generic-password", "-a", acct(account, field), "-s", SERVICE, "-w"]);
      if (r.status !== 0) return undefined;
      const value = r.stdout.replace(/\n$/, ""); // `security -w` prints the password + one newline
      return value.length > 0 ? value : undefined;
    },
    set(account, field, value) {
      const r = run("security", ["add-generic-password", "-U", "-a", acct(account, field), "-s", SERVICE, "-w", value]);
      if (r.status !== 0) throw new Error(`macOS Keychain store failed for ${account}/${field}`);
    },
    clear(account, field) {
      run("security", ["delete-generic-password", "-a", acct(account, field), "-s", SERVICE]);
    },
  };
}

// Windows backend — DPAPI (CurrentUser scope) via built-in PowerShell. The secret is piped over
// stdin to the PowerShell script both ways, so it NEVER appears in argv. Encrypted blobs live one
// file per field under ~/.vibetracker/vault; DPAPI ties decryption to the logged-in Windows user.
const PS_ENCRYPT =
  "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;" +
  "$p=[Console]::In.ReadToEnd();$b=[Text.Encoding]::UTF8.GetBytes($p);" +
  "$e=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);" +
  "[Console]::Out.Write([Convert]::ToBase64String($e))";
const PS_DECRYPT =
  "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;" +
  "$s=[Console]::In.ReadToEnd();$e=[Convert]::FromBase64String($s);" +
  "$b=[Security.Cryptography.ProtectedData]::Unprotect($e,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);" +
  "[Console]::Out.Write([Text.Encoding]::UTF8.GetString($b))";

function winDpapiBackend(run: KeyringRunner, vaultDir: string): KeyringBackend {
  let availableCache: boolean | null = null;
  const ps = (script: string, input: string) =>
    run("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], input);
  const fileFor = (account: string, field: string) =>
    join(vaultDir, `${account}__${field}`.replace(/[^a-zA-Z0-9_.-]/g, "_") + ".dpapi");
  return {
    available() {
      if (availableCache !== null) return availableCache;
      const enc = ps(PS_ENCRYPT, "1");
      if (enc.status !== 0 || !enc.stdout) { availableCache = false; return availableCache; }
      const dec = ps(PS_DECRYPT, enc.stdout);
      availableCache = dec.status === 0 && dec.stdout === "1";
      return availableCache;
    },
    get(account, field) {
      const file = fileFor(account, field);
      if (!existsSync(file)) return undefined;
      const blob = readFileSync(file, "utf8");
      const dec = ps(PS_DECRYPT, blob);
      return dec.status === 0 && dec.stdout.length > 0 ? dec.stdout : undefined;
    },
    set(account, field, value) {
      const enc = ps(PS_ENCRYPT, value);
      if (enc.status !== 0 || !enc.stdout) throw new Error(`Windows DPAPI store failed for ${account}/${field}`);
      mkdirSync(vaultDir, { recursive: true });
      writeFileSync(fileFor(account, field), enc.stdout, { mode: 0o600 });
    },
    clear(account, field) {
      rmSync(fileFor(account, field), { force: true });
    },
  };
}

// Pick the credential backend for a platform. macOS → Keychain, Windows → DPAPI, everything else →
// libsecret. Exported (with injectable deps) so the non-Linux backends are testable off their OS.
export function keyringForPlatform(
  platform: string,
  run: KeyringRunner = defaultRunner(),
  vaultDir: string = join(homedir(), ".vibetracker", "vault"),
): KeyringBackend {
  if (platform === "darwin") return macKeychainBackend(run);
  if (platform === "win32") return winDpapiBackend(run, vaultDir);
  return secretToolBackend();
}

let active: KeyringBackend | null = null;
export function keyring(): KeyringBackend {
  return (active ??= keyringForPlatform(process.platform));
}
/** Test seam: swap in an in-memory backend (pass null to restore the real one). */
export function __setKeyringBackend(backend: KeyringBackend | null): void {
  active = backend;
}

/** In-memory keyring for tests (no OS dependency). */
export function memoryKeyring(seed: Record<string, string> = {}): KeyringBackend {
  const store = new Map<string, string>(Object.entries(seed));
  const k = (a: string, f: string) => `${a} ${f}`;
  return {
    available: () => true,
    get: (a, f) => store.get(k(a, f)),
    set: (a, f, v) => { store.set(k(a, f), v); },
    clear: (a, f) => { store.delete(k(a, f)); },
  };
}
