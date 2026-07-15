import { test } from "node:test";
import assert from "node:assert/strict";
import { CONNECTORS, connectorForUrl, cookieMatchesSpec, connectorHosts } from "../connectors.mjs";
import { readConnectorCookies, connectActiveSite } from "../background.js";

test("connectorForUrl matches supported sites (root, www, app subdomains) and rejects others", () => {
  assert.equal(connectorForUrl("https://suno.com/create")?.id, "suno");
  assert.equal(connectorForUrl("https://www.suno.com/library")?.id, "suno");
  assert.equal(connectorForUrl("https://app.pixverse.ai/")?.id, "pixverse");
  assert.equal(connectorForUrl("https://vidu.studio/create")?.id, "vidu");
  assert.equal(connectorForUrl("https://chatgpt.com/"), null);
  assert.equal(connectorForUrl("not a url"), null);
});

test("cookie spec matching handles exact and prefix+suffix (Udio's sb-<ref>-auth-token)", () => {
  const suno = CONNECTORS.find((c) => c.id === "suno")!.cookies[0];
  assert.equal(cookieMatchesSpec("__session", suno), true);
  assert.equal(cookieMatchesSpec("__other", suno), false);
  const udio = CONNECTORS.find((c) => c.id === "udio")!.cookies[0];
  assert.equal(cookieMatchesSpec("sb-abcd1234-auth-token", udio), true);
  assert.equal(cookieMatchesSpec("sb-abcd1234-refresh-token", udio), false); // wrong suffix
  assert.equal(cookieMatchesSpec("session", udio), false);
});

test("every connector host is declared for the manifest allowlist", () => {
  const hosts = connectorHosts();
  assert.ok(hosts.includes("suno.com"));
  assert.ok(hosts.includes("udio.com"));
  assert.equal(new Set(hosts).size, hosts.length, "no duplicate hosts");
});

// A fake chrome.cookies that serves a Suno session cookie for suno.com only.
function fakeCookieApi(store: Record<string, Record<string, string>>) {
  return {
    async get({ url, name }: { url: string; name: string }) {
      const host = new URL(url).hostname;
      const value = store[host]?.[name];
      return value ? { name, value } : null;
    },
    async getAll({ domain }: { domain: string }) {
      return Object.entries(store[domain] ?? {}).map(([name, value]) => ({ name, value }));
    },
  };
}

test("readConnectorCookies extracts the declared cookie without exposing it elsewhere", async () => {
  const suno = CONNECTORS.find((c) => c.id === "suno")!;
  const api = fakeCookieApi({ "suno.com": { __session: "SECRET_TOKEN_VALUE" } });
  const { fields, missing } = await readConnectorCookies(suno, api);
  assert.equal(fields.sessionCookie, "SECRET_TOKEN_VALUE");
  assert.equal(missing.length, 0);
});

test("readConnectorCookies reports missing when not logged in", async () => {
  const suno = CONNECTORS.find((c) => c.id === "suno")!;
  const { fields, missing } = await readConnectorCookies(suno, fakeCookieApi({}));
  assert.equal(Object.keys(fields).length, 0);
  assert.deepEqual(missing, ["sessionCookie"]);
});

test("connectActiveSite POSTs the credential to the local endpoint and returns only field NAMES", async () => {
  const suno = CONNECTORS.find((c) => c.id === "suno")!;
  const api = fakeCookieApi({ "suno.com": { __session: "SECRET_TOKEN_VALUE" } });
  const posted: Array<{ url: string; body: unknown }> = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    posted.push({ url: String(url), body: JSON.parse(init.body) });
    return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, provider: "suno", stored: ["sessionCookie"] }) };
  }) as unknown as typeof fetch;
  try {
    const result = await connectActiveSite({ url: "https://suno.com/create" }, api);
    assert.equal(result.ok, true);
    assert.equal(result.provider, "suno");
    assert.deepEqual(result.captured, ["sessionCookie"]); // NAMES, not values
    assert.equal(JSON.stringify(result).includes("SECRET_TOKEN_VALUE"), false, "value never leaks into the response");
    assert.equal(posted[0].url, "http://127.0.0.1:8765/connect");
    assert.deepEqual((posted[0].body as { fields: unknown }).fields, { sessionCookie: "SECRET_TOKEN_VALUE" });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("connectActiveSite refuses a non-connectable tab", async () => {
  const result = await connectActiveSite({ url: "https://chatgpt.com/" }, fakeCookieApi({}));
  assert.equal(result.ok, false);
  assert.match(result.error, /not a connectable/i);
});
