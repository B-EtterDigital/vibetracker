import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { writeRecords } from "../../../core/src/store/jsonl.ts";
import {
  createToolStatement,
  loadToolStatements,
  MAX_TOOL_STATEMENT_LENGTH,
  removeToolStatement,
  saveToolStatements,
  sanitizeToolStatementEntries,
  setToolStatement,
  toolStatementsForUpload,
} from "../statements.ts";
import { sanitizeEdgeToolStatements } from "../../../../supabase/functions/vibetracker-ingest/tool-statements.ts";

function runCli(home: string, args: string[]) {
  const emptyPath = join(home, "empty-path");
  mkdirSync(emptyPath, { recursive: true });
  return spawnSync(process.execPath, [join(process.cwd(), "bin", "vibetracker.mjs"), ...args], {
    cwd: home,
    encoding: "utf8",
    timeout: 20_000,
    env: {
      ...process.env,
      HOME: home,
      PATH: emptyPath,
      VT_NO_ANIM: "1",
      VT_NO_SURPRISES: "1",
      NO_COLOR: "1",
    },
  });
}

test("statement persistence adds, lists, updates, and removes deterministic entries", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-unit-"));
  const path = join(home, "statements.json");
  try {
    setToolStatement("codex", "My daily coding copilot.", path);
    setToolStatement("claude", "Great for long context.", path);
    setToolStatement("codex", "My primary coding copilot.", path);
    assert.deepEqual(loadToolStatements(path), [
      { toolId: "claude", statement: "Great for long context." },
      { toolId: "codex", statement: "My primary coding copilot." },
    ]);
    assert.equal(removeToolStatement("codex", path), true);
    assert.equal(removeToolStatement("missing", path), false);
    assert.deepEqual(loadToolStatements(path), [
      { toolId: "claude", statement: "Great for long context." },
    ]);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("statement validation rejects empty and over-280-character text after trim", () => {
  assert.throws(() => createToolStatement("codex", "   "), /cannot be empty/);
  assert.throws(
    () => createToolStatement("codex", `  ${"x".repeat(MAX_TOOL_STATEMENT_LENGTH + 1)}  `),
    /at most 280 characters/,
  );
  assert.equal(createToolStatement("codex", `  ${"x".repeat(MAX_TOOL_STATEMENT_LENGTH)}  `).statement.length, 280);
});

test("CLI and edge sanitizers strip bidi overrides and invisible direction controls", () => {
  assert.deepEqual(createToolStatement("co\u202edex", "safe\u2066 statement"), {
    toolId: "co dex",
    statement: "safe statement",
  });
  assert.deepEqual(sanitizeEdgeToolStatements([{ toolId: "co\u202edex", statement: "safe\u2066 statement" }]).statements, [{
    toolId: "co dex",
    statement: "safe statement",
  }]);
});

test("statement saves atomically and preserve the live file when rename is interrupted", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-atomic-"));
  const path = join(home, "statements.json");
  try {
    saveToolStatements([{ toolId: "codex", statement: "original" }], path);
    assert.throws(() => saveToolStatements([{ toolId: "codex", statement: "replacement" }], path, {
      beforeRename() { throw new Error("injected rename interruption"); },
    }), /injected rename interruption/);
    assert.deepEqual(loadToolStatements(path), [{ toolId: "codex", statement: "original" }]);
    assert.equal(readdirSync(home).some((name) => name.endsWith(".tmp")), false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("statement CLI supports add, list, remove, and length validation", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-cli-"));
  try {
    const add = runCli(home, ["statement", "codex", "Fast, precise coding partner."]);
    assert.equal(add.status, 0, add.stderr);
    assert.match(add.stdout, /statement saved for codex/);

    const list = runCli(home, ["statement", "--list"]);
    assert.equal(list.status, 0, list.stderr);
    assert.match(list.stdout, /codex: Fast, precise coding partner\./);

    const tooLong = runCli(home, ["statement", "codex", "x".repeat(281)]);
    assert.equal(tooLong.status, 1);
    assert.match(tooLong.stderr, /statement must be at most 280 characters/);

    const remove = runCli(home, ["statement", "--remove", "codex"]);
    assert.equal(remove.status, 0, remove.stderr);
    assert.match(remove.stdout, /removed statement for codex/);
    assert.match(runCli(home, ["statement", "--list"]).stdout, /No tool statements saved\./);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("corrupt statement files never abort subcommands and mutations preserve forensic bytes", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-corrupt-cli-"));
  const storeDir = join(home, ".vibetracker");
  const path = join(storeDir, "statements.json");
  try {
    mkdirSync(storeDir, { recursive: true });
    writeFileSync(path, "{broken-json");
    const list = runCli(home, ["statement", "--list"]);
    assert.equal(list.status, 0, list.stderr);
    assert.match(list.stdout, /No tool statements saved\./);
    assert.match(list.stderr, /warning: tool statements could not be read/);
    assert.match(list.stderr, /\[VTRS:warn\] cli\.statements/);

    const add = runCli(home, ["statement", "codex", "Recovered safely."]);
    assert.equal(add.status, 0, add.stderr);
    assert.equal(readFileSync(`${path}.corrupt`, "utf8"), "{broken-json");
    assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), [{ toolId: "codex", statement: "Recovered safely." }]);
    assert.match(add.stderr, /corrupt file preserved/);

    writeFileSync(path, "not-json-again");
    const remove = runCli(home, ["statement", "--remove", "codex"]);
    assert.equal(remove.status, 0, remove.stderr);
    assert.equal(readFileSync(`${path}.corrupt`, "utf8"), "not-json-again");
    assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), []);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("upload bundle helper includes statements only for attested uploads", () => {
  const statements = [{ toolId: "codex", statement: "My daily coding copilot." }];
  assert.deepEqual(toolStatementsForUpload(false, true, statements), {});
  assert.deepEqual(toolStatementsForUpload(true, false, []), {});
  assert.deepEqual(toolStatementsForUpload(true, true, statements), { toolStatements: statements });
  assert.deepEqual(toolStatementsForUpload(true, true, []), { toolStatements: [] });
});

test("CLI upload bundles persist statements only while an attested token is present", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-upload-"));
  const storeDir = join(home, ".vibetracker");
  try {
    mkdirSync(storeDir, { recursive: true });
    writeRecords(join(storeDir, "records.jsonl"), [{
      ts: "2026-07-20T00:00:00.000Z",
      provider: "codex",
      category: "coding",
      operation: "session",
      quantity: 1,
      unit: "operation",
      source: "local",
      confidence: "high",
      verified: false,
    }]);
    writeFileSync(join(storeDir, "statements.json"), JSON.stringify([
      { toolId: "codex", statement: "My daily coding copilot." },
    ]));
    writeFileSync(join(storeDir, "config.json"), JSON.stringify({ enabled: [], token: "test-attested-token" }));

    const attested = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(attested.status, 0, attested.stderr);
    const attestedBundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.deepEqual(attestedBundle.toolStatements, [
      { toolId: "codex", statement: "My daily coding copilot." },
    ]);

    const removal = runCli(home, ["statement", "--remove", "codex"]);
    assert.equal(removal.status, 0, removal.stderr);
    const retraction = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(retraction.status, 0, retraction.stderr);
    const retractionBundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.deepEqual(retractionBundle.toolStatements, []);

    writeFileSync(join(storeDir, "config.json"), JSON.stringify({ enabled: [] }));
    const anonymous = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(anonymous.status, 0, anonymous.stderr);
    const anonymousBundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.equal("toolStatements" in anonymousBundle, false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("a never-authored attested user sends no toolStatements field", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-never-authored-"));
  const storeDir = join(home, ".vibetracker");
  try {
    mkdirSync(storeDir, { recursive: true });
    writeRecords(join(storeDir, "records.jsonl"), [{
      ts: "2026-07-20T00:00:00.000Z", provider: "codex", category: "coding", operation: "session",
      quantity: 1, unit: "operation", source: "local", confidence: "high", verified: false,
    }]);
    writeFileSync(join(storeDir, "config.json"), JSON.stringify({ enabled: [], token: "test-attested-token" }));

    const result = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(result.status, 0, result.stderr);
    const bundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.equal("toolStatements" in bundle, false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("corrupt statement uploads warn through VTRS and degrade to an empty authored list", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-statements-corrupt-upload-"));
  const storeDir = join(home, ".vibetracker");
  try {
    mkdirSync(storeDir, { recursive: true });
    writeRecords(join(storeDir, "records.jsonl"), [{
      ts: "2026-07-20T00:00:00.000Z", provider: "codex", category: "coding", operation: "session",
      quantity: 1, unit: "operation", source: "local", confidence: "high", verified: false,
    }]);
    writeFileSync(join(storeDir, "config.json"), JSON.stringify({ enabled: [], token: "test-attested-token" }));
    writeFileSync(join(storeDir, "statements.json"), "{broken-json");

    const result = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /warning: tool statements could not be read/);
    assert.match(result.stderr, /\[VTRS:warn\] cli\.statements/);
    const bundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.deepEqual(bundle.toolStatements, []);
    assert.equal(existsSync(join(storeDir, "statements.json.corrupt")), false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("CLI statement validation strips controls, caps input, and skips malformed entries with warnings", () => {
  const valid = sanitizeToolStatementEntries([
    { toolId: "codex\u0000 cli", statement: "hello\nworld" },
    { toolId: "codex cli", statement: "last value wins" },
    { toolId: "bad", statement: "x".repeat(281) },
    null,
  ]);
  assert.deepEqual(valid.statements, [{ toolId: "codex cli", statement: "last value wins" }]);
  assert.equal(valid.warnings.length, 3);
  assert.match(valid.warnings.join("\n"), /duplicate toolId/);
  assert.match(valid.warnings.join("\n"), /statement must be 1-280 characters/);
  assert.match(valid.warnings.join("\n"), /expected an object/);

  const capped = sanitizeToolStatementEntries(Array.from({ length: 33 }, (_, index) => ({
    toolId: `tool-${index}`,
    statement: `statement ${index}`,
  })));
  assert.equal(capped.statements.length, 32);
  assert.match(capped.warnings.join("\n"), /capped at 32/);
  assert.match(sanitizeToolStatementEntries({}).warnings[0], /expected an array/);
});
