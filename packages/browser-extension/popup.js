import { BRIDGE_BUILD, previewForTab, statusForCapture, statusForConnect, statusForRead, logoFor } from "./popup-model.mjs";

const $ = (id) => document.getElementById(id);
const status = $("status");
const mark = $("provider-mark");
const host = $("provider-host");
const label = $("provider-label");
const category = $("provider-category");
const connectCard = $("connect-card");
const connectBtn = $("connect");
const connectLabel = $("connect-label");
const connectCta = $("connect-cta");
const readCard = $("read-card");
const readBtn = $("read");
const readLabel = $("read-label");
const readHint = $("read-hint");
const readCta = $("read-cta");
const providerCard = $("provider-card");
const sourceBoard = $("source-board");
const apiBanner = $("api-banner");
const apiActions = $("api-actions");
const syncNowBtn = $("sync-now");
const viewProfileBtn = $("view-profile");
const apiTitle = $("api-title");
const apiDetail = $("api-detail");
const apiCmd = $("api-cmd");
const captureBtn = $("capture");
const scanBtn = $("scan");
const scanResults = $("scan-results");

function brand(from, to, ink) {
  document.documentElement.style.setProperty("--brand-from", from);
  document.documentElement.style.setProperty("--brand-to", to);
  document.documentElement.style.setProperty("--brand-ink", ink || "#071013");
}

// Real brand logo when the extension ships one; two-letter gradient monogram otherwise.
// ids/marks/paths all come from our own registries — never from page content.
function brandGlyph(id, markText, cssClass) {
  const logo = logoFor(id);
  return logo ? `<img class="${cssClass}" src="${logo}" alt="">` : markText;
}

function setProvider(preview) {
  brand(preview.from, preview.to, preview.ink);
  mark.innerHTML = brandGlyph(preview.id, preview.mark, "orb-logo");
  host.textContent = preview.host || "active tab";
  label.textContent = preview.label;
  category.textContent = `${preview.category} // local low-confidence`;
  captureBtn.disabled = !preview.ready;
}

function setConnector(connector) {
  if (!connector) { connectCard.hidden = true; return; }
  connectCard.hidden = false;
  const logo = logoFor(connector.id);
  connectLabel.innerHTML = `${logo ? `<img class="mini-logo" src="${logo}" alt="">` : ""}${connector.pending ? `${connector.label} (importer coming)` : connector.label}`;
  connectCta.textContent = `Connect ${connector.label}`;
  if (connector.brand) brand(connector.brand.from, connector.brand.to, connector.brand.ink);
  connectBtn.disabled = false;
}

function setReader(reader) {
  if (!reader) { readCard.hidden = true; return; }
  readCard.hidden = false;
  const logo = logoFor(reader.id);
  readLabel.innerHTML = `${logo ? `<img class="mini-logo" src="${logo}" alt="">` : ""}${reader.label}`;
  readHint.textContent = reader.hint || "Open the page that shows your usage number, then read it.";
  readCta.textContent = `Read ${reader.label} usage`;
  readBtn.disabled = false;
}

function setApi(up) {
  apiBanner.dataset.state = up ? "up" : "down";
  apiActions.hidden = !up; // Sync / Profile chips only make sense with a live bridge
  if (up) {
    apiTitle.textContent = "Local app connected";
    apiDetail.textContent = "Connect a source or read a usage page below.";
    apiCmd.hidden = true;
    // the pristine status still shows the setup hint — swap it for a ready line once connected
    if (status.textContent.startsWith("Run: vibetracker start")) status.textContent = "Ready — pull when you are.";
  } else {
    apiTitle.textContent = "Local app not running";
    apiDetail.textContent = "Run this once in your terminal, then reopen:";
    apiCmd.hidden = false;
  }
}

function setStatus(next) {
  status.dataset.state = next.state;
  status.textContent = `${next.label} — ${next.detail}`;
}

function send(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      // Reading lastError ACKNOWLEDGES it — otherwise Chrome logs "Unchecked runtime.lastError:
      // The message port closed before a response was received" on the extension card. A closed
      // port means a stale/asleep worker; resolve undefined and the callers' self-heal takes over.
      const err = chrome.runtime.lastError;
      if (err) {
        console.debug("[vibetracker] message port closed", {
          area: "browser-extension.popup", type: message?.type, message: String(err.message || err).slice(0, 120),
        });
      }
      resolve(response);
    });
  });
}

