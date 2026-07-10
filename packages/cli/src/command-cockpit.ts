type CommandImpact = "setup" | "usage" | "not_usage" | "privacy" | "publish" | "local";

interface CockpitCommand {
  id: string;
  label: string;
  command: string;
  impact: CommandImpact;
  rail: string;
  note: string;
  surprise: string;
  frames: string[];
}

interface CockpitLane {
  id: string;
  label: string;
  detail: string;
  commands: CockpitCommand[];
}

export interface CommandCockpitPayload {
  schema: "vibetracker.command-cockpit/0.1";
  headline: string;
  motto: string;
  safePreview: true;
  writes: false;
  uploads: false;
  providerCalls: false;
  secretsRead: false;
  lanes: CockpitLane[];
}

const fit = (value: string, width: number): string =>
  value.length > width ? `${value.slice(0, Math.max(0, width - 1))}.` : value.padEnd(width);

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

const frame = (lines: string[]): string => lines.join("\n");

const commands: CockpitCommand[] = [
  {
    id: "init-gui",
    label: "Terminal GUI wizard",
    command: "vibetracker init --gui",
    impact: "setup",
    rail: "FIRST RUN",
    note: "Terminal charm jumps into the browser wizard while keys stay masked.",
    surprise: "inline terminal handoff",
    frames: ["VTK\nGUI\nGO", "KEY\nMASK\nLOCAL", "SCAN\nPLAN\nSYNC"],
  },
  {
    id: "doctor",
    label: "Safe health preview",
    command: "vibetracker doctor",
    impact: "not_usage",
    rail: "NOT USAGE",
    note: "Renders Higgsfield and Codex preview art without provider calls or uploads.",
    surprise: "HF prism and CX cube",
    frames: [" /\\ \n HF \n \\/ ", "+CX+\n|{}|\n+--+", "NO\nCALL\nOK"],
  },
  {
    id: "surprises",
    label: "Static scan reel",
    command: "vibetracker surprises --html --out surprise-reel.html",
    impact: "not_usage",
    rail: "SAFE PREVIEW",
    note: "Generates the script-free surprise reel for demos and first-run confidence.",
    surprise: "Vibers Unite reel",
    frames: ["HF\nCX\nLAN", "C0\nVIBE\nAPP", "NO\nJS\nOK"],
  },
  {
    id: "detect",
    label: "Local AI radar",
    command: "vibetracker detect",
    impact: "local",
    rail: "LOCAL",
    note: "Checks Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM, and local OpenAI-compatible endpoints.",
    surprise: "loopback sonar",
    frames: ["127.\n0.0.\n 1 ", "OL\nLC\nJN", "G4\nVL\nCU"],
  },
  {
    id: "sync",
    label: "Collect usage",
    command: "vibetracker sync",
    impact: "usage",
    rail: "USAGE",
    note: "Runs provider adapters, validates records, dedupes, and writes the local ledger.",
    surprise: "provider scan beat",
    frames: ["AUTH\nFETCH\nCHECK", "LEDGER\nROWS\nLOCK", "HF\nRP\nAI"],
  },
  {
    id: "audit",
    label: "Proof review",
    command: "vibetracker audit",
    impact: "privacy",
    rail: "REVIEW",
    note: "Shows source mix, freshness, coverage gaps, trust side rails, and bundle hash.",
    surprise: "black box recorder",
    frames: ["SRC\nMIX\nHASH", "TRUST\n!=$$\nOK", "GAPS\nFIX\nNEXT"],
  },
  {
    id: "dry-run",
    label: "Preview sharing",
    command: "vibetracker upload --dry-run",
    impact: "privacy",
    rail: "DRY RUN",
    note: "Shows exactly what would leave the machine before any public profile update.",
    surprise: "redaction scanner",
    frames: ["MASK\nDRY\nRUN", "NO\nRAW\nPROMPT", "USER\nYES?\nWAIT"],
  },
  {
    id: "publish",
    label: "Publish aggregate",
    command: "vibetracker upload",
    impact: "publish",
    rail: "C0VIBE",
    note: "Sends reviewed aggregate usage and labelled trust signals to c0vibe.app.",
    surprise: "Vibers Unite relay",
    frames: ["C0\nVI\nBE", "AGG\nONLY\nSEND", "VIBERS\nUNITE\nAPP"],
  },
];

