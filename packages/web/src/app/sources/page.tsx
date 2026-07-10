import type { CSSProperties } from "react";
import { buildAiLifeCockpit } from "../../lib/ai-life-cockpit";
import { buildCollectionHeroScanBridge, type CollectionHeroScanBridge } from "../../lib/collection-surprises";
import {
  buildSourceAtlas,
  buildSourceCoverageConstellation,
  buildSourceIntakeStack,
  type SourceCoverageConstellation,
  type SourceIntakeStack,
} from "../../lib/source-atlas";

export const metadata = {
  title: "VibeUsage Source Atlas",
  description: "All VibeTRACKER AI usage, local, creator, builder, regional, manual, and publish source lanes.",
};

function impactCopy(value: string): string {
  if (value === "not_usage" || value === "trust") return "NOT USAGE";
  if (value === "local_only") return "LOCAL ONLY";
  return value.replace(/_/g, " ").toUpperCase();
}

function SourceIntakeIgnitionPanel({ stack }: { stack: SourceIntakeStack }) {
  return (
    <section className="sources-intake-ignition" aria-label="Source intake ignition console">
      <div className="sources-intake-ignition__head">
        <div>
          <span>VTK://SOURCE-INTAKE-IGNITION//ALL-RAILS//NO-HIDDEN-UPLOADS</span>
          <b>{stack.headline}</b>
        </div>
        <p>{stack.subline}</p>
      </div>
      <div className="sources-intake-ignition__body">
        <aside className="sources-intake-ignition__terminal" aria-label={`${stack.headline} ignition terminal`}>
          <div className="console-top"><span>ignition@sources</span><b>ZERO SIDE EFFECTS</b></div>
          <pre>{stack.terminalLines.join("\n")}</pre>
          <div className="sources-intake-ignition__totals" aria-label="Source intake ignition side effects">
            <span>{stack.totals.steps} source rails</span>
            <span>{stack.totals.usageRows} usage feeds</span>
            <span>{stack.totals.trustSidecars} trust sidecar</span>
            <span>{stack.totals.localStores} local stores</span>
            <span>{stack.totals.previewProviderCalls} preview calls</span>
            <span>{stack.totals.hiddenUploads} hidden uploads</span>
          </div>
          <div className="sources-intake-ignition__seal" aria-label="Source intake ignition seal">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="sources-intake-ignition__rails" aria-label="Source intake ignition rails">
          {stack.steps.map((step, index) => (
            <article
              className={`sources-intake-ignition-rail sources-intake-ignition-rail--${step.impact}`}
              data-impact={impactCopy(step.impact)}
              style={{
                "--i": index,
                "--meter": `${step.meter}%`,
                "--brand-from": step.from,
                "--brand-to": step.to,
                "--brand-ink": step.ink,
              } as CSSProperties}
              key={step.id}
            >
              <div className="sources-intake-ignition-rail__top">
                <i>{step.mark}</i>
                <div>
                  <span>{step.status}</span>
                  <b>{step.label}</b>
                </div>
              </div>
              <div className="sources-intake-ignition-rail__screen" aria-hidden="true">
                {step.frames.slice(0, 3).map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{step.command}</code>
              <p>{step.note}</p>
              <div className="sources-intake-ignition-rail__feeds" aria-label={`${step.label} feed destinations`}>
                <span data-on={step.feeds.usageRows}>usage</span>
                <span data-on={step.feeds.trustSidecar}>trust</span>
                <span data-on={step.feeds.localStore}>local</span>
                <span data-on={step.feeds.publicProfile}>profile</span>
              </div>
              <footer aria-label={`${step.label} ignition meter ${step.meter} percent`}>
                <i />
                <span>{step.meter}%</span>
                <strong>{step.guardrail}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceSurpriseBridgePanel({ bridge }: { bridge: CollectionHeroScanBridge }) {
  return (
    <section className="sources-surprise hero-scan-bridge" aria-label="Source scanning surprise bridge">
      <div className="hero-scan-bridge__head">
        <div>
          <span>VTK://SOURCE-SCAN-SURPRISES//VISUAL-ONLY//SEVERAL-TIMES</span>
          <b>Several authored scan surprises</b>
        </div>
        <p>{bridge.motto}</p>
      </div>
      <div className="hero-scan-bridge__body">
        <aside className="hero-scan-bridge__terminal" aria-label={`${bridge.headline} terminal`}>
          <div className="console-top"><span>source-scan@local</span><b>NO USAGE WRITES</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="hero-scan-bridge__totals" aria-label={`${bridge.headline} safety totals`}>
            <span>{bridge.totals.stages} gates</span>
            <span>{bridge.totals.surprises} surprises</span>
            <span>{bridge.totals.usage} usage</span>
            <span>{bridge.totals.notUsage} not usage</span>
            <span>{bridge.totals.publish} publish</span>
            <span>{bridge.totals.usageWrites} writes</span>
          </div>
          <p>{bridge.subline}</p>
        </aside>
        <div className="hero-scan-bridge__stages" aria-label={`${bridge.headline} surprise gates`}>
          {bridge.stages.map((stage, index) => (
            <article
              className={`hero-scan-stage hero-scan-stage--${stage.impact}`}
              data-rail={stage.railLabel}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--delay": `${stage.delayMs}ms`,
                "--brand-from": stage.marks[0]?.from,
                "--brand-to": stage.marks[0]?.to,
                "--brand-ink": stage.marks[0]?.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="hero-scan-stage__top">
                <span>{stage.stage}</span>
                <b>{stage.gate}</b>
                <i>{stage.railLabel}</i>
              </div>
              <div className="hero-scan-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="hero-scan-stage__copy">
                <strong>{stage.label}</strong>
                <code>{stage.command}</code>
                <p>{stage.cue}</p>
                <small>{stage.guardrail}</small>
              </div>
              <pre className="hero-scan-stage__lines" aria-label={`${stage.label} source scan lines`}>
                {stage.terminalLines.join("\n")}
              </pre>
              <div className="hero-scan-stage__marks" aria-label={`${stage.label} provider marks`}>
                {stage.marks.map((mark) => (
                  <i
                    style={{
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${stage.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="hero-scan-stage__meter" aria-label={`${stage.label} surprise meter ${stage.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceIntakeStackPanel({ stack }: { stack: SourceIntakeStack }) {
  return (
    <section className="sources-intake-stack" aria-label="Source intake stack">
      <div className="sources-intake-stack__head">
        <div>
          <span>VTK://SOURCE-INTAKE-STACK//USAGE-TRUST-LOCAL-MANUAL-PUBLISH</span>
          <b>{stack.headline}</b>
        </div>
        <p>{stack.subline}</p>
      </div>
      <div className="sources-intake-stack__body">
        <aside className="sources-intake-stack__terminal" aria-label={`${stack.headline} terminal`}>
          <div className="console-top"><span>intake@sources</span><b>ALL RAILS</b></div>
          <pre>{stack.terminalLines.join("\n")}</pre>
          <div className="sources-intake-stack__totals" aria-label={`${stack.headline} totals`}>
            <span>{stack.totals.steps} steps</span>
            <span>{stack.totals.usageRows} usage rows</span>
            <span>{stack.totals.trustSidecars} trust sidecar</span>
            <span>{stack.totals.localStores} local store</span>
            <span>{stack.totals.publicProfileFeeds} profile feeds</span>
            <span>{stack.totals.previewProviderCalls} preview calls</span>
            <span>{stack.totals.previewLedgerWrites} preview writes</span>
            <span>{stack.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="sources-intake-stack__steps" aria-label={`${stack.headline} labelled steps`}>
          {stack.steps.map((step, index) => (
            <article
              className={`sources-intake-step sources-intake-step--${step.impact}`}
              data-impact={impactCopy(step.impact)}
              style={{
                "--i": index,
                "--meter": `${step.meter}%`,
                "--brand-from": step.from,
                "--brand-to": step.to,
                "--brand-ink": step.ink,
              } as CSSProperties}
              key={step.id}
            >
              <div className="sources-intake-step__top">
                <i>{step.mark}</i>
                <div>
                  <span>{step.status}</span>
                  <b>{step.label}</b>
                </div>
              </div>
              <div className="sources-intake-step__scope" aria-hidden="true">
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{step.command}</code>
              <p>{step.note}</p>
              <small>{step.guardrail}</small>
              <div className="sources-intake-step__feeds" aria-label={`${step.label} feed destinations`}>
                <span data-on={step.feeds.usageRows}>usage</span>
                <span data-on={step.feeds.trustSidecar}>trust</span>
                <span data-on={step.feeds.localStore}>local</span>
                <span data-on={step.feeds.publicProfile}>profile</span>
              </div>
              <footer aria-label={`${step.label} readiness ${step.meter} percent`}>
                <em />
                <strong>{step.meter}%</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceCoverageConstellationPanel({ constellation }: { constellation: SourceCoverageConstellation }) {
  return (
    <section className="sources-constellation" aria-label="Source coverage constellation">
      <div className="sources-constellation__head">
        <div>
          <span>VTK://SOURCE-CONSTELLATION//ALL-VIBER-LANES//ZERO-HIDDEN-BOOSTS</span>
          <b>{constellation.headline}</b>
        </div>
        <p>{constellation.subline}</p>
      </div>
      <div className="sources-constellation__body">
        <aside className="sources-constellation__terminal" aria-label={`${constellation.headline} terminal`}>
          <div className="console-top"><span>constellation@sources</span><b>REGISTRY ORBIT</b></div>
          <pre>{constellation.terminalLines.join("\n")}</pre>
          <div className="sources-constellation__totals" aria-label={`${constellation.headline} totals`}>
            <span>{constellation.totals.sources} sources</span>
            <span>{constellation.totals.built} built</span>
            <span>{constellation.totals.verified} verified</span>
            <span>{constellation.totals.usageNodes} usage dots</span>
            <span>{constellation.totals.trustNodes} not usage</span>
            <span>{constellation.totals.localOnlyNodes} local only</span>
            <span>{constellation.totals.manualNodes} manual</span>
            <span>{constellation.totals.hiddenUsageBoosts} hidden boosts</span>
          </div>
        </aside>
        <div className="sources-constellation__stage" aria-label={`${constellation.headline} orbit stage`}>
          <article
            className="sources-constellation__relay"
            style={{
              "--brand-from": constellation.relay.from,
              "--brand-to": constellation.relay.to,
              "--brand-ink": constellation.relay.ink,
            } as CSSProperties}
          >
            <i>{constellation.relay.mark}</i>
            <b>{constellation.relay.label}</b>
            <span>{constellation.relay.detail}</span>
            <code>reviewed publish only</code>
          </article>
          <div className="sources-constellation__orbits" aria-label={`${constellation.headline} lane orbits`}>
            {constellation.orbits.map((orbit, index) => (
              <article
                className={`sources-constellation-orbit sources-constellation-orbit--${orbit.id}`}
                style={{ "--i": index, "--meter": `${orbit.meter}%`, "--orbit": `${orbit.orbit}%` } as CSSProperties}
                key={orbit.id}
              >
                <div className="sources-constellation-orbit__top">
                  <span>{orbit.call}</span>
                  <b>{orbit.label}</b>
                  <em>{orbit.count} sources</em>
                </div>
                <pre>{orbit.terminalLine}</pre>
                <div className="sources-constellation-orbit__marks" aria-label={`${orbit.label} highlighted source marks`}>
                  {orbit.nodes.map((node, nodeIndex) => (
                    <i
                      style={{
                        "--i": nodeIndex,
                        "--brand-from": node.from,
                        "--brand-to": node.to,
                        "--brand-ink": node.ink,
                      } as CSSProperties}
                      title={`${node.label} ${impactCopy(node.impact)}`}
                      key={`${orbit.id}-${node.id}`}
                    >
                      {node.mark}
                    </i>
                  ))}
                </div>
                <div className="sources-constellation-orbit__rails" aria-label={`${orbit.label} rail split`}>
                  <span>{orbit.usage} usage</span>
                  <span>{orbit.trust} not usage</span>
                  <span>{orbit.localOnly} local</span>
                  <span>{orbit.manual} manual</span>
                </div>
                <p>{orbit.note}</p>
                <footer aria-label={`${orbit.label} source coverage meter ${orbit.meter} percent`}>
                  <i />
                  <strong>{orbit.built} built / {orbit.verified} verified</strong>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SourcesPage() {
  const atlas = buildSourceAtlas();
  const constellation = buildSourceCoverageConstellation(atlas);
  const intakeStack = buildSourceIntakeStack();
  const life = buildAiLifeCockpit();
  const surpriseBridge = buildCollectionHeroScanBridge();
  const laneTotals = atlas.lanes.reduce((sum, lane) => sum + lane.count, 0);
  const trustNodes = atlas.lanes.flatMap((lane) => lane.nodes).filter((node) => node.impact === "trust").length;
  const localNodes = atlas.lanes.flatMap((lane) => lane.nodes).filter((node) => node.impact === "local_only").length;
  const manualNodes = atlas.lanes.flatMap((lane) => lane.nodes).filter((node) => node.impact === "manual").length;

  return (
    <>
      <section className="sources-hero" aria-label="VibeTRACKER source atlas route">
        <div className="sources-hero__copy">
          <p className="eyebrow">All-source cockpit</p>
          <h1>Source signal atlas</h1>
          <p>
            A global map for every AI source VibeTRACKER knows how to reason about: creator tools,
            coding agents, local labs, regional AI, infrastructure, subscriptions, and C0VIBE publish review.
          </p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">C0vibe.app</a>
          </div>
        </div>
        <div className="sources-hero__terminal" aria-label="Source atlas terminal summary">
          <div className="console-top"><span>sources@vibetracker</span><b>REGISTRY MAP</b></div>
          <pre>{atlas.terminalLines.join("\n")}</pre>
          <div className="sources-hero__stats" aria-label="Source route stats">
            <span>{life.totals.providers} registry providers</span>
            <span>{life.totals.built} built</span>
            <span>{life.totals.verified} verified</span>
            <span>{localNodes} local nodes</span>
            <span>{trustNodes} not usage</span>
            <span>{manualNodes} manual</span>
          </div>
        </div>
      </section>

      <SourceIntakeIgnitionPanel stack={intakeStack} />

      <SourceSurpriseBridgePanel bridge={surpriseBridge} />

      <SourceIntakeStackPanel stack={intakeStack} />

      <SourceCoverageConstellationPanel constellation={constellation} />

      <section className="sources-life" aria-label="AI life source lanes">
        <div className="sources-life__head">
          <span>VTK://AI-LIFE-SOURCES//CREATOR-BUILDER-LOCAL-REGIONAL//NO-FAKE-USAGE</span>
          <b>{life.headline}</b>
        </div>
        <div className="sources-life__grid">
          {life.lanes.map((lane, index) => (
            <article
              className={`sources-life-lane sources-life-lane--${lane.impact}`}
              data-impact={impactCopy(lane.impact)}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="sources-life-lane__screen" aria-hidden="true">
                {lane.ascii.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>{frame}</pre>
                ))}
                <i>{lane.mark}</i>
              </div>
              <div className="sources-life-lane__copy">
                <div>
                  <span>{lane.railLabel}</span>
                  <b>{lane.label}</b>
                  <em>{lane.value}</em>
                </div>
                <code>{lane.command}</code>
                <p>{lane.note}</p>
                <small>{lane.guardrail}</small>
              </div>
              <div className="sources-life-lane__providers" aria-label={`${lane.label} highlighted providers`}>
                {lane.providers.slice(0, 6).map((provider, providerIndex) => (
                  <i
                    style={{
                      "--i": providerIndex,
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={provider.label}
                    key={`${lane.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <div className="sources-life-lane__meter" aria-label={`${lane.label} source meter ${lane.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sources-map" aria-label="Branded source registry map">
        <div className="sources-map__head">
          <span>VTK://SOURCE-SIGNAL-MAP//LOCAL-FIRST//REVIEWED-PUBLISH</span>
          <b>{atlas.headline}</b>
        </div>
        <div className="sources-map__body">
          <aside className="sources-map__terminal" aria-label="Source atlas metrics">
            <div className="console-top"><span>atlas@registry</span><b>{laneTotals} SIGNALS</b></div>
            <pre>{atlas.terminalLines.join("\n")}</pre>
            <div className="sources-map__metrics" aria-label="Source atlas metrics">
              {atlas.metrics.map((metric) => (
                <div key={metric.label}>
                  <b>{metric.value}</b>
                  <span>{metric.label}</span>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>
          </aside>
          <div className="sources-map__field" aria-label="Source atlas field">
            <article
              className="sources-map__relay"
              style={{
                "--brand-from": atlas.relay.from,
                "--brand-to": atlas.relay.to,
                "--brand-ink": atlas.relay.ink,
              } as CSSProperties}
            >
              <i>{atlas.relay.mark}</i>
              <b>{atlas.relay.label}</b>
              <span>{atlas.relay.detail}</span>
            </article>
            {atlas.beacons.map((node, index) => (
              <article
                className={`sources-map-node sources-map-node--${node.impact}`}
                data-impact={impactCopy(node.impact)}
                style={{
                  "--i": index,
                  "--x": `${node.x}%`,
                  "--y": `${node.y}%`,
                  "--brand-from": node.from,
                  "--brand-to": node.to,
                  "--brand-ink": node.ink,
                } as CSSProperties}
                key={`${node.id}-${index}`}
              >
                <i>{node.mark}</i>
                <span>{node.label}</span>
              </article>
            ))}
          </div>
        </div>
        <div className="sources-lanes" aria-label="Source atlas lane totals">
          {atlas.lanes.map((lane, laneIndex) => (
            <article className={`sources-lane sources-lane--${lane.id}`} style={{ "--i": laneIndex } as CSSProperties} key={lane.id}>
              <div className="sources-lane__top">
                <span>{lane.call}</span>
                <b>{lane.label}</b>
                <em>{lane.count} signals</em>
              </div>
              <p>{lane.note}</p>
              <div className="sources-lane__nodes" aria-label={`${lane.label} source marks`}>
                {lane.nodes.slice(0, 8).map((node, nodeIndex) => (
                  <i
                    style={{
                      "--i": nodeIndex,
                      "--brand-from": node.from,
                      "--brand-to": node.to,
                      "--brand-ink": node.ink,
                    } as CSSProperties}
                    title={`${node.label} ${impactCopy(node.impact)}`}
                    key={`${lane.id}-${node.id}`}
                  >
                    {node.mark}
                  </i>
                ))}
                {lane.overflow > 0 ? <strong>+{lane.overflow}</strong> : null}
              </div>
              <footer>
                <span>{lane.built} built</span>
                <span>{lane.verified} verified</span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
