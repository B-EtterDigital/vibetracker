export const MAX_TOOL_STATEMENTS = 32;
export const MAX_TOOL_ID_LENGTH = 64;
export const MAX_TOOL_STATEMENT_LENGTH = 280;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f\u0080-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]+/g;

export interface ToolStatement {
  toolId: string;
  statement: string;
}

export interface ToolStatementRow {
  identity_id: string;
  tool_id: string;
  statement: string;
  updated_at: string;
}

export interface ToolStatementStore {
  upsert(rows: ToolStatementRow[]): Promise<{ error?: string }>;
  listToolIds(identityId: string): Promise<{ toolIds: string[]; error?: string }>;
  deleteAll(identityId: string): Promise<{ deleted: number; error?: string }>;
  deleteToolIds(identityId: string, toolIds: string[]): Promise<{ deleted: number; error?: string }>;
}

export interface ToolStatementReconciliation {
  fieldPresent: boolean;
  reconciled: boolean;
  persisted: number;
  deleted: number;
  warnings: string[];
}

export function stripEdgeControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeEdgeToolStatements(input: unknown): { statements: ToolStatement[]; warnings: string[] } {
  if (!Array.isArray(input)) {
    return { statements: [], warnings: ["toolStatements skipped: expected an array"] };
  }

  const warnings: string[] = [];
  if (input.length > MAX_TOOL_STATEMENTS) {
    warnings.push(`toolStatements capped at ${MAX_TOOL_STATEMENTS}; ${input.length - MAX_TOOL_STATEMENTS} entr${input.length - MAX_TOOL_STATEMENTS === 1 ? "y was" : "ies were"} skipped`);
  }

  const byToolId = new Map<string, ToolStatement>();
  for (const [index, entry] of input.slice(0, MAX_TOOL_STATEMENTS).entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      warnings.push(`toolStatements[${index}] skipped: expected an object`);
      continue;
    }
    const raw = entry as { toolId?: unknown; statement?: unknown };
    if (typeof raw.toolId !== "string" || typeof raw.statement !== "string") {
      warnings.push(`toolStatements[${index}] skipped: toolId and statement must be strings`);
      continue;
    }
    const toolId = stripEdgeControlCharacters(raw.toolId);
    const statement = stripEdgeControlCharacters(raw.statement);
    if (!toolId || toolId.length > MAX_TOOL_ID_LENGTH) {
      warnings.push(`toolStatements[${index}] skipped: toolId must be 1-${MAX_TOOL_ID_LENGTH} characters`);
      continue;
    }
    if (!statement || statement.length > MAX_TOOL_STATEMENT_LENGTH) {
      warnings.push(`toolStatements[${index}] skipped: statement must be 1-${MAX_TOOL_STATEMENT_LENGTH} characters`);
      continue;
    }
    if (byToolId.has(toolId)) warnings.push(`toolStatements[${index}]: duplicate toolId replaced its earlier value`);
    byToolId.set(toolId, { toolId, statement });
  }

  return {
    statements: [...byToolId.values()].sort((a, b) => a.toolId.localeCompare(b.toolId)),
    warnings,
  };
}

export async function reconcileIdentityToolStatements(input: {
  payload: unknown;
  serverIdentityId?: string;
  store: ToolStatementStore;
  now: string;
}): Promise<ToolStatementReconciliation> {
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
    ? input.payload as Record<string, unknown>
    : undefined;
  const fieldPresent = Boolean(payload && Object.prototype.hasOwnProperty.call(payload, "toolStatements") && payload.toolStatements !== undefined);
  const ignored = { fieldPresent, reconciled: false, persisted: 0, deleted: 0, warnings: [] as string[] };

  // Anonymous payloads are ignored silently, including any client-supplied identity fields.
  if (!input.serverIdentityId || !fieldPresent) return ignored;

  const rawStatements = payload!.toolStatements;
  const sanitized = sanitizeEdgeToolStatements(rawStatements);
  if (!Array.isArray(rawStatements)) return { ...ignored, warnings: sanitized.warnings };

  const rows = sanitized.statements.map(({ toolId, statement }) => ({
    identity_id: input.serverIdentityId!,
    tool_id: toolId,
    statement,
    updated_at: input.now,
  }));
  if (rows.length) {
    const upsert = await input.store.upsert(rows);
    if (upsert.error) {
      return { fieldPresent, reconciled: false, persisted: 0, deleted: 0, warnings: [...sanitized.warnings, `tool statements: ${upsert.error}`] };
    }
  }

  if (!rows.length) {
    const deletion = await input.store.deleteAll(input.serverIdentityId);
    return {
      fieldPresent,
      reconciled: !deletion.error,
      persisted: 0,
      deleted: deletion.error ? 0 : deletion.deleted,
      warnings: deletion.error ? [...sanitized.warnings, `tool statements: ${deletion.error}`] : sanitized.warnings,
    };
  }

  const listed = await input.store.listToolIds(input.serverIdentityId);
  if (listed.error) {
    return {
      fieldPresent,
      reconciled: false,
      persisted: rows.length,
      deleted: 0,
      warnings: [...sanitized.warnings, `tool statements: ${listed.error}`],
    };
  }
  const keep = new Set(rows.map((row) => row.tool_id));
  const stale = listed.toolIds.filter((toolId) => !keep.has(toolId));
  if (!stale.length) {
    return { fieldPresent, reconciled: true, persisted: rows.length, deleted: 0, warnings: sanitized.warnings };
  }

  const deletion = await input.store.deleteToolIds(input.serverIdentityId, stale);
  return {
    fieldPresent,
    reconciled: !deletion.error,
    persisted: rows.length,
    deleted: deletion.error ? 0 : deletion.deleted,
    warnings: deletion.error ? [...sanitized.warnings, `tool statements: ${deletion.error}`] : sanitized.warnings,
  };
}
