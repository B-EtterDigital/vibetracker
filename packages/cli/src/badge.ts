import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { computeStats } from "../../core/src/stats.ts";
import { computeIntegrity } from "./audit.ts";
import { providerBrand } from "./provider-brand.ts";

export interface ShareBadgeOptions {
  handle?: string;
  profileUrl?: string;
}

const githubLevels = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

function escXml(value: string | number): string {
  return String(value).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[char] ?? char));
}

function metric(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toLocaleString("en-US");
}

function money(value: number): string {
  if (value >= 1000) return `$${Math.round(value).toLocaleString("en-US")}`;
  return `$${value.toFixed(value >= 10 ? 0 : 2)}`;
}

function heatCells(records: NormalizedRecord[], signals: TrustSignal[]): string {
  const github = signals.find((signal) => signal.kind === "github_activity" && signal.days?.length);
  const cells = github?.kind === "github_activity"
    ? github.days.slice(-42).map((day) => ({
      label: `${day.date}: ${day.count} GitHub contribution${day.count === 1 ? "" : "s"} (not usage)`,
      color: githubLevels[Math.max(0, Math.min(4, day.level))],
    }))
    : computeStats(records).byDay.slice(-42).map((day) => {
      const level = day.count <= 0 ? 0 : day.count < 3 ? 1 : day.count < 8 ? 2 : day.count < 18 ? 3 : 4;
      return {
        label: `${day.key}: ${day.count} local usage operation${day.count === 1 ? "" : "s"}`,
        color: githubLevels[level],
      };
    });
  const padded = cells.length ? cells : Array.from({ length: 14 }, (_, index) => ({
    label: `empty cell ${index + 1}: no local usage yet`,
    color: githubLevels[0],
  }));
  return padded.map((cell, index) => {
    const col = Math.floor(index / 7);
    const row = index % 7;
    return `<rect x="${548 + col * 12}" y="${66 + row * 12}" width="9" height="9" rx="2" fill="${cell.color}"><title>${escXml(cell.label)}</title></rect>`;
  }).join("");
}

function sourceMixLabel(records: NormalizedRecord[]): string {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.source, (counts.get(record.source) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([source, count]) => `${source} ${count}`)
    .join(" + ") || "waiting";
}

function providerChips(stats: ReturnType<typeof computeStats>): string {
  const providers = stats.byProvider.length ? stats.byProvider.slice(0, 4) : [{ key: "c0vibe", count: 0 }];
  return providers.map((provider, index) => {
    const brand = providerBrand(provider.key);
    return `<g transform="translate(${30 + index * 118} 119)" aria-label="${escXml(brand.label)} provider brand chip">
      <rect width="108" height="18" rx="5" fill="#0d1419" stroke="${escXml(brand.from)}" stroke-opacity=".42"/>
      <rect width="25" height="18" rx="5" fill="${escXml(brand.from)}"/>
      <text x="12.5" y="13" text-anchor="middle" font-size="10" font-weight="900" fill="${escXml(brand.ink)}">${escXml(brand.mark)}</text>
      <text x="33" y="12.5" class="tiny ink">${escXml(brand.label.slice(0, 12))}</text>
    </g>`;
  }).join("");
}

function heatLegend(): string {
  return githubLevels.map((color, index) =>
    `<rect x="${548 + index * 30}" y="55" width="22" height="7" rx="2" fill="${color}"><title>GitHub official contribution color level ${index}</title></rect>`
  ).join("");
}

