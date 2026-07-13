import type { CompareDelta, CompareRail, ShareComparison, UsageComparison } from "./usage-compare.ts";

function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}~`;
}

function signed(value: number, suffix = ""): string {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}${suffix}`;
}

function delta(value: CompareDelta, currency = false): string {
  const amount = currency ? `${value.amount > 0 ? "+" : value.amount < 0 ? "-" : ""}${money(Math.abs(value.amount))}` : signed(value.amount);
  return `${amount} / ${value.pct === null ? value.state.toUpperCase() : signed(value.pct, "%")}`;
}

function railState(rail: CompareRail): CompareDelta["state"] {
  if (!rail.previous.records && rail.current.records) return "new";
  if (!rail.current.records && rail.previous.records) return "dormant";
  return rail.opsDelta.state;
}

function stateClass(value: CompareDelta["state"]): string {
  return value === "up" || value === "new" ? "rise" : value === "down" || value === "dormant" ? "fall" : "flat";
}

function metricCard(label: string, current: string, previous: string, change: string, tone: string): string {
  return `<article class="metric ${tone}"><span>${esc(label)}</span><strong>${esc(current)}</strong><small>PREV ${esc(previous)}</small><b>${esc(change)}</b></article>`;
}

function railCard(rail: CompareRail): string {
  const state = railState(rail);
  return `<article class="rail"><header><strong>${esc(rail.key)}</strong><span class="${stateClass(state)}">${esc(state.toUpperCase())}</span></header><dl><div><dt>Current ops</dt><dd>${esc(rail.current.ops.toLocaleString("en-US"))}</dd></div><div><dt>Previous ops</dt><dd>${esc(rail.previous.ops.toLocaleString("en-US"))}</dd></div><div><dt>USD estimate shift</dt><dd>${esc(delta(rail.usdDelta, true))}</dd></div></dl></article>`;
}

function proofCard(label: string, value: ShareComparison, tone: string): string {
  return `<article class="proof ${tone}"><span>${esc(label)}</span><strong>${esc(value.current.sharePct.toFixed(1))}%</strong><small>PREV ${esc(value.previous.sharePct.toFixed(1))}%</small><b>${esc(signed(value.sharePointDelta, " pt"))}</b></article>`;
}

