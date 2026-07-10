import { test } from "node:test";
import assert from "node:assert/strict";
import { amortizeSubscription } from "../amortize.ts";

test("amortizeSubscription spreads flat spend across inclusive days with account metadata", () => {
  const records = amortizeSubscription({
    provider: "canva",
    category: "image",
    usd: 30,
    from: "2026-07-01",
    to: "2026-07-03",
    accountId: "creator",
    profileId: "main",
    teamId: "content",
  });
  assert.equal(records.length, 3);
  assert.equal(records[0].usdEst, 10);
  assert.equal(records[2].ts, "2026-07-03T00:00:00.000Z");
  assert.equal(records[0].accountId, "creator");
  assert.equal(records[0].profileId, "main");
  assert.equal(records[0].teamId, "content");
});
