import { CAPTURE_ENDPOINT, CONNECT_ENDPOINT, HEALTH_ENDPOINT, buildCapturePayload, previewForTab } from "./popup-model.mjs";
import { CONNECTORS, connectorForUrl, cookieMatchesSpec } from "./connectors.mjs";
import { READERS, readerForUrl } from "./readers.mjs";

function activeTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
}

// Is the local CLI API up? Powers the popup's "start the API" guidance so install is frictionless.
async function localApiHealth() {
  try {
    const res = await fetch(HEALTH_ENDPOINT, { method: "GET" });
    return { up: res.ok };
  } catch {
    return { up: false };
  }
}

async function postJson(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: res.ok, status: res.status, body };
}

async function postCapture(payload) {
  const result = await postJson(CAPTURE_ENDPOINT, payload);
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
  const result = await postJson(CONNECT_ENDPOINT, { provider: connector.id, fields });
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

// Register the message router only in the extension runtime — guarded so the module stays
// importable under Node for tests (where `chrome` does not exist).
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const known = ["capture-active-tab", "preview-active-tab", "connect-active-site", "read-active-page", "scan-all-tabs"];
    if (!known.includes(message?.type)) return false;

    if (message.type === "scan-all-tabs") {
      scanAllTabs().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
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

export { readConnectorCookies, connectActiveSite, connectorSummary, readActivePage, pageStatExtractor, scanAllTabs, CONNECTORS, READERS };
