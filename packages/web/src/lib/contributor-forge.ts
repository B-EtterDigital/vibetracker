export interface ContributorBadgeInput {
  id: string;
  label: string;
  description: string;
}

export interface ContributorForgePacket extends ContributorBadgeInput {
  mark: string;
  lane: string;
  proof: string;
  command: string;
  issue: string;
  meter: number;
  rankImpact: "none";
  usageImpact: "not usage";
  terminal: string[];
}

export type ContributorMissionImpact = "coverage" | "not_usage" | "privacy" | "local_only" | "publish";

export interface ContributorMissionRail {
  id: "adapter-wave" | "evidence-rail" | "privacy-gate" | "local-lab" | "c0vibe-publish";
  call: string;
  label: string;
  impact: ContributorMissionImpact;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  marks: string[];
  badgeIds: string[];
  terminal: string[];
}

export interface ContributorMissionControl {
  headline: string;
  terminalLines: string[];
  rails: ContributorMissionRail[];
  totals: {
    rails: number;
    badges: number;
    notUsage: number;
    rankImpacting: number;
    averageMeter: number;
  };
}

export type ContributorAdapterFoundryImpact = "adapter" | "fixture" | "regional" | "local_only" | "trust" | "publish";

export interface ContributorAdapterFoundryLane {
  id: "adapter-kit" | "fixture-bay" | "regional-wave" | "local-runner-lab" | "trust-sidecar" | "publish-credit";
  call: string;
  label: string;
  impact: ContributorAdapterFoundryImpact;
  command: string;
  value: string;
  issue: string;
  note: string;
  guardrail: string;
  meter: number;
  marks: string[];
  badgeIds: string[];
  rankImpact: "none";
  usageImpact: "not usage";
  terminal: string[];
}

export interface ContributorAdapterFoundry {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: ContributorAdapterFoundryLane[];
  totals: {
    lanes: number;
    packets: number;
    notUsage: number;
    rankImpacting: number;
    averageMeter: number;
  };
}

export type ContributorQuestImpact = "adapter" | "fixture" | "trust" | "privacy" | "local_only" | "regional" | "publish";

export interface ContributorQuest {
  id: "first-adapter" | "redacted-fixture" | "trust-sidecar" | "local-detector" | "regional-provider" | "publish-badge";
  call: string;
  label: string;
  impact: ContributorQuestImpact;
  command: string;
  issue: string;
  proof: string;
  guardrail: string;
  difficulty: "starter" | "focused" | "advanced";
  meter: number;
  marks: string[];
  badgeIds: string[];
  rankImpact: "none";
  usageImpact: "not usage";
  terminal: string[];
  checklist: string[];
}

export interface ContributorQuestBoard {
  headline: string;
  subline: string;
  terminalLines: string[];
  quests: ContributorQuest[];
  totals: {
    quests: number;
    proofPackets: number;
    starter: number;
    advanced: number;
    notUsage: number;
    rankImpacting: number;
    localFirst: number;
    averageMeter: number;
  };
}

export type ContributorLaunchpadImpact = "docs" | "adapter" | "fixture" | "test" | "privacy" | "publish";

export interface ContributorLaunchpadLane {
  id: "read-sdk" | "scaffold-adapter" | "redact-fixture" | "run-harness" | "privacy-review" | "publish-credit";
  call: string;
  label: string;
  impact: ContributorLaunchpadImpact;
  command: string;
  path: string;
  issue: string;
  note: string;
  guardrail: string;
  meter: number;
  marks: string[];
  badgeIds: string[];
  rankImpact: "none";
  usageImpact: "not usage";
  frames: string[];
  checklist: string[];
}

export interface ContributorLaunchpad {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: ContributorLaunchpadLane[];
  totals: {
    lanes: number;
    packets: number;
    docs: number;
    adapters: number;
    fixtures: number;
    tests: number;
    privacy: number;
    publish: number;
    notUsage: number;
    rankImpacting: number;
    averageMeter: number;
  };
}