function dateLabel(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function renderUsageComparisonHtml(comparison: UsageComparison): string {
  const providerCards = comparison.providers.slice(0, 10).map(railCard).join("") || `<p class="empty">No provider activity in either window.</p>`;
  const categoryCards = comparison.categories.map(railCard).join("") || `<p class="empty">No category activity in either window.</p>`;
  const actions = comparison.actions.map((action) => `<article class="action ${esc(action.level)}"><span>${esc(action.level.toUpperCase())}</span><div><strong>${esc(action.label)}</strong><p>${esc(action.reason)}</p><code>${esc(action.command)}</code></div></article>`).join("");
  const sources = comparison.proof.sources.map((source) => `<li><span>${esc(source.label)}</span><b>${esc(source.current.sharePct.toFixed(1))}%</b><small>${esc(signed(source.sharePointDelta, " pt"))}</small></li>`).join("") || `<li><span>No source records</span><b>0%</b><small>0 pt</small></li>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><title>VibeTRACKER Usage Compare</title>
<style>
:root{color-scheme:dark;--ink:#080a09;--paper:#f4f2e9;--lime:#b9ff42;--cyan:#4ee8ff;--amber:#ffc24b;--red:#ff5d55;--muted:#9ca5a0;--line:#333a36}*{box-sizing:border-box}html,body{margin:0;min-width:0;background:var(--ink);color:var(--paper);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:0}body{font-size:15px;line-height:1.45}main{width:min(100%,1520px);margin:0 auto;padding:28px 32px 56px;overflow:hidden}header.hero{border-top:5px solid var(--lime);border-bottom:1px solid var(--line);padding:24px 0 28px;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.5fr);gap:28px;align-items:end}.eyebrow{margin:0 0 10px;color:var(--lime);font-weight:800}.hero h1{margin:0;font-size:42px;line-height:1.05;overflow-wrap:anywhere}.hero p{max-width:760px;margin:16px 0 0;color:#c9d0cc}.window{border-left:3px solid var(--cyan);padding-left:18px}.window span,.window b{display:block}.window span{color:var(--muted);font-size:12px;text-transform:uppercase}.window b{margin:3px 0 12px;color:var(--cyan);font-size:16px}section{padding:28px 0;border-bottom:1px solid var(--line)}section>header{display:flex;align-items:baseline;justify-content:space-between;gap:18px;margin-bottom:16px}h2{margin:0;font-size:19px;text-transform:uppercase}section>header p{margin:0;color:var(--muted);font-size:12px}.metrics,.proofs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric,.proof,.rail{min-width:0;border:1px solid var(--line);border-radius:2px;padding:16px;background:#101411}.metric>span,.proof>span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase}.metric strong,.proof strong{display:block;margin-top:10px;font-size:27px;overflow-wrap:anywhere}.metric small,.proof small{display:block;color:var(--muted)}.metric b,.proof b{display:block;margin-top:12px;color:var(--cyan);font-size:12px}.metric.hot{border-top:3px solid var(--amber)}.metric.live{border-top:3px solid var(--lime)}.metric.cool{border-top:3px solid var(--cyan)}.metric.signal{border-top:3px solid var(--red)}.proof.good{border-top:3px solid var(--lime)}.proof.warn{border-top:3px solid var(--amber)}.rail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.rail header{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding-bottom:10px}.rail header strong{overflow-wrap:anywhere}.rail header span{font-size:11px}.rise{color:var(--amber)}.fall{color:var(--cyan)}.flat{color:var(--muted)}dl{margin:12px 0 0}dl div{display:flex;justify-content:space-between;gap:12px;padding:4px 0}dt{color:var(--muted);font-size:12px}dd{margin:0;text-align:right;font-weight:800;overflow-wrap:anywhere}.source-list{list-style:none;margin:18px 0 0;padding:0;border-top:1px solid var(--line)}.source-list li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:18px;padding:10px 0;border-bottom:1px solid var(--line)}.source-list small{color:var(--muted)}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.action{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;padding:16px;border:1px solid var(--line);border-radius:2px}.action>span{font-size:11px;font-weight:900}.action.urgent>span{color:var(--red)}.action.review>span{color:var(--amber)}.action.clear>span{color:var(--lime)}.action strong,.action p,.action code{display:block;overflow-wrap:anywhere}.action p{margin:5px 0;color:#c9d0cc}.action code{color:var(--cyan);white-space:normal}.empty{color:var(--muted)}footer{padding-top:24px;color:var(--muted);font-size:12px}footer strong{color:var(--lime)}
@media(max-width:900px){.metrics,.proofs{grid-template-columns:repeat(2,minmax(0,1fr))}.rail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){main{padding:18px 16px 40px}header.hero{grid-template-columns:1fr;padding-top:18px}.hero h1{font-size:32px}.window{border-left:0;border-top:3px solid var(--cyan);padding:14px 0 0}.metrics,.proofs,.rail-grid,.actions{grid-template-columns:1fr}section>header{display:block}section>header p{margin-top:5px}.source-list li{grid-template-columns:minmax(0,1fr) auto;gap:8px}.source-list small{grid-column:1/-1}.action{grid-template-columns:60px minmax(0,1fr)}}
@media(min-width:2200px){main{width:min(100%,2200px);padding:54px 64px 80px}.hero{grid-template-columns:minmax(0,1.8fr) minmax(360px,.5fr)}.metrics,.proofs{grid-template-columns:repeat(4,minmax(0,1fr))}.rail-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style></head><body><main>
<header class="hero"><div><p class="eyebrow">VTK://USAGE-COMPARE//LOCAL-LEDGER</p><h1>Current signal.<br>Previous context.</h1><p>A read-only comparison of normalized local usage. USD is estimate-only; native units and source proof stay visible.</p></div><div class="window"><span>Current / inclusive</span><b>${esc(dateLabel(comparison.currentRange.from))} - ${esc(dateLabel(comparison.currentRange.to))}</b><span>Previous / preceding</span><b>${esc(dateLabel(comparison.previousRange.from))} - ${esc(dateLabel(comparison.previousRange.to))}</b><span>Window</span><b>${esc(comparison.windowDays)} days</b></div></header>
<section><header><h2>Delta board</h2><p>CURRENT / PREVIOUS / CHANGE</p></header><div class="metrics">${metricCard("USD estimate", money(comparison.current.usdEst), money(comparison.previous.usdEst), delta(comparison.delta.usdEst, true), "hot")}${metricCard("Operations", comparison.current.ops.toLocaleString("en-US"), comparison.previous.ops.toLocaleString("en-US"), delta(comparison.delta.ops), "live")}${metricCard("Records", comparison.current.records.toLocaleString("en-US"), comparison.previous.records.toLocaleString("en-US"), delta(comparison.delta.records), "cool")}${metricCard("Credits", comparison.current.credits.toLocaleString("en-US"), comparison.previous.credits.toLocaleString("en-US"), delta(comparison.delta.credits), "signal")}</div></section>
<section><header><h2>Provider shifts</h2><p>${esc(comparison.newProviders.length)} NEW / ${esc(comparison.dormantProviders.length)} DORMANT</p></header><div class="rail-grid">${providerCards}</div></section>
<section><header><h2>Category shifts</h2><p>NATIVE ACTIVITY MIX</p></header><div class="rail-grid">${categoryCards}</div></section>
<section><header><h2>Proof movement</h2><p>RECORD SHARE / POINT CHANGE</p></header><div class="proofs">${proofCard("Verified", comparison.proof.verified, "good")}${proofCard("High confidence", comparison.proof.highConfidence, "good")}${proofCard("Low proof", comparison.proof.lowProof, "warn")}</div><ul class="source-list">${sources}</ul></section>
<section><header><h2>Review queue</h2><p>COMMANDS ARE SUGGESTIONS; NOTHING AUTO-RUNS</p></header><div class="actions">${actions}</div></section>
<footer><strong>USAGE READ ONLY</strong> · WRITES 0 · UPLOADS 0 · TRUST SEPARATE, NOT USAGE<br>${esc(comparison.privacy.estimateNotice)}<br>Excludes ${esc(comparison.privacy.excludes.join(", "))}.</footer>
</main></body></html>`;
}
