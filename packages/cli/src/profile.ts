// `vibetracker profile` — live HTML dashboard rendered from the CURRENT local store on
// every run (never hardcoded). Self-contained: inline CSS/JS, canvas charts, no CDNs.
// Layout: hero totals → CODE AI section → CREATIVE AI section → local leaderboard.

import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { computeStats, type Stats } from "../../core/src/stats.ts";
import { computeIntegrity } from "./audit.ts";
import { providerBrand, providerStyle } from "./provider-brand.ts";
import type { RoiNote } from "./roi-notes.ts";

const CODE_CATS = new Set(["coding", "llm"]);
const CREATIVE_CATS = new Set(["image", "video", "music", "audio", "3d"]);

function humanModel(m: string): string {
  let s = m.replace(/^claude-/, "").replace(/-\d{8}$/, "");
  s = s.replace(/^(opus|sonnet|haiku|fable)-(\d+)(?:-(\d+))?/i,
    (_, fam, a, b) => `${fam[0].toUpperCase()}${fam.slice(1)} ${a}${b ? "." + b : ""}`);
  s = s.replace(/^gpt-?/i, "GPT-");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const esc = (s: string): string => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const usd0 = (n: number): string => Math.round(n).toLocaleString("en-US");
const tok = (n: number): string => n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);
const fit = (value: string | number, width: number): string => String(value).padEnd(width).slice(0, width);

interface DayPoint { date: string; tokens: number; usd: number; ops: number }

function dayPoints(s: Stats): DayPoint[] {
  return s.byDay.map((d) => ({ date: d.key, tokens: d.raw || 0, usd: d.usd || 0, ops: d.count }));
}

function chips(s: Stats, all: DayPoint[]): string {
  const days = Math.max(1, s.byDay.length);
  const usd = s.totals.usd ?? 0;
  const tokens = s.byProvider.reduce((a, p) => a + (p.raw || 0), 0);
  const peak = [...s.byDay].sort((a, b) => (b.raw || 0) - (a.raw || 0))[0];
  const last7 = all.slice(-7).reduce((a, d) => a + d.usd, 0);
  const prev7 = all.slice(-14, -7).reduce((a, d) => a + d.usd, 0);
  const delta = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
  const topModel = s.topModels[0];
  const perM = tokens > 0 ? (usd / (tokens / 1e6)) : 0;
  // longest daily streak
  let streak = 0, best = 0, prev = "";
  for (const d of s.byDay) {
    const t = new Date(d.key + "T00:00:00Z").getTime();
    streak = prev && t - new Date(prev + "T00:00:00Z").getTime() === 86400000 ? streak + 1 : 1;
    best = Math.max(best, streak); prev = d.key;
  }
  const chip = (k: string, v: string, extra = "") => `<div class="chip"><span class="ck">${k}</span><span class="cv num">${v}</span>${extra}</div>`;
  return `<div class="chips">
    ${chip("avg / day", "$" + usd0(usd / days))}
    ${chip("peak day", peak ? `${tok(peak.raw || 0)} <i>${peak.key.slice(5)}</i>` : "—")}
    ${chip("last 7d", "$" + usd0(last7), delta != null ? `<span class="cd ${delta >= 0 ? "up" : "dn"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%</span>` : "")}
    ${chip("top model", topModel ? esc(humanModel(topModel.key)) : "—")}
    ${chip("$ / 1M tok", perM ? "$" + perM.toFixed(2) : "—")}
    ${chip("best streak", best + "d")}
  </div>`;
}

function modelBars(s: Stats, accent: string): string {
  const models = s.topModels.slice(0, 6).map((m) => ({ name: humanModel(m.key), tokens: m.raw || 0, usd: m.usd || 0, ops: m.count }));
  const max = Math.max(1, ...models.map((m) => m.tokens || m.ops));
  return models.map((m) => `<div class="mrow"><div class="top"><span class="name">${esc(m.name)}</span><span class="meta"><b class="num">${m.tokens ? tok(m.tokens) : m.ops + " ops"}</b> · <span class="usd num">$${usd0(m.usd)}</span></span></div>
    <div class="track"><div class="fill ${accent}" style="width:${(((m.tokens || m.ops) / max) * 100).toFixed(1)}%"></div></div></div>`).join("");
}

function provRows(s: Stats): string {
  return s.byProvider.map((p) => {
    const b = providerBrand(p.key);
    return `<div class="prow branded" style="${providerStyle(p.key)}"><span class="pmark mono">${esc(b.mark)}</span><span class="pk mono">${esc(p.key)}</span><span class="po num">${p.count.toLocaleString("en-US")} ops</span><span class="pt num">${p.raw ? tok(p.raw) : "—"}</span><span class="pu num">$${usd0(p.usd || 0)}</span></div>`;
  }).join("");
}

function section(id: string, title: string, sub: string, s: Stats | null, accent: string, emptyHint: string): string {
  if (!s || !s.totals.count) {
    return `<div class="eyebrow">${title}</div><div class="card empty"><p>${emptyHint}</p></div>`;
  }
  const pts = dayPoints(s);
  const usd = s.totals.usd ?? 0;
  const tokens = s.byProvider.reduce((a, p) => a + (p.raw || 0), 0);
  return `<div class="eyebrow">${title} <span class="esub">${sub}</span></div>
  <div class="stats s3">
    <div class="stat ${accent}"><div class="k">${tokens ? "Tokens" : "Operations"}</div><div class="v num">${tokens ? tok(tokens) : s.totals.count.toLocaleString("en-US")}</div><div class="sub">${s.totals.count.toLocaleString("en-US")} operations</div></div>
    <div class="stat cost"><div class="k">Est. spend</div><div class="v num">$<span>${usd0(usd)}</span></div><div class="sub est">list-price estimate</div></div>
    <div class="stat ${accent}"><div class="k">Active days</div><div class="v num">${s.byDay.length}</div><div class="sub">${esc(s.range.from?.slice(0, 10) ?? "")} → ${esc(s.range.to?.slice(0, 10) ?? "")}</div></div>
  </div>
  ${chips(s, pts)}
  <div class="grid2">
    <div class="card"><h3>Daily volume</h3><p class="cap">per-day ${tokens ? "tokens" : "operations"} · <span class="goldtxt">gold</span> = peak</p>
      <canvas class="daych" data-days='${esc(JSON.stringify(pts.map((p) => tokens ? p.tokens : p.ops)))}'></canvas>
      <h3 style="margin-top:22px">Cumulative spend</h3><p class="cap">running total, $</p>
      <canvas class="cumch" data-usd='${esc(JSON.stringify(pts.map((p) => p.usd)))}'></canvas></div>
    <div class="card"><h3>Top models</h3><p class="cap">by volume · est. cost</p>${modelBars(s, accent)}
      <h3 style="margin-top:20px">Providers</h3>${provRows(s)}</div>
  </div>`;
}

function leaderboard(all: Stats): string {
  const rows = [...all.byProvider].sort((a, b) => (b.usd || 0) - (a.usd || 0));
  const max = Math.max(1, ...rows.map((r) => r.usd || 0));
  const medal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `<span class="rk">#${i + 1}</span>`;
  return `<div class="eyebrow">Your tool leaderboard <span class="esub">which AI eats your wallet</span></div>
  <div class="card">${rows.map((r, i) => {
    const b = providerBrand(r.key);
    return `<div class="lb branded" style="${providerStyle(r.key)}"><span class="med">${medal(i)}</span><span class="pmark mono">${esc(b.mark)}</span><span class="pk mono">${esc(r.key)}</span>
     <div class="lbtrack"><div class="lbfill" style="width:${(((r.usd || 0) / max) * 100).toFixed(1)}%"></div></div>
     <span class="pu num">$${usd0(r.usd || 0)}</span></div>`;
  }).join("")}
  <p class="cap" style="margin:14px 0 0">Global multi-user board is live at <b>vibeusage.c0vibe.app</b>. Your local ranks update on every <code>vibetracker profile</code>.</p></div>`;
}