const FORGE_META: Record<string, Omit<ContributorForgePacket, keyof ContributorBadgeInput | "rankImpact" | "usageImpact" | "terminal">> = {
  "adapter-builder": {
    mark: "AB",
    lane: "Provider adapters",
    proof: "Endpoint proof, parser tests, honest capability labels",
    command: "npx vibetrack adapter scaffold <provider>",
    issue: "Good first adapter with fixture and golden test",
    meter: 92,
  },
  "fixture-steward": {
    mark: "FS",
    lane: "Safe samples",
    proof: "Representative fixtures with redaction review",
    command: "npx vibetrack fixture redact raw.json --out usage.sample.json",
    issue: "Redacted fixture pack for a real provider",
    meter: 84,
  },
  "trust-signal-builder": {
    mark: "TS",
    lane: "Evidence rails",
    proof: "Not-usage labels, separate totals, public context",
    command: "npx vibetrack trust list",
    issue: "Trust signal that never changes usage rank",
    meter: 88,
  },
  "privacy-reviewer": {
    mark: "PR",
    lane: "Local-first safety",
    proof: "Upload boundaries, signing, secret scans, redaction",
    command: "npx vibetrack upload --dry-run",
    issue: "Redaction and upload-boundary review",
    meter: 96,
  },
  "local-ai-mapper": {
    mark: "LA",
    lane: "Local AI capture",
    proof: "Ollama, LM Studio, ComfyUI, vLLM, desktop/browser paths",
    command: "npx vibetrack detect --target http://127.0.0.1:1234",
    issue: "Local runner detector or workflow import",
    meter: 90,
  },
};

const fallback = {
  mark: "VT",
  lane: "Contribution",
  proof: "Reviewed contribution with tests",
  command: "npx vibetrack roadmap",
  issue: "Useful tracker improvement with proof",
  meter: 70,
};

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

export function buildContributorForge(badges: ContributorBadgeInput[]): ContributorForgePacket[] {
  return badges.map((badge) => {
    const meta = FORGE_META[badge.id] ?? fallback;
    const terminal = [
      `lane  ${fit(meta.lane, 28)}`,
      `proof ${fit(meta.proof, 28)}`,
      "rank  no usage-score mutation",
      `cmd   ${fit(meta.command, 28)}`,
    ];
    return {
      ...badge,
      ...meta,
      rankImpact: "none",
      usageImpact: "not usage",
      terminal,
    };
  });
}

export function contributorForgeSummary(packets: ContributorForgePacket[]) {
  return {
    lanes: packets.length,
    rankImpacting: packets.filter((packet) => packet.rankImpact !== "none").length,
    notUsage: packets.filter((packet) => packet.usageImpact === "not usage").length,
    averageMeter: packets.length
      ? Math.round(packets.reduce((sum, packet) => sum + packet.meter, 0) / packets.length)
      : 0,
  };
}

function pickPackets(packets: ContributorForgePacket[], ids: string[]): ContributorForgePacket[] {
  return ids
    .map((id) => packets.find((packet) => packet.id === id))
    .filter(Boolean) as ContributorForgePacket[];
}

function marksFor(packets: ContributorForgePacket[]): string[] {
  return packets.map((packet) => packet.mark);
}

function meterFor(packets: ContributorForgePacket[], fallbackMeter: number): number {
  if (!packets.length) return fallbackMeter;
  return Math.round(packets.reduce((sum, packet) => sum + packet.meter, 0) / packets.length);
}

function missionTerminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 28));
}

function foundryTerminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 30));
}

function questTerminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 32));
}

function launchpadFrames(lines: string[]): string[] {
  return lines.map((line) => fit(line, 28));
}