export function renderShareBadgeSvg(records: NormalizedRecord[], signals: TrustSignal[] = [], opts: ShareBadgeOptions = {}): string {
  const stats = computeStats(records);
  const integrity = computeIntegrity(records, signals);
  const top = stats.byProvider[0];
  const topBrand = top ? providerBrand(top.key) : providerBrand("c0vibe", "C0VIBE");
  const usd = stats.totals.usd ?? 0;
  const credits = records.reduce((sum, record) => sum + (record.rawUnit === "credits" ? record.rawAmount : 0), 0);
  const high = records.filter((record) => record.confidence === "high").length;
  const verified = records.filter((record) => record.verified).length;
  const activeDays = stats.byDay.length;
  const bundle = `${integrity.bundleFingerprint.slice(0, 8)}...${integrity.bundleFingerprint.slice(-6)}`;
  const handle = opts.handle?.replace(/^@/, "") || "local";
  const tier = verified ? `${verified} verified rows` : high ? `${high} high-confidence rows` : "self-reported local ledger";
  const profileUrl = opts.profileUrl || `c0vibe.app/u/${handle}`;
  const trustLabel = signals.length ? `${signals.length} trust signal${signals.length === 1 ? "" : "s"}` : "trust rail ready";
  const heatLabel = signals.some((signal) => signal.kind === "github_activity" && signal.days?.length)
    ? "GitHub trust heatgrid - NOT USAGE"
    : "local usage rhythm";
  const chips = providerChips(stats);
  const passportNodes = [
    ["UP", "aggregate", `${records.length} rows`],
    ["MX", "source mix", sourceMixLabel(records)],
    ["HG", "heatgrid", `${activeDays} days`],
    ["SC", "score input", `${stats.totals.count} ops`],
    ["NO", "trust rail", "NOT USAGE"],
    ["C0", "relay", "c0vibe.app"],
  ];
  const passport = passportNodes.map(([mark, label, value], index) => `<g transform="translate(${42 + index * 128} 231)">
    <rect width="106" height="38" rx="9" fill="#0d1419" stroke="${mark === "NO" ? "#ffc64d" : "#2ee8d6"}" stroke-opacity="${mark === "NO" ? ".42" : ".24"}"/>
    <text x="9" y="17" class="${mark === "NO" ? "gold" : "cyan"}" font-size="11" font-weight="900">${escXml(mark)}</text>
    <text x="32" y="15" class="tiny label">${escXml(label)}</text>
    <text x="9" y="30" class="ink" font-size="10" font-weight="800">${escXml(value)}</text>
  </g>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="320" viewBox="0 0 860 320" role="img" aria-labelledby="title desc">
  <title id="title">VibeTRACKER local usage badge for ${escXml(handle)}</title>
  <desc id="desc">Local-first AI usage badge with spend, operations, credits, source-to-score passport, trust labels, and C0VIBE relay.</desc>
  <defs>
    <linearGradient id="badgeGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${escXml(topBrand.from)}"/>
      <stop offset=".55" stop-color="#2ee8d6"/>
      <stop offset="1" stop-color="#ffc64d"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .tiny{font-size:11px;letter-spacing:.08em;text-transform:uppercase}.label{fill:#90a09b}.ink{fill:#f4fff8}.muted{fill:#9aa8a3}.gold{fill:#ffc64d}.cyan{fill:#2ee8d6}
      .meter{transform-origin:left center;animation:fill .9s cubic-bezier(.22,.68,.12,1) forwards}.sweep{animation:sweep 5.4s cubic-bezier(.22,.68,.12,1) infinite}.turn{animation:turn 5.8s cubic-bezier(.22,.68,.12,1) infinite}
      @keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes sweep{0%,35%{transform:translateX(-680px)}70%,100%{transform:translateX(680px)}}@keyframes turn{50%{transform:perspective(280px) rotateY(16deg)}}
      @media (prefers-reduced-motion: reduce){.meter,.sweep,.turn{animation:none}}
    </style>
  </defs>
  <rect width="860" height="320" rx="18" fill="#040607"/>
  <rect x="1" y="1" width="858" height="318" rx="18" fill="#071014" stroke="rgba(46,232,214,.24)"/>
  <rect class="sweep" x="0" y="0" width="180" height="320" fill="url(#badgeGlow)" opacity=".12"/>
  <path d="M22 28h816M22 292h816" stroke="rgba(255,255,255,.08)"/>
  <text x="30" y="50" class="tiny cyan">VTK://SHARE-BADGE//LOCAL-FIRST//VIBERS-UNITE</text>
  <text x="30" y="88" font-size="34" font-weight="900" fill="#f4fff8">VibeTRACKER</text>
  <text x="31" y="112" font-size="13" class="muted">@${escXml(handle)} · ${escXml(tier)} · ${escXml(profileUrl)}</text>
  <g aria-label="Provider brand rail">${chips}</g>
  <g transform="translate(382 36)" class="turn" filter="url(#softGlow)">
    <rect width="82" height="66" rx="12" fill="url(#badgeGlow)"/>
    <text x="41" y="42" text-anchor="middle" font-size="24" font-weight="900" fill="${escXml(topBrand.ink)}">${escXml(topBrand.mark)}</text>
  </g>
  <g transform="translate(30 136)">
    <rect width="132" height="72" rx="12" fill="#0d1419" stroke="rgba(255,255,255,.08)"/>
    <text x="14" y="23" class="tiny label">Est spend</text>
    <text x="14" y="54" font-size="24" font-weight="900" class="gold">${escXml(money(usd))}</text>
  </g>
  <g transform="translate(176 136)">
    <rect width="132" height="72" rx="12" fill="#0d1419" stroke="rgba(255,255,255,.08)"/>
    <text x="14" y="23" class="tiny label">Operations</text>
    <text x="14" y="54" font-size="24" font-weight="900" class="ink">${escXml(metric(stats.totals.count))}</text>
  </g>
  <g transform="translate(322 136)">
    <rect width="132" height="72" rx="12" fill="#0d1419" stroke="rgba(255,255,255,.08)"/>
    <text x="14" y="23" class="tiny label">Credits</text>
    <text x="14" y="54" font-size="24" font-weight="900" class="ink">${escXml(metric(credits))}</text>
  </g>
  <g transform="translate(468 136)">
    <rect width="132" height="72" rx="12" fill="#0d1419" stroke="rgba(255,255,255,.08)"/>
    <text x="14" y="23" class="tiny label">Providers</text>
    <text x="14" y="54" font-size="24" font-weight="900" class="ink">${escXml(stats.byProvider.length)}</text>
  </g>
  <g transform="translate(614 136)">
    <rect width="216" height="72" rx="12" fill="#0d1419" stroke="rgba(255,198,77,.2)"/>
    <text x="14" y="23" class="tiny gold">Trust rail · NOT USAGE</text>
    <text x="14" y="53" font-size="18" font-weight="900" class="ink">${escXml(trustLabel)}</text>
  </g>
  <g aria-label="${escXml(heatLabel)}">
    <text x="548" y="50" class="tiny label">${escXml(heatLabel)}</text>
    <g aria-label="Official GitHub contribution color legend">${heatLegend()}</g>
    ${heatCells(records, signals)}
  </g>
  <g aria-label="Source-to-score passport">
    <text x="30" y="230" class="tiny cyan">source-to-score passport · profile, heatgrid, score, badges share reviewed aggregates</text>
    <text x="684" y="230" class="tiny gold">bundle ${escXml(bundle)}</text>
    ${passport}
    <rect x="30" y="274" width="800" height="20" rx="6" fill="#030708" stroke="rgba(255,198,77,.2)"/>
    <text x="42" y="288" class="tiny gold">VTK://BADGE-RECEIPT//NO-PROMPTS//NO-OUTPUTS//TRUST-NOT-USAGE//VIBERS-UNITE</text>
  </g>
  <rect x="30" y="300" width="650" height="8" rx="4" fill="#0d1419" stroke="rgba(255,255,255,.07)"/>
  <rect class="meter" x="30" y="300" width="${Math.max(32, Math.min(650, stats.totals.count * 12))}" height="8" rx="4" fill="url(#badgeGlow)"/>
  <text x="700" y="308" class="tiny gold">c0vibe.app</text>
</svg>`;
}

export function renderShareBadgeMarkdown(svgPath: string, opts: ShareBadgeOptions = {}): string {
  const handle = opts.handle?.replace(/^@/, "") || "local";
  const profileUrl = opts.profileUrl || `https://c0vibe.app/u/${encodeURIComponent(handle)}`;
  return `[![VibeTRACKER local AI usage badge](${svgPath})](${profileUrl})`;
}

function posterHeatCells(signals: TrustSignal[]): string {
  const github = signals.find((signal) => signal.kind === "github_activity" && signal.days?.length);
  const days = github?.kind === "github_activity" ? github.days.slice(-56) : [];
  const cells = days.length ? days : Array.from({ length: 56 }, (_, index) => ({
    date: `empty-${index + 1}`,
    count: 0,
    level: 0 as const,
  }));
  return cells.map((day, index) => {
    const col = index % 14;
    const row = Math.floor(index / 14);
    const level = Math.max(0, Math.min(4, day.level));
    return `<rect x="${778 + col * 20}" y="${160 + row * 20}" width="14" height="14" rx="3" fill="${githubLevels[level]}"><title>${escXml(day.date)}: ${day.count} GitHub contribution${day.count === 1 ? "" : "s"} - NOT USAGE</title></rect>`;
  }).join("");
}

function posterProviderTiles(stats: ReturnType<typeof computeStats>): string {
  const providers = stats.byProvider.length ? stats.byProvider.slice(0, 5) : [{ key: "c0vibe", count: 0 }];
  return providers.map((provider, index) => {
    const brand = providerBrand(provider.key);
    return `<g transform="translate(${64 + index * 132} 386)">
      <rect width="118" height="94" rx="14" fill="#0b1418" stroke="${escXml(brand.from)}" stroke-opacity=".38"/>
      <rect x="14" y="14" width="44" height="34" rx="9" fill="${escXml(brand.from)}"/>
      <text x="36" y="37" text-anchor="middle" font-size="15" font-weight="950" fill="${escXml(brand.ink)}">${escXml(brand.mark)}</text>
      <text x="14" y="66" class="tiny ink">${escXml(brand.label.slice(0, 12))}</text>
      <text x="14" y="82" class="micro muted">${escXml(metric(provider.count))} ops</text>
    </g>`;
  }).join("");
}

export function renderSharePosterSvg(records: NormalizedRecord[], signals: TrustSignal[] = [], opts: ShareBadgeOptions = {}): string {
  const stats = computeStats(records);
  const integrity = computeIntegrity(records, signals);
  const top = stats.byProvider[0];
  const topBrand = top ? providerBrand(top.key) : providerBrand("c0vibe", "C0VIBE");
  const usd = stats.totals.usd ?? 0;
  const credits = records.reduce((sum, record) => sum + (record.rawUnit === "credits" ? record.rawAmount : 0), 0);
  const handle = opts.handle?.replace(/^@/, "") || "local";
  const profileUrl = opts.profileUrl || `c0vibe.app/u/${handle}`;
  const fingerprint = `${integrity.bundleFingerprint.slice(0, 10)}...${integrity.bundleFingerprint.slice(-8)}`;
  const providerTiles = posterProviderTiles(stats);
  const heat = posterHeatCells(signals);
  const legend = githubLevels.map((color, index) => `<rect x="${778 + index * 34}" y="112" width="26" height="10" rx="3" fill="${color}"><title>GitHub official contribution color level ${index}</title></rect>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">VibeTRACKER Vibers Unite poster for ${escXml(handle)}</title>
  <desc id="desc">A local-first AI usage poster with reviewed usage aggregates, provider brands, official GitHub trust colors, and C0VIBE relay labels.</desc>
  <defs>
    <linearGradient id="posterGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${escXml(topBrand.from)}"/>
      <stop offset=".52" stop-color="#2ee8d6"/>
      <stop offset="1" stop-color="#ffc64d"/>
    </linearGradient>
    <filter id="posterSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.micro{font-size:12px;letter-spacing:.08em;text-transform:uppercase}.tiny{font-size:14px;letter-spacing:.08em;text-transform:uppercase}.label{fill:#90a09b}.ink{fill:#f4fff8}.muted{fill:#9aa8a3}.gold{fill:#ffc64d}.cyan{fill:#2ee8d6}.sweep{animation:sweep 6.2s cubic-bezier(.22,.68,.12,1) infinite}.meter{transform-origin:left center;animation:fill .9s cubic-bezier(.22,.68,.12,1) forwards}@keyframes fill{from{transform:scaleX(.2)}to{transform:scaleX(1)}}@keyframes sweep{0%,35%{transform:translateX(-920px)}75%,100%{transform:translateX(920px)}}@media (prefers-reduced-motion: reduce){.sweep,.meter{animation:none}}
    </style>
  </defs>
  <rect width="1200" height="630" rx="34" fill="#040607"/>
  <rect x="2" y="2" width="1196" height="626" rx="34" fill="#071014" stroke="rgba(46,232,214,.28)"/>
  <rect class="sweep" x="0" y="0" width="260" height="630" fill="url(#posterGlow)" opacity=".12"/>
  <path d="M48 52h1104M48 570h1104" stroke="rgba(255,255,255,.08)"/>
  <text x="64" y="86" class="tiny cyan">VTK://SHARE-POSTER//VIBERS-UNITE//C0VIBE.APP//LOCAL-FIRST</text>
  <text x="64" y="160" font-size="74" font-weight="950" fill="#f4fff8">VibeTRACKER</text>
  <text x="68" y="198" font-size="22" class="muted">@${escXml(handle)} · ${escXml(profileUrl)} · reviewed aggregate demo</text>
  <g transform="translate(590 74)" filter="url(#posterSoftGlow)">
    <rect width="112" height="96" rx="18" fill="url(#posterGlow)"/>
    <text x="56" y="61" text-anchor="middle" font-size="34" font-weight="950" fill="${escXml(topBrand.ink)}">${escXml(topBrand.mark)}</text>
  </g>
  <g transform="translate(64 236)">
    <rect width="150" height="100" rx="16" fill="#0b1418" stroke="rgba(255,198,77,.2)"/>
    <text x="18" y="30" class="tiny label">Spend</text>
    <text x="18" y="72" font-size="36" font-weight="950" class="gold">${escXml(money(usd))}</text>
  </g>
  <g transform="translate(232 236)">
    <rect width="150" height="100" rx="16" fill="#0b1418" stroke="rgba(255,255,255,.08)"/>
    <text x="18" y="30" class="tiny label">Ops</text>
    <text x="18" y="72" font-size="36" font-weight="950" class="ink">${escXml(metric(stats.totals.count))}</text>
  </g>
  <g transform="translate(400 236)">
    <rect width="150" height="100" rx="16" fill="#0b1418" stroke="rgba(255,255,255,.08)"/>
    <text x="18" y="30" class="tiny label">Credits</text>
    <text x="18" y="72" font-size="36" font-weight="950" class="ink">${escXml(metric(credits))}</text>
  </g>
  <g transform="translate(568 236)">
    <rect width="150" height="100" rx="16" fill="#0b1418" stroke="rgba(46,232,214,.18)"/>
    <text x="18" y="30" class="tiny label">Providers</text>
    <text x="18" y="72" font-size="36" font-weight="950" class="ink">${escXml(stats.byProvider.length)}</text>
  </g>
  <g aria-label="Official GitHub contribution color legend">
    <text x="778" y="88" class="tiny cyan">GitHub trust heatgrid · NOT USAGE</text>
    ${legend}
    ${heat}
  </g>
  <g aria-label="Provider brand rail">${providerTiles}</g>
  <g transform="translate(778 276)">
    <rect width="320" height="154" rx="18" fill="#0b1418" stroke="rgba(255,198,77,.22)"/>
    <text x="22" y="34" class="tiny gold">Trust is quarantined</text>
    <text x="22" y="70" font-size="22" font-weight="900" class="ink">${signals.length || 0} trust signal${signals.length === 1 ? "" : "s"}</text>
    <text x="22" y="104" class="tiny muted">score delta +0 · spend delta 0</text>
    <text x="22" y="130" class="tiny muted">rank delta 0 · usage heatgrid delta 0</text>
  </g>
  <g transform="translate(64 514)" aria-label="Poster receipt">
    <rect width="1048" height="36" rx="12" fill="#030708" stroke="rgba(255,198,77,.22)"/>
    <text x="18" y="24" class="tiny gold">VTK://POSTER-RECEIPT//NO-PROMPTS//NO-OUTPUTS//NO-SECRETS//TRUST-NOT-USAGE//FINGERPRINT ${escXml(fingerprint)}</text>
  </g>
  <rect x="64" y="584" width="860" height="12" rx="6" fill="#0d1419" stroke="rgba(255,255,255,.07)"/>
  <rect class="meter" x="64" y="584" width="${Math.max(80, Math.min(860, stats.totals.count * 18))}" height="12" rx="6" fill="url(#posterGlow)"/>
  <text x="960" y="596" class="tiny gold">Vibers Unite</text>
</svg>`;
}

export function renderSharePosterMarkdown(svgPath: string, opts: ShareBadgeOptions = {}): string {
  const handle = opts.handle?.replace(/^@/, "") || "local";
  const profileUrl = opts.profileUrl || `https://c0vibe.app/u/${encodeURIComponent(handle)}`;
  return `[![VibeTRACKER Vibers Unite poster](${svgPath})](${profileUrl})`;
}
