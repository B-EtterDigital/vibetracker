import type { CSSProperties } from "react";
import { CopyChip } from "./life-chips";
import "./life.css";

export const metadata = {
  title: "VibeUsage AI Life",
  description:
    "One picture of your whole AI practice: creation, coding, local labs, research, regional providers, and public proof.",
};

interface Rail {
  id: string;
  label: string;
  line: string;
  command: string;
}

// Six calm practice rails. Each keeps its own real CLI command; usage, trust,
// local-only, and publish stay labelled and never collapse into one number.
const RAILS: Rail[] = [
  {
    id: "creator",
    label: "Creator studio",
    line: "Video, image, voice, music, and 3D usage sits beside your coding spend.",
    command: "vibetracker sync",
  },
  {
    id: "builder",
    label: "Builder desk",
    line: "Coding agents and GitHub-grade activity, tracked with the full token split.",
    command: "vibetracker trust list",
  },
  {
    id: "local",
    label: "Local AI lab",
    line: "Ollama, LM Studio, ComfyUI, and LAN runners, detected and tracked at zero cost.",
    command: "vibetracker detect",
  },
  {
    id: "research",
    label: "Research desk",
    line: "Notes, citations, and exports for the people whose output is knowledge.",
    command: "vibetracker export --format md",
  },
  {
    id: "regional",
    label: "Regional frontier",
    line: "Chinese, European, and global labs get first-class rails, not footnotes.",
    command: "vibetracker providers --all",
  },
  {
    id: "relay",
    label: "Public relay",
    line: "Preview exactly what an upload would publish before anything leaves.",
    command: "vibetracker upload --dry-run",
  },
];

export default function LifePage() {
  return (
    <section className="vlife" aria-label="Your whole AI practice">
      <section className="vlife-panel vlife-hero" style={{ "--panel-i": 0 } as CSSProperties}>
        <h1>Your whole AI practice, not just coding spend</h1>
        <p>Six rails, one tracker. Usage, trust, local-only, and publish stay separate and labeled.</p>
      </section>

      <section className="vlife-rails" style={{ "--panel-i": 1 } as CSSProperties}>
        {RAILS.map((rail) => (
          <article className="vlife-panel vlife-card" key={rail.id}>
            <span className="vlife-card-label">{rail.label}</span>
            <p className="vlife-card-line">{rail.line}</p>
            <CopyChip command={rail.command} />
          </article>
        ))}
      </section>

      <section className="vlife-panel vlife-strip" style={{ "--panel-i": 2 } as CSSProperties}>
        <p>usage · trust · local-only · publish — four rails, never mixed.</p>
      </section>

      <section className="vlife-panel vlife-cta" style={{ "--panel-i": 3 } as CSSProperties}>
        <p className="vlife-cta-title">See it live</p>
        <div className="vlife-cta-actions">
          <a className="vlife-link" href="/u/anonymous">a live profile →</a>
          <a className="vlife-link" href="/providers">the provider directory →</a>
          <CopyChip command="npx vibetrack init" />
        </div>
      </section>
    </section>
  );
}
