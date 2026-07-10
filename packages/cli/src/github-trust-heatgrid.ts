import type { GitHubActivityTrustSignal, GitHubContributionDay } from "../../core/src/schema/trust-signal.ts";

export const GITHUB_TRUST_LEVEL_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"] as const;

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

const DAY_MS = 86_400_000;

function addDays(date: string, days: number): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  return new Date(parsed + days * DAY_MS).toISOString().slice(0, 10);
}

function githubDemoDays(): GitHubContributionDay[] {
  const start = "2026-04-08";
  return Array.from({ length: 91 }, (_, index) => {
    const pulse = [0, 1, 0, 3, 6, 2, 0, 0, 4, 8, 12, 5, 0][index % 13] ?? 0;
    const sprint = index > 54 && index < 73 ? Math.max(2, (index % 6) * 3) : 0;
    const release = index > 78 ? [0, 2, 4, 9, 15, 7, 1][index % 7] ?? 0 : 0;
    const count = Math.max(pulse, sprint, release);
    const level = count <= 0 ? 0 : count <= 3 ? 1 : count <= 7 ? 2 : count <= 12 ? 3 : 4;
    return { date: addDays(start, index), count, level };
  });
}

export function demoGitHubTrustSignal(): GitHubActivityTrustSignal {
  const days = githubDemoDays();
  const totalContributions = days.reduce((sum, day) => sum + day.count, 0);
  return {
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle: "demo-viber",
    fetchedAt: "2026-07-07T00:00:00.000Z",
    from: `${days[0]?.date ?? "2026-04-08"}T00:00:00.000Z`,
    to: `${days.at(-1)?.date ?? "2026-07-07"}T23:59:59.000Z`,
    windowDays: days.length,
    totalContributions,
    commitContributions: Math.round(totalContributions * 0.72),
    issueContributions: Math.round(totalContributions * 0.06),
    pullRequestContributions: Math.round(totalContributions * 0.14),
    pullRequestReviewContributions: Math.round(totalContributions * 0.08),
    repositoryContributions: 0,
    days,
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  };
}

