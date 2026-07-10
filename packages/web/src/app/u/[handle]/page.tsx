import { notFound } from "next/navigation";
import { getProfile } from "../../../lib/data";
import { formatUsd, formatInt } from "../../../lib/leaderboard";
import { providerBrand, providerVars } from "../../../lib/provider-brand";
import { TrustBadge } from "../../../components/TrustBadge";
import type { Tier } from "../../../lib/leaderboard";
import type { CSSProperties } from "react";
import { GITHUB_LEVEL_COLORS, trustSignalMark, trustSignalMetric, trustSignalTitle, trustSignalWindow, type ProfileTrustSignal } from "../../../lib/profile-trust";
import { buildProfileBlackBoxReplay, buildProfileProofSpine, type ProfileBlackBoxImpact, type ProfileBlackBoxReplay } from "../../../lib/profile-proof";
import { buildProfileLifeDashboard } from "../../../lib/profile-life";
import { buildProfileSignalConstellation } from "../../../lib/profile-signal-constellation";
import { buildUsageHeatgrid, type UsageHeatgrid } from "../../../lib/usage-heatgrid";
import { buildVibeScoreReceipt, buildVibeScoreReactor, type VibeScoreReactor, type VibeScoreReceipt } from "../../../lib/vibe-score";
import { buildProfileTransmissionDeck, type ProfileTransmissionDeck } from "../../../lib/profile-transmission";
import { buildProfileIntelligenceDeck, type ProfileIntelligenceDeck } from "../../../lib/profile-intelligence";
import { buildProfileCommandCenter, type ProfileCommandCenter } from "../../../lib/profile-command-center";
import { buildProfileBadgeForge, type ProfileBadgeForge } from "../../../lib/profile-badge-forge";
import { buildProfileOperatorPoster, type ProfileOperatorPoster } from "../../../lib/profile-operator-poster";
import { buildProfileBroadcastStrip, type ProfileBroadcastStrip } from "../../../lib/profile-broadcast-strip";
import { buildProfileSignalPassport, type ProfileSignalPassport } from "../../../lib/profile-signal-passport";
import { buildProfileDatastreamReceipt, type ProfileDatastreamReceipt } from "../../../lib/profile-datastream";
import { buildProfileHeroBridge, type ProfileHeroBridge } from "../../../lib/profile-hero-bridge";
import { buildProfilePocketCard, type ProfilePocketCard, type ProfilePocketImpact } from "../../../lib/profile-pocket-card";

export const revalidate = 60;

function GithubHeatgrid({ signal }: { signal: Extract<ProfileTrustSignal, { kind: "github_activity" }> }) {
  const days = signal.days ?? [];
  const pad = days[0] ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
  const blanks = Array.from({ length: pad }, (_, index) => (
    <span className="profile-gh-cell profile-gh-cell-blank" style={{ "--i": index } as CSSProperties} key={`blank-${index}`} />
  ));
  const cells = days.map((day, index) => (
    <span
      className="profile-gh-cell"
      style={{ "--i": index + pad, "--gh": GITHUB_LEVEL_COLORS[day.level] } as CSSProperties}
      title={`${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`}
      key={day.date}
    />
  ));
  return (
    <div className="profile-gh-grid" aria-label="GitHub contribution heatgrid">
      {blanks}{cells}
    </div>
  );
}

function TrustSignalCard({ signal }: { signal: ProfileTrustSignal }) {
  const title = trustSignalTitle(signal);
  return (
    <article className={`profile-trust-card profile-trust-${signal.kind}`}>
      <div className="profile-trust-card__top">
        <span>{trustSignalMark(signal)}</span>
        <i>NOT USAGE</i>
      </div>
      <b>{title}</b>
      <strong>{trustSignalMetric(signal)}</strong>
      <small>{trustSignalWindow(signal)} · affects totals: no · usage verified: no</small>
      {signal.kind === "github_activity" ? <GithubHeatgrid signal={signal} /> : null}
      <p>{signal.note}</p>
    </article>
  );
}

