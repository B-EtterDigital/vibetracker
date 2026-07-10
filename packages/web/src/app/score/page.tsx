import type { CSSProperties } from "react";
import type { ProfileView } from "../../lib/data";
import {
  buildVibeScoreCalibrationChamber,
  buildVibeScoreMixerConsole,
  buildVibeScoreReceipt,
  buildVibeScoreReactor,
} from "../../lib/vibe-score";
import { providerBrand } from "../../lib/provider-brand";

export const metadata = {
  title: "VibeUsage Score Lab",
  description: "A terminal GUI lab for inspecting how VibeTRACKER turns reviewed usage aggregates into a labelled Vibe Score.",
};

const scoreLabProfile: ProfileView = {
  handle: "score-lab",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: false,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: new Date().toISOString(),
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 320, credits: 240, usd: 18.2 },
    { provider: "replicate", ops: 410, credits: 380, usd: 13.6 },
    { provider: "ollama", ops: 470, credits: 260, usd: 0 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 280, credits: 160, usd: 9.2 },
    { date: "2026-07-04", ops: 430, credits: 320, usd: 14.1 },
    { date: "2026-07-05", ops: 490, credits: 400, usd: 19.2 },
  ],
  trustSignals: [
    {
      kind: "github_activity",
      source: "github_cli",
      label: "GitHub activity evidence (not AI usage)",
      handle: "score-lab",
      fetchedAt: "2026-07-05T12:00:00Z",
      from: "2026-06-06",
      to: "2026-07-05",
      windowDays: 30,
      totalContributions: 84,
      commitContributions: 52,
      issueContributions: 4,
      pullRequestContributions: 18,
      pullRequestReviewContributions: 10,
      repositoryContributions: 0,
      days: [],
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
    },
    {
      kind: "higgsfield_mcp",
      source: "codex_mcp",
      label: "Higgsfield MCP connection evidence (not AI usage)",
      provider: "higgsfield",
      mcpName: "higgsfield",
      auth: "oauth",
      enabled: true,
      transport: "stdio",
      urlHost: "mcp.higgsfield.ai",
      fetchedAt: "2026-07-05T12:00:00Z",
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.",
    },
  ],
};

function scoreLabInt(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function scoreLabMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
}

