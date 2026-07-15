import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { ProviderDescriptor } from "../../../../../adapters/src/registry.ts";
import {
  buildProviderDirectoryData,
  buildProviderCoverageBrief,
  featuredProviderConnections,
  featuredProviderRows,
  filterProviderRows,
  PAGE_SIZE,
  PAGE_SIZES,
  pageProviderRows,
  providerActionFor,
  statusKeyOf,
} from "../directory-data.ts";

const providers: ProviderDescriptor[] = [
  { id: "codex", label: "Codex", domain: "ai", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "built", verified: true, method: "local session logs" },
  { id: "openai", label: "OpenAI", domain: "ai", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Costs API" },
  { id: "ollama", label: "Ollama", domain: "ai", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "local proxy" },
  { id: "midjourney", label: "Midjourney", domain: "creative", categories: ["image"], tier: "manual", auth: "none", status: "manual-only", verified: false, method: "official /info lifetime-image import" },
  { id: "netlify", label: "Netlify", domain: "dev", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing API" },
];

test("provider status precedence and ready count stay honest", () => {
  assert.deepEqual(providers.map(statusKeyOf), ["verified", "built", "proxy", "manual", "planned"]);
  const directory = buildProviderDirectoryData(providers);
  assert.equal(directory.readyCount, 4);
  assert.deepEqual(directory.statusCounts, { verified: 1, built: 1, proxy: 1, manual: 1, planned: 1 });
});

test("coverage brief separates verified, caveated, and planned rails without inventing readiness", () => {
  const directory = buildProviderDirectoryData(providers);
  const brief = buildProviderCoverageBrief(directory);

  assert.equal(brief.verifiedCount, 1);
  assert.equal(brief.caveatedCount, 3);
  assert.equal(brief.plannedCount, 1);
  assert.equal(brief.vectorLabel, "V 1 // C 3 // P 1");
  assert.equal(brief.coverageLabel, "80% usable");
  assert.equal(brief.recommendedStatus, "verified");
  assert.match(brief.headline, /endpoint-verified rail/);
  assert.match(brief.decisiveLabel, /25% of usable paths/);
  assert.match(brief.summary, /approximate adapters, local proxies, or explicit manual entries/);
});

test("coverage brief fails closed when nothing is usable or mapped", () => {
  const plannedOnly = buildProviderCoverageBrief(buildProviderDirectoryData([providers[4]!]));
  const empty = buildProviderCoverageBrief(buildProviderDirectoryData([]));

  assert.equal(plannedOnly.recommendedStatus, "planned");
  assert.equal(plannedOnly.coverageLabel, "0% usable");
  assert.match(plannedOnly.headline, /still need a usable collection path/);
  assert.equal(empty.vectorLabel, "V 0 // C 0 // P 0");
  assert.match(empty.headline, /No provider coverage is mapped/);
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

test("creator quick targets preserve product order and expose the real Midjourney import", () => {
  const directory = buildProviderDirectoryData([
    ...providers,
    { id: "leonardo", label: "Leonardo.ai", domain: "ai", categories: ["image"], tier: "feed_recon", auth: "apiKey", status: "built", verified: false, method: "generation feed" },
    { id: "cynaps3", label: "Cynaps3 Musicmation", domain: "ai", categories: ["music"], tier: "ledger", auth: "oauth", status: "built", verified: false, method: "usage ledger" },
  ]);

  assert.deepEqual(featuredProviderRows(directory.rows).map((row) => row.provider.id), ["midjourney", "leonardo", "cynaps3"]);
  const connections = featuredProviderConnections(directory.rows);
  assert.deepEqual(
    connections.map(({ row, protocol }) => [row.provider.id, protocol]),
    [["midjourney", "OFFICIAL /INFO"], ["leonardo", "PRODUCTION API"], ["cynaps3", "PKCE OAUTH"]],
  );
  assert.deepEqual(
    connections.map(({ row, signal, boundary }) => [row.provider.id, signal, boundary]),
    [
      ["midjourney", "lifetime image total", "official /info · no cookie"],
      ["leonardo", "completed image generations", "production feed · API-token wallet"],
      ["cynaps3", "music operations ledger", "read-only OAuth · upstream spend deduped"],
    ],
  );
  assert.deepEqual(providerActionFor(providers[3]!, "manual"), {
    kind: "copy",
    label: "import /info total",
    command: "npx vibetrack import midjourney --images <lifetime-images>",
  });
  assert.deepEqual(providerActionFor(directory.rows.find((row) => row.provider.id === "leonardo")!.provider, "built"), {
    kind: "copy",
    label: "connect leonardo",
    command: "npx vibetrack connect leonardo",
  });
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

test("the default result density stays bounded with deliberate larger options", () => {
  assert.equal(PAGE_SIZE, 12);
  assert.deepEqual(PAGE_SIZES, [12, 24, 48]);

  const manyRows = Array.from({ length: 60 }, (_, index) => ({
    ...buildProviderDirectoryData(providers).rows[index % providers.length]!,
    id: `provider-${index}`,
  }));
  assert.equal(pageProviderRows(manyRows, 1).rows.length, 12);
  assert.equal(pageProviderRows(manyRows, 1, 48).rows.length, 48);
});

test("provider route leads with discovery and keeps the coverage brief as honest filter controls", () => {
  const directory = readFileSync("packages/web/src/app/providers/directory.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/providers/directory.css", "utf8");

  const connectionBay = readFileSync("packages/web/src/app/providers/featured-connections.tsx", "utf8");
  const routeStyles = readFileSync("packages/web/src/app/providers/providers.css", "utf8");
  assert.match(connectionBay, /CREATOR CONNECTION BAY/);
  assert.match(connectionBay, /reviewed local lanes/);
  assert.match(connectionBay, /providers-directory__quick-proof/);
  assert.match(connectionBay, /Copy \$\{provider\.label\} command/);
  assert.match(directory, /COVERAGE READOUT \/ WHY LABELS DIFFER/);
  assert.match(directory, /TRUST VECTOR/);
  assert.match(directory, /USABLE WITH CAVEATS/);
  assert.match(directory, /UNBUILT GAP/);
  assert.match(directory, /focusCoverage\("verified"\)/);
  assert.match(directory, /focusCoverage\("ready"\)/);
  assert.match(directory, /focusCoverage\("planned"\)/);
  assert.match(directory, /setQuery\(""\)/);
  assert.match(directory, /setCategoryFilter\("all"\)/);
  assert.match(directory, /setDomainFilter\("all"\)/);
  assert.ok(directory.indexOf("providers-directory__toolbar") < directory.indexOf("providers-coverage-brief"));
  assert.ok(directory.indexOf("providers-table") < directory.indexOf("providers-coverage-brief"));
  assert.match(directory, /providerActionFor\(provider, key\)/);
  assert.match(styles, /\.providers-coverage-brief/);
  assert.match(styles, /\.providers-directory__quick/);
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(routeStyles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(routeStyles, /@media \(min-width: 3000px\)/);
  assert.match(routeStyles, /max-width: min\(3200px, calc\(100vw - 240px\)\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.doesNotMatch(directory, /dangerouslySetInnerHTML/);
});
