import { CANDIDATE_PORTS, BRIDGE_BUILD, pathUrl, buildCapturePayload, previewForTab, logoFor } from "./popup-model.mjs";
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
    // Diagnostics: list the cookie NAMES present on the site (never values) so a wrong spec can be
    // fixed from the sweep report instead of guessed at. Names are identifiers, not secrets — the
    // same line the server logs already hold.
    const names = new Set();
    for (const host of connector.hosts) {
      const all = await cookieApi.getAll({ domain: host }).catch(() => []);
      for (const c of all || []) names.add(c.name);
    }
    const present = [...names].slice(0, 15);
    const diag = present.length
      ? ` [diag: cookies present on ${connector.hosts[0]}: ${present.join(", ")}]`
      : ` [diag: NO cookies at all on ${connector.hosts[0]} — not logged in there in this browser profile]`;
    // Pending sources have UNVERIFIED cookie shapes — if the user is logged in and we still find
    // nothing, that's on us, not them. Say so instead of sending them to log in again.
    const error = (connector.pending
      ? `Couldn't find a ${connector.label} session cookie. If you ARE logged in, this source's cookie shape needs an update on our side.`
      : `No ${connector.label} session cookie found — log in at ${connector.hosts[0]} first, then pull again.`) + diag;
    return { ok: false, provider: connector.id, label: connector.label, error };
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
  // MISS diagnostics — content-free by construction: the text LENGTH, whether any stat keyword
  // (e.g. "credit"/"token") appears, and up to two DIGIT-MASKED fragments of the lines carrying
  // the keyword ("##,### / ###,### credits used") so a mismatched pattern can be fixed from the
  // FORMAT alone. Digits are masked, fragments are keyword-anchored UI labels, 60 chars max —
  // page content never ships.
  const keywords = (stats[0] && (stats[0].keywords || [stats[0].unit])) || [];
  const keywordRe = keywords.length ? new RegExp(keywords.join("|"), "i") : null;
  const shapes = [];
  if (keywordRe) {
    for (const line of text.split("\n")) {
      if (shapes.length >= 2) break;
      if (keywordRe.test(line) && /\d/.test(line)) {
        shapes.push(line.trim().replace(/\d/g, "#").slice(0, 60));
      }
    }
  }
  return {
    miss: true,
    textLen: text.length,
    keywordFound: keywordRe ? keywordRe.test(text) : false,
    keyword: keywords.join("/"),
    shapes,
  };
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
  const inject = async () => {
    const injection = await scriptingApi.executeScript({
      target: { tabId: tab.id },
      func: pageStatExtractor,
      args: [reader.stats],
    });
    return injection?.[0]?.result ?? null;
  };
  let result = null;
  try {
    result = await inject();
    // SPA settle: "complete" tabs often haven't rendered yet (live sweep 2026-07-19: Leonardo /
    // Runway / Perplexity read at 280–360 chars). One retry after 2.5s catches the rendered page.
    if (result?.miss && result.textLen < 500) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      result = await inject();
    }
  } catch (error) {
    return { ok: false, provider: reader.id, label: reader.label, error: `Couldn't read the ${reader.label} page — ${String(error?.message || error).slice(0, 120)}` };
  }
  if (!result || result.miss) {
    // Content-free diagnostics: distinguishes "wrong page open" from "number not machine-readable"
    const shapeNote = result?.shapes?.length ? ` formats seen: ${result.shapes.join(" · ")}` : "";
    const diag = result?.miss
      ? (result.textLen < 200
        ? " [diag: page nearly empty — still loading or not logged in]"
        : result.keywordFound
          ? ` [diag: “${result.keyword}” is on the page but no pattern matched.${shapeNote}]`
          : ` [diag: page loaded (${result.textLen} chars) but no “${result.keyword}” text — the usage view isn't on this page]`)
      : "";
    return { ok: false, provider: reader.id, label: reader.label, error: `No ${reader.label} usage number visible. ${reader.hint}${diag}` };
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

// Token-free GET against the local bridge (health-tier endpoints only: /sources).
async function getJson(path) {
  const port = await resolveApiPort();
  if (port === null) return null;
  try {
    const res = await fetch(pathUrl(port, path), { method: "GET" });
    return res.ok ? await res.json() : null;
  } catch {
    resolvedPort = null; // cached port died — re-probe on the next call
    return null;
  }
}

// First-party / adapter-backed sources that appear on the board without being cookie connectors
// or page readers — the CLI adapter (OAuth) does the syncing; the tile shows its state and links
// to the product. Connect via `vibetracker oauth start <id>` in the terminal.
const ADAPTER_SOURCES = [
  // (cynaps3 moved to CONNECTORS 2026-07-19: one-click Clerk-session connect + adapter sync)
  // no web-exposed numbers (user rule 2026-07-19) but fully tracked outside the browser:
  { id: "higgsfield", label: "Higgsfield", url: "https://higgsfield.ai" },       // MCP adapter syncs balance/transactions
  { id: "midjourney", label: "Midjourney", url: "https://www.midjourney.com" }, // CLI `import midjourney --images <n>` from Discord /info
];

// The source board: EVERY supported source as one tile — logo (or monogram), its page URL, and a
// sync state for the green tick. Precedence: synced (local ledger has data) > connected (creds
// stored, importer pending/next sync) > open (a tab is open, ready to pull) > idle.
export function buildSourceBoard(apiSources, openIds) {
  const sources = [
    ...CONNECTORS.map((c) => ({ id: c.id, label: c.label, url: c.url, mark: c.label.slice(0, 2).toUpperCase() })),
    ...READERS.map((r) => ({ id: r.id, label: r.label, url: r.url, mark: r.label.slice(0, 2).toUpperCase() })),
    ...ADAPTER_SOURCES.map((a) => ({ id: a.id, label: a.label, url: a.url, mark: a.label.slice(0, 2).toUpperCase() })),
  ];
  return sources.map((s) => {
    const api = apiSources?.[s.id];
    const state = api?.hasData ? "synced" : api?.connected ? "connected" : openIds?.has?.(s.id) ? "open" : "idle";
    return { ...s, logo: logoFor(s.id), state, lastTs: api?.lastTs };
  });
}

// Assemble the live board: bridge sync-state + which sources already have an open tab.
async function sourceBoard({ tabsApi } = {}) {
  tabsApi = tabsApi ?? (typeof chrome !== "undefined" ? chrome.tabs : undefined);
  const [api, tabs] = await Promise.all([
    getJson("/sources"),
    tabsApi ? tabsApi.query({}).catch(() => []) : [],
  ]);
  const openIds = new Set();
  for (const tab of tabs || []) {
    const c = connectorForUrl(tab?.url);
    if (c) openIds.add(c.id);
    const r = readerForUrl(tab?.url);
    if (r) openIds.add(r.id);
  }
  return {
    ok: true,
    apiUp: api !== null,
    tiles: buildSourceBoard(api?.sources ?? {}, openIds),
    profile: api?.profile ?? null, // the active user's VibeUsage profile (handle + url)
  };
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

  // Force the toolbar icon on every worker start. Chrome caches action icons aggressively for
  // unpacked extensions — a changed default_icon in the manifest often keeps showing the OLD
  // artwork until a full reinstall. setIcon overrides that cache unconditionally.
  chrome.action?.setIcon?.({ path: { 16: "icons/icon-16.png", 32: "icons/icon-32.png", 48: "icons/icon-48.png", 128: "icons/icon-128.png" } })
    ?.catch?.((error) => console.warn("[vibetracker] toolbar icon set failed", {
      area: "browser-extension.icon", message: String(error?.message || error).slice(0, 120),
    }));

  // Quiet auto-pull every 30 minutes: re-pull ONLY tabs that are already open — never opens tabs,
  // never wakes anything when the local bridge is down (one refused fetch per candidate port and
  // it goes back to sleep). Snapshot dedupe on the CLI side makes repeated reads free of
  // double-counting, so this keeps the ledger fresh at near-zero resource cost. chrome.alarms
  // (not setInterval) so the MV3 service worker can sleep between runs.
  if (chrome.alarms) {
    chrome.alarms.create("vt-auto-pull", { periodInMinutes: 30 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name !== "vt-auto-pull") return;
      localApiHealth()
        .then((health) => (health.up ? scanAllTabs() : null))
        .catch((error) => {
          console.warn("[vibetracker] auto-pull failed", {
            area: "browser-extension.auto-pull", message: String(error?.message || error).slice(0, 120),
          });
        });
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const known = ["capture-active-tab", "preview-active-tab", "connect-active-site", "read-active-page", "scan-all-tabs", "open-and-pull-all", "source-board", "sync-now"];
    if (!known.includes(message?.type)) return false;

    if (message.type === "scan-all-tabs") {
      scanAllTabs().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }

    if (message.type === "source-board") {
      sourceBoard().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }

    if (message.type === "sync-now") {
      postJson("/sync", {}).then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
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
            build: BRIDGE_BUILD, // popup compares against its own build — mismatch = stale worker
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

export { readConnectorCookies, connectActiveSite, connectorSummary, readActivePage, pageStatExtractor, scanAllTabs, openAllSources, openAndPullAll, sourceBoard, CONNECTORS, READERS };