function githubHeatgrid(s: TrustSignal): string {
  if (s.kind !== "github_activity" || !s.days?.length) return "";
  const pad = new Date(`${s.days[0].date}T00:00:00Z`).getUTCDay();
  const blanks = Array.from({ length: pad }, (_, i) => `<span class="ghcell blank" style="--i:${i}"></span>`).join("");
  const cells = s.days.map((d, i) =>
    `<span class="ghcell l${d.level}" style="--i:${i + pad}" title="${esc(`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`)}"></span>`).join("");
  return `<div class="ghbox">
    <div class="ghmeta"><span class="mono">@${esc(s.handle)}</span><b>official GitHub contribution colors</b></div>
    <div class="ghgrid" aria-label="GitHub contribution heatgrid">${blanks}${cells}</div>
  </div>`;
}

function trustSignals(signals: TrustSignal[]): string {
  if (!signals.length) return "";
  const github = signals.filter((s) => s.kind === "github_activity");
  const creator = signals.filter((s) => s.kind === "creator_activity");
  const higgsfield = signals.filter((s) => s.kind === "higgsfield_mcp");
  if (!github.length && !creator.length && !higgsfield.length) return "";
  return `<div class="eyebrow">Trust signals <span class="esub">separate evidence · not usage</span></div>
  <div class="signals">${github.map((s) => `<div class="signal">
    <div class="sighead"><span>${esc(s.label)}</span><b class="mono">NOT USAGE</b></div>
    <div class="siggrid">
      <span><em>GitHub</em><strong>@${esc(s.handle)}</strong></span>
      <span><em>Window</em><strong>${s.windowDays}d</strong></span>
      <span><em>Contributions</em><strong class="num">${s.totalContributions.toLocaleString("en-US")}</strong></span>
      <span><em>Commits</em><strong class="num">${s.commitContributions.toLocaleString("en-US")}</strong></span>
      <span><em>PRs</em><strong class="num">${s.pullRequestContributions.toLocaleString("en-US")}</strong></span>
      <span><em>Reviews</em><strong class="num">${s.pullRequestReviewContributions.toLocaleString("en-US")}</strong></span>
    </div>
    ${githubHeatgrid(s)}
    <p class="cap">${esc(s.note)} Source: authenticated <code>gh</code> CLI aggregate.</p>
  </div>`).join("")}${creator.map((s) => `<div class="signal">
    <div class="sighead"><span>${esc(s.label)}</span><b class="mono">NOT USAGE</b></div>
    <div class="siggrid">
      <span><em>Platform</em><strong>${esc(s.platform)}</strong></span>
      <span><em>Handle</em><strong>@${esc(s.handle)}</strong></span>
      <span><em>Metric</em><strong>${esc(s.metric)}</strong></span>
      <span><em>Count</em><strong class="num">${s.count.toLocaleString("en-US")}</strong></span>
      ${s.windowDays ? `<span><em>Window</em><strong>${s.windowDays}d</strong></span>` : ""}
      ${s.url ? `<span><em>Source</em><strong>${esc(s.url)}</strong></span>` : ""}
    </div>
    <p class="cap">${esc(s.note)} Source: manually supplied public activity evidence.</p>
  </div>`).join("")}${higgsfield.map((s) => `<div class="signal">
    <div class="sighead"><span>${esc(s.label)}</span><b class="mono">NOT USAGE</b></div>
    <div class="siggrid">
      <span><em>Provider</em><strong>Higgsfield</strong></span>
      <span><em>MCP</em><strong>${esc(s.mcpName)}</strong></span>
      <span><em>Transport</em><strong>${esc(s.transport)}</strong></span>
      <span><em>Auth</em><strong>${esc(s.auth.toUpperCase())}</strong></span>
      <span><em>Host</em><strong>${esc(s.urlHost)}</strong></span>
      <span><em>Status</em><strong>${s.enabled ? "enabled" : "disabled"}</strong></span>
    </div>
    <p class="cap">${esc(s.note)} Source: local Codex MCP configuration metadata.</p>
  </div>`).join("")}</div>`;
}

function trustAndIntegrity(records: NormalizedRecord[], signals: TrustSignal[]): string {
  const integrity = computeIntegrity(records, signals);
  const sources = new Map<string, number>();
  for (const r of records) sources.set(r.source, (sources.get(r.source) ?? 0) + 1);
  const total = Math.max(1, records.length);
  const mix = [...sources.entries()].sort((a, b) => b[1] - a[1]).map(([source, count]) => {
    const pct = Number(((count / total) * 100).toFixed(1));
    return `<div class="mixrow"><span>${esc(source)}</span><b>${pct}%</b><i style="width:${pct}%"></i></div>`;
  }).join("");
  return `<div class="eyebrow">Trust & integrity <span class="esub">usage proof, not hype</span></div>
  <div class="grid2">
    <div class="card"><h3>Source mix</h3><p class="cap">where usage numbers came from</p>${mix || `<p class="cap">No usage records yet.</p>`}</div>
    <div class="card"><h3>Local integrity</h3><p class="cap">deterministic hashes for receipts and support</p>
      <div class="hashline"><span>records</span><code>${integrity.recordCount}</code></div>
      <div class="hashline"><span>chain</span><code>${integrity.chainHead.slice(0, 16)}...${integrity.chainHead.slice(-8)}</code></div>
      <div class="hashline"><span>bundle</span><code>${integrity.bundleFingerprint.slice(0, 16)}...${integrity.bundleFingerprint.slice(-8)}</code></div>
    </div>
  </div>`;
}

function roiSection(notes: RoiNote[]): string {
  if (!notes.length) return "";
  const rows = notes.slice(-8).reverse().map((note) => `<div class="roirow">
    <span class="mono">${esc(note.from.slice(0, 10))} → ${esc(note.to.slice(0, 10))}</span>
    <b>${note.valueUsd != null ? "$" + usd0(note.valueUsd) : "outcome"}</b>
    <p>${esc(note.note)}</p>
  </div>`).join("");
  return `<div class="eyebrow">AI life ROI <span class="esub">outcomes attached separately from usage</span></div>
  <div class="card">${rows}</div>`;
}

function operatorBadge(all: Stats, tokens: number, usd: number): string {
  const top = all.byProvider.slice().sort((a, b) => (b.usd || 0) - (a.usd || 0))[0];
  const topBrand = top ? providerBrand(top.key).mark : "--";
  const ascii = [
    "+--------------------------------------+",
    "| VIBETRACKER LOCAL PROFILE            |",
    "|--------------------------------------|",
    `| tools      ${String(all.byProvider.length).padEnd(26).slice(0, 26)} |`,
    `| ops        ${String(all.totals.count).padEnd(26).slice(0, 26)} |`,
    `| top mark   ${topBrand.padEnd(26).slice(0, 26)} |`,
    "| motto      VIBERS UNITE              |",
    "| home       c0vibe.app                |",
    "+--------------------------------------+",
  ].join("\n");
  return `<div class="opbadge">
    <div class="opcopy">
      <span class="scan mono">VTK://LOCAL-PROFILE//SHARE-CARD</span>
      <h2 class="mono">Vibers Unite</h2>
      <p>This profile is generated from the local usage ledger. Trust signals stay labelled, ROI notes stay separate, and totals stay honest.</p>
      <div class="opchips">
        <span><em>tokens</em><b class="num">${tok(tokens)}</b></span>
        <span><em>spend</em><b class="num">$${usd0(usd)}</b></span>
        <span><em>tools</em><b class="num">${all.byProvider.length}</b></span>
      </div>
    </div>
    <pre class="opascii">${esc(ascii)}</pre>
  </div>`;
}

