import { CANDIDATE_PORTS, pathUrl, buildCapturePayload, previewForTab } from "./popup-model.mjs";
import { CONNECTORS, connectorForUrl, cookieMatchesSpec } from "./connectors.mjs";
import { READERS, readerForUrl } from "./readers.mjs";

function activeTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
}

// Discover which candidate port the local bridge is actually on by probing /health. Cached once
// found; re-probed if a later call fails. Returns null when no candidate answers (API is down).
let resolvedPort = null;
async function resolveApiPort() {
  if (resolvedPort) return resolvedPort;
  for (const port of CANDIDATE_PORTS) {
    try {
      const res = await fetch(pathUrl(port, "/health"), { method: "GET" });
      if (res.ok) { resolvedPort = port; return port; }
    } catch { /* this candidate isn't listening — try the next */ }
  }
  return null;
}

// Test hook only — clears the cached port so each fetch-mocking test starts from a fresh probe.
export function resetBridgePort() { resolvedPort = null; }

// A tab is "pullable" if it's a cookie connector OR a usage-page reader — the two ways the Bridge
// gets data. Pure + testable so the badge count is exercised without a browser.
export function isPullableUrl(url) {
  return Boolean(connectorForUrl(url) || readerForUrl(url));
}

// Count the DISTINCT pullable sources across a set of tabs — ten Suno tabs count once.
export function countPullableSources(tabs) {
  const seen = new Set();
  for (const tab of tabs || []) {
    const connector = connectorForUrl(tab?.url);
    if (connector) { seen.add(`c:${connector.id}`); continue; }
    const reader = readerForUrl(tab?.url);
    if (reader) seen.add(`r:${reader.id}`);
  }
  return seen.size;
}

// Is the local CLI API up (on any candidate port)? Powers the popup's setup guidance.
async function localApiHealth() {
  const port = await resolveApiPort();
  return { up: port !== null, port };
}

