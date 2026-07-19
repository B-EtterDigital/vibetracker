import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONNECTORS, connectorForUrl, cookieMatchesSpec, connectorHosts } from "../connectors.mjs";
import { readConnectorCookies, connectActiveSite, scanAllTabs, autoOpenSources, openAllSources, openAndPullAll, buildSourceBoard, resetBridgePort } from "../background.js";

// The bridge auto-discovers its port by probing /health across candidates; the first is 8799.
// A fetch mock must answer the GET /health probe (ok) before the POST it actually asserts on.
const HEALTH = "http://127.0.0.1:8799/health";
function isHealth(url: string): boolean { return String(url).endsWith("/health"); }

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
  resetBridgePort();
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    if (isHealth(url)) return { ok: true, status: 200, text: async () => "{}" };
    posted.push({ url: String(url), body: JSON.parse(init.body) });
    return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, provider: "suno", stored: ["sessionCookie"] }) };
  }) as unknown as typeof fetch;
  try {
    const result = await connectActiveSite({ url: "https://suno.com/create" }, api);
    assert.equal(result.ok, true);
    assert.equal(result.provider, "suno");
    assert.deepEqual(result.captured, ["sessionCookie"]); // NAMES, not values
    assert.equal(JSON.stringify(result).includes("SECRET_TOKEN_VALUE"), false, "value never leaks into the response");
    assert.equal(posted[0].url, "http://127.0.0.1:8799/connect");
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

// A fake chrome.tabs backed by a mutable tab list — create() adds a loaded tab, get() looks up.
function fakeTabsApi(initialTabs: Array<{ id: number; url: string; status?: string }>) {
  const tabs = [...initialTabs];
  let nextId = 1000;
  const created: string[] = [];
  return {
    tabs,
    created,
    async query() { return tabs; },
    async create({ url }: { url: string }) {
      const tab = { id: nextId++, url, status: "complete" };
      tabs.push(tab);
      created.push(url);
      return tab;
    },
    async get(id: number) { return tabs.find((t) => t.id === id) ?? Promise.reject(new Error("no tab")); },
  };
}

test("autoOpenSources lists every connector + web-readable reader, and skips off-web numbers", () => {
  const sources = autoOpenSources();
  const ids = sources.map((s: { id: string }) => s.id);
  for (const c of CONNECTORS) assert.ok(ids.includes(c.id), `connector ${c.id} must auto-open`);
  assert.ok(ids.includes("higgsfield") && ids.includes("elevenlabs") && ids.includes("leonardo"));
  // Midjourney/ChatGPT keep their numbers off the web — auto-opening them would only report misses
  assert.equal(ids.includes("midjourney"), false);
  assert.equal(ids.includes("openai-web"), false);
  for (const s of sources) assert.match(s.url, /^https:\/\//, `${s.id} needs an https url`);
});

test("every auto-open URL's host is granted in the manifest (so its tab is connect/read-able)", () => {
  const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
  const granted = (manifest.host_permissions as string[]).map((h) => h.replace(/^https:\/\//, "").replace(/\/\*$/, ""));
  for (const s of autoOpenSources()) {
    const host = new URL(s.url).hostname;
    assert.ok(granted.includes(host), `manifest missing host_permission for ${s.id}'s ${host}`);
  }
});

test("buildSourceBoard covers every source with the right state precedence and real logos", () => {
  const tiles = buildSourceBoard(
    { suno: { hasData: true, connected: true }, udio: { hasData: false, connected: true } },
    new Set(["udio", "midjourney"]),
  );
  const byId = Object.fromEntries(tiles.map((t: { id: string }) => [t.id, t]));
  assert.equal(byId.suno.state, "synced", "data in ledger beats everything → green tick");
  assert.equal(byId.udio.state, "connected", "creds stored beats open-tab");
  assert.equal(byId.midjourney.state, "open", "open tab beats idle");
  assert.equal(byId.higgsfield.state, "idle");
  // every tile carries a URL (click-to-open) and the ones with shipped assets carry real logos
  for (const t of tiles) assert.match(t.url, /^https:\/\//, `${t.id} tile needs a URL`);
  assert.match(byId.suno.logo, /suno\.svg$/);
  assert.match(byId.midjourney.logo, /midjourney\.png$/);
  assert.equal(byId.haiper.logo, null, "no asset → monogram tile");
  // ALL connectors + ALL readers appear — the board is the complete source map
  assert.equal(tiles.length, CONNECTORS.length + 7, "7 readers + all connectors");
});

test("openAllSources opens one background tab per missing source and skips already-open ones", async () => {
  const tabsApi = fakeTabsApi([{ id: 1, url: "https://suno.com/create", status: "complete" }]);
  const res = await openAllSources({ tabsApi });
  assert.equal(res.ok, true);
  assert.ok(res.already.includes("Suno"), "existing Suno tab is not re-opened");
  assert.ok(res.opened.includes("Udio") && res.opened.includes("Higgsfield"));
  assert.equal(tabsApi.created.some((u: string) => u.includes("suno.com")), false);
  assert.equal(res.createdTabIds.length, res.opened.length, "one created tab per opened source");
});

test("openAndPullAll opens missing sources, waits, then sweeps them in one automatic action", async () => {
  const tabsApi = fakeTabsApi([]);
  // logged in on Suno only — its exact-match `__session` cookie resolves; every other site is empty
  const cookieApi = fakeCookieApi({ "suno.com": { __session: "S" } });
  const scriptingApi = { async executeScript() { return [{ result: null }]; } }; // pages show no number
  const realFetch = globalThis.fetch;
  resetBridgePort();
  globalThis.fetch = (async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) })) as unknown as typeof fetch;
  try {
    const res = await openAndPullAll({ tabsApi, cookieApi, scriptingApi, waitOpts: { timeoutMs: 200, pollMs: 10 } });
    assert.equal(res.ok, true);
    assert.ok(res.opened.length >= 8, "every supported source tab was opened");
    const suno = res.results.find((r: { provider: string }) => r.provider === "suno");
    assert.equal(suno?.ok, true, "logged-in Suno connects during the same click");
    const udio = res.results.find((r: { provider: string }) => r.provider === "udio");
    assert.equal(udio?.ok, false, "not-logged-in source reports an honest miss");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("scanAllTabs connects every open cookie source once and reads usage pages, deduped", async () => {
  const cookieApi = fakeCookieApi({ "suno.com": { __session: "S" }, "udio.com": { "sb-x-auth-token": "U" } });
  const scriptingApi = { async executeScript() { return [{ result: { operation: "lifetime_images", unit: "image", value: 3982 } }]; } };
  const tabsApi = {
    async query() {
      return [
        { id: 1, url: "https://suno.com/create" },
        { id: 2, url: "https://suno.com/library" }, // second Suno tab — must NOT double-connect
        { id: 3, url: "https://udio.com/" },
        { id: 4, url: "https://midjourney.com/account", title: "MJ" },
        { id: 5, url: "https://example.com/" }, // unsupported — skipped
      ];
    },
  };
  const realFetch = globalThis.fetch;
  const posted: string[] = [];
  resetBridgePort();
  globalThis.fetch = (async (url: string) => {
    posted.push(String(url));
    return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, accepted: 1, rejected: [] }) };
  }) as unknown as typeof fetch;
  try {
    const res = await scanAllTabs({ tabsApi, cookieApi, scriptingApi });
    assert.equal(res.ok, true);
    const providers = res.results.map((r: { provider: string }) => r.provider).sort();
    assert.deepEqual(providers, ["midjourney", "suno", "udio"]); // suno once, example skipped
    assert.equal(res.results.every((r: { ok: boolean }) => r.ok), true);
    assert.equal(res.connected, 3);
  } finally {
    globalThis.fetch = realFetch;
  }
});
