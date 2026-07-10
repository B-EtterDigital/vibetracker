import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("scripts/typecheck.mjs", "utf8");

test("typecheck gate runs package-local compilers and cannot pass by skipping TypeScript", () => {
  assert.match(source, /node_modules", "typescript", "bin", "tsc"/);
  assert.match(source, /spawnSync\(process\.execPath/);
  assert.match(source, /has tsconfig\.json but no package-local TypeScript compiler/);
  assert.doesNotMatch(source, /TypeScript not installed.*skipping tsc/);
  assert.doesNotMatch(source, /spawnSync\("npx"/);
});
