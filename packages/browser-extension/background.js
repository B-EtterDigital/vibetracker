import { CAPTURE_ENDPOINT, buildCapturePayload, previewForTab } from "./popup-model.mjs";

function activeTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
}

async function postCapture(payload) {
  const res = await fetch(CAPTURE_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, body: await res.text(), payload };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "capture-active-tab" && message?.type !== "preview-active-tab") return false;

  activeTab()
    .then(async (tab) => {
      if (message.type === "preview-active-tab") return { ok: true, preview: previewForTab(tab) };
      return postCapture(buildCapturePayload(tab));
    })
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));

  return true;
});
