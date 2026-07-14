export type ScanConfidence = "observed" | "provider" | "detected";

export type ScanFinding = {
  provider: string;
  method: string;
  records: number;
  estimatedUsd: number;
  confidence: ScanConfidence;
  local: boolean;
};

export const SAMPLE_SCAN_FINDINGS: readonly ScanFinding[] = [
  {
    provider: "Claude Code", method: "local session log", records: 3640,
    estimatedUsd: 320.44, confidence: "observed", local: false,
  },
  {
    provider: "Codex", method: "local session log", records: 2980,
    estimatedUsd: 255.72, confidence: "observed", local: false,
  },
  {
    provider: "Gemini CLI", method: "local session log", records: 1340,
    estimatedUsd: 98.4, confidence: "observed", local: false,
  },
  {
    provider: "Higgsfield", method: "provider ledger", records: 1280,
    estimatedUsd: 331.2, confidence: "provider", local: false,
  },
  {
    provider: "Replicate", method: "provider ledger", records: 920,
    estimatedUsd: 167.9, confidence: "provider", local: false,
  },
  {
    provider: "ElevenLabs", method: "provider ledger", records: 610,
    estimatedUsd: 110.4, confidence: "provider", local: false,
  },
  {
    provider: "Ollama", method: "local endpoint", records: 1037,
    estimatedUsd: 0, confidence: "detected", local: true,
  },
  {
    provider: "LM Studio", method: "local endpoint", records: 640,
    estimatedUsd: 0, confidence: "detected", local: true,
  },
  {
    provider: "ComfyUI", method: "local endpoint", records: 400,
    estimatedUsd: 0, confidence: "detected", local: true,
  },
];

export function buildScanReceipt(findings: readonly ScanFinding[]) {
  const records = findings.reduce((total, finding) => total + finding.records, 0);
  const spendCents = findings.reduce(
    (total, finding) => total + Math.round(finding.estimatedUsd * 100),
    0,
  );
  const estimatedUsd = spendCents / 100;
  const directEvidence = findings.filter(
    (finding) => finding.confidence === "observed" || finding.confidence === "provider",
  ).length;
  const localSources = findings.filter((finding) => finding.local).length;
  const topFinding = findings.reduce<ScanFinding | undefined>(
    (top, finding) => (!top || finding.estimatedUsd > top.estimatedUsd ? finding : top),
    undefined,
  );

  return {
    records,
    estimatedUsd,
    directEvidence,
    localSources,
    sourceCount: findings.length,
    topProvider: topFinding?.provider ?? null,
    topShare: topFinding && spendCents > 0 ? topFinding.estimatedUsd / estimatedUsd : 0,
  };
}
