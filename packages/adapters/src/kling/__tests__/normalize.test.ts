import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeTasks } from "../normalize.ts";
import { createKlingAdapter, createFixtureClient } from "../index.ts";
import type { KlingTaskPage } from "../index.ts";

const page = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "tasks.sample.json"), "utf8"),
) as KlingTaskPage;
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizeTasks skips failed tasks and counts by default", () => {
  const recs = normalizeTasks(page.data);
  assert.equal(recs.length, 2); // failed task dropped
  assert.ok(recs.every((r) => r.category === "video" && r.source === "feed_recon"));
  assert.ok(recs.every((r) => r.unit === "request" && r.rawAmount === 1));
});

test("per-model credit map upgrades records to reconstructed credit spend", () => {
  const recs = normalizeTasks(page.data, { creditsByModel: { "kling-v2": 100, "kling-v1-5": 35 }, creditUsd: 0.01 });
  const v2 = recs.find((r) => r.model === "kling-v2")!;
  assert.equal(v2.unit, "credit");
  assert.equal(v2.rawAmount, 100);
  assert.equal(v2.usdEst, 1);
});

test("adapter.getUsage returns tasks within range", async () => {
  const adapter = createKlingAdapter(createFixtureClient(page));
  const recs = await adapter.getUsage({ from: "2020-01-01", to: "2100-01-01" }, ctx);
  assert.equal(recs.length, 2);
});
