import { GITHUB_TRUST_LEVEL_COLORS } from "./github-trust-heatgrid.ts";
import { providerBrand } from "./provider-brand.ts";

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function uniqueProviderIds(providerIds: string[]): string[] {
  const fallback = ["higgsfield", "codex-cli", "ollama", "github", "qwen", "mistral", "c0vibe"];
  const ids = providerIds.length ? providerIds : fallback;
  return Array.from(new Set([...ids, "github", "c0vibe"])).slice(0, 9);
}

function heatCells(): string {
  const levels = [0, 1, 0, 2, 3, 1, 0, 4, 2, 1, 0, 3, 4, 4, 1, 0, 2, 3, 1, 0, 4, 2, 3, 0, 1, 4, 3, 2, 0, 1, 2, 4, 4, 3, 1, 0, 2, 1, 3, 4, 0, 0, 2, 3, 1, 4, 2, 1, 0];
  return levels.map((level, index) => `<i class="gh-cell" data-level="${level}" style="--i:${index};--gh:${GITHUB_TRUST_LEVEL_COLORS[level]};"></i>`).join("");
}

export function renderVibersUniteRoomHtml(providerIds: string[] = []): string {
  const providers = uniqueProviderIds(providerIds).map((id) => providerBrand(id));
  const orbitMarks = providers.map((brand, index) => {
    const rot = Math.round((360 / providers.length) * index);
    return `<span class="orbit-mark" style="--i:${index};--rot:${rot}deg;--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}" title="${esc(brand.label)}"><b>${esc(brand.mark)}</b><small>${esc(brand.label)}</small></span>`;
  }).join("");
  const providerCards = providers.slice(0, 8).map((brand, index) => `<article class="provider" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}">
      <span>${esc(brand.mark)}</span>
      <b>${esc(brand.label)}</b>
      <p>${brand.id === "github" ? "NOT USAGE trust evidence" : brand.id === "c0vibe" ? "publish relay after review" : "branded source rail"}</p>
    </article>`).join("");
  const surpriseBeats = [
    ["00", "Codex cube", "trust side rail", "promptReads=0 outputReads=0", "  CX  \n /__\\ \n |[]| "],
    ["11", "Higgsfield prism", "creator usage rail", "MCP connected is NOT USAGE until records exist", " /HF\\ \n< HF >\n \\HF/ "],
    ["22", "Local AI sonar", "Ollama / LM Studio / ComfyUI", "loopback proof stays on-machine", "((OL))\n LM CU \nLOCAL "],
    ["33", "GitHub trust heatgrid", "official colors", "trust delta +0 score", "GH[][]\n#26a6\n#39d3"],
    ["44", "Score reactor", "reviewed datastream", "profile, heatgrid, and score share the reviewed datastream", "SCORE \n 084  \nREADY "],
    ["55", "C0VIBE relay", "publish hold", "c0vibe.app only after explicit review", " C0  \nVIBE \nUNITE"],
  ].map(([time, title, rail, guard, frame], index) => `<article class="beat" style="--i:${index}">
      <pre>${esc(frame)}</pre>
      <span>${esc(time)}s / ${esc(rail)}</span>
      <b>${esc(title)}</b>
      <p>${esc(guard)}</p>
    </article>`).join("");
  const streamRows = [
    ["USAGE", "accepted records", "feeds score, usage heatgrid, public profile"],
    ["SCORE", "vibe score reactor", "derived from usage mass, rhythm, breadth, freshness"],
    ["TRUST", "quarantined side rail", "GitHub, MCP, creator cadence: NOT USAGE, delta +0"],
    ["PRIVACY", "dry-run receipt", "no prompts, outputs, secrets, or raw files"],
    ["PUBLISH", "c0vibe.app", "reviewed aggregate only, no hidden upload"],
  ].map(([rail, label, detail], index) => `<article class="stream" style="--i:${index}">
      <span>${esc(rail)}</span>
      <b>${esc(label)}</b>
      <p>${esc(detail)}</p>
      <em><i></i></em>
    </article>`).join("");
  const terminalRack = [
    ["HF", "Higgsfield prism", "creator rail, reviewed records only"],
    ["CX", "Codex cube", "trust side rail, promptReads=0"],
    ["GH", "GitHub heatgrid", "official colors, NOT USAGE"],
    ["C0", "C0VIBE relay", "publish only after review"],
  ].map(([mark, label, detail], index) => `<article class="rack-card" style="--i:${index}">
      <span>${esc(mark)}</span>
      <b>${esc(label)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  const palette = GITHUB_TRUST_LEVEL_COLORS.join(" ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Vibers Unite Room</title>
<style>
  :root{color-scheme:dark;--bg:#030506;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.15);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 12% 14%,rgba(46,232,214,.16),transparent 26%),radial-gradient(circle at 86% 10%,rgba(255,79,216,.13),transparent 24%),radial-gradient(circle at 52% 100%,rgba(54,227,155,.11),transparent 30%);mix-blend-mode:screen}
  main{width:min(1280px,calc(100vw - 28px));margin:0 auto;padding:22px 0 42px}.room{position:relative;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(7,16,19,.97),rgba(4,7,9,.99));box-shadow:0 44px 140px -96px var(--cyan),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.room::before{content:"";position:absolute;left:0;right:8%;top:0;height:1px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold),var(--pink),transparent)}
  .hero{display:grid;grid-template-columns:minmax(320px,.72fr) minmax(0,1.28fr);gap:1px;background:rgba(255,255,255,.07)}.poster,.terminal,.orbit-panel,.stream-panel,.provider,.beat,.stream,.heat-panel{position:relative;min-width:0;background:linear-gradient(180deg,rgba(8,17,21,.96),rgba(3,6,8,.99));overflow:hidden}.poster,.terminal{min-height:560px}.poster{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 20% 18%,rgba(46,232,214,.16),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#040708)}.eyebrow{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.poster h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(40px,5.8vw,78px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.26);overflow-wrap:anywhere}.poster p{max-width:55ch;margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.stamp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.stamp span{display:grid;place-items:center;min-height:90px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.24);color:var(--cyan);font:1000 clamp(26px,5vw,60px)/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 24px rgba(46,232,214,.42);animation:tilt 5.8s var(--motion) infinite}.stamp span:nth-child(2){color:var(--pink);animation-delay:-1.6s}.stamp span:nth-child(3){color:var(--green);animation-delay:-3.1s}.seals{display:flex;flex-wrap:wrap;gap:6px}.seals span{border:1px solid rgba(54,227,155,.2);border-radius:999px;padding:6px 8px;background:rgba(0,0,0,.24);color:#bff8e5;font-size:9px;font-weight:950;text-transform:uppercase}
  .terminal{padding:12px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.terminal::after{content:"";position:absolute;left:12px;right:12px;top:78px;height:34px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.18),rgba(54,227,155,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;white-space:pre-wrap}.terminal pre{min-height:294px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:900 10px/1.23 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.status-rack{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-top:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08)}.rack-card{display:grid;grid-template-rows:auto auto 1fr;gap:7px;min-height:126px;padding:10px;background:linear-gradient(145deg,rgba(46,232,214,.1),#030708);animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 68ms)}.rack-card span{display:grid;place-items:center;width:36px;height:30px;color:#071013;background:linear-gradient(135deg,var(--cyan),var(--green));font-weight:1000}.rack-card b{color:#f8fff9;font-size:12px;text-transform:uppercase;overflow-wrap:anywhere}.rack-card p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px}
  .command-grid{display:grid;grid-template-columns:minmax(310px,.82fr) minmax(0,1.18fr);gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.07)}.orbit-panel{display:grid;grid-template-rows:auto auto 1fr;gap:12px;min-height:430px;padding:16px;background:radial-gradient(circle at 50% 48%,rgba(46,232,214,.16),transparent 35%),linear-gradient(150deg,rgba(159,124,255,.09),rgba(4,10,12,.9))}.orbit-panel span,.stream-panel span,.heat-panel span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.orbit-panel h2,.stream-panel h2,.heat-panel h2{margin:0;color:#f8fff9;font:950 34px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.orbit{position:relative;place-self:center;width:min(330px,78vw);aspect-ratio:1;border:1px solid rgba(46,232,214,.22);border-radius:999px;background:repeating-radial-gradient(circle,rgba(46,232,214,.06) 0 1px,transparent 1px 18px),radial-gradient(circle,rgba(255,79,216,.13),transparent 58%);box-shadow:inset 0 0 44px rgba(46,232,214,.12)}.orbit::before,.orbit::after{content:"";position:absolute;inset:14%;border:1px dashed rgba(255,198,77,.22);border-radius:999px;animation:orbitTurn 18s linear infinite}.orbit::after{inset:30%;border-color:rgba(54,227,155,.22);animation-duration:16s;animation-direction:reverse}.orbit-core{position:absolute;left:50%;top:50%;z-index:2;width:112px;height:112px;display:grid;place-items:center;text-align:center;transform:translate(-50%,-50%);border:1px solid rgba(46,232,214,.34);border-radius:999px;background:#03100f;color:#f8fff9;font:950 28px/.9 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 0 52px rgba(46,232,214,.25)}.orbit-core small{display:block;color:var(--gold);font-size:9px}.orbit-mark{position:absolute;left:50%;top:50%;z-index:3;display:grid;place-items:center;gap:2px;width:74px;min-height:54px;padding:7px 5px;transform:rotate(var(--rot)) translateX(clamp(72px,10vw,112px)) rotate(calc(var(--rot) * -1));border:1px solid rgba(255,255,255,.2);background:linear-gradient(135deg,var(--from),var(--to));color:var(--ink);box-shadow:0 16px 42px -24px var(--from);animation:markPulse 2.8s var(--motion) infinite;animation-delay:calc(var(--i) * 120ms)}.orbit-mark b{font-size:16px}.orbit-mark small{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;max-width:62px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.provider-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:#040708}.provider{min-height:138px;padding:12px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,color-mix(in srgb,var(--from) 20%,transparent),#05080a);animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 68ms)}.provider span{display:grid;place-items:center;width:38px;height:32px;margin-bottom:12px;color:var(--ink);background:linear-gradient(135deg,var(--from),var(--to));font-weight:1000}.provider b{display:block;color:#f8fff9;text-transform:uppercase;overflow-wrap:anywhere}.provider p{margin:8px 0 0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
  .stream-panel{display:grid;grid-template-rows:auto auto 1fr;gap:12px;min-height:430px;padding:16px;background:#040708}.stream-panel pre{min-height:152px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#020506;color:#dffef6;font:900 10px/1.24 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto}.stream-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.07)}.stream{display:grid;grid-template-rows:auto auto 1fr auto;gap:9px;min-height:220px;padding:12px;border:1px solid rgba(255,255,255,.08);animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 76ms)}.stream span{color:var(--gold)}.stream b{color:#f8fff9;font-size:14px;text-transform:uppercase}.stream p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.stream em{display:block;height:8px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:#030708;overflow:hidden}.stream em i{display:block;width:96%;height:100%;background:linear-gradient(90deg,var(--cyan),var(--green));transform-origin:left;transform:scaleX(0);animation:fill .9s var(--motion) forwards;animation-delay:calc(220ms + var(--i) * 80ms)}
  .surprises{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.07)}.beat{display:grid;grid-template-rows:auto auto auto 1fr;gap:9px;min-height:230px;padding:12px;border:1px solid rgba(255,255,255,.08);animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 86ms)}.beat pre{display:grid;place-items:center;min-height:74px;padding:8px;border:1px solid rgba(46,232,214,.14);background:#020506;color:#dffef6;font:1000 14px/1.05 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:center;text-shadow:0 0 18px rgba(46,232,214,.24);animation:tilt 5.4s var(--motion) infinite;animation-delay:calc(var(--i) * -360ms)}.beat span{color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.beat b{color:#f8fff9;font-size:14px;text-transform:uppercase}.beat p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
  .heat{display:grid;grid-template-columns:minmax(260px,.62fr) minmax(0,1.38fr);gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.07)}.heat-panel{display:grid;align-content:space-between;gap:14px;min-height:270px;padding:16px;background:linear-gradient(150deg,rgba(255,198,77,.08),rgba(4,10,12,.86))}.heat-panel p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif}.gh-palette{display:flex;gap:6px;flex-wrap:wrap}.gh-palette i{width:34px;height:22px;border:1px solid rgba(255,255,255,.12);background:var(--gh)}.heatgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;padding:16px;background:#050708}.gh-cell{display:block;min-height:24px;border:1px solid rgba(255,255,255,.08);background:var(--gh);box-shadow:0 0 0 rgba(57,211,83,0);animation:ghFill .8s var(--motion) both;animation-delay:calc(var(--i) * 22ms)}.gh-cell[data-level="4"]{box-shadow:0 0 22px -8px #39d353}
  footer{padding:12px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(300px)}}@keyframes tilt{0%,100%{transform:perspective(340px) rotateY(-17deg)}50%{transform:perspective(340px) rotateY(17deg)}}@keyframes orbitTurn{to{transform:rotate(360deg)}}@keyframes markPulse{0%,100%{filter:saturate(1);box-shadow:0 16px 42px -24px var(--from)}50%{filter:saturate(1.35);box-shadow:0 22px 56px -18px var(--to)}}@keyframes rise{from{opacity:.58;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{to{transform:none}}@keyframes ghFill{from{opacity:.35;transform:scale(.72)}to{opacity:1;transform:none}}@media(max-width:1080px){.hero,.command-grid,.heat{grid-template-columns:1fr}.provider-grid,.status-rack{grid-template-columns:repeat(2,minmax(0,1fr))}.stream-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.surprises{grid-template-columns:repeat(3,minmax(0,1fr))}.poster,.terminal{min-height:360px}}@media(max-width:640px){main{width:min(100vw - 18px,1280px);padding-top:10px}.poster h1{font-size:42px}.stamp,.provider-grid,.status-rack,.stream-grid,.surprises{grid-template-columns:1fr}.orbit{width:min(292px,74vw)}.orbit-mark{width:58px;min-height:48px;transform:rotate(var(--rot)) translateX(clamp(60px,19vw,90px)) rotate(calc(var(--rot) * -1))}.orbit-mark small{display:none}.terminal pre,.stream-panel pre{font-size:8px}.heatgrid{grid-template-columns:repeat(7,1fr);gap:3px}.gh-cell{min-height:18px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.stream em i{transform:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER Vibers Unite Room">
  <section class="room">
    <section class="hero">
      <div class="poster">
        <div>
          <div class="eyebrow">VTK://VIBERS-UNITE-ROOM//OFFLINE-GUI//ZERO-SIDEFX</div>
          <h1>Vibers<br>Unite<br>Room</h1>
          <p>The high-signal first-open room: terminal charm inside the GUI, provider-branded scan theatre, GitHub official-color trust heatgrid, the score reactor contract, and the c0vibe.app publish hold.</p>
        </div>
        <div class="stamp" aria-label="Animated room marks"><span>HF</span><span>CX</span><span>C0</span></div>
        <div class="seals" aria-label="Zero side effect seals">
          <span>providerCalls=0</span><span>usageWrites=0</span><span>uploads=0</span><span>secretsRead=0</span><span>no confetti</span>
        </div>
      </div>
      <aside class="terminal" aria-label="Vibers Unite terminal">
        <div class="top"><span>vibetracker@unite-room</span><b>C0VIBE.APP</b></div>
        <pre>+------------------------------------------------------------------+
| VTK://VIBERS-UNITE-ROOM//VIBETRACKER//C0VIBE.APP               |
|------------------------------------------------------------------|
| 00  terminal charm      inline GUI console                       |
| 01  provider theatre    Higgsfield prism / Codex cube            |
| 02  local AI scan       Ollama / LM Studio / ComfyUI stay local  |
| 03  trust heatgrid      GitHub official colors, NOT USAGE        |
| 04  score reactor       profile + heatgrid + score datastream    |
| 05  publish hold        c0vibe.app waits for explicit review     |
|                                                                  |
| providerCalls=0 usageWrites=0 uploads=0 secretsRead=0            |
| promptReads=0 outputReads=0 hiddenNetwork=0                     |
| trust delta +0 score // spendDelta 0 // rankDelta 0              |
|                                                                  |
| Motto: Vibers Unite // c0vibe.app                                |
+------------------------------------------------------------------+</pre>
        <div class="status-rack" aria-label="Live status rack">${terminalRack}</div>
      </aside>
    </section>
    <section class="command-grid" aria-label="Provider and datastream control room">
      <div class="orbit-panel">
        <span>VTK://PROVIDER-ORBIT//BRANDED//NO-CALLS</span>
        <h2>Provider<br>Orbit</h2>
        <div class="orbit" aria-label="Provider color orbit">
          <div class="orbit-core">C0<small>Vibers Unite</small></div>
          ${orbitMarks}
        </div>
      </div>
      <div class="stream-panel">
        <span>VTK://DATASTREAM-ROUTER//SCORE-PROFILE-HEATGRID//TRUST-QUARANTINE</span>
        <h2>Datastream<br>Router</h2>
        <pre>usage records -> daily aggregates -> vibe score -> public profile
                 |-> official-color usage heatgrid
trust signals  -> side rail only -> NOT USAGE -> score delta +0
publish        -> review receipt -> c0vibe.app</pre>
        <div class="stream-grid" aria-label="Datastream rows">${streamRows}</div>
      </div>
    </section>
    <section class="provider-grid" aria-label="Branded provider cards">${providerCards}</section>
    <section class="surprises" aria-label="Surprise sequence">${surpriseBeats}</section>
    <section class="heat" aria-label="GitHub trust heatgrid preview">
      <div class="heat-panel">
        <span>VTK://GITHUB-TRUST-HEATGRID//OFFICIAL-COLORS//NOT-USAGE</span>
        <h2>Trust<br>Heatgrid</h2>
        <p>Official GitHub colors: ${esc(palette)}. This is connection/contribution evidence only; it cannot change usage totals, spend, rank, or vibe score.</p>
        <div class="gh-palette">${GITHUB_TRUST_LEVEL_COLORS.map((color) => `<i style="--gh:${color}"></i>`).join("")}</div>
      </div>
      <div class="heatgrid" aria-label="Official GitHub color trust grid">${heatCells()}</div>
    </section>
    <footer><span class="accent">Static, script-free, offline:</span> visual theatre only. Real usage starts only after the user runs sync/connect commands and reviews the receipt.</footer>
  </section>
</main>
</body>
</html>`;
}
