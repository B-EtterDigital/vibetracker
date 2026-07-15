import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
import {
  buildScanReceipt,
  SAMPLE_SCAN_FINDINGS,
} from "../../app/scan/scan-receipt.ts";

test("bundled scan receipt derives exact totals without mixing native units", () => {
  const receipt = buildScanReceipt(SAMPLE_SCAN_FINDINGS);

  assert.deepEqual(receipt, {
    records: 12847,
    estimatedUsd: 1284.06,
    directEvidence: 6,
    localSources: 3,
    sourceCount: 9,
    topProvider: "Higgsfield",
    topShare: 331.2 / 1284.06,
  });
});

test("scan route is the calm Make-your-scan page with a scripted local demo", () => {
  const page = readFileSync("packages/web/src/app/scan/page.tsx", "utf8");
  const demo = readFileSync("packages/web/src/app/scan/scan-demo.tsx", "utf8");
  const receiptPanel = readFileSync("packages/web/src/app/scan/scan-receipt-panel.tsx", "utf8");
  const receiptStyles = readFileSync("packages/web/src/app/scan/scan-receipt.css", "utf8");
  const scan = readFileSync("packages/web/src/app/scan/scan.css", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.ok(operatorRouteFor("/scan"));

  // ---- new page composition: calm "Make your scan" ----
  assert.match(page, /title: "Make your scan — VibeUsage"/);
  assert.match(page, /Scan your AI usage locally, watch the results reveal, upload only when you choose\./);
  assert.match(page, /import \{ CopyChip, ScanDemo \} from "\.\/scan-demo"/);
  assert.match(page, /import "\.\/scan\.css"/);
  assert.match(page, /import "\.\/scan-receipt\.css"/);
  assert.match(scan, /\.wrap:has\(> \.vscan\)::before/);
  assert.match(scan, /white-space: normal/);
  assert.match(page, /import \{ PROVIDERS \} from "\.\.\/\.\.\/\.\.\/\.\.\/adapters\/src\/index"/);
  assert.doesNotMatch(page, /adapters\/src\/registry/);
  assert.match(page, /<section className="vscan"/);
  assert.match(page, /className="vscan-slot"/);
  assert.match(page, /"--panel-i": index/);
  assert.match(page, /vscan-hero/);
  assert.match(page, /Make your scan\./);
  assert.match(page, /Build the evidence trail on your machine\./);
  assert.match(page, /local ledger/);
  assert.match(page, /explicit connectors/);
  assert.match(page, /zero automatic uploads/);
  assert.match(page, /local scan runway/);
  assert.match(page, /command: "npx vibetrack init --gui"/);
  assert.match(page, /command: "npx vibetrack sync --receipt"/);
  assert.match(page, /command: "npx vibetrack life"/);
  assert.match(page, /command="npx vibetrack sync --demo --receipt"/);
  assert.match(page, /No provider accounts required\./);
  assert.doesNotMatch(page, /command="vibetrack/);
  assert.match(page, /<ScanDemo /);
  assert.match(page, /what the scan reads/);
  assert.match(page, /vscan-reads/);
  assert.match(page, /Coding agents/);
  assert.match(page, /Hosted AI/);
  assert.match(page, /Local runners/);
  assert.match(page, /see all \{PROVIDERS\.length\} providers/);
  assert.match(page, /vscan-privacy/);
  assert.match(page, /local-first, provable/);
  assert.match(page, /Nothing leaves your machine unless you run upload\./);
  assert.match(page, /command="npx vibetrack privacy"/);
  assert.match(page, /read the trust model/);
  assert.match(page, /blob\/main\/docs\/compliance\/TRUST_MODEL\.md/);

  // ---- the old scan theatre is gone from the page ----
  assert.doesNotMatch(page, /buildCollectionSurpriseRun/);
  assert.doesNotMatch(page, /collection-surprises/);
  assert.doesNotMatch(page, /ScanSignalEqualizer/);
  assert.doesNotMatch(page, /scan-route-pulse/);
  assert.doesNotMatch(page, /VTK:\/\//);
  assert.doesNotMatch(page, /NO USAGE WRITES/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /profile\.css/);

  // ---- scripted demo client: server-visible, deterministic, honest ----
  assert.match(demo, /"use client"/);
  assert.match(demo, /export function CopyChip/);
  assert.match(demo, /export function ScanDemo/);
  assert.match(demo, /navigator\.clipboard\.writeText/);
  assert.match(demo, /title=\{`Copy \$\{command\} to clipboard`\}/);
  assert.match(demo, /scripted demo · makes no calls/);
  assert.match(demo, /reading local logs/);
  assert.match(demo, /· claude code · codex · gemini cli/);
  assert.match(demo, /detecting local runners/);
  assert.match(demo, /· ollama · lm studio · comfyui/);
  assert.match(demo, /querying connected providers/);
  assert.match(demo, /· higgsfield · replicate · elevenlabs/);
  assert.match(demo, /normalizing 12,847 records across 9 providers/);
  assert.match(demo, /\$1,284\.06/);
  assert.match(demo, /label: "accepted", value: "12,847"/);
  assert.doesNotMatch(demo, /label: "credits"/);
  assert.match(demo, /<ScanReceiptPanel \/>/);
  assert.match(demo, /sample numbers from the bundled demo dataset\. your scan reveals your own\./);
  assert.match(demo, /STEP_MS = 450/);
  assert.match(demo, /prefers-reduced-motion: reduce/);
  assert.match(demo, /is-armed/);
  assert.match(demo, /data-shown=/);
  assert.match(demo, /trace ready/);
  assert.match(demo, /network 0/);
  assert.match(demo, /Array\.from\(\{ length: TOTAL_STEPS \}/);
  assert.match(demo, /useEffect\(\(\) => clearTimer, \[clearTimer\]\)/);
  assert.doesNotMatch(demo, /if \(!prefersReduced\(\)\) start\(\)/);
  assert.match(demo, /className="vscan-demo-stack"/);
  assert.match(demo, /Replay the scan preview/);
  assert.doesNotMatch(demo, /Math\.random/);
  assert.doesNotMatch(demo, /dangerouslySetInnerHTML/);

  // ---- inspectable bundled normalization receipt ----
  assert.match(receiptPanel, /bundled demo receipt/);
  assert.match(receiptPanel, /It is not a scan of this browser or/);
  assert.match(receiptPanel, /zero network \/ no upload/);
  assert.match(receiptPanel, /accepted records/);
  assert.match(receiptPanel, /estimated spend/);
  assert.match(receiptPanel, /direct evidence/);
  assert.match(receiptPanel, /Observed<\/strong> means parsed from an event log/);
  assert.match(receiptPanel, /Provider reported<\/strong>/);
  assert.match(receiptPanel, /Detected<\/strong> confirms a local endpoint, not spend/);
  assert.match(receiptPanel, /collection method/);
  assert.match(receiptPanel, /data-confidence=/);
  assert.match(receiptPanel, /Inspect its jobs first before changing providers/);
  assert.doesNotMatch(receiptPanel, /dangerouslySetInnerHTML/);
  assert.match(receiptStyles, /\.vscan-receipt-table/);
  assert.match(receiptStyles, /@media \(max-width: 560px\)/);
  assert.match(receiptStyles, /grid-template-areas: "provider spend" "method records" "confidence confidence"/);
  assert.doesNotMatch(receiptStyles, /@import/);

  // ---- route-scoped calm CSS mirrors the profile system, not imported ----
  assert.match(scan, /\.vscan \{/);
  assert.match(scan, /@keyframes vscan-in/);
  assert.match(scan, /calc\(var\(--panel-i, 0\) \* 90ms\)/);
  assert.match(scan, /\.vscan-panel \{/);
  assert.match(scan, /background: #0d1419/);
  assert.match(scan, /border: 1px solid rgba\(46, 232, 214, 0\.14\)/);
  assert.match(scan, /outline: 2px solid #2ee8d6/);
  assert.match(scan, /\.vscan-demo\.is-armed/);
  assert.match(scan, /\[data-shown="false"\]/);
  assert.match(scan, /\.vscan-demo-progress/);
  assert.match(scan, /\.vscan-demo-mark \{ grid-column: 3; grid-row: 1; justify-self: end; \}/);
  assert.match(scan, /\.wrap:has\(> \.vscan\) \{ max-width: min\(2640px, 95vw\); \}/);
  assert.match(scan, /grid-template-columns: minmax\(0, 0\.78fr\) minmax\(0, 1\.22fr\)/);
  assert.match(scan, /\.vscan-reads-grid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(scan, /prefers-reduced-motion: reduce/);
  assert.match(scan, /@media \(max-width: 900px\)/);
  assert.doesNotMatch(scan, /@import/);

  // ---- globals.css assertions for surviving scan families only ----
  assert.match(styles, /\.scan-command-runway/);
  assert.match(styles, /\.scan-command-runway__terminal/);
  assert.match(styles, /\.scan-command-runway__steps/);
  assert.match(styles, /\.scan-command-runway-step__screen/);
  assert.match(styles, /\.scan-command-runway-step__transcript/);
  assert.match(styles, /\.scanner-surprise-director/);
  assert.match(styles, /\.scanner-director-cue/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.scan-command-runway__steps \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /@media \(max-width: 460px\)/);
  assert.match(styles, /\.scan-command-runway__steps \{ grid-template-columns: 1fr; \}/);
});