function localSignalCockpit(records: NormalizedRecord[], all: Stats, signals: TrustSignal[], roiNotes: RoiNote[]): string {
  const verified = records.filter((r) => r.verified).length;
  const high = records.filter((r) => r.confidence === "high").length;
  const local = records.filter((r) => r.source === "local").length;
  const manual = records.filter((r) => ["manual", "ledger", "feed_recon", "balance_delta"].includes(r.source)).length;
  const categories = new Set(records.map((r) => r.category)).size;
  const topProviders = all.byProvider.slice(0, 5);
  const top = topProviders[0];
  const topBrand = top ? providerBrand(top.key) : providerBrand("c0vibe", "C0VIBE");
  const safeTotal = Math.max(1, records.length);
  const confidencePct = Math.round((high / safeTotal) * 100);
  const localPct = Math.round((local / safeTotal) * 100);
  const terminal = [
    "+------------------------------------------------------+",
    "| VTK://LOCAL-SIGNAL-COCKPIT//VIBERS-UNITE            |",
    "|------------------------------------------------------|",
    `| usage records ${fit(records.length, 8)} providers ${fit(all.byProvider.length, 7)} |`,
    `| verified      ${fit(verified, 8)} high conf ${fit(high, 8)} |`,
    `| trust signals ${fit(signals.length, 8)} NOT USAGE rail       |`,
    `| top mark      ${fit(topBrand.mark, 8)} categories ${fit(categories, 6)} |`,
    "| dry-run before upload // c0vibe.app                  |",
    "+------------------------------------------------------+",
  ].join("\n");
  const cards = [
    {
      id: "usage",
      label: "Usage core",
      value: `${all.totals.count.toLocaleString("en-US")} ops`,
      command: "vibetracker sync",
      note: "Provider records counted from the local ledger.",
      impact: "usage",
      meter: Math.min(100, Math.max(12, Math.round(Math.log10(Math.max(1, all.totals.count)) * 28))),
      brand: topBrand,
    },
    {
      id: "local",
      label: "Local lab",
      value: `${localPct}% local`,
      command: "vibetracker detect --local",
      note: "Loopback and on-machine records stay local until review.",
      impact: "local",
      meter: Math.min(100, Math.max(10, localPct)),
      brand: providerBrand("ollama"),
    },
    {
      id: "trust",
      label: "Trust rail",
      value: `${signals.length} signals`,
      command: "vibetracker trust add github",
      note: "GitHub, Codex, and creator cadence stay labelled NOT USAGE.",
      impact: "trust",
      meter: Math.min(100, Math.max(18, signals.length * 24)),
      brand: providerBrand("github"),
    },
    {
      id: "privacy",
      label: "Privacy gate",
      value: `${manual} manual`,
      command: "vibetracker upload --dry-run",
      note: "Review, redaction, and source-mix proof before anything leaves.",
      impact: "privacy",
      meter: Math.min(100, Math.max(42, confidencePct)),
      brand: providerBrand("c0vibe", "Privacy"),
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: `${roiNotes.length} ROI`,
      command: "vibetracker upload",
      note: "Vibers Unite at c0vibe.app after the aggregate bundle is reviewed.",
      impact: "publish",
      meter: records.length ? 92 : 18,
      brand: providerBrand("c0vibe"),
    },
  ];
  const orbit = topProviders.length
    ? topProviders.map((p, i) => {
      const b = providerBrand(p.key);
      return `<span class="orbitnode branded" style="${providerStyle(p.key)};--i:${i}"><i class="pmark mono">${esc(b.mark)}</i><b>${esc(b.label)}</b><em class="num">$${usd0(p.usd || 0)}</em></span>`;
    }).join("")
    : `<span class="orbitnode emptytop mono">NO LOCAL RECORDS YET</span>`;
  const laneHtml = cards.map((card, index) => `<article class="siglane siglane-${card.impact} branded" style="--i:${index};--meter:${card.meter}%;--brand-from:${card.brand.from};--brand-to:${card.brand.to};--brand-ink:${card.brand.ink}">
    <div class="sigtop"><i class="pmark mono">${esc(card.brand.mark)}</i><span>${card.impact === "trust" ? "NOT USAGE" : esc(card.impact)}</span></div>
    <b>${esc(card.label)}</b>
    <strong class="num">${esc(card.value)}</strong>
    <code>${esc(card.command)}</code>
    <p>${esc(card.note)}</p>
    <div class="sigmeter" aria-label="${esc(card.label)} readiness ${card.meter} percent"><i></i></div>
  </article>`).join("");

  return `<section class="signal-cockpit" aria-label="Local signal cockpit">
    <div class="signal-terminal">
      <div class="scan mono">VTK://LOCAL-SIGNAL-COCKPIT//C0VIBE.APP</div>
      <pre>${esc(terminal)}</pre>
      <div class="orbit" aria-label="Top provider orbit">${orbit}</div>
    </div>
    <div class="siglanes">${laneHtml}</div>
  </section>`;
}

function profileDatastreamPassport(records: NormalizedRecord[], all: Stats, signals: TrustSignal[]): string {
  const integrity = computeIntegrity(records, signals);
  const providerCount = all.byProvider.length;
  const activeDays = all.byDay.length;
  const tokens = all.byProvider.reduce((sum, p) => sum + (p.raw || 0), 0);
  const usd = all.totals.usd ?? 0;
  const latestDay = all.byDay.length ? all.byDay[all.byDay.length - 1]!.key : "waiting";
  const top = all.byProvider[0];
  const topBrand = top ? providerBrand(top.key) : providerBrand("c0vibe", "C0VIBE");
  const shortBundle = `${integrity.bundleFingerprint.slice(0, 10)}...${integrity.bundleFingerprint.slice(-8)}`;
  const scoreReadiness = Math.min(100, Math.max(18, providerCount * 14 + activeDays * 3 + signals.length * 9));
  const usageReadiness = records.length ? Math.min(100, 24 + Math.round(Math.log10(records.length + 1) * 34)) : 10;
  const lanes = [
    {
      mark: "UP",
      impact: "USAGE",
      label: "Upload aggregate",
      value: `${records.length.toLocaleString("en-US")} rows`,
      route: "local ledger -> reviewed bundle",
      guardrail: "No raw prompts, outputs, or secrets.",
      meter: usageReadiness,
      tone: "usage",
    },
    {
      mark: topBrand.mark,
      impact: "USAGE",
      label: "Provider mix",
      value: `${providerCount} tools`,
      route: "provider totals -> source mix",
      guardrail: "Only validated rows move spend and credits.",
      meter: providerCount ? Math.min(100, 22 + providerCount * 12) : 12,
      tone: "provider",
    },
    {
      mark: "HG",
      impact: "USAGE",
      label: "Heatgrid rhythm",
      value: `${activeDays} days`,
      route: "daily aggregate -> heatgrid",
      guardrail: "Aggregate daily rhythm, not raw event history.",
      meter: activeDays ? Math.min(100, 18 + activeDays * 8) : 10,
      tone: "heatgrid",
    },
    {
      mark: "SC",
      impact: "SCORE",
      label: "Score inputs",
      value: tokens ? tok(tokens) : `${all.totals.count} ops`,
      route: "usage factors -> vibe score receipt",
      guardrail: "Local profile does not self-certify verified rank.",
      meter: scoreReadiness,
      tone: "score",
    },
    {
      mark: "NO",
      impact: "NOT USAGE",
      label: "Trust side rail",
      value: `${signals.length} signal${signals.length === 1 ? "" : "s"}`,
      route: "github/creator -> context only",
      guardrail: "Cannot change spend, credits, operations, rank, or verified status.",
      meter: signals.length ? Math.min(100, 28 + signals.length * 18) : 12,
      tone: "trust",
    },
    {
      mark: "C0",
      impact: "PUBLISH",
      label: "C0VIBE relay",
      value: "c0vibe.app",
      route: "dry-run review -> public profile",
      guardrail: "Vibers Unite only after explicit aggregate review.",
      meter: records.length ? 92 : 18,
      tone: "publish",
    },
  ];
  const terminal = [
    "+------------------------------------------------------+",
    "| VTK://PROFILE-DATASTREAM-PASSPORT//SOURCE-TO-SCORE  |",
    "|------------------------------------------------------|",
    `| latest day   ${fit(latestDay, 12)} bundle ${fit(shortBundle, 18)} |`,
    `| usage rows   ${fit(records.length, 12)} tools  ${fit(providerCount, 12)} |`,
    `| score feed   ${fit(tokens ? tok(tokens) : all.totals.count + " ops", 12)} spend  ${fit("$" + usd0(usd), 12)} |`,
    `| trust rail   ${fit(signals.length, 12)} NOT USAGE             |`,
    "| profile, heatgrid, score, badges share this stream   |",
    "+------------------------------------------------------+",
  ].join("\n");
  const laneHtml = lanes.map((lane, index) => `<article class="dsp-lane dsp-${esc(lane.tone)}" style="--i:${index};--meter:${lane.meter}%">
    <span class="mono">${esc(lane.mark)}</span>
    <div><em>${esc(lane.impact)}</em><b>${esc(lane.label)}</b><small>${esc(lane.guardrail)}</small></div>
    <strong class="num">${esc(lane.value)}</strong>
    <code>${esc(lane.route)}</code>
    <i></i>
  </article>`).join("");
  return `<section class="datastream-passport" aria-label="Profile datastream passport">
    <div class="dsp-head">
      <div>
        <span class="scan mono">VTK://PROFILE-DATASTREAM-PASSPORT//SOURCE-TO-SCORE</span>
        <h2 class="mono">Source-to-score passport</h2>
        <p>The local profile now shows the same reviewed aggregate path that feeds public profile, heatgrid, vibe score inputs, share badges, and trust side rails.</p>
      </div>
      <pre>${esc(terminal)}</pre>
    </div>
    <div class="dsp-track">${laneHtml}</div>
	  </section>`;
}

