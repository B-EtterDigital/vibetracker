import type {
  AcceptedImprovement,
  ImprovementGroup,
  ImprovementStage,
} from "../../../core/src/capabilities/roadmap.ts";

export type RoadmapCommandImpact = "usage" | "trust" | "privacy" | "ux" | "open_source" | "product";

export interface RoadmapCommandLane {
  id: "capture" | "trust-boundary" | "operator-ux" | "open-forge" | "life-dashboard";
  call: string;
  label: string;
  impact: RoadmapCommandImpact;
  groups: ImprovementGroup[];
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  counts: Record<ImprovementStage, number>;
  itemNumbers: number[];
  terminal: string[];
}

export interface RoadmapCommandCenter {
  headline: string;
  terminalLines: string[];
  lanes: RoadmapCommandLane[];
  totals: {
    items: number;
    lanes: number;
    live: number;
    accepted: number;
    planned: number;
    coverage: number;
  };
}

export type RoadmapMissionTone = "usage" | "trust" | "ux" | "open_source";

export interface RoadmapMissionBand {
  id: "source-mesh" | "proof-boundary" | "operator-experience" | "open-forge";
  call: string;
  label: string;
  tone: RoadmapMissionTone;
  groups: ImprovementGroup[];
  items: number;
  live: number;
  accepted: number;
  planned: number;
  meter: number;
  primaryNumbers: number[];
  terminal: string[];
  note: string;
  guardrail: string;
}

export interface RoadmapMissionPulse {
  label: string;
  value: string;
  route: string;
  note: string;
}

export interface RoadmapMissionRadar {
  headline: string;
  subline: string;
  terminalLines: string[];
  bands: RoadmapMissionBand[];
  pulses: RoadmapMissionPulse[];
  invariants: string[];
  totals: {
    items: number;
    live: number;
    accepted: number;
    planned: number;
    coverage: number;
    bands: number;
  };
}

interface RoadmapGroupInput {
  group: ImprovementGroup;
  label: string;
  items: AcceptedImprovement[];
}

const laneDefs: Array<Omit<RoadmapCommandLane, "meter" | "counts" | "itemNumbers" | "terminal">> = [
  {
    id: "capture",
    call: "CAPTURE",
    label: "All-source AI capture",
    impact: "usage",
    groups: ["data", "provider", "local", "creative"],
    command: "vibetracker sync && vibetracker detect --all",
    note: "Hosted APIs, local tools, creator AI, subscriptions, and manual ledgers flow into one usage stream.",
    guardrail: "Only actual usage records move spend totals.",
  },
  {
    id: "trust-boundary",
    call: "TRUST",
    label: "Trust and privacy boundary",
    impact: "trust",
    groups: ["trust", "privacy"],
    command: "vibetracker upload --dry-run",
    note: "Trust, identity, privacy, signing, and redaction make proof stronger without becoming usage.",
    guardrail: "Trust signals are NOT USAGE.",
  },
  {
    id: "operator-ux",
    call: "OPERATE",
    label: "Operator UX and analytics",
    impact: "ux",
    groups: ["ux", "analytics"],
    command: "vibetracker insights --budget 200",
    note: "CLI charm, GUI panels, forecasts, burn-rate alerts, and model/provider views help users act fast.",
    guardrail: "Insights are derived from local records.",
  },
  {
    id: "open-forge",
    call: "FORGE",
    label: "Open-source adapter forge",
    impact: "open_source",
    groups: ["open_source"],
    command: "vibetracker adapter scaffold <provider>",
    note: "Adapter SDK, fixtures, golden tests, docs, plugins, and contributor badges turn gaps into tasks.",
    guardrail: "Contributor credit never changes rank.",
  },
  {
    id: "life-dashboard",
    call: "UNITE",
    label: "AI life dashboard",
    impact: "product",
    groups: ["product"],
    command: "vibetracker life",
    note: "Exports, APIs, public trust tiers, and the full AI-life dashboard tie coding, creating, research, and publishing together.",
    guardrail: "Public surfaces keep source labels visible.",
  },
];

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function radarLine(value: string): string {
  return `| ${fit(value, 62)} |`;
}

