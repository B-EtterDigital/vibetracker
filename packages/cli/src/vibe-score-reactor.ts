import type { ProfileView } from "../../web/src/lib/data.ts";
import { buildProfileDatastreamReceipt } from "../../web/src/lib/profile-datastream.ts";
import {
  buildVibeScoreCalibrationChamber,
  buildVibeScoreMixerConsole,
  buildVibeScoreReceipt,
  buildVibeScoreReactor,
} from "../../web/src/lib/vibe-score.ts";

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function demoProfile(now = new Date()): ProfileView {
  const iso = now.toISOString();
  return {
    handle: "demo-viber",
    created_at: "2026-07-01T00:00:00.000Z",
    isPremium: true,
    latest: {
      total_usd: 42.5,
      total_credits: 880,
      record_count: 1200,
      created_at: iso,
      tier: "attested",
    },
    providers: [
      { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
      { provider: "codex-cli", ops: 900, credits: 300, usd: 8 },
      { provider: "ollama", ops: 276, credits: 80, usd: 2.5 },
    ],
    usageDays: [
      { date: "2026-07-03", ops: 200, credits: 180, usd: 12.5 },
      { date: "2026-07-04", ops: 500, credits: 300, usd: 18 },
      { date: "2026-07-05", ops: 500, credits: 400, usd: 12 },
    ],
    trustSignals: [
      {
        kind: "github_activity",
        source: "github_cli",
        label: "GitHub activity evidence (not AI usage)",
        handle: "demo-viber",
        fetchedAt: iso,
        from: "2026-07-01T00:00:00.000Z",
        to: iso,
        windowDays: 7,
        totalContributions: 33,
        commitContributions: 20,
        issueContributions: 1,
        pullRequestContributions: 7,
        pullRequestReviewContributions: 5,
        repositoryContributions: 0,
        days: [],
        confidence: "activity_evidence",
        affectsTotals: false,
        usageVerified: false,
        note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
      },
    ],
  };
}

function toneClass(tone: string): string {
  return `tone-${tone.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "usage"}`;
}

function pct(points: number, max: number): number {
  return max > 0 ? Math.max(0, Math.min(100, Math.round((points / max) * 100))) : 0;
}

export function renderVibeScoreReactorHtml(profile: ProfileView = demoProfile()): string {
  const receipt = buildVibeScoreReceipt(profile);
  const reactor = buildVibeScoreReactor(profile, receipt);
  const mixer = buildVibeScoreMixerConsole(profile, receipt, reactor);
  const calibration = buildVibeScoreCalibrationChamber(profile, receipt, reactor);
  const datastream = buildProfileDatastreamReceipt(profile, receipt);

  const factors = receipt.factors.map((factor, index) => `<article class="factor ${toneClass(factor.tone)}" data-impact="${esc(factor.impact)}" style="--i:${index};--meter:${pct(factor.points, factor.max)}%">
      <span>${esc(factor.impact === "not_usage" ? "NOT USAGE" : "SCORE")}</span>
      <b>${esc(factor.label)}</b>
      <strong>${esc(factor.value)}</strong>
      <p>${esc(factor.note)}</p>
      <em><i></i></em>
      <code>${factor.impact === "not_usage" ? "+0 score" : `+${factor.points}/${factor.max}`}</code>
    </article>`).join("");
  const rails = reactor.rails.map((rail, index) => `<article class="rail ${toneClass(rail.tone)}" data-impact="${esc(rail.impact)}" style="--i:${index};--meter:${rail.meter}%">
      <div class="rail-screen"><pre>${esc(rail.signal)}</pre></div>
      <span>${esc(rail.impact === "not_usage" ? "NOT USAGE" : "SCORE")}</span>
      <b>${esc(rail.label)}</b>
      <code>${esc(rail.code)}</code>
      <p>${esc(rail.note)}</p>
      <small>${esc(rail.guardrail)}</small>
    </article>`).join("");
  const lanes = datastream.lanes.map((lane, index) => `<article class="stream-lane" data-impact="${esc(lane.impact)}" style="--i:${index};--from:${esc(lane.from)};--to:${esc(lane.to)};--ink:${esc(lane.ink)};--meter:${lane.meter}%">
      <i>${esc(lane.mark)}</i>
      <span>${esc(lane.impact === "not_usage" ? "NOT USAGE" : lane.impact.toUpperCase())}</span>
      <b>${esc(lane.label)}</b>
      <code>${esc(lane.route)}</code>
      <p>${esc(lane.note)}</p>
      <small>${esc(lane.guardrail)}</small>
    </article>`).join("");
  const mixerLanes = mixer.lanes.map((lane, index) => `<article class="mixer-lane ${toneClass(lane.tone)}" data-status="${esc(lane.status)}" style="--i:${index};--meter:${lane.meter}%">
      <span>${esc(lane.statusLabel)}</span>
      <b>${esc(lane.label)}</b>
      <code>${esc(lane.route)}</code>
      <p>${esc(lane.contribution)} // ${esc(lane.note)}</p>
      <em><i></i></em>
    </article>`).join("");
  const steps = calibration.steps.map((step, index) => `<article class="cal-step ${toneClass(step.tone)}" data-impact="${esc(step.impact)}" style="--i:${index};--meter:${step.meter}%">
      <span>${esc(step.call)} ${esc(step.statusLabel)}</span>
      <b>${esc(step.label)}</b>
      <code>${esc(step.formula)}</code>
      <pre>${esc(step.frames.join("\n"))}</pre>
      <p>${esc(step.guardrail)}</p>
    </article>`).join("");
  const outputs = mixer.outputs.map((output, index) => `<span style="--i:${index}"><b>${esc(output.label)}</b>${esc(output.route)}</span>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Vibe Score Reactor</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 13% 18%,rgba(46,232,214,.16),transparent 27%),radial-gradient(circle at 86% 8%,rgba(255,79,216,.13),transparent 25%),radial-gradient(circle at 48% 100%,rgba(54,227,155,.11),transparent 30%);mix-blend-mode:screen}
  main{width:min(1280px,calc(100vw - 28px));margin:0 auto;padding:24px 0 46px}.hero,.score-card,.terminal,.factor,.rail,.stream,.stream-lane,.mixer,.mixer-lane,.calibration,.cal-step,.output-strip span{position:relative;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 42px 124px -94px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.hero,.stream,.mixer,.calibration{border-radius:14px}.hero{display:grid;grid-template-columns:minmax(290px,.7fr) minmax(0,1.3fr);gap:1px;background:rgba(255,255,255,.07)}.score-card,.terminal{min-height:540px;background:#050708}.score-card{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 28% 20%,rgba(46,232,214,.16),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#050708)}.eyebrow,.terminal-top span,.section-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.score-card h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(38px,6.5vw,86px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.25);overflow-wrap:anywhere}.score-card p,.section-head p,.factor p,.rail p,.stream-lane p,.mixer-lane p,.cal-step p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.score-ring{position:relative;display:grid;place-items:center;width:min(310px,72vw);aspect-ratio:1;margin:auto;border:1px solid rgba(46,232,214,.28);border-radius:999px;background:conic-gradient(var(--green) var(--score-pct),rgba(255,255,255,.08) 0),radial-gradient(circle,#06100f 0 58%,transparent 59%);box-shadow:0 0 70px -38px var(--green);animation:pulse 4.8s var(--motion) infinite}.score-ring::before{content:"";position:absolute;inset:13%;border:1px dashed rgba(255,198,77,.24);border-radius:inherit;animation:turn 18s linear infinite}.score-ring b{position:relative;font:1000 62px/.9 ui-monospace,SFMono-Regular,Menlo,monospace}.score-ring span{position:relative;color:var(--gold);font-size:11px;font-weight:950;text-transform:uppercase}.score-seals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.score-seals span{border:1px solid rgba(54,227,155,.18);background:rgba(0,0,0,.24);padding:8px;color:#bff8e5;font-size:10px;font-weight:950;text-transform:uppercase}.terminal{position:relative;padding:12px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.terminal::after,.rail-screen::before{content:"";position:absolute;left:12px;right:12px;top:68px;height:32px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.18),rgba(54,227,155,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.terminal-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.terminal pre{min-height:428px}.output-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.output-strip span{min-height:70px;padding:9px;animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 60ms)}.output-strip b{display:block;color:var(--gold);font-size:10px;text-transform:uppercase}
  .factors,.rails-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;margin-top:14px;background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:14px;overflow:hidden}.factor,.rail{min-height:230px;padding:12px;box-shadow:none;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.factor::after,.mixer-lane::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold));transform:scaleX(var(--meter));transform-origin:left;animation:bar .9s var(--motion) forwards}.tone-trust{background:repeating-linear-gradient(-45deg,rgba(255,198,77,.08) 0 1px,transparent 1px 9px),linear-gradient(180deg,rgba(255,79,216,.1),rgba(4,7,9,.98))}.tone-usage{--tone:var(--pink)}.tone-rhythm{--tone:var(--green)}.tone-coverage{--tone:var(--cyan)}.tone-freshness{--tone:var(--gold)}.tone-publish{--tone:var(--violet)}.factor span,.rail span,.mixer-lane span,.cal-step span{color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.factor b,.rail b,.stream-lane b,.mixer-lane b,.cal-step b{display:block;margin-top:8px;color:#f8fff9;font-size:15px;text-transform:uppercase;overflow-wrap:anywhere}.factor strong{display:block;margin-top:8px;color:var(--green);font-size:22px}.factor code,.rail code,.stream-lane code,.mixer-lane code,.cal-step code{display:block;margin-top:8px;color:#dffef6;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.22);padding:7px;overflow-wrap:anywhere}.factor em,.mixer-lane em{display:block;margin-top:10px;height:8px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:#020506;overflow:hidden}.factor em i,.mixer-lane em i{display:block;width:var(--meter);height:100%;background:linear-gradient(90deg,var(--cyan),var(--green));animation:meter .9s var(--motion) both}.rail-screen{position:relative;min-height:94px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.28);overflow:hidden}.rail-screen::before{left:0;right:0;top:auto;bottom:0}.rail-screen pre{display:grid;place-items:center;min-height:94px;border:0;background:transparent;text-align:center;font-size:13px;line-height:1.05}.rail small,.stream-lane small{display:block;margin-top:8px;color:#bff8e5}
  .stream,.mixer,.calibration{display:grid;grid-template-columns:minmax(280px,.66fr) minmax(0,1.34fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.section-head{display:grid;align-content:space-between;gap:14px;min-height:360px;padding:16px;background:linear-gradient(150deg,rgba(46,232,214,.1),rgba(4,10,12,.86))}.section-head b{display:block;color:#f8fff9;font:950 30px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.stream-grid,.mixer-grid,.cal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#040708}.stream-lane,.mixer-lane,.cal-step{min-height:216px;padding:12px;border-width:1px 0 0 1px;box-shadow:none;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.stream-lane::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform:scaleX(var(--meter));transform-origin:left}.stream-lane i{display:grid;place-items:center;width:38px;height:32px;color:var(--ink);background:linear-gradient(135deg,var(--from),var(--to));font-style:normal;font-weight:1000}.stream-lane[data-impact="not_usage"]{background:repeating-linear-gradient(-45deg,rgba(255,198,77,.08) 0 1px,transparent 1px 9px),linear-gradient(180deg,rgba(255,79,216,.1),rgba(4,7,9,.98))}.cal-step pre{min-height:92px;margin-top:8px}.cal-step[data-impact="not_usage"]{background:repeating-linear-gradient(-45deg,rgba(255,198,77,.08) 0 1px,transparent 1px 9px),linear-gradient(180deg,rgba(255,79,216,.1),rgba(4,7,9,.98))}.cal-step[data-impact="publish"]{background:linear-gradient(180deg,rgba(159,124,255,.1),rgba(4,7,9,.98))}
  .guardrails{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}.guardrails span{border:1px solid rgba(255,255,255,.11);background:rgba(0,0,0,.24);padding:10px;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(300px)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes meter{from{transform:scaleX(0);transform-origin:left}to{transform:none}}@keyframes bar{from{opacity:.2}to{opacity:1}}@keyframes pulse{0%,100%{filter:saturate(1)}50%{filter:saturate(1.35)}}@keyframes turn{to{transform:rotate(360deg)}}@media(max-width:1120px){.hero,.stream,.mixer,.calibration{grid-template-columns:1fr}.factors,.rails-grid,.stream-grid,.mixer-grid,.cal-grid,.guardrails{grid-template-columns:repeat(2,minmax(0,1fr))}.score-card,.terminal{min-height:360px}}@media(max-width:620px){main{width:min(100vw - 18px,1280px);padding-top:12px}.score-card h1{font-size:40px}.score-seals,.output-strip,.factors,.rails-grid,.stream-grid,.mixer-grid,.cal-grid,.guardrails{grid-template-columns:1fr}.terminal pre{font-size:8px}.score-ring{width:min(260px,74vw)}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.terminal::after,.rail-screen::before{display:none}.factor em i,.mixer-lane em i{transform:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER Vibe Score Reactor">
  <section class="hero">
    <div class="score-card" style="--score-pct:${receipt.score}%">
      <div>
        <div class="eyebrow">VTK://VIBE-SCORE-REACTOR//DATASTREAM//TRUST-QUARANTINE</div>
        <h1>Vibe<br>Score<br>Reactor</h1>
        <p>${esc(receipt.subline)}</p>
      </div>
      <div class="score-ring" aria-label="${receipt.score} out of 100 Vibe Score"><b>${receipt.score}</b><span>${esc(receipt.tier)} tier</span></div>
      <div class="score-seals">
        <span>score source: reviewed usage</span>
        <span>trust delta: +0 score</span>
        <span>usage writes: 0 in preview</span>
        <span>public writes: 0 in preview</span>
      </div>
    </div>
    <aside class="terminal" aria-label="Vibe score reactor terminal">
      <div class="terminal-top"><span>score@reactor</span><b>Vibers Unite</b></div>
      <pre>${esc([
        ...receipt.terminalLines,
        "",
        ...reactor.terminalLines,
        "",
        ...datastream.terminalLines,
      ].join("\n"))}</pre>
      <div class="output-strip" aria-label="Score output surfaces">${outputs}</div>
    </aside>
  </section>
  <section class="factors" aria-label="Vibe score factors">${factors}</section>
  <section class="rails-grid" aria-label="Vibe score oscilloscope rails">${rails}</section>
  <section class="stream" aria-label="Profile datastream lineage">
    <div class="section-head">
      <span>VTK://PROFILE-DATASTREAM//SOURCE-TO-SCORE//C0VIBE.APP</span>
      <b>Datastream<br>Lineage</b>
      <p>${esc(datastream.subline)}</p>
      <pre>seal ${esc(datastream.seal)}
records ${datastream.totals.records}
providers ${datastream.totals.providers}
activeDays ${datastream.totals.activeDays}
trustSignals ${datastream.totals.trustSignals}
score ${datastream.totals.score}/100</pre>
    </div>
    <div class="stream-grid">${lanes}</div>
  </section>
  <section class="mixer" aria-label="Score mixer console">
    <div class="section-head">
      <span>VTK://SCORE-MIXER//SAME-RECEIPT//NO-FAKE-SPEND</span>
      <b>Score<br>Mixer</b>
      <p>${esc(mixer.subline)}</p>
      <pre>${esc(mixer.terminalLines.join("\n"))}</pre>
    </div>
    <div class="mixer-grid">${mixerLanes}</div>
  </section>
  <section class="calibration" aria-label="Score calibration chamber">
    <div class="section-head">
      <span>VTK://SCORE-CALIBRATION//FORMULA-CHAMBER//NOT-USAGE</span>
      <b>Calibration<br>Chamber</b>
      <p>${esc(calibration.subline)}</p>
      <pre>steps ${calibration.totals.steps}
scoreSteps ${calibration.totals.scoreSteps}
notUsage ${calibration.totals.notUsage}
trustDelta ${calibration.totals.trustDelta}
usageWrites ${calibration.totals.usageWrites}
publicWrites ${calibration.totals.publicWrites}</pre>
    </div>
    <div class="cal-grid">${steps}</div>
  </section>
  <section class="guardrails" aria-label="Vibe score guardrails">
    ${[...reactor.guardrails, ...datastream.guardrails, ...mixer.invariants].slice(0, 8).map((guardrail) => `<span>${esc(guardrail)}</span>`).join("")}
  </section>
  <footer><span class="accent">Static, script-free, offline:</span> demo aggregate receipt only. No provider calls, no usage writes, no uploads, no secret reads.</footer>
</main>
</body>
</html>`;
}
