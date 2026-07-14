import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProviderDescriptor } from "../../../../../adapters/src/registry.ts";
import {
  buildProviderDirectoryData,
  filterProviderRows,
  pageProviderRows,
  statusKeyOf,
} from "../directory-data.ts";

const providers: ProviderDescriptor[] = [
  { id: "codex", label: "Codex", domain: "ai", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "built", verified: true, method: "local session logs" },
  { id: "openai", label: "OpenAI", domain: "ai", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Costs API" },
  { id: "ollama", label: "Ollama", domain: "ai", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "local proxy" },
  { id: "midjourney", label: "Midjourney", domain: "creative", categories: ["image"], tier: "manual", auth: "none", status: "manual-only", verified: false, method: "manual subscription" },
  { id: "netlify", label: "Netlify", domain: "dev", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing API" },
];

test("provider status precedence and ready count stay honest", () => {
  assert.deepEqual(providers.map(statusKeyOf), ["verified", "built", "proxy", "manual", "planned"]);
  const directory = buildProviderDirectoryData(providers);
  assert.equal(directory.readyCount, 4);
  assert.deepEqual(directory.statusCounts, { verified: 1, built: 1, proxy: 1, manual: 1, planned: 1 });
});

test("provider search covers IDs, methods, auth, domain, category, and status aliases", () => {
  const { rows } = buildProviderDirectoryData(providers);
  const search = (query: string) => filterProviderRows(rows, { query, status: "all", category: "all", domain: "all" }).map((row) => row.provider.id);

  assert.deepEqual(search("codex"), ["codex"]);
  assert.deepEqual(search("costs api"), ["openai"]);
  assert.deepEqual(search("localLogs coding"), ["codex"]);
  assert.deepEqual(search("creative manual"), ["midjourney"]);
  assert.deepEqual(search("planned billing"), ["netlify"]);
});

test("compound facets use AND semantics and exact matches rank first", () => {
  const { rows } = buildProviderDirectoryData(providers);
  const readyImage = filterProviderRows(rows, { query: "", status: "ready", category: "image", domain: "ai" });
  assert.deepEqual(readyImage.map((row) => row.provider.id), ["openai"]);

  const exact = filterProviderRows(rows, { query: "openai", status: "all", category: "all", domain: "all" });
  assert.equal(exact[0]?.provider.id, "openai");
});

test("pagination clamps invalid pages and never renders an unbounded registry", () => {
  const { rows } = buildProviderDirectoryData(providers);
  const first = pageProviderRows(rows, -3, 2);
  const last = pageProviderRows(rows, 99, 2);

  assert.equal(first.page, 1);
  assert.equal(first.rows.length, 2);
  assert.equal(last.page, 3);
  assert.equal(last.rows.length, 1);
  assert.equal(last.end, 5);
});
