import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { entriesToRecords, createSessionLogAdapter } from "../session-log.ts";
import { parseAntigravity } from "../../antigravity/index.ts";
import { parseAugment } from "../../augment/index.ts";
import { parseRooCode } from "../../roo-code/index.ts";

const FIX = join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "sessions");
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("per-plugin parsers extract token usage from their line shapes", () => {
  const a = parseAntigravity('{"timestamp":"2026-06-01T10:00:00Z","model":"gemini-3","usage":{"input_tokens":100,"output_tokens":50}}')!;
  assert.equal(a.inputTokens, 100);
  assert.equal(a.model, "gemini-3");

  const g = parseAugment('{"time":"2026-06-01T10:00:00Z","model":"gpt-4o","usage":{"input":200,"output":80}}')!;
  assert.equal(g.outputTokens, 80);

  const r = parseRooCode('{"ts":1782950400000,"apiModelId":"claude-opus","tokensIn":300,"tokensOut":120,"cost":0.05}')!;
  assert.equal(r.inputTokens, 300);
  assert.equal(r.usd, 0.05);
  assert.ok(r.ts.startsWith("2026-"));

  assert.equal(parseAntigravity("not json"), null);
  assert.equal(parseAugment('{"model":"x"}'), null); // no usage
});

test("entriesToRecords sums tokens, drops empties, tags source=log", () => {
  const recs = entriesToRecords([
    { ts: "2026-06-01T10:00:00Z", model: "m", inputTokens: 100, outputTokens: 50, cacheTokens: 10 },
    { ts: "2026-06-01T11:00:00Z", model: "m", inputTokens: 0, outputTokens: 0 },
  ], "antigravity", "coding");
  assert.equal(recs.length, 1);
  assert.equal(recs[0].rawAmount, 160);
  assert.equal(recs[0].source, "log");
  assert.equal(recs[0].provider, "antigravity");
});

test("createSessionLogAdapter reads a log dir end-to-end", async () => {
  const adapter = createSessionLogAdapter({ id: "antigravity", dir: FIX, parse: parseAntigravity });
  const recs = await adapter.getUsage({ from: "2020-01-01", to: "2100-01-01" }, ctx);
  assert.equal(recs.length, 2);             // 2 usage lines; the user line skipped
  assert.equal(recs[0].rawAmount, 1500);
});