export function buildContributorLaunchpad(packets: ContributorForgePacket[]): ContributorLaunchpad {
  const adapterPackets = pickPackets(packets, ["adapter-builder"]);
  const fixturePackets = pickPackets(packets, ["fixture-steward"]);
  const trustPackets = pickPackets(packets, ["trust-signal-builder"]);
  const privacyPackets = pickPackets(packets, ["privacy-reviewer"]);
  const localPackets = pickPackets(packets, ["local-ai-mapper"]);
  const adapterAndFixture = [...adapterPackets, ...fixturePackets];
  const lanes: ContributorLaunchpadLane[] = [
    {
      id: "read-sdk",
      call: "READ",
      label: "Read the adapter SDK",
      impact: "docs",
      command: "open docs/ADAPTER_SDK.md",
      path: "docs/ADAPTER_SDK.md",
      issue: "Start with the adapter contract, contribution shape, and honest capability labels.",
      note: "The fastest contributors know what the tracker will accept before they touch provider code.",
      guardrail: "Docs orientation is public credit only: NOT USAGE.",
      meter: packets.length ? Math.max(contributorForgeSummary(packets).averageMeter - 4, 1) : 64,
      marks: packets.slice(0, 3).map((packet) => packet.mark),
      badgeIds: packets.slice(0, 3).map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["VTK SDK ONLINE", "contract before code", "labels before hype"]),
      checklist: ["read SDK", "pick source", "name confidence", "no fake built"],
    },
    {
      id: "scaffold-adapter",
      call: "ADAPT",
      label: "Scaffold one provider",
      impact: "adapter",
      command: "npx vibetrack adapter scaffold <provider>",
      path: "packages/adapters/src/<provider>/index.ts",
      issue: "Create the provider source with parser shape, import path, and capability status.",
      note: "Provider coverage gets valuable when it is testable, labelled, and narrow enough to review.",
      guardrail: "Planned providers stay planned until golden tests pass.",
      meter: meterFor(adapterPackets, 82),
      marks: marksFor(adapterPackets),
      badgeIds: adapterPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["mkdir provider lane", "parse usage export", "status label visible"]),
      checklist: ["source file", "registry hook", "status label", "failure path"],
    },
    {
      id: "redact-fixture",
      call: "FIX",
      label: "Redact a fixture",
      impact: "fixture",
      command: "npx vibetrack fixture redact raw.json --out usage.sample.json",
      path: "packages/adapters/src/<provider>/__fixtures__/usage.sample.json",
      issue: "Turn real provider output into a safe golden sample without prompts, files, tokens, or ids.",
      note: "Fixtures are the proof engine; they make parser claims reviewable without leaking private work.",
      guardrail: "Raw prompts, files, tokens, and identifiers do not ship.",
      meter: meterFor(fixturePackets, 80),
      marks: marksFor(fixturePackets),
      badgeIds: fixturePackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["raw export received", "secrets removed", "sample ready"]),
      checklist: ["redaction diff", "secret scan", "edge case", "review note"],
    },
    {
      id: "run-harness",
      call: "TEST",
      label: "Run the harness",
      impact: "test",
      command: "node --test packages/adapters/src/__tests__/**/*.test.ts",
      path: "packages/adapters/src/__tests__/",
      issue: "Prove the adapter parses real shapes and fails honestly when the provider changes.",
      note: "The launchpad treats passing proof as the moment a contribution becomes safe to promote.",
      guardrail: "No green label without current test evidence.",
      meter: meterFor(adapterAndFixture, 81),
      marks: marksFor(adapterAndFixture),
      badgeIds: adapterAndFixture.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["golden test queued", "parser checks shape", "failure path logged"]),
      checklist: ["golden test", "bad input test", "capability test", "docs note"],
    },
    {
      id: "privacy-review",
      call: "SAFE",
      label: "Review privacy boundary",
      impact: "privacy",
      command: "npx vibetrack upload --dry-run",
      path: "docs/compliance/TRUST_MODEL.md",
      issue: "Check what leaves the machine before contributor proof ever becomes public.",
      note: "Privacy review is a visible lane because local-first creators need to trust the scanner.",
      guardrail: "Prompts, files, secrets, and raw local logs stay on-machine.",
      meter: meterFor(privacyPackets, 86),
      marks: marksFor(privacyPackets),
      badgeIds: privacyPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["dry-run bundle", "redaction checked", "upload boundary shown"]),
      checklist: ["dry run", "secret scanner", "aggregate only", "signed publish"],
    },
    {
      id: "publish-credit",
      call: "UNITE",
      label: "Generate contributor badge",
      impact: "publish",
      command: "npx vibetrack badge --markdown",
      path: "contributors/badges.json",
      issue: "Give maintainers a reviewed badge packet for adapters, fixtures, trust, local, or privacy work.",
      note: "The command generates a local c0vibe.app review artifact; maintainers publish credit after merge.",
      guardrail: "Contributor credit never changes spend, operations, usage score, or rank.",
      meter: packets.length ? 94 : 54,
      marks: Array.from(new Set([...trustPackets, ...localPackets, ...packets].map((packet) => packet.mark))).slice(0, 5),
      badgeIds: packets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      frames: launchpadFrames(["Vibers Unite", "c0vibe.app rail", "rank impact zero"]),
      checklist: ["merged PR", "badge metadata", "public profile", "rank unchanged"],
    },
  ];

  return {
    headline: "Contributor launchpad",
    subline: "Start here, build here, verify here, publish here: a proof-first route for open-source vibers.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://CONTRIBUTOR-LAUNCHPAD//OPEN-SOURCE//NOT-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`lanes ${fit(lanes.length, 4)} packets ${fit(packets.length, 4)} docs ${fit(lanes.filter((lane) => lane.impact === "docs").length, 3)} tests ${fit(lanes.filter((lane) => lane.impact === "test").length, 3)}`),
      frameLine("read sdk -> scaffold -> fixture -> harness -> privacy"),
      frameLine("publish credit // rankImpact 0 // NOT USAGE"),
      frameLine("Vibers Unite // c0vibe.app // contributors ship proof"),
      "+--------------------------------------------------------------+",
    ],
    lanes,
    totals: {
      lanes: lanes.length,
      packets: packets.length,
      docs: lanes.filter((lane) => lane.impact === "docs").length,
      adapters: lanes.filter((lane) => lane.impact === "adapter").length,
      fixtures: lanes.filter((lane) => lane.impact === "fixture").length,
      tests: lanes.filter((lane) => lane.impact === "test").length,
      privacy: lanes.filter((lane) => lane.impact === "privacy").length,
      publish: lanes.filter((lane) => lane.impact === "publish").length,
      notUsage: lanes.filter((lane) => lane.usageImpact === "not usage").length,
      rankImpacting: lanes.filter((lane) => lane.rankImpact !== "none").length,
      averageMeter: Math.round(lanes.reduce((sum, lane) => sum + lane.meter, 0) / lanes.length),
    },
  };
}

