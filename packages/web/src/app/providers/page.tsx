import type { CSSProperties } from "react";
import { PROVIDERS, type ProviderDescriptor } from "../../../../adapters/src/registry";
import { providerBrand } from "../../lib/provider-brand";
import {
  buildProviderBootSequence,
  buildProviderCollectionCommandWall,
  buildProviderCollectionConsole,
  buildProviderFreshnessRadar,
  buildProviderPassportWall,
  buildProviderScanLanes,
  buildProviderSignalMarquee,
  buildProviderScanTheatre,
  buildProviderSurpriseDirector,
  buildProviderWorldCoverageMap,
  type ProviderBootSequence,
  type ProviderCollectionCommandChannel,
  type ProviderCollectionCommandWall,
  type ProviderFreshnessRadar,
  type ProviderScanChip,
  type ProviderSignalMarquee,
  type ProviderSurpriseDirector,
  type ProviderWorldCoverageMap,
} from "../../lib/provider-scan";

export const metadata = {
  title: "VibeUsage Provider Status",
  description: "Public VibeTRACKER adapter coverage cockpit for users and contributors.",
};

const FEATURED_PROVIDER_IDS = [
  "higgsfield",
  "claude-code",
  "openai",
  "replicate",
  "ollama",
  "lmstudio",
  "comfyui",
  "qwen",
  "doubao",
  "mistral",
];

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function coverage(provider: ProviderDescriptor): string {
  if (provider.status === "built") return provider.verified ? "built verified" : "built approximate";
  if (provider.tier === "proxy") return "proxy-ready";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  return "planned";
}

function statusClass(provider: ProviderDescriptor): string {
  if (provider.status === "built" && provider.verified) return "status-built";
  if (provider.status === "built") return "status-approx";
  if (provider.tier === "proxy") return "status-proxy";
  if (provider.tier === "manual" || provider.status === "manual-only") return "status-manual";
  return "status-planned";
}

function rowStyle(id: string): CSSProperties {
  const brand = providerBrand(id);
  return {
    "--brand-from": brand.from,
    "--brand-to": brand.to,
    "--brand-ink": brand.ink,
  } as CSSProperties;
}

function chipStyle(id: string, index: number): CSSProperties {
  return {
    ...rowStyle(id),
    "--i": index,
  } as CSSProperties;
}

function chipSignal(provider: ProviderScanChip): string {
  if (provider.status === "built" && provider.verified) return "verified";
  if (provider.status === "built") return "built";
  if (provider.tier === "proxy" || provider.tier === "local") return provider.tier;
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  return "mapped";
}

