import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeHistory } from "../normalize.ts";
import { createComfyUIAdapter, createFixtureClient } from "../index.ts";
import type { ComfyHistory } from "../index.ts";

const h = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "history.sample.json"), "utf8"),
) as ComfyHistory;
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizeHistory skips failed runs; classifies image vs video; local source", () => {
  const recs = normalizeHistory(h);
  assert.equal(recs.length, 2); // p3 (error) dropped
  assert.ok(recs.every((r) => r.provider === "comfyui" && r.source === "local"));
  const img = recs.find((r) => r.category === "image")!;
  assert.equal(img.quantity, 2);   // two images
  assert.equal(img.unit, "image");
  const vid = recs.find((r) => r.category === "video")!;
  assert.equal(vid.unit, "clip");
  assert.equal(vid.quantity, 1);
});

test("getUsage filters by range", async () => {
  const a = createComfyUIAdapter(createFixtureClient(h));
  assert.equal((await a.getUsage({ from: "2020-01-01", to: "2100-01-01" }, ctx)).length, 2);
  assert.equal((await a.getUsage({ from: "2020-01-01", to: "2020-01-02" }, ctx)).length, 0);
});