function stageCounts(items: AcceptedImprovement[]): Record<ImprovementStage, number> {
  return {
    live: items.filter((item) => item.stage === "live").length,
    accepted: items.filter((item) => item.stage === "accepted").length,
    planned: items.filter((item) => item.stage === "planned").length,
  };
}

function terminalFor(lane: Omit<RoadmapCommandLane, "meter" | "counts" | "itemNumbers" | "terminal">, items: AcceptedImprovement[], counts: Record<ImprovementStage, number>): string[] {
  const groupText = lane.groups.join("+");
  const firstNumbers = items.slice(0, 6).map((item) => `#${item.number}`).join(" ");
  return [
    `${fit(lane.call, 8)} ${fit(groupText, 18)}`,
    `items ${fit(items.length, 3)} live ${fit(counts.live, 3)}`,
    `src   ${fit(firstNumbers || "pending", 20)}`,
    `guard ${fit(lane.guardrail, 20)}`,
  ];
}

export function buildRoadmapCommandCenter(groups: RoadmapGroupInput[]): RoadmapCommandCenter {
  const allItems = groups.flatMap((group) => group.items);
  const totals = stageCounts(allItems);
  const lanes = laneDefs.map((lane) => {
    const items = groups
      .filter((group) => lane.groups.includes(group.group))
      .flatMap((group) => group.items);
    const counts = stageCounts(items);
    const meter = items.length ? Math.min(100, Math.round((counts.live / items.length) * 100)) : 0;

    return {
      ...lane,
      counts,
      meter,
      itemNumbers: items.map((item) => item.number),
      terminal: terminalFor(lane, items, counts),
    };
  });

  return {
    headline: "Roadmap command center",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://ROADMAP-COMMAND//AI-LIFE-DASHBOARD//VIBERS-UNITE"),
      "|--------------------------------------------------------------|",
      frameLine(`items ${fit(allItems.length, 4)} lanes ${fit(lanes.length, 4)} coverage ${fit(`${Math.round((totals.live / Math.max(allItems.length, 1)) * 100)}%`, 6)}`),
      frameLine(`live ${fit(totals.live, 4)} accepted ${fit(totals.accepted, 4)} planned ${fit(totals.planned, 4)}`),
      frameLine("usage, trust, privacy, local, open-source, publish remain labelled"),
      frameLine("Vibers Unite // c0vibe.app // no fake built claims"),
      "+--------------------------------------------------------------+",
    ],
    lanes,
    totals: {
      items: allItems.length,
      lanes: lanes.length,
      ...totals,
      coverage: Math.round((totals.live / Math.max(allItems.length, 1)) * 100),
    },
  };
}

const missionBandDefs: Array<Pick<RoadmapMissionBand, "id" | "call" | "label" | "tone" | "groups" | "note" | "guardrail">> = [
  {
    id: "source-mesh",
    call: "MESH",
    label: "All-source usage mesh",
    tone: "usage",
    groups: ["data", "provider", "local", "creative"],
    note: "Browser, desktop, local AI, hosted APIs, regional providers, creator AI, and manual ledgers stay in one labelled usage stream.",
    guardrail: "Only real records alter spend totals.",
  },
  {
    id: "proof-boundary",
    call: "PROOF",
    label: "Trust and privacy boundary",
    tone: "trust",
    groups: ["trust", "privacy"],
    note: "Trust evidence, redaction, signatures, passkeys, encrypted storage, and privacy previews strengthen proof without becoming usage.",
    guardrail: "Trust remains NOT USAGE.",
  },
  {
    id: "operator-experience",
    call: "UX",
    label: "Operator experience and intelligence",
    tone: "ux",
    groups: ["ux", "analytics", "product"],
    note: "Terminal charm, GUI wizard, trend analysis, exports, local API, mobile profile, and AI-life dashboards make the tracker useful after collection.",
    guardrail: "Future-facing labels stay visible.",
  },
  {
    id: "open-forge",
    call: "FORGE",
    label: "Open-source forge",
    tone: "open_source",
    groups: ["open_source"],
    note: "Adapter SDK, fixtures, golden tests, plugins, docs, and contributor badges turn missing providers into scoped public tasks.",
    guardrail: "Contributor credit never changes rank.",
  },
];

