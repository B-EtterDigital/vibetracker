import type { CSSProperties } from "react";
import { InsightsRunwayConsole } from "../../components/InsightsRunwayConsole";
import type { ProfileView } from "../../lib/data";
import { buildInsightsRunwaySource } from "../../lib/insights-runway";
import {
  buildInsightsBudgetPulse,
  buildInsightsPrivateScopeRadar,
  buildInsightsRoiSwitchboard,
  buildProfileDecisionBoard,
  buildProfileIntelligenceDeck,
  type InsightsBudgetPulse,
  type InsightsPrivateScopeRadar,
  type InsightsRoiSwitchboard,
  type ProfileDecisionBoard,
} from "../../lib/profile-intelligence";

export const metadata = {
  title: "VibeUsage Insights Lab",
  description: "Estimate-only analytics for VibeTRACKER daily pace, forecast, provider efficiency, concentration, and local shadow value.",
};

const insightsLabProfile: ProfileView = {
  handle: "insights-lab",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: false,
  latest: {
    total_usd: 64.5,
    total_credits: 1200,
    record_count: 2400,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 200, credits: 800, usd: 44 },
    { provider: "claude-code", ops: 1800, credits: 300, usd: 14 },
    { provider: "ollama", ops: 400, credits: 100, usd: 6.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 600, credits: 250, usd: 14.5 },
    { date: "2026-07-04", ops: 800, credits: 400, usd: 20 },
    { date: "2026-07-05", ops: 1000, credits: 550, usd: 30 },
  ],
  trustSignals: [],
};

