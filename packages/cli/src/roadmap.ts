import {
  ACCEPTED_IMPROVEMENTS,
  GROUP_LABELS,
  roadmapGroups,
  roadmapSummary,
  type ImprovementGroup,
} from "../../core/src/capabilities/roadmap.ts";
import { formatTable } from "./format.ts";

export function renderAcceptedRoadmap(opts: { group?: string } = {}): string {
  const group = opts.group as ImprovementGroup | undefined;
  const groups = roadmapGroups().filter((entry) => !group || entry.group === group);
  const summary = roadmapSummary();
  if (group && !(group in GROUP_LABELS)) {
    return `unknown roadmap group: ${opts.group}\nvalid groups: ${Object.keys(GROUP_LABELS).join(", ")}`;
  }
  const blocks = [
    "VIBETRACKER ACCEPTED ROADMAP",
    `${summary.total} selected improvements from the marked list · ${summary.live} live · ${summary.accepted} accepted · ${summary.planned} planned`,
    "",
  ];
  for (const entry of groups) {
    blocks.push(entry.label);
    blocks.push(formatTable(
      ["#", "STAGE", "CAPABILITY", "NOTE"],
      entry.items.map((item) => [
        String(item.number),
        item.stage,
        item.title,
        item.note,
      ]),
    ));
    blocks.push("");
  }
  blocks.push("Use --json for machine-readable output. Manual-only and ⚠ provider paths are clearly labelled and are not claimed as verified API proof.");
  return blocks.join("\n").trimEnd();
}

export function roadmapJson(): unknown {
  return {
    summary: roadmapSummary(),
    items: ACCEPTED_IMPROVEMENTS,
  };
}
