import { previewForTab, statusForCapture, statusForConnect, statusForRead } from "./popup-model.mjs";

const $ = (id) => document.getElementById(id);
const status = $("status");
const mark = $("provider-mark");
const host = $("provider-host");
const label = $("provider-label");
const category = $("provider-category");
const terminal = $("terminal");
const connectCard = $("connect-card");
const connectBtn = $("connect");
const connectLabel = $("connect-label");
const connectCta = $("connect-cta");
const readCard = $("read-card");
const readBtn = $("read");
const readLabel = $("read-label");
const readHint = $("read-hint");
const readCta = $("read-cta");
const apiBanner = $("api-banner");
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

function setProvider(preview) {
  brand(preview.from, preview.to, preview.ink);
  mark.textContent = preview.mark;
  host.textContent = preview.host || "active tab";
  label.textContent = preview.label;
  category.textContent = `${preview.category} // local low-confidence`;
  terminal.textContent = preview.lines.join("\n");
  captureBtn.disabled = !preview.ready;
}

function setConnector(connector) {
  if (!connector) { connectCard.hidden = true; return; }
  connectCard.hidden = false;
  connectLabel.textContent = connector.pending ? `${connector.label} (importer coming)` : connector.label;
  connectCta.textContent = `Connect ${connector.label}`;
  if (connector.brand) brand(connector.brand.from, connector.brand.to, connector.brand.ink);
  connectBtn.disabled = false;
}

function setReader(reader) {
  if (!reader) { readCard.hidden = true; return; }
  readCard.hidden = false;
  readLabel.textContent = reader.label;
  readHint.textContent = reader.hint || "Open the page that shows your usage number, then read it.";
  readCta.textContent = `Read ${reader.label} usage`;
  readBtn.disabled = false;
}

function setApi(up) {
  apiBanner.dataset.state = up ? "up" : "down";
  if (up) {
    apiTitle.textContent = "Local app connected";
    apiDetail.textContent = "Connect a source or read a usage page below.";
    apiCmd.hidden = true;
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
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

async function refresh() {
  const response = await send({ type: "preview-active-tab" });
  setProvider(response?.preview || previewForTab(null));
  setConnector(response?.connector || null);
  setReader(response?.reader || null);
  setApi(Boolean(response?.apiUp));
}

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

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "scanning your open tabs...";
  scanResults.hidden = true;
  scanResults.textContent = "";
  try {
    const res = await send({ type: "scan-all-tabs" });
    const results = res?.results || [];
    if (!results.length) {
      setStatus({ state: "error", label: "nothing found", detail: "No supported AI source is open. Open Suno, Midjourney, Higgsfield, and try again." });
    } else {
      for (const r of results) {
        const li = document.createElement("li");
        li.dataset.ok = r.ok ? "true" : "false";
        li.innerHTML = `<b>${r.label}</b><span>${r.ok ? (r.kind === "read" ? "read " : "connected · ") : ""}${r.detail || ""}</span>`;
        scanResults.appendChild(li);
      }
      scanResults.hidden = false;
      setStatus({ state: res.connected ? "ok" : "error", label: `${res.connected}/${res.total} pulled`, detail: res.connected ? "Run `vibetracker sync` to fetch them all." : "Log in to those sources first, then scan again." });
    }
  } catch (error) {
    setStatus({ state: "error", label: "scan failed", detail: String(error?.message || error) });
  } finally {
    scanBtn.disabled = false;
  }
});

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
