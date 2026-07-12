import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfilePocketCard } from "../profile-pocket-card.ts";
import { buildVibeScoreReceipt } from "../vibe-score.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: new Date().toISOString(),
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
    { provider: "claude-code", ops: 900, credits: 300, usd: 8 },
    { provider: "ollama", ops: 276, credits: 80, usd: 2.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 200, credits: 180, usd: 12.5 },
    { date: "2026-07-04", ops: 500, credits: 300, usd: 18 },
    { date: "2026-07-05", ops: 500, credits: 400, usd: 12 },
  ],
  categories: [], trustSignals: [{
    kind: "higgsfield_mcp",
    source: "codex_mcp",
    label: "Higgsfield MCP connection evidence (not AI usage)",
    provider: "higgsfield",
    mcpName: "higgsfield",
    transport: "stdio",
    auth: "oauth",
    urlHost: "mcp.higgsfield.ai",
    enabled: true,
    fetchedAt: "2026-07-05T00:00:00Z",
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.",
  }],
};

test("profile pocket card condenses score, usage, trust, privacy, and relay", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const card = buildProfilePocketCard(profile, receipt);

  assert.equal(card.headline, "@cyrill pocket signal");
  assert.match(card.subline, /Mobile-readable public receipt/);
  assert.match(card.seal, /^[0-9A-F]{8}$/);
  assert.equal(card.shareUrl, "https://c0vibe.app/u/cyrill");
  assert.equal(card.terminalLines.every((line) => line.length === 66), true);
  assert.match(card.terminalLines.join("\n"), /PROFILE-POCKET-CARD/);
  assert.match(card.terminalLines.join("\n"), /trust 1 NOT USAGE \/\/ trustBoost 0 \/\/ usageWrites 0/);
  assert.match(card.terminalLines.join("\n"), /hiddenUploads 0 \/\/ promptReads 0 \/\/ outputReads 0/);
  assert.match(card.terminalLines.join("\n"), /Vibers Unite/);

  assert.match(card.walletPass.passId, /^C0-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(card.walletPass.status, "published");
  assert.equal(card.walletPass.title, "C0VIBE wallet pass");
  assert.equal(card.walletPass.matrixRows.length, 9);
  assert.equal(card.walletPass.matrixRows.every((row) => row.length === 23), true);
  assert.match(card.walletPass.terminalLines.join("\n"), /WALLET-PASS/);
  assert.match(card.walletPass.terminalLines.join("\n"), /trust \+0 rank \+0/);
  assert.match(card.walletPass.terminalLines.join("\n"), /raw prompts 0/);
  assert.match(card.walletPass.terminalLines.join("\n"), /Vibers Unite/);
  assert.deepEqual(card.walletPass.chips.map((chip) => chip.id), ["handle", "score", "usage", "trust", "relay"]);
  assert.deepEqual(card.walletPass.chips.map((chip) => chip.impact), ["publish", "score", "usage", "not_usage", "publish"]);
  assert.deepEqual(card.walletPass.seals, ["aggregate only", "trust +0", "rank +0", "hiddenUpload=0", "rawContent=0"]);

  assert.deepEqual(card.metrics.map((metric) => metric.id), ["score", "usage", "trust", "privacy", "relay"]);
  assert.deepEqual(card.metrics.map((metric) => metric.impact), ["score", "usage", "not_usage", "privacy", "publish"]);
  assert.equal(card.metrics.every((metric) => metric.frames.length === 3), true);
  assert.equal(card.metrics.every((metric) => metric.from.startsWith("#") && metric.to.startsWith("#")), true);
  assert.equal(card.metrics.find((metric) => metric.id === "usage")?.mark, "HF");
  assert.equal(card.metrics.find((metric) => metric.id === "trust")?.mark, "HF");
  assert.match(card.metrics.find((metric) => metric.id === "trust")?.note ?? "", /Higgsfield MCP/);
  assert.match(card.metrics.find((metric) => metric.id === "trust")?.guardrail ?? "", /NOT USAGE/);
  assert.equal(card.metrics.find((metric) => metric.id === "privacy")?.value, "0 raw reads");
  assert.match(card.metrics.find((metric) => metric.id === "privacy")?.guardrail ?? "", /0 prompt reads/);
  assert.equal(card.metrics.find((metric) => metric.id === "relay")?.value, "published");
  assert.deepEqual(card.totals, {
    score: receipt.score,
    ops: 1200,
    usd: 42.5,
    activeDays: 3,
    providers: 3,
    trustSignals: 1,
    usageWrites: 0,
    hiddenUploads: 0,
    promptReads: 0,
    outputReads: 0,
    trustBoost: 0,
  });
});

test("profile pocket card waiting state does not invent usage or trust", () => {
  const waitingProfile = { ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] };
  const receipt = buildVibeScoreReceipt(waitingProfile);
  const card = buildProfilePocketCard(waitingProfile, receipt);

  assert.match(card.headline, /waiting/);
  assert.equal(card.totals.score, 0);
  assert.equal(card.totals.ops, 0);
  assert.equal(card.totals.providers, 0);
  assert.equal(card.totals.trustSignals, 0);
  assert.equal(card.metrics.find((metric) => metric.id === "usage")?.value, "0 ops");
  assert.equal(card.metrics.find((metric) => metric.id === "trust")?.value, "0 signals");
  assert.equal(card.metrics.find((metric) => metric.id === "trust")?.meter, 0);
  assert.equal(card.metrics.find((metric) => metric.id === "relay")?.value, "draft");
  assert.equal(card.walletPass.status, "waiting");
  assert.match(card.walletPass.title, /waiting/);
  assert.equal(card.walletPass.chips.find((chip) => chip.id === "usage")?.value, "0 ops");
  assert.equal(card.walletPass.chips.find((chip) => chip.id === "trust")?.value, "0 not usage");
  assert.match(card.walletPass.terminalLines.join("\n"), /usage 0/);
  assert.match(card.walletPass.terminalLines.join("\n"), /trust \+0 rank \+0/);
  assert.match(card.terminalLines.join("\n"), /score 000\/100/);
  assert.match(card.terminalLines.join("\n"), /NOT USAGE/);
});

test("public profile route retires the pocket deck for the calm dashboard", () => {
  const page = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(page, /ProfileHeader/);
  assert.match(page, /StatCards/);
  assert.doesNotMatch(page, /ProfilePocketCardPanel/);
  assert.doesNotMatch(page, /ProfileWalletPassPanel/);
  assert.doesNotMatch(page, /buildProfilePocketCard/);
  assert.doesNotMatch(page, /profile-pocket-card/);
  assert.doesNotMatch(page, /profile-wallet-pass/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);

  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