function lanes(): CockpitLane[] {
  return [
    {
      id: "first-run",
      label: "First-run surface",
      detail: "Onboarding, safe preview, local detection, and surprise reel.",
      commands: commands.filter((command) => ["setup", "not_usage", "local"].includes(command.impact)),
    },
    {
      id: "usage-core",
      label: "Usage core",
      detail: "Validated collection and local proof review.",
      commands: commands.filter((command) => ["usage", "privacy"].includes(command.impact)),
    },
    {
      id: "publish",
      label: "C0VIBE relay",
      detail: "Only reviewed aggregates publish.",
      commands: commands.filter((command) => command.impact === "publish"),
    },
  ];
}

export function commandCockpitPayload(): CommandCockpitPayload {
  return {
    schema: "vibetracker.command-cockpit/0.1",
    headline: "COMMAND COCKPIT",
    motto: "Vibers Unite // c0vibe.app",
    safePreview: true,
    writes: false,
    uploads: false,
    providerCalls: false,
    secretsRead: false,
    lanes: lanes(),
  };
}

export function renderCommandCockpit(): string {
  const payload = commandCockpitPayload();
  const flat = payload.lanes.flatMap((lane) => lane.commands.map((command) => ({ lane, command })));
  return [
    "+------------------------------------------------------+",
    "| VTK://COMMAND-COCKPIT//LOCAL-FIRST//VIBERS-UNITE     |",
    "|------------------------------------------------------|",
    `| ${fit("safe preview: no provider calls, writes, uploads", 52)} |`,
    `| ${fit("trust and preview rails stay NOT USAGE", 52)} |`,
    `| ${fit(payload.motto, 52)} |`,
    `| ${fit("proof path: preview -> collect -> review -> publish", 52)} |`,
    "| commands                                             |",
    ...flat.map(({ command }) =>
      `| ${fit(command.rail, 10)} ${fit(command.command, 39)} |`,
    ),
    "+------------------------------------------------------+",
  ].join("\n");
}

function commandSequencerHtml(): string {
  const sequence = [
    ["01", "FIRST RUN", "init --gui", "setup", "terminal GUI opens; keys stay masked"],
    ["02", "PREVIEW", "doctor + surprises", "not_usage", "safe art and checks; no provider calls"],
    ["03", "LOCAL", "detect", "local", "Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, and vLLM stay on-machine"],
    ["04", "COLLECT", "sync", "usage", "provider adapters validate before ledger writes"],
    ["05", "REVIEW", "audit", "privacy", "source mix, trust rails, and gaps before sharing"],
    ["06", "DRY RUN", "upload --dry-run", "privacy", "exact outbound aggregate preview"],
    ["07", "C0VIBE", "upload", "publish", "publish only reviewed aggregates to c0vibe.app"],
  ];
  return sequence.map(([step, rail, command, impact, note], index) => `<article class="seq-step" data-impact="${esc(impact)}" style="--i:${index}">
      <span>${esc(step)}</span>
      <b>${esc(rail)}</b>
      <code>${esc(command)}</code>
      <p>${esc(note)}</p>
    </article>`).join("");
}

