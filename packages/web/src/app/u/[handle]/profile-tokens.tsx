// Token breakdown + cross-provider delegation panels.
//
// Token breakdown — the real input / output / cache-read / cache-creation split of every token
// the viber's coding models processed (proportions from ccusage, scaled to the full-history token
// total), plus the per-provider split. Cache-read dominating is the honest signature of heavy
// agentic coding (each turn re-reads its context).
//
// Delegation — the coding-agent CLIs that produced the work (Codex, Claude, Hermes, OpenClaw,
// Gemini, OpenCode) by active days and cost. This is the cross-provider orchestration surface: for
// an SMOA-style workflow it shows the planner/workforce split (Claude plans, Codex executes) and
// how many days ran two or more agents together.

const TOKEN_ROWS = [
  { key: "input", label: "Input", color: "#f5a623" },
  { key: "output", label: "Output", color: "#ea7317" },
  { key: "cacheRead", label: "Cache read", color: "#36e39b" },
  { key: "cacheCreation", label: "Cache creation", color: "#9f7cff" },
] as const;

const AGENT_LABEL: Record<string, string> = {
  codex: "Codex", claude: "Claude Code", "claude-code": "Claude Code",
  hermes: "Hermes", openclaw: "OpenClaw", gemini: "Gemini", opencode: "OpenCode", "gemini-cli": "Gemini",
};
const AGENT_COLOR: Record<string, string> = {
  codex: "#3b82f6", claude: "#ea7317", "claude-code": "#ea7317",
  hermes: "#9f7cff", openclaw: "#ef4444", gemini: "#f5d020", opencode: "#36e39b",
};
const PROVIDER_LABEL: Record<string, string> = {
  codex: "Codex", "claude-code": "Claude Code", openclaw: "OpenClaw", openai: "OpenAI", openrouter: "OpenRouter",
};

function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}
function fmtUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
}

export interface TokenScope {
  scope: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

export function TokenBreakdown({ breakdown, totalTokens }: { breakdown: TokenScope[]; totalTokens: number }) {
  const total = breakdown.find((t) => t.scope === "total");
  if (!total) return null;
  const byProvider = breakdown
    .filter((t) => t.scope !== "total")
    .map((t) => ({ ...t, sum: t.input + t.output + t.cacheRead + t.cacheCreation }))
    .sort((a, b) => b.sum - a.sum);
  const max = Math.max(total.input, total.output, total.cacheRead, total.cacheCreation, 1);

  return (
    <section className="vprofile-panel vtok">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">Token breakdown</h2>
        <span className="vprofile-panel-sub">{fmtTokens(totalTokens)} tokens total</span>
      </header>

      <div className="vtok-rows">
        {TOKEN_ROWS.map((row) => {
          const value = total[row.key];
          return (
            <div className="vtok-row" key={row.key}>
              <div className="vtok-line">
                <span className="vtok-label">{row.label}</span>
                <span className="vtok-value">{fmtTokens(value)}</span>
              </div>
              <div className="vtok-track">
                <span className="vtok-fill" style={{ width: `${Math.max(1.5, (value / max) * 100)}%`, background: row.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {byProvider.length ? (
        <div className="vtok-providers">
          <span className="vtok-providers-head">by provider</span>
          {byProvider.map((p) => (
            <span className="vtok-provider" key={p.scope}>
              {PROVIDER_LABEL[p.scope] ?? p.scope}
              <b>{fmtTokens(p.sum)}</b>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export interface AgentRow {
  agent: string;
  activeDays: number;
  cost: number;
  tokens: number;
}

export function Delegation({ agents, crossProviderDays }: { agents: AgentRow[]; crossProviderDays: number; activeDays?: number }) {
  if (!agents.length) return null;
  const ranked = agents.slice().sort((a, b) => b.activeDays - a.activeDays || b.cost - a.cost);
  const maxDays = Math.max(...ranked.map((a) => a.activeDays), 1);
  const orchestrator = ranked.slice().sort((a, b) => b.cost - a.cost).find((a) => /claude/.test(a.agent));
  const workforce = ranked.slice().sort((a, b) => b.cost - a.cost).find((a) => !/claude/.test(a.agent));

  return (
    <section className="vprofile-panel vdeleg">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">Cross-provider orchestration</h2>
        <span className="vprofile-panel-sub">{ranked.length} agents · delegation surface</span>
      </header>

      <div className="vdeleg-headline">
        <div className="vdeleg-stat">
          <strong>{crossProviderDays}</strong>
          <span>days ran 2+ agents together</span>
        </div>
        {orchestrator && workforce ? (
          <p className="vdeleg-flow">
            <span style={{ color: AGENT_COLOR[orchestrator.agent] }}>{AGENT_LABEL[orchestrator.agent] ?? orchestrator.agent}</span>
            <i aria-hidden="true">→</i>
            <span style={{ color: AGENT_COLOR[workforce.agent] }}>{AGENT_LABEL[workforce.agent] ?? workforce.agent}</span>
            <em>plans → executes</em>
          </p>
        ) : null}
      </div>

      <div className="vdeleg-rows">
        {ranked.map((a) => (
          <div className="vdeleg-row" key={a.agent}>
            <div className="vdeleg-line">
              <i className="vdeleg-dot" style={{ background: AGENT_COLOR[a.agent] ?? "#7a8a93" }} aria-hidden="true" />
              <span className="vdeleg-name">{AGENT_LABEL[a.agent] ?? a.agent}</span>
              <span className="vdeleg-meta">{a.activeDays}d{a.cost >= 1 ? ` · ${fmtUsd(a.cost)}` : ""}{a.tokens >= 1e6 ? ` · ${fmtTokens(a.tokens)}` : ""}</span>
            </div>
            <div className="vdeleg-track">
              <span className="vdeleg-fill" style={{ width: `${Math.max(2, (a.activeDays / maxDays) * 100)}%`, background: AGENT_COLOR[a.agent] ?? "#7a8a93" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="vdeleg-note">active days per agent CLI · usage evidence of how work is split across providers</p>
    </section>
  );
}
