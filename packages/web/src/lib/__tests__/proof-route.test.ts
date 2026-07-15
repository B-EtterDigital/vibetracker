import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceCockpit } from "../evidence-cockpit.ts";
import { buildLiveProofSnapshot, sanitizeProofHandle } from "../../app/proof/live-proof-snapshot.ts";
import { buildProofVerdict } from "../../app/proof/proof-verdict.ts";
import type { ProfileView } from "../data.ts";

const publicProfile: ProfileView = {
  handle: "b-etterdigital",
  created_at: "2026-07-01T00:00:00Z",
  isPremium: true,
  identityVerified: true,
  identityProvider: "github",
  accountLinked: false,
  latest: {
    total_usd: 19.4,
    total_credits: 88,
    record_count: 2048,
    created_at: "2026-07-14T17:15:00Z",
    tier: "cli_verified",
  },
  providers: [
    { provider: "codex", ops: 1600, credits: 60, usd: 13.2 },
    { provider: "claude-code", ops: 448, credits: 28, usd: 6.2 },
  ],
  usageDays: [{ date: "2026-07-14", ops: 2048, credits: 88, usd: 19.4 }],
  categories: [],
  providerDays: [],
  providerModels: [],
  trustSignals: [],
  rank: 7,
};

test("proof handle input accepts GitHub handles and rejects ambiguous values", () => {
  assert.equal(sanitizeProofHandle(" @B-EtterDigital "), "b-etterdigital");
  assert.equal(sanitizeProofHandle(["Cyrill", "ignored"]), "cyrill");
  assert.equal(sanitizeProofHandle("../admin"), "b-etterdigital");
  assert.equal(sanitizeProofHandle("broken_handle"), "b-etterdigital");
  assert.equal(sanitizeProofHandle(undefined), "b-etterdigital");
});

test("live proof snapshot exposes public aggregates without calling its fingerprint a signature", () => {
  const snapshot = buildLiveProofSnapshot(publicProfile);

  assert.equal(snapshot.status, "live");
  assert.equal(snapshot.statusLabel, "LIVE PUBLIC AGGREGATE");
  assert.equal(snapshot.identityLabel, "GITHUB VERIFIED");
  assert.equal(snapshot.tierLabel, "CLI VERIFIED");
  assert.equal(snapshot.rankLabel, "#7 PUBLIC RANK");
  assert.equal(snapshot.updatedLabel, "2026-07-14");
  assert.match(snapshot.fingerprint, /^[A-F0-9]{8}$/);
  assert.equal(snapshot.metrics.find((metric) => metric.id === "records")?.value, "2,048");
  assert.equal(snapshot.events.length, 7);
  assert.match(snapshot.receipt, /trust_signals 0 \(NOT USAGE\)/);
  assert.match(snapshot.receipt, /vibeusage\.c0vibe\.app\/u\/b-etterdigital/);
  assert.equal(snapshot.metrics[0].label, "Snapshot fingerprint");
  assert.doesNotMatch(snapshot.metrics[0].value, /signature/i);
  assert.match(snapshot.metrics[0].detail, /not a cryptographic signature/i);
});

test("live proof snapshot stays explicitly empty before a first upload", () => {
  const snapshot = buildLiveProofSnapshot({ ...publicProfile, latest: null, providers: [], usageDays: [], rank: null });

  assert.equal(snapshot.status, "waiting");
  assert.equal(snapshot.statusLabel, "WAITING FOR FIRST UPLOAD");
  assert.equal(snapshot.tierLabel, "NOT SYNCED");
  assert.equal(snapshot.updatedLabel, "NOT PUBLISHED");
  assert.equal(snapshot.metrics.find((metric) => metric.id === "records")?.value, "0");
  assert.match(snapshot.receipt, /state waiting/);
});

test("proof verdict separates bundled contract coverage from live user evidence", () => {
  const evidence = buildEvidenceCockpit();
  const verdict = buildProofVerdict(evidence);

  assert.equal(verdict.mode, "bundled_contract_fixture");
  assert.equal(verdict.walkthroughCoverage, evidence.bridge.totals.averageMeter);
  assert.match(verdict.headline, /not your live receipt/i);
  assert.deepEqual(verdict.boundaries, ["no machine scan", "no account query", "no upload"]);
  assert.equal(verdict.excludes.some((item) => /No percentage.*product readiness/.test(item)), true);
  assert.deepEqual(verdict.actions.map((action) => action.command), [
    "vibetracker audit",
    "vibetracker upload --dry-run",
    "vibetracker proof --explain",
  ]);
});

