// OS-keyring-backed credential storage (libsecret via `secret-tool`).
//
// WHY: credentials must never sit in plaintext on disk (config.json). This keeps them in the OS
// keyring instead. Values are passed to `secret-tool` over stdin — never argv — so they never
// appear in the process list. Redaction/scanning of arbitrary output lives in
// core/src/security/secrets.ts (scanSecrets / redactSecrets); this module is storage only.

import { execFileSync } from "node:child_process";

const SERVICE = "vibetracker";

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

let active: KeyringBackend | null = null;
export function keyring(): KeyringBackend {
  return (active ??= secretToolBackend());
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
