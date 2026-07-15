import type {
  AcceptedImprovement,
  ImprovementGroup,
  ImprovementStage,
} from "../../../core/src/capabilities/roadmap.ts";

export interface RoadmapNavigatorLane {
  id: ImprovementGroup;
  label: string;
  items: AcceptedImprovement[];
  counts: Record<ImprovementStage, number>;
  liveCoverage: number;
}

export interface RoadmapReleaseNavigator {
  headline: string;
  sourceLabel: string;
  sourceNote: string;
  fingerprint: string;
  lanes: RoadmapNavigatorLane[];
  excludedNumbers: number[];
  totals: {
    items: number;
    lanes: number;
    live: number;
    accepted: number;
    planned: number;
    excluded: number;
  };
  invariants: string[];
}

type RoadmapGroup = {
  group: ImprovementGroup;
  label: string;
  items: AcceptedImprovement[];
};

function fingerprint(parts: Array<string | number>): string {
  let hash = 2166136261;
  for (const char of parts.join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

export function buildRoadmapReleaseNavigator(
  groups: RoadmapGroup[],
  excludedNumbers: readonly number[],
): RoadmapReleaseNavigator {
  const lanes = groups.map((group): RoadmapNavigatorLane => {
    const counts = {
      live: group.items.filter((item) => item.stage === "live").length,
      accepted: group.items.filter((item) => item.stage === "accepted").length,
      planned: group.items.filter((item) => item.stage === "planned").length,
    };
    return {
      id: group.group,
      label: group.label,
      items: group.items.map((item) => ({ ...item })),
      counts,
      liveCoverage: group.items.length ? Math.round((counts.live / group.items.length) * 100) : 0,
    };
  });
  const items = lanes.flatMap((lane) => lane.items);
  const live = items.filter((item) => item.stage === "live").length;
  const accepted = items.filter((item) => item.stage === "accepted").length;
  const planned = items.filter((item) => item.stage === "planned").length;
  const exclusions = Array.from(new Set(excludedNumbers.filter((number) => Number.isInteger(number) && number > 0))).sort((a, b) => a - b);

  return {
    headline: "Capability release navigator",
    sourceLabel: "core capability manifest",
    sourceNote: "This source records capability state, not delivery dates. No ETA, quarter, or release promise is encoded.",
    fingerprint: fingerprint([
      ...items.map((item) => `${item.number}:${item.group}:${item.stage}:${item.title}`),
      ...exclusions.map((number) => `excluded:${number}`),
    ]),
    lanes,
    excludedNumbers: exclusions,
    totals: {
      items: items.length,
      lanes: lanes.length,
      live,
      accepted,
      planned,
      excluded: exclusions.length,
    },
    invariants: [
      "Live means an implementation path is named in the capability manifest.",
      "Accepted and planned remain zero until the source manifest says otherwise.",
      "Excluded numbers are decisions from the marked source, not hidden shipped features.",
      "Trust, contributor credit, and identity proof never become usage or rank input.",
    ],
  };
}