test("proof center is exposed as a first-class local-first evidence route", () => {
  const page = readFileSync("packages/web/src/app/proof/page.tsx", "utf8");
  const liveWorkbench = readFileSync("packages/web/src/app/proof/live-proof-workbench.tsx", "utf8");
  const liveStyles = readFileSync("packages/web/src/app/proof/live-proof-workbench.css", "utf8");
  const verdictPanel = readFileSync("packages/web/src/app/proof/proof-verdict-panel.tsx", "utf8");
  const verdictStyles = readFileSync("packages/web/src/app/proof/proof-verdict.css", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");
  const evidence = readFileSync("packages/web/src/lib/evidence-cockpit.ts", "utf8");

  assert.match(layout, /href="\/proof"/);   // reachable from the header
  assert.match(page, /buildEvidenceCockpit/);
  assert.match(page, /getProfile\(requestedHandle\)/);
  assert.match(page, /buildLiveProofSnapshot/);
  assert.match(page, /sanitizeProofHandle/);
  assert.match(page, /async function ProofPage/);
  assert.match(page, /await searchParams/);
  assert.match(page, /<LiveProofWorkbench/);
  assert.match(page, /<details className="proof-blueprint">/);
  assert.match(page, /Open the bundled proof contract/);
  assert.match(page, /Inspect a public usage receipt/);
  assert.match(page, /real public aggregate/);
  assert.match(page, /buildProofVerdict/);
  assert.match(page, /<ProofVerdictPanel verdict=\{verdict\} \/>/);
  assert.match(page, /proof-route-intro/);
  assert.match(page, /proof-route-cockpit evidence-cockpit/);
  assert.match(page, /VTK:\/\/PROOF-CENTER\/\/LOCAL-FIRST\/\/NO-FAKE-PROOF\/\/NO-HIDDEN-UPLOADS/);
  assert.match(page, /complete scan-to-share specification/);
  assert.match(page, /NO FAKE PROOF/);
  assert.match(page, /dry-run first/);
  assert.match(page, /railLabelFor/);
  assert.match(page, /NOT USAGE/);
  assert.match(page, /LOCAL ONLY/);
  assert.match(page, /PUBLISH/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /c0vibe\.app/);
  assert.match(page, /ProofDatastreamSpinePanel/);
  assert.match(page, /proof-datastream-spine/);
  assert.match(page, /VTK:\/\/DATASTREAM-SPINE\/\/SCORE-PROFILE-PUBLISH\/\/TRUST-SIDECAR/);
  assert.match(page, /One reviewed receipt, four honest surfaces/);
  assert.match(page, /same accepted aggregate receipt/);
  assert.match(page, /score feeds from usage/);
  assert.match(page, /profile feeds from receipt/);
  assert.match(page, /trust is not usage/);
  assert.match(page, /id: "trust"/);
  assert.match(page, /evidence\.bridge\.totals\.trustUsageWrites/);
  assert.match(page, /evidence\.bridge\.totals\.zeroHiddenUploads/);
  assert.match(page, /vibetracker upload --target c0vibe/);
  assert.match(page, /ProofBlackBoxPanel/);
  assert.match(page, /proof-black-box/);
  assert.match(page, /VTK:\/\/BLACK-BOX\/\/CUSTODY\/\/NO-RAW-PROMPTS\/\/0-HIDDEN-UPLOADS/);
  assert.match(page, /USAGE \+ TRUST \+ PRIVACY \+ PUBLISH/);
  assert.match(page, /0 hidden uploads/);
  assert.match(page, /NO RAW PROMPTS/);
  assert.match(page, /NOT USAGE labels/);
  assert.match(page, /link\.command/);
  assert.match(page, /custodyToneFor/);
  assert.match(page, /ProofVerificationBridgePanel/);
  assert.match(page, /proof-verification-bridge/);
  assert.match(page, /VTK:\/\/PROOF-BRIDGE\/\/OPERATOR-QUESTIONS\/\/ZERO-HIDDEN-UPLOADS/);
  assert.match(page, /bridge@proof/);
  assert.match(page, /bridge\.totals\.trustUsageWrites/);
  assert.match(page, /bridge\.gates\.map/);
  assert.match(page, /gate\.question/);
  assert.match(page, /gate\.writes/);
  assert.match(page, /gate\.invariant/);
  assert.match(page, /bridgeToneFor/);
  assert.match(page, /ProofReplayRecorderPanel/);
  assert.match(page, /proof-replay-recorder/);
  assert.match(page, /VTK:\/\/PROOF-REPLAY\/\/TAMPER-EVIDENT\/\/LOCAL-FIRST\/\/NOT-USAGE-SIDECAR/);
  assert.match(page, /replay\.terminalLines/);
  assert.match(page, /event\.hash/);
  assert.match(page, /event\.invariant/);
  assert.match(page, /replayToneFor/);
  assert.match(page, /% FIXTURE/);
  assert.match(page, /% fixture/);
  assert.match(page, /fixture coverage/);
  assert.equal((page.match(/role="progressbar"/g) ?? []).length, 2);
  assert.equal((page.match(/aria-valuemin=\{0\}/g) ?? []).length, 2);
  assert.equal((page.match(/aria-valuemax=\{100\}/g) ?? []).length, 2);
  assert.match(page, /aria-valuenow=\{event\.meter\}/);
  assert.match(page, /aria-valuenow=\{stage\.meter\}/);
  assert.doesNotMatch(page, /% READY/);
  assert.doesNotMatch(page, /proof readiness/);
  assert.match(verdictPanel, /read this page as a contract/);
  assert.match(verdictPanel, /bundled fixture/);
  assert.match(verdictPanel, /Proven by this contract/);
  assert.match(verdictPanel, /Not proven on this page/);
  assert.match(verdictPanel, /Prove your own run/);
  assert.match(verdictPanel, /not live readiness/);
  assert.match(verdictPanel, /href="\/scan"/);
  assert.match(verdictPanel, /href="\/account"/);
  assert.match(evidence, /vibetracker upload --target c0vibe/);
  assert.match(evidence, /C0VIBE datastream/);
  assert.match(evidence, /vibetracker trust scan/);
  assert.match(evidence, /Tamper-evident replay/);
  assert.match(evidence, /sha256:c0vibe-profile-feed/);
  assert.match(evidence, /trust sidecars are NOT USAGE/);
  assert.match(evidence, /Verification bridge/);
  assert.match(evidence, /What counts\?/);
  assert.match(evidence, /What leaves\?/);
  assert.match(evidence, /0 usage writes/);
  assert.match(evidence, /0 hidden uploads/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.match(liveWorkbench, /role="tablist"/);
  assert.match(liveWorkbench, /role="tabpanel"/);
  assert.match(liveWorkbench, /aria-selected/);
  assert.match(liveWorkbench, /ArrowLeft/);
  assert.match(liveWorkbench, /navigator\.clipboard\.writeText\(snapshot\.receipt\)/);
  assert.match(liveWorkbench, /No cached or fixture values were substituted/);
  assert.match(liveWorkbench, /fabricated metrics 0/);
  assert.match(liveWorkbench, /not a cryptographic signature or independent attestation/i);
  assert.match(liveWorkbench, /Decode what this receipt can actually claim/);
  assert.match(liveWorkbench, /role="group" aria-label="Public receipt claims"/);
  assert.match(liveWorkbench, /Were operations counted/);
  assert.match(liveWorkbench, /reviewed public aggregate \/ record_count/);
  assert.match(liveWorkbench, /Trust labels do not add usage|Usage volume, spend, rank input/);
  assert.match(liveWorkbench, /doesNotProve/);
  assert.match(liveWorkbench, /0 hidden reads/);
  assert.match(liveWorkbench, /0 writes/);
  assert.match(liveStyles, /\.live-proof__workspace/);
  assert.match(liveStyles, /\.live-proof__decoder-body/);
  assert.match(liveStyles, /\.live-proof__claim-switch button\[aria-pressed="true"\]/);
  assert.match(liveStyles, /\.live-proof__claim-readout/);
  assert.match(liveStyles, /\.proof-blueprint/);
  assert.match(liveStyles, /@media \(max-width: 760px\)/);
  assert.match(liveStyles, /@media \(min-width: 2200px\)/);
  assert.match(liveStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(liveStyles, /gradient\(/);
  assert.match(styles, /\.proof-route-intro/);
  assert.match(styles, /\.proof-datastream-spine/);
  assert.match(styles, /\.proof-datastream-spine__terminal::after/);
  assert.match(styles, /\.proof-datastream-spine__nodes/);
  assert.match(styles, /\.proof-spine-node--trust/);
  assert.match(styles, /\.proof-spine-node__screen pre:nth-child\(2\)/);
  assert.match(styles, /\.proof-spine-node footer i::before/);
  assert.match(styles, /\.proof-route-cockpit\.evidence-cockpit/);
  assert.match(styles, /\.proof-black-box/);
  assert.match(styles, /\.proof-custody-link--trust/);
  assert.match(styles, /\.proof-verification-bridge/);
  assert.match(styles, /\.proof-verification-bridge__terminal/);
  assert.match(styles, /\.proof-verification-bridge__totals/);
  assert.match(styles, /\.proof-verification-gate--not_usage/);
  assert.match(styles, /\.proof-verification-gate__screen/);
  assert.match(styles, /\.proof-verification-gate__checks/);
  assert.match(styles, /\.proof-verification-gate footer i::before/);
  assert.match(styles, /\.proof-replay-recorder/);
  assert.match(styles, /\.proof-replay-event--sidecar/);
  assert.match(styles, /\.proof-replay-event__hash/);
  assert.match(styles, /\.proof-replay-event__meter i/);
  assert.match(styles, /@keyframes proof-custody-frame/);
  assert.match(styles, /\.proof-custody-link__scope pre:first-child/);
  assert.match(styles, /attr\(data-rail\)/);
  assert.match(styles, /attr\(data-status\)/);
  assert.match(styles, /\.proof-datastream-spine__body \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /\.proof-datastream-spine__nodes \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(verdictStyles, /\.proof-verdict__grid/);
  assert.match(verdictStyles, /@media \(max-width: 900px\)/);
  assert.match(verdictStyles, /\.proof-route-intro \{ grid-template-columns: 1fr; align-items: start; \}/);
  assert.match(verdictStyles, /\.proof-route-intro \.motto-rail \{ justify-content: flex-start; min-width: 0; \}/);
  assert.match(verdictStyles, /@media \(max-width: 560px\)/);
  assert.match(verdictStyles, /@media \(min-width: 2200px\)/);
  assert.doesNotMatch(verdictStyles, /@import/);
});