function profileReplayRecorder(records: NormalizedRecord[], all: Stats, signals: TrustSignal[]): string {
  const integrity = computeIntegrity(records, signals);
  const top = all.byProvider[0];
  const topBrand = top ? providerBrand(top.key) : providerBrand("c0vibe", "C0VIBE");
  const sourceCount = new Set(records.map((r) => r.source)).size;
  const activeDays = all.byDay.length;
  const shortBundle = `${integrity.bundleFingerprint.slice(0, 12)}...${integrity.bundleFingerprint.slice(-8)}`;
  const tokens = all.byProvider.reduce((sum, p) => sum + (p.raw || 0), 0);
  const usageMeter = records.length ? Math.min(100, 24 + Math.round(Math.log10(records.length + 1) * 34)) : 10;
  const providerMeter = all.byProvider.length ? Math.min(100, 20 + all.byProvider.length * 12) : 12;
  const dayMeter = activeDays ? Math.min(100, 22 + activeDays * 8) : 10;
  const trustMeter = signals.length ? Math.min(100, 28 + signals.length * 18) : 12;
  const terminal = [
    "+------------------------------------------------------+",
    "| VTK://PROFILE-BLACK-BOX//REPLAY-RECORDER//NO-SECRETS|",
    "|------------------------------------------------------|",
    `| ledger rows ${fit(records.length, 8)} sources ${fit(sourceCount, 8)} bundle ${fit(shortBundle, 14)} |`,
    `| providers   ${fit(all.byProvider.length, 8)} days    ${fit(activeDays, 8)} top ${fit(topBrand.mark, 4)} |`,
    `| score feed  ${fit(tokens ? tok(tokens) : all.totals.count + " ops", 12)} spend ${fit("$" + usd0(all.totals.usd ?? 0), 10)} |`,
    `| trust rail  ${fit(signals.length, 8)} NOT USAGE / no rank impact |`,
    "| prompts 0 // outputs 0 // secrets 0 // raw files 0   |",
    "| publish waits for upload --dry-run review            |",
    "+------------------------------------------------------+",
  ].join("\n");
  const events = [
    {
      mark: "UP",
      impact: "USAGE",
      label: "Aggregate captured",
      value: `${records.length.toLocaleString("en-US")} rows`,
      detail: "Local ledger rows enter the profile after validation, not from animation.",
      meter: usageMeter,
      tone: "usage",
    },
    {
      mark: topBrand.mark,
      impact: "USAGE",
      label: "Provider mix replayed",
      value: `${all.byProvider.length} tools`,
      detail: "Branded marks explain source mix; spend still comes from accepted rows.",
      meter: providerMeter,
      tone: "provider",
    },
    {
      mark: "HG",
      impact: "USAGE",
      label: "Heatgrid rhythm sealed",
      value: `${activeDays} days`,
      detail: "Daily aggregates drive rhythm without exposing event history.",
      meter: dayMeter,
      tone: "heatgrid",
    },
    {
      mark: "SC",
      impact: "SCORE",
      label: "Score receipt linked",
      value: tokens ? tok(tokens) : `${all.totals.count} ops`,
      detail: "Vibe score inputs trace to usage factors, never self-certified rank.",
      meter: Math.min(100, Math.max(18, providerMeter + dayMeter - 30)),
      tone: "score",
    },
    {
      mark: "NO",
      impact: "NOT USAGE",
      label: "Trust rail isolated",
      value: `${signals.length} signal${signals.length === 1 ? "" : "s"}`,
      detail: "GitHub, creator, and builder context cannot change spend or rank.",
      meter: trustMeter,
      tone: "trust",
    },
    {
      mark: "C0",
      impact: "PUBLISH",
      label: "C0VIBE relay armed",
      value: "c0vibe.app",
      detail: "Vibers Unite only after the aggregate bundle is reviewed.",
      meter: records.length ? 92 : 18,
      tone: "publish",
    },
  ];
  const rows = events.map((event, index) => `<article class="replay-event replay-${esc(event.tone)}" data-impact="${esc(event.impact)}" style="--i:${index};--meter:${event.meter}%">
    <span class="mono">${esc(event.mark)}</span>
    <div><em>${esc(event.impact)}</em><b>${esc(event.label)}</b><small>${esc(event.detail)}</small></div>
    <strong class="num">${esc(event.value)}</strong>
    <i></i>
  </article>`).join("");
  return `<section class="profile-replay" aria-label="Profile black box replay recorder">
    <div class="replay-head">
      <div>
        <span class="scan mono">VTK://PROFILE-BLACK-BOX//REPLAY-RECORDER//NO-SECRETS</span>
        <h2 class="mono">Profile black box replay</h2>
        <p>A static terminal recorder for the local profile: source mix, heatgrid, score receipt, trust side rail, and C0VIBE relay are replayed from aggregates only.</p>
      </div>
      <pre>${esc(terminal)}</pre>
    </div>
    <div class="replay-track">${rows}</div>
    <p class="replay-note">Replay metadata only. No prompts, model outputs, pasted keys, raw provider payloads, or hidden usage are stored in this profile.</p>
  </section>`;
}

type LifeLane = {
  id: string;
  label: string;
  sub: string;
  categories?: NormalizedRecord["category"][];
  sources?: NormalizedRecord["source"][];
};

const LIFE_LANES: LifeLane[] = [
  { id: "code", label: "Code & agents", sub: "coding agents, IDEs, LLM APIs", categories: ["coding", "llm"] },
  { id: "creator", label: "Creator studio", sub: "image, video, music, audio, 3D", categories: ["image", "video", "music", "audio", "3d"] },
  { id: "local", label: "Local AI lab", sub: "Ollama, LM Studio, ComfyUI, local runners", sources: ["local"] },
  { id: "proxy", label: "CLI / MCP rail", sub: "proxied tools, MCPs, terminal workflows", sources: ["proxy", "log"] },
  { id: "ledger", label: "Ledger & manual", sub: "subscriptions, imports, public ledgers", sources: ["ledger", "balance_delta", "feed_recon", "manual"] },
];

function laneRecords(records: NormalizedRecord[], lane: LifeLane): NormalizedRecord[] {
  return records.filter((r) => {
    const byCategory = lane.categories?.includes(r.category) ?? false;
    const bySource = lane.sources?.includes(r.source) ?? false;
    return byCategory || bySource;
  });
}

