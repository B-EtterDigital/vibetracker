import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const MAX_TOOL_STATEMENTS = 32;
export const MAX_TOOL_ID_LENGTH = 64;
export const MAX_TOOL_STATEMENT_LENGTH = 280;

export interface ToolStatement {
  toolId: string;
  statement: string;
}

export interface SanitizedToolStatements {
  statements: ToolStatement[];
  warnings: string[];
}

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f\u0080-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]+/g;

export type CorruptStatementHandler = (error: unknown, backupPath: string) => void;

export interface AtomicStatementWriteOptions {
  beforeRename?: (tempPath: string, destinationPath: string) => void;
}

export function toolStatementsPath(home = homedir()): string {
  return join(home, ".vibetracker", "statements.json");
}

function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim();
}

export function createToolStatement(toolIdInput: string, statementInput: string): ToolStatement {
  const rawToolId = toolIdInput.trim();
  const rawStatement = statementInput.trim();
  if (!rawToolId) throw new Error("toolId cannot be empty");
  if (rawToolId.length > MAX_TOOL_ID_LENGTH) {
    throw new Error(`toolId must be at most ${MAX_TOOL_ID_LENGTH} characters`);
  }
  if (!rawStatement) throw new Error("statement cannot be empty");
  if (rawStatement.length > MAX_TOOL_STATEMENT_LENGTH) {
    throw new Error(`statement must be at most ${MAX_TOOL_STATEMENT_LENGTH} characters`);
  }

  const toolId = stripControlCharacters(rawToolId);
  const statement = stripControlCharacters(rawStatement);
  if (!toolId) throw new Error("toolId cannot be empty after removing control characters");
  if (!statement) throw new Error("statement cannot be empty after removing control characters");
  return { toolId, statement };
}

/** Pure edge-compatible validation used by the ingest function after identity attestation. */
export function sanitizeToolStatementEntries(input: unknown): SanitizedToolStatements {
  if (input === undefined) return { statements: [], warnings: [] };
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
    const toolId = stripControlCharacters(raw.toolId);
    const statement = stripControlCharacters(raw.statement);
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

export function loadToolStatements(path = toolStatementsPath()): ToolStatement[] {
  if (!existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  const sanitized = sanitizeToolStatementEntries(parsed);
  if (!Array.isArray(parsed) || sanitized.warnings.length) {
    throw new Error(`invalid tool statements at ${path}: ${sanitized.warnings.join("; ") || "expected an array"}`);
  }
  return sanitized.statements;
}

export function saveToolStatements(
  statements: ToolStatement[],
  path = toolStatementsPath(),
  options: AtomicStatementWriteOptions = {},
): void {
  const sanitized = sanitizeToolStatementEntries(statements);
  if (sanitized.warnings.length) throw new Error(`cannot save tool statements: ${sanitized.warnings.join("; ")}`);
  mkdirSync(dirname(path), { recursive: true });
  const payload = JSON.stringify(sanitized.statements, null, 2);
  const tempPath = `${path}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(tempPath, "wx", 0o600);
    writeFileSync(descriptor, payload, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    options.beforeRename?.(tempPath, path);
    renameSync(tempPath, path);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

function loadToolStatementsForMutation(path: string, onCorrupt?: CorruptStatementHandler): ToolStatement[] {
  try {
    return loadToolStatements(path);
  } catch (error) {
    const backupPath = `${path}.corrupt`;
    rmSync(backupPath, { force: true });
    renameSync(path, backupPath);
    saveToolStatements([], path);
    onCorrupt?.(error, backupPath);
    return [];
  }
}

export function setToolStatement(
  toolId: string,
  statement: string,
  path = toolStatementsPath(),
  onCorrupt?: CorruptStatementHandler,
): ToolStatement[] {
  const next = createToolStatement(toolId, statement);
  const statements = loadToolStatementsForMutation(path, onCorrupt);
  const existing = statements.findIndex((entry) => entry.toolId === next.toolId);
  if (existing >= 0) statements[existing] = next;
  else {
    if (statements.length >= MAX_TOOL_STATEMENTS) {
      throw new Error(`at most ${MAX_TOOL_STATEMENTS} tool statements can be stored`);
    }
    statements.push(next);
  }
  saveToolStatements(statements, path);
  return loadToolStatements(path);
}

export function removeToolStatement(
  toolIdInput: string,
  path = toolStatementsPath(),
  onCorrupt?: CorruptStatementHandler,
): boolean {
  const toolId = toolIdInput.trim();
  if (!toolId) throw new Error("toolId cannot be empty");
  if (toolId.length > MAX_TOOL_ID_LENGTH) throw new Error(`toolId must be at most ${MAX_TOOL_ID_LENGTH} characters`);
  const statements = loadToolStatementsForMutation(path, onCorrupt);
  const remaining = statements.filter((entry) => entry.toolId !== toolId);
  if (remaining.length === statements.length) {
    if (!existsSync(path)) saveToolStatements([], path);
    return false;
  }
  saveToolStatements(remaining, path);
  return true;
}

export function renderToolStatements(statements: ToolStatement[]): string {
  if (!statements.length) return "No tool statements saved.";
  return statements.map(({ toolId, statement }) => `${toolId}: ${statement}`).join("\n");
}

export function toolStatementsForUpload(
  attested: boolean,
  statementsFileExists: boolean,
  statements: ToolStatement[],
): { toolStatements?: ToolStatement[] } {
  if (!attested || !statementsFileExists) return {};
  const sanitized = sanitizeToolStatementEntries(statements);
  if (sanitized.warnings.length) throw new Error(`invalid stored tool statements: ${sanitized.warnings.join("; ")}`);
  return { toolStatements: sanitized.statements };
}
