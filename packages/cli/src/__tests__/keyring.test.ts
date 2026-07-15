import { test } from "node:test";
import assert from "node:assert/strict";
import { memoryKeyring, __setKeyringBackend } from "../keyring.ts";
import { resolveCreds, storeProviderCreds, clearProviderCreds, storeToken, clearToken, type VtConfig } from "../config.ts";

test("memoryKeyring round-trips get/set/clear", () => {
  const kr = memoryKeyring();
  assert.equal(kr.get("openai", "adminKey"), undefined);
  kr.set("openai", "adminKey", "sk-x");
  assert.equal(kr.get("openai", "adminKey"), "sk-x");
  kr.clear("openai", "adminKey");
  assert.equal(kr.get("openai", "adminKey"), undefined);
});

test("resolveCreds precedence: keyring wins over the legacy config file", () => {
  const kr = memoryKeyring();
  __setKeyringBackend(kr);
  try {
    kr.set("openai", "adminKey", "sk-from-keyring");
    const cfg: VtConfig = { enabled: ["openai"], creds: { openai: { adminKey: "sk-legacy-file" } } };
    assert.equal(resolveCreds("openai", cfg).adminKey, "sk-from-keyring");
  } finally {
    __setKeyringBackend(null);
  }
});

test("resolveCreds falls back to the legacy file only when the keyring lacks the field", () => {
  __setKeyringBackend(memoryKeyring());
  try {
    const cfg: VtConfig = { enabled: ["openai"], creds: { openai: { adminKey: "sk-legacy-file" } } };
    assert.equal(resolveCreds("openai", cfg).adminKey, "sk-legacy-file");
  } finally {
    __setKeyringBackend(null);
  }
});

test("storeProviderCreds persists to the keyring; clearProviderCreds removes it", () => {
  const kr = memoryKeyring();
  __setKeyringBackend(kr);
  try {
    const cfg: VtConfig = { enabled: [] };
    const inKeyring = storeProviderCreds(cfg, "falai", { key: "12345678-1234-1234-1234-123456789abc:0123456789abcdef0123456789abcdef" });
    assert.equal(inKeyring, true, "reports keyring storage");
    assert.ok(kr.get("falai", "key"), "the key lives in the keyring");
    assert.ok(cfg.creds?.falai?.key, "kept in-memory for immediate use this run");
    clearProviderCreds(cfg, "falai");
    assert.equal(kr.get("falai", "key"), undefined);
    assert.equal(cfg.creds?.falai, undefined);
  } finally {
    __setKeyringBackend(null);
  }
});

test("Cynaps3 OAuth rotation state round-trips through the keyring and clears together", () => {
  const kr = memoryKeyring();
  __setKeyringBackend(kr);
  try {
    const cfg: VtConfig = { enabled: ["cynaps3"] };
    storeProviderCreds(cfg, "cynaps3", {
      token: "access-token",
      refreshToken: "refresh-token",
      expiresAt: "2026-07-15T13:00:00.000Z",
    });
    const resolved = resolveCreds("cynaps3", cfg) as Record<string, string>;
    assert.equal(resolved.token, "access-token");
    assert.equal(resolved.refreshToken, "refresh-token");
    assert.equal(resolved.expiresAt, "2026-07-15T13:00:00.000Z");
    clearProviderCreds(cfg, "cynaps3");
    assert.equal(kr.get("cynaps3", "token"), undefined);
    assert.equal(kr.get("cynaps3", "refreshToken"), undefined);
    assert.equal(kr.get("cynaps3", "expiresAt"), undefined);
  } finally {
    __setKeyringBackend(null);
  }
});

test("storeToken/clearToken use the keyring account slot", () => {
  const kr = memoryKeyring();
  __setKeyringBackend(kr);
  try {
    const cfg: VtConfig = { enabled: [] };
    storeToken(cfg, "sbp_" + "A".repeat(35));
    assert.equal(cfg.token, "sbp_" + "A".repeat(35));
    assert.ok(kr.get("_account", "token"));
    clearToken(cfg);
    assert.equal(cfg.token, undefined);
    assert.equal(kr.get("_account", "token"), undefined);
  } finally {
    __setKeyringBackend(null);
  }
});
