import { PROVIDERS } from "../../../../adapters/src/registry";
import { SourceStackComposer } from "./stack-composer";
import { buildSourceCandidates } from "./stack-composer-data";
import "./sources.css";
import "./stack-composer.css";

export const metadata = {
  title: "Compose your AI source stack · VibeUsage",
  description: "Choose the AI tools you use and generate a truthful, local-first VibeUsage setup runbook.",
};

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

export default function SourcesPage() {
  const candidates = buildSourceCandidates(PROVIDERS);
  const counts = candidates.reduce(
    (result, candidate) => ({ ...result, [candidate.path]: result[candidate.path] + 1 }),
    { connect: 0, detect: 0, manual: 0, planned: 0 },
  );
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const terminal = [
    "+--------------------------------------------------+",
    "| VTRK://SOURCE-COMPOSER/LOCAL-FIRST              |",
    "|--------------------------------------------------|",
    `| mapped ${fit(PROVIDERS.length, 5)} adapters ${fit(counts.connect, 5)} verified ${fit(verified, 4)} |`,
    `| detect ${fit(counts.detect, 5)} manual   ${fit(counts.manual, 5)} planned  ${fit(counts.planned, 4)} |`,
    "|--------------------------------------------------|",
    "| select -> review -> receipt -> explicit publish  |",
    "+--------------------------------------------------+",
  ].join("\n");

  return (
    <>
      <section className="stack-page-hero" aria-labelledby="sources-title">
        <div className="stack-page-hero__copy">
          <p className="eyebrow">Source setup workbench</p>
          <h1 id="sources-title">Compose your source stack.</h1>
          <p>Choose the tools you actually use. Get one reviewable local runbook with honest adapter, detection, manual, and planned boundaries.</p>
          <div className="stack-page-hero__rail" aria-label="Source composer guarantees">
            <span>no account required</span>
            <span>no provider calls</span>
            <span>no hidden upload</span>
          </div>
        </div>
        <div className="stack-page-hero__terminal" aria-label="Source registry terminal summary">
          <div className="console-top"><span>sources@vibetracker</span><b>RUNBOOK MODE</b></div>
          <pre>{terminal}</pre>
        </div>
      </section>

      <SourceStackComposer providers={PROVIDERS} />

      <nav className="stack-route-footer" aria-label="Continue source setup">
        <div><span>inspect every label</span><a href="/providers">provider status board →</a></div>
        <div><span>see collection happen</span><a href="/scan">local scan preview →</a></div>
        <div><span>audit the boundary</span><a href="/proof">proof center →</a></div>
      </nav>
    </>
  );
}