export function buildContributorMissionControl(packets: ContributorForgePacket[]): ContributorMissionControl {
  const adapterPackets = pickPackets(packets, ["adapter-builder", "fixture-steward"]);
  const evidencePackets = pickPackets(packets, ["trust-signal-builder"]);
  const privacyPackets = pickPackets(packets, ["privacy-reviewer"]);
  const localPackets = pickPackets(packets, ["local-ai-mapper"]);
  const rails: ContributorMissionRail[] = [
    {
      id: "adapter-wave",
      call: "ADAPT",
      label: "Provider adapter wave",
      impact: "coverage",
      command: "npx vibetrack adapter scaffold <provider>",
      note: "Turn provider requests into fixtures, parsers, and honest capability labels.",
      guardrail: "Planned stays planned until tests pass.",
      meter: meterFor(adapterPackets, 78),
      marks: marksFor(adapterPackets),
      badgeIds: adapterPackets.map((packet) => packet.id),
      terminal: missionTerminal(["queue adapter + fixture", "golden sample required", "capability label visible", "no fake green"]),
    },
    {
      id: "evidence-rail",
      call: "TRUST",
      label: "Trust signal rail",
      impact: "not_usage",
      command: "npx vibetrack trust list",
      note: "Add public context like GitHub cadence while keeping it out of spend and rank math.",
      guardrail: "Contributor trust is NOT USAGE.",
      meter: meterFor(evidencePackets, 72),
      marks: marksFor(evidencePackets),
      badgeIds: evidencePackets.map((packet) => packet.id),
      terminal: missionTerminal(["trust signal sidecar", "rank mutation blocked", "public context only", "usage totals unchanged"]),
    },
    {
      id: "privacy-gate",
      call: "REDACT",
      label: "Privacy review gate",
      impact: "privacy",
      command: "npx vibetrack upload --dry-run",
      note: "Review redaction, signing, secret scans, and what leaves the machine.",
      guardrail: "No prompts, files, or secrets.",
      meter: meterFor(privacyPackets, 82),
      marks: marksFor(privacyPackets),
      badgeIds: privacyPackets.map((packet) => packet.id),
      terminal: missionTerminal(["dry-run bundle first", "secret scanner required", "aggregate only leaves", "signed before publish"]),
    },
    {
      id: "local-lab",
      call: "LOCAL",
      label: "Local AI lab",
      impact: "local_only",
      command: "npx vibetrack detect --target http://127.0.0.1:1234",
      note: "Map Ollama, LM Studio, ComfyUI, desktop activity, and browser capture flows.",
      guardrail: "Local capture stays local first.",
      meter: meterFor(localPackets, 76),
      marks: marksFor(localPackets),
      badgeIds: localPackets.map((packet) => packet.id),
      terminal: missionTerminal(["probe loopback tools", "import local workflows", "desktop/browser capture", "publish aggregate later"]),
    },
    {
      id: "c0vibe-publish",
      call: "UNITE",
      label: "C0VIBE credit preview",
      impact: "publish",
      command: "npx vibetrack badge --markdown",
      note: "Maintainer-reviewed badges can show public open-source credit beside C0VIBE profiles.",
      guardrail: "Badges never change usage rank.",
      meter: packets.length ? 94 : 54,
      marks: packets.slice(0, 5).map((packet) => packet.mark),
      badgeIds: packets.map((packet) => packet.id),
      terminal: missionTerminal(["Vibers Unite", "c0vibe.app credit", "maintainer reviewed", "not usage not rank"]),
    },
  ];
  const summary = contributorForgeSummary(packets);

  return {
    headline: "Open-source mission control",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://CONTRIBUTOR-MISSION//OPEN-SOURCE//NOT-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`badges ${fit(summary.lanes, 4)} rails ${fit(rails.length, 4)} proof ${fit(`${summary.averageMeter}%`, 6)} rank impact ${summary.rankImpacting}`),
      frameLine(`not usage ${fit(summary.notUsage, 4)} adapters fixtures trust privacy local lab`),
      frameLine("contributors make coverage real; tests make status honest"),
      frameLine("Vibers Unite // c0vibe.app // public credit only"),
      "+--------------------------------------------------------------+",
    ],
    rails,
    totals: {
      rails: rails.length,
      badges: summary.lanes,
      notUsage: summary.notUsage,
      rankImpacting: summary.rankImpacting,
      averageMeter: summary.averageMeter,
    },
  };
}

