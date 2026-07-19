import assert from "node:assert/strict";
import { test } from "node:test";
import {
  reconcileIdentityToolStatements,
  type ToolStatementRow,
  type ToolStatementStore,
} from "../../../../supabase/functions/vibetracker-ingest/tool-statements.ts";

class MemoryStatementStore implements ToolStatementStore {
  readonly rows = new Map<string, Map<string, ToolStatementRow>>();
  writes = 0;

  seed(row: ToolStatementRow): void {
    const identity = this.rows.get(row.identity_id) ?? new Map<string, ToolStatementRow>();
    identity.set(row.tool_id, { ...row });
    this.rows.set(row.identity_id, identity);
  }

  async upsert(rows: ToolStatementRow[]): Promise<{ error?: string }> {
    this.writes += rows.length;
    for (const row of rows) this.seed(row);
    return {};
  }

  async listToolIds(identityId: string): Promise<{ toolIds: string[]; error?: string }> {
    return { toolIds: [...(this.rows.get(identityId)?.keys() ?? [])] };
  }

  async deleteAll(identityId: string): Promise<{ deleted: number; error?: string }> {
    const deleted = this.rows.get(identityId)?.size ?? 0;
    this.rows.delete(identityId);
    this.writes += deleted;
    return { deleted };
  }

  async deleteToolIds(identityId: string, toolIds: string[]): Promise<{ deleted: number; error?: string }> {
    const identity = this.rows.get(identityId);
    let deleted = 0;
    for (const toolId of toolIds) {
      if (identity?.delete(toolId)) deleted++;
    }
    this.writes += deleted;
    return { deleted };
  }
}

const row = (identityId: string, toolId: string, statement: string, updatedAt: string): ToolStatementRow => ({
  identity_id: identityId,
  tool_id: toolId,
  statement,
  updated_at: updatedAt,
});

test("anonymous toolStatements are ignored silently and write nothing", async () => {
  const store = new MemoryStatementStore();
  store.seed(row("client-identity", "codex", "existing", "2026-07-20T00:00:00.000Z"));
  const result = await reconcileIdentityToolStatements({
    payload: {
      identityId: "client-identity",
      identity_id: "client-identity",
      toolStatements: [{ toolId: "codex", statement: "attacker replacement" }],
    },
    serverIdentityId: undefined,
    store,
    now: "2026-07-20T01:00:00.000Z",
  });

  assert.equal(result.reconciled, false);
  assert.deepEqual(result.warnings, []);
  assert.equal(store.writes, 0);
  assert.equal(store.rows.get("client-identity")?.get("codex")?.statement, "existing");
});

test("upserts always use the server-resolved identity and ignore payload identity fields", async () => {
  const store = new MemoryStatementStore();
  await reconcileIdentityToolStatements({
    payload: {
      identityId: "client-identity",
      identity_id: "client-identity",
      toolStatements: [{ toolId: "codex", statement: "server owned" }],
    },
    serverIdentityId: "server-identity",
    store,
    now: "2026-07-20T01:00:00.000Z",
  });

  assert.equal(store.rows.has("client-identity"), false);
  assert.equal(store.rows.get("server-identity")?.get("codex")?.identity_id, "server-identity");
});

test("re-upsert refreshes updated_at and remove reconciliation deletes omitted server rows", async () => {
  const store = new MemoryStatementStore();
  await reconcileIdentityToolStatements({
    payload: { toolStatements: [
      { toolId: "claude", statement: "long context" },
      { toolId: "codex", statement: "coding" },
    ] },
    serverIdentityId: "server-identity",
    store,
    now: "2026-07-20T01:00:00.000Z",
  });
  const firstUpdatedAt = store.rows.get("server-identity")?.get("codex")?.updated_at;

  const removal = await reconcileIdentityToolStatements({
    payload: { toolStatements: [{ toolId: "codex", statement: "coding, refined" }] },
    serverIdentityId: "server-identity",
    store,
    now: "2026-07-20T02:00:00.000Z",
  });
  assert.equal(store.rows.get("server-identity")?.has("claude"), false);
  assert.equal(removal.deleted, 1);
  assert.notEqual(store.rows.get("server-identity")?.get("codex")?.updated_at, firstUpdatedAt);
  assert.equal(store.rows.get("server-identity")?.get("codex")?.updated_at, "2026-07-20T02:00:00.000Z");

  const removeAll = await reconcileIdentityToolStatements({
    payload: { toolStatements: [] },
    serverIdentityId: "server-identity",
    store,
    now: "2026-07-20T03:00:00.000Z",
  });
  assert.equal(removeAll.deleted, 1);
  assert.equal(store.rows.has("server-identity"), false);
});

test("a bundle without toolStatements leaves existing identity rows untouched", async () => {
  const store = new MemoryStatementStore();
  store.seed(row("server-identity", "codex", "keep me", "2026-07-20T00:00:00.000Z"));
  const result = await reconcileIdentityToolStatements({
    payload: { identity_id: "client-identity" },
    serverIdentityId: "server-identity",
    store,
    now: "2026-07-20T04:00:00.000Z",
  });

  assert.equal(result.fieldPresent, false);
  assert.equal(store.writes, 0);
  assert.equal(store.rows.get("server-identity")?.get("codex")?.statement, "keep me");
});
