import { buildAsciiMotionLab } from "../../lib/ascii-motion-lab.ts";
import { MotionSequencer } from "./motion-sequencer";
import "./motion.css";
import "./motion-controls.css";
import "./motion-responsive.css";

export const metadata = {
  title: "ASCII Motion Sequencer · VibeUsage",
  description: "Play, inspect, and credit VibeTRACKER's visual-only terminal motion cues without touching usage or proof.",
};

export default function MotionPage() {
  return <MotionSequencer lab={buildAsciiMotionLab()} />;
}
