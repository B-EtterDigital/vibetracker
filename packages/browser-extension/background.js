import { CAPTURE_ENDPOINT, CONNECT_ENDPOINT, buildCapturePayload, previewForTab } from "./popup-model.mjs";
import { CONNECTORS, connectorForUrl, cookieMatchesSpec } from "./connectors.mjs";

function activeTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
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

// Register the message router only in the extension runtime — guarded so the module stays
// importable under Node for tests (where `chrome` does not exist).
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const known = ["capture-active-tab", "preview-active-tab", "connect-active-site"];
    if (!known.includes(message?.type)) return false;

    activeTab()
      .then(async (tab) => {
        if (message.type === "preview-active-tab") {
          return { ok: true, preview: previewForTab(tab), connector: connectorSummary(connectorForUrl(tab?.url)) };
        }
        if (message.type === "connect-active-site") return connectActiveSite(tab);
        return postCapture(buildCapturePayload(tab));
      })
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));

    return true;
  });
}

export { readConnectorCookies, connectActiveSite, connectorSummary, CONNECTORS };