function ProfilePublicRelayCockpitPanel({
  handle,
  tier,
  syncedAt,
  topProviderMark,
  trustCount,
  bridge,
  receipt,
  heatgrid,
  score,
  passport,
}: {
  handle: string;
  tier: Tier;
  syncedAt: string;
  topProviderMark: string;
  trustCount: number;
  bridge: ProfileHeroBridge;
  receipt: ProfileDatastreamReceipt;
  heatgrid: UsageHeatgrid;
  score: VibeScoreReceipt;
  passport: ProfileSignalPassport;
}) {
  const profileUrl = `https://c0vibe.app/u/${handle}`;
  const stages = [
    {
      id: "score",
      label: "Vibe score",
      impact: "SCORE",
      mark: "VS",
      value: `${score.score}/100`,
      route: "score://usage-datastream",
      note: "Score is derived from reviewed aggregate usage factors.",
      guardrail: "Trust appears as context only and cannot inflate usage.",
      meter: score.score,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: [`${score.score}\n/100\nSCORE`, "DATA\nSTREAM\nONLY", "NO\nTRUST\nBOOST"],
    },
    {
      id: "usage",
      label: "Usage proof",
      impact: "USAGE",
      mark: topProviderMark,
      value: `${formatInt(receipt.totals.records)} records`,
      route: "usage://accepted-aggregates",
      note: "Public usage comes from accepted records and provider summaries.",
      guardrail: "No prompt text, output text, secrets, or raw files are published.",
      meter: bridge.stages.find((stage) => stage.impact === "usage")?.meter ?? 90,
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      frames: [`${topProviderMark}\nUSE\nROWS`, `${formatInt(receipt.totals.providers)}\nSOURCES\nOK`, "RAW\nDATA\n0"],
    },
    {
      id: "rhythm",
      label: "Heatgrid rhythm",
      impact: "USAGE",
      mark: "GH",
      value: `${formatInt(heatgrid.totals.activeDays)} days`,
      route: "heatgrid://official-github-colors",
      note: "The usage rhythm uses the official GitHub contribution scale for public readability.",
      guardrail: "Only daily aggregates light cells; empty cells never invent activity.",
      meter: Math.min(100, Math.max(0, heatgrid.totals.activeDays * 9)),
      from: "#0e4429",
      to: "#39d353",
      ink: "#ffffff",
      frames: ["░▒▓\nGRID\nFILL", "DAY\nOPS\nUSD", "USAGE\nONLY\nOK"],
    },
    {
      id: "trust",
      label: "Trust side rail",
      impact: "NOT USAGE",
      mark: "NO",
      value: `${trustCount} signals`,
      route: "trust://side-rail",
      note: "GitHub, Higgsfield MCP, and creator cadence can explain credibility.",
      guardrail: "Trust never changes spend, credits, operations, rank, or verified provider totals.",
      meter: trustCount ? 100 : 0,
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
      frames: ["TRUST\nSIDE\nRAIL", "NOT\nUSAGE\nOK", "RANK\nBOOST\n0"],
    },
    {
      id: "privacy",
      label: "Privacy seal",
      impact: "PRIVACY",
      mark: "PR",
      value: "0 raw reads",
      route: "privacy://aggregate-only",
      note: "Public profile panels repeat the raw prompt/output boundary.",
      guardrail: "Reviewed aggregates only; no hidden upload, no raw prompt reads, no output reads.",
      meter: 100,
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
      frames: ["MASK\nRAW\n0", "DRY\nRUN\nFIRST", "SAFE\nSHARE\nOK"],
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      impact: "PUBLISH",
      mark: "C0",
      value: tier === "self_reported" ? "reviewed" : "attested",
      route: profileUrl,
      note: "The public card points people to the reviewed C0VIBE profile.",
      guardrail: "C0vibe.app is the explicit destination, not a hidden sync.",
      meter: 96,
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      frames: ["C0V\nIBE\nAPP", "VIBERS\nUNITE\nGO", "PUBLIC\nPROFILE\nOK"],
    },
  ];
  const terminalLines = [
    "+--------------------------------------------------------------+",
    `| VTK://PUBLIC-RELAY-COCKPIT//@${handle.padEnd(22).slice(0, 22)} |`.slice(0, 66),
    `| tier ${tier.padEnd(16).slice(0, 16)} // synced ${syncedAt.padEnd(18).slice(0, 18)} |`,
    `| score ${String(score.score).padStart(3)}/100 // records ${formatInt(receipt.totals.records).padEnd(9).slice(0, 9)} // days ${formatInt(heatgrid.totals.activeDays).padEnd(5).slice(0, 5)} |`,
    `| trust ${String(trustCount).padEnd(3)} NOT USAGE // raw prompts 0 // hidden uploads 0 |`,
    `| passport ${passport.passportId.padEnd(22).slice(0, 22)} // ${topProviderMark.padEnd(4).slice(0, 4)} top |`,
    "| usage -> heatgrid -> score -> profile -> C0VIBE relay        |",
    "| Vibers Unite // c0vibe.app                                   |",
    "+--------------------------------------------------------------+",
  ];

  return (
    <section className="profile-public-relay-cockpit" aria-label="Public profile relay cockpit">
      <div className="profile-public-relay-cockpit__head">
        <div>
          <span>VTK://PUBLIC-RELAY-COCKPIT//SHARE-FIRST//NO-MIXED-SIGNALS</span>
          <b>public relay cockpit</b>
        </div>
        <p>One shareable first read: usage proof, heatgrid rhythm, score receipt, trust side rail, privacy seal, and C0VIBE relay.</p>
      </div>
      <div className="profile-public-relay-cockpit__body">
        <aside className="profile-public-relay-cockpit__terminal" aria-label="Public relay cockpit terminal">
          <div className="console-top"><span>relay@profile</span><b>{tier}</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="profile-public-relay-cockpit__share" aria-label="Public relay share line">
            <span>Vibers Unite</span>
            <a href={profileUrl}>{profileUrl}</a>
            <code>{passport.passportId}</code>
          </div>
        </aside>
        <div className="profile-public-relay-cockpit__stages" aria-label="Public relay cockpit signal stages">
          {stages.map((stage, index) => (
            <article
              className={`profile-public-relay-stage profile-public-relay-stage--${stage.id}`}
              data-impact={stage.impact}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.from,
                "--brand-to": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="profile-public-relay-stage__top">
                <i>{stage.mark}</i>
                <span>{stage.impact}</span>
              </div>
              <div className="profile-public-relay-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{stage.label}</b>
              <strong>{stage.value}</strong>
              <code>{stage.route}</code>
              <p>{stage.note}</p>
              <small>{stage.guardrail}</small>
              <footer aria-label={`${stage.label} public relay meter ${stage.meter} percent`}>
                <em />
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileHeroBridgePanel({ bridge }: { bridge: ProfileHeroBridge }) {
  return (
    <section className="profile-hero-bridge" aria-label="Profile first-glance signal bridge">
      <div className="profile-hero-bridge__head">
        <div>
          <span>VTK://PROFILE-HERO-BRIDGE//FIRST-GLANCE//C0VIBE.APP</span>
          <b>{bridge.headline}</b>
        </div>
        <p>{bridge.shareLine}</p>
      </div>
      <div className="profile-hero-bridge__body">
        <aside className="profile-hero-bridge__terminal" aria-label={`${bridge.headline} terminal`}>
          <div className="console-top"><span>bridge@profile</span><b>ZERO WRITES</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="profile-hero-bridge__totals" aria-label={`${bridge.headline} safety totals`}>
            <span>{bridge.totals.score}/100 score</span>
            <span>{bridge.totals.usageStages} usage rails</span>
            <span>{bridge.totals.notUsageStages} not usage</span>
            <span>{bridge.totals.publishStages} publish</span>
            <span>{bridge.totals.usageWrites} writes</span>
          </div>
          <p>{bridge.subline}</p>
        </aside>
        <div className="profile-hero-bridge__stages" aria-label={`${bridge.headline} separated signal rails`}>
          {bridge.stages.map((stage, index) => (
            <article
              className={`profile-hero-bridge-stage profile-hero-bridge-stage--${stage.impact}`}
              data-impact={stage.impact}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.from,
                "--brand-to": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="profile-hero-bridge-stage__top">
                <i>{stage.mark}</i>
                <span>{stage.impact === "not_usage" ? "NOT USAGE" : stage.impact.toUpperCase()}</span>
              </div>
              <b>{stage.label}</b>
              <strong>{stage.value}</strong>
              <code>{stage.route}</code>
              <p>{stage.note}</p>
              <small>{stage.guardrail}</small>
              <pre aria-label={`${stage.label} first-glance terminal line`}>{stage.terminalLine}</pre>
              <footer aria-label={`${stage.label} bridge meter ${stage.meter} percent`}>
                <em />
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function profilePocketImpactLabel(impact: ProfilePocketImpact): string {
  if (impact === "not_usage") return "NOT USAGE";
  if (impact === "publish") return "PUBLISH";
  return impact.toUpperCase();
}

function ProfilePocketCardPanel({ card }: { card: ProfilePocketCard }) {
  return (
    <section className="profile-pocket-card" aria-label="Mobile-readable profile pocket signal">
      <div className="profile-pocket-card__head">
        <div>
          <span>VTK://PROFILE-POCKET-CARD//MOBILE-SIGNAL//C0VIBE.APP</span>
          <b>{card.headline}</b>
        </div>
        <p>{card.subline}</p>
      </div>
      <div className="profile-pocket-card__body">
        <aside className="profile-pocket-card__terminal" aria-label={`${card.headline} terminal receipt`}>
          <div className="console-top"><span>pocket@profile</span><b>{card.seal}</b></div>
          <pre>{card.terminalLines.join("\n")}</pre>
          <div className="profile-pocket-card__guards" aria-label={`${card.headline} privacy and trust guards`}>
            <span>{card.totals.score}/100 score</span>
            <span>{formatInt(card.totals.ops)} ops</span>
            <span>{formatUsd(card.totals.usd)} spend</span>
            <span>{card.totals.trustSignals} NOT USAGE</span>
            <span>{card.totals.promptReads} raw reads</span>
            <a href={card.shareUrl}>c0vibe.app</a>
          </div>
        </aside>
        <div className="profile-pocket-card__metrics" aria-label={`${card.headline} signal metrics`}>
          {card.metrics.map((metric, index) => (
            <article
              className={`profile-pocket-metric profile-pocket-metric--${metric.impact}`}
              data-impact={profilePocketImpactLabel(metric.impact)}
              style={{
                "--i": index,
                "--meter": `${metric.meter}%`,
                "--brand-from": metric.from,
                "--brand-to": metric.to,
                "--brand-ink": metric.ink,
              } as CSSProperties}
              key={metric.id}
            >
              <div className="profile-pocket-metric__top">
                <i>{metric.mark}</i>
                <span>{profilePocketImpactLabel(metric.impact)}</span>
              </div>
              <div className="profile-pocket-metric__screen" aria-hidden="true">
                {metric.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${metric.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{metric.label}</b>
              <strong>{metric.value}</strong>
              <code>{metric.route}</code>
              <p>{metric.note}</p>
              <small>{metric.guardrail}</small>
              <footer aria-label={`${metric.label} pocket signal meter ${metric.meter} percent`}>
                <em />
                <small>{metric.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileWalletPassPanel({ card }: { card: ProfilePocketCard }) {
  const pass = card.walletPass;
  return (
    <section className="profile-wallet-pass" aria-label="C0VIBE public wallet pass">
      <div className="profile-wallet-pass__head">
        <div>
          <span>VTK://PROFILE-WALLET-PASS//POCKET-PROOF//C0VIBE.APP</span>
          <b>{pass.passId}</b>
        </div>
        <p>{pass.subtitle}</p>
      </div>
      <div className="profile-wallet-pass__body">
        <aside className="profile-wallet-pass__terminal" aria-label={`${pass.title} terminal`}>
          <div className="console-top"><span>wallet@profile</span><b>{pass.status}</b></div>
          <pre>{pass.terminalLines.join("\n")}</pre>
          <div className="profile-wallet-pass__seals" aria-label={`${pass.title} safety seals`}>
            {pass.seals.map((seal) => (
              <span key={seal}>{seal}</span>
            ))}
          </div>
        </aside>
        <div className="profile-wallet-pass__card" aria-label={`${pass.title} matrix card`}>
          <div className="profile-wallet-pass__matrix" aria-label="Deterministic wallet pass verification matrix">
            <pre>{pass.matrixRows.join("\n")}</pre>
          </div>
          <div className="profile-wallet-pass__copy">
            <span>{pass.status === "published" ? "PUBLIC PASS" : "WAITING PASS"}</span>
            <b>{pass.title}</b>
            <p>{card.subline}</p>
            <a href={card.shareUrl}>{card.shareUrl}</a>
          </div>
        </div>
        <div className="profile-wallet-pass__chips" aria-label={`${pass.title} labelled chips`}>
          {pass.chips.map((chip, index) => (
            <article
              data-impact={profilePocketImpactLabel(chip.impact)}
              style={{ "--i": index } as CSSProperties}
              key={chip.id}
            >
              <span>{chip.label}</span>
              <b>{chip.value}</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileViberCardPanel({
  handle,
  tier,
  syncedAt,
  topProviderMark,
  trustCount,
  receipt,
  heatgrid,
  score,
  passport,
}: {
  handle: string;
  tier: Tier;
  syncedAt: string;
  topProviderMark: string;
  trustCount: number;
  receipt: ProfileDatastreamReceipt;
  heatgrid: UsageHeatgrid;
  score: VibeScoreReceipt;
  passport: ProfileSignalPassport;
}) {
  const profileUrl = `https://c0vibe.app/u/${handle}`;
  const lanes = [
    {
      id: "score",
      label: "Vibe Score",
      value: `${score.score}/100`,
      impact: "USAGE",
      note: "Derived from reviewed aggregate usage factors.",
      mark: "VS",
      meter: score.score,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "rhythm",
      label: "Heatgrid",
      value: `${formatInt(heatgrid.totals.activeDays)} active days`,
      impact: "USAGE",
      note: "Daily usage rhythm, official GitHub color scale.",
      mark: "HG",
      meter: Math.min(100, Math.max(0, heatgrid.totals.activeDays * 8)),
      from: "#0e4429",
      to: "#39d353",
      ink: "#ffffff",
    },
    {
      id: "usage",
      label: "Usage Proof",
      value: `${formatInt(receipt.totals.records)} records`,
      impact: "USAGE",
      note: `${formatInt(receipt.totals.providers)} provider summaries accepted.`,
      mark: topProviderMark,
      meter: 92,
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
    },
    {
      id: "trust",
      label: "Trust Rail",
      value: `${trustCount} signals`,
      impact: "NOT USAGE",
      note: "Social, GitHub, MCP, and creator cadence cannot move spend.",
      mark: "NO",
      meter: trustCount ? 100 : 0,
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
    },
    {
      id: "privacy",
      label: "Privacy Seal",
      value: "0 raw reads",
      impact: "PRIVACY",
      note: "No prompts, outputs, secrets, or raw files in the public card.",
      mark: "PR",
      meter: 100,
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
    },
    {
      id: "relay",
      label: "C0VIBE Relay",
      value: "Vibers Unite",
      impact: "PUBLISH",
      note: "Explicit public destination after reviewed aggregate upload.",
      mark: "C0",
      meter: 96,
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
    },
  ];
  const terminalLines = [
    "VTK://PROFILE-VIBER-CARD//MOBILE-READABLE//C0VIBE.APP",
    `@${handle} // tier=${tier} // synced=${syncedAt}`,
    `score=${score.score}/100 records=${formatInt(receipt.totals.records)} providers=${formatInt(receipt.totals.providers)}`,
    `activeDays=${formatInt(heatgrid.totals.activeDays)} trustSignals=${trustCount} NOT_USAGE`,
    "rawPromptReads=0 rawOutputReads=0 hiddenUploads=0",
    `passport=${passport.passportId}`,
    `${profileUrl} // Vibers Unite`,
  ];

  return (
    <section className="profile-viber-card" aria-label="Mobile-readable public Viber profile card">
      <div className="profile-viber-card__head">
        <div>
          <span>VTK://PROFILE-VIBER-CARD//MOBILE-READABLE//C0VIBE.APP</span>
          <b>pocket-readable Viber card</b>
        </div>
        <p>A phone-first share card: one terminal, six labelled rails, and the same reviewed datastream behind score, heatgrid, profile, and public relay.</p>
      </div>
      <div className="profile-viber-card__body">
        <aside className="profile-viber-card__terminal" aria-label="Mobile-readable Viber card terminal">
          <div className="console-top"><span>card@profile</span><b>{tier}</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="profile-viber-card__seals" aria-label="Viber card public safety seals">
            <span>usage datastream</span>
            <span>trust != usage</span>
            <span>aggregate only</span>
            <a href={profileUrl}>c0vibe.app/u/{handle}</a>
          </div>
        </aside>
        <div className="profile-viber-card__lanes" aria-label="Mobile-readable public profile rails">
          {lanes.map((lane, index) => (
            <article
              className={`profile-viber-card-lane profile-viber-card-lane--${lane.id}`}
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
              <div className="profile-viber-card-lane__top">
                <i>{lane.mark}</i>
                <span>{lane.impact}</span>
              </div>
              <b>{lane.label}</b>
              <strong>{lane.value}</strong>
              <p>{lane.note}</p>
              <footer aria-label={`${lane.label} Viber card meter ${lane.meter} percent`}>
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

function profileSignalTowerLabel(impact: string): string {
  if (impact === "not_usage") return "NOT USAGE";
  if (impact === "publish") return "PUBLISH";
  if (impact === "score") return "SCORE";
  return "USAGE";
}

function profileSignalTowerFrames(stage: ProfileHeroBridge["stages"][number]): string[] {
  const rail = profileSignalTowerLabel(stage.impact).replace("NOT ", "NO ");
  return [
    `${stage.mark}\n${stage.id.toUpperCase()}\n${rail}`,
    `${stage.value}\n${stage.route.split("://")[0].toUpperCase()}\n${stage.meter}%`,
    `${stage.mark}${stage.mark}\nC0VIBE\nUNITE`,
  ];
}

function ProfileSignalTowerPanel({
  bridge,
  receipt,
}: {
  bridge: ProfileHeroBridge;
  receipt: ProfileDatastreamReceipt;
}) {
  const terminalLines = [
    "+------------------------------------------------------+",
    `| VTK://PUBLIC-SIGNAL-TOWER//@${receipt.headline.replace(/^@/, "").slice(0, 24).padEnd(24)} |`.slice(0, 56),
    `| seal ${receipt.seal} // score ${String(bridge.totals.score).padStart(3, "0")}/100 // writes ${bridge.totals.usageWrites}      |`,
    `| usage rails ${bridge.totals.usageStages} // trust ${bridge.totals.notUsageStages} NOT USAGE       |`,
    `| records ${formatInt(receipt.totals.records).padEnd(10).slice(0, 10)} // sources ${formatInt(receipt.totals.providers).padEnd(8).slice(0, 8)} // days ${formatInt(receipt.totals.activeDays).padEnd(5).slice(0, 5)} |`,
    "| public proof reads reviewed aggregates only          |",
    "| Vibers Unite // c0vibe.app                           |",
    "+------------------------------------------------------+",
  ];

  return (
    <section className="profile-signal-tower" aria-label="Public profile signal tower">
      <div className="profile-signal-tower__head">
        <div>
          <span>VTK://PUBLIC-SIGNAL-TOWER//SCORE-USAGE-TRUST-PUBLISH//C0VIBE.APP</span>
          <b>public signal tower</b>
        </div>
        <p>Score, usage, rhythm, sources, trust, and C0VIBE publish are visible before the deep receipts.</p>
      </div>
      <div className="profile-signal-tower__body">
        <aside className="profile-signal-tower__terminal" aria-label="Public signal tower terminal">
          <div className="console-top"><span>tower@profile</span><b>{receipt.seal}</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="profile-signal-tower__guards" aria-label="Public signal tower guardrails">
            <span>NO RAW PROMPTS</span>
            <span>0 hidden uploads</span>
            <span>trust is NOT USAGE</span>
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="profile-signal-tower__rails" aria-label="Public signal tower rails">
          {bridge.stages.map((stage, index) => (
            <article
              className={`profile-signal-tower-rail profile-signal-tower-rail--${stage.impact}`}
              data-impact={profileSignalTowerLabel(stage.impact)}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.from,
                "--brand-to": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="profile-signal-tower-rail__top">
                <i>{stage.mark}</i>
                <span>{profileSignalTowerLabel(stage.impact)}</span>
              </div>
              <div className="profile-signal-tower-rail__scope" aria-hidden="true">
                {profileSignalTowerFrames(stage).map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{stage.label}</b>
              <strong>{stage.value}</strong>
              <code>{stage.route}</code>
              <p>{stage.note}</p>
              <small>{stage.guardrail}</small>
              <footer aria-label={`${stage.label} public signal tower meter ${stage.meter} percent`}>
                <em />
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function blackBoxImpactLabel(impact: ProfileBlackBoxImpact): string {
  if (impact === "not_usage") return "NOT USAGE";
  if (impact === "local_only") return "LOCAL ONLY";
  return impact.toUpperCase();
}

function UsageHeatgridPanel({ grid }: { grid: UsageHeatgrid }) {
  const blanks = Array.from({ length: grid.pad }, (_, index) => (
    <span className="profile-usage-cell profile-usage-cell-blank" style={{ "--i": index } as CSSProperties} key={`usage-blank-${index}`} />
  ));
  return (
    <section className={`profile-usage-heatgrid profile-usage-heatgrid--${grid.source}`} aria-label="Profile usage heatgrid">
      <div className="profile-usage-heatgrid__head">
        <span>VTK://USAGE-HEATGRID//OFFICIAL-GITHUB-COLORS//C0VIBE</span>
        <b>{grid.source.replace(/_/g, " ")}</b>
      </div>
      <div className="profile-usage-heatgrid__body">
        <aside className="profile-usage-terminal" aria-label="Usage heatgrid terminal">
          <div className="console-top"><span>heatgrid@usage</span><b>PUBLIC</b></div>
          <pre>{grid.terminalLines.join("\n")}</pre>
          <div className="profile-usage-legend" aria-label="Official GitHub heat scale">
            <span>Less</span>
            {GITHUB_LEVEL_COLORS.map((color, index) => (
              <i style={{ "--gh": color, "--i": index } as CSSProperties} key={color} />
            ))}
            <span>More</span>
          </div>
        </aside>
        <div className="profile-usage-heatgrid__main">
          <div className="profile-usage-summary">
            <div><span>Active days</span><b>{formatInt(grid.totals.activeDays)}</b></div>
            <div><span>Operations</span><b>{formatInt(grid.totals.ops)}</b></div>
            <div><span>Spend est.</span><b>{formatUsd(grid.totals.usd)}</b></div>
          </div>
          <div className="profile-usage-grid-shell">
            <div className="profile-usage-grid" aria-label="Daily public usage aggregate heatgrid">
              {blanks}
              {grid.cells.map((cell, index) => (
                <span
                  className="profile-usage-cell"
                  data-level={cell.level}
                  style={{ "--i": index + grid.pad, "--gh": cell.color } as CSSProperties}
                  title={`${cell.date}: ${formatInt(cell.ops)} ops, ${formatUsd(cell.usd)} est.`}
                  key={cell.date}
                />
              ))}
            </div>
          </div>
          <div className="profile-usage-fill-replay" aria-label="Animated usage heatgrid fill replay">
            {grid.fillStages.length ? grid.fillStages.map((stage, index) => (
              <article
                className="profile-usage-fill-stage"
                data-level={stage.level}
                style={{ "--i": index, "--gh": stage.color } as CSSProperties}
                key={`${stage.date}-${stage.sequence}`}
              >
                <i aria-hidden="true" />
                <span>{stage.label}</span>
                <b>{stage.date}</b>
                <small>{formatInt(stage.ops)} ops · {formatUsd(stage.usd)} · usage only</small>
                <code>{stage.terminalLine}</code>
              </article>
            )) : (
              <div className="profile-usage-fill-stage profile-usage-fill-stage--empty">
                <i aria-hidden="true" />
                <span>waiting</span>
                <b>no usage cells</b>
                <small>Sync locally and upload reviewed aggregates to light the grid.</small>
                <code>fill 00/00 waiting // NOT USAGE rails stay separate</code>
              </div>
            )}
          </div>
          <p>{grid.subline}</p>
        </div>
      </div>
    </section>
  );
}

function VibeScorePanel({ receipt }: { receipt: VibeScoreReceipt }) {
  return (
    <section className={`profile-vibe-score profile-vibe-score--${receipt.tier}`} aria-label="Public Vibe Score proof receipt">
      <div className="profile-vibe-score__head">
        <span>VTK://VIBE-SCORE//PROOF-RECEIPT//NO-FAKE-SPEND</span>
        <b>{receipt.tier}</b>
      </div>
      <div className="profile-vibe-score__body">
        <aside className="profile-vibe-score__terminal" aria-label="Vibe Score terminal receipt">
          <div className="console-top"><span>score@c0vibe</span><b>RECEIPT</b></div>
          <pre>{receipt.terminalLines.join("\n")}</pre>
          <div className="profile-vibe-score__stamp" aria-label="Shareable Vibe Score line">
            <span>Vibers Unite</span>
            <code>{receipt.shareLine}</code>
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

function VibeScoreReactorPanel({ reactor }: { reactor: VibeScoreReactor }) {
  return (
    <section className={`profile-score-reactor profile-score-reactor--${reactor.tier}`} aria-label="Public Vibe Score reactor">
      <div className="profile-score-reactor__head">
        <div>
          <span>VTK://SCORE-REACTOR//DATASTREAM-OSCILLOSCOPE//NO-MIXED-SIGNALS</span>
          <b>{reactor.headline}</b>
        </div>
        <p>{reactor.subline}</p>
      </div>
      <div className="profile-score-reactor__body">
        <aside className="profile-score-reactor__terminal" aria-label="Score reactor terminal">
          <div className="console-top"><span>reactor@profile</span><b>{reactor.tier}</b></div>
          <pre>{reactor.terminalLines.join("\n")}</pre>
          <div className="profile-score-reactor__seal" aria-label="Score reactor local seal">
            <span>seal</span>
            <code>{reactor.seal}</code>
          </div>
          <div className="profile-score-reactor__guardrails" aria-label="Score reactor guardrails">
            {reactor.guardrails.map((guardrail) => <span key={guardrail}>{guardrail}</span>)}
          </div>
        </aside>
        <div className="profile-score-reactor__core">
          <div className="profile-score-reactor__scope">
            <div className="profile-score-reactor__score" style={{ "--score-pct": `${reactor.score}%` } as CSSProperties}>
              <span>{reactor.score}</span>
              <small>/100</small>
            </div>
            <pre aria-label="Score reactor oscilloscope">{reactor.signalRows.join("\n")}</pre>
            <code>{reactor.shareLine}</code>
          </div>
          <div className="profile-score-reactor__rails" aria-label="Score reactor factor rails">
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

function ProfileDatastreamPanel({ receipt }: { receipt: ProfileDatastreamReceipt }) {
  return (
    <section className="profile-datastream-receipt" aria-label="Public profile datastream lineage receipt">
      <div className="profile-datastream-receipt__head">
        <div>
          <span>VTK://PROFILE-DATASTREAM//SOURCE-TO-SCORE//NO-RAW-PROMPTS</span>
          <b>{receipt.headline}</b>
        </div>
        <p>{receipt.subline}</p>
      </div>
      <div className="profile-datastream-receipt__body">
        <aside className="profile-datastream-terminal" aria-label="Profile datastream terminal receipt">
          <div className="console-top"><span>datastream@profile</span><b>{receipt.seal}</b></div>
          <pre>{receipt.terminalLines.join("\n")}</pre>
          <div className="profile-datastream-totals" aria-label="Profile datastream totals">
            <span>{formatInt(receipt.totals.records)} records</span>
            <span>{formatInt(receipt.totals.providers)} sources</span>
            <span>{formatInt(receipt.totals.activeDays)} days</span>
            <span>{formatInt(receipt.totals.trustSignals)} not usage</span>
            <span>{receipt.totals.score}/100 score</span>
          </div>
          <div className="profile-datastream-guards" aria-label="Profile datastream guardrails">
            {receipt.guardrails.map((guardrail) => <span key={guardrail}>{guardrail}</span>)}
          </div>
        </aside>
        <div className="profile-datastream-lanes" aria-label="Profile source-to-score lanes">
          {receipt.lanes.map((lane, index) => (
            <article
              className={`profile-datastream-lane profile-datastream-lane--${lane.id}`}
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
              <div className="profile-datastream-lane__top">
                <i>{lane.mark}</i>
                <span>{lane.impact === "not_usage" ? "NOT USAGE" : lane.impact.toUpperCase()}</span>
              </div>
              <b>{lane.label}</b>
              <strong>{lane.value}</strong>
              <code>{lane.route}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <pre aria-label={`${lane.label} datastream terminal lines`}>{lane.terminalLines.join("\n")}</pre>
              <footer aria-label={`${lane.label} datastream meter ${lane.meter} percent`}>
                <em>{lane.status}</em>
                <small>{lane.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileBlackBoxReplayPanel({ replay }: { replay: ProfileBlackBoxReplay }) {
  return (
    <section className="profile-black-box" aria-label="Public profile black box replay recorder">
      <div className="profile-black-box__head">
        <div>
          <span>VTK://PUBLIC-BLACK-BOX//REPLAY-RECORDER//NO-SECRETS</span>
          <b>{replay.headline}</b>
        </div>
        <p>{replay.subline}</p>
      </div>
      <div className="profile-black-box__body">
        <aside className="profile-black-box__terminal" aria-label="Public black box replay terminal">
          <div className="console-top"><span>blackbox@profile</span><b>{replay.seal}</b></div>
          <pre>{replay.terminalLines.join("\n")}</pre>
          <div className="profile-black-box__guards" aria-label="Public black box guardrails">
            {replay.guardrails.map((guardrail) => <span key={guardrail}>{guardrail}</span>)}
          </div>
        </aside>
        <div className="profile-black-box__events" aria-label="Public black box replay stages">
          {replay.events.map((event, index) => (
            <article
              className={`profile-black-box-event profile-black-box-event--${event.id}`}
              data-impact={event.impact}
              style={{
                "--i": index,
                "--meter": `${event.meter}%`,
                "--brand-from": event.from,
                "--brand-to": event.to,
                "--brand-ink": event.ink,
              } as CSSProperties}
              key={event.id}
            >
              <div className="profile-black-box-event__top">
                <i>{event.mark}</i>
                <span>{blackBoxImpactLabel(event.impact)}</span>
              </div>
              <b>{event.label}</b>
              <strong>{event.value}</strong>
              <code>{event.route}</code>
              <p>{event.note}</p>
              <small>{event.guardrail}</small>
              <pre aria-label={`${event.label} public black box terminal line`}>{event.terminalLine}</pre>
              <footer aria-label={`${event.label} black box meter ${event.meter} percent`}>
                <em>{event.status}</em>
                <small>{event.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileCommandCenterPanel({ center }: { center: ProfileCommandCenter }) {
  return (
    <section className="profile-command-center" aria-label="Profile command center">
      <div className="profile-command-center__head">
        <span>VTK://PROFILE-COMMAND//VIBERS-UNITE//NO-MIXED-SIGNALS</span>
        <b>{center.callsign}</b>
      </div>
      <div className="profile-command-center__body">
        <aside className="profile-command-terminal" aria-label="Profile command terminal">
          <div className="console-top"><span>command@profile</span><b>C0VIBE</b></div>
          <pre>{center.terminalLines.join("\n")}</pre>
          <div className="profile-command-share" aria-label="Shareable command center line">
            <span>Vibers Unite</span>
            <code>{center.shareLine}</code>
          </div>
          <div className="profile-command-relay-tape" aria-label="Profile share relay tape">
            {center.relayTicks.map((tick, index) => (
              <article
                data-impact={tick.impact}
                style={{
                  "--i": index,
                  "--meter": `${tick.meter}%`,
                  "--brand-from": tick.from,
                  "--brand-to": tick.to,
                  "--brand-ink": tick.ink,
                } as CSSProperties}
                key={tick.id}
              >
                <i>{tick.mark}</i>
                <span>{tick.label}</span>
                <code>{tick.command}</code>
                <b>{tick.status}</b>
                <em aria-label={`${tick.label} relay meter ${tick.meter} percent`} />
                <small>{tick.note}</small>
              </article>
            ))}
          </div>
        </aside>
        <div className="profile-command-core">
          <div className="profile-command-core__copy">
            <h2>{center.headline}</h2>
            <p>{center.subline}</p>
          </div>
          <div className="profile-command-stream" aria-label="Profile usage datastream spine">
            {center.streamSpine.map((stage, index) => (
              <article
                className="profile-command-stream__stage"
                data-impact={stage.impact}
                style={{
                  "--i": index,
                  "--meter": `${stage.meter}%`,
                  "--brand-from": stage.from,
                  "--brand-to": stage.to,
                  "--brand-ink": stage.ink,
                } as CSSProperties}
                key={stage.id}
              >
                <i>{stage.mark}</i>
                <div>
                  <span>{stage.impact === "not_usage" ? "NOT USAGE" : stage.impact.toUpperCase()}</span>
                  <b>{stage.label}</b>
                  <small>{stage.note}</small>
                </div>
                <strong>{stage.value}</strong>
              </article>
            ))}
          </div>
          <div className="profile-command-waveform" aria-label="Profile public usage waveform">
            {center.waveform.map((point, index) => (
              <article
                data-impact={point.impact}
                style={{
                  "--i": index,
                  "--meter": `${point.meter}%`,
                  "--brand-from": point.from,
                  "--brand-to": point.to,
                  "--brand-ink": point.ink,
                } as CSSProperties}
                title={`${point.label}: ${point.detail}`}
                key={point.id}
              >
                <i>{point.mark}</i>
                <span>{point.label}</span>
                <b>{point.value}</b>
                <em aria-label={`${point.label} waveform meter ${point.meter} percent`} />
              </article>
            ))}
          </div>
          <div className="profile-command-rings" aria-label="Profile command rings">
            {center.rings.map((ring, index) => (
              <article
                className={`profile-command-ring profile-command-ring--${ring.tone}`}
                data-impact={ring.impact}
                style={{
                  "--i": index,
                  "--meter": `${ring.meter}%`,
                  "--brand-from": ring.from,
                  "--brand-to": ring.to,
                  "--brand-ink": ring.ink,
                } as CSSProperties}
                key={ring.id}
              >
                <i>{ring.mark}</i>
                <span>{ring.impact === "not_usage" ? "NOT USAGE" : ring.impact.toUpperCase()}</span>
                <b>{ring.label}</b>
                <strong>{ring.value}</strong>
                <small>{ring.note}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="profile-command-sources" aria-label="Profile command top sources">
        {center.sources.length ? center.sources.map((source, index) => (
          <article
            style={{
              "--i": index,
              "--meter": `${source.meter}%`,
              "--brand-from": source.from,
              "--brand-to": source.to,
              "--brand-ink": source.ink,
            } as CSSProperties}
            key={source.id}
          >
            <i>{source.mark}</i>
            <div>
              <b>{source.label}</b>
              <span>{source.note}</span>
            </div>
            <strong>{source.value}</strong>
          </article>
        )) : (
          <article className="profile-command-source-empty">
            <i>--</i>
            <div>
              <b>No source rows yet</b>
              <span>Run the local wizard and upload reviewed aggregates.</span>
            </div>
            <strong>waiting</strong>
          </article>
        )}
      </div>
    </section>
  );
}

function ProfileBadgeForgePanel({ forge }: { forge: ProfileBadgeForge }) {
  return (
    <section className="profile-badge-forge" aria-label="Profile badge forge">
      <div className="profile-badge-forge__head">
        <span>VTK://BADGE-FORGE//SHARE-PROOF//C0VIBE.APP</span>
        <b>VIBERS UNITE</b>
      </div>
      <div className="profile-badge-forge__body">
        <aside className="profile-badge-terminal" aria-label="Profile badge forge terminal">
          <div className="console-top"><span>badge@profile</span><b>SHARE</b></div>
          <pre>{forge.terminalLines.join("\n")}</pre>
          <a className="profile-badge-url" href={forge.profileUrl}>
            {forge.profileUrl}
          </a>
        </aside>
        <div className="profile-badge-cards" aria-label="Share badge cards">
          {forge.cards.map((card, index) => (
            <article
              className={`profile-badge-card profile-badge-card--${card.tone}`}
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
              <i>{card.mark}</i>
              <div>
                <span>{card.impact === "not_usage" ? "NOT USAGE" : card.impact.toUpperCase()}</span>
                <b>{card.label}</b>
              </div>
              <strong>{card.value}</strong>
              <code>{card.code}</code>
              <small>{card.note}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="profile-badge-snippets" aria-label="Copy-ready profile snippets">
        <div>
          <h2>{forge.headline}</h2>
          <p>{forge.subline}</p>
        </div>
        {forge.snippets.map((snippet, index) => (
          <article style={{ "--i": index } as CSSProperties} key={snippet.id}>
            <span>{snippet.label}</span>
            <code>{snippet.value}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileOperatorPosterPanel({ poster }: { poster: ProfileOperatorPoster }) {
  return (
    <section className="profile-operator-poster" aria-label="Profile operator poster">
      <div className="profile-operator-poster__head">
        <span>VTK://PROFILE-POSTER//PUBLIC-SIGNAL//VIBERS-UNITE</span>
        <b>{poster.callsign}</b>
      </div>
      <div className="profile-operator-poster__body">
        <aside className="profile-operator-poster__terminal" aria-label="Profile operator poster terminal">
          <div className="console-top"><span>poster@profile</span><b>C0VIBE</b></div>
          <pre>{poster.terminalLines.join("\n")}</pre>
          <div className="profile-operator-poster__share" aria-label="Profile operator poster share line">
            <span>Vibers Unite</span>
            <code>{poster.shareLine}</code>
            {poster.proofStamp.map((line) => <code key={line}>{line}</code>)}
          </div>
        </aside>
        <div className="profile-operator-poster__signal">
          <div className="profile-operator-poster__copy">
            <h2>{poster.headline}</h2>
            <p>{poster.subline}</p>
          </div>
          <pre aria-label="Deterministic public signal art">{poster.signalRows.join("\n")}</pre>
          <div className="profile-operator-poster__marquee" aria-label="Profile operator proof marquee">
            {poster.proofMarquee.map((rail, index) => (
              <article
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
                <div>
                  <i>{rail.mark}</i>
                  <span>{rail.impact === "not_usage" ? "NOT USAGE" : rail.impact.toUpperCase()}</span>
                </div>
                <div className="profile-operator-poster__reel" aria-hidden="true">
                  {rail.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${rail.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                </div>
                <b>{rail.label}</b>
                <strong>{rail.value}</strong>
                <code>{rail.terminalLine}</code>
                <small>{rail.guardrail}</small>
              </article>
            ))}
          </div>
          <div className="profile-operator-poster__panels">
            {poster.panels.map((panel, index) => (
              <article
                data-impact={panel.impact}
                style={{
                  "--i": index,
                  "--meter": `${panel.meter}%`,
                  "--brand-from": panel.from,
                  "--brand-to": panel.to,
                  "--brand-ink": panel.ink,
                } as CSSProperties}
                key={panel.id}
              >
                <i>{panel.mark}</i>
                <div>
                  <span>{panel.impact === "not_usage" ? "NOT USAGE" : panel.impact.toUpperCase()}</span>
                  <b>{panel.label}</b>
                </div>
                <strong>{panel.value}</strong>
                <small>{panel.note}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileTransmissionPanel({ deck }: { deck: ProfileTransmissionDeck }) {
  return (
    <section className="profile-transmission" aria-label="Profile usage datastream transmission">
      <div className="profile-transmission__head">
        <span>VTK://PROFILE-TRANSMISSION//SOURCE-TO-SCORE//NO-MIXED-SIGNALS</span>
        <b>DATASTREAM</b>
      </div>
      <div className="profile-transmission__body">
        <aside className="profile-transmission__terminal" aria-label="Profile transmission terminal">
          <div className="console-top"><span>stream@profile</span><b>TRACE</b></div>
          <pre>{deck.terminalLines.join("\n")}</pre>
          <div className="profile-transmission__copy">
            <h2>{deck.headline}</h2>
            <p>{deck.subline}</p>
          </div>
        </aside>
        <div className="profile-transmission__flow">
          {deck.stages.map((stage, index) => (
            <article
              className={`profile-transmission-stage profile-transmission-stage--${stage.tone}`}
              data-impact={stage.impact}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.from,
                "--brand-to": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="profile-transmission-stage__top">
                <i>{stage.mark}</i>
                <span>{stage.impact === "usage" ? "USAGE" : stage.impact === "publish" ? "PUBLISH" : "NOT USAGE"}</span>
              </div>
              <b>{stage.label}</b>
              <strong>{stage.value}</strong>
              <p>{stage.note}</p>
              <code>{stage.route}</code>
              <footer>
                <em>{stage.status}</em>
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileIntelligencePanel({ deck }: { deck: ProfileIntelligenceDeck }) {
  return (
    <section className="profile-intelligence" aria-label="Profile cost intelligence">
      <div className="profile-intelligence__head">
        <span>VTK://PROFILE-INTEL//FORECAST-RATES-LOCAL-SHADOW//ESTIMATE-ONLY</span>
        <b>COST INTEL</b>
      </div>
      <div className="profile-intelligence__body">
        <aside className="profile-intelligence__terminal" aria-label="Profile cost intelligence terminal">
          <div className="console-top"><span>intel@profile</span><b>ESTIMATE</b></div>
          <pre>{deck.terminalLines.join("\n")}</pre>
          <div className="profile-intelligence__copy">
            <h2>{deck.headline}</h2>
            <p>{deck.subline}</p>
          </div>
        </aside>
        <div className="profile-intelligence__grid">
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
              <i aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileBroadcastStripPanel({ strip }: { strip: ProfileBroadcastStrip }) {
  return (
    <section className="profile-broadcast-strip" aria-label="Public profile broadcast strip">
      <div className="profile-broadcast-strip__head">
        <span>VTK://PROFILE-BROADCAST//SHARE-RAIL//NO-MIXED-SIGNALS</span>
        <b>BROADCAST</b>
      </div>
      <div className="profile-broadcast-strip__body">
        <aside className="profile-broadcast-strip__terminal" aria-label="Profile broadcast terminal">
          <div className="console-top"><span>broadcast@profile</span><b>PUBLIC</b></div>
          <pre>{strip.terminalLines.join("\n")}</pre>
          <div className="profile-broadcast-strip__ticker" aria-label="Profile broadcast ticker">
            {strip.ticker.map((item, index) => <span style={{ "--i": index } as CSSProperties} key={item}>{item}</span>)}
          </div>
        </aside>
        <div className="profile-broadcast-strip__signal">
          <div className="profile-broadcast-strip__copy">
            <h2>{strip.headline}</h2>
            <p>{strip.subline}</p>
            <code>{strip.profileUrl}</code>
          </div>
          <pre aria-label="Deterministic profile broadcast signal">{strip.signalRows.join("\n")}</pre>
          <div className="profile-broadcast-pulse" aria-label="Profile broadcast pulse rail">
            {strip.pulses.map((pulse, index) => (
              <article
                data-impact={pulse.impact}
                style={{
                  "--i": index,
                  "--meter": `${pulse.meter}%`,
                  "--brand-from": pulse.from,
                  "--brand-to": pulse.to,
                  "--brand-ink": pulse.ink,
                } as CSSProperties}
                key={pulse.id}
              >
                <div className="profile-broadcast-pulse__screen" aria-hidden="true">
                  {pulse.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${pulse.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                  <i>{pulse.mark}</i>
                </div>
                <div className="profile-broadcast-pulse__copy">
                  <span>{pulse.railLabel}</span>
                  <b>{pulse.command}</b>
                  <strong>{pulse.value}</strong>
                  <pre>{pulse.terminalLines.join("\n")}</pre>
                  <small>{pulse.detail}</small>
                  <em aria-label={`${pulse.label} pulse meter ${pulse.meter} percent`} />
                </div>
              </article>
            ))}
          </div>
          <div className="profile-broadcast-strip__rails">
            {strip.rails.map((rail, index) => (
              <article
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
                <i>{rail.mark}</i>
                <span>{rail.impact === "not_usage" ? "NOT USAGE" : rail.impact === "local_only" ? "LOCAL ONLY" : rail.impact.toUpperCase()}</span>
                <b>{rail.label}</b>
                <strong>{rail.value}</strong>
                <code>{rail.route}</code>
                <small>{rail.note}</small>
                <em aria-label={`${rail.label} broadcast meter ${rail.meter} percent`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSignalPassportPanel({ passport }: { passport: ProfileSignalPassport }) {
  return (
    <section className="profile-signal-passport" aria-label="Public profile signal passport">
      <div className="profile-signal-passport__head">
        <span>VTK://SIGNAL-PASSPORT//PUBLIC-SHARE//NO-MIXED-SIGNALS</span>
        <b>{passport.passportId}</b>
      </div>
      <div className="profile-signal-passport__body">
        <aside className="profile-signal-passport__terminal" aria-label="Profile signal passport terminal">
          <div className="console-top"><span>passport@profile</span><b>LOCAL HASH</b></div>
          <pre>{passport.terminalLines.join("\n")}</pre>
          <div className="profile-signal-passport__hash">
            <span>Vibers Unite</span>
            <code>{passport.profileUrl}</code>
          </div>
        </aside>
        <div className="profile-signal-passport__main">
          <div className="profile-signal-passport__copy">
            <h2>{passport.headline}</h2>
            <p>{passport.subline}</p>
          </div>
          <pre aria-label="Deterministic signal passport field">{passport.signalRows.join("\n")}</pre>
          <div className="profile-signal-passport__stamps">
            {passport.stamps.map((stamp, index) => (
              <article
                data-impact={stamp.impact}
                style={{
                  "--i": index,
                  "--meter": `${stamp.meter}%`,
                  "--brand-from": stamp.from,
                  "--brand-to": stamp.to,
                  "--brand-ink": stamp.ink,
                } as CSSProperties}
                key={stamp.id}
              >
                <i>{stamp.mark}</i>
                <span>{stamp.impact === "not_usage" ? "NOT USAGE" : stamp.impact === "local_only" ? "LOCAL ONLY" : stamp.impact.toUpperCase()}</span>
                <b>{stamp.label}</b>
                <strong>{stamp.value}</strong>
                <code>{stamp.route}</code>
                <small>{stamp.note}</small>
                <em aria-label={`${stamp.label} passport meter ${stamp.meter} percent`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let p;
  try {
    p = await getProfile(handle);
  } catch {
    p = null; // unknown handle or DB unavailable → 404
  }
  if (!p) notFound();

  const tier = (p.latest?.tier ?? "self_reported") as Tier;
  const syncedAt = p.latest ? new Date(p.latest.created_at).toLocaleDateString() : "not synced yet";
  const topProvider = p.providers.slice().sort((a, b) => b.usd - a.usd)[0];
  const providerLabel = topProvider ? providerBrand(topProvider.provider).mark : "--";
  const trustCount = p.trustSignals.length;
  const proofSpine = buildProfileProofSpine(p);
  const blackBoxReplay = buildProfileBlackBoxReplay(p);
  const life = buildProfileLifeDashboard(p);
  const constellation = buildProfileSignalConstellation(p);
  const usageHeatgrid = buildUsageHeatgrid(p);
  const vibeScore = buildVibeScoreReceipt(p);
  const pocketCard = buildProfilePocketCard(p, vibeScore);
  const heroBridge = buildProfileHeroBridge(p, vibeScore);
  const vibeReactor = buildVibeScoreReactor(p, vibeScore);
  const datastreamReceipt = buildProfileDatastreamReceipt(p, vibeScore);
  const transmission = buildProfileTransmissionDeck(p);
  const intelligence = buildProfileIntelligenceDeck(p);
  const commandCenter = buildProfileCommandCenter(p);
  const badgeForge = buildProfileBadgeForge(p);
  const operatorPoster = buildProfileOperatorPoster(p);
  const broadcastStrip = buildProfileBroadcastStrip(p);
  const signalPassport = buildProfileSignalPassport(p);
  const profileUrl = `https://c0vibe.app/u/${p.handle}`;
  const heroTransmissionRails = [
    {
      id: "score",
      impact: "SCORE",
      label: "Score seal",
      value: `${vibeScore.score}/100`,
      command: "score://usage-datastream",
      note: "Derived from accepted usage factors.",
      guardrail: "Trust context cannot inflate the score.",
      mark: "VS",
      meter: vibeScore.score,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      cells: [54, 62, 71, 84, 91],
    },
    {
      id: "usage",
      impact: "USAGE",
      label: "Usage proof",
      value: `${formatInt(datastreamReceipt.totals.records)} rows`,
      command: "usage://accepted-aggregates",
      note: `${formatInt(datastreamReceipt.totals.providers)} provider sources feed the public profile.`,
      guardrail: "No raw prompts, outputs, secrets, or local files.",
      mark: providerLabel,
      meter: heroBridge.stages.find((stage) => stage.id === "usage")?.meter ?? 90,
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      cells: [32, 48, 66, 82, 96],
    },
    {
      id: "trust",
      impact: "NOT USAGE",
      label: "Trust side rail",
      value: `${trustCount} signals`,
      command: "trust://context-only",
      note: "GitHub and Higgsfield MCP evidence explains credibility.",
      guardrail: "Never changes spend, credits, operations, or rank.",
      mark: "NO",
      meter: trustCount ? 100 : 0,
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
      cells: [28, 42, 58, 74, 52],
    },
    {
      id: "privacy",
      impact: "PRIVACY",
      label: "Privacy seal",
      value: "0 raw reads",
      command: "privacy://aggregate-only",
      note: "The public card repeats the aggregate-only boundary.",
      guardrail: "hidden uploads 0; prompt reads 0; output reads 0.",
      mark: "PR",
      meter: 100,
      from: "#9f7cff",
      to: "#ff7768",
      ink: "#ffffff",
      cells: [45, 34, 69, 57, 88],
    },
    {
      id: "relay",
      impact: "PUBLISH",
      label: "C0VIBE relay",
      value: "public",
      command: profileUrl,
      note: "Vibers Unite points people to the reviewed public profile.",
      guardrail: "C0vibe.app is explicit publish, not hidden sync.",
      mark: "C0",
      meter: 96,
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      cells: [56, 68, 78, 92, 100],
    },
  ];
  return (
    <>
      <section className="profile-hero">
        <div className="profile-copy">
          <p className="eyebrow">Viber operator profile</p>
          <h1>@{p.handle}</h1>
          <p>{p.latest ? <>Last synced {syncedAt} · </> : null}<TrustBadge tier={tier} /></p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="profile-terminal" aria-label="Public usage profile terminal card">
          <div className="console-top"><span>profile@vibetracker</span><b>{tier}</b></div>
          <pre>{[
            "+------------------------------------+",
            "| C0VIBE PROFILE SIGNAL              |",
            "|------------------------------------|",
            `| handle     @${p.handle.padEnd(23).slice(0, 23)} |`,
            `| synced     ${syncedAt.padEnd(24).slice(0, 24)} |`,
            `| top mark   ${providerLabel.padEnd(24).slice(0, 24)} |`,
            `| trust sig  ${String(trustCount).padEnd(24).slice(0, 24)} |`,
            "| motto      VIBERS UNITE            |",
            "+------------------------------------+",
          ].join("\n")}</pre>
          <div className="profile-hero-scope" aria-label="Profile first-screen signal scope">
            {commandCenter.heroScope.map((tick, index) => (
              <article
                data-impact={tick.impact}
                style={{
                  "--i": index,
                  "--meter": `${tick.meter}%`,
                  "--brand-from": tick.from,
                  "--brand-to": tick.to,
                  "--brand-ink": tick.ink,
                } as CSSProperties}
                key={tick.id}
              >
                <i>{tick.mark}</i>
                <span>{tick.impact === "not_usage" ? "NOT USAGE" : tick.label}</span>
                <b>{tick.status}</b>
                <em aria-label={`${tick.label} profile scope meter ${tick.meter} percent`} />
                <small>{tick.note}</small>
              </article>
            ))}
          </div>
          <div className="profile-hero-transmission" aria-label="Public profile first-screen transmission rails">
            {heroTransmissionRails.map((rail, index) => (
              <article
                className={`profile-hero-transmission-rail profile-hero-transmission-rail--${rail.id}`}
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
                <div className="profile-hero-transmission-rail__top">
                  <i>{rail.mark}</i>
                  <span>{rail.impact}</span>
                </div>
                <div className="profile-hero-transmission-rail__cells" aria-hidden="true">
                  {rail.cells.map((cell, cellIndex) => (
                    <span
                      style={{
                        "--c": cellIndex,
                        "--cell-scale": (0.32 + cell / 100).toFixed(2),
                        opacity: 0.3 + cell / 140,
                      } as CSSProperties}
                      key={`${rail.id}-${cellIndex}`}
                    />
                  ))}
                </div>
                <b>{rail.label}</b>
                <strong>{rail.value}</strong>
                <code>{rail.command}</code>
                <p>{rail.note}</p>
                <small>{rail.guardrail}</small>
                <footer aria-label={`${rail.label} profile transmission meter ${rail.meter} percent`}>
                  <em />
                  <small>{rail.meter}%</small>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProfilePublicRelayCockpitPanel
        handle={p.handle}
        tier={tier}
        syncedAt={syncedAt}
        topProviderMark={providerLabel}
        trustCount={trustCount}
        bridge={heroBridge}
        receipt={datastreamReceipt}
        heatgrid={usageHeatgrid}
        score={vibeScore}
        passport={signalPassport}
      />

      <ProfileViberCardPanel
        handle={p.handle}
        tier={tier}
        syncedAt={syncedAt}
        topProviderMark={providerLabel}
        trustCount={trustCount}
        receipt={datastreamReceipt}
        heatgrid={usageHeatgrid}
        score={vibeScore}
        passport={signalPassport}
      />

      <ProfileHeroBridgePanel bridge={heroBridge} />

      <ProfilePocketCardPanel card={pocketCard} />

      <ProfileWalletPassPanel card={pocketCard} />

      <ProfileSignalTowerPanel bridge={heroBridge} receipt={datastreamReceipt} />

      <ProfileOperatorPosterPanel poster={operatorPoster} />

      <ProfileBroadcastStripPanel strip={broadcastStrip} />

      <ProfileSignalPassportPanel passport={signalPassport} />

      <section className="profile-proof-spine" aria-label="Public profile proof spine">
        <div className="profile-proof-spine__head">
          <span>VTK://PUBLIC-PROFILE//PROOF-SPINE//C0VIBE.APP</span>
          <b>VIBERS UNITE</b>
        </div>
        <div className="profile-proof-spine__grid">
          {proofSpine.map((cell, index) => (
            <article className={`profile-proof-cell profile-proof-cell--${cell.tone}`} style={{ "--i": index } as CSSProperties} key={cell.id}>
              <span>{cell.label}</span>
              <b>{cell.value}</b>
              <small>{cell.note}</small>
            </article>
          ))}
        </div>
      </section>

      <ProfileBlackBoxReplayPanel replay={blackBoxReplay} />

      <ProfileCommandCenterPanel center={commandCenter} />

      <VibeScoreReactorPanel reactor={vibeReactor} />

      <ProfileDatastreamPanel receipt={datastreamReceipt} />

      <VibeScorePanel receipt={vibeScore} />

      <ProfileBadgeForgePanel forge={badgeForge} />

      <ProfileTransmissionPanel deck={transmission} />

      <UsageHeatgridPanel grid={usageHeatgrid} />

      <ProfileIntelligencePanel deck={intelligence} />

      <section className="profile-constellation" aria-label="Public profile signal constellation">
        <div className="profile-constellation__head">
          <span>VTK://PROFILE-CONSTELLATION//USAGE-VS-TRUST//NOT-USAGE</span>
          <h2>{constellation.headline}</h2>
          <p>{constellation.subline}</p>
        </div>
        <div className="profile-constellation__shell">
          <aside className="profile-constellation__terminal" aria-label="Profile constellation terminal">
            <div className="console-top"><span>constellation@profile</span><b>PUBLIC</b></div>
            <pre>{constellation.terminalLines.join("\n")}</pre>
            <div className="profile-constellation__legend">
              {constellation.legend.map((item) => (
                <div data-impact={item.impact} key={item.label}>
                  <b>{item.label}</b>
                  <span>{item.note}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="profile-constellation__map" aria-label="Usage and trust signal map">
            {constellation.nodes.map((node, index) => (
              <article
                className={`profile-signal-node profile-signal-node--${node.tone}`}
                data-impact={node.impact}
                style={{
                  "--brand-from": node.brandFrom,
                  "--brand-to": node.brandTo,
                  "--brand-ink": node.brandInk,
                  "--x": node.x,
                  "--y": node.y,
                  "--meter": `${node.meter}%`,
                  "--i": index,
                } as CSSProperties}
                key={node.id}
              >
                <span>{node.mark}</span>
                <b>{node.label}</b>
                <strong>{node.value}</strong>
                <small>{node.note}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-life-dashboard" aria-label="Public AI life dashboard">
        <div className="profile-life-head">
          <span>VTK://AI-LIFE-DASHBOARD//C0VIBE-DATASTREAM//PUBLIC</span>
          <h2>AI life dashboard</h2>
          <p>{life.headline}. {life.subline}</p>
        </div>
        <div className="profile-life-shell">
          <div className="profile-life-terminal" aria-label="AI life public terminal">
            <div className="console-top"><span>life@vibetracker</span><b>PUBLIC</b></div>
            <pre>{life.terminalLines.join("\n")}</pre>
          </div>
          <div className="profile-life-tiles">
            {life.tiles.map((tile, index) => (
              <article className={`profile-life-tile profile-life-tile--${tile.tone}`} data-impact={tile.usageImpact} style={{ "--i": index } as CSSProperties} key={tile.id}>
                <span>{tile.label}</span>
                <b>{tile.value}</b>
                <small>{tile.note}</small>
              </article>
            ))}
          </div>
        </div>
        <div className="profile-life-rails" aria-label="Profile source lanes">
          {life.lanes.map((lane, index) => {
            const brandId = lane.providerIds[0] ?? lane.id;
            const brand = lane.providerIds[0] ? providerBrand(lane.providerIds[0]) : null;
            return (
              <article className={`profile-life-lane profile-life-lane--${lane.tone}`} data-impact={lane.usageImpact} style={{ ...(providerVars(brandId) as CSSProperties), "--i": index, "--meter": lane.meter } as CSSProperties} key={lane.id}>
                <div>
                  <span>{brand ? brand.mark : lane.usageImpact === "not_usage" ? "NO" : "AI"}</span>
                  <b>{lane.label}</b>
                  <small>{lane.note}</small>
                </div>
                <strong>{lane.value}</strong>
                <i>{lane.usageImpact === "not_usage" ? "NOT USAGE" : "USAGE"}</i>
              </article>
            );
          })}
        </div>
      </section>

      {p.latest ? (
        <>
          <section className="profile-metrics" aria-label="Profile usage totals">
            <div>
              <span>Estimated spend</span>
              <b>{formatUsd(p.latest.total_usd)}</b>
              <small>list-price estimate</small>
            </div>
            <div>
              <span>Operations</span>
              <b>{formatInt(p.latest.record_count)}</b>
              <small>messages, generations, jobs</small>
            </div>
            <div>
              <span>Credits</span>
              <b>{formatInt(p.latest.total_credits)}</b>
              <small>provider-native units</small>
            </div>
            <div>
              <span>Providers</span>
              <b>{formatInt(p.providers.length)}</b>
              <small>{topProvider ? `top: ${topProvider.provider}` : "no breakdown"}</small>
            </div>
          </section>
          <h2>By provider</h2>
          <div className="provider-cloud">
            {p.providers.length
              ? p.providers.map((pr) => {
                  const brand = providerBrand(pr.provider);
                  return (
                    <span className="pill provider-pill" style={providerVars(pr.provider) as CSSProperties} key={pr.provider}>
                      <b>{brand.mark}</b>{pr.provider} · {formatUsd(pr.usd)}{pr.credits ? ` · ${formatInt(pr.credits)} cr` : ""}
                    </span>
                  );
                })
              : <p className="muted">No provider breakdown.</p>}
          </div>
          <section className="profile-trust-deck" aria-label="Profile trust signals">
            <div className="profile-trust-head">
              <span>VTK://TRUST-SIGNALS//PUBLIC-PROOF//NOT-USAGE</span>
              <h2>Proof side rail</h2>
              <p>GitHub and creator cadence can explain the person behind the usage. They are shown separately and never alter spend, credits, operations, rank, or verified status.</p>
              <div className="motto-rail" aria-label="C0VIBE motto">
                <span>Vibers Unite</span>
                <a href="https://c0vibe.app">c0vibe.app</a>
              </div>
            </div>
            <div className="profile-trust-grid">
              {p.trustSignals.length
                ? p.trustSignals.map((signal, index) => <TrustSignalCard signal={signal} key={`${signal.kind}-${index}`} />)
                : (
                  <article className="profile-trust-empty">
                    <b>No public trust signals attached</b>
                    <p>Run <code>vibetracker trust add github --handle &lt;you&gt;</code> or attach creator cadence before the next upload.</p>
                  </article>
                )}
            </div>
          </section>
        </>
      ) : (
        <section className="profile-empty">
          <b>No submissions yet</b>
          <p className="muted">Run <code>npx vibetrack init --gui</code>, sync locally, then upload when you want this profile to show real usage.</p>
        </section>
      )}
    </>
  );
}
