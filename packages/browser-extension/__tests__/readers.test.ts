import { test } from "node:test";
import assert from "node:assert/strict";
import { READERS, readerForUrl, readerHosts, extractStat } from "../readers.mjs";
import { readActivePage, pageStatExtractor, isPullableUrl, countPullableSources, resetBridgePort } from "../background.js";

// The bridge auto-discovers its port by probing /health across candidates; the first is 8799.
function isHealth(url: string): boolean { return String(url).endsWith("/health"); }

test("readerForUrl matches only sources that expose a number over the web", () => {
  assert.equal(readerForUrl("https://elevenlabs.io/app/usage")?.id, "elevenlabs");
  assert.equal(readerForUrl("https://app.leonardo.ai/")?.id, "leonardo");
  assert.equal(readerForUrl("https://app.runwayml.com/account")?.id, "runway");
  assert.equal(readerForUrl("https://www.perplexity.ai/settings")?.id, "perplexity");
  // removed 2026-07-19 (user rule): no web-exposed number → no reader
  assert.equal(readerForUrl("https://www.midjourney.com/account"), null);
  assert.equal(readerForUrl("https://chatgpt.com/#settings"), null);
  assert.equal(readerForUrl("https://higgsfield.ai/"), null);
  assert.equal(readerForUrl("https://suno.com/"), null); // suno is a cookie connector, not a page read
});

test("extractStat reads ElevenLabs credit phrasings (slash, bare, labelled)", () => {
  const el = READERS.find((r) => r.id === "elevenlabs")!;
  assert.equal(extractStat("Usage 11,201 / 100,000 credits this month", el)?.value, 11201);
  assert.equal(extractStat("9821 of 100000 credits monthly", el)?.value, 9821, "usage, never the quota");
  assert.equal(extractStat("You have 11,201 credits remaining", el)?.value, 11201);
  assert.equal(extractStat("Credits: 11,201", el)?.value, 11201);
});

test("extractStat reads a Runway credit balance, comma-stripped", () => {
  const rw = READERS.find((r) => r.id === "runway")!;
  assert.deepEqual(extractStat("Plan: Pro\n1,050 credits available", rw), { operation: "credit_balance", unit: "credit", value: 1050 });
});

test("extractStat returns null when the declared number is absent", () => {
  const rw = READERS.find((r) => r.id === "runway")!;
  assert.equal(extractStat("nothing relevant here", rw), null);
});

test("pageStatExtractor (the injected function) works over a fake document body", () => {
  const restore = globalThis.document;
  // @ts-expect-error minimal document shim for the injected reader
  globalThis.document = { body: { innerText: "You have 2,400 credits remaining" } };
  try {
    const el = READERS.find((r) => r.id === "elevenlabs")!;
    const out = pageStatExtractor(el.stats) as { operation: string; value: number };
    assert.equal(out.operation, "character_usage");
    assert.equal(out.value, 2400);
  } finally {
    globalThis.document = restore;
  }
});

test("pageStatExtractor shapes mask every digit and only keyword-bearing lines ship", () => {
  const restore = globalThis.document;
  const el = READERS.find((r) => r.id === "elevenlabs")!;
  try {
    // a format none of the patterns match — the shape must come back digit-masked
    // @ts-expect-error shim
    globalThis.document = { body: { innerText: "Plan\ncredit level A9821 max\nsecret user text 4242" } };
    const out = pageStatExtractor(el.stats) as { miss: boolean; shapes: string[] };
    assert.equal(out.miss, true);
    assert.equal(out.shapes.length, 1, "only the keyword-bearing line ships");
    assert.equal(out.shapes[0], "credit level A#### max");
    assert.equal(JSON.stringify(out).includes("9821"), false, "digits never leak");
    assert.equal(JSON.stringify(out).includes("secret"), false, "non-keyword lines never leak");
  } finally {
    globalThis.document = restore;
  }
});

test("pageStatExtractor returns content-free miss diagnostics (length + keyword only)", () => {
  const restore = globalThis.document;
  const rw = READERS.find((r) => r.id === "runway")!;
  try {
    // keyword present but number unreadable
    // @ts-expect-error shim
    globalThis.document = { body: { innerText: "Your credits are shown in the widget above. ".repeat(10) } };
    const withKeyword = pageStatExtractor(rw.stats) as { miss: boolean; keywordFound: boolean; textLen: number; shapes: string[] };
    assert.equal(withKeyword.miss, true);
    assert.equal(withKeyword.keywordFound, true, "the unit keyword was on the page");
    assert.ok(withKeyword.textLen > 200);
    assert.equal(withKeyword.shapes.length, 0, "no digit-bearing keyword line → no shapes");
    // wrong page entirely
    // @ts-expect-error shim
    globalThis.document = { body: { innerText: "welcome to the homepage with lots of unrelated text ".repeat(10) } };
    const wrongPage = pageStatExtractor(rw.stats) as { miss: boolean; keywordFound: boolean };
    assert.equal(wrongPage.miss, true);
    assert.equal(wrongPage.keywordFound, false, "no keyword → the usage view isn't open");
  } finally {
    globalThis.document = restore;
  }
});

test("all reader hosts are unique for the manifest allowlist", () => {
  const hosts = readerHosts();
  assert.ok(hosts.includes("elevenlabs.io"));
  assert.ok(hosts.includes("app.runwayml.com"));
  assert.equal(new Set(hosts).size, hosts.length);
});

// readActivePage injects the extractor and POSTs the resulting usage number to /capture.
test("readActivePage records the read number as a usage snapshot", async () => {
  const fakeScripting = {
    async executeScript() {
      return [{ result: { operation: "character_usage", unit: "credit", value: 11201 } }];
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
    const result = await readActivePage({ id: 7, url: "https://elevenlabs.io/app/usage", title: "Usage" }, fakeScripting);
    assert.equal(result.ok, true);
    assert.equal(result.provider, "elevenlabs");
    assert.equal(result.value, 11201);
    assert.equal(posted[0].url, "http://127.0.0.1:8799/capture");
    assert.equal(posted[0].body.quantity, 11201);
    assert.equal(posted[0].body.operation, "character_usage");
    assert.equal(posted[0].body.snapshot, true, "balance reads replace, never double-count");
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
  assert.equal(isPullableUrl("https://suno.com/create"), true);        // cookie connector
  assert.equal(isPullableUrl("https://elevenlabs.io/app/usage"), true); // page reader
  assert.equal(isPullableUrl("https://perplexity.ai/settings"), true);  // page reader
  assert.equal(isPullableUrl("https://www.midjourney.com/account"), false); // reader removed — Discord-only number
  assert.equal(isPullableUrl("https://example.com/"), false);
});

test("countPullableSources counts DISTINCT sources across tabs (dedupes)", () => {
  const count = countPullableSources([
    { url: "https://suno.com/a" },
    { url: "https://suno.com/b" },        // dupe
    { url: "https://elevenlabs.io/app" },
    { url: "https://app.runwayml.com/" },
    { url: "https://example.com/" },      // unsupported
  ]);
  assert.equal(count, 3); // suno + elevenlabs + runway
});
