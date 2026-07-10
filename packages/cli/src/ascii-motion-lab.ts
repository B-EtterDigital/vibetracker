import { buildAsciiMotionLab } from "../../web/src/lib/ascii-motion-lab.ts";

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function cssColor(value: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : "#2ee8d6";
}

export function renderAsciiMotionLabHtml(): string {
  const lab = buildAsciiMotionLab();
  const terminal = lab.terminalLines.join("\n");
  const beats = lab.theatreBeats.map((beat, index) => `<article class="beat" style="--i:${index};--from:${cssColor(beat.from)};--to:${cssColor(beat.to)};--ink:${cssColor(beat.ink)}">
      <div class="beat-frame" aria-label="${esc(beat.label)} frames">
        ${beat.frames.map((frame, frameIndex) => `<pre style="--frame:${frameIndex}">${esc(frame)}</pre>`).join("")}
      </div>
      <div class="beat-copy">
        <span>${String(beat.second).padStart(2, "0")}s / ${esc(beat.rail.toUpperCase())}</span>
        <b>${esc(beat.label)}</b>
        <code>${esc(beat.command)}</code>
        <p>${esc(beat.signal)}</p>
        <small>${esc(beat.boundary)}</small>
        <em>${esc(beat.metricLabel)}=${esc(beat.metricValue)} · ${beat.checks.map(esc).join(" · ")}</em>
      </div>
      <i>${esc(beat.mark)}</i>
    </article>`).join("");
  const rigs = lab.rigs.map((rig, index) => `<article class="rig" style="--i:${index};--from:${cssColor(rig.from)};--to:${cssColor(rig.to)};--ink:${cssColor(rig.ink)}">
      <div class="rig-top"><span>${esc(rig.license)}</span><b>${esc(rig.label)}</b></div>
      <div class="rig-screen" aria-label="${esc(rig.library)} frames">
        ${rig.frames.map((frame, frameIndex) => `<pre style="--frame:${frameIndex}">${esc(frame)}</pre>`).join("")}
      </div>
      <code>${esc(rig.library)} by ${esc(rig.author)}</code>
      <p>${esc(rig.note)}</p>
      <small>${esc(rig.guardrail)}</small>
      <meter min="0" max="100" value="${rig.meter}">${rig.meter}</meter>
    </article>`).join("");
  const referenceLanes = [
    {
      label: "Browser frame studies",
      cue: "ASCII Motion / Rune / AsciiMorph / xterm.js",
      refs: lab.references.filter((reference) => ["ascii-motion", "rune", "ascii-morph", "xterm"].includes(reference.id)),
    },
    {
      label: "Replay bench",
      cue: "asciinema / VHS / Durdraw / termdot / Asciimatics",
      refs: lab.references.filter((reference) => ["asciinema-player", "vhs", "durdraw", "termdot", "asciimatics"].includes(reference.id)),
    },
    {
      label: "Native terminal graphics",
      cue: "TerminalTextEffects / Notcurses / Chafa",
      refs: lab.references.filter((reference) => ["terminaltexteffects", "notcurses", "chafa"].includes(reference.id)),
    },
    {
      label: "Linux bench",
      cue: "pipes / MapSCII / cmatrix / unimatrix / cbonsai / rbonsai",
      refs: lab.references.filter((reference) => ["pipes-sh", "mapscii", "cmatrix", "unimatrix", "cbonsai", "rbonsai"].includes(reference.id)),
    },
  ].map((lane, index) => `<section class="reference-lane" style="--i:${index}">
      <div class="reference-head">
        <span>${esc(lane.label)}</span>
        <b>${esc(lane.cue)}</b>
        <p>REFERENCE ONLY. GPL references are not bundled; every cue remains visual, local, and not usage proof.</p>
      </div>
      <div class="reference-grid">
        ${lane.refs.map((reference, itemIndex) => `<article style="--i:${itemIndex}">
          <span>${esc(reference.license)}</span>
          <b>${esc(reference.project)}</b>
          <code>${esc(reference.cue)}</code>
          <p>${esc(reference.note)}</p>
          <small>${esc(reference.guardrail)}</small>
        </article>`).join("")}
      </div>
    </section>`).join("");
  const credits = lab.credits.map((credit) => `<span>${esc(credit.replace(/ - https?:\/\/.+$/i, ""))}</span>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER ASCII Motion Lab</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 14% 18%,rgba(46,232,214,.16),transparent 26%),radial-gradient(circle at 88% 8%,rgba(255,79,216,.12),transparent 24%),radial-gradient(circle at 50% 100%,rgba(54,227,155,.1),transparent 30%);mix-blend-mode:screen}
  main{width:min(1280px,calc(100vw - 28px));margin:0 auto;padding:24px 0 46px}.hero,.theatre,.rig-wall,.reference-lane{position:relative;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 42px 124px -92px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.hero{display:grid;grid-template-columns:minmax(300px,.72fr) minmax(0,1.28fr);gap:1px;background:rgba(255,255,255,.07)}.poster,.terminal{min-height:520px;background:#050708}.poster{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 26% 20%,rgba(46,232,214,.15),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#050708)}.eyebrow,.terminal-top span,.theatre-head span,.reference-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.poster h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(38px,6.4vw,82px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24);overflow-wrap:anywhere}.poster p,.theatre-head p,.reference-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.poster p{max-width:60ch;font-size:15px}.motion-mark{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.motion-mark span{display:grid;place-items:center;min-height:86px;border:1px solid rgba(255,255,255,.13);background:rgba(0,0,0,.22);color:var(--cyan);font:1000 clamp(24px,5vw,58px)/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 24px rgba(46,232,214,.38);animation:tilt 5.8s var(--motion) infinite}.motion-mark span:nth-child(2){color:var(--pink);animation-delay:-1.8s}.motion-mark span:nth-child(3){color:var(--green);animation-delay:-3.3s}.safety{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.safety span{border:1px solid rgba(54,227,155,.18);background:rgba(0,0,0,.24);padding:8px;color:#bff8e5;font-size:9px;font-weight:950;text-transform:uppercase}.terminal{position:relative;padding:12px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.terminal::after,.beat-frame::before,.rig-screen::before{content:"";position:absolute;left:12px;right:12px;top:70px;height:34px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.18),rgba(54,227,155,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.terminal-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.23 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.terminal pre{min-height:430px}.credits{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.credits span{border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);padding:6px 8px;color:#ffe7a3;font-size:10px}
  .theatre{display:grid;grid-template-columns:minmax(280px,.68fr) minmax(0,1.32fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.theatre-head{display:grid;align-content:space-between;gap:12px;min-height:420px;padding:16px;background:linear-gradient(150deg,rgba(255,79,216,.1),rgba(4,10,12,.86))}.theatre-head b,.reference-head b{display:block;color:#f8fff9;font:950 30px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.beat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#040708}.beat{position:relative;display:grid;grid-template-columns:90px 1fr;gap:10px;min-height:214px;padding:11px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,color-mix(in srgb,var(--from) 18%,transparent),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 80ms)}.beat::after,.rig::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill .9s var(--motion) forwards;animation-delay:calc(180ms + var(--i) * 96ms)}.beat-frame,.rig-screen{position:relative;min-height:96px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.28);overflow:hidden}.beat-frame::before,.rig-screen::before{left:0;right:0;top:auto;bottom:0}.beat-frame pre,.rig-screen pre{position:absolute;inset:0;display:grid;place-items:center;border:0;background:transparent;color:var(--ink);opacity:0;text-align:center;font-size:16px;line-height:1.08;animation:frame 8s var(--motion) infinite;animation-delay:calc(var(--frame) * 1.8s)}.beat-frame pre:first-child,.rig-screen pre:first-child{opacity:1}.beat-copy span,.rig-top span,.reference-grid span{color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.beat-copy b{display:block;margin-top:7px;color:#f8fff9;font-size:14px;text-transform:uppercase;overflow-wrap:anywhere}.beat-copy code,.rig code,.reference-grid code{display:block;margin-top:7px;color:#dffef6;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.22);padding:6px;overflow-wrap:anywhere}.beat-copy p,.rig p,.reference-grid p{margin:7px 0 0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;overflow-wrap:anywhere}.beat-copy small,.rig small,.reference-grid small{display:block;margin-top:7px;color:#bff8e5;overflow-wrap:anywhere}.beat-copy em{display:block;margin-top:7px;color:var(--green);font-style:normal;font-size:10px}.beat i{position:absolute;right:10px;bottom:8px;color:var(--ink);font-style:normal;font-weight:1000}
  .rig-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.rig{position:relative;display:grid;grid-template-rows:auto minmax(166px,1fr) auto auto auto auto;gap:10px;min-height:390px;padding:13px;background:linear-gradient(145deg,color-mix(in srgb,var(--from) 16%,transparent),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 82ms)}.rig-top{display:flex;justify-content:space-between;gap:8px}.rig-top b{color:#f8fff9;text-transform:uppercase}.rig-screen{min-height:166px}.rig-screen pre{font-size:13px}meter{position:relative;z-index:1;width:100%;height:9px;accent-color:var(--green)}
  .reference-lane{display:grid;grid-template-columns:minmax(270px,.66fr) minmax(0,1.34fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.reference-head{display:grid;align-content:space-between;gap:12px;min-height:260px;padding:16px;background:linear-gradient(150deg,rgba(46,232,214,.1),rgba(4,10,12,.86))}.reference-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#040708}.reference-grid article{min-height:198px;padding:12px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(46,232,214,.08),#05080a);animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 60ms)}.reference-grid b{display:block;margin-top:8px;color:#f8fff9;text-transform:uppercase}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(300px)}}@keyframes tilt{0%,100%{transform:perspective(340px) rotateY(-17deg)}50%{transform:perspective(340px) rotateY(17deg)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{to{transform:none}}@keyframes frame{0%,22%{opacity:1;transform:perspective(300px) rotateY(0)}28%,100%{opacity:0;transform:perspective(300px) rotateY(16deg)}}@media(max-width:1100px){.hero,.theatre,.reference-lane{grid-template-columns:1fr}.beat-grid,.rig-wall,.reference-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.poster,.terminal{min-height:360px}.theatre-head{min-height:260px}}@media(max-width:640px){main{width:min(100vw - 18px,1280px);padding-top:12px}.poster h1{font-size:40px}.motion-mark,.safety,.beat-grid,.rig-wall,.reference-grid{grid-template-columns:1fr}.terminal pre{font-size:8px}.beat{grid-template-columns:1fr;min-height:250px}.beat-frame pre{font-size:14px}.rig{min-height:330px}.reference-grid article{min-height:170px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.beat::after,.rig::after{transform:none}.beat-frame::before,.rig-screen::before,.terminal::after{display:none}.beat-frame pre,.rig-screen pre{opacity:0;transform:none}.beat-frame pre:first-child,.rig-screen pre:first-child{opacity:1}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER ASCII Motion Lab">
  <section class="hero">
    <div class="poster">
      <div>
        <div class="eyebrow">VTK://ASCII-MOTION-LAB//OFFLINE-GUI//NO-SIDEFX</div>
        <h1>ASCII<br>Motion<br>Lab</h1>
        <p>Research-backed terminal motion for the VibeTRACKER wizard: provider logo turns, braille signal fields, Linux terminal references, and visible attribution without collecting data.</p>
      </div>
      <div class="motion-mark" aria-label="Motion mark turntable"><span>HF</span><span>CX</span><span>C0</span></div>
      <div class="safety" aria-label="ASCII motion safety counters">
        <span>providerCalls 0</span>
        <span>usageWrites 0</span>
        <span>hiddenUploads 0</span>
        <span>promptReads 0</span>
      </div>
    </div>
    <aside class="terminal" aria-label="ASCII motion terminal">
      <div class="terminal-top"><span>motion@vibetracker</span><b>Vibers Unite</b></div>
      <pre>${esc(terminal)}</pre>
      <div class="credits" aria-label="Runtime-safe credits">${credits}</div>
    </aside>
  </section>
  <section class="theatre" aria-label="ASCII motion theatre beats">
    <div class="theatre-head">
      <span>VTK://MOTION-DIRECTOR//SURPRISE-BEATS//VISUAL-ONLY</span>
      <b>Surprise<br>Director</b>
      <p>Codex cube, Higgsfield prism, local sonar, regional map, receipt lock, and C0 relay flash are staged as visual feedback. Every beat repeats the boundary before the user sees the motion.</p>
      <pre>sideEffects:
providerCalls=0
usageWrites=0
hiddenUploads=0
publishWrites=0
trust remains NOT USAGE</pre>
    </div>
    <div class="beat-grid">${beats}</div>
  </section>
  <section class="rig-wall" aria-label="Runtime-safe motion rigs">${rigs}</section>
  ${referenceLanes}
  <footer><span class="accent">Static, script-free, offline:</span> attributions are visible; research references are not bundled as runtime code; motion never changes usage totals.</footer>
</main>
</body>
</html>`;
}
