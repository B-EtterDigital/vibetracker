import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  collectGitHubActivityTrustSignal,
  collectHiggsfieldMcpTrustSignal,
  collectTrustSignals,
  createCreatorActivityTrustSignal,
  loadManualTrustSignals,
  saveManualTrustSignal,
  trustSignalSummary,
} from "../trust-signals.ts";

const sample = {
  data: {
    viewer: {
      login: "B-EtterDigital",
      contributionsCollection: {
        totalCommitContributions: 321,
        totalIssueContributions: 12,
        totalPullRequestContributions: 34,
        totalPullRequestReviewContributions: 56,
        totalRepositoryContributions: 7,
        contributionCalendar: {
          totalContributions: 430,
          weeks: [{
            contributionDays: [
              { date: "2026-07-01", contributionCount: 0, contributionLevel: "NONE" },
              { date: "2026-07-02", contributionCount: 2, contributionLevel: "FIRST_QUARTILE" },
              { date: "2026-07-03", contributionCount: 8, contributionLevel: "THIRD_QUARTILE" },
              { date: "2026-07-04", contributionCount: 19, contributionLevel: "FOURTH_QUARTILE" },
            ],
          }],
        },
      },
    },
  },
};

test("GitHub activity is collected as labelled evidence, not usage", () => {
  const signal = collectGitHubActivityTrustSignal({
    now: new Date("2026-07-05T00:00:00Z"),
    windowDays: 90,
    run: (command, args) => {
      assert.equal(command, "gh");
      assert.equal(args[0], "api");
      assert.equal(args[1], "graphql");
      return { status: 0, stdout: JSON.stringify(sample) };
    },
  });

  assert.ok(signal);
  assert.equal(signal.kind, "github_activity");
  assert.equal(signal.label, "GitHub activity evidence (not AI usage)");
  assert.equal(signal.handle, "B-EtterDigital");
  assert.equal(signal.totalContributions, 430);
  assert.equal(signal.commitContributions, 321);
  assert.equal(signal.windowDays, 90);
  assert.equal(signal.days?.length, 4);
  assert.equal(signal.days?.[0]?.level, 0);
  assert.equal(signal.days?.[3]?.level, 4);
  assert.equal(signal.affectsTotals, false);
  assert.equal(signal.usageVerified, false);
  assert.match(signal.note, /Not counted as usage/);
});

test("GitHub activity collector is optional when gh is unavailable", () => {
  const signal = collectGitHubActivityTrustSignal({
    run: () => ({ status: 1, stderr: "not logged in" }),
  });
  assert.equal(signal, null);
});

test("trustSignalSummary keeps the not-usage label visible", () => {
  const signal = collectGitHubActivityTrustSignal({
    now: new Date("2026-07-05T00:00:00Z"),
    run: () => ({ status: 0, stdout: JSON.stringify(sample) }),
  });
  assert.ok(signal);
  assert.match(trustSignalSummary([signal]), /not usage/);
});

test("Higgsfield MCP connection is collected as separate not-usage trust evidence", () => {
  const signal = collectHiggsfieldMcpTrustSignal({
    now: new Date("2026-07-06T00:00:00Z"),
    run: (command, args) => {
      assert.equal(command, "codex");
      assert.deepEqual(args, ["mcp", "get", "higgsfield"]);
      return {
        status: 0,
        stdout: [
          "higgsfield",
          "  enabled: true",
          "  transport: streamable_http",
          "  url: https://mcp.higgsfield.ai/mcp",
          "  bearer_token_env_var: -",
        ].join("\n"),
      };
    },
  });

  assert.ok(signal);
  assert.equal(signal.kind, "higgsfield_mcp");
  assert.equal(signal.source, "codex_mcp");
  assert.equal(signal.provider, "higgsfield");
  assert.equal(signal.transport, "streamable_http");
  assert.equal(signal.auth, "oauth");
  assert.equal(signal.urlHost, "mcp.higgsfield.ai");
  assert.equal(signal.affectsTotals, false);
  assert.equal(signal.usageVerified, false);
  assert.match(signal.note, /Not counted as usage/);
  assert.match(trustSignalSummary([signal]), /Higgsfield MCP evidence/);
  assert.match(trustSignalSummary([signal]), /not usage/);
});

test("collectTrustSignals attaches GitHub and Higgsfield MCP separately when available", () => {
  const signals = collectTrustSignals({
    now: new Date("2026-07-06T00:00:00Z"),
    run: (command, args) => {
      if (command === "gh") return { status: 0, stdout: JSON.stringify(sample) };
      if (command === "codex" && args.join(" ") === "mcp get higgsfield") {
        return { status: 0, stdout: "enabled: true\ntransport: streamable_http\nurl: https://mcp.higgsfield.ai/mcp\n" };
      }
      return { status: 1, stderr: "unexpected" };
    },
  });

  assert.deepEqual(signals.map((signal) => signal.kind), ["github_activity", "higgsfield_mcp"]);
  assert.equal(signals.every((signal) => signal.affectsTotals === false && signal.usageVerified === false), true);
});

test("Higgsfield MCP collector is optional when Codex MCP is unavailable", () => {
  const signal = collectHiggsfieldMcpTrustSignal({
    run: () => ({ status: 1, stderr: "not configured" }),
  });
  assert.equal(signal, null);
});

test("manual creator trust signals are stored as not-usage evidence", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-trust-"));
  const path = join(dir, "trust.json");
  try {
    const signal = createCreatorActivityTrustSignal({
      platform: "youtube",
      handle: "BetterDigital",
      metric: "uploads",
      count: 12,
      windowDays: 30,
      now: new Date("2026-07-05T00:00:00Z"),
    });
    saveManualTrustSignal(signal, path);
    const stored = loadManualTrustSignals(path);
    assert.equal(stored.length, 1);
    assert.equal(stored[0]?.kind, "creator_activity");
    assert.equal(stored[0]?.affectsTotals, false);
    assert.equal(stored[0]?.usageVerified, false);
    assert.match(trustSignalSummary(stored), /youtube creator evidence/);
    assert.match(trustSignalSummary(stored), /not usage/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
