import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCliClient, createMcpClient } from "../client.ts";

// ── CLI transport ─────────────────────────────────────────────────────────────

test("createCliClient parses the transaction array, computes offset cursors, maps balance", async () => {
  const calls: string[][] = [];
  const client = createCliClient({
    run: async (args) => {
      calls.push(args);
      const joined = args.join(" ");
      if (joined === "account status --json") {
        // Real CLI shape: { email, credits, subscription_plan_type }
        return JSON.stringify({ email: "hidden@example.com", credits: 5001.66, subscription_plan_type: "ultra" });
      }
      if (joined === "account transactions --json --size 2 --cursor 0") {
        return JSON.stringify([
          { display_name: "Nano Banana Pro", credits: -2, action: "spend", created_at: "2026-07-11T16:20:49Z" },
          { display_name: "Seedance 1.0 Pro", credits: -45, action: "deduct", created_at: "2026-07-11T16:15:08Z" },
        ]);
      }
      if (joined === "account transactions --json --size 2 --cursor 2") {
        return JSON.stringify([
          { display_name: "Voice Dubbing", credits: -3, action: "spend", created_at: "2026-07-11T16:10:00Z" },
        ]);
      }
      throw new Error(`unexpected CLI call: ${joined}`);
    },
  });

  const balance = await client.balance();
  assert.equal(balance.credits, 5001.66);
  assert.equal(balance.subscription_plan_type, "ultra");

  const full = await client.transactions({ cursor: 0, size: 2 });
  assert.equal(full.items.length, 2);
  assert.equal(full.items[0]?.display_name, "Nano Banana Pro");
  assert.equal(full.next_cursor, 2); // full page -> cursor + size

  const short = await client.transactions({ cursor: full.next_cursor ?? undefined, size: 2 });
  assert.equal(short.items.length, 1);
  assert.equal(short.next_cursor, null); // short page -> null (ledger walked to the end)

  // Arg vector: `account transactions --json --size N --cursor C`, cursor always present.
  assert.deepEqual(calls, [
    ["account", "status", "--json"],
    ["account", "transactions", "--json", "--size", "2", "--cursor", "0"],
    ["account", "transactions", "--json", "--size", "2", "--cursor", "2"],
  ]);
});

test("createCliClient default page uses `account transactions --json --size 100 --cursor 0`", async () => {
  let seen: string[] = [];
  const client = createCliClient({ run: async (args) => { seen = args; return "[]"; } });
  const page = await client.transactions({});
  assert.deepEqual(seen, ["account", "transactions", "--json", "--size", "100", "--cursor", "0"]);
  assert.equal(page.items.length, 0);
  assert.equal(page.next_cursor, null); // empty page terminates pagination
});

test("createCliClient surfaces CLI failures instead of swallowing them", async () => {
  const client = createCliClient({ run: async () => { throw new Error("not logged in"); } });
  await assert.rejects(() => client.transactions({ cursor: 0, size: 100 }), /not logged in/);
  await assert.rejects(() => client.balance(), /not logged in/);
});

test("createCliClient fails loudly on an unrecognized transactions shape", async () => {
  const client = createCliClient({ run: async () => JSON.stringify({ unexpected: true }) });
  await assert.rejects(() => client.transactions({ cursor: 0, size: 100 }), /expected a transactions array/);
});

// ── MCP transport ─────────────────────────────────────────────────────────────

interface SeenCall { url: string; headers: Record<string, string>; body: Record<string, any>; }

