import type { EvidenceCockpit } from "../../lib/evidence-cockpit.ts";

export type ProofVerdictAction = {
  label: string;
  command: string;
  note: string;
};

export type ProofVerdict = {
  mode: "bundled_contract_fixture";
  headline: string;
  summary: string;
  walkthroughCoverage: number;
  proves: readonly string[];
  excludes: readonly string[];
  boundaries: readonly string[];
  actions: readonly ProofVerdictAction[];
};

export function buildProofVerdict(evidence: EvidenceCockpit): ProofVerdict {
  return {
    mode: "bundled_contract_fixture",
    headline: "Blueprint, not your live receipt.",
    summary:
      "This page walks through the product contract with bundled fixtures. It proves how evidence is separated; it does not inspect this browser, your machine, or a provider account.",
    walkthroughCoverage: evidence.bridge.totals.averageMeter,
    proves: [
      "Usage receipts pass through an acceptance gate before public totals.",
      "Local preview, trust context, and publish approval stay on separate rails.",
      "The same reviewed aggregate can feed score, profile, heatgrid, and leaderboard.",
    ],
    excludes: [
      "No machine logs or provider credentials were read by this page.",
      "No spend total, identity, signature, or publish approval belongs to you here.",
      "No percentage below is product readiness or account verification.",
    ],
    boundaries: ["no machine scan", "no account query", "no upload"],
    actions: [
      {
        label: "Audit the local receipt",
        command: "vibetracker audit",
        note: "Validate source adapters, secret boundaries, and accepted records locally.",
      },
      {
        label: "Preview what leaves",
        command: "vibetracker upload --dry-run",
        note: "See the redacted aggregate before any explicit publish step.",
      },
      {
        label: "Explain every rail",
        command: "vibetracker proof --explain",
        note: "Print the usage, local-only, trust, and publish contract in the terminal.",
      },
    ],
  };
}
