import type { Metadata } from "next";
import {
  EXCLUDED_MARKED_IMPROVEMENT_NUMBERS,
  roadmapGroups,
} from "../../../../core/src/capabilities/roadmap";
import { buildRoadmapReleaseNavigator } from "../../lib/roadmap-release-navigator";
import { RoadmapBlueprint } from "./roadmap-blueprint";
import { RoadmapNavigator } from "./roadmap-navigator";
import "./roadmap-navigator.css";

export const metadata: Metadata = {
  title: "Capability Roadmap | VibeUsage",
  description: "An honest navigator for shipped, accepted, planned, and excluded VibeTRACKER capabilities.",
};

export default function RoadmapPage() {
  const navigator = buildRoadmapReleaseNavigator(roadmapGroups(), EXCLUDED_MARKED_IMPROVEMENT_NUMBERS);

  return (
    <div className="roadmap-route">
      <RoadmapNavigator navigator={navigator} />
      <details className="roadmap-blueprint">
        <summary>
          <span>FULL TECHNICAL APPENDIX</span>
          <b>Open the 73-item capability control room</b>
          <small>Mission radar, command lanes, source numbers, implementation notes, and exclusions.</small>
        </summary>
        <div className="roadmap-blueprint__content"><RoadmapBlueprint /></div>
      </details>
    </div>
  );
}