function lifeDashboard(records: NormalizedRecord[], all: Stats, signals: TrustSignal[], roiNotes: RoiNote[]): string {
  const sourceCount = new Set(records.map((r) => r.source)).size;
  const verifiedCount = records.filter((r) => r.verified).length;
  const highConfidence = records.filter((r) => r.confidence === "high").length;
  const laneViews = LIFE_LANES.map((lane) => {
    const recs = laneRecords(records, lane);
    const stats = computeStats(recs);
    const tokens = stats.byProvider.reduce((sum, p) => sum + (p.raw || 0), 0);
    const usd = stats.totals.usd ?? 0;
    const top = stats.byProvider[0];
    return { lane, recs, stats, tokens, usd, top, metric: tokens || stats.totals.count };
  });
  const maxMetric = Math.max(1, ...laneViews.map((v) => v.metric));
  const topTools = all.byProvider.slice(0, 5).map((p) => {
    const b = providerBrand(p.key);
    return `<span class="toolchip branded" style="${providerStyle(p.key)}"><i class="pmark mono">${esc(b.mark)}</i><b>${esc(b.label)}</b></span>`;
  }).join("");
  const ascii = [
    "+----------------------------------------------+",
    "| VIBETRACKER AI LIFE DASHBOARD                |",
    "| usage -> trust -> roi -> share               |",
    "| trust lane: NOT USAGE                        |",
    "| motto: Vibers Unite                          |",
    "| home: c0vibe.app                             |",
    "+----------------------------------------------+",
  ].join("\n");
  const lanes = laneViews.map(({ lane, stats, tokens, usd, top, metric }) => {
    const pct = Number(((metric / maxMetric) * 100).toFixed(1));
    const topBrand = top ? providerBrand(top.key) : null;
    return `<article class="lifelane lifelane-${esc(lane.id)}">
      <div class="lifetop">
        <span>
          <b>${esc(lane.label)}</b>
          <em>${esc(lane.sub)}</em>
        </span>
        ${top && topBrand ? `<strong class="branded" style="${providerStyle(top.key)}"><i class="pmark mono">${esc(topBrand.mark)}</i>${esc(topBrand.label)}</strong>` : `<strong class="emptytop mono">NO DATA</strong>`}
      </div>
      <div class="lifemeta">
        <span><em>ops</em><b class="num">${stats.totals.count.toLocaleString("en-US")}</b></span>
        <span><em>${tokens ? "raw" : "tools"}</em><b class="num">${tokens ? tok(tokens) : stats.byProvider.length}</b></span>
        <span><em>est.</em><b class="num">$${usd0(usd)}</b></span>
      </div>
      <div class="lifebar" aria-label="${esc(lane.label)} coverage"><i style="width:${pct}%"></i></div>
    </article>`;
  }).join("");
  return `<section class="life" aria-label="AI life dashboard">
    <div class="lifehead">
      <div>
        <span class="scan mono">VTK://AI-LIFE-DASHBOARD//VIBERS-UNITE//C0VIBE.APP</span>
        <h2 class="mono">AI life dashboard</h2>
        <p>One local profile for coders, creators, researchers, operators, and local-AI builders. Usage stays counted; trust signals and ROI notes stay in their own lanes.</p>
      </div>
      <pre class="lifeascii">${esc(ascii)}</pre>
    </div>
    <div class="lifepills">
      <span><em>usage records</em><b class="num">${records.length.toLocaleString("en-US")}</b><small>counted in totals</small></span>
      <span><em>trust signals</em><b class="num">${signals.length}</b><small>NOT USAGE</small></span>
      <span><em>ROI notes</em><b class="num">${roiNotes.length}</b><small>separate outcomes</small></span>
      <span><em>proof sources</em><b class="num">${sourceCount}</b><small>${verifiedCount} verified · ${highConfidence} high</small></span>
    </div>
    ${topTools ? `<div class="toolrail" aria-label="Top provider marks">${topTools}</div>` : ""}
    <div class="lifegrid">${lanes}</div>
  </section>`;
}

