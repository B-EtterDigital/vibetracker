import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCapturePayload, inferProvider, previewForTab, statusForCapture } from "../popup-model.mjs";

test("browser extension infers branded AI providers without scraping content", () => {
  assert.deepEqual(
    { ...inferProvider("https://chatgpt.com/c/abc"), hosts: undefined },
    { id: "openai-web", label: "ChatGPT", mark: "OA", category: "llm", from: "#10a37f", to: "#6ee7c8", hosts: undefined, host: "chatgpt.com" }
  );
  assert.equal(inferProvider("https://www.midjourney.com/explore").category, "image");
  assert.equal(inferProvider("https://suno.com/create").category, "music");
  assert.equal(inferProvider("https://elevenlabs.io/app").category, "audio");
  assert.equal(inferProvider("https://app.runwayml.com/video").category, "video");
  assert.equal(inferProvider("https://unknown-ai.example").id, "ai-web");
});

test("browser extension builds the local capture payload contract", () => {
  const payload = buildCapturePayload(
    { url: "https://claude.ai/chat/123", title: "Claude chat" },
    new Date("2026-07-05T00:00:00Z")
  );

  assert.equal(payload.url, "https://claude.ai/chat/123");
  assert.equal(payload.title, "Claude chat");
  assert.equal(payload.category, "llm");
  assert.equal(payload.operation, "browser_capture");
  assert.equal(payload.quantity, 1);
  assert.equal(payload.unit, "request");
  assert.equal(payload.rawUnit, "request");
  assert.equal(payload.ts, "2026-07-05T00:00:00.000Z");
  assert.throws(() => buildCapturePayload(null), /no active tab URL/);
});

test("browser extension preview and status copy keep privacy boundaries visible", () => {
  const preview = previewForTab({ url: "https://higgsfield.ai", title: "Higgsfield" });
  assert.equal(preview.mark, "HF");
  assert.equal(preview.ready, true);
  assert.match(preview.lines.join("\n"), /no prompt text/);
  assert.match(preview.lines.join("\n"), /local low-confidence/);

  const empty = previewForTab(null);
  assert.equal(empty.ready, false);
  assert.match(empty.lines.join("\n"), /no active tab URL/);

  assert.equal(statusForCapture({ ok: true }).state, "ok");
  assert.match(statusForCapture({ ok: true }).detail, /local VibeTRACKER ledger/);
  assert.equal(statusForCapture({ ok: false, status: 503 }).state, "error");
  assert.match(statusForCapture({ ok: false, status: 503 }).detail, /api serve/);
});

test("browser extension manifest and popup load the module cockpit", () => {
  const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
  const popup = readFileSync(new URL("../popup.html", import.meta.url), "utf8");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.type, "module");
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.match(popup, /popup\.css/);
  assert.match(popup, /type="module" src="popup\.js"/);
  assert.match(popup, /No prompt text, no page scraping, no upload/);
  assert.match(popup, /Vibers Unite/);
});
