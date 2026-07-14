import { LocalCockpit } from "./local-cockpit";
import "./life.css";
import "./life-guide.css";

export const metadata = {
  title: "Local AI Usage Cockpit - VibeUsage",
  description: "A consent-driven, read-only cockpit for the aggregate AI usage ledger on your own machine.",
};

export default function LifePage() {
  return <LocalCockpit />;
}