function padFor(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function levelLabel(level: GitHubContributionDay["level"]): string {
  if (level === 0) return "none";
  if (level === 1) return "low";
  if (level === 2) return "steady";
  if (level === 3) return "high";
  return "peak";
}

function terminalLine(value: string): string {
  return `| ${value.padEnd(62).slice(0, 62)} |`;
}

export function renderGitHubTrustHeatgridHtml(signal: GitHubActivityTrustSignal = demoGitHubTrustSignal()): string {
  const days = (signal.days ?? []).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date)).slice(-91);
  const padCells = Array.from({ length: days[0] ? padFor(days[0].date) : 0 }, (_, index) =>
    `<i class="cell cell--pad" style="--i:${index};--gh:${GITHUB_TRUST_LEVEL_COLORS[0]}" aria-hidden="true"></i>`
  ).join("");
  const cells = days.map((day, index) => `<i class="cell" data-level="${day.level}" style="--i:${index + 1};--gh:${GITHUB_TRUST_LEVEL_COLORS[day.level]}" title="${esc(day.date)}: ${day.count} contribution${day.count === 1 ? "" : "s"} - NOT USAGE"></i>`).join("");
  const activeDays = days.filter((day) => day.count > 0).length;
  const peak = Math.max(0, ...days.map((day) => day.count));
  const latestStages = days
    .filter((day) => day.count > 0)
    .slice(-10)
    .map((day, index) => `<article class="stage" style="--i:${index};--gh:${GITHUB_TRUST_LEVEL_COLORS[day.level]}">
      <span>${String(index + 1).padStart(2, "0")} / ${esc(levelLabel(day.level).toUpperCase())}</span>
      <b>${esc(day.date)}</b>
      <p>${day.count.toLocaleString("en-US")} GitHub contribution${day.count === 1 ? "" : "s"}</p>
      <small>Trust evidence only. Score, spend, heatgrid usage rhythm, and rank stay unchanged.</small>
    </article>`).join("");
  const legend = GITHUB_TRUST_LEVEL_COLORS.map((color, index) => `<i style="--gh:${color}" data-level="${index}"></i>`).join("");
  const terminal = [
    "+----------------------------------------------------------------+",
    terminalLine("VTK://GITHUB-TRUST-HEATGRID//OFFICIAL-GH-COLORS//NOT-USAGE"),
    "|----------------------------------------------------------------|",
    terminalLine(`handle @${signal.handle} // window ${signal.windowDays}d // source github_cli`),
    terminalLine(`contributions ${signal.totalContributions.toLocaleString("en-US")} // active ${activeDays}d // peak ${peak}`),
    terminalLine("affectsTotals=false // usageVerified=false // score delta 0"),
    terminalLine("official dark GitHub scale: #161b22 #0e4429 #006d32 #26a641 #39d353"),
    terminalLine("animated fill is visual proof context, never usage proof"),
    terminalLine("Vibers Unite // c0vibe.app after explicit review"),
    "+----------------------------------------------------------------+",
  ].join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER GitHub Trust Heatgrid</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#39d353;--gh0:#161b22;--gh1:#0e4429;--gh2:#006d32;--gh3:#26a641;--gh4:#39d353;--gold:#ffc64d;--pink:#ff4fd8;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 14% 18%,rgba(57,211,83,.15),transparent 26%),radial-gradient(circle at 88% 10%,rgba(46,232,214,.12),transparent 24%);mix-blend-mode:screen}
  main{width:min(1260px,calc(100vw - 28px));margin:0 auto;padding:24px 0 44px}.hero,.replay,.stage,.rail{position:relative;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 42px 124px -94px var(--green),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.hero,.replay{border-radius:14px}.hero{display:grid;grid-template-columns:minmax(300px,.7fr) minmax(0,1.3fr);gap:1px;background:rgba(255,255,255,.07)}.poster,.terminal{min-height:520px;background:#050708}.poster{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 24% 18%,rgba(57,211,83,.15),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#050708)}.eyebrow,.terminal-top span,.replay-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.poster h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(38px,6.2vw,82px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 42px rgba(57,211,83,.25);overflow-wrap:anywhere}.poster p,.replay-head p,.rail p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stats span{border:1px solid rgba(57,211,83,.2);background:rgba(0,0,0,.24);padding:9px;color:#bff8e5;font-size:10px;font-weight:950;text-transform:uppercase}.stats b{display:block;margin-top:4px;color:#f8fff9;font-size:18px}.seal{border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);padding:10px;color:#ffe7a3}.terminal{position:relative;padding:12px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.terminal::after{content:"";position:absolute;left:12px;right:12px;top:68px;height:32px;background:linear-gradient(180deg,transparent,rgba(57,211,83,.18),rgba(46,232,214,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.terminal-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:14px;border:1px solid rgba(57,211,83,.16);background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(57,211,83,.14);overflow:auto}.terminal pre{min-height:430px}
  .grid-shell{position:relative;z-index:1;padding:14px;border-top:1px solid rgba(255,255,255,.08);background:#050708}.grid-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.grid-head b{color:#f8fff9;text-transform:uppercase}.legend{display:flex;align-items:center;gap:4px;color:var(--muted);font-size:10px}.legend i{display:block;width:13px;height:13px;border-radius:3px;background:var(--gh);border:1px solid rgba(240,246,252,.08)}.heatgrid{display:grid;grid-template-rows:repeat(7,16px);grid-auto-flow:column;grid-auto-columns:16px;gap:4px;max-width:100%;overflow:auto;padding:10px;border:1px solid rgba(57,211,83,.16);background:linear-gradient(180deg,#020506,#060b08)}.cell{display:block;width:16px;height:16px;border-radius:4px;background:var(--gh);border:1px solid rgba(240,246,252,.08);opacity:.52;transform:scale(.44);animation:fill .72s var(--motion) forwards;animation-delay:calc(var(--i) * 22ms)}.cell[data-level="3"]{box-shadow:0 0 14px -9px var(--gh)}.cell[data-level="4"]{box-shadow:0 0 22px -8px var(--gh)}.cell--pad{visibility:hidden}
  .replay{display:grid;grid-template-columns:minmax(280px,.66fr) minmax(0,1.34fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.replay-head{display:grid;align-content:space-between;gap:14px;min-height:360px;padding:16px;background:linear-gradient(150deg,rgba(57,211,83,.1),rgba(4,10,12,.86))}.replay-head b{display:block;color:#f8fff9;font:950 30px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.stage-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:#040708}.stage{min-height:184px;padding:12px;border-width:1px 0 0 1px;box-shadow:none;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.stage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--gh);transform-origin:left;animation:bar .9s var(--motion) forwards;animation-delay:calc(160ms + var(--i) * 90ms)}.stage span{position:relative;z-index:1;color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.stage b{position:relative;z-index:1;display:block;margin-top:8px;color:#f8fff9;font-size:14px}.stage p{position:relative;z-index:1;margin:8px 0 0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.stage small{position:relative;z-index:1;display:block;margin-top:8px;color:#bff8e5}
  .rails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.rail{border-radius:10px;padding:12px;min-height:118px}.rail b{display:block;margin-bottom:7px;color:var(--gold);font-size:11px;text-transform:uppercase}.accent{color:var(--green)}footer{margin-top:14px;color:var(--muted);font-size:11px}@keyframes scan{to{transform:translateY(300px)}}@keyframes fill{to{opacity:1;transform:none}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes bar{to{transform:none}}@media(max-width:980px){.hero,.replay{grid-template-columns:1fr}.poster,.terminal{min-height:340px}.stage-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){main{width:min(100vw - 18px,1260px);padding-top:12px}.poster h1{font-size:40px}.stats,.stage-grid,.rails{grid-template-columns:1fr}.terminal pre{font-size:8px}.heatgrid{grid-template-rows:repeat(7,13px);grid-auto-columns:13px;gap:3px}.cell{width:13px;height:13px}.grid-head{align-items:flex-start;flex-direction:column}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.cell,.stage::after{transform:none;opacity:1}.terminal::after{display:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER GitHub trust heatgrid">
  <section class="hero">
    <div class="poster">
      <div>
        <div class="eyebrow">VTK://GITHUB-TRUST-HEATGRID//OFFICIAL-GH-COLORS//NOT-USAGE</div>
        <h1>GitHub<br>Trust<br>Heatgrid</h1>
        <p>A contribution-style replay for builder credibility. It uses the official GitHub dark contribution colors, but it is a trust side rail only.</p>
      </div>
      <div class="stats" aria-label="GitHub trust heatgrid counters">
        <span>contributions <b>${signal.totalContributions.toLocaleString("en-US")}</b></span>
        <span>active days <b>${activeDays.toLocaleString("en-US")}</b></span>
        <span>affects totals <b>NO</b></span>
        <span>usage verified <b>NO</b></span>
      </div>
      <div class="seal">NOT USAGE. This cannot change spend, credits, rank, usage heatgrid, or vibe score.</div>
    </div>
    <aside class="terminal" aria-label="GitHub trust heatgrid terminal">
      <div class="terminal-top"><span>github@trust-rail</span><b>Vibers Unite</b></div>
      <pre>${esc(terminal)}</pre>
    </aside>
  </section>
  <section class="grid-shell" aria-label="Official GitHub color heatgrid replay">
    <div class="grid-head">
      <b>Official GitHub Contribution Scale Replay</b>
      <span class="legend">Less ${legend} More</span>
    </div>
    <div class="heatgrid" role="img" aria-label="GitHub contribution style trust heatgrid, not usage">${padCells}${cells}</div>
  </section>
  <section class="replay" aria-label="GitHub trust fill replay">
    <div class="replay-head">
      <span>VTK://TRUST-FILL-REPLAY//VISUAL-ONLY//SCORE-DELTA-0</span>
      <b>Fill<br>Replay</b>
      <p>The final active contribution days animate in front of the user. The replay is credibility context only; reviewed AI usage aggregates remain the only score and public usage source.</p>
      <pre>scoreDelta=0
spendDelta=0
rankDelta=0
usageHeatgridDelta=0
trustRail=visible</pre>
    </div>
    <div class="stage-grid">${latestStages}</div>
  </section>
  <section class="rails" aria-label="GitHub trust guardrails">
    <article class="rail"><b>Separate trust signal</b><p>GitHub cadence can explain builder credibility, but it never becomes AI usage.</p></article>
    <article class="rail"><b>Official colors</b><p>The cells use the GitHub dark contribution scale: #161b22 #0e4429 #006d32 #26a641 #39d353.</p></article>
    <article class="rail"><b>Publish boundary</b><p>c0vibe.app receives public profile data only after dry-run review and explicit upload approval.</p></article>
  </section>
  <footer><span class="accent">Static, script-free, offline:</span> demo trust evidence only. No account calls, no usage writes, no uploads, no secrets.</footer>
</main>
</body>
</html>`;
}