export function buildContributorQuestBoard(packets: ContributorForgePacket[]): ContributorQuestBoard {
  const adapterPackets = pickPackets(packets, ["adapter-builder"]);
  const fixturePackets = pickPackets(packets, ["fixture-steward"]);
  const trustPackets = pickPackets(packets, ["trust-signal-builder"]);
  const privacyPackets = pickPackets(packets, ["privacy-reviewer"]);
  const localPackets = pickPackets(packets, ["local-ai-mapper"]);
  const quests: ContributorQuest[] = [
    {
      id: "first-adapter",
      call: "01",
      label: "Ship a first adapter",
      impact: "adapter",
      command: "npx vibetrack adapter scaffold <provider>",
      issue: "Good-first provider source with parser, fixture, and status label",
      proof: "Source module, golden parser test, capability label, and docs note.",
      guardrail: "No provider is marked built until the golden test passes.",
      difficulty: "starter",
      meter: meterFor(adapterPackets, 82),
      marks: marksFor(adapterPackets),
      badgeIds: adapterPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["scaffold provider source", "add fixture + parser test", "label auth + confidence", "open PR with proof"]),
      checklist: ["adapter source", "redacted fixture", "golden test", "capability label"],
    },
    {
      id: "redacted-fixture",
      call: "02",
      label: "Donate a safe fixture",
      impact: "fixture",
      command: "npx vibetrack fixture redact raw.json --out usage.sample.json",
      issue: "Real provider sample with secrets, prompts, and files removed",
      proof: "Redaction diff, parser fixture, secret scan, and representative edge case.",
      guardrail: "Raw prompts, files, tokens, and user identifiers do not ship.",
      difficulty: "starter",
      meter: meterFor(fixturePackets, 80),
      marks: marksFor(fixturePackets),
      badgeIds: fixturePackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["redact raw export", "secret scan clean", "parser covers edge case", "fixture is not usage rank"]),
      checklist: ["sample redacted", "secret scan", "parser case", "review note"],
    },
    {
      id: "trust-sidecar",
      call: "03",
      label: "Build a trust sidecar",
      impact: "trust",
      command: "npx vibetrack trust list",
      issue: "GitHub, package, creator, profile, or MCP evidence lane",
      proof: "Sanitized public evidence, explicit NOT USAGE label, and zero rank mutation.",
      guardrail: "Trust evidence never changes spend, credits, operations, score, or rank.",
      difficulty: "focused",
      meter: meterFor(trustPackets, 76),
      marks: marksFor(trustPackets),
      badgeIds: trustPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["collect side evidence", "sanitize public fields", "label NOT USAGE", "rank mutation blocked"]),
      checklist: ["sanitized fields", "not usage label", "rank blocked", "profile context"],
    },
    {
      id: "local-detector",
      call: "04",
      label: "Map a local AI path",
      impact: "local_only",
      command: "npx vibetrack detect --target http://127.0.0.1:1234",
      issue: "Ollama, LM Studio, ComfyUI, vLLM, desktop, or browser capture rail",
      proof: "Loopback detector, privacy boundary, empty-state copy, and local-only test.",
      guardrail: "Prompts, outputs, files, secrets, and raw local logs stay on-machine.",
      difficulty: "focused",
      meter: meterFor(localPackets, 78),
      marks: marksFor(localPackets),
      badgeIds: localPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["probe loopback target", "show local-only status", "no prompt export", "aggregate later only"]),
      checklist: ["loopback probe", "privacy copy", "local test", "no raw upload"],
    },
    {
      id: "regional-provider",
      call: "05",
      label: "Add regional coverage",
      impact: "regional",
      command: "npx vibetrack adapter scaffold qwen",
      issue: "Chinese, European, Indian, Korean, Japanese, or adjacent AI provider",
      proof: "Provider-specific auth, usage shape, confidence tags, and honest limitations.",
      guardrail: "Manual, proxy, and API confidence stay visible until verified.",
      difficulty: "advanced",
      meter: Math.max(meterFor(adapterPackets, 78) - 3, 1),
      marks: ["QW", "DB", "KM", "MI", "AA"],
      badgeIds: adapterPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["qwen doubao kimi", "mistral aleph alpha", "auth shape documented", "confidence label visible"]),
      checklist: ["auth documented", "usage mapped", "confidence tag", "limitations stated"],
    },
    {
      id: "publish-badge",
      call: "06",
      label: "Prepare public credit",
      impact: "publish",
      command: "npx vibetrack badge --markdown",
      issue: "Maintainer-reviewed public badge for adapter, fixture, trust, privacy, or local work",
      proof: "Merged contribution, reviewed badge metadata, and a local badge artifact.",
      guardrail: "Contributor credit is public recognition only; it never changes usage rank.",
      difficulty: "starter",
      meter: packets.length ? 94 : 54,
      marks: packets.slice(0, 5).map((packet) => packet.mark),
      badgeIds: packets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: questTerminal(["maintainer reviewed", "badge metadata clean", "c0vibe.app credit", "zero usage rank impact"]),
      checklist: ["merged PR", "badge metadata", "public credit", "rank unchanged"],
    },
  ];

  return {
    headline: "Contributor quest board",
    subline: "Concrete open-source tasks that help vibers across creative AI, coding, local labs, regional providers, privacy, and public profiles.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://CONTRIBUTOR-QUESTS//OPEN-SOURCE//PUBLIC-CREDIT"),
      "|--------------------------------------------------------------|",
      frameLine(`quests ${fit(quests.length, 4)} packets ${fit(packets.length, 4)} starter ${fit(quests.filter((quest) => quest.difficulty === "starter").length, 3)}`),
      frameLine("adapters fixtures trust local regional publish"),
      frameLine("all quests are NOT USAGE and never mutate rank"),
      frameLine("Vibers Unite // c0vibe.app // good first issues"),
      "+--------------------------------------------------------------+",
    ],
    quests,
    totals: {
      quests: quests.length,
      proofPackets: packets.length,
      starter: quests.filter((quest) => quest.difficulty === "starter").length,
      advanced: quests.filter((quest) => quest.difficulty === "advanced").length,
      notUsage: quests.filter((quest) => quest.usageImpact === "not usage").length,
      rankImpacting: quests.filter((quest) => quest.rankImpact !== "none").length,
      localFirst: quests.filter((quest) => quest.impact === "local_only" || quest.impact === "privacy").length,
      averageMeter: Math.round(quests.reduce((sum, quest) => sum + quest.meter, 0) / quests.length),
    },
  };
}

