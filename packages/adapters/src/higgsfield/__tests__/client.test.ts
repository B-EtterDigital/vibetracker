import { test } from "node:test";
import assert from "node:assert/strict";
import { createCliClient } from "../client.ts";

test("CLI client reads account status and transaction arrays", async () => {
  const calls: string[][] = [];
  const client = createCliClient({
    run: async (args) => {
      calls.push(args);
      if (args.join(" ") === "account status --json") {
        return JSON.stringify({ credits: 5848.5, subscription_plan_type: "ultra", email: "hidden@example.com" });
      }
      if (args.join(" ") === "account transactions --size 2 --json") {
        return JSON.stringify([
          { display_name: "Nano Banana Pro", credits: -7, action: "spend", created_at: "2026-06-29T10:00:00Z" },
          { display_name: "Seedance 1.0 Pro", credits: -45, action: "deduct", created_at: "2026-06-29T10:01:00Z" },
        ]);
      }
      if (args.join(" ") === "account transactions --size 2 --json --cursor 2") {
        return JSON.stringify([]);
      }
      throw new Error(`unexpected call: ${args.join(" ")}`);
    },
  });

  const balance = await client.balance();
  assert.equal(balance.credits, 5848.5);
  assert.equal(balance.subscription_plan_type, "ultra");

  const first = await client.transactions({ size: 2 });
  assert.equal(first.items.length, 2);
  assert.equal(first.next_cursor, 2);

  const second = await client.transactions({ cursor: first.next_cursor ?? undefined, size: 2 });
  assert.equal(second.items.length, 0);
  assert.equal(second.next_cursor, null);
  assert.deepEqual(calls, [
    ["account", "status", "--json"],
    ["account", "transactions", "--size", "2", "--json"],
    ["account", "transactions", "--size", "2", "--json", "--cursor", "2"],
  ]);
});

test("CLI client accepts enveloped transaction pages with explicit next cursor", async () => {
  const client = createCliClient({
    run: async () => JSON.stringify({
      items: [
        { displayName: "Voice Dubbing", credits: "-3", action: "spend", createdAt: "2026-07-01T00:00:00Z" },
      ],
      nextCursor: 99,
    }),
  });

  const page = await client.transactions({ size: 100 });
  assert.equal(page.items[0]?.display_name, "Voice Dubbing");
  assert.equal(page.items[0]?.credits, -3);
  assert.equal(page.items[0]?.created_at, "2026-07-01T00:00:00Z");
  assert.equal(page.next_cursor, 99);
});
