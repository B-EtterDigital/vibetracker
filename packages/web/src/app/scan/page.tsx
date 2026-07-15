import type { CSSProperties, ReactNode } from "react";
import { PROVIDERS } from "../../../../adapters/src/index";
import { CopyChip, ScanDemo } from "./scan-demo";
import "./scan.css";
import "./scan-receipt.css";

export const metadata = {
  title: "Make your scan — VibeUsage",
  description: "Scan your AI usage locally, watch the results reveal, upload only when you choose.",
};

const TRUST_MODEL_URL =
  "https://github.com/B-EtterDigital/vibetracker/blob/main/docs/compliance/TRUST_MODEL.md";

const SCAN_RUNWAY = [
  {
    number: "01",
    label: "map",
    command: "npx vibetrack init --gui",
    body: "Detect local agents and choose only the provider ledgers you want connected.",
    signal: "writes local config",
  },
  {
    number: "02",
    label: "collect",
    command: "npx vibetrack sync --receipt",
    body: "Normalize your enabled sources into one local ledger and seal a private run receipt.",
    signal: "zero automatic uploads",
  },
  {
    number: "03",
    label: "inspect",
    command: "npx vibetrack life",
    body: "Open the full local cockpit: usage, trust, integrity, provider mix, and ROI.",
    signal: "your evidence only",
  },
] as const;

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
    <section className="vscan-hero" key="hero">
      <div className="vscan-hero-status" aria-label="Local scan operating boundaries">
        <span>local ledger</span>
        <span>explicit connectors</span>
        <span>zero automatic uploads</span>
      </div>
      <h1 className="vscan-hero-title">Make your scan.</h1>
      <p className="vscan-hero-lede">
        Build the evidence trail on your machine. Connect only what you use, inspect every
        source, and decide if anything ever leaves.
      </p>

      <div className="vscan-runway-head" aria-hidden="true">
        <span>local scan runway</span>
        <span>copy / run / inspect</span>
      </div>
      <ol className="vscan-runway">
        {SCAN_RUNWAY.map((step) => (
          <li className="vscan-runway-step" key={step.number}>
            <div className="vscan-runway-index">
              <span>{step.number}</span>
              <strong>{step.label}</strong>
            </div>
            <div className="vscan-runway-command">
              <CopyChip
                command={step.command}
                variant={step.number === "01" ? "primary" : "secondary"}
              />
            </div>
            <p>{step.body}</p>
            <span className="vscan-runway-signal">{step.signal}</span>
          </li>
        ))}
      </ol>

      <div className="vscan-demo-launch">
        <div>
          <strong>Want proof before setup?</strong>
          <span>Local agent logs + bundled sample data. No provider accounts required.</span>
        </div>
        <CopyChip command="npx vibetrack sync --demo --receipt" variant="secondary" />
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
        <CopyChip command="npx vibetrack privacy" variant="secondary" />
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