export function buildContributorAdapterFoundry(packets: ContributorForgePacket[]): ContributorAdapterFoundry {
  const adapterPackets = pickPackets(packets, ["adapter-builder"]);
  const fixturePackets = pickPackets(packets, ["fixture-steward"]);
  const localPackets = pickPackets(packets, ["local-ai-mapper"]);
  const trustPackets = pickPackets(packets, ["trust-signal-builder"]);
  const summary = contributorForgeSummary(packets);
  const lanes: ContributorAdapterFoundryLane[] = [
    {
      id: "adapter-kit",
      call: "KIT",
      label: "Adapter kit",
      impact: "adapter",
      command: "npx vibetrack adapter scaffold <provider>",
      value: `${Math.max(adapterPackets.length, 1)} proof packet`,
      issue: "Fixture + parser + capability labels",
      note: "Turns requested AI providers into testable source modules with visible status.",
      guardrail: "Planned stays planned until golden tests pass.",
      meter: meterFor(adapterPackets, 82),
      marks: marksFor(adapterPackets),
      badgeIds: adapterPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["scaffold source + tests", "parser status is labelled", "capability badge visible", "no fake usage mutation"]),
    },
    {
      id: "fixture-bay",
      call: "FIX",
      label: "Fixture bay",
      impact: "fixture",
      command: "npx vibetrack fixture redact raw.json --out usage.sample.json",
      value: `${Math.max(fixturePackets.length, 1)} redaction lane`,
      issue: "Golden samples that do not leak prompts, files, or secrets",
      note: "Keeps parser work honest by making sample data reviewable before it ships.",
      guardrail: "Fixtures ship redacted or they do not ship.",
      meter: meterFor(fixturePackets, 80),
      marks: marksFor(fixturePackets),
      badgeIds: fixturePackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["redact raw export", "golden sample reviewed", "secret scan before merge", "fixture is not user rank"]),
    },
    {
      id: "regional-wave",
      call: "CN/EU",
      label: "Regional adapter wave",
      impact: "regional",
      command: "npx vibetrack adapter scaffold qwen",
      value: "Qwen / Doubao / Kimi / Mistral / Aleph Alpha",
      issue: "More Chinese and European AI rails with confidence labels",
      note: "Makes global AI usage visible without pretending every provider exposes the same API shape.",
      guardrail: "Manual, proxy, and API confidence stay labelled.",
      meter: Math.max(meterFor(adapterPackets, 78) - 3, 1),
      marks: ["QW", "DB", "KM", "MI", "AA"],
      badgeIds: adapterPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["qwen doubao kimi", "mistral aleph alpha", "regional confidence tag", "not usage until imported"]),
    },
    {
      id: "local-runner-lab",
      call: "LAN",
      label: "Local runner lab",
      impact: "local_only",
      command: "npx vibetrack detect --target http://127.0.0.1:1234",
      value: "Ollama / LM Studio / ComfyUI / vLLM",
      issue: "Loopback detectors and local workflow imports",
      note: "Lets local-first vibers show real private AI work without exporting raw prompts.",
      guardrail: "Local-only until reviewed aggregate upload.",
      meter: meterFor(localPackets, 78),
      marks: marksFor(localPackets),
      badgeIds: localPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["probe 127.0.0.1", "ollama lm studio comfyui", "aggregate later only", "local-first proof rail"]),
    },
    {
      id: "trust-sidecar",
      call: "TRUST",
      label: "Trust sidecar",
      impact: "trust",
      command: "npx vibetrack trust list",
      value: "NOT USAGE",
      issue: "GitHub, creator, package, and profile context as a separate signal",
      note: "Shows public proof around a profile while keeping usage math clean.",
      guardrail: "Cannot mutate spend, ops, rank, or verified status.",
      meter: meterFor(trustPackets, 76),
      marks: marksFor(trustPackets),
      badgeIds: trustPackets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["sidecar signal only", "rank mutation blocked", "spend remains separate", "profile context visible"]),
    },
    {
      id: "publish-credit",
      call: "SHIP",
      label: "Contributor credit",
      impact: "publish",
      command: "npx vibetrack badge --markdown",
      value: "C0VIBE credit preview",
      issue: "Maintainer-reviewed badge preparation for useful adapter work",
      note: "Creates the artifact maintainers can publish on C0VIBE without turning badges into usage.",
      guardrail: "Maintainer-reviewed badge only; never usage rank.",
      meter: packets.length ? 94 : 54,
      marks: packets.slice(0, 5).map((packet) => packet.mark),
      badgeIds: packets.map((packet) => packet.id),
      rankImpact: "none",
      usageImpact: "not usage",
      terminal: foundryTerminal(["Vibers Unite", "c0vibe.app badge rail", "public credit only", "zero usage rank impact"]),
    },
  ];

  return {
    headline: "Adapter foundry",
    subline: "Good-first provider work, regional coverage, local runners, fixtures, and trust sidecars for open-source vibers.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://ADAPTER-FOUNDRY//OPEN-SOURCE//NOT-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`lanes ${fit(lanes.length, 4)} packets ${fit(summary.lanes, 4)} avg proof ${fit(`${Math.round(lanes.reduce((sum, lane) => sum + lane.meter, 0) / lanes.length)}%`, 6)}`),
      frameLine("qwen doubao kimi mistral aleph-alpha local loopback"),
      frameLine("trust sidecars are NOT USAGE and never mutate rank"),
      frameLine("Vibers Unite // c0vibe.app // adapter credits only"),
      "+--------------------------------------------------------------+",
    ],
    lanes,
    totals: {
      lanes: lanes.length,
      packets: summary.lanes,
      notUsage: lanes.filter((lane) => lane.usageImpact === "not usage").length,
      rankImpacting: lanes.filter((lane) => lane.rankImpact !== "none").length,
      averageMeter: Math.round(lanes.reduce((sum, lane) => sum + lane.meter, 0) / lanes.length),
    },
  };
}