function jsonRpc(id: unknown, result: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function sseRpc(id: unknown, result: unknown): Response {
  const frame = "event: message\ndata: " + JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n\n";
  return new Response(frame, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

const TX_ITEM = { display_name: "Nano Banana Pro", credits: -2, action: "spend", created_at: "2026-07-11T16:20:49Z" };

test("createMcpClient (application/json) extracts tx + balance, sends Bearer, echoes session id", async () => {
  const seen: SeenCall[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    seen.push({ url: String(_url), headers: (init?.headers ?? {}) as Record<string, string>, body });
    if (body.method === "initialize") {
      return jsonRpc(body.id, { protocolVersion: "2025-06-18", capabilities: {} }, { "Mcp-Session-Id": "sess-123" });
    }
    if (body.method === "notifications/initialized") return new Response("", { status: 202 });
    if (body.method === "tools/call" && body.params.name === "transactions") {
      // content[].text carries the same JSON array shape as the CLI.
      return jsonRpc(body.id, { content: [{ type: "text", text: JSON.stringify([TX_ITEM]) }] });
    }
    if (body.method === "tools/call" && body.params.name === "balance") {
      // structuredContent path.
      return jsonRpc(body.id, { structuredContent: { credits: 5001.66, subscription_plan_type: "ultra" } });
    }
    throw new Error(`unexpected MCP call: ${JSON.stringify(body)}`);
  };

  const client = createMcpClient({ accessToken: "tok-abc", fetchImpl });

  const page = await client.transactions({ cursor: 0, size: 100 });
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.display_name, "Nano Banana Pro");
  assert.equal(page.items[0]?.credits, -2);

  const bal = await client.balance();
  assert.equal(bal.credits, 5001.66);
  assert.equal(bal.subscription_plan_type, "ultra");

  // initialize handshake happened before the first tool call.
  assert.equal(seen[0]?.body.method, "initialize");
  assert.equal(seen[1]?.body.method, "notifications/initialized");

  const txCall = seen.find((s) => s.body.method === "tools/call" && s.body.params.name === "transactions");
  assert.ok(txCall);
  assert.equal(txCall.headers.Authorization, "Bearer tok-abc");
  assert.deepEqual(txCall.body.params.arguments, { cursor: 0, size: 100 });
  assert.equal(txCall.headers["Mcp-Session-Id"], "sess-123"); // captured from initialize, echoed onward
});

test("createMcpClient parses an SSE (text/event-stream) tool response", async () => {
  const sseItem = { display_name: "Kling 2.1 Master", credits: -20, action: "deduct", created_at: "2026-07-11T10:00:00Z" };
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === "initialize") return sseRpc(body.id, { protocolVersion: "2025-06-18", capabilities: {} });
    if (body.method === "notifications/initialized") return new Response("", { status: 202 });
    if (body.method === "tools/call" && body.params.name === "transactions") {
      return sseRpc(body.id, { content: [{ type: "text", text: JSON.stringify([sseItem]) }] });
    }
    throw new Error(`unexpected MCP call: ${JSON.stringify(body)}`);
  };

  const client = createMcpClient({ accessToken: "tok-sse", fetchImpl });
  const page = await client.transactions({ cursor: 0, size: 100 });
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.display_name, "Kling 2.1 Master");
  assert.equal(page.items[0]?.credits, -20);
  assert.equal(page.next_cursor, null); // 1 item < size 100
});

test("createMcpClient reads access_token from a credentials file and sends it as Bearer", async () => {
  const dir = mkdtempSync(join(tmpdir(), "vt-higgs-creds-"));
  const credPath = join(dir, "credentials.json");
  writeFileSync(credPath, JSON.stringify({ access_token: "file-tok", refresh_token: "r" }));
  let auth = "";
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    auth = ((init?.headers ?? {}) as Record<string, string>).Authorization;
    if (body.method === "initialize") return jsonRpc(body.id, {});
    if (body.method === "notifications/initialized") return new Response("", { status: 202 });
    return jsonRpc(body.id, { structuredContent: { credits: 10, subscription_plan_type: "plus" } });
  };
  try {
    const client = createMcpClient({ credentialsPath: credPath, fetchImpl });
    const bal = await client.balance();
    assert.equal(bal.credits, 10);
    assert.equal(bal.subscription_plan_type, "plus");
    assert.equal(auth, "Bearer file-tok");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("createMcpClient throws a clear error when no token is resolvable", async () => {
  const client = createMcpClient({
    credentialsPath: join(tmpdir(), `vt-higgs-missing-${Date.now()}.json`),
    fetchImpl: async () => { throw new Error("must not fetch without a token"); },
  });
  await assert.rejects(() => client.transactions({ cursor: 0, size: 100 }), /access token|credentials|access_token/i);
  await assert.rejects(() => client.balance(), /access token|credentials|access_token/i);
});

test("createMcpClient surfaces a JSON-RPC error instead of returning empty", async () => {
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === "initialize") return jsonRpc(body.id, {});
    if (body.method === "notifications/initialized") return new Response("", { status: 202 });
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32000, message: "unauthorized" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = createMcpClient({ accessToken: "t", fetchImpl });
  await assert.rejects(() => client.transactions({ cursor: 0, size: 100 }), /unauthorized/);
});

test("createMcpClient fails loudly when the tool result has no extractable payload", async () => {
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === "initialize") return jsonRpc(body.id, {});
    if (body.method === "notifications/initialized") return new Response("", { status: 202 });
    return jsonRpc(body.id, { content: [{ type: "image", data: "..." }] }); // no text/structuredContent
  };
  const client = createMcpClient({ accessToken: "t", fetchImpl });
  await assert.rejects(() => client.transactions({ cursor: 0, size: 100 }), /could not extract a JSON payload/);
});
