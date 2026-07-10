import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderShareBadgeMarkdown,
  renderShareBadgeSvg,
  renderSharePosterMarkdown,
  renderSharePosterSvg,
} from "../badge.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";

const records: NormalizedRecord[] = [
  {
    ts: "2026-07-01T00:00:00Z",
    provider: "higgsfield",
    category: "video",
    operation: "generation",
    quantity: 1,
    unit: "request",
    rawAmount: 24,
    rawUnit: "credits",
    usdEst: 12.4,
    source: "ledger",
    confidence: "high",
    verified: false,
  },
  {
    ts: "2026-07-02T00:00:00Z",
    provider: "ollama",
    category: "llm",
    operation: "chat",
    quantity: 1,
    unit: "request",
    rawAmount: 1,
    rawUnit: "request",
    source: "local",
    confidence: "medium",
    verified: false,
  },
];

const githubSignal: TrustSignal = {
  kind: "github_activity",
  source: "github_cli",
  label: "GitHub activity evidence (not AI usage)",
  handle: "better",
  fetchedAt: "2026-07-05T00:00:00Z",
  from: "2026-07-01T00:00:00Z",
  to: "2026-07-05T00:00:00Z",
  windowDays: 5,
  totalContributions: 12,
  commitContributions: 10,
  issueContributions: 0,
  pullRequestContributions: 1,
  pullRequestReviewContributions: 1,
  repositoryContributions: 0,
  days: [
    { date: "2026-07-01", count: 0, level: 0 },
    { date: "2026-07-02", count: 2, level: 1 },
    { date: "2026-07-03", count: 6, level: 2 },
    { date: "2026-07-04", count: 12, level: 3 },
    { date: "2026-07-05", count: 20, level: 4 },
  ],
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

test("share badge renders a self-contained SVG with usage and trust labels", () => {
  const svg = renderShareBadgeSvg(records, [githubSignal], { handle: "@better" });

  assert.match(svg, /^<svg /);
  assert.match(svg, /VTK:\/\/SHARE-BADGE\/\/LOCAL-FIRST\/\/VIBERS-UNITE/);
  assert.match(svg, /VibeTRACKER/);
  assert.match(svg, /@better/);
  assert.match(svg, /Provider brand rail/);
  assert.match(svg, /Higgsfield provider brand chip/);
  assert.match(svg, /Ollama provider brand chip/);
  assert.match(svg, /Est spend/);
  assert.match(svg, /Operations/);
  assert.match(svg, /Credits/);
  assert.match(svg, /Trust rail · NOT USAGE/);
  assert.match(svg, /GitHub trust heatgrid - NOT USAGE/);
  assert.match(svg, /Official GitHub contribution color legend/);
  assert.match(svg, /GitHub official contribution color level 4/);
  assert.match(svg, /source-to-score passport/);
  assert.match(svg, /profile, heatgrid, score, badges share reviewed aggregates/);
  assert.match(svg, /aggregate/);
  assert.match(svg, /source mix/);
  assert.match(svg, /score input/);
  assert.match(svg, /NOT USAGE/);
  assert.match(svg, /bundle [a-f0-9]{8}\.\.\.[a-f0-9]{6}/);
  assert.match(svg, /VTK:\/\/BADGE-RECEIPT\/\/NO-PROMPTS\/\/NO-OUTPUTS\/\/TRUST-NOT-USAGE\/\/VIBERS-UNITE/);
  assert.match(svg, /#39d353/);
  assert.match(svg, /c0vibe\.app/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.doesNotMatch(svg, /<script/i);
});

test("share badge escapes user-controlled strings", () => {
  const svg = renderShareBadgeSvg(records, [], { handle: "\"><script>alert(1)</script>" });

  assert.match(svg, /&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(svg, /<script/i);
});

test("share badge markdown links the generated artifact to a C0VIBE profile", () => {
  const markdown = renderShareBadgeMarkdown("./vibetracker-badge.svg", { handle: "better" });

  assert.equal(markdown, "[![VibeTRACKER local AI usage badge](./vibetracker-badge.svg)](https://c0vibe.app/u/better)");
});

test("share poster renders a self-contained Vibers Unite SVG with quarantined trust", () => {
  const svg = renderSharePosterSvg(records, [githubSignal], { handle: "@better" });

  assert.match(svg, /^<svg /);
  assert.match(svg, /VTK:\/\/SHARE-POSTER\/\/VIBERS-UNITE\/\/C0VIBE\.APP\/\/LOCAL-FIRST/);
  assert.match(svg, /VibeTRACKER/);
  assert.match(svg, /@better/);
  assert.match(svg, /Provider brand rail/);
  assert.match(svg, /Official GitHub contribution color legend/);
  assert.match(svg, /GitHub official contribution color level 4/);
  assert.match(svg, /Trust is quarantined/);
  assert.match(svg, /score delta \+0/);
  assert.match(svg, /rank delta 0/);
  assert.match(svg, /POSTER-RECEIPT/);
  assert.match(svg, /NO-PROMPTS/);
  assert.match(svg, /NO-OUTPUTS/);
  assert.match(svg, /NO-SECRETS/);
  assert.match(svg, /TRUST-NOT-USAGE/);
  assert.match(svg, /Vibers Unite/);
  assert.doesNotMatch(svg, /<script/i);
});

test("share poster markdown links the generated artifact to a C0VIBE profile", () => {
  const markdown = renderSharePosterMarkdown("./vibetracker-poster.svg", { handle: "better" });

  assert.equal(markdown, "[![VibeTRACKER Vibers Unite poster](./vibetracker-poster.svg)](https://c0vibe.app/u/better)");
});
