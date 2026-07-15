import { ScoreLab } from "./score-lab";
import "./score.css";
import "./score-brief.css";
import "./score-controls.css";
import "./score-responsive.css";

export const metadata = {
  title: "Inspectable Vibe Score · VibeUsage",
  description: "Tune real usage factors and inspect the exact Vibe Score receipt without changing usage, trust, or public data.",
};

export default function ScorePage() {
  return <ScoreLab />;
}
