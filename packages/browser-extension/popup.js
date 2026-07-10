import { previewForTab, statusForCapture } from "./popup-model.mjs";

const button = document.getElementById("capture");
const status = document.getElementById("status");
const mark = document.getElementById("provider-mark");
const host = document.getElementById("provider-host");
const label = document.getElementById("provider-label");
const category = document.getElementById("provider-category");
const terminal = document.getElementById("terminal");

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

function setStatus(result) {
  const next = statusForCapture(result);
  status.dataset.state = next.state;
  status.textContent = `${next.label} — ${next.detail}`;
}

function send(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

async function refreshPreview() {
  const response = await send({ type: "preview-active-tab" });
  setProvider(response?.preview || previewForTab(null));
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.dataset.state = "";
  status.textContent = "capturing active AI tab locally...";
  try {
    const response = await send({ type: "capture-active-tab" });
    setStatus(response);
  } finally {
    await refreshPreview();
  }
});

refreshPreview().catch((error) => {
  setProvider(previewForTab(null));
  setStatus({ ok: false, error: String(error?.message || error) });
});
