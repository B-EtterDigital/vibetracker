import { LocalCockpit } from "./local-cockpit";
import "./life.css";
import "./life-guide.css";
import "./life-observatory.css";

export const metadata = {
  title: "Local Usage Observatory · VibeUsage",
  description: "A consent-driven, read-only observatory for the aggregate AI usage ledger on your own machine.",
};

export default function LifePage() {
  return <LocalCockpit />;
}
