// Skill Signals — the profile's headline read. Answers "who is this viber and how do they work",
// not "who spent the most". Money is reframed as API-equivalent reference cost, never the flex.

import type { ProfileSignals } from "../../../lib/profile-signals";

function pct(n: number): string {
  if (n >= 0.1) return `${Math.round(n * 100)}%`;
  if (n > 0) return `${(n * 100).toFixed(1)}%`;
  return "0%";
}
function fmtUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

export function SkillSignals({ signals, apiCost }: { signals: ProfileSignals; apiCost: string }) {
  const { humanRatio, cacheReuse, agentCount, crossProviderDays, shipRate, mediaGenerations, footprint } = signals;

  // Ordered skill reads — only the ones we can actually measure for this viber.
  const reads: Array<{ label: string; value: string; note: string }> = [];
  if (signals.hasTokens) {
    reads.push({
      label: "Work style",
      value: humanRatio < 0.18 ? "Agentic" : humanRatio < 0.35 ? "Mixed" : "Hands-on",
      note: `${pct(humanRatio)} of tokens are typed prompts + replies · the rest is agents re-reading context`,
    });
    reads.push({
      label: "Context efficiency",
      value: pct(cacheReuse),
      note: "share of input served from cache instead of re-sent — higher is leaner spend",
    });
  }
  if (agentCount >= 2) {
    reads.push({
      label: "Orchestration",
      value: `${agentCount} agents`,
      note: `${crossProviderDays} days ran 2+ agent CLIs together across providers`,
    });
  }
  if (shipRate != null) {
    reads.push({
      label: "Ship rate",
      value: `${Math.round(shipRate)}/B`,
      note: `git commits per billion tokens — ${signals.commits.toLocaleString("en-US")} commits shipped`,
    });
  }
  if (mediaGenerations >= 400) {
    reads.push({
      label: "Media output",
      value: mediaGenerations >= 1000 ? `${(mediaGenerations / 1000).toFixed(1)}k` : String(mediaGenerations),
      note: "images, video and music generated — creative output, not just code",
    });
  }

  return (
    <section className="vprofile-panel vsignals">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">Signal read</h2>
        <span className="vprofile-panel-sub">what the data says about how you work</span>
      </header>

      <div className="vsignals-hero">
        <div className="vsignals-archetype">
          <span className="vsignals-arch-eyebrow">archetype</span>
          <strong className="vsignals-arch-label">{signals.archetypeLabel}</strong>
          <span className="vsignals-arch-blurb">{signals.archetypeBlurb}</span>
          {signals.archetypes.length >= 2 ? (
            <ul className="vsignals-arch-tags">
              {signals.archetypes.map((a) => <li key={a}>{a}</li>)}
            </ul>
          ) : null}
        </div>

        <div className="vsignals-cost" title="What this usage would cost at published API prices, without a subscription. Not what you paid.">
          <span className="vsignals-cost-eyebrow">API-equivalent cost</span>
          <strong className="vsignals-cost-value">{apiCost}</strong>
          <span className="vsignals-cost-note">reference only — at API list prices, no subscription. Burning budget isn&apos;t the signal.</span>
        </div>
      </div>

      {reads.length ? (
        <div className="vsignals-grid">
          {reads.map((r) => (
            <div className="vsignals-read" key={r.label}>
              <span className="vsignals-read-label">{r.label}</span>
              <strong className="vsignals-read-value">{r.value}</strong>
              <span className="vsignals-read-note">{r.note}</span>
            </div>
          ))}
        </div>
      ) : null}

      {footprint.length ? (
        <div className="vsignals-footprint">
          <span className="vsignals-footprint-head">last 30 days ≈ running in parallel</span>
          <div className="vsignals-footprint-row">
            {footprint.map((f, i) => (
              <span className="vsignals-footprint-item" key={f.label}>
                {i > 0 ? <i aria-hidden="true">+</i> : null}
                <b>{f.count}×</b> {f.label}
              </span>
            ))}
          </div>
          <span className="vsignals-footprint-note">estimated from token volume at maxed-subscription throughput · not exact</span>
        </div>
      ) : null}
    </section>
  );
}
