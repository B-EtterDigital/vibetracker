import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CLI_PACKAGE, CLI_RUNNER, cliCommand, cliSequence } from "../cli-command.ts";

const WEB_SOURCE_ROOT = "packages/web/src";

function productionWebFiles(root = WEB_SOURCE_ROOT): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "__tests__") return [];
    const path = join(root, entry.name);
    if (entry.isDirectory()) return productionWebFiles(path);
    return /\.(?:json|ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });
}

test("web commands always invoke the published npm package", () => {
  assert.equal(CLI_PACKAGE, "vibetrack");
  assert.equal(CLI_RUNNER, "npx vibetrack");
  assert.equal(cliCommand(" login "), "npx vibetrack login");
  assert.equal(
    cliSequence(["sync --receipt", "audit"]),
    "npx vibetrack sync --receipt -> npx vibetrack audit",
  );
  assert.equal(
    cliSequence(["detect", "providers --all"], " && "),
    "npx vibetrack detect && npx vibetrack providers --all",
  );
});

test("every production web command invokes a published CLI command", () => {
  const files = productionWebFiles();
  const publishedCommands = new Set([
    "adapter", "add", "api", "audit", "badge", "browser-extension", "bundle",
    "cockpit", "commands", "compare", "connect", "demo", "desktop", "detect",
    "disconnect", "doctor", "export", "fixture", "gui", "health", "impress",
    "import", "init", "insights", "keys", "kit", "launch-kit", "ledger", "life",
    "live", "login", "logout", "mission", "now", "oauth", "plugins", "poster",
    "privacy", "profile", "providers", "proxy", "pulse", "receipts", "release",
    "roadmap", "showcase", "stats", "status", "studio", "subscription", "surprises",
    "sync", "telemetry", "total", "tour", "trend", "trust", "upload", "vibe", "watch",
    "wizard-gui", "wow",
  ]);
  const legacyRunner = /npx vibetracker|["'`]vibetracker\s|\$ vibetracker\s|&& vibetracker\s|-> vibetracker\s/;
  const illustrativeOnly = /npx vibetrack (?:capability|contributors|motion|proof|scan|score|sources|verify\b|detect --local|insights --(?:budget|compare|sort)|ledger add|life --|login --refresh|profile @|sync --(?:creator-tools|dry-run|provider|providers|regional|verified)|trust (?:add github|github|higgsfield|scan|sync)|upload --(?:profile|reviewed|target))/;
  let commandCount = 0;

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, legacyRunner, file);
    assert.doesNotMatch(source, illustrativeOnly, file);
    for (const match of source.matchAll(/npx vibetrack\s+([a-z][a-z0-9-]*)/g)) {
      commandCount += 1;
      assert.ok(publishedCommands.has(match[1]), `${file}: unknown CLI command ${match[1]}`);
    }
  }

  assert.ok(files.length > 100, `expected the complete web tree, got ${files.length} files`);
  assert.ok(commandCount > 100, `expected broad command coverage, got ${commandCount}`);
});
