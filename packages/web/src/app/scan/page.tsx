import type { CSSProperties, ReactNode } from "react";
import { PROVIDERS } from "../../../../adapters/src/index";
import { CopyChip, ScanDemo } from "./scan-demo";
import "./scan.css";

export const metadata = {
  title: "Make your scan — VibeUsage",
  description: "Scan your AI usage locally, watch the results reveal, upload only when you choose.",
};

const TRUST_MODEL_URL =
  "https://github.com/B-EtterDigital/vibetracker/blob/main/docs/compliance/TRUST_MODEL.md";

// One honest sentence per surface the scan reads, written from the truth of how
// each tier is collected.
const READS: { title: string; body: string }[] = [
  {
    title: "Coding agents",
    body: "Reads the session logs your coding agents already keep and splits every run four ways — input, output, cache-write, and cache-read tokens.",
  },
  {
    title: "Hosted AI",
    body: "Pulls ledgers, balances, and usage APIs from connected providers, keeping each figure in its native unit — dollars, credits, characters, or seconds.",
  },
  {
    title: "Local runners",
    body: "Auto-detects local endpoints like Ollama, LM Studio, and ComfyUI and records the work they do at zero cost.",
  },
];

export default function ScanPage() {
  const sections: ReactNode[] = [
    <section className="vscan-panel vscan-hero" key="hero">
      <h1 className="vscan-hero-title">Make your scan.</h1>
      <p className="vscan-hero-lede">
        Everything runs and stays on your machine until you choose to upload.
      </p>
      <div className="vscan-hero-cmds">
        <CopyChip command="npx vibetrack init" variant="primary" />
        <CopyChip
          command="vibetrack sync --demo"
          variant="secondary"
          subLabel="try it with sample data, no accounts"
        />
      </div>
    </section>,

    <ScanDemo key="demo" />,

    <section className="vscan-panel vscan-reads" key="reads">
      <header className="vscan-panel-head">
        <h2 className="vscan-panel-title">what the scan reads</h2>
      </header>
      <div className="vscan-reads-grid">
        {READS.map((read) => (
          <article className="vscan-read-card" key={read.title}>
            <h3 className="vscan-read-title">{read.title}</h3>
            <p className="vscan-read-body">{read.body}</p>
          </article>
        ))}
      </div>
      <div className="vscan-reads-foot">
        <a className="vscan-link" href="/providers">
          see all {PROVIDERS.length} providers →
        </a>
      </div>
    </section>,

    <section className="vscan-panel vscan-privacy" key="privacy">
      <header className="vscan-panel-head">
        <h2 className="vscan-panel-title">local-first, provable</h2>
      </header>
      <p className="vscan-privacy-copy">
        Nothing leaves your machine unless you run upload. Every record carries its source and
        confidence.
      </p>
      <div className="vscan-privacy-actions">
        <CopyChip command="vibetracker privacy" variant="secondary" />
        <a className="vscan-link" href={TRUST_MODEL_URL}>
          read the trust model →
        </a>
      </div>
    </section>,
  ];

  return (
    <section className="vscan" aria-label="Make your scan">
      {sections.map((node, index) => (
        <div className="vscan-slot" style={{ "--panel-i": index } as CSSProperties} key={index}>
          {node}
        </div>
      ))}
    </section>
  );
}