function terminalForMissionBand(
  band: Pick<RoadmapMissionBand, "call" | "groups" | "guardrail">,
  items: AcceptedImprovement[],
  counts: Record<ImprovementStage, number>,
  meter: number,
): string[] {
  const numbers = items.slice(0, 8).map((item) => `#${item.number}`).join(" ");
  return [
    radarLine(`${band.call} ${band.groups.join("+")}`),
    radarLine(`items ${fit(items.length, 3)} live ${fit(counts.live, 3)} accepted ${fit(counts.accepted, 3)} planned ${fit(counts.planned, 3)}`),
    radarLine(`coverage ${fit(`${meter}%`, 5)} source ${numbers || "pending"}`),
    radarLine(`guard ${band.guardrail}`),
  ];
}

export function buildRoadmapMissionRadar(groups: RoadmapGroupInput[]): RoadmapMissionRadar {
  const allItems = groups.flatMap((group) => group.items);
  const totals = stageCounts(allItems);
  const coverage = Math.round((totals.live / Math.max(allItems.length, 1)) * 100);
  const bands = missionBandDefs.map<RoadmapMissionBand>((band) => {
    const items = groups
      .filter((group) => band.groups.includes(group.group))
      .flatMap((group) => group.items);
    const counts = stageCounts(items);
    const meter = items.length ? Math.round((counts.live / items.length) * 100) : 0;
    return {
      ...band,
      items: items.length,
      live: counts.live,
      accepted: counts.accepted,
      planned: counts.planned,
      meter,
      primaryNumbers: items.slice(0, 12).map((item) => item.number),
      terminal: terminalForMissionBand(band, items, counts, meter),
    };
  });

  return {
    headline: "Marked-list mission radar",
    subline: "The crossed-image decisions become four visible operating bands: usage capture, proof/privacy, operator intelligence, and open-source expansion.",
    terminalLines: [
      "+----------------------------------------------------------------+",
      radarLine("VTK://ROADMAP-RADAR//MARKED-LIST//C0VIBE.APP"),
      radarLine(`accepted ${fit(allItems.length, 4)} live ${fit(totals.live, 4)} coverage ${fit(`${coverage}%`, 6)}`),
      radarLine(`bands ${fit(bands.length, 4)} accepted ${fit(totals.accepted, 4)} planned ${fit(totals.planned, 4)}`),
      radarLine("crossed-out marks stay excluded from this product map"),
      radarLine("usage, trust, privacy, ux, open-source stay labelled"),
      radarLine("Vibers Unite // no fake built claims // public roadmap"),
      "+----------------------------------------------------------------+",
    ],
    bands,
    pulses: [
      {
        label: "Marked image filter",
        value: "crossed-out excluded",
        route: "roadmap://accepted-only",
        note: "Only the not-striped items appear in this map.",
      },
      {
        label: "Live coverage",
        value: `${coverage}%`,
        route: "roadmap://stage/live",
        note: "Stage tags are rendered from the accepted roadmap data.",
      },
      {
        label: "Public relay",
        value: "Vibers Unite",
        route: "https://c0vibe.app",
        note: "The public motto appears without mutating usage or rank.",
      },
      {
        label: "Open forge",
        value: "adapter SDK",
        route: "docs/ADAPTER_SDK.md",
        note: "Open-source expansion stays test-backed and contributor-friendly.",
      },
    ],
    invariants: [
      "No crossed-out improvement is promoted as accepted.",
      "Trust and creator evidence remain labelled NOT USAGE.",
      "Planned or accepted items must stay stage-labelled until they are live.",
      "The roadmap is product guidance, not telemetry and not rank input.",
    ],
    totals: {
      items: allItems.length,
      live: totals.live,
      accepted: totals.accepted,
      planned: totals.planned,
      coverage,
      bands: bands.length,
    },
  };
}