function metric(label: string, value: number, detail: string) {
  return (
    <div>
      <b>{value}</b>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

function channelBadge(channel: ProviderCollectionCommandChannel): string {
  if (channel.autoReadable) return "auto after auth";
  if (channel.localOnly) return "local review";
  if (channel.trustOnly) return "trust only";
  if (channel.manualOnly) return "manual";
  if (channel.publishOnly) return "publish review";
  return "labelled";
}

function ProviderWorldIgnitionPanel({ world }: { world: ProviderWorldCoverageMap }) {
  return (
    <section className="provider-world-ignition" aria-label="Provider first-contact world console">
      <div className="provider-world-ignition__head">
        <div>
          <span>VTK://FIRST-CONTACT//ALL-VIBERS//C0VIBE.APP</span>
          <b>{world.headline}</b>
        </div>
        <p>{world.subline}</p>
      </div>
      <div className="provider-world-ignition__body">
        <aside className="provider-world-ignition__terminal" aria-label="Provider world ignition terminal">
          <div className="console-top"><span>first-contact@registry</span><b>VISUAL ONLY</b></div>
          <pre>{world.terminalLines.slice(0, 7).join("\n")}</pre>
          <div className="provider-world-ignition__totals" aria-label="Provider world ignition totals">
            <span>{world.totals.providerRefs} provider refs</span>
            <span>{world.totals.verified} verified</span>
            <span>{world.totals.local} local/proxy</span>
            <span>{world.totals.manual} manual</span>
            <span>{world.totals.trustRails} not usage</span>
            <span>{world.totals.publishRails} publish</span>
          </div>
          <div className="provider-world-ignition__motto" aria-label="Provider world ignition motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="provider-world-ignition__zones" aria-label="Provider first-contact zones">
          {world.zones.map((zone, index) => (
            <article
              className={`provider-world-ignition-zone provider-world-ignition-zone--${zone.impact}`}
              data-impact={zone.impact}
              style={{
                "--i": index,
                "--meter": `${zone.meter}%`,
                "--brand-from": zone.marks[0]?.from,
                "--brand-to": zone.marks[0]?.to,
                "--brand-ink": zone.marks[0]?.ink,
              } as CSSProperties}
              key={zone.id}
            >
              <div className="provider-world-ignition-zone__top">
                <span>{zone.call}</span>
                <b>{zone.label}</b>
                <em>{zone.region}</em>
              </div>
              <div className="provider-world-ignition-zone__screen" aria-hidden="true">
                {zone.frames.slice(0, 3).map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${zone.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <p>{zone.note}</p>
              <div className="provider-world-ignition-zone__marks" aria-label={`${zone.label} provider marks`}>
                {zone.marks.slice(0, 8).map((mark, markIndex) => (
                  <i
                    style={{
                      "--i": markIndex,
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${zone.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <code>{zone.command}</code>
              <footer>
                <i aria-hidden="true" />
                <span>{zone.mapped}/{zone.providerIds.length} mapped</span>
                <strong>{zone.guardrail}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderCollectionCommandWallPanel({ wall }: { wall: ProviderCollectionCommandWall }) {
  return (
    <section className="provider-command-wall" aria-label="Provider collection command wall">
      <div className="provider-command-wall__head">
        <div>
          <span>VTK://COLLECTION-COMMAND-WALL//VISUAL-ONLY//NO-FAKE-USAGE</span>
          <b>{wall.headline}</b>
        </div>
        <p>{wall.subline}</p>
      </div>
      <div className="provider-command-wall__body">
        <aside className="provider-command-wall__terminal" aria-label="Collection command wall terminal">
          <div className="console-top"><span>collect@registry</span><b>AUTO/MANUAL MAP</b></div>
          <pre>{wall.terminalLines.join("\n")}</pre>
          <div className="provider-command-wall__totals" aria-label="Collection command wall totals">
            <span>{wall.totals.channels} channels</span>
            <span>{wall.totals.autoReadable} auto-readable</span>
            <span>{wall.totals.notUsage} not usage</span>
            <span>{wall.totals.manualOnly} manual</span>
            <span>{wall.totals.localOnly} local</span>
            <span>{wall.totals.hiddenUpload} hidden upload</span>
          </div>
        </aside>
        <div className="provider-command-wall__channels" aria-label="Provider collection command channels">
          {wall.channels.map((channel, index) => (
            <article
              className={`provider-command-channel provider-command-channel--${channel.impact}`}
              data-impact={channel.impact}
              style={{
                "--i": index,
                "--meter": `${channel.meter}%`,
                "--brand-from": channel.from,
                "--brand-to": channel.to,
                "--brand-ink": channel.ink,
              } as CSSProperties}
              key={channel.id}
            >
              <div className="provider-command-channel__screen" aria-hidden="true">
                {channel.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${channel.id}-${frameIndex}`}>{frame}</pre>
                ))}
                <span>{channel.call}</span>
              </div>
              <div className="provider-command-channel__copy">
                <div className="provider-command-channel__top">
                  <span>{channel.railLabel}</span>
                  <b>{channel.label}</b>
                  <em>{channelBadge(channel)}</em>
                </div>
                <code>{channel.command}</code>
                <pre aria-label={`${channel.label} command wall transcript`}>{channel.terminalLines.join("\n")}</pre>
                <p>{channel.surprise}</p>
                <div className="provider-command-channel__marks" aria-label={`${channel.label} provider marks`}>
                  {channel.marks.map((mark, markIndex) => (
                    <i
                      style={{
                        "--i": markIndex,
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${channel.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <div className="provider-command-channel__meter" aria-label={`${channel.label} collection meter ${channel.meter} percent`}>
                  <i />
                </div>
                <footer>
                  <span>{channel.checksum}</span>
                  <span>{channel.readPath}</span>
                  <strong>{channel.guardrail}</strong>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderFreshnessRadarPanel({ radar }: { radar: ProviderFreshnessRadar }) {
  return (
    <section className="provider-freshness-radar" aria-label="Provider freshness and readiness radar">
      <div className="provider-freshness-radar__head">
        <div>
          <span>VTK://PROVIDER-FRESHNESS-RADAR//REGISTRY-ONLY//NO-CALLS</span>
          <b>{radar.headline}</b>
        </div>
        <p>{radar.subline}</p>
      </div>
      <div className="provider-freshness-radar__body">
        <aside className="provider-freshness-radar__terminal" aria-label="Provider freshness radar terminal">
          <div className="console-top"><span>freshness@registry</span><b>NO PROVIDER CALLS</b></div>
          <pre>{radar.terminalLines.join("\n")}</pre>
          <div className="provider-freshness-radar__totals" aria-label="Provider freshness totals">
            <span>{radar.totals.lanes} lanes</span>
            <span>{radar.totals.verified} verified</span>
            <span>{radar.totals.approximate} approximate</span>
            <span>{radar.totals.localProxy} local/proxy</span>
            <span>{radar.totals.manual} manual</span>
            <span>{radar.totals.hiddenUpload} hidden uploads</span>
          </div>
        </aside>
        <div className="provider-freshness-lanes" aria-label="Provider freshness radar lanes">
          {radar.lanes.map((lane, index) => (
            <article
              className={`provider-freshness-lane provider-freshness-lane--${lane.impact}`}
              data-impact={lane.impact}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.marks[0]?.from,
                "--brand-to": lane.marks[0]?.to,
                "--brand-ink": lane.marks[0]?.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="provider-freshness-lane__screen" aria-hidden="true">
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>{frame}</pre>
                ))}
                <span>{lane.call}</span>
              </div>
              <div className="provider-freshness-lane__copy">
                <div className="provider-freshness-lane__top">
                  <span>{lane.railLabel}</span>
                  <b>{lane.label}</b>
                  <em>{lane.status}</em>
                </div>
                <code>{lane.command}</code>
                <pre aria-label={`${lane.label} freshness check transcript`}>{lane.checkLines.join("\n")}</pre>
                <p>{lane.note}</p>
                <strong>{lane.action}</strong>
                <div className="provider-freshness-lane__marks" aria-label={`${lane.label} provider marks`}>
                  {lane.marks.map((mark, markIndex) => (
                    <i
                      style={{
                        "--i": markIndex,
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${lane.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <div className="provider-freshness-lane__meter" aria-label={`${lane.label} freshness meter ${lane.meter} percent`}>
                  <i />
                </div>
                <footer>
                  <span>{lane.checksum}</span>
                  <span>{lane.mapped}/{lane.providerRefs} mapped</span>
                  <strong>{lane.guardrail}</strong>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderBootSequencePanel({ boot }: { boot: ProviderBootSequence }) {
  return (
    <section className="provider-boot-sequence" aria-label="Provider boot sequence preflight">
      <div className="provider-boot-sequence__head">
        <div>
          <span>VTK://PROVIDER-BOOT-SEQUENCE//VISUAL-ONLY//NO-HIDDEN-UPLOAD</span>
          <b>{boot.headline}</b>
        </div>
        <p>{boot.subline}</p>
      </div>
      <div className="provider-boot-sequence__body">
        <aside className="provider-boot-sequence__terminal" aria-label="Provider boot sequence terminal">
          <div className="console-top"><span>boot@registry</span><b>PRE-FLIGHT</b></div>
          <pre>{boot.terminalLines.join("\n")}</pre>
          <div className="provider-boot-sequence__totals" aria-label="Provider boot sequence totals">
            <span>{boot.totals.slots} slots</span>
            <span>{boot.totals.usage} usage</span>
            <span>{boot.totals.notUsage} not usage</span>
            <span>{boot.totals.localOnly} local</span>
            <span>{boot.totals.manual} manual</span>
            <span>{boot.totals.hiddenUpload} hidden upload</span>
          </div>
        </aside>
        <div className="provider-boot-slots" aria-label="Provider boot slots">
          {boot.slots.map((slot, index) => (
            <article
              className={`provider-boot-slot provider-boot-slot--${slot.impact}`}
              data-impact={slot.impact}
              style={{
                "--i": index,
                "--meter": `${slot.meter}%`,
                "--brand-from": slot.marks[0]?.from,
                "--brand-to": slot.marks[0]?.to,
                "--brand-ink": slot.marks[0]?.ink,
              } as CSSProperties}
              key={slot.id}
            >
              <div className="provider-boot-slot__screen" aria-hidden="true">
                {slot.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${slot.id}-${frameIndex}`}>{frame}</pre>
                ))}
                <span>{slot.call}</span>
              </div>
              <div className="provider-boot-slot__copy">
                <div className="provider-boot-slot__top">
                  <span>{slot.phase}</span>
                  <b>{slot.label}</b>
                  <em>{slot.railLabel}</em>
                </div>
                <code>{slot.command}</code>
                <pre aria-label={`${slot.label} boot transcript`}>{slot.bootLines.join("\n")}</pre>
                <div className="provider-boot-slot__marks" aria-label={`${slot.label} boot provider marks`}>
                  {slot.marks.map((mark, markIndex) => (
                    <i
                      style={{
                        "--i": markIndex,
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${slot.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <div className="provider-boot-slot__meter" aria-label={`${slot.label} boot readiness ${slot.meter} percent`}>
                  <i />
                </div>
                <footer>
                  <span>{slot.checksum}</span>
                  <span>{slot.visualOnly ? "visual only" : "writes"}</span>
                  <strong>{slot.guardrail}</strong>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderSignalMarqueePanel({ marquee }: { marquee: ProviderSignalMarquee }) {
  return (
    <section className="provider-signal-marquee" aria-label="Provider signal marquee visual preflight">
      <div className="provider-signal-marquee__head">
        <div>
          <span>VTK://PROVIDER-SIGNAL-MARQUEE//VISUAL-ONLY//NO-FAKE-USAGE</span>
          <b>{marquee.headline}</b>
        </div>
        <p>{marquee.subline}</p>
      </div>
      <div className="provider-signal-marquee__body">
        <aside className="provider-signal-marquee__terminal" aria-label="Provider signal marquee terminal">
          <div className="console-top"><span>signal@registry</span><b>PRE-SCAN</b></div>
          <pre>{marquee.terminalLines.join("\n")}</pre>
          <div className="provider-signal-marquee__totals" aria-label="Provider signal marquee totals">
            <span>{marquee.totals.rails} rails</span>
            <span>{marquee.totals.usageRails} usage</span>
            <span>{marquee.totals.notUsageRails} not usage</span>
            <span>{marquee.totals.manualRails} manual</span>
            <span>{marquee.totals.publishRails} publish</span>
            <span>{marquee.totals.usageWrites} usage writes</span>
          </div>
        </aside>
        <div className="provider-signal-marquee__rails" aria-label="Provider signal rails">
          {marquee.rails.map((rail, index) => (
            <article
              className={`provider-signal-rail provider-signal-rail--${rail.impact}`}
              data-impact={rail.impact}
              style={{
                "--i": index,
                "--meter": `${rail.meter}%`,
                "--brand-from": rail.from,
                "--brand-to": rail.to,
                "--brand-ink": rail.ink,
              } as CSSProperties}
              key={rail.id}
            >
              <div className="provider-signal-rail__screen" aria-hidden="true">
                {rail.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${rail.id}-${frameIndex}`}>{frame}</pre>
                ))}
                <span>{rail.call}</span>
              </div>
              <div className="provider-signal-rail__copy">
                <div className="provider-signal-rail__top">
                  <span>{rail.railLabel}</span>
                  <b>{rail.label}</b>
                  <em>{rail.mapped}/{rail.providerIds.length} mapped</em>
                </div>
                <code>{rail.command}</code>
                <pre aria-label={`${rail.label} signal ticker`}>{rail.tickerLines.join("\n")}</pre>
                <div className="provider-signal-rail__marks" aria-label={`${rail.label} signal provider marks`}>
                  {rail.marks.map((mark, markIndex) => (
                    <i
                      style={{
                        "--i": markIndex,
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${rail.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <div className="provider-signal-rail__meter" aria-label={`${rail.label} preflight meter ${rail.meter} percent`}>
                  <i />
                </div>
                <footer>
                  <span>{rail.checksum}</span>
                  <span>{rail.visualOnly ? "visual only" : "sync"}</span>
                  <strong>{rail.guardrail}</strong>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderSurpriseDirectorPanel({ director }: { director: ProviderSurpriseDirector }) {
  return (
    <section className="scanner-surprise-director" aria-label="Provider surprise director">
      <div className="scanner-surprise-director__head">
        <div>
          <span>VTK://PROVIDER-SURPRISE-DIRECTOR//VISUAL-ONLY//NO-HIDDEN-UPLOAD</span>
          <b>{director.headline}</b>
        </div>
        <p>{director.subline}</p>
      </div>
      <div className="scanner-surprise-director__body">
        <aside className="scanner-surprise-director__terminal" aria-label="Provider surprise director terminal">
          <div className="console-top"><span>director@providers</span><b>VIBERS UNITE</b></div>
          <pre>{director.terminalLines.join("\n")}</pre>
          <div className="scanner-surprise-director__totals" aria-label="Provider surprise director totals">
            <span>{director.totals.cues} cues</span>
            <span>{director.totals.usageEligible} usage eligible</span>
            <span>{director.totals.notUsage} not usage</span>
            <span>{director.totals.manual} manual</span>
            <span>{director.totals.publish} publish</span>
            <span>{director.totals.hiddenUpload} hidden uploads</span>
          </div>
          <strong>{director.motto}</strong>
        </aside>
        <div className="scanner-director-cues" aria-label="Provider surprise cue sequence">
          {director.cues.map((cue, index) => (
            <article
              className={`scanner-director-cue scanner-director-cue--${cue.impact}`}
              data-impact={cue.impact}
              style={{
                "--i": index,
                "--meter": `${cue.meter}%`,
                "--delay": `${cue.delayMs}ms`,
                "--brand-from": cue.marks[0]?.from,
                "--brand-to": cue.marks[0]?.to,
                "--brand-ink": cue.marks[0]?.ink,
              } as CSSProperties}
              key={cue.id}
            >
              <div className="scanner-director-cue__top">
                <span>{cue.stage.slice(0, 2)}</span>
                <b>{cue.gate}</b>
                <i>{cue.railLabel}</i>
              </div>
              <div className="scanner-director-cue__screen" aria-hidden="true">
                {cue.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${cue.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="scanner-director-cue__copy">
                <strong>{cue.label}</strong>
                <code>{cue.command}</code>
                <p>{cue.caption}</p>
                <small>{cue.profileEffect}</small>
                <small>{cue.guardrail}</small>
              </div>
              <div className="scanner-director-cue__marks" aria-label={`${cue.label} provider marks`}>
                {cue.marks.map((mark, markIndex) => (
                  <i
                    style={{
                      "--m": markIndex,
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${cue.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <footer className="scanner-director-cue__foot">
                <span>{cue.timing}</span>
                <b>{cue.operatorLine}</b>
              </footer>
              <div className="scanner-director-cue__meter" aria-label={`${cue.label} director meter ${cue.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProvidersPage() {
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const proxy = PROVIDERS.filter((provider) => provider.status !== "built" && provider.tier === "proxy").length;
  const manual = PROVIDERS.filter((provider) => provider.status !== "built" && (provider.tier === "manual" || provider.status === "manual-only")).length;
  const planned = PROVIDERS.length - built - proxy - manual;
  const featured = FEATURED_PROVIDER_IDS
    .map((id) => PROVIDERS.find((provider) => provider.id === id))
    .filter(Boolean) as ProviderDescriptor[];
  const scanLanes = buildProviderScanLanes(PROVIDERS);
  const theatreScenes = buildProviderScanTheatre(PROVIDERS);
  const passportWall = buildProviderPassportWall(PROVIDERS);
  const collectionConsole = buildProviderCollectionConsole(PROVIDERS);
  const commandWall = buildProviderCollectionCommandWall(PROVIDERS);
  const freshnessRadar = buildProviderFreshnessRadar(PROVIDERS);
  const bootSequence = buildProviderBootSequence(PROVIDERS);
  const signalMarquee = buildProviderSignalMarquee(PROVIDERS);
  const surpriseDirector = buildProviderSurpriseDirector(PROVIDERS);
  const worldCoverage = buildProviderWorldCoverageMap(PROVIDERS);
  const categoryCounts = [...PROVIDERS.reduce((map, provider) => {
    for (const category of provider.categories) map.set(category, (map.get(category) ?? 0) + 1);
    return map;
  }, new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const registryAscii = [
    "+------------------------------------------------+",
    "| VTRK://PROVIDER-REGISTRY/LOCAL-FIRST           |",
    "|------------------------------------------------|",
    `| mapped   ${fit(PROVIDERS.length, 8)} built   ${fit(built, 8)} verified ${fit(verified, 5)} |`,
    `| proxy    ${fit(proxy, 8)} manual  ${fit(manual, 8)} planned  ${fit(planned, 5)} |`,
    "|------------------------------------------------|",
    "| labels are product truth, not marketing copy    |",
    "| planned means mapped, not secretly built        |",
    "+------------------------------------------------+",
  ].join("\n");

  return (
    <>
      <section className="providers-hero">
        <div className="providers-copy">
          <p className="eyebrow">Adapter registry cockpit</p>
          <h1>Provider status board</h1>
          <p>Every mapped AI, coding, creator, local, and infrastructure source with honest coverage labels. Planned means mapped, not built.</p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="registry-terminal" aria-label="Provider registry terminal summary">
          <div className="console-top"><span>registry@vibetracker</span><b>truth labels</b></div>
          <pre>{registryAscii}</pre>
        </div>
      </section>

      <ProviderWorldIgnitionPanel world={worldCoverage} />

      <section className="provider-metrics" aria-label="Provider coverage summary">
        {metric("services mapped", PROVIDERS.length, "Registry-backed coverage")}
        {metric("built adapters", built, `${verified} endpoint-verified`)}
        {metric("proxy/manual paths", proxy + manual, `${proxy} proxy · ${manual} manual`)}
        {metric("planned adapters", planned, "Good first contributor tasks")}
      </section>

      <ProviderFreshnessRadarPanel radar={freshnessRadar} />

      <ProviderCollectionCommandWallPanel wall={commandWall} />

      <ProviderSurpriseDirectorPanel director={surpriseDirector} />

      <ProviderSignalMarqueePanel marquee={signalMarquee} />

      <ProviderBootSequencePanel boot={bootSequence} />

      <section className="provider-world-map" aria-label="Provider world coverage command map">
        <div className="provider-world-map__head">
          <span>VTK://WORLD-COVERAGE//CREATOR-CN-EU-LOCAL//C0VIBE.APP</span>
          <b>{worldCoverage.headline}</b>
        </div>
        <div className="provider-world-map__body">
          <aside className="provider-world-map__terminal" aria-label="World coverage terminal summary">
            <div className="console-top"><span>world@registry</span><b>{worldCoverage.totals.zones} ZONES</b></div>
            <pre>{worldCoverage.terminalLines.join("\n")}</pre>
            <div className="provider-world-map__totals" aria-label="World coverage totals">
              <span>{worldCoverage.totals.mapped} mapped refs</span>
              <span>{worldCoverage.totals.verified} verified</span>
              <span>{worldCoverage.totals.local} local/proxy</span>
              <span>{worldCoverage.totals.trustRails} not-usage rail</span>
            </div>
          </aside>
          <div className="provider-world-map__main">
            <div className="provider-world-map__copy">
              <span>{worldCoverage.subline}</span>
              <b>Vibers Unite</b>
            </div>
            <div className="provider-world-zones" aria-label="Provider world coverage zones">
              {worldCoverage.zones.map((zone, index) => (
                <article
                  className={`provider-world-zone provider-world-zone--${zone.impact}`}
                  data-impact={zone.impact}
                  style={{
                    "--i": index,
                    "--meter": `${zone.meter}%`,
                    "--brand-from": zone.marks[0]?.from,
                    "--brand-to": zone.marks[0]?.to,
                    "--brand-ink": zone.marks[0]?.ink,
                  } as CSSProperties}
                  key={zone.id}
                >
                  <div className="provider-world-zone__screen" aria-hidden="true">
                    {zone.frames.map((frame, frameIndex) => (
                      <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${zone.id}-${frameIndex}`}>{frame}</pre>
                    ))}
                    <span>{zone.call}</span>
                  </div>
                  <div className="provider-world-zone__copy">
                    <div className="provider-world-zone__top">
                      <span>{zone.region}</span>
                      <b>{zone.label}</b>
                      <em>{zone.impact.replace("_", " ")}</em>
                    </div>
                    <p>{zone.note}</p>
                    <code>{zone.command}</code>
                    <pre>{zone.terminalLines.join("\n")}</pre>
                    <div className="provider-world-zone__marks" aria-label={`${zone.label} provider marks`}>
                      {zone.marks.map((mark, markIndex) => (
                        <i
                          style={{
                            "--i": markIndex,
                            "--brand-from": mark.from,
                            "--brand-to": mark.to,
                            "--brand-ink": mark.ink,
                          } as CSSProperties}
                          title={mark.label}
                          key={`${zone.id}-${mark.id}`}
                        >
                          {mark.mark}
                        </i>
                      ))}
                    </div>
                    <div className="provider-world-zone__meter" aria-label={`${zone.label} coverage meter ${zone.meter} percent`}>
                      <i />
                    </div>
                    <footer>
                      <span>{zone.mapped}/{zone.providerIds.length} mapped</span>
                      <span>{zone.built} built</span>
                      <span>{zone.verified} verified</span>
                      <strong>{zone.guardrail}</strong>
                    </footer>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="provider-collection-console" aria-label="Provider collection surprise console">
        <div className="provider-collection-console__head">
          <span>VTK://COLLECTION-CONSOLE//SURPRISES//NO-FAKE-USAGE</span>
          <b>{collectionConsole.headline}</b>
        </div>
        <div className="provider-collection-console__body">
          <aside className="provider-collection-console__terminal" aria-label="Provider collection terminal summary">
            <div className="console-top"><span>collect@vibetracker</span><b>{collectionConsole.steps.length} BEATS</b></div>
            <pre>{collectionConsole.terminalLines.join("\n")}</pre>
            <div className="provider-collection-console__totals" aria-label="Collection signal totals">
              <span>{collectionConsole.totals.usage} usage beats</span>
              <span>{collectionConsole.totals.trust} trust / not usage</span>
              <span>{collectionConsole.totals.local_only} local-only</span>
              <span>{collectionConsole.totals.publish} publish rail</span>
            </div>
          </aside>
          <div className="provider-collection-sequence">
            {collectionConsole.steps.map((step, index) => (
              <article
                className={`provider-collection-step provider-collection-step--${step.impact}`}
                data-impact={step.impact}
                style={{
                  "--i": index,
                  "--meter": `${step.meter}%`,
                  "--brand-from": step.from,
                  "--brand-to": step.to,
                  "--brand-ink": step.ink,
                } as CSSProperties}
                key={step.id}
              >
                <div className="provider-collection-step__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                  <span>{step.call}</span>
                </div>
                <div className="provider-collection-step__copy">
                  <div className="provider-collection-step__top">
                    <span>{step.phase}</span>
                    <b>{step.label}</b>
                    <em>{step.impact.replace("_", " ")}</em>
                  </div>
                  <p>{step.surprise}</p>
                  <code>{step.command}</code>
                  <ul aria-label={`${step.label} scan transcript`}>
                    {step.transcript.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  <div className="provider-collection-step__marks" aria-label={`${step.label} provider marks`}>
                    {step.marks.map((mark, markIndex) => (
                      <i
                        style={{
                          "--i": markIndex,
                          "--brand-from": mark.from,
                          "--brand-to": mark.to,
                          "--brand-ink": mark.ink,
                        } as CSSProperties}
                        title={mark.label}
                        key={mark.id}
                      >
                        {mark.mark}
                      </i>
                    ))}
                  </div>
                  <div className="provider-collection-step__meter" aria-label={`${step.label} collection confidence ${step.meter} percent`}>
                    <i />
                  </div>
                  <footer>
                    <span>{step.badge}</span>
                    <span>{step.mapped}/{step.providerIds.length} mapped</span>
                    <strong>{step.guardrail}</strong>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="provider-passports" aria-label="Full provider passport wall">
        <div className="provider-passports__head">
          <span>VTK://PROVIDER-PASSPORTS//FULL-REGISTRY//NO-FAKE-GREEN</span>
          <b>{passportWall.headline}</b>
        </div>
        <div className="provider-passports__body">
          <aside className="provider-passports__terminal" aria-label="Provider passport terminal summary">
            <div className="console-top"><span>passports@registry</span><b>{passportWall.totals.providers} SOURCES</b></div>
            <pre>{passportWall.terminalLines.join("\n")}</pre>
            <div className="provider-passports__totals" aria-label="Provider passport totals">
              <span>{passportWall.totals.verified} verified</span>
              <span>{passportWall.totals.built} built</span>
              <span>{passportWall.totals.local} local/proxy</span>
              <span>{passportWall.totals.manual} manual</span>
            </div>
          </aside>
          <div className="provider-passports__copy">
            <h2>{passportWall.headline}</h2>
            <p>{passportWall.subline}</p>
            <div className="provider-passports__scanline">
              <span>Vibers Unite</span>
              <a href="https://c0vibe.app">c0vibe.app</a>
            </div>
          </div>
        </div>
        <div className="provider-passport-grid">
          {passportWall.cards.map((card, index) => (
            <article
              className={`provider-passport provider-passport--${card.tone}`}
              data-impact={card.impact}
              style={{
                "--i": index,
                "--meter": `${card.meter}%`,
                "--brand-from": card.from,
                "--brand-to": card.to,
                "--brand-ink": card.ink,
              } as CSSProperties}
              key={card.id}
            >
              <div>
                <i>{card.mark}</i>
                <span>{card.status}</span>
              </div>
              <b>{card.label}</b>
              <small>{card.domain} · {card.categories}</small>
              <code>{card.command}</code>
              <p>{card.note}</p>
              <footer>
                <em>{card.auth}</em>
                <strong>{card.impact.replace("_", " ")}</strong>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="provider-theatre" aria-label="Branded provider scan theatre">
        <div className="provider-theatre__head">
          <span>VTK://SCAN-THEATRE//ASCII-SURPRISES//C0VIBE.APP</span>
          <b>VIBERS UNITE</b>
        </div>
        <div className="provider-theatre__grid">
          {theatreScenes.map((scene, index) => {
            const brand = providerBrand(scene.providerIds[0] ?? scene.id);
            return (
              <article
                className={`provider-theatre-card provider-theatre-card--${scene.id}`}
                style={{ ...rowStyle(scene.providerIds[0] ?? scene.id), "--i": index, "--meter": `${scene.meter}%` } as CSSProperties}
                key={scene.id}
              >
                <div className="provider-theatre-card__screen" aria-hidden="true">
                  <pre>{scene.ascii.join("\n")}</pre>
                  <span>{scene.call}</span>
                </div>
                <div className="provider-theatre-card__copy">
                  <div>
                    <span>{scene.badge}</span>
                    <b>{scene.label}</b>
                    <em>{scene.status}</em>
                  </div>
                  <p>{scene.copy}</p>
                  <div className="provider-theatre-marks" aria-label={`${scene.label} provider marks`}>
                    {scene.providerIds.map((providerId) => {
                      const markBrand = providerBrand(providerId);
                      return <i style={rowStyle(providerId)} key={providerId}>{markBrand.mark}</i>;
                    })}
                  </div>
                  <div className="provider-theatre-meter" aria-label={`${scene.label} scan readiness ${scene.meter} percent`}>
                    <i />
                  </div>
                  <footer>
                    <strong>{brand.mark}</strong>
                    {scene.foot.map((item) => <span key={item}>{item}</span>)}
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="provider-scan-rail" aria-label="Branded provider scan choreography">
        <div className="provider-scan-rail__head">
          <span>VTK://PROVIDER-SCAN-RAIL//BRAND-COLOR//NO-FAKE-GREEN</span>
          <b>LIVE FEEL / HONEST STATUS</b>
        </div>
        <div className="provider-scan-grid">
          {scanLanes.map((lane, index) => (
            <article className={`provider-scan-lane provider-scan-lane--${lane.id}`} style={{ "--i": index } as CSSProperties} key={lane.id}>
              <div className="provider-scan-lane__top">
                <span>{lane.call}</span>
                <b>{lane.label}</b>
                <em>{lane.count} mapped</em>
              </div>
              <p>{lane.note}</p>
              <div className="provider-scan-beam" aria-hidden="true">
                {lane.providers.map((provider, providerIndex) => {
                  const brand = providerBrand(provider.id);
                  return <i key={provider.id} style={chipStyle(provider.id, providerIndex)}>{brand.mark}</i>;
                })}
              </div>
              <div className="provider-scan-chips">
                {lane.providers.map((provider, providerIndex) => {
                  const brand = providerBrand(provider.id);
                  return (
                    <span key={provider.id} style={chipStyle(provider.id, providerIndex)}>
                      <b>{brand.mark}</b>
                      {provider.label}
                      <small>{chipSignal(provider)}</small>
                    </span>
                  );
                })}
              </div>
              <footer>
                <span>{lane.verified} verified</span>
                <span>{lane.built} built</span>
                <span>not usage</span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="status-legend" aria-label="Coverage label meaning">
        <div className="status-built"><b>built verified</b><span>Adapter has tests and endpoint-backed evidence.</span></div>
        <div className="status-approx"><b>built approximate</b><span>Adapter reconstructs usage with documented confidence.</span></div>
        <div className="status-proxy"><b>proxy-ready</b><span>OpenAI-compatible/local endpoint path is ready.</span></div>
        <div className="status-manual"><b>manual</b><span>Trackable as a ledger or subscription, not verified API usage.</span></div>
      </section>

      <section>
        <h2>Featured scan</h2>
        <p className="muted">A quick read of the tools most vibers will recognize first.</p>
        <div className="provider-radar">
          {featured.map((provider, index) => {
            const brand = providerBrand(provider.id);
            return (
              <article key={provider.id} style={rowStyle(provider.id)}>
                <span className="radar-index">{fit(index + 1, 2)}</span>
                <div className="provider-mark">{brand.mark}</div>
                <b>{provider.label}</b>
                <small>{provider.categories.join(" / ")}</small>
                <i className={statusClass(provider)}>{coverage(provider)}</i>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Category rails</h2>
        <p className="muted">Breadth matters because vibers are not only coders: creators, researchers, local AI users, and automation builders all show up here.</p>
        <div className="category-rails">
          {categoryCounts.map(([category, count]) => (
            <div key={category}>
              <span>{category}</span>
              <b>{count}</b>
              <i style={{ width: `${(count / PROVIDERS.length) * 100}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Coverage</h2>
        <p className="muted">Use <code>vibetracker adapter scaffold &lt;id&gt;</code> to start a provider. Keep registry status planned until fixtures and tests prove the adapter.</p>
        <div className="provider-board">
          {PROVIDERS.map((provider) => {
            const brand = providerBrand(provider.id);
            return (
              <article key={provider.id} style={rowStyle(provider.id)}>
                <div className="provider-mark">{brand.mark}</div>
                <div>
                  <b>{provider.label}</b>
                  <span>{provider.id} · {provider.domain} · {provider.categories.join("/")}</span>
                  <p>{provider.method}</p>
                </div>
                <i className={statusClass(provider)}>{coverage(provider)}</i>
                <em>{provider.auth}</em>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