async function postJson(path, payload) {
  const port = await resolveApiPort();
  if (port === null) {
    return { ok: false, status: 0, body: { error: "The local app is not running. Run `vibetracker start` in your terminal, then try again." }, error: "The local app is not running. Run `vibetracker start`, then try again." };
  }
  let res;
  try {
    res = await fetch(pathUrl(port, path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    resolvedPort = null; // the cached port died — force a re-probe next time
    return { ok: false, status: 0, error: `Couldn't reach the local app — ${String(error?.message || error).slice(0, 120)}` };
  }
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: res.ok, status: res.status, body, error: res.ok ? undefined : body?.error };
}

async function postCapture(payload) {
  const result = await postJson("/capture", payload);
  return { ...result, payload };
}

function reportCookieLookupFailure(error, connector, host, mode) {
  console.warn("[vibetracker] connector cookie lookup failed", {
    area: "browser-extension.connector-cookie",
    provider: connector.id,
    host,
    mode,
    message: String(error?.message || error).slice(0, 160),
  });
}

// Read the cookie(s) a connector declares, trying each host it lists (root / www / app subdomains)
// so app.pixverse.ai and www.suno.com both resolve. Returns { field: value } — a value is never
// logged, never shown, and never kept beyond the connect POST below.
async function readConnectorCookies(connector, cookieApi = chrome.cookies) {
  const fields = {};
  const missing = [];
  for (const spec of connector.cookies) {
    let found = null;
    for (const host of connector.hosts) {
      if (spec.match === "exact") {
        const cookie = await cookieApi.get({ url: `https://${host}/`, name: spec.name }).catch((error) => {
          reportCookieLookupFailure(error, connector, host, "exact");
          return null;
        });
        if (cookie?.value) { found = cookie.value; break; }
      } else {
        const all = await cookieApi.getAll({ domain: host }).catch((error) => {
          reportCookieLookupFailure(error, connector, host, "pattern");
          return [];
        });
        const hit = (all || []).find((c) => cookieMatchesSpec(c.name, spec) && c.value);
        if (hit) { found = hit.value; break; }
      }
    }
    if (found) fields[spec.field] = found;
    else missing.push(spec.field);
  }
  return { fields, missing };
}

async function connectActiveSite(tab, cookieApi = chrome.cookies) {
  const connector = connectorForUrl(tab?.url);
  if (!connector) {
    return { ok: false, error: "This tab is not a connectable AI source. Open Suno, Udio, or another supported site and log in, then click Connect." };
  }
  const { fields, missing } = await readConnectorCookies(connector, cookieApi);
  if (!Object.keys(fields).length) {
    return { ok: false, provider: connector.id, label: connector.label, error: `No ${connector.label} session cookie found — log in at ${connector.hosts[0]} first, then click Connect.` };
  }
  const result = await postJson("/connect", { provider: connector.id, fields });
  return {
    ...result,
    provider: connector.id,
    label: connector.label,
    captured: Object.keys(fields), // NAMES only — never the values
    missing,
    pending: Boolean(connector.pending),
  };
}

// Value-free connector summary the popup renders as the Connect card.
function connectorSummary(connector) {
  if (!connector) return null;
  return {
    id: connector.id, label: connector.label, category: connector.category,
    brand: connector.brand, hosts: connector.hosts, pending: Boolean(connector.pending),
  };
}
function readerSummary(reader) {
  if (!reader) return null;
  return { id: reader.id, label: reader.label, category: reader.category, hint: reader.hint };
}

// The function INJECTED into the page. It must be self-contained (no imports) — it receives the
// reader's stat specs as plain data and pulls the first matching NUMBER from the page's visible
// text. It reads document.body.innerText only, matches declared patterns, and returns one number.
// It never touches inputs, prompts, conversation nodes, or anything beyond the declared stat.
function pageStatExtractor(stats) {
  const text = (document.body && document.body.innerText) || "";
  for (const stat of stats) {
    for (const source of stat.patterns) {
      const match = new RegExp(source, "i").exec(text);
      if (match && match[1]) {
        const value = Number(match[1].replace(/,/g, ""));
        if (Number.isFinite(value) && value >= 0) {
          return { operation: stat.operation, unit: stat.unit, value };
        }
      }
    }
  }
  return null;
}

// Read a declared usage number off the logged-in page and record it as a usage snapshot. Reaches
// sources with no API and no adapter cookie (Midjourney lifetime images, Higgsfield credits, …).
async function readActivePage(tab, scriptingApi) {
  const reader = readerForUrl(tab?.url);
  if (!reader) {
    return { ok: false, error: "This page has no known usage number to read. Open Midjourney's /info, Higgsfield credits, or ChatGPT usage, then click Read." };
  }
  if (!tab?.id) return { ok: false, error: "No active tab to read." };
  scriptingApi = scriptingApi ?? (typeof chrome !== "undefined" ? chrome.scripting : undefined);
  let result = null;
  try {
    const injection = await scriptingApi.executeScript({
      target: { tabId: tab.id },
      func: pageStatExtractor,
      args: [reader.stats],
    });
    result = injection?.[0]?.result ?? null;
  } catch (error) {
    return { ok: false, provider: reader.id, label: reader.label, error: `Couldn't read the ${reader.label} page — ${String(error?.message || error).slice(0, 120)}` };
  }
  if (!result) {
    return { ok: false, provider: reader.id, label: reader.label, error: `No ${reader.label} usage number visible on this page. ${reader.hint}` };
  }
  const captured = await postCapture({
    provider: reader.id,
    category: reader.category,
    operation: result.operation,
    quantity: result.value,
    unit: result.unit,
    rawAmount: result.value,
    rawUnit: result.unit,
    url: tab.url,
    title: tab.title,
    // a lifetime/balance figure is a SNAPSHOT — reading it again must REPLACE the prior value,
    // never add a second record (which would inflate the total). The local API dedupes on this.
    snapshot: true,
  });
  return {
    ...captured,
    provider: reader.id,
    label: reader.label,
    value: result.value,
    unit: result.unit,
    operation: result.operation,
  };
}

// One sweep across every open tab: connect each cookie source, read each usage-page source, in
// one click. This is "retrieve all data from all sources very easily" made literal. De-duplicates
// by source so ten Suno tabs connect once. Returns a per-source result list — value-free.
async function scanAllTabs({ tabsApi, cookieApi, scriptingApi } = {}) {
  tabsApi = tabsApi ?? (typeof chrome !== "undefined" ? chrome.tabs : undefined);
  if (!tabsApi) return { ok: false, error: "tabs unavailable" };
  const tabs = await tabsApi.query({}).catch(() => []);
  const seenConnect = new Set();
  const seenRead = new Set();
  const results = [];

  for (const tab of tabs || []) {
    const connector = connectorForUrl(tab?.url);
    if (connector && !seenConnect.has(connector.id)) {
      seenConnect.add(connector.id);
      const r = await connectActiveSite(tab, cookieApi ?? chrome.cookies);
      results.push({ kind: "connect", provider: connector.id, label: connector.label, ok: Boolean(r.ok), detail: r.ok ? "session saved" : r.error });
      continue;
    }
    const reader = readerForUrl(tab?.url);
    if (reader && !seenRead.has(reader.id)) {
      seenRead.add(reader.id);
      const r = await readActivePage(tab, scriptingApi);
      results.push({ kind: "read", provider: reader.id, label: reader.label, ok: Boolean(r.ok), detail: r.ok ? `${Number(r.value).toLocaleString("en-US")} ${r.unit}` : r.error });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return { ok: true, results, connected: okCount, total: results.length };
}

// Every source worth auto-opening: all cookie connectors (a login cookie works from any page of the
// site) plus the readers whose usage number actually appears on the web (autoOpen !== false —
// Midjourney/ChatGPT keep their numbers off the web, so opening them would only report misses).
export function autoOpenSources() {
  return [
    ...CONNECTORS.map((c) => ({ kind: "connect", id: c.id, label: c.label, url: c.url })),
    ...READERS.filter((r) => r.autoOpen !== false).map((r) => ({ kind: "read", id: r.id, label: r.label, url: r.url })),
  ].filter((s) => Boolean(s.url));
}

// Open a background tab for every supported source that is NOT already open somewhere. The user's
// current tab keeps focus; ten Suno tabs still mean zero new Suno tabs. Returns what was opened.
async function openAllSources({ tabsApi } = {}) {
  tabsApi = tabsApi ?? (typeof chrome !== "undefined" ? chrome.tabs : undefined);
  if (!tabsApi) return { ok: false, error: "tabs unavailable" };
  const tabs = await tabsApi.query({}).catch(() => []);
  const openIds = new Set();
  for (const tab of tabs || []) {
    const c = connectorForUrl(tab?.url);
    if (c) openIds.add(c.id);
    const r = readerForUrl(tab?.url);
    if (r) openIds.add(r.id);
  }
  const opened = [];
  const already = [];
  const createdTabIds = [];
  for (const source of autoOpenSources()) {
    if (openIds.has(source.id)) { already.push(source.label); continue; }
    try {
      const tab = await tabsApi.create({ url: source.url, active: false });
      if (tab?.id != null) createdTabIds.push(tab.id);
      opened.push(source.label);
    } catch (error) {
      // tab create refused (rare: incognito-only window, policy) — the sweep just skips this source
      console.warn("[vibetracker] could not open source tab", {
        area: "browser-extension.open-all", provider: source.id, message: String(error?.message || error).slice(0, 120),
      });
    }
  }
  return { ok: true, opened, already, createdTabIds };
}

// Wait (bounded) for freshly created tabs to finish loading so page-reads see real content.
// Cookie connects don't need a loaded page, so a slow site can't stall those.
async function waitForTabs(tabIds, { tabsApi, timeoutMs = 12000, pollMs = 400, sleep } = {}) {
  tabsApi = tabsApi ?? (typeof chrome !== "undefined" ? chrome.tabs : undefined);
  sleep = sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const deadline = Date.now() + timeoutMs;
  let pending = [...(tabIds || [])];
  while (pending.length && Date.now() < deadline) {
    const still = [];
    for (const id of pending) {
      const tab = await tabsApi.get(id).catch((error) => {
        // a user-closed tab is expected mid-wait — breadcrumb it and stop waiting on that tab
        console.debug("[vibetracker] tab gone while waiting for load", {
          area: "browser-extension.open-all", tabId: id, message: String(error?.message || error).slice(0, 120),
        });
        return null;
      });
      if (tab && tab.status !== "complete") still.push(id);
    }
    pending = still;
    if (pending.length) await sleep(pollMs);
  }
  return { loaded: (tabIds || []).length - pending.length, stillLoading: pending.length };
}

// The fully automatic flow behind one click: open every missing supported source, wait for the
// pages to load, then run the sweep — connect + read everything reachable in a single action.
// Sources that need a login report an honest miss; log in there and pull again.
async function openAndPullAll({ tabsApi, cookieApi, scriptingApi, waitOpts } = {}) {
  const openedRes = await openAllSources({ tabsApi });
  if (!openedRes.ok) return openedRes;
  if (openedRes.createdTabIds.length) await waitForTabs(openedRes.createdTabIds, { tabsApi, ...(waitOpts || {}) });
  const sweep = await scanAllTabs({ tabsApi, cookieApi, scriptingApi });
  return { ...sweep, opened: openedRes.opened, already: openedRes.already };
}

// Register the message router only in the extension runtime — guarded so the module stays
// importable under Node for tests (where `chrome` does not exist).
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  // Ambient badge — the toolbar icon shows how many distinct pullable sources are open, so the
  // user knows to act without opening the popup. Recomputed on any tab change.
  async function refreshBadge() {
    if (!chrome.action?.setBadgeText) return;
    const tabs = await chrome.tabs.query({}).catch(() => []);
    const count = countPullableSources(tabs);
    chrome.action.setBadgeText({ text: count ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor?.({ color: "#2ee8d6" });
    chrome.action.setTitle?.({ title: count ? `${count} AI source${count === 1 ? "" : "s"} ready to pull` : "VibeTRACKER Bridge" });
  }
  chrome.tabs?.onUpdated?.addListener((_id, info) => { if (info.status === "complete" || info.url) refreshBadge(); });
  chrome.tabs?.onRemoved?.addListener(() => refreshBadge());
  chrome.tabs?.onActivated?.addListener(() => refreshBadge());
  chrome.runtime?.onInstalled?.addListener(() => refreshBadge());
  chrome.runtime?.onStartup?.addListener(() => refreshBadge());
  refreshBadge();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const known = ["capture-active-tab", "preview-active-tab", "connect-active-site", "read-active-page", "scan-all-tabs", "open-and-pull-all"];
    if (!known.includes(message?.type)) return false;

    if (message.type === "scan-all-tabs") {
      scanAllTabs().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }

    if (message.type === "open-and-pull-all") {
      openAndPullAll().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }

    activeTab()
      .then(async (tab) => {
        if (message.type === "preview-active-tab") {
          const health = await localApiHealth();
          return {
            ok: true,
            preview: previewForTab(tab),
            connector: connectorSummary(connectorForUrl(tab?.url)),
            reader: readerSummary(readerForUrl(tab?.url)),
            apiUp: health.up,
          };
        }
        if (message.type === "connect-active-site") return connectActiveSite(tab);
        if (message.type === "read-active-page") return readActivePage(tab);
        return postCapture(buildCapturePayload(tab));
      })
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));

    return true;
  });
}

export { readConnectorCookies, connectActiveSite, connectorSummary, readActivePage, pageStatExtractor, scanAllTabs, openAllSources, openAndPullAll, CONNECTORS, READERS };