export function renderCommandCockpitHtml(): string {
  const payload = commandCockpitPayload();
  const terminal = renderCommandCockpit();
  const sequencer = commandSequencerHtml();
  const laneHtml = payload.lanes.map((lane, laneIndex) => `<section class="lane" style="--lane:${laneIndex}">
    <div class="lane-head"><span>${esc(lane.id)}</span><b>${esc(lane.label)}</b><em>${esc(lane.detail)}</em></div>
    <div class="cards">${lane.commands.map((command, index) => commandCard(command, index)).join("")}</div>
  </section>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Command Cockpit</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#071014;--line:rgba(223,255,248,.14);--ink:#edfff9;--muted:#91aaa4;--cyan:#2ee8d6;--green:#36e39b;--pink:#ff4fd8;--gold:#ffc64d;--blue:#7c9cff;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;color:var(--ink);background:radial-gradient(circle at 12% 20%,rgba(46,232,214,.14),transparent 26%),radial-gradient(circle at 82% 16%,rgba(255,79,216,.12),transparent 24%),linear-gradient(135deg,#040607,#071014 54%,#05080a);font:13px/1.45 ui-sans-serif,system-ui,sans-serif}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.026) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(180deg,#000,transparent 86%)}
  main{width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:28px 0 42px}.hero{display:grid;grid-template-columns:minmax(0,.9fr) minmax(330px,1.1fr);gap:14px;min-height:500px}.panel,.terminal,.lane,.cmd,.sequencer,.seq-step{position:relative;border:1px solid var(--line);background:linear-gradient(180deg,rgba(8,16,20,.93),rgba(4,7,9,.97));box-shadow:0 30px 90px -70px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel{display:flex;flex-direction:column;justify-content:space-between;border-radius:12px;padding:22px}.panel::after,.terminal::after,.cmd::after,.sequencer::after,.seq-step::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 58%);transform:translateX(-95%);animation:sweep 5.2s var(--motion) infinite;pointer-events:none}
  .eyebrow{color:var(--green);font:900 11px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em}.hero h1{margin:0;color:#f6fff9;font:950 clamp(38px,7vw,86px)/.88 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0;text-shadow:0 0 40px rgba(46,232,214,.24)}.hero p{max-width:58ch;color:#c3ddd6;font-size:15px}.guard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guard span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:9px;color:#bff8e5;font:850 10px/1.2 ui-monospace,Menlo,monospace;text-transform:uppercase}
  .terminal{border-radius:12px;padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font:850 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:430px;padding:12px;border:1px solid rgba(46,232,214,.12);background:#030708;color:#dffef6;font:850 11px/1.25 ui-monospace,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}
  .sequencer{display:grid;grid-template-columns:260px minmax(0,1fr);gap:1px;margin-top:14px;border-radius:12px}.sequencer-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:12px;padding:14px;background:rgba(5,10,12,.84)}.sequencer-head span{color:var(--green);font:950 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.sequencer-head b{color:#f6fff9;font:950 24px/.95 ui-monospace,Menlo,monospace;text-transform:uppercase}.sequencer-head p{margin:0;color:#c3ddd6;font-size:12px;line-height:1.35}.seq-track{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}.seq-step{--tone:var(--cyan);min-height:178px;padding:11px;border-width:0 0 0 1px;box-shadow:none;background:linear-gradient(160deg,color-mix(in srgb,var(--tone) 12%,rgba(8,16,20,.93)),rgba(4,7,9,.97));animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.seq-step::before{content:"";position:absolute;left:11px;right:11px;bottom:11px;height:3px;background:linear-gradient(90deg,var(--tone),#f6fff9);transform-origin:left;animation:seqFill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 130ms)}.seq-step[data-impact="setup"]{--tone:var(--cyan)}.seq-step[data-impact="usage"]{--tone:var(--green)}.seq-step[data-impact="not_usage"]{--tone:var(--gold)}.seq-step[data-impact="privacy"]{--tone:var(--pink)}.seq-step[data-impact="publish"]{--tone:var(--green)}.seq-step[data-impact="local"]{--tone:var(--blue)}.seq-step>*{position:relative;z-index:1}.seq-step span{display:grid;place-items:center;width:34px;height:28px;color:#04100b;background:var(--tone);font:950 11px/1 ui-monospace,Menlo,monospace}.seq-step b{display:block;margin-top:10px;color:#f6fff9;font:950 11px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.seq-step code{display:block;margin-top:8px;padding:6px;border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);background:rgba(0,0,0,.22);color:#dffef6;font:850 10px/1.22 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}.seq-step p{margin:8px 0 0;color:#bedad2;font-size:11px;line-height:1.32}
  .lane{margin-top:14px;border-radius:12px;padding:12px}.lane-head{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,1.4fr);gap:10px;align-items:center;margin-bottom:10px}.lane-head span{color:var(--green);font:900 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.lane-head b{color:#f4fff9;font:950 16px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.lane-head em{font-style:normal;color:var(--muted);font-size:12px}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cmd{--tone:var(--cyan);border-radius:10px;padding:10px;min-height:238px;animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 70ms);box-shadow:0 24px 82px -64px var(--tone),inset 0 1px 0 rgba(255,255,255,.07)}.cmd::before{content:"";position:absolute;left:0;right:40%;top:0;height:1px;background:linear-gradient(90deg,var(--tone),transparent)}.cmd[data-impact="setup"]{--tone:var(--cyan)}.cmd[data-impact="usage"]{--tone:var(--green)}.cmd[data-impact="not_usage"]{--tone:var(--gold)}.cmd[data-impact="privacy"]{--tone:var(--pink)}.cmd[data-impact="publish"]{--tone:var(--green)}.cmd[data-impact="local"]{--tone:var(--blue)}.cmd-top,.cmd-screen,.cmd p,.cmd code,.cmd small{position:relative;z-index:1}.cmd-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#f4fff9;font:900 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.cmd-top span{color:var(--tone)}.cmd-screen{height:72px;margin:10px 0;border:1px solid rgba(255,255,255,.09);background:#030708;overflow:hidden}.cmd-screen pre{position:absolute;inset:9px;color:#eafff8;text-align:center;font:950 14px/1.05 ui-monospace,Menlo,monospace;text-shadow:0 0 18px color-mix(in srgb,var(--tone) 42%,transparent);opacity:0;animation:frame 4.8s steps(1,end) infinite;animation-delay:calc(var(--frame) * 1.6s)}.cmd p{margin:0 0 8px;color:#bedad2;font-size:12px}.cmd code{display:block;padding:7px;border:1px solid rgba(46,232,214,.14);background:rgba(46,232,214,.05);color:#dffef6;font:800 10px/1.25 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}.cmd small{display:block;margin-top:8px;color:var(--gold);font:850 10px/1.2 ui-monospace,Menlo,monospace;text-transform:uppercase}
  footer{margin-top:14px;color:var(--muted);font:800 11px/1.4 ui-monospace,Menlo,monospace}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(95%)}}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes frame{0%,32%{opacity:1}33%,100%{opacity:0}}@keyframes seqFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@media (max-width:1180px){.seq-track{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (max-width:980px){.hero,.sequencer{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.lane-head{grid-template-columns:1fr}.terminal pre{min-height:320px}.seq-track{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:560px){main{width:min(100vw - 18px,1180px);padding-top:12px}.cards,.guard,.seq-track{grid-template-columns:1fr}.hero h1{font-size:42px}.terminal pre{font-size:9px}.panel{padding:16px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.cmd-screen pre:first-child{opacity:1}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER command cockpit">
    <section class="hero">
      <div class="panel">
        <div class="eyebrow">VTK://COMMAND-COCKPIT//STATIC-GUI//LOCAL-FIRST</div>
        <h1>Command<br>Cockpit</h1>
        <p>A script-free operating surface for the VibeTRACKER command path: first run, safe previews, local collection, proof review, dry-run, and c0vibe.app publish.</p>
        <div class="guard">
          <span>usage writes only after sync</span>
          <span>doctor/surprises are NOT USAGE</span>
          <span>dry-run before publish</span>
          <span>Vibers Unite // c0vibe.app</span>
        </div>
      </div>
      <section class="terminal" aria-label="Command cockpit terminal">
        <div class="terminal-top"><span>commands@vibetracker</span><b>LOCAL CONTROL</b></div>
        <pre>${esc(terminal)}</pre>
      </section>
    </section>
    <section class="sequencer" aria-label="Command proof path sequencer">
      <div class="sequencer-head">
        <span>VTK://COMMAND-SEQUENCER//PROOF-PATH//NO-AUTORUN</span>
        <b>Proof Path Sequencer</b>
        <p>Recommended operator order only. Nothing runs from this page: safe preview first, local collection second, dry-run review before publish.</p>
      </div>
      <div class="seq-track">${sequencer}</div>
    </section>
    ${laneHtml}
    <footer><span class="accent">Static file:</span> no JavaScript, no provider calls, no writes, no uploads, no secret reads. Use the terminal command shown on each card when ready.</footer>
  </main>
</body>
</html>`;
}

function commandCard(command: CockpitCommand, index: number): string {
  const frames = command.frames.map((item, frameIndex) =>
    `<pre style="--frame:${frameIndex}">${esc(item)}</pre>`,
  ).join("");
  return `<article class="cmd" data-impact="${esc(command.impact)}" style="--i:${index}">
    <div class="cmd-top"><span>${esc(command.rail)}</span><b>${esc(command.label)}</b></div>
    <div class="cmd-screen">${frames}</div>
    <p>${esc(command.note)}</p>
    <code>${esc(command.command)}</code>
    <small>${esc(command.surprise)}</small>
  </article>`;
}