export function renderProfileHtml(records: NormalizedRecord[], signals: TrustSignal[] = [], roiNotes: RoiNote[] = []): string {
  const all = computeStats(records);
  const code = computeStats(records.filter((r) => CODE_CATS.has(r.category)));
  const creative = computeStats(records.filter((r) => CREATIVE_CATS.has(r.category)));
  const other = records.filter((r) => !CODE_CATS.has(r.category) && !CREATIVE_CATS.has(r.category));
  const otherStats = other.length ? computeStats(other) : null;
  const tokens = all.byProvider.reduce((a, p) => a + (p.raw || 0), 0);
  const usd = all.totals.usd ?? 0;
  const range = all.range.from ? `${all.range.from.slice(0, 10)} → ${all.range.to!.slice(0, 10)}` : "no data";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vibe Usage Profile</title><style>
  :root{--ground:#090c10;--panel:#0e141a;--panel-2:#131c24;--line:#1f2a34;--ink:#e9eff5;--muted:#7f8f9d;--faint:#54636f;
    --cyan:#2ee6d6;--sky:#34c3f0;--blue:#3b9dff;--green:#3ddc84;--gold:#ffcb45;--rose:#ff8a6b}
  *{box-sizing:border-box} body{margin:0;background:radial-gradient(1100px 560px at 80% -8%,rgba(46,230,214,.07),transparent 60%),radial-gradient(800px 500px at 8% 30%,rgba(61,220,132,.04),transparent 55%),var(--ground);
    color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
  .mono{font-family:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace}
  .num{font-variant-numeric:tabular-nums;font-family:ui-monospace,"SF Mono","JetBrains Mono",Menlo,monospace}
  .wrap{max-width:1080px;margin:0 auto;padding:28px 22px 60px}
  .term{border:1px solid var(--line);border-radius:12px;background:linear-gradient(180deg,#0d141b,#0b1116);overflow:hidden;box-shadow:0 30px 80px -40px #000}
  .tbar{display:flex;gap:8px;align-items:center;padding:11px 15px;border-bottom:1px solid var(--line);background:#0b1015}
  .dot{width:11px;height:11px;border-radius:50%} .tbar .p{margin-left:10px;color:var(--faint);font-size:12.5px}
  .tbody{padding:30px}
  .brand{display:flex;align-items:baseline;flex-wrap:wrap;gap:10px 16px}
  h1{margin:0;font-size:48px;line-height:.92;font-weight:800;background:linear-gradient(100deg,var(--green),var(--cyan) 40%,var(--sky) 66%,var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
  .by{color:var(--muted);font-size:12.5px;letter-spacing:.14em;text-transform:uppercase} .by b{color:var(--gold);font-weight:600}
  .who{margin:14px 0 0;color:var(--muted);font-size:14px} .who b{color:var(--ink)}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px} .stats.s3{grid-template-columns:repeat(3,1fr)}
  .stat{background:linear-gradient(180deg,var(--panel-2),var(--panel));border:1px solid var(--line);border-radius:10px;padding:15px;position:relative;overflow:hidden}
  .stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--cyan),var(--blue))}
  .stat.cost::before{background:linear-gradient(180deg,var(--gold),#c98a17)}
  .stat.creative::before{background:linear-gradient(180deg,var(--green),var(--cyan))}
  .k{color:var(--muted);font-size:10.5px;letter-spacing:.15em;text-transform:uppercase}
  .v{font-size:30px;font-weight:700;margin-top:7px;line-height:1} .v small{font-size:.5em;color:var(--muted)}
  .opbadge{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.95fr);gap:14px;margin:18px 0 4px}
  .opcopy,.opascii{position:relative;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,#111a20,var(--panel));box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
  .opcopy{padding:18px;overflow:hidden}.opcopy::before,.opascii::before{content:"";position:absolute;left:0;right:48%;top:0;height:1px;background:linear-gradient(90deg,var(--green),transparent)}
  .scan{display:block;color:var(--cyan);font-size:10px;letter-spacing:.14em}.opcopy h2{margin:12px 0 6px;font-size:28px;line-height:1;color:#d9fff2}.opcopy p{margin:0;color:var(--muted);font-size:13px}
  .opchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.opchips span{border:1px solid var(--line);border-radius:999px;background:#0b1219;padding:7px 10px}.opchips em{color:var(--faint);font-style:normal;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-right:7px}.opchips b{color:var(--gold)}
  .opascii{margin:0;padding:14px;color:#d9fff2;font:800 11px/1.18 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(46,230,214,.22)}
  .signal-cockpit{display:grid;grid-template-columns:minmax(320px,.78fr) minmax(0,1.22fr);gap:1px;margin:18px 0 8px;border:1px solid var(--line);border-radius:10px;background:var(--line);overflow:hidden;box-shadow:0 28px 84px -66px var(--cyan)}
  .signal-terminal{position:relative;min-height:360px;padding:14px;background:radial-gradient(circle at 28% 0,rgba(46,230,214,.12),transparent 35%),#05080a;overflow:hidden}
  .signal-terminal::before{content:"";position:absolute;inset:42px 10px 10px;border:1px solid rgba(46,230,214,.12);background:linear-gradient(rgba(46,230,214,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:100% 22px,24px 100%;pointer-events:none}
  .signal-terminal::after{content:"";position:absolute;left:10px;right:10px;top:52px;height:32px;background:linear-gradient(180deg,transparent,rgba(46,230,214,.16),rgba(255,203,69,.1),transparent);animation:scanline 4.2s cubic-bezier(.22,.68,.12,1) infinite;pointer-events:none}
  .signal-terminal .scan,.signal-terminal pre,.orbit{position:relative;z-index:1}.signal-terminal pre{margin:12px 0 0;color:#d9fff2;font:900 10.5px/1.3 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(46,230,214,.2)}
  .orbit{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.orbitnode{display:inline-flex;align-items:center;gap:7px;min-width:0;border:1px solid var(--line);border-radius:999px;background:#0b1219;padding:5px 8px;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 70ms)}.orbitnode b{font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.orbitnode em{color:var(--gold);font-style:normal;font-size:10px}
  .siglanes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line)}.siglane{position:relative;min-height:360px;display:grid;grid-template-rows:auto auto auto auto 1fr auto;gap:8px;padding:12px;background:linear-gradient(150deg,color-mix(in srgb,var(--brand-from) 12%,#0d141a),#05080a);overflow:hidden;animation:rise .48s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 70ms)}
  .siglane::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(var(--brand-from),transparent)}.siglane::after{content:"";position:absolute;inset:0;background:linear-gradient(118deg,transparent 0 42%,color-mix(in srgb,var(--brand-from) 14%,transparent) 50%,transparent 58%);transform:translateX(-96%);animation:sweep 6s cubic-bezier(.22,.68,.12,1) infinite;animation-delay:calc(var(--i) * 180ms);pointer-events:none}
  .siglane-trust,.siglane-privacy{border-left:1px dashed rgba(255,203,69,.36)}.siglane>*{position:relative;z-index:1;min-width:0}.sigtop{display:flex;align-items:center;justify-content:space-between;gap:8px}.sigtop span{color:#071013;background:linear-gradient(135deg,var(--brand-to),#effff9);border-radius:999px;padding:4px 6px;font:900 8px/1 ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}
  .siglane b{color:#f4fffb;font:900 11px/1.14 ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase}.siglane strong{color:#d9fff2;font:900 18px/1 ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase}.siglane code{display:block;color:#d9fff2;background:rgba(0,0,0,.23);border:1px solid color-mix(in srgb,var(--brand-from) 28%,var(--line));border-radius:7px;padding:7px;font-size:10px;line-height:1.28;overflow-wrap:anywhere}.siglane p{margin:0;color:var(--muted);font-size:10.5px;line-height:1.34}
  .sigmeter{height:8px;background:#070c10;border:1px solid rgba(255,255,255,.08);border-radius:999px;overflow:hidden}.sigmeter i{display:block;width:var(--meter);height:100%;background:linear-gradient(90deg,var(--brand-from),var(--brand-to));box-shadow:0 0 16px -5px var(--brand-from)}
  .datastream-passport{margin:18px 0 8px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,#101a1e,#090f12);overflow:hidden;box-shadow:0 28px 84px -64px var(--green);position:relative}.datastream-passport::before{content:"";position:absolute;left:0;right:30%;top:0;height:1px;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold),transparent)}
  .dsp-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.9fr);gap:16px;align-items:stretch;padding:18px;border-bottom:1px solid var(--line)}.dsp-head h2{margin:11px 0 6px;color:#d9fff2;font-size:30px;line-height:1}.dsp-head p{margin:0;max-width:680px;color:var(--muted);font-size:13px}.dsp-head pre{margin:0;padding:13px;border:1px solid var(--line);border-radius:8px;background:#05080a;color:#d9fff2;font:900 10.5px/1.2 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(46,230,214,.2)}
	  .dsp-track{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line)}.dsp-lane{--tone:var(--cyan);position:relative;display:grid;grid-template-rows:auto minmax(92px,1fr) auto auto auto;gap:8px;min-width:0;background:linear-gradient(150deg,color-mix(in srgb,var(--tone) 12%,#0d141a),#05080a);padding:12px;overflow:hidden;animation:rise .48s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 62ms)}.dsp-lane::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(var(--tone),transparent)}.dsp-lane::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--tone) var(--meter),rgba(255,255,255,.06) 0)}.dsp-lane>*{position:relative;z-index:1;min-width:0}.dsp-lane>span{display:grid;place-items:center;width:34px;height:30px;border-radius:8px;background:color-mix(in srgb,var(--tone) 25%,#05080a);color:#f4fffb;font:900 10px/1 ui-monospace,"SF Mono",Menlo,monospace;box-shadow:0 0 18px -9px var(--tone)}.dsp-lane em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,"SF Mono",Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.dsp-lane b{display:block;margin-top:4px;color:#f4fffb;font:900 11px/1.15 ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.dsp-lane small{display:block;margin-top:6px;color:var(--muted);font-size:10.5px;line-height:1.35}.dsp-lane strong{color:#d9fff2;font:900 16px/1 ui-monospace,"SF Mono",Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsp-lane code{display:block;color:#d9fff2;background:rgba(0,0,0,.22);border:1px solid color-mix(in srgb,var(--tone) 28%,var(--line));border-radius:7px;padding:7px;font-size:10px;line-height:1.28;overflow-wrap:anywhere}.dsp-lane i{height:7px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:linear-gradient(90deg,var(--tone) var(--meter),#070c10 0);box-shadow:0 0 16px -7px var(--tone)}
	  .dsp-usage{--tone:var(--green)}.dsp-provider{--tone:var(--cyan)}.dsp-heatgrid{--tone:#39d353}.dsp-score{--tone:var(--sky)}.dsp-trust{--tone:var(--gold);border-left:1px dashed rgba(255,203,69,.38)}.dsp-publish{--tone:var(--green)}
	  .profile-replay{margin:18px 0 8px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,#07100f,#05080a);overflow:hidden;box-shadow:0 28px 88px -66px var(--cyan);position:relative}.profile-replay::before{content:"";position:absolute;left:0;right:24%;top:0;height:1px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold),transparent)}
	  .replay-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(350px,.95fr);gap:16px;align-items:stretch;padding:18px;border-bottom:1px solid var(--line)}.replay-head h2{margin:11px 0 6px;color:#d9fff2;font-size:30px;line-height:1}.replay-head p{margin:0;max-width:700px;color:var(--muted);font-size:13px}.replay-head pre{margin:0;padding:13px;border:1px solid var(--line);border-radius:8px;background:radial-gradient(circle at 14% 0,rgba(46,230,214,.12),transparent 35%),#020405;color:#d9fff2;font:900 10px/1.22 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(46,230,214,.2)}
	  .replay-track{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line)}.replay-event{--tone:var(--cyan);position:relative;display:grid;grid-template-rows:auto minmax(106px,1fr) auto auto;gap:8px;min-width:0;background:linear-gradient(150deg,color-mix(in srgb,var(--tone) 11%,#0d141a),#05080a);padding:12px;overflow:hidden;animation:rise .48s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 62ms)}.replay-event::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(var(--tone),transparent)}.replay-event::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--tone) var(--meter),rgba(255,255,255,.06) 0)}.replay-event[data-impact="NOT USAGE"]{border-left:1px dashed rgba(255,203,69,.4)}.replay-event>*{position:relative;z-index:1;min-width:0}.replay-event>span{display:grid;place-items:center;width:34px;height:30px;border-radius:8px;background:color-mix(in srgb,var(--tone) 25%,#05080a);color:#f4fffb;font:900 10px/1 ui-monospace,"SF Mono",Menlo,monospace;box-shadow:0 0 18px -9px var(--tone)}.replay-event em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,"SF Mono",Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.replay-event b{display:block;margin-top:4px;color:#f4fffb;font:900 11px/1.15 ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.replay-event small{display:block;margin-top:6px;color:var(--muted);font-size:10.5px;line-height:1.35}.replay-event strong{color:#d9fff2;font:900 15px/1 ui-monospace,"SF Mono",Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.replay-event i{height:7px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:linear-gradient(90deg,var(--tone) var(--meter),#070c10 0);box-shadow:0 0 16px -7px var(--tone)}.replay-usage{--tone:var(--green)}.replay-provider{--tone:var(--cyan)}.replay-heatgrid{--tone:#39d353}.replay-score{--tone:var(--sky)}.replay-trust{--tone:var(--gold)}.replay-publish{--tone:var(--green)}.replay-note{margin:0;padding:12px 18px;color:var(--muted);font-size:11.5px;border-top:1px solid var(--line);background:rgba(0,0,0,.13)}
	  .life{margin:18px 0 8px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,#101820,#0b1117);overflow:hidden;position:relative}
  .life::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold),transparent)}
  .lifehead{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.9fr);gap:16px;align-items:stretch;padding:18px;border-bottom:1px solid var(--line)}
  .lifehead h2{margin:11px 0 6px;font-size:30px;line-height:1;color:#d9fff2}.lifehead p{margin:0;max-width:660px;color:var(--muted);font-size:13px}
  .lifeascii{margin:0;padding:13px;border:1px solid var(--line);border-radius:8px;background:#070c10;color:#d9fff2;font:800 10.5px/1.18 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(61,220,132,.18)}
  .lifepills{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;padding:12px 18px;border-bottom:1px solid var(--line)}
  .lifepills span{background:#0b1219;border:1px solid var(--line);border-radius:8px;padding:10px}.lifepills em{display:block;color:var(--faint);font-style:normal;font-size:10px;text-transform:uppercase;letter-spacing:.11em}.lifepills b{display:block;margin-top:4px;color:#d9fff2;font-size:19px}.lifepills small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
  .toolrail{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 13px}.toolchip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:999px;background:#0b1219;padding:5px 9px}.toolchip .pmark{width:24px;height:21px}.toolchip b{color:var(--ink);font-size:11.5px}
  .lifegrid{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border-top:1px solid var(--line)}
  .lifelane{background:linear-gradient(180deg,#111a20,#0d141a);padding:13px;min-height:154px}.lifetop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.lifetop b{display:block;color:#f4fffb;font-size:12.5px}.lifetop em{display:block;margin-top:4px;color:var(--muted);font-style:normal;font-size:11px;line-height:1.35}.lifetop strong{display:inline-flex;align-items:center;gap:6px;color:var(--ink);font-size:10.5px;font-weight:800;white-space:nowrap}.emptytop{color:var(--faint)!important;border:1px solid var(--line);border-radius:999px;padding:5px 7px}
  .lifemeta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0 12px}.lifemeta span{min-width:0}.lifemeta em{display:block;color:var(--faint);font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.1em}.lifemeta b{display:block;color:var(--gold);font-size:12px;overflow:hidden;text-overflow:ellipsis}
  .lifebar{height:9px;background:#070c10;border:1px solid var(--line);border-radius:999px;overflow:hidden}.lifebar i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold));box-shadow:0 0 16px -5px var(--cyan)}
  .stat.cost .v{color:var(--gold)} .sub{color:var(--faint);font-size:11.5px;margin-top:6px}
  .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
  .chip{display:flex;align-items:baseline;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:6px 13px;font-size:12px}
  .ck{color:var(--faint);letter-spacing:.06em} .cv{color:var(--ink);font-weight:600} .cv i{color:var(--faint);font-style:normal;font-size:.85em}
  .cd{font-size:11px;font-weight:700} .cd.up{color:var(--rose)} .cd.dn{color:var(--green)}
  .eyebrow{color:var(--faint);font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;margin:30px 0 12px;display:flex;gap:10px;align-items:baseline}
  .eyebrow::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent);align-self:center}
  .esub{color:var(--faint);font-size:11px;letter-spacing:.02em;text-transform:none}
  .grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:18px;align-items:start;margin-top:14px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px}
  .card.empty{color:var(--muted);font-size:13.5px} .card.empty p{margin:0} .card.empty code{color:var(--cyan);background:#0b1219;border:1px solid var(--line);padding:2px 7px;border-radius:5px}
  .card h3{margin:0 0 3px;font-size:13.5px} .cap{color:var(--faint);font-size:11.5px;margin:0 0 14px} .goldtxt{color:var(--gold)}
  canvas{display:block;width:100%;height:150px}
  .prow{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px} .prow:last-child{border:0}
  .branded{--brand-from:var(--cyan);--brand-to:var(--blue);--brand-ink:#071013}.pmark{display:inline-grid;place-items:center;width:28px;height:24px;border-radius:7px;background:linear-gradient(135deg,var(--brand-from),var(--brand-to));color:var(--brand-ink);font-weight:800;font-size:10px;box-shadow:0 0 18px -8px var(--brand-from)}
  .pk{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis} .po{color:var(--faint);width:86px;text-align:right} .pt{color:var(--ink);width:72px;text-align:right} .pu{color:var(--gold);width:76px;text-align:right}
  .mrow{margin-bottom:12px} .mrow .top{display:flex;justify-content:space-between;gap:8px;margin-bottom:5px} .name{font-size:12.5px;font-weight:600}
  .meta{color:var(--muted);font-size:11.5px;white-space:nowrap} .meta .usd{color:var(--gold)}
  .track{height:8px;background:#0b1219;border:1px solid var(--line);border-radius:6px;overflow:hidden}
  .fill{height:100%;background:linear-gradient(90deg,var(--cyan),var(--blue));box-shadow:0 0 12px -2px rgba(46,230,214,.5)}
  .fill.creative{background:linear-gradient(90deg,var(--green),var(--cyan))}
  .lb{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px} .lb:last-of-type{border:0}
  .med{width:34px;text-align:center} .rk{color:var(--faint);font-size:12px}
  .lbtrack{flex:1;height:9px;background:#0b1219;border:1px solid var(--line);border-radius:6px;overflow:hidden}
  .lbfill{height:100%;background:linear-gradient(90deg,var(--brand-from),var(--brand-to))}
  .mixrow{position:relative;border:1px solid var(--line);border-radius:7px;background:#0b1219;padding:8px 10px;margin-top:8px;overflow:hidden}.mixrow span,.mixrow b{position:relative;z-index:1}.mixrow b{float:right;color:var(--gold)}.mixrow i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(46,230,214,.18),rgba(59,157,255,.08))}
  .hashline{display:flex;justify-content:space-between;gap:12px;align-items:center;border-bottom:1px solid var(--line);padding:8px 0}.hashline:last-child{border-bottom:0}.hashline span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.12em}.hashline code{font-size:11px}
  .roirow{display:grid;grid-template-columns:150px 90px 1fr;gap:12px;align-items:start;border-bottom:1px solid var(--line);padding:10px 0}.roirow:last-child{border-bottom:0}.roirow span{color:var(--muted);font-size:12px}.roirow b{color:var(--gold);font-size:13px}.roirow p{margin:0;color:var(--ink);font-size:13px}
  .signals{display:grid;grid-template-columns:1fr;gap:12px}.signal{background:linear-gradient(180deg,#111a20,var(--panel));border:1px solid var(--line);border-radius:10px;padding:16px}
  .sighead{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:13px;font-weight:700}.sighead b{color:var(--gold);border:1px solid rgba(255,203,69,.35);border-radius:999px;padding:3px 8px;font-size:10px;letter-spacing:.12em}
  .siggrid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:13px 0}.siggrid span{background:#0b1219;border:1px solid var(--line);border-radius:8px;padding:9px}.siggrid em{display:block;color:var(--faint);font-style:normal;font-size:10px;text-transform:uppercase;letter-spacing:.1em}.siggrid strong{display:block;margin-top:4px;font-size:13px}
  .ghbox{border:1px solid var(--line);border-radius:9px;background:#0d1117;padding:12px;margin:14px 0}.ghmeta{display:flex;justify-content:space-between;gap:12px;color:#c9d1d9;font-size:11px;margin-bottom:10px}.ghmeta b{color:#8b949e;font-weight:600}.ghgrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,10px);gap:3px;overflow-x:auto;padding-bottom:2px}.ghcell{width:10px;height:10px;border-radius:2px;background:#161b22;box-shadow:inset 0 0 0 1px rgba(240,246,252,.06);opacity:0;transform:scale(.4);animation:ghfill .34s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 7ms)}.ghcell.blank{visibility:hidden}.ghcell.l0{background:#161b22}.ghcell.l1{background:#0e4429}.ghcell.l2{background:#006d32}.ghcell.l3{background:#26a641}.ghcell.l4{background:#39d353}@keyframes ghfill{to{opacity:1;transform:scale(1)}}@keyframes scanline{from{transform:translateY(-44px)}to{transform:translateY(300px)}}@keyframes sweep{50%,100%{transform:translateX(94%)}}@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .foot{margin-top:28px;color:var(--faint);font-size:12px;display:flex;flex-wrap:wrap;gap:6px 16px}
  .foot code,.card code{color:var(--cyan);background:#0b1219;border:1px solid var(--line);padding:2px 7px;border-radius:5px} .est{font-style:italic}
	  @media(max-width:980px){.lifegrid{grid-template-columns:repeat(2,1fr)}.lifepills{grid-template-columns:repeat(2,1fr)}.signal-cockpit{grid-template-columns:1fr}.siglanes{grid-template-columns:repeat(3,1fr)}.siglane{min-height:260px}.dsp-track,.replay-track{grid-template-columns:repeat(3,1fr)}}
	  @media(max-width:840px){h1{font-size:36px}.v{font-size:24px}.stats,.stats.s3{grid-template-columns:repeat(2,1fr)}.grid2,.opbadge,.lifehead,.dsp-head,.replay-head{grid-template-columns:1fr}.siggrid{grid-template-columns:repeat(2,1fr)}.roirow{grid-template-columns:1fr}.siglanes{grid-template-columns:repeat(2,1fr)}.dsp-track,.replay-track{grid-template-columns:repeat(2,1fr)}}
	  @media(max-width:520px){h1{font-size:30px}.stats,.stats.s3,.lifepills,.lifegrid,.siglanes,.dsp-track,.replay-track{grid-template-columns:1fr}.tbody{padding:20px}.opascii,.lifeascii,.signal-terminal pre,.dsp-head pre,.replay-head pre{font-size:9px}.siglane{min-height:220px}}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.ghcell{opacity:1;transform:none}}
  </style></head><body>
  <div class="wrap"><div class="term">
    <div class="tbar"><span class="dot" style="background:#ff5f56"></span><span class="dot" style="background:#ffbd2e"></span><span class="dot" style="background:#27c93f"></span><span class="p mono">~ ❯ vibetracker profile</span></div>
    <div class="tbody">
      <div class="brand"><h1 class="mono">VIBE&nbsp;USAGE</h1><span class="by mono">by <b>C0VIBE</b> · Better Digital LLC</span></div>
      <p class="who">All-time · <b>${all.byProvider.length} tool(s)</b> · <span class="mono">${esc(range)}</span> · <span class="mono">${all.byDay.length} active days</span></p>
      <div class="stats">
        <div class="stat"><div class="k">Tokens</div><div class="v num">${tok(tokens)}</div><div class="sub">${Math.round(tokens).toLocaleString("en-US")}</div></div>
        <div class="stat cost"><div class="k">Est. spend</div><div class="v num">$${usd0(usd)}</div><div class="sub est">list-price estimate</div></div>
        <div class="stat"><div class="k">Operations</div><div class="v num">${all.totals.count.toLocaleString("en-US")}</div><div class="sub">every generation & message</div></div>
        <div class="stat creative"><div class="k">Tools</div><div class="v num">${all.byProvider.length}</div><div class="sub">${esc(all.byProvider.map((p) => p.key).slice(0, 4).join(" · "))}${all.byProvider.length > 4 ? " …" : ""}</div></div>
      </div>
	      ${operatorBadge(all, tokens, usd)}
	      ${localSignalCockpit(records, all, signals, roiNotes)}
	      ${profileDatastreamPassport(records, all, signals)}
	      ${profileReplayRecorder(records, all, signals)}
	      ${lifeDashboard(records, all, signals, roiNotes)}

      ${trustSignals(signals)}
      ${trustAndIntegrity(records, signals)}
      ${roiSection(roiNotes)}
      ${section("code", "Code AI", "coding agents & LLM APIs", code, "", `nothing here yet — <code>vibetracker sync</code> reads Claude Code automatically`)}
      ${section("creative", "Creative AI", "image · video · music · audio · 3d", creative.totals.count ? creative : null, "creative", `no creative usage tracked yet — connect with <code>vibetracker connect falai</code>, <code>suno</code>, <code>replicate</code>, <code>elevenlabs</code> …`)}
      ${otherStats ? section("other", "Dev & Other", "infra, browsers, everything else", otherStats, "", "") : ""}
      ${leaderboard(all)}

      <div class="foot"><span class="mono">◤◢ BY C0VIBE · BETTER DIGITAL LLC ◥◣</span><span>Live · <code>vibetracker profile</code> regenerates this</span><span class="est">$ = list-price estimate, not billed.</span></div>
    </div>
  </div></div>
  <script>
  (function(){
    var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    function bars(cv){
      var days=JSON.parse(cv.getAttribute("data-days")||"[]"); if(!days.length)return;
      var peak=days.indexOf(Math.max.apply(null,days)), ctx=cv.getContext("2d");
      function draw(prog){var dpr=Math.min(2,devicePixelRatio||1),W=cv.clientWidth,H=150;
        cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
        var base=H-10,top=6,max=Math.max.apply(null,days)||1;
        ctx.strokeStyle="rgba(255,255,255,.05)";for(var g=1;g<=3;g++){var y=top+(base-top)*g/3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        var n=days.length,gap=n>60?1:2,bw=Math.max(.8,(W-gap*(n-1))/n);
        for(var i=0;i<n;i++){var h=(days[i]/max)*(base-top)*prog,x=i*(bw+gap),y=base-h,pk=i===peak;
          var gr=ctx.createLinearGradient(0,base,0,top);
          if(pk){gr.addColorStop(0,"#c98a17");gr.addColorStop(1,"#ffcb45");}else{gr.addColorStop(0,"#2f6a86");gr.addColorStop(.5,"#2ee6d6");gr.addColorStop(1,"#3b9dff");}
          ctx.fillStyle=gr;ctx.fillRect(x,y,bw,h);}}
      anim(draw);
      addEventListener("resize",function(){draw(1);});
    }
    function line(cv){
      var usd=JSON.parse(cv.getAttribute("data-usd")||"[]"); if(!usd.length)return;
      var cum=[];usd.reduce(function(a,b,i){return cum[i]=a+b;},0);
      var ctx=cv.getContext("2d");
      function draw(prog){var dpr=Math.min(2,devicePixelRatio||1),W=cv.clientWidth,H=150;
        cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
        var base=H-10,top=8,max=cum[cum.length-1]||1,n=cum.length;
        ctx.strokeStyle="rgba(255,255,255,.05)";for(var g=1;g<=3;g++){var y=top+(base-top)*g/3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        var upto=Math.max(2,Math.floor(n*prog));
        ctx.beginPath();
        for(var i=0;i<upto;i++){var x=(i/(n-1))*W,y=base-(cum[i]/max)*(base-top);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.strokeStyle="#ffcb45";ctx.lineWidth=2;ctx.stroke();
        ctx.lineTo((upto-1)/(n-1)*W,base);ctx.lineTo(0,base);ctx.closePath();
        var fg=ctx.createLinearGradient(0,top,0,base);fg.addColorStop(0,"rgba(255,203,69,.28)");fg.addColorStop(1,"rgba(255,203,69,.02)");
        ctx.fillStyle=fg;ctx.fill();
        var ex=(upto-1)/(n-1)*W,ey=base-(cum[upto-1]/max)*(base-top);
        ctx.beginPath();ctx.arc(ex,ey,3.5,0,7);ctx.fillStyle="#ffcb45";ctx.fill();}
      anim(draw);
      addEventListener("resize",function(){draw(1);});
    }
    function anim(draw){ if(reduce){draw(1);return;} var s=performance.now();
      (function a(t){var p=Math.min(1,(t-s)/900),e=1-Math.pow(1-p,3);draw(e);if(p<1)requestAnimationFrame(a);})(s); }
    document.querySelectorAll(".daych").forEach(bars);
    document.querySelectorAll(".cumch").forEach(line);
  })();
  </script></body></html>`;
}
