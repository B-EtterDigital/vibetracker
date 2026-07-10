import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { collectEntries, parseLine } from "../index.ts";
import { toRecords } from "../normalize.ts";

const FIX = join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__");

test("parseLine skips user, synthetic, and zero-usage lines", () => {
  assert.equal(parseLine('{"type":"user","message":{"role":"user"}}'), null);
  assert.equal(parseLine('{"type":"assistant","message":{"model":"<synthetic>","usage":{"input_tokens":0,"output_tokens":0}}}'), null);
  assert.equal(parseLine("not json"), null);
});

test("collectEntries dedupes by id:requestId and skips non-usage lines", () => {
  const entries = collectEntries(FIX);
  assert.equal(entries.length, 2); // opus (deduped from 2) + sonnet; user/synthetic skipped
  const opus = entries.find((e) => /opus/.test(e.model))!;
  assert.equal(opus.input, 1000);
  assert.equal(opus.cacheRead, 4000);
});

test("toRecords computes token total and per-type USD estimate", () => {
  const recs = toRecords(collectEntries(FIX));
  const opus = recs.find((r) => /opus/.test(r.model!))!;
  assert.equal(opus.rawAmount, 5700);          // 1000+500+200+4000
  assert.equal(opus.category, "coding");
  assert.equal(opus.source, "log");
  // opus-4-8 tier: 1000*5 + 500*25 + 200*6.25 + 4000*0.5 per MTok = 20,750 / 1e6 = 0.02075
  assert.equal(opus.usdEst, 0.02075);
  const sonnet = recs.find((r) => /sonnet/.test(r.model!))!;
  assert.equal(sonnet.usdEst, 0.018);          // 2000*3 + 800*15 per MTok
});