// Self-heal a stale service worker. Chrome serves popup files live from disk, but the background
// worker keeps running OLD code until the extension reloads — after any rebuild the two silently
// drift and every message returns undefined ("nothing found"). On mismatch, reload the extension
// once (loop-guarded via localStorage) so the user never has to know chrome://extensions exists.
function healStaleWorker(workerBuild) {
  if (workerBuild === BRIDGE_BUILD) return false;
  const last = Number(localStorage.getItem("vt-self-reload-at") || 0);
  if (Date.now() - last < 15000) {
    // reloaded moments ago and still mismatched — stop looping, ask for the manual step
    setStatus({ state: "error", label: "update stuck", detail: "Open chrome://extensions and click ↻ on VibeTRACKER Bridge." });
    return false;
  }
  localStorage.setItem("vt-self-reload-at", String(Date.now()));
  setStatus({ state: "", label: "updating", detail: "New Bridge version detected — reloading the extension…" });
  chrome.runtime.reload();
  return true;
}

// The source board: one tile per supported source — real logo, green tick when its data is in the
// local ledger. Click a tile to jump to that source (e.g. to log in before pulling).
const STATE_HINT = {
  synced: "synced — data is in your local ledger",
  connected: "connected — session stored, syncs on the next pull",
  open: "tab open — ready to pull",
  idle: "not connected yet — click to open, log in, then pull",
};
let profileUrl = null; // the active user's VibeUsage profile, resolved by the local bridge

async function loadBoard() {
  const board = await send({ type: "source-board" });
  profileUrl = board?.profile?.url ?? profileUrl;
  if (!board?.tiles?.length) { sourceBoard.hidden = true; return; }
  sourceBoard.hidden = false;
  sourceBoard.textContent = "";
  for (const tile of board.tiles) {
    const li = document.createElement("li");
    li.dataset.state = tile.state;
    const glyph = tile.logo ? `<img src="${tile.logo}" alt="">` : `<span class="tmark">${tile.mark}</span>`;
    li.innerHTML = `<button type="button" class="tile" title="${tile.label} — ${STATE_HINT[tile.state] || tile.state}">${glyph}</button><span class="tile-badge" aria-hidden="true"></span>`;
    li.querySelector("button").addEventListener("click", () => {
      chrome.tabs.create({ url: tile.url, active: true }).catch((error) => console.debug("[vibetracker] tile open failed", {
        area: "browser-extension.board", provider: tile.id, message: String(error?.message || error).slice(0, 120),
      }));
    });
    sourceBoard.appendChild(li);
  }
}

async function refresh() {
  const response = await send({ type: "preview-active-tab" });
  if (healStaleWorker(response?.build)) return; // extension is reloading — this popup is closing
  setProvider(response?.preview || previewForTab(null));
  setConnector(response?.connector || null);
  setReader(response?.reader || null);
  // the contextual connect/read card already names the active source — hide the duplicate preview
  providerCard.hidden = Boolean(response?.connector || response?.reader);
  setApi(Boolean(response?.apiUp));
  loadBoard().catch(() => { sourceBoard.hidden = true; });
}

syncNowBtn.addEventListener("click", async () => {
  syncNowBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "syncing all connected sources…";
  try {
    const res = await send({ type: "sync-now" });
    if (res?.ok) {
      setStatus({ state: "ok", label: "sync complete", detail: `${res.fresh} fresh record${res.fresh === 1 ? "" : "s"} from ${res.targets} source${res.targets === 1 ? "" : "s"}. Your profile updates on the next upload.` });
    } else {
      setStatus({ state: "error", label: "sync failed", detail: res?.error || res?.body?.error || "The local app refused the sync — check the terminal running `vibetracker start`." });
    }
  } catch (error) {
    setStatus({ state: "error", label: "sync failed", detail: String(error?.message || error) });
  } finally {
    syncNowBtn.disabled = false;
    loadBoard().catch((error) => console.debug("[vibetracker] board refresh failed", {
      area: "browser-extension.board", message: String(error?.message || error).slice(0, 120),
    }));
  }
});

copyReportBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sweepReport());
    copyReportBtn.textContent = "Report copied ✓ — paste it in chat";
  } catch {
    copyReportBtn.textContent = "Copy failed — screenshot the list instead";
  }
});

viewProfileBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: profileUrl || "https://vibeusage.c0vibe.app", active: true }).catch((error) => console.debug("[vibetracker] profile open failed", {
    area: "browser-extension.popup", message: String(error?.message || error).slice(0, 120),
  }));
});

apiCmd.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("vibetracker start");
    apiDetail.textContent = "Copied. Paste it in your terminal, then reopen this popup.";
  } catch {
    apiDetail.textContent = "Copy failed — run: vibetracker start";
  }
});

captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "capturing active AI tab locally...";
  try {
    setStatus(statusForCapture(await send({ type: "capture-active-tab" })));
  } finally {
    await refresh();
  }
});

