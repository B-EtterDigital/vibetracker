export interface WizardRunwayOptions {
  generatedAt?: string;
  providerIds?: string[];
}

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

export function renderWizardRunwayHtml(options: WizardRunwayOptions = {}): string {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const providerIds = options.providerIds?.length ? options.providerIds : ["higgsfield", "codex-cli", "ollama", "replicate"];
  const providerLine = providerIds.join(" / ");
  const rails = [
    {
      step: "00",
      label: "Terminal boot",
      impact: "privacy",
      mark: "VT",
      detail: "Start in the shell, then jump into the local GUI without hiding commands.",
      command: "npx vibetrack init --gui",
      meter: 35,
    },
    {
      step: "01",
      label: "Higgsfield prism",
      impact: "usage",
      mark: "HF",
      detail: "Creator video/image records become usage only after accepted receipt rows.",
      command: "vibetracker sync --provider higgsfield",
      meter: 82,
    },
    {
      step: "02",
      label: "Codex trust cube",
      impact: "not usage",
      mark: "CX",
      detail: "Builder cadence and GitHub context stay a separate trust rail.",
      command: "vibetracker trust signals",
      meter: 64,
    },
    {
      step: "03",
      label: "Local AI sonar",
      impact: "local",
      mark: "LM",
      detail: "Ollama, LM Studio, ComfyUI, and loopback proxies stay on-machine.",
      command: "vibetracker detect --local",
      meter: 72,
    },
    {
      step: "04",
      label: "Creator API sweep",
      impact: "usage",
      mark: "RP",
      detail: "Replicate, Runway, Fal, music, voice, and 3D ledgers keep source labels.",
      command: "vibetracker sync --provider replicate",
      meter: 76,
    },
    {
      step: "05",
      label: "Regional adapter pass",
      impact: "privacy",
      mark: "EU",
      detail: "Qwen, Kimi, Doubao, Mistral, LightOn, and Aleph Alpha stay branded.",
      command: "vibetracker providers --region global",
      meter: 68,
    },
    {
      step: "06",
      label: "C0VIBE relay",
      impact: "publish",
      mark: "C0",
      detail: "Profile, heatgrid, score, and badges wait for dry-run review.",
      command: "vibetracker upload --dry-run",
      meter: 91,
    },
  ];
  const surprises = [
    {
      label: "Higgsfield logo turn",
      impact: "usage",
      mark: "HF",
      caption: "Creator usage wakes only after accepted Higgsfield receipt rows.",
      guardrail: "visual feedback only; providerCalls=0",
      frames: [
        [" .--HF--. ", "/ /\\  /\\ \\", "|  HF   |", "\\ \\/  \\/ /", " '--<>--'"],
        [" .--HF--. ", "/  <>   \\", "| /HF\\  |", "\\  \\/  /", " '--<>--'"],
        [" .--HF--. ", "/ \\/  \\/ \\", "|  HF   |", "\\ /\\  /\\ /", " '--<>--'"],
        [" .--HF--. ", "/   /\\  \\", "|  HF\\  |", "\\  <>  /", " '--<>--'"],
      ],
    },
    {
      label: "Codex cube sidecar",
      impact: "not-usage",
      mark: "CX",
      caption: "Builder and GitHub cadence can strengthen trust, never spend.",
      guardrail: "NOT USAGE; ledgerWrites=0",
      frames: [
        ["+--CX--+", "| diff |", "| logs |", "+--GH--+"],
        ["/--CX--\\", "| run  |", "| trust|", "\\--GH--/"],
        ["<--CX-->", "| side |", "| rail |", "<--GH-->"],
        ["+--CX--+", "| NOT  |", "| USE  |", "+--GH--+"],
      ],
    },
    {
      label: "Local model sonar",
      impact: "local",
      mark: "127",
      caption: "Ollama, LM Studio, ComfyUI, and loopback tools stay local first.",
      guardrail: "hiddenUploads=0; review before relay",
      frames: [
        ["[OL]~~~~", "   \\    ", "[LM]127", "   /    ", "[CU]~~~~"],
        ["~~~~[OL]", "    \\   ", "127[LM]", "    /   ", "~~~~[CU]"],
        ["[OL]--+", "      |", "[LM]--+--VTK", "      |", "[CU]--+"],
        ["LOCAL", "ONLY", "REVIEW", "THEN", "RELAY?"],
      ],
    },
    {
      label: "C0VIBE relay flash",
      impact: "publish",
      mark: "C0",
      caption: "Vibers Unite appears after dry-run review and redaction.",
      guardrail: "c0vibe.app waits for explicit upload",
      frames: [
        ["VIBERS", "UNITE", "C0VIBE", ".APP"],
        ["usage ->", "trust -x", "local ?", "redact"],
        ["profile", "heatgrid", "score", "badges"],
        ["VIBERS", "WORLD", "UNITE", "online"],
      ],
    },
  ];
  const cards = rails.map((rail, index) => `<article class="rail rail--${esc(rail.impact.replace(" ", "-"))}" style="--i:${index};--meter:${rail.meter}%">
      <div class="rail-top"><span>${esc(rail.step)}</span><b>${esc(rail.impact)}</b></div>
      <pre>${esc([
        `+-- ${rail.mark} --+`,
        "|      |",
        `| ${rail.mark.padEnd(4)} |`,
        "|      |",
        "+-------+",
      ].join("\n"))}</pre>
      <h2>${esc(rail.label)}</h2>
      <p>${esc(rail.detail)}</p>
      <code>${esc(rail.command)}</code>
      <i aria-hidden="true"></i>
    </article>`).join("");
  const surpriseCards = surprises.map((surprise, index) => `<article class="surprise surprise--${esc(surprise.impact)}" style="--i:${index}">
      <div class="surprise-top"><span>${esc(surprise.mark)}</span><b>${esc(surprise.impact)}</b></div>
      <div class="surprise-screen" aria-hidden="true">${surprise.frames.map((item, frameIndex) => `<pre style="--f:${frameIndex}">${esc(item.join("\n"))}</pre>`).join("")}</div>
      <h2>${esc(surprise.label)}</h2>
      <p>${esc(surprise.caption)}</p>
      <small>${esc(surprise.guardrail)}</small>
    </article>`).join("");
  const terminalRows = [
    "+----------------------------------------------------------------+",
    "| VTK://WIZARD-RUNWAY//OFFLINE//NO-PROVIDER-CALLS               |",
    "|----------------------------------------------------------------|",
    "| boot -> scan -> creator -> trust -> local -> regional -> relay |",
    "| motion: CSS only / no scripts / no network / no secrets        |",
    `| providers staged: ${providerLine.slice(0, 46).padEnd(46)} |`,
    "| surprise beats: Higgsfield prism / Codex cube / local sonar    |",
    "| surprise relay: providerCalls=0 ledgerWrites=0 hiddenUploads=0 |",
    "| trust rail: NOT USAGE, no spend, no rank inflation             |",
    "| publish rail: c0vibe.app waits for upload --dry-run            |",
    "| motto: Vibers Unite                                            |",
    "+----------------------------------------------------------------+",
  ].join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Wizard Runway</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#0d1419;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.026) 50%,transparent 50%) 0 0/100% 4px,linear-gradient(90deg,rgba(46,232,214,.06),transparent 18%,rgba(255,79,216,.05) 44%,transparent 72%,rgba(54,227,155,.06));mix-blend-mode:screen}
  main{width:min(1260px,calc(100vw - 28px));margin:0 auto;padding:26px 0 44px}.hero{display:grid;grid-template-columns:minmax(320px,.78fr) minmax(0,1.22fr);gap:12px;min-height:520px}.panel,.terminal,.rail,.truth{position:relative;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,rgba(11,20,24,.95),rgba(4,7,9,.99));box-shadow:0 30px 96px -72px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel::after,.terminal::after,.rail::after,.truth::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 58%);transform:translateX(-98%);animation:sweep 5.6s var(--motion) infinite;pointer-events:none}.panel{display:grid;align-content:space-between;gap:22px;padding:20px}.eyebrow{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.panel h1{margin:10px 0;color:#f8fff9;font:950 clamp(38px,7vw,82px)/.9 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.26)}.panel p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px}.truth{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;border-radius:9px}.truth span{position:relative;z-index:1;padding:10px;color:#c9fff0;font-size:10px;font-weight:950;text-transform:uppercase;background:rgba(4,10,12,.72)}.truth b{float:right;color:var(--gold)}
  .terminal{padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:448px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:950 10px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}
  .runway{display:grid;grid-template-columns:repeat(7,minmax(150px,1fr));gap:10px;margin-top:12px}.rail{--tone:var(--cyan);display:grid;align-content:start;gap:9px;min-height:310px;padding:12px;animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 72ms)}.rail--usage{--tone:var(--green)}.rail--not-usage{--tone:var(--gold);border-style:dashed}.rail--local{--tone:var(--violet)}.rail--privacy{--tone:var(--pink)}.rail--publish{--tone:var(--green)}.rail::before{content:"";position:absolute;left:0;right:calc(100% - var(--meter));bottom:0;height:3px;background:linear-gradient(90deg,var(--tone),transparent);animation:meter 1.2s var(--motion) both;animation-delay:calc(var(--i) * 96ms)}.rail-top,.rail pre,.rail h2,.rail p,.rail code,.rail i{position:relative;z-index:1}.rail-top{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.rail-top span{color:var(--tone)}.rail-top b{color:var(--gold)}.rail pre{min-height:92px;padding:10px;border:1px solid color-mix(in srgb,var(--tone) 28%,var(--line));background:#030708;color:#effff9;font:950 10px/1.05 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 18px color-mix(in srgb,var(--tone) 34%,transparent)}.rail h2{margin:0;color:#f8fff9;font-size:15px;line-height:1.05;text-transform:uppercase}.rail p{margin:0;color:#c3ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.rail code{display:block;margin-top:auto;padding:7px;border:1px solid color-mix(in srgb,var(--tone) 24%,var(--line));color:#dffef6;background:rgba(0,0,0,.22);font-size:10px;overflow-wrap:anywhere}.rail i{display:block;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--tone) var(--meter),rgba(255,255,255,.08) 0);box-shadow:0 0 22px -8px var(--tone)}
  .surprise-deck{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.surprise{--tone:var(--cyan);position:relative;display:grid;grid-template-rows:auto 150px auto auto auto;gap:9px;min-height:310px;padding:12px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,rgba(11,20,24,.95),rgba(4,7,9,.99));box-shadow:0 30px 96px -72px var(--tone),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(220ms + var(--i) * 90ms)}.surprise--usage{--tone:var(--green)}.surprise--not-usage{--tone:var(--gold);border-style:dashed}.surprise--local{--tone:var(--violet)}.surprise--publish{--tone:var(--cyan)}.surprise::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(var(--tone),transparent)}.surprise::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,color-mix(in srgb,var(--tone) 16%,transparent) 50%,transparent 58%);transform:translateX(-98%);animation:sweep 5.6s var(--motion) infinite;pointer-events:none}.surprise-top,.surprise-screen,.surprise h2,.surprise p,.surprise small{position:relative;z-index:1}.surprise-top{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.surprise-top span{display:grid;place-items:center;width:30px;height:26px;border-radius:8px;color:#071013;background:linear-gradient(135deg,var(--tone),#effff9)}.surprise-top b{color:var(--gold)}.surprise-screen{display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--tone) 28%,var(--line));border-radius:8px;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--tone) 18%,transparent),transparent 58%),#030708;overflow:hidden}.surprise-screen pre{grid-area:1/1;color:#effff9;text-align:center;font:950 12px/1.04 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 18px color-mix(in srgb,var(--tone) 38%,transparent);opacity:0;transform:perspective(330px) rotateY(-22deg) scale(.94);animation:reel 6.4s var(--motion) infinite;animation-delay:calc(var(--f) * 1.6s)}.surprise-screen pre:first-child{opacity:1}.surprise h2{margin:0;color:#f8fff9;font-size:15px;line-height:1.05;text-transform:uppercase}.surprise p{margin:0;color:#c3ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.surprise small{color:var(--gold);font-size:10px;line-height:1.3;text-transform:uppercase}
  footer{margin-top:12px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(98%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes meter{from{right:100%}}@keyframes reel{0%,18%{opacity:1;transform:perspective(330px) rotateY(-8deg) scale(1)}25%,100%{opacity:0;transform:perspective(330px) rotateY(34deg) scale(.9)}}@media(max-width:1180px){.runway{grid-template-columns:repeat(3,minmax(0,1fr))}.surprise-deck{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:920px){.hero{grid-template-columns:1fr}.terminal pre{min-height:320px}.runway{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){main{width:min(100vw - 18px,1260px);padding-top:12px}.panel{padding:16px}.panel h1{font-size:38px}.truth,.runway,.surprise-deck{grid-template-columns:1fr}.terminal pre,.rail pre,.surprise-screen pre{font-size:8px}.rail{min-height:250px}.surprise{min-height:270px;grid-template-rows:auto 128px auto auto auto}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.surprise-screen pre{opacity:0;transform:none}.surprise-screen pre:first-child{opacity:1}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER wizard runway">
    <section class="hero">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://WIZARD-RUNWAY//TERMINAL-GUI//VIBERS-UNITE</div>
          <h1>Wizard<br>Runway</h1>
          <p>A script-free first-run control room for open-source users: beautiful scan feedback, honest proof labels, and zero provider calls.</p>
        </div>
        <div class="truth" aria-label="Runway truth labels">
          <span>provider calls <b>NO</b></span>
          <span>demo usage writes <b>NO</b></span>
          <span>trust affects spend <b>NO</b></span>
          <span>dry-run before c0vibe.app <b>YES</b></span>
        </div>
      </div>
      <section class="terminal" aria-label="Wizard runway terminal">
        <div class="terminal-top"><span>runway@local</span><b>ASCII GUI</b></div>
        <pre>${esc(terminalRows)}</pre>
      </section>
    </section>
    <section class="surprise-deck" aria-label="CSS-only scan surprise relay">${surpriseCards}</section>
    <section class="runway" aria-label="Labelled first-run scan rails">${cards}</section>
    <footer><span class="accent">Static wizard runway:</span> no scripts, no CDN, no hidden usage. Generated ${esc(generatedAt)}.</footer>
  </main>
</body>
</html>`;
}