function scoreFlightLine(text: string, width = 74): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function ScoreDatastreamRelayPanel({
  profile,
  mixer,
  receipt,
}: {
  profile: ProfileView;
  mixer: ReturnType<typeof buildVibeScoreMixerConsole>;
  receipt: ReturnType<typeof buildVibeScoreReceipt>;
}) {
  const maxOps = Math.max(1, ...profile.providers.map((provider) => provider.ops));
  const trustLane = mixer.lanes.find((lane) => lane.id === "trust-side-rail");
  const publishLane = mixer.lanes.find((lane) => lane.id === "public-surfaces");
  const scoreLanes = mixer.lanes.filter((lane) => lane.status === "scores");
  const terminalLines = [
    "+--------------------------------------------------------------------+",
    "| VTK://SCORE-RELAY//DATASTREAM-FEEDS-SCORE-AND-PROFILE             |",
    `| accepted ${String(profile.latest?.record_count ?? 0).padStart(5, " ")} rows // ${scoreLabMoney(profile.latest?.total_usd ?? 0).padEnd(10)} // ${receipt.score}/100 score |`,
    "| usage rails -> formula -> profile + score + heatgrid               |",
    "| trust rail -> display context only -> +0 score +0 spend +0 rank    |",
    "| Vibers Unite // C0vibe.app // no prompt bodies leave the machine   |",
    "+--------------------------------------------------------------------+",
  ];

  return (
    <section className="score-datastream-relay" aria-label="Vibe Score datastream relay theatre">
      <div className="score-datastream-relay__head">
        <div>
          <span>VTK://SCORE-LAB//DATASTREAM-RELAY//PROFILE-AND-SCORE-SAME-RECEIPT</span>
          <b>Datastream relay theatre</b>
        </div>
        <p>The visual relay makes the contract obvious: provider aggregates feed score and profile surfaces; trust evidence rides beside them with a permanent NOT USAGE label.</p>
      </div>
      <div className="score-datastream-relay__body">
        <aside className="score-datastream-relay__terminal" aria-label="Score datastream relay terminal">
          <div className="console-top"><span>relay@score-lab</span><b>{mixer.seal}</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="score-datastream-relay__totals" aria-label="Score datastream relay totals">
            <span>{scoreLabInt(profile.latest?.record_count ?? 0)} usage rows</span>
            <span>{scoreLabInt(profile.usageDays.length)} daily rows</span>
            <span>{scoreLabInt(profile.providers.length)} providers</span>
            <span>{scoreLabInt(profile.trustSignals.length)} trust side signals</span>
          </div>
          <div className="score-datastream-relay__fanout" aria-label="Score datastream public fanout">
            {mixer.outputs.map((output) => (
              <article key={output.label}>
                <span>{output.label}</span>
                <strong>{output.value}</strong>
                <code>{output.route}</code>
              </article>
            ))}
          </div>
        </aside>
        <div className="score-datastream-relay__stage" aria-label="Score datastream relay stage">
          <div className="score-relay-providers" aria-label="Branded provider usage pulses">
            {profile.providers.map((provider, index) => {
              const brand = providerBrand(provider.provider);
              return (
                <article
                  className="score-relay-provider"
                  style={{
                    "--brand-from": brand.from,
                    "--brand-to": brand.to,
                    "--brand-ink": brand.ink,
                    "--i": index,
                    "--meter": `${Math.round((provider.ops / maxOps) * 100)}%`,
                  } as CSSProperties}
                  key={provider.provider}
                >
                  <span>{brand.mark}</span>
                  <b>{provider.provider}</b>
                  <strong>{scoreLabInt(provider.ops)} ops</strong>
                  <small>{scoreLabMoney(provider.usd)} // {scoreLabInt(provider.credits)} credits</small>
                  <i aria-hidden="true" />
                </article>
              );
            })}
          </div>
          <div className="score-relay-circuit" aria-label="Score relay circuit gates">
            {scoreLanes.map((lane, index) => (
              <article
                className={`score-relay-gate score-relay-gate--${lane.tone}`}
                data-status={lane.status}
                style={{ "--i": index, "--meter": `${lane.meter}%` } as CSSProperties}
                key={lane.id}
              >
                <span>{lane.statusLabel}</span>
                <b>{lane.label}</b>
                <strong>{lane.contribution}</strong>
                <code>{lane.route}</code>
                <footer><i /><em>{lane.meter}%</em></footer>
              </article>
            ))}
          </div>
          <div className="score-relay-guard" aria-label="Trust side rail quarantine">
            <article data-impact="not_usage">
              <span>{trustLane?.statusLabel ?? "NOT USAGE"}</span>
              <b>{trustLane?.label ?? "Trust side rail"}</b>
              <strong>{trustLane?.contribution ?? "+0 score"}</strong>
              <code>{trustLane?.route ?? "trust signals -> labelled context"}</code>
              <p>{trustLane?.note ?? "Trust evidence is visible context only and never changes score totals."}</p>
            </article>
            <article data-impact="publish">
              <span>{publishLane?.statusLabel ?? "OUTPUT"}</span>
              <b>{publishLane?.label ?? "Public surface fanout"}</b>
              <strong>{publishLane?.value ?? `${receipt.score}/100`}</strong>
              <code>{publishLane?.route ?? "one receipt -> all public surfaces"}</code>
              <p>Same receipt feeds `/u/[handle]`, `/score`, heatgrid rhythm, and labelled trust context.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreFormulaFlightRecorderPanel({
  receipt,
  reactor,
  mixer,
  calibration,
}: {
  receipt: ReturnType<typeof buildVibeScoreReceipt>;
  reactor: ReturnType<typeof buildVibeScoreReactor>;
  mixer: ReturnType<typeof buildVibeScoreMixerConsole>;
  calibration: ReturnType<typeof buildVibeScoreCalibrationChamber>;
}) {
  const scoreFactors = receipt.factors.filter((factor) => factor.impact === "score");
  const border = `+${"-".repeat(76)}+`;
  const terminalLines = [
    border,
    scoreFlightLine("VTK://SCORE-FLIGHT-RECORDER//FORMULA-DELTAS//NO-TRUST-MUTATION"),
    scoreFlightLine(`score ${String(receipt.score).padStart(3, "0")}/100 // tier ${receipt.tier} // seal ${reactor.seal}`),
    scoreFlightLine("usage + rhythm + coverage + freshness = public score"),
    scoreFlightLine("trust side rail remains labelled context: delta +0 score"),
    scoreFlightLine(`score delta ${calibration.totals.scoreDelta}/100 // trust delta ${calibration.totals.trustDelta}`),
    scoreFlightLine("promptReads 0 // outputReads 0 // hiddenUploads 0 // rankWrites 0"),
    scoreFlightLine("one reviewed datastream -> profile score heatgrid trust labels"),
    scoreFlightLine("Vibers Unite // C0vibe.app // inspect before publish"),
    border,
  ];
  const mutationLocks = [
    { label: "trustDelta", value: `+${calibration.totals.trustDelta} score` },
    { label: "rankWrites", value: "0" },
    { label: "usageWrites", value: String(calibration.totals.usageWrites) },
    { label: "publicWrites", value: String(calibration.totals.publicWrites) },
    { label: "promptReads", value: "0" },
    { label: "hiddenUploads", value: "0" },
  ];

  return (
    <section className="score-flight-recorder" aria-label="Vibe Score formula flight recorder">
      <div className="score-flight-recorder__head">
        <div>
          <span>VTK://SCORE-LAB//FORMULA-FLIGHT-RECORDER//ZERO-MUTATION</span>
          <b>Formula flight recorder</b>
        </div>
        <p>The score path is written like a black box transcript: every visible delta is listed, and every non-usage rail is locked to zero mutation.</p>
      </div>
      <div className="score-flight-recorder__body">
        <aside className="score-flight-recorder__terminal" aria-label="Score formula flight recorder terminal">
          <div className="console-top"><span>flight-recorder@score-lab</span><b>NO TRUST MUTATION</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="score-flight-recorder__seal" aria-label="Score flight recorder seal">
            <span>{receipt.score}/100</span>
            <code>{reactor.seal}</code>
          </div>
          <div className="score-flight-recorder__locks" aria-label="Score flight recorder mutation locks">
            {mutationLocks.map((lock) => (
              <span key={lock.label}>
                <b>{lock.label}</b>
                <strong>{lock.value}</strong>
              </span>
            ))}
          </div>
        </aside>
        <div className="score-flight-recorder__deck" aria-label="Score formula delta deck">
          <div className="score-flight-recorder__equation" aria-label="Score formula equation">
            <span>formula</span>
            <strong>{scoreFactors.map((factor) => factor.label.toLowerCase()).join(" + ")}</strong>
            <b>{receipt.score}/100</b>
          </div>
          <div className="score-flight-recorder__deltas" aria-label="Score formula deltas">
            {receipt.factors.map((factor, index) => (
              <article
                className={`score-flight-delta score-flight-delta--${factor.tone}`}
                data-impact={factor.impact}
                style={{ "--i": index, "--meter": `${factor.max ? Math.round((factor.points / factor.max) * 100) : 0}%` } as CSSProperties}
                key={factor.id}
              >
                <span>{factor.impact === "not_usage" ? "NOT USAGE" : "SCORE DELTA"}</span>
                <b>{factor.label}</b>
                <strong>{factor.impact === "not_usage" ? "+0 score" : `+${factor.points} score`}</strong>
                <code>{factor.value}</code>
                <p>{factor.note}</p>
                <footer aria-label={`${factor.label} flight recorder meter ${factor.points} of ${factor.max}`}>
                  <i />
                  <em>{factor.impact === "not_usage" ? "locked +0" : `${factor.points}/${factor.max}`}</em>
                </footer>
              </article>
            ))}
          </div>
          <div className="score-flight-recorder__fanout" aria-label="Score flight recorder output fanout">
            {mixer.outputs.map((output) => (
              <article key={output.label}>
                <span>{output.label}</span>
                <strong>{output.value}</strong>
                <code>{output.route}</code>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VibeScoreReceiptPanel({ receipt }: { receipt: ReturnType<typeof buildVibeScoreReceipt> }) {
  return (
    <section className={`score-lab-receipt profile-vibe-score profile-vibe-score--${receipt.tier}`} aria-label="Vibe Score formula lab receipt">
      <div className="profile-vibe-score__head">
        <span>VTK://SCORE-LAB//PROOF-RECEIPT//FORMULA-NOT-PROOF</span>
        <b>{receipt.tier}</b>
      </div>
      <div className="profile-vibe-score__body">
        <aside className="profile-vibe-score__terminal" aria-label="Score lab terminal receipt">
          <div className="console-top"><span>score-lab@local</span><b>FORMULA LAB</b></div>
          <pre>{receipt.terminalLines.join("\n")}</pre>
          <div className="profile-vibe-score__stamp" aria-label="Score lab sample line">
            <span>Vibers Unite</span>
            <code>{receipt.shareLine}</code>
            <small>Sample receipt for formula inspection. Published profiles use their reviewed datastream.</small>
          </div>
        </aside>
        <div className="profile-vibe-score__readout">
          <div className="profile-vibe-score__dial" style={{ "--score": receipt.score, "--score-pct": `${receipt.score}%` } as CSSProperties}>
            <span>{receipt.score}</span>
            <small>/100</small>
          </div>
          <div className="profile-vibe-score__copy">
            <h2>{receipt.headline}</h2>
            <p>{receipt.subline}</p>
          </div>
          <div className="profile-vibe-score__factors">
            {receipt.factors.map((factor, index) => (
              <article
                className={`profile-vibe-factor profile-vibe-factor--${factor.tone}`}
                data-impact={factor.impact}
                style={{ "--i": index, "--meter": `${factor.max ? Math.round((factor.points / factor.max) * 100) : 0}%` } as CSSProperties}
                key={factor.id}
              >
                <div>
                  <span>{factor.impact === "not_usage" ? "NOT USAGE" : "SCORE"}</span>
                  <b>{factor.label}</b>
                </div>
                <strong>{factor.value}</strong>
                <p>{factor.note}</p>
                <footer>
                  <i />
                  <em>{factor.points}/{factor.max}</em>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreSignalMatrixPanel({
  receipt,
  reactor,
}: {
  receipt: ReturnType<typeof buildVibeScoreReceipt>;
  reactor: ReturnType<typeof buildVibeScoreReactor>;
}) {
  const scoreRails = reactor.rails.filter((rail) => rail.impact === "score").length;
  const trustRails = reactor.rails.length - scoreRails;
  const terminalLines = [
    "+------------------------------------------------------+",
    "| VTK://SCORE-MATRIX//LIVE-RAILS//NO-FAKE-PROOF       |",
    `| score ${String(reactor.score).padStart(3, "0")}/100 // ${receipt.tier.toUpperCase().padEnd(7)} // seal ${reactor.seal}        |`,
    "| accepted usage rows -> formula -> public profile     |",
    "| trust rail renders beside formula: NOT USAGE         |",
    "| visual pulses write 0 records and change 0 ranks     |",
    "| Vibers Unite // c0vibe.app                           |",
    "+------------------------------------------------------+",
  ];

  return (
    <section className="score-signal-matrix" aria-label="Vibe Score signal matrix">
      <div className="score-signal-matrix__head">
        <div>
          <span>VTK://SCORE-LAB//SIGNAL-MATRIX//TRUST-SIDE-RAIL</span>
          <b>Score signal matrix</b>
        </div>
        <p>Five rails, one formula, zero mystery. Usage rails feed the score; the trust rail is visible context and stays out of usage totals.</p>
      </div>
      <div className="score-signal-matrix__body">
        <aside className="score-signal-matrix__terminal" aria-label="Score matrix terminal">
          <div className="console-top"><span>matrix@score-lab</span><b>ZERO EXTRA USAGE</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="score-signal-matrix__stats" aria-label="Score matrix rail counts">
            <span>{scoreRails} score rails</span>
            <span>{trustRails} trust side rail</span>
            <span>{reactor.score}/100 live sample</span>
            <span>0 rank writes</span>
          </div>
          <div className="score-signal-matrix__trace" aria-label="Score matrix proof path">
            <span>accepted usage rows</span>
            <i />
            <span>score formula</span>
            <i />
            <span>public profile</span>
          </div>
        </aside>
        <div className="score-signal-matrix__cells" aria-label="Score matrix rails">
          {reactor.rails.map((rail, index) => (
            <article
              className={`score-signal-cell score-signal-cell--${rail.tone}`}
              data-impact={rail.impact}
              style={{ "--i": index, "--meter": `${rail.meter}%` } as CSSProperties}
              key={rail.id}
            >
              <div>
                <span>{rail.impact === "not_usage" ? "NOT USAGE" : "SCORE"}</span>
                <b>{rail.label}</b>
              </div>
              <strong>{rail.value}</strong>
              <code>{rail.code}</code>
              <pre aria-label={`${rail.label} matrix signal`}>{rail.signal}</pre>
              <p>{rail.guardrail}</p>
              <footer aria-label={`${rail.label} matrix meter ${rail.meter} percent`}>
                <i />
                <em>{rail.points}/{rail.max}</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreCalibrationChamberPanel({ chamber }: { chamber: ReturnType<typeof buildVibeScoreCalibrationChamber> }) {
  return (
    <section className="score-calibration-chamber" aria-label="Vibe Score calibration chamber">
      <div className="score-calibration-chamber__head">
        <div>
          <span>VTK://SCORE-LAB//CALIBRATION-CHAMBER//FORMULA-LOCKED</span>
          <b>{chamber.headline}</b>
        </div>
        <p>{chamber.subline}</p>
      </div>
      <div className="score-calibration-chamber__body">
        <aside className="score-calibration-chamber__terminal" aria-label="Score calibration terminal">
          <div className="console-top"><span>calibrate@score-lab</span><b>{chamber.tier}</b></div>
          <pre>{chamber.terminalLines.join("\n")}</pre>
          <div className="score-calibration-chamber__counters" aria-label="Score calibration totals">
            <span>{chamber.totals.scoreSteps} score steps</span>
            <span>{chamber.totals.notUsage} not usage rail</span>
            <span>{chamber.totals.scoreDelta}/100 score delta</span>
            <span>{chamber.totals.publicWrites} public writes</span>
          </div>
          <div className="score-calibration-chamber__seal" aria-label="Score calibration seal">
            <span>stable seal</span>
            <code>{chamber.seal}</code>
          </div>
        </aside>
        <div className="score-calibration-chamber__steps" aria-label="Score calibration steps">
          {chamber.steps.map((step, index) => (
            <article
              className={`score-calibration-step score-calibration-step--${step.tone}`}
              data-impact={step.impact}
              style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties}
              key={step.id}
            >
              <div className="score-calibration-step__top">
                <span>{step.statusLabel}</span>
                <b>{step.call} // {step.label}</b>
              </div>
              <strong>{step.delta}</strong>
              <code>{step.formula}</code>
              <div className="score-calibration-step__screen" aria-label={`${step.label} calibration frames`}>
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <small>{step.source} // {step.value}</small>
              <ul className="score-calibration-step__checklist">
                {step.checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p>{step.guardrail}</p>
              <footer aria-label={`${step.label} calibration meter ${step.meter} percent`}>
                <i />
                <em>{step.meter}%</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreMixerConsolePanel({ mixer }: { mixer: ReturnType<typeof buildVibeScoreMixerConsole> }) {
  return (
    <section className="score-mixer-console" aria-label="Vibe Score mixer console">
      <div className="score-mixer-console__head">
        <div>
          <span>VTK://SCORE-LAB//MIXER-CONSOLE//ONE-REVIEWED-DATASTREAM</span>
          <b>{mixer.headline}</b>
        </div>
        <p>{mixer.subline}</p>
      </div>
      <div className="score-mixer-console__body">
        <aside className="score-mixer-console__terminal" aria-label="Score mixer terminal">
          <div className="console-top"><span>mixer@score-lab</span><b>{mixer.tier}</b></div>
          <pre>{mixer.terminalLines.join("\n")}</pre>
          <div className="score-mixer-console__seal" aria-label="Score mixer seal">
            <span>{mixer.score}/100</span>
            <code>{mixer.seal}</code>
          </div>
          <div className="score-mixer-console__outputs" aria-label="Score mixer public outputs">
            {mixer.outputs.map((output) => (
              <article key={output.label}>
                <span>{output.label}</span>
                <strong>{output.value}</strong>
                <code>{output.route}</code>
                <p>{output.note}</p>
              </article>
            ))}
          </div>
        </aside>
        <div className="score-mixer-console__lanes" aria-label="Score mixer datastream lanes">
          {mixer.lanes.map((lane, index) => (
            <article
              className={`score-mixer-lane score-mixer-lane--${lane.tone}`}
              data-status={lane.status}
              style={{ "--i": index, "--meter": `${lane.meter}%` } as CSSProperties}
              key={lane.id}
            >
              <div>
                <span>{lane.statusLabel}</span>
                <b>{lane.label}</b>
              </div>
              <strong>{lane.value}</strong>
              <code>{lane.source}</code>
              <pre aria-label={`${lane.label} mixer route`}>{lane.terminalLines.join("\n")}</pre>
              <p>{lane.note}</p>
              <footer aria-label={`${lane.label} contribution ${lane.contribution}`}>
                <i />
                <em>{lane.contribution}</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
      <div className="score-mixer-console__invariants" aria-label="Score mixer invariants">
        {mixer.invariants.map((invariant) => <span key={invariant}>{invariant}</span>)}
      </div>
    </section>
  );
}

function VibeScoreReactorPanel({ reactor }: { reactor: ReturnType<typeof buildVibeScoreReactor> }) {
  return (
    <section className={`score-lab-reactor profile-score-reactor profile-score-reactor--${reactor.tier}`} aria-label="Vibe Score formula reactor">
      <div className="profile-score-reactor__head">
        <div>
          <span>VTK://SCORE-LAB//DATASTREAM-OSCILLOSCOPE//NO-MIXED-SIGNALS</span>
          <b>{reactor.headline}</b>
        </div>
        <p>{reactor.subline}</p>
      </div>
      <div className="profile-score-reactor__body">
        <aside className="profile-score-reactor__terminal" aria-label="Score lab reactor terminal">
          <div className="console-top"><span>reactor@score-lab</span><b>{reactor.tier}</b></div>
          <pre>{reactor.terminalLines.join("\n")}</pre>
          <div className="profile-score-reactor__seal" aria-label="Score lab local seal">
            <span>seal</span>
            <code>{reactor.seal}</code>
          </div>
          <div className="profile-score-reactor__guardrails" aria-label="Score lab guardrails">
            {reactor.guardrails.map((guardrail) => <span key={guardrail}>{guardrail}</span>)}
          </div>
        </aside>
        <div className="profile-score-reactor__core">
          <div className="profile-score-reactor__scope">
            <div className="profile-score-reactor__score" style={{ "--score-pct": `${reactor.score}%` } as CSSProperties}>
              <span>{reactor.score}</span>
              <small>/100</small>
            </div>
            <pre aria-label="Score lab oscilloscope">{reactor.signalRows.join("\n")}</pre>
            <code>{reactor.shareLine}</code>
          </div>
          <div className="profile-score-reactor__rails" aria-label="Score lab factor rails">
            {reactor.rails.map((rail, index) => (
              <article
                className={`profile-score-reactor-rail profile-score-reactor-rail--${rail.tone}`}
                data-impact={rail.impact}
                style={{ "--i": index, "--meter": `${rail.meter}%` } as CSSProperties}
                key={rail.id}
              >
                <div>
                  <span>{rail.impact === "not_usage" ? "NOT USAGE" : "SCORE"}</span>
                  <b>{rail.label}</b>
                </div>
                <strong>{rail.value}</strong>
                <code>{rail.code}</code>
                <pre aria-label={`${rail.label} score signal`}>{rail.signal}</pre>
                <p>{rail.note}</p>
                <small>{rail.guardrail}</small>
                <footer aria-label={`${rail.label} reactor meter ${rail.meter} percent`}>
                  <i />
                  <em>{rail.points}/{rail.max}</em>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ScorePage() {
  const receipt = buildVibeScoreReceipt(scoreLabProfile);
  const reactor = buildVibeScoreReactor(scoreLabProfile, receipt);
  const calibration = buildVibeScoreCalibrationChamber(scoreLabProfile, receipt, reactor);
  const mixer = buildVibeScoreMixerConsole(scoreLabProfile, receipt, reactor);

  return (
    <>
      <section className="score-route-intro" aria-label="Vibe Score formula lab introduction">
        <div>
          <p className="eyebrow">Score lab</p>
          <h1>Vibe Score, made inspectable</h1>
          <p>
            The score is not a mystery badge. It is a visible receipt from accepted usage mass,
            daily rhythm, source breadth, freshness, and a trust side rail that stays labelled
            NOT USAGE.
          </p>
        </div>
        <div className="motto-rail" aria-label="Score lab motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>FORMULA LAB</code>
        </div>
      </section>
      <ScoreDatastreamRelayPanel profile={scoreLabProfile} mixer={mixer} receipt={receipt} />
      <ScoreFormulaFlightRecorderPanel receipt={receipt} reactor={reactor} mixer={mixer} calibration={calibration} />
      <ScoreSignalMatrixPanel receipt={receipt} reactor={reactor} />
      <ScoreCalibrationChamberPanel chamber={calibration} />
      <ScoreMixerConsolePanel mixer={mixer} />
      <VibeScoreReceiptPanel receipt={receipt} />
      <VibeScoreReactorPanel reactor={reactor} />
    </>
  );
}
