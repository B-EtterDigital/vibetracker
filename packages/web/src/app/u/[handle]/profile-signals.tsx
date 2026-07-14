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

  // Three tiers of honesty per read: `self` = the viber declared it (a truth the data can't reveal),
  // `est` = reconstructed from partial data (logs get pruned), and unmarked = measured directly.
  const reads: Array<{ label: string; value: string; note: string; est?: boolean; self?: boolean }> = [];
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
  if (signals.declaredAgents) {
    // The viber told us their real parallel-agent count — show that, not the throughput estimate.
    reads.push({
      label: "Orchestration",
      value: `${signals.declaredAgents} agents`,
      note: `run in parallel · ${agentCount} distinct CLIs · ${crossProviderDays} cross-provider days`,
      self: true,
    });
  } else if (agentCount >= 2) {
    reads.push({
      label: "Orchestration",
      value: `~${signals.peakAgentLoad} agents`,
      note: `peak parallel from the busiest day's throughput — not observed concurrency · ${agentCount} distinct CLIs · ${crossProviderDays} cross-provider days`,
      est: true,
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
  const showEstFootprint = footprint.length > 0 && !signals.declaredSubs;
  const hasEst = reads.some((r) => r.est) || showEstFootprint;
  const hasSelf = reads.some((r) => r.self) || Boolean(signals.declaredSubs);

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
              <span className="vsignals-read-label">
                {r.label}
                {r.self ? <em className="vsignals-self" title="Self-reported by the viber — the data can't reveal this">you</em> : null}
                {r.est ? <em className="vsignals-est" title="Estimated — reconstructed from partial data">est</em> : null}
              </span>
              <strong className="vsignals-read-value">{r.value}</strong>
              <span className="vsignals-read-note">{r.note}</span>
            </div>
          ))}
        </div>
      ) : null}

      {signals.declaredSubs ? (
        <div className="vsignals-footprint">
          <span className="vsignals-footprint-head">
            subscription stack
            <em className="vsignals-self" title="Self-reported by the viber">you</em>
          </span>
          <div className="vsignals-footprint-row">
            {signals.declaredSubs.split(/\s*,\s*/).filter(Boolean).map((s, i) => (
              <span className="vsignals-footprint-item" key={s}>
                {i > 0 ? <i aria-hidden="true">+</i> : null}
                {s}
              </span>
            ))}
          </div>
          <span className="vsignals-footprint-note">what you actually run — declared with vibetracker profile --subs</span>
        </div>
      ) : footprint.length ? (
        <div className="vsignals-footprint">
          <span className="vsignals-footprint-head">
            last 30 days ≈ maxed $200 subscriptions
            <em className="vsignals-est" title="Estimated — reconstructed from partial data">est</em>
          </span>
          <div className="vsignals-footprint-row">
            {footprint.map((f, i) => (
              <span className="vsignals-footprint-item" key={f.label}>
                {i > 0 ? <i aria-hidden="true">+</i> : null}
                <b>{f.count}×</b> {f.label}
              </span>
            ))}
          </div>
          <span className="vsignals-footprint-note">
            generous weekly resets mean one $200 account delivers far more than its price · this estimates throughput, not literal accounts
          </span>
        </div>
      ) : null}

      {hasSelf || hasEst ? (
        <div className="vsignals-legend">
          {hasSelf ? (
            <p><em className="vsignals-self">you</em> self-reported by the viber — a truth the usage data can&apos;t reveal (real parallel-agent count, real subscription stack).</p>
          ) : null}
          {hasEst ? (
            <p><em className="vsignals-est">est</em> parallel load is estimated from token throughput · CLI presence and active days come from the measured cc.json snapshot.</p>
          ) : null}
          <p className="vsignals-legend-measured">Everything unmarked (spend, tokens, commits, generations, cache mix) is measured directly.</p>
        </div>
      ) : null}
    </section>
  );
}
