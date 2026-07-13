import type { MissionAction, MissionControl, MissionProofRail, MissionRail } from "./mission-control.ts";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function percent(value: number): string {
  return value > 0 && value < 0.1 ? "&lt;0.1" : value.toFixed(1);
}

function rails(rows: MissionRail[], empty: string): string {
  if (!rows.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  return rows.map((row) => `
    <div class="rail-row">
      <div class="rail-copy"><strong>${escapeHtml(row.key)}</strong><span>${compact(row.ops)} ops · ${money(row.usdEst)} est.</span></div>
      <div class="track" aria-label="${escapeHtml(row.key)} ${row.sharePct}% of operations"><i style="width:${Math.max(row.sharePct > 0 ? 0.6 : 0, Math.min(100, row.sharePct))}%"></i></div>
      <b>${percent(row.sharePct)}%</b>
    </div>`).join("");
}

function proofRows(rows: MissionProofRail[]): string {
  if (!rows.length) return `<p class="empty">No proof records yet.</p>`;
  return rows.map((row) => `
    <tr><th scope="row">${escapeHtml(row.label)}</th><td>${row.records.toLocaleString("en-US")}</td><td>${row.sharePct.toFixed(1)}%</td></tr>`).join("");
}

function actions(rows: MissionAction[]): string {
  return rows.map((action, index) => `
    <article class="action action-${action.level}">
      <span class="step">${String(index + 1).padStart(2, "0")}</span>
      <div><p class="action-level">${escapeHtml(action.level)}</p><h3>${escapeHtml(action.label)}</h3><p>${escapeHtml(action.reason)}</p><code>${escapeHtml(action.command)}</code></div>
    </article>`).join("");
}

function budgetCopy(mission: MissionControl): string {
  if (mission.forecast.budgetUsd == null) return "Budget unset";
  return `${mission.forecast.budgetStatus.toUpperCase()} · ${money(mission.forecast.projected30dUsdEst)} / ${money(mission.forecast.budgetUsd)}`;
}

export function renderMissionHtml(mission: MissionControl): string {
  const latest = mission.latest.length
    ? mission.latest.map((record) => `
      <tr>
        <td><time datetime="${escapeHtml(record.ts)}">${escapeHtml(record.ts.slice(0, 16).replace("T", " "))}</time></td>
        <td>${escapeHtml(record.provider)}</td><td>${escapeHtml(record.category)}</td><td>${escapeHtml(record.operation)}</td>
        <td>${escapeHtml(`${record.quantity} ${record.unit}`)}</td><td>${escapeHtml(record.source)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="empty">No recent activity.</td></tr>`;
  const trust = mission.trust.signals.length
    ? mission.trust.signals.map((signal) => `<li><strong>${escapeHtml(signal.kind)}</strong><span>${escapeHtml(signal.detail)}</span><b>NOT USAGE</b></li>`).join("")
    : `<li><strong>No trust context discovered</strong><span>This lane remains separate.</span><b>NOT USAGE</b></li>`;
  const range = mission.range.from && mission.range.to
    ? `${mission.range.from.slice(0, 10)} to ${mission.range.to.slice(0, 10)}`
    : "No ledger range yet";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
  <title>VibeTRACKER Mission Control</title>
  <style>
    :root{color-scheme:dark;--bg:#080a0b;--panel:#111517;--line:#30383b;--ink:#f2f0e8;--muted:#99a3a7;--lime:#b9ff66;--cyan:#55d8ff;--amber:#ffcc66;--red:#ff6b6b;--paper:#d9dedf}
    *{box-sizing:border-box}html{background:var(--bg)}body{margin:0;overflow-x:hidden;background:var(--bg);color:var(--ink);font:15px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0}
    body:before{content:"";display:block;height:4px;background:var(--lime);border-right:34vw solid var(--cyan);border-left:34vw solid var(--amber)}
    .shell{width:min(100% - 40px,1800px);margin:0 auto;padding:44px 0 64px}.eyebrow,.section-id,.action-level{text-transform:uppercase;font-size:11px;font-weight:800;letter-spacing:0;color:var(--lime)}
    header{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:36px;align-items:end;border-bottom:1px solid var(--line);padding-bottom:30px}header>*{min-width:0}
    h1{font-size:76px;line-height:.92;margin:10px 0 18px;letter-spacing:0;max-width:900px}h1 span{color:var(--lime)}
    header p{max-width:780px;color:var(--paper);font-size:17px;margin:0}.stamp{border-left:3px solid var(--cyan);padding:12px 0 12px 18px;display:grid;gap:8px;color:var(--muted)}.stamp b{color:var(--ink);overflow-wrap:anywhere}
    .status-line{display:flex;flex-wrap:wrap;gap:18px;margin-top:28px;color:var(--muted);font-size:12px}.status-line b{color:var(--lime)}
    .kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border:1px solid var(--line);margin:28px 0}.kpi{min-height:126px;padding:18px;border-right:1px solid var(--line);background:var(--panel)}.kpi:last-child{border-right:0}.kpi span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase}.kpi strong{display:block;font-size:26px;line-height:1.05;margin:16px 0 8px}.kpi small{color:var(--muted)}
    .band{border-top:1px solid var(--line);padding:34px 0;margin-top:18px}.band-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.band h2{font-size:24px;margin:3px 0 0}.band-head>p{color:var(--muted);margin:0;text-align:right}
    .split{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:32px}.panel{border:1px solid var(--line);background:var(--panel);padding:22px;border-radius:2px}.panel h3{font-size:14px;text-transform:uppercase;margin:0 0 18px;color:var(--cyan)}
    .rail-row{display:grid;grid-template-columns:minmax(180px,1fr) minmax(100px,2fr) 64px;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid #232a2d}.rail-row:last-child{border-bottom:0}.rail-copy{display:flex;justify-content:space-between;gap:12px}.rail-copy span{color:var(--muted);font-size:12px}.track{height:9px;background:#252b2d}.track i{display:block;height:100%;background:var(--lime)}.rail-row b{text-align:right;color:var(--paper)}
    table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #252b2d}th{color:var(--paper);font-weight:600}td{color:var(--muted)}.table-wrap{overflow-x:auto}.proof-total{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:18px}.proof-total div{background:var(--bg);padding:15px}.proof-total strong{display:block;font-size:25px}.proof-total span{color:var(--muted);font-size:11px}
    .burn{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.burn div{border-left:3px solid var(--amber);padding:8px 14px}.burn span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase}.burn strong{font-size:21px}.budget-${mission.forecast.budgetStatus}{color:${mission.forecast.budgetStatus === "over" ? "var(--red)" : mission.forecast.budgetStatus === "near" ? "var(--amber)" : "var(--lime)"}}
    .actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.action{border:1px solid var(--line);display:grid;grid-template-columns:58px 1fr;gap:18px;padding:20px;background:var(--panel);border-radius:2px}.action-urgent{border-color:var(--red)}.action-review{border-color:var(--amber)}.step{font-size:24px;color:var(--muted)}.action h3{margin:2px 0 6px;font-size:17px}.action p{margin:0 0 12px;color:var(--muted)}.action code{display:inline-block;color:var(--cyan);overflow-wrap:anywhere}
    .trust{border:1px solid var(--amber);padding:22px;background:#17150e}.trust header{display:flex;justify-content:space-between;align-items:center;border:0;padding:0 0 16px}.trust h2{font-size:20px;margin:0}.trust header b{color:var(--amber)}.trust ul{list-style:none;padding:0;margin:0}.trust li{display:grid;grid-template-columns:minmax(160px,.6fr) minmax(220px,1fr) auto;gap:16px;padding:12px 0;border-top:1px solid #4a4025}.trust li span{color:var(--paper)}.trust li b{color:var(--amber);font-size:11px}
    .privacy{display:grid;grid-template-columns:1fr 1fr;gap:30px;border-top:1px solid var(--line);margin-top:34px;padding-top:28px}.privacy h2{font-size:20px;margin:0 0 8px}.privacy p{color:var(--muted);margin:0}.privacy code{color:var(--lime)}.empty{color:var(--muted)}footer{display:flex;justify-content:space-between;gap:20px;margin-top:44px;color:var(--muted);font-size:12px}footer b{color:var(--ink)}
    @media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}.kpi:nth-child(3){border-right:0}.kpi:nth-child(-n+3){border-bottom:1px solid var(--line)}.split{grid-template-columns:1fr}.actions{grid-template-columns:1fr}}
    @media(max-width:720px){.shell{width:min(100% - 24px,1800px);padding-top:28px}.eyebrow{overflow-wrap:anywhere}header{grid-template-columns:minmax(0,1fr);gap:24px}h1{font-size:43px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{min-width:0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.kpi strong{font-size:20px}.kpi:nth-child(odd){border-right:1px solid var(--line)}.kpi:nth-child(even){border-right:0}.kpi:nth-last-child(-n+2){border-bottom:0}.band-head{display:block}.band-head>p{text-align:left;margin-top:8px}.rail-row{grid-template-columns:minmax(0,1fr) 52px}.track{grid-column:1/3}.rail-copy{display:block;min-width:0}.rail-copy strong,.rail-copy span{display:block;overflow-wrap:anywhere}.burn,.proof-total{grid-template-columns:1fr}.trust li{grid-template-columns:minmax(0,1fr);gap:4px}.privacy{grid-template-columns:minmax(0,1fr)}.action{grid-template-columns:42px minmax(0,1fr);padding:16px}footer{display:block}footer span{display:block;margin-top:6px}}
    @media(min-width:2200px){body{font-size:17px}.shell{width:min(100% - 96px,2400px);padding-top:72px}.panel{padding:28px}.kpi{min-height:150px}.kpi strong{font-size:34px}h1{font-size:88px}.rail-row{grid-template-columns:minmax(180px,1fr) minmax(100px,2fr) 70px}}
    @media print{body{background:#fff;color:#111}.panel,.kpi,.action{background:#fff}.shell{width:96%}}
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div><p class="eyebrow">VTK://MISSION-CONTROL//LOCAL-LEDGER</p><h1>Mission<br><span>Control</span></h1><p>A read-only operating picture built from normalized usage records. Costs are estimates. Trust context is quarantined from every usage, spend, and proof total.</p></div>
      <div class="stamp"><span>Generated <b>${escapeHtml(mission.generatedAt)}</b></span><span>Ledger range <b>${escapeHtml(range)}</b></span><span>Integrity <b>${escapeHtml(mission.proof.chainHead.slice(0, 20))}...</b></span></div>
    </header>
    <div class="status-line"><span><b>READ ONLY</b> usage ledger</span><span><b>0</b> usage writes</span><span><b>0</b> uploads</span><span><b>${mission.trust.count}</b> separate trust signals</span></div>

    <section class="kpis" aria-label="Usage overview">
      <div class="kpi"><span>Total operations</span><strong>${compact(mission.overview.ops)}</strong><small>${mission.overview.records.toLocaleString("en-US")} normalized records</small></div>
      <div class="kpi"><span>Providers</span><strong>${mission.overview.providers}</strong><small>${mission.overview.categories} categories</small></div>
      <div class="kpi"><span>All-time spend</span><strong>${money(mission.overview.usdEst)}~</strong><small>estimated, never source truth</small></div>
      <div class="kpi"><span>Last 7 days</span><strong>${compact(mission.windows.last7d.ops)}</strong><small>${money(mission.windows.last7d.usdEst)} estimated</small></div>
      <div class="kpi"><span>Last 30 days</span><strong>${compact(mission.windows.last30d.ops)}</strong><small>${money(mission.windows.last30d.usdEst)} estimated</small></div>
      <div class="kpi"><span>Verified records</span><strong>${mission.proof.verifiedSharePct.toFixed(1)}%</strong><small>${mission.proof.verifiedRecords.toLocaleString("en-US")} provider-verified</small></div>
    </section>

    <section class="band">
      <div class="band-head"><div><p class="section-id">01 / Usage topology</p><h2>Where the operations live</h2></div><p>Share uses operation quantity, not record count.</p></div>
      <div class="split"><div class="panel"><h3>Provider rail</h3>${rails(mission.providers, "Connect a real source to populate the provider rail.")}</div><div class="panel"><h3>Category rail</h3>${rails(mission.categories, "No category usage yet.")}</div></div>
    </section>

    <section class="band">
      <div class="band-head"><div><p class="section-id">02 / Burn + runway</p><h2>Seven-day operating rate</h2></div><p>Projection = last 7 days / 7 × 30.</p></div>
      <div class="panel burn"><div><span>Daily average</span><strong>${money(mission.forecast.dailyAvgUsdEst)}~</strong></div><div><span>Projected 30d</span><strong>${money(mission.forecast.projected30dUsdEst)}~</strong></div><div><span>Budget gate</span><strong class="budget-${mission.forecast.budgetStatus}">${escapeHtml(budgetCopy(mission))}</strong></div></div>
    </section>

    <section class="band">
      <div class="band-head"><div><p class="section-id">03 / Evidence quality</p><h2>Proof is visible, not implied</h2></div><p>Fresh ≤7d · warm ≤30d · stale &gt;30d.</p></div>
      <div class="split">
        <div class="panel"><h3>Source distribution</h3><div class="proof-total"><div><strong>${mission.proof.freshness.fresh}</strong><span>fresh providers</span></div><div><strong>${mission.proof.freshness.warm}</strong><span>warm providers</span></div><div><strong>${mission.proof.freshness.stale}</strong><span>stale providers</span></div></div><table><thead><tr><th>Source</th><th>Records</th><th>Share</th></tr></thead><tbody>${proofRows(mission.proof.sources)}</tbody></table></div>
        <div class="panel"><h3>Confidence distribution</h3><table><thead><tr><th>Confidence</th><th>Records</th><th>Share</th></tr></thead><tbody>${proofRows(mission.proof.confidence)}</tbody></table><p class="empty">Stale: ${escapeHtml(mission.proof.staleProviders.join(", ") || "none")}</p></div>
      </div>
    </section>

    <section class="band">
      <div class="band-head"><div><p class="section-id">04 / Latest activity</p><h2>Recent normalized events</h2></div><p>No prompts, outputs, secrets, media, or credential values.</p></div>
      <div class="panel table-wrap"><table><thead><tr><th>UTC</th><th>Provider</th><th>Category</th><th>Operation</th><th>Quantity</th><th>Source</th></tr></thead><tbody>${latest}</tbody></table></div>
    </section>

    <section class="band">
      <div class="band-head"><div><p class="section-id">05 / Operator queue</p><h2>Next moves from current evidence</h2></div><p>Commands are shown only. Nothing auto-runs.</p></div>
      <div class="actions">${actions(mission.actions)}</div>
    </section>

    <aside class="trust"><header><h2>Trust context side rail</h2><b>SEPARATE · NOT USAGE</b></header><ul>${trust}</ul></aside>
    <section class="privacy"><div><p class="section-id">Local AI</p><h2>${compact(mission.localAi.ops)} operations across ${mission.localAi.providers.length} provider(s)</h2><p>Hosted-equivalent estimate: <code>${money(mission.localAi.hostedEquivalentUsdEst)}~</code>. Providers: ${escapeHtml(mission.localAi.providers.join(", ") || "none detected in ledger")}.</p></div><div><p class="section-id">Privacy boundary</p><h2>Usage read only · writes 0 · uploads 0</h2><p>Excluded: ${escapeHtml(mission.privacy.excludes.join(", "))}. ${escapeHtml(mission.privacy.trustDiscovery)}</p></div></section>
    <footer><b>VibeTRACKER · Vibers Unite · c0vibe.app</b><span>${escapeHtml(mission.schema)} · static script-free report</span></footer>
  </main>
</body>
</html>`;
}
