import { previewForTab, statusForCapture, statusForConnect } from "./popup-model.mjs";

const button = document.getElementById("capture");
const status = document.getElementById("status");
const mark = document.getElementById("provider-mark");
const host = document.getElementById("provider-host");
const label = document.getElementById("provider-label");
const category = document.getElementById("provider-category");
const terminal = document.getElementById("terminal");
const connectCard = document.getElementById("connect-card");
const connectBtn = document.getElementById("connect");
const connectLabel = document.getElementById("connect-label");
const connectCta = document.getElementById("connect-cta");

function setProvider(preview) {
  document.documentElement.style.setProperty("--brand-from", preview.from);
  document.documentElement.style.setProperty("--brand-to", preview.to);
  document.documentElement.style.setProperty("--brand-ink", preview.ink || "#071013");
  mark.textContent = preview.mark;
  host.textContent = preview.host || "active tab";
  label.textContent = preview.label;
  category.textContent = `${preview.category} // local low-confidence`;
  terminal.textContent = preview.lines.join("\n");
  button.disabled = !preview.ready;
}

function setConnector(connector) {
  if (!connector) {
    connectCard.hidden = true;
    return;
  }
  connectCard.hidden = false;
  connectLabel.textContent = connector.pending ? `${connector.label} (importer coming)` : connector.label;
  connectCta.textContent = `Connect ${connector.label}`;
  // the connect card takes the connector's brand colours for a first-sight identity match
  if (connector.brand) {
    document.documentElement.style.setProperty("--brand-from", connector.brand.from);
    document.documentElement.style.setProperty("--brand-to", connector.brand.to);
    document.documentElement.style.setProperty("--brand-ink", connector.brand.ink || "#071013");
  }
  connectBtn.disabled = false;
}

function setStatus(next) {
  status.dataset.state = next.state;
  status.textContent = `${next.label} — ${next.detail}`;
}

function send(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

async function refreshPreview() {
  const response = await send({ type: "preview-active-tab" });
  setProvider(response?.preview || previewForTab(null));
  setConnector(response?.connector || null);
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.dataset.state = "";
  status.textContent = "capturing active AI tab locally...";
  try {
    const response = await send({ type: "capture-active-tab" });
    setStatus(statusForCapture(response));
  } finally {
    await refreshPreview();
  }
});

connectBtn.addEventListener("click", async () => {
  connectBtn.disabled = true;
  status.dataset.state = "";
  status.textContent = "reading session cookie locally...";
  try {
    const response = await send({ type: "connect-active-site" });
    setStatus(statusForConnect(response));
  } catch (error) {
    setStatus(statusForConnect({ ok: false, error: String(error?.message || error) }));
  } finally {
    connectBtn.disabled = false;
  }
});

refreshPreview().catch((error) => {
  setProvider(previewForTab(null));
  setConnector(null);
  setStatus(statusForCapture({ ok: false, error: String(error?.message || error) }));
});