function InsightsDeckPanel({ deck }: { deck: ReturnType<typeof buildProfileIntelligenceDeck> }) {
  return (
    <section className="insights-lab profile-intelligence" aria-label="VibeTRACKER estimate-only insights lab">
      <div className="profile-intelligence__head">
        <span>VTK://INSIGHTS-LAB//ESTIMATE-ONLY//NO-TOTALS-MUTATION</span>
        <b>analytics lab</b>
      </div>
      <div className="profile-intelligence__body">
        <aside className="profile-intelligence__terminal" aria-label="Insights lab terminal">
          <div className="console-top"><span>insights@local</span><b>ESTIMATE ONLY</b></div>
          <pre>{deck.terminalLines.join("\n")}</pre>
          <div className="profile-intelligence__copy">
            <h2>{deck.headline}</h2>
            <p>{deck.subline}</p>
            <small>Sample analytics view. Published profiles use reviewed aggregate rows from their own datastream.</small>
          </div>
        </aside>
        <div className="profile-intelligence__grid" aria-label="Insights lab forecast and efficiency cards">
          {deck.cards.map((card, index) => (
            <article
              className={`profile-intel-card profile-intel-card--${card.tone}`}
              data-impact={card.impact}
              style={{ "--i": index, "--meter": `${card.meter}%` } as CSSProperties}
              key={card.id}
            >
              <div>
                <span>{card.impact === "not_spend" ? "NOT SPEND" : "ESTIMATE"}</span>
                <em>{card.status}</em>
              </div>
              <b>{card.label}</b>
              <strong>{card.value}</strong>
              <p>{card.note}</p>
              <i aria-label={`${card.label} estimate meter ${card.meter} percent`} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightsDecisionRadarPanel({
  deck,
  board,
  pulse,
  roi,
}: {
  deck: ReturnType<typeof buildProfileIntelligenceDeck>;
  board: ProfileDecisionBoard;
  pulse: InsightsBudgetPulse;
  roi: InsightsRoiSwitchboard;
}) {
  const pace = deck.cards.find((card) => card.id === "pace");
  const forecast = deck.cards.find((card) => card.id === "forecast");
  const cheapest = deck.cards.find((card) => card.id === "cheapest");
  const expensive = deck.cards.find((card) => card.id === "expensive");
  const local = deck.cards.find((card) => card.id === "local_shadow");
  const radarNodes = [
    {
      id: "forecast",
      rail: "ESTIMATE",
      label: "Burn forecast",
      value: forecast?.value ?? "$0.00",
      command: "vibetracker insights --forecast",
      note: "Daily aggregate pace becomes a planning signal, never a billing mutation.",
      meter: forecast?.meter ?? 8,
      frames: ["30D   \nPACE  \nSCAN  ", "BURN  \nEST   \nONLY  "],
    },
    {
      id: "spread",
      rail: "ESTIMATE",
      label: "Provider spread",
      value: expensive?.value ?? "n/a",
      command: "vibetracker insights --providers",
      note: `Compare ${cheapest?.value ?? "n/a"} against ${expensive?.value ?? "n/a"} before changing workflows.`,
      meter: expensive?.meter ?? 8,
      frames: ["RATE  \nSPREAD\nWATCH ", "CHEAP \nVS EXP\nNOLOG "],
    },
    {
      id: "local",
      rail: "NOT SPEND",
      label: "Local shadow",
      value: local?.value ?? "$0.00",
      command: "vibetracker insights --local-shadow",
      note: "Local LM Studio, Ollama, and ComfyUI equivalents are context, not spend.",
      meter: local?.meter ?? 8,
      frames: ["LOCAL \nSHADOW\nVALUE ", "NOT   \nSPEND \nRAIL  "],
    },
    {
      id: "review",
      rail: "NO WRITE",
      label: "Review queue",
      value: `${board.totals.actions} actions`,
      command: "vibetracker insights --review",
      note: "Actions are planning cards; they write 0 usage records and change 0 ranks.",
      meter: board.totals.averageMeter,
      frames: ["REVIEW\nQUEUE \nREADY ", "0 USE \nWRITES\nSAFE  "],
    },
  ];
  const terminalLines = [
    "VTK DECISION RADAR // ESTIMATE ONLY",
    "$ vibetracker insights --radar",
    `pace ${pace?.value ?? "waiting"} -> 30d ${forecast?.value ?? "$0.00"}`,
    `rate ${cheapest?.value ?? "n/a"} vs ${expensive?.value ?? "n/a"}`,
    `planning ${roi.totals.planningEstimateUsd.toFixed(2)} // local shadow ${roi.totals.localShadowUsd.toFixed(2)}`,
    `budget lanes ${pulse.totals.lanes} // actions ${board.totals.actions}`,
    `usage writes ${roi.totals.usageWrites} // mutations ${roi.totals.totalMutations}`,
    "Vibers Unite // c0vibe.app",
  ];

  return (
    <section className="insights-decision-radar" aria-label="Estimate-only insights decision radar">
      <div className="insights-decision-radar__head">
        <div>
          <span>VTK://INSIGHTS-DECISION-RADAR//ESTIMATE-ONLY//NO-WRITES</span>
          <b>Decision radar</b>
        </div>
        <p>
          A first-screen control surface for burn, provider spread, local shadow value, and review actions.
          It helps decide what to inspect next without changing usage totals.
        </p>
      </div>
      <div className="insights-decision-radar__body">
        <aside className="insights-decision-radar__terminal" aria-label="Insights decision radar terminal">
          <div className="console-top"><span>radar@insights</span><b>NO WRITES</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="insights-decision-radar__totals" aria-label="Insights decision radar totals">
            <span>{pulse.totals.lanes} budget lanes</span>
            <span>{roi.totals.levers} roi levers</span>
            <span>{board.totals.actions} review actions</span>
            <span>{roi.totals.usageWrites} usage writes</span>
            <span>{roi.totals.totalMutations} mutations</span>
          </div>
        </aside>
        <div className="insights-decision-radar__nodes" aria-label="Estimate-only radar nodes">
          {radarNodes.map((node, index) => (
            <article
              className={`insights-decision-radar-node insights-decision-radar-node--${node.id}`}
              data-rail={node.rail}
              key={node.id}
              style={{ "--i": index, "--meter": `${node.meter}%` } as CSSProperties}
            >
              <div className="insights-decision-radar-node__top">
                <span>{node.rail}</span>
                <b>{node.label}</b>
              </div>
              <div className="insights-decision-radar-node__screen" aria-hidden="true">
                {node.frames.map((frame, frameIndex) => (
                  <pre key={`${node.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <strong>{node.value}</strong>
              <code>{node.command}</code>
              <p>{node.note}</p>
              <footer aria-label={`${node.label} radar meter ${node.meter} percent`}>
                <i />
                <em>{node.meter}%</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function impactLabelForPulse(lane: InsightsBudgetPulse["lanes"][number]): string {
  if (lane.impact === "not_spend") return "NOT SPEND";
  if (lane.impact === "no_write") return "NO WRITE";
  return "ESTIMATE";
}

function impactLabelForScope(lane: InsightsPrivateScopeRadar["lanes"][number]): string {
  if (lane.impact === "no_write") return "NO WRITE";
  return "PRIVATE";
}

function InsightsPrivateScopeRadarPanel({ radar }: { radar: InsightsPrivateScopeRadar }) {
  return (
    <section className="insights-private-scope" aria-label="Local-only private scope radar">
      <div className="insights-private-scope__head">
        <div>
          <span>VTK://INSIGHTS-PRIVATE-SCOPE//ACCOUNT-PROFILE-TEAM//LOCAL-ONLY</span>
          <b>{radar.headline}</b>
        </div>
        <p>{radar.subline}</p>
      </div>
      <div className="insights-private-scope__body">
        <aside className="insights-private-scope__terminal" aria-label="Private scope terminal">
          <div className="console-top"><span>scope@insights</span><b>LOCAL ONLY</b></div>
          <pre>{radar.terminalLines.join("\n")}</pre>
          <div className="insights-private-scope__totals" aria-label="Private scope totals">
            <span>{radar.totals.privateRails} private rails</span>
            <span>{radar.totals.publicWrites} public writes</span>
            <span>{radar.totals.rankMutations} rank mutations</span>
            <span>{radar.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="insights-private-scope__lanes" aria-label="Private account profile and team lanes">
          {radar.lanes.map((lane, index) => (
            <article
              className={`insights-private-scope-lane insights-private-scope-lane--${lane.tone}`}
              data-impact={lane.impact}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="insights-private-scope-lane__top">
                <i>{lane.mark}</i>
                <span>{impactLabelForScope(lane)}</span>
              </div>
              <div className="insights-private-scope-lane__screen" aria-hidden="true">
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{lane.label}</b>
              <strong>{lane.value}</strong>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <div className="insights-private-scope-lane__proof" aria-label={`${lane.label} scope proof`}>
                {lane.proof.map((line) => (
                  <span key={`${lane.id}-${line}`}>{line}</span>
                ))}
              </div>
              <footer aria-label={`${lane.label} private scope meter ${lane.meter} percent`}>
                <i />
                <em>{lane.status}</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightsBudgetPulsePanel({ pulse }: { pulse: InsightsBudgetPulse }) {
  return (
    <section className="insights-budget-pulse" aria-label="No-write AI budget pulse">
      <div className="insights-budget-pulse__head">
        <div>
          <span>VTK://INSIGHTS-LAB//BUDGET-PULSE//NO-WRITES</span>
          <b>{pulse.headline}</b>
        </div>
        <p>{pulse.subline}</p>
      </div>
      <div className="insights-budget-pulse__body">
        <aside className="insights-budget-pulse__terminal" aria-label="Budget pulse terminal">
          <div className="console-top"><span>budget@insights</span><b>0 MUTATIONS</b></div>
          <pre>{pulse.terminalLines.join("\n")}</pre>
          <div className="insights-budget-pulse__totals" aria-label="Budget pulse totals">
            <span>{pulse.totals.lanes} lanes</span>
            <span>{pulse.totals.estimates} estimates</span>
            <span>{pulse.totals.notSpend} not spend</span>
            <span>{pulse.totals.noWrite} no write</span>
            <span>{pulse.totals.usageWrites} usage writes</span>
            <span>{pulse.totals.totalMutations} mutations</span>
          </div>
        </aside>
        <div className="insights-budget-pulse__lanes" aria-label="Budget pulse lanes">
          {pulse.lanes.map((lane, index) => (
            <article
              className={`insights-budget-lane insights-budget-lane--${lane.tone}`}
              data-impact={lane.impact}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="insights-budget-lane__top">
                <i>{lane.mark}</i>
                <span>{impactLabelForPulse(lane)}</span>
              </div>
              <div className="insights-budget-lane__screen" aria-hidden="true">
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{lane.label}</b>
              <strong>{lane.value}</strong>
              <code>{lane.route}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <div className="insights-budget-lane__transcript" aria-label={`${lane.label} budget transcript`}>
                {lane.transcript.map((line) => (
                  <span key={`${lane.id}-${line}`}>{line}</span>
                ))}
              </div>
              <footer aria-label={`${lane.label} budget pulse meter ${lane.meter} percent`}>
                <em />
                <small>{lane.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function impactLabelForRoi(lever: InsightsRoiSwitchboard["levers"][number]): string {
  if (lever.impact === "not_spend") return "NOT SPEND";
  if (lever.impact === "no_write") return "NO WRITE";
  return "ESTIMATE";
}

function InsightsRoiSwitchboardPanel({ roi }: { roi: InsightsRoiSwitchboard }) {
  return (
    <section className="insights-roi-switchboard" aria-label="Estimate-only ROI switchboard">
      <div className="insights-roi-switchboard__head">
        <div>
          <span>VTK://INSIGHTS-ROI-SWITCHBOARD//NO-WRITES//NOT-BILLING</span>
          <b>{roi.headline}</b>
        </div>
        <p>{roi.subline}</p>
      </div>
      <div className="insights-roi-switchboard__body">
        <aside className="insights-roi-terminal" aria-label="ROI switchboard terminal">
          <div className="console-top"><span>roi@insights</span><b>NO WRITES</b></div>
          <pre>{roi.terminalLines.join("\n")}</pre>
          <div className="insights-roi-terminal__totals" aria-label="ROI switchboard totals">
            <span>{roi.totals.levers} levers</span>
            <span>{roi.totals.estimates} estimates</span>
            <span>{roi.totals.notSpend} not spend</span>
            <span>{roi.totals.noWrite} no write</span>
            <span>{roi.totals.usageWrites} usage writes</span>
            <span>{roi.totals.totalMutations} mutations</span>
          </div>
          <div className="insights-roi-terminal__delta" aria-label="ROI planning delta">
            <strong>${roi.totals.planningEstimateUsd.toFixed(2)}</strong>
            <span>planning delta</span>
            <i />
            <strong>${roi.totals.localShadowUsd.toFixed(2)}</strong>
            <span>local shadow / not spend</span>
          </div>
        </aside>
        <div className="insights-roi-levers" aria-label="Estimate-only ROI levers">
          {roi.levers.map((lever, index) => (
            <article
              className={`insights-roi-lever insights-roi-lever--${lever.tone}`}
              data-impact={lever.impact}
              style={{
                "--i": index,
                "--meter": `${lever.meter}%`,
                "--brand-from": lever.from,
                "--brand-to": lever.to,
                "--brand-ink": lever.ink,
              } as CSSProperties}
              key={lever.id}
            >
              <div className="insights-roi-lever__top">
                <i>{lever.mark}</i>
                <span>{impactLabelForRoi(lever)}</span>
              </div>
              <div className="insights-roi-lever__screen" aria-hidden="true">
                {lever.screen.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${lever.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{lever.label}</b>
              <strong>{lever.value}</strong>
              <code>{lever.command}</code>
              <p>{lever.note}</p>
              <small>{lever.guardrail}</small>
              <div className="insights-roi-lever__proof" aria-label={`${lever.label} proof rail`}>
                {lever.proof.map((line) => (
                  <span key={`${lever.id}-${line}`}>{line}</span>
                ))}
              </div>
              <footer aria-label={`${lever.label} ROI meter ${lever.meter} percent`}>
                <i />
                <em>{lever.status}</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightsCostRadarPanel({ deck }: { deck: ReturnType<typeof buildProfileIntelligenceDeck> }) {
  const pace = deck.cards.find((card) => card.id === "pace");
  const forecast = deck.cards.find((card) => card.id === "forecast");
  const cheapest = deck.cards.find((card) => card.id === "cheapest");
  const expensive = deck.cards.find((card) => card.id === "expensive");
  const local = deck.cards.find((card) => card.id === "local_shadow");
  const estimateCards = deck.cards.filter((card) => card.impact === "estimate").length;
  const contextCards = deck.cards.length - estimateCards;
  const terminalLines = [
    "+------------------------------------------------------+",
    "| VTK://COST-RADAR//ESTIMATE-ONLY//NO-TOTALS-MUTATION |",
    `| pace ${pace?.value ?? "waiting"} // 30d ${forecast?.value ?? "$0.00"}                  |`,
    `| compare ${cheapest?.value ?? "n/a"} vs ${expensive?.value ?? "n/a"}                         |`,
    `| local shadow ${local?.value ?? "$0.00"} // NOT SPEND                |`,
    "| visual alerts write 0 records and change 0 ranks     |",
    "| Vibers Unite // c0vibe.app                           |",
    "+------------------------------------------------------+",
  ];

  return (
    <section className="insights-cost-radar" aria-label="Estimate-only cost radar">
      <div className="insights-cost-radar__head">
        <div>
          <span>VTK://INSIGHTS-LAB//COST-RADAR//ESTIMATE-ONLY</span>
          <b>Cost radar</b>
        </div>
        <p>Forecast pressure, provider rate spread, and local shadow value in one labelled command surface. It explains spend shape; it does not mutate totals.</p>
      </div>
      <div className="insights-cost-radar__body">
        <aside className="insights-cost-radar__terminal" aria-label="Cost radar terminal">
          <div className="console-top"><span>radar@insights-lab</span><b>NO TOTALS MUTATION</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="insights-cost-radar__stats" aria-label="Cost radar summary">
            <span>{estimateCards} estimate rails</span>
            <span>{contextCards} not-spend rail</span>
            <span>{deck.cards.length} analytics cards</span>
            <span>0 usage writes</span>
          </div>
          <div className="insights-cost-radar__path" aria-label="Cost radar proof path">
            <span>daily aggregates</span>
            <i />
            <span>rate estimate</span>
            <i />
            <span>review action</span>
          </div>
        </aside>
        <div className="insights-cost-radar__lanes" aria-label="Estimate-only radar lanes">
          {deck.cards.map((card, index) => (
            <article
              className={`insights-radar-lane insights-radar-lane--${card.tone}`}
              data-impact={card.impact}
              style={{ "--i": index, "--meter": `${card.meter}%` } as CSSProperties}
              key={card.id}
            >
              <div>
                <span>{card.impact === "not_spend" ? "NOT SPEND" : "ESTIMATE"}</span>
                <em>{card.status}</em>
              </div>
              <b>{card.label}</b>
              <strong>{card.value}</strong>
              <p>{card.note}</p>
              <footer aria-label={`${card.label} radar meter ${card.meter} percent`}>
                <i />
                <code>{card.id}</code>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function impactLabelFor(action: ProfileDecisionBoard["actions"][number]): string {
  if (action.impact === "not_spend") return "NOT SPEND";
  if (action.impact === "no_write") return "NO WRITE";
  return "ESTIMATE";
}

function InsightsDecisionBoardPanel({ board }: { board: ProfileDecisionBoard }) {
  return (
    <section className="insights-decision-board" aria-label="Estimate-only insights decision board">
      <div className="insights-decision-board__head">
        <div>
          <span>VTK://INSIGHTS-DECISIONS//ESTIMATE-ONLY//NO-WRITES</span>
          <b>{board.headline}</b>
        </div>
        <p>{board.subline}</p>
      </div>
      <div className="insights-decision-board__body">
        <aside className="insights-decision-board__terminal" aria-label="Insights decision terminal">
          <div className="console-top"><span>decisions@insights</span><b>0 WRITES</b></div>
          <pre>{board.terminalLines.join("\n")}</pre>
          <div className="insights-decision-board__totals" aria-label="Insights decision totals">
            <span>{board.totals.actions} actions</span>
            <span>{board.totals.estimate} estimates</span>
            <span>{board.totals.notSpend} not spend</span>
            <span>{board.totals.noWrite} no write</span>
            <span>{board.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="insights-decision-actions" aria-label="Recommended estimate-only decisions">
          {board.actions.map((action, index) => (
            <article
              className={`insights-decision-action insights-decision-action--${action.tone}`}
              data-impact={action.impact}
              style={{ "--i": index, "--meter": `${action.meter}%` } as CSSProperties}
              key={action.id}
            >
              <div className="insights-decision-action__top">
                <span>{impactLabelFor(action)}</span>
                <em>{action.status}</em>
              </div>
              <b>{action.label}</b>
              <strong>{action.value}</strong>
              <code>{action.command}</code>
              <p>{action.note}</p>
              <small>{action.proof}</small>
              <div className="insights-decision-action__marks" aria-label={`${action.label} decision marks`}>
                {action.marks.map((mark, markIndex) => (
                  <i style={{ "--i": markIndex } as CSSProperties} key={`${action.id}-${mark}-${markIndex}`}>{mark}</i>
                ))}
              </div>
              <footer aria-label={`${action.label} decision confidence ${action.meter} percent`}>
                <i />
                <span>{action.id}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function InsightsPage() {
  const deck = buildProfileIntelligenceDeck(insightsLabProfile);
  const budgetPulse = buildInsightsBudgetPulse(insightsLabProfile);
  const roiSwitchboard = buildInsightsRoiSwitchboard(insightsLabProfile);
  const privateScopeRadar = buildInsightsPrivateScopeRadar(insightsLabProfile);
  const decisionBoard = buildProfileDecisionBoard(insightsLabProfile);
  const runwaySource = buildInsightsRunwaySource(insightsLabProfile);

  return (
    <>
      <section className="insights-route-intro" aria-label="VibeTRACKER insights lab introduction">
        <div>
          <p className="eyebrow">Insights lab</p>
          <h1>Forecasts, rates, and savings without fake certainty</h1>
          <p>
            VibeTRACKER should help people understand their AI life, not just collect totals.
            This lab shows daily pace, 30-day forecast, cheapest source, most expensive workflow,
            provider focus, and local shadow value while keeping every estimate labelled.
          </p>
        </div>
        <div className="motto-rail" aria-label="Insights lab motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>ESTIMATE ONLY</code>
        </div>
      </section>
      <InsightsRunwayConsole
        forecastUsd={runwaySource.forecastUsd}
        localShadowUsd={runwaySource.localShadowUsd}
        topProvider={runwaySource.topProvider}
      />
      <InsightsDecisionRadarPanel deck={deck} board={decisionBoard} pulse={budgetPulse} roi={roiSwitchboard} />
      <InsightsPrivateScopeRadarPanel radar={privateScopeRadar} />
      <InsightsBudgetPulsePanel pulse={budgetPulse} />
      <InsightsRoiSwitchboardPanel roi={roiSwitchboard} />
      <InsightsCostRadarPanel deck={deck} />
      <InsightsDecisionBoardPanel board={decisionBoard} />
      <InsightsDeckPanel deck={deck} />
    </>
  );
}
