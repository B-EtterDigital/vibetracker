import { test } from "node:test";
import assert from "node:assert/strict";
import { READERS, readerForUrl, readerHosts, extractStat } from "../readers.mjs";
import { readActivePage, pageStatExtractor, isPullableUrl, countPullableSources, resetBridgePort } from "../background.js";

// The bridge auto-discovers its port by probing /health across candidates; the first is 8799.
function isHealth(url: string): boolean { return String(url).endsWith("/health"); }

test("readerForUrl matches page-read sources and rejects others", () => {
  assert.equal(readerForUrl("https://www.midjourney.com/account")?.id, "midjourney");
  assert.equal(readerForUrl("https://chatgpt.com/#settings")?.id, "openai-web");
  assert.equal(readerForUrl("https://higgsfield.ai/account")?.id, "higgsfield");
  assert.equal(readerForUrl("https://suno.com/"), null); // suno is a cookie connector, not a page read
});

test("extractStat pulls Midjourney lifetime images, comma-stripped", () => {
  const mj = READERS.find((r) => r.id === "midjourney")!;
  const out = extractStat("Your info\nLifetime Usage: 3,982 images\nFast Usage: 3,891 images", mj);
  assert.deepEqual(out, { operation: "lifetime_images", unit: "image", value: 3982 });
});

test("extractStat reads Midjourney web-page 'Lifetime' phrasings but ignores a bare gallery count", () => {
  const mj = READERS.find((r) => r.id === "midjourney")!;
  assert.equal(extractStat("Lifetime Images: 4,120", mj)?.value, 4120);
  assert.equal(extractStat("12,000 images generated all-time", mj)?.value, 12000);
  // a bare "N images" (an explore/gallery count) must NOT be mistaken for the lifetime total
  assert.equal(extractStat("Showing 240 images in your gallery", mj), null);
});

test("extractStat reads a Higgsfield credit balance", () => {
  const hf = READERS.find((r) => r.id === "higgsfield")!;
  const out = extractStat("Plan: Ultra\nCredits: 5,848.5 remaining", hf);
  assert.equal(out?.operation, "credit_balance");
  assert.equal(out?.value, 5848.5);
});

test("extractStat returns null when the declared number is absent", () => {
  const mj = READERS.find((r) => r.id === "midjourney")!;
  assert.equal(extractStat("nothing relevant here", mj), null);
});

test("pageStatExtractor (the injected function) works over a fake document body", () => {
  const restore = globalThis.document;
  // @ts-expect-error minimal document shim for the injected reader
  globalThis.document = { body: { innerText: "Lifetime Usage: 1,200 images" } };
  try {
    const mj = READERS.find((r) => r.id === "midjourney")!;
    assert.deepEqual(pageStatExtractor(mj.stats), { operation: "lifetime_images", unit: "image", value: 1200 });
  } finally {
    globalThis.document = restore;
  }
});

test("pageStatExtractor returns content-free miss diagnostics (length + keyword only)", () => {
  const restore = globalThis.document;
  const hf = READERS.find((r) => r.id === "higgsfield")!;
  try {
    // keyword present but number unreadable
    // @ts-expect-error shim
    globalThis.document = { body: { innerText: "Your credits are shown in the widget above. ".repeat(10) } };
    const withKeyword = pageStatExtractor(hf.stats) as { miss: boolean; keywordFound: boolean; textLen: number };
    assert.equal(withKeyword.miss, true);
    assert.equal(withKeyword.keywordFound, true, "the unit keyword was on the page");
    assert.ok(withKeyword.textLen > 200);
    // wrong page entirely
    // @ts-expect-error shim
    globalThis.document = { body: { innerText: "welcome to the gallery homepage with lots of unrelated text ".repeat(10) } };
    const wrongPage = pageStatExtractor(hf.stats) as { miss: boolean; keywordFound: boolean };
    assert.equal(wrongPage.miss, true);
    assert.equal(wrongPage.keywordFound, false, "no keyword → the usage view isn't open");
  } finally {
    globalThis.document = restore;
  }
});

test("all reader hosts are unique for the manifest allowlist", () => {
  const hosts = readerHosts();
  assert.ok(hosts.includes("midjourney.com"));
  assert.equal(new Set(hosts).size, hosts.length);
});

// readActivePage injects the extractor and POSTs the resulting usage number to /capture.
test("readActivePage records the read number as a usage snapshot", async () => {
  const fakeScripting = {
    async executeScript() {
      return [{ result: { operation: "lifetime_images", unit: "image", value: 3982 } }];
    },
  };
  const posted: Array<{ url: string; body: any }> = [];
  const realFetch = globalThis.fetch;
  resetBridgePort();
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    if (isHealth(url)) return { ok: true, status: 200, text: async () => "{}" };
    posted.push({ url: String(url), body: JSON.parse(init.body) });
    return { ok: true, status: 200, text: async () => JSON.stringify({ accepted: 1, rejected: [] }) };
  }) as unknown as typeof fetch;
  try {
    const result = await readActivePage({ id: 7, url: "https://midjourney.com/account", title: "MJ" }, fakeScripting);
    assert.equal(result.ok, true);
    assert.equal(result.provider, "midjourney");
    assert.equal(result.value, 3982);
    assert.equal(posted[0].url, "http://127.0.0.1:8799/capture");
    assert.equal(posted[0].body.quantity, 3982);
    assert.equal(posted[0].body.operation, "lifetime_images");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("readActivePage refuses a page with no known usage number", async () => {
  const result = await readActivePage({ id: 1, url: "https://example.com/" });
  assert.equal(result.ok, false);
  assert.match(result.error, /no known usage number/i);
});

test("isPullableUrl is true for cookie sources AND page-read sources, false otherwise", () => {
  assert.equal(isPullableUrl("https://suno.com/create"), true);       // cookie connector
  assert.equal(isPullableUrl("https://midjourney.com/account"), true); // page reader
  assert.equal(isPullableUrl("https://perplexity.ai/settings"), true); // page reader
  assert.equal(isPullableUrl("https://example.com/"), false);
});

test("countPullableSources counts DISTINCT sources across tabs (dedupes)", () => {
  const count = countPullableSources([
    { url: "https://suno.com/a" },
    { url: "https://suno.com/b" },      // dupe
    { url: "https://midjourney.com/" },
    { url: "https://higgsfield.ai/" },
    { url: "https://example.com/" },     // unsupported
  ]);
  assert.equal(count, 3); // suno + midjourney + higgsfield
});