connectBtn.addEventListener("click", async () => {
  connectBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "reading session cookie locally...";
  try {
    setStatus(statusForConnect(await send({ type: "connect-active-site" })));
  } catch (error) {
    setStatus(statusForConnect({ ok: false, error: String(error?.message || error) }));
  } finally {
    connectBtn.disabled = false;
  }
});

// Shared renderer for both sweep flows (pull open tabs / open everything then pull).
let lastSweep = null; // kept so "Copy sweep report" can hand the full per-source detail to support
const copyReportBtn = $("copy-report");

function sweepReport() {
  if (!lastSweep) return "";
  const lines = [
    `VibeTRACKER Bridge sweep report — build ${BRIDGE_BUILD}`,
    `${lastSweep.connected}/${lastSweep.total} pulled${lastSweep.opened?.length ? ` · opened ${lastSweep.opened.length} tab(s)` : ""}`,
    ...(lastSweep.results || []).map((r) => `${r.ok ? "OK  " : "MISS"} ${r.label} [${r.provider}/${r.kind}]: ${r.detail || ""}`),
  ];
  return lines.join("\n");
}

function renderSweep(res, emptyDetail) {
  const results = res?.results || [];
  lastSweep = res;
  copyReportBtn.hidden = !results.length;
  if (!results.length) {
    setStatus({ state: "error", label: "nothing found", detail: emptyDetail });
    return;
  }
  for (const r of results) {
    const li = document.createElement("li");
    li.dataset.ok = r.ok ? "true" : "false";
    const logo = logoFor(r.provider);
    li.innerHTML = `${logo ? `<img class="mini-logo" src="${logo}" alt="">` : ""}<b>${r.label}</b><span>${r.ok ? (r.kind === "read" ? "read " : "connected · ") : ""}${r.detail || ""}</span>`;
    scanResults.appendChild(li);
  }
  scanResults.hidden = false;
  const openedNote = res.opened?.length ? `Opened ${res.opened.length} source tab${res.opened.length === 1 ? "" : "s"}. ` : "";
  const misses = res.total - res.connected;
  setStatus({
    state: res.connected ? "ok" : "error",
    label: `${res.connected}/${res.total} pulled`,
    detail: misses > 0
      ? `${openedNote}Now LOG IN on each opened tab (once per source), then click “Pull from all open tabs”.`
      : `${openedNote}Run \`vibetracker sync\` to fetch them all.`,
  });
}

async function runSweep(messageType, busyText, emptyDetail, btn) {
  btn.disabled = true;
  status.dataset.state = "";
  status.textContent = busyText;
  scanResults.hidden = true;
  scanResults.textContent = "";
  try {
    const res = await send({ type: messageType });
    if (res === undefined) {
      // stale worker doesn't know this message — self-heal instead of a misleading "nothing found"
      if (!healStaleWorker("stale")) setStatus({ state: "error", label: "bridge outdated", detail: "Open chrome://extensions and click ↻ on VibeTRACKER Bridge, then try again." });
      return;
    }
    renderSweep(res, emptyDetail);
  } catch (error) {
    setStatus({ state: "error", label: "sweep failed", detail: String(error?.message || error) });
  } finally {
    btn.disabled = false;
    // ticks reflect the pull that just happened; a board hiccup is cosmetic — breadcrumb only
    loadBoard().catch((error) => console.debug("[vibetracker] board refresh failed", {
      area: "browser-extension.board", message: String(error?.message || error).slice(0, 120),
    }));
  }
}

scanBtn.addEventListener("click", () => runSweep(
  "scan-all-tabs",
  "scanning your open tabs...",
  "No supported AI source is open. Click “Open all sources first” below, or open Suno / Higgsfield / ElevenLabs and try again.",
  scanBtn,
));

const openAllBtn = $("open-all");
openAllBtn.addEventListener("click", () => runSweep(
  "open-and-pull-all",
  "opening every supported source, waiting for them to load, then pulling...",
  "Could not open any source tab.",
  openAllBtn,
));

readBtn.addEventListener("click", async () => {
  readBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "reading the usage number off this page...";
  try {
    setStatus(statusForRead(await send({ type: "read-active-page" })));
  } catch (error) {
    setStatus(statusForRead({ ok: false, error: String(error?.message || error) }));
  } finally {
    readBtn.disabled = false;
  }
});

refresh().catch((error) => {
  setProvider(previewForTab(null));
  setConnector(null);
  setReader(null);
  setApi(false);
  setStatus(statusForCapture({ ok: false, error: String(error?.message || error) }));
});
