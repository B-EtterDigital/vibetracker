import Globe from "ascii-globe";
import spinners from "cli-spinners";
import DrawilleCanvas from "drawille";

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

export interface OssMotionSource {
  id: string;
  label: string;
  project: string;
  author: string;
  license: string;
  role: string;
  guardrail: string;
  frames: string[];
}

export interface OssMotionReceipt {
  schema: "vibetracker.oss-motion-receipt/0.1";
  title: string;
  motto: string;
  safePreview: true;
  providerCalls: false;
  usageWrites: false;
  uploads: false;
  scripts: false;
  sources: OssMotionSource[];
  terminalLines: string[];
}

function seedFrom(input: string): number {
  return Array.from(input).reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
}

function brailleFrame(seedText: string): string {
  const width = 32;
  const height = 16;
  const canvas = new DrawilleCanvas(width, height);
  let seed = seedFrom(seedText);
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let x = 0; x < width; x += 1) {
    const wave = Math.sin((x / (width - 1)) * Math.PI * 2);
    canvas.set(x, Math.round(height / 2 + wave * 5));
  }
  for (let i = 0; i < 26; i += 1) {
    const x = next() % width;
    const y = next() % height;
    canvas.set(x, y);
    if (i % 5 === 0) canvas.set(Math.min(width - 1, x + 1), y);
  }
  return canvas.frame("\n").split("\n").filter((line) => line.trim()).slice(0, 5).join("\n");
}

function globeFrames(): string[] {
  const globe = new Globe({
    size: 0.22,
    land: "#",
    water: ".",
    background: " ",
    pin: "*",
    tilt: 18,
    pins: [
      { lat: 37.77, long: -122.42, char: "C" },
      { lat: 52.52, long: 13.4, char: "E" },
      { lat: 35.68, long: 139.69, char: "A" },
      { lat: 1.35, long: 103.82, char: "L" },
    ],
  });
  return [0, 90, 180, 270].map((rotation) => globe.render([rotation, 8]).trimEnd());
}

function spinnerFrames(): string[] {
  const frames = spinners.dots?.frames ?? ["|", "/", "-", "\\"];
  return frames.slice(0, 8).map((glyph, index) => `${glyph} frame ${String(index + 1).padStart(2, "0")}  HF -> CX -> OL -> C0`);
}

function fit(value: string, width: number): string {
  return value.length > width ? value.slice(0, width) : value.padEnd(width);
}

function terminalLine(value: string): string {
  return `| ${fit(value, 62)} |`;
}

export function buildOssMotionReceipt(): OssMotionReceipt {
  const sources: OssMotionSource[] = [
    {
      id: "cli-spinners",
      label: "Spinner cadence",
      project: "cli-spinners",
      author: "Sindre Sorhus",
      license: "MIT",
      role: "Provider queue rhythm and terminal loading cadence.",
      guardrail: "Spinner frames are feedback only; accepted usage records decide totals.",
      frames: spinnerFrames(),
    },
    {
      id: "ascii-globe",
      label: "World source globe",
      project: "ascii-globe",
      author: "Jakub T. Jankiewicz",
      license: "MIT",
      role: "Global provider coverage preview for creator, regional, and local rails.",
      guardrail: "Globe frames do not imply location tracking or account calls.",
      frames: globeFrames(),
    },
    {
      id: "drawille",
      label: "Braille signal field",
      project: "drawille",
      author: "Bence Danyi",
      license: "MIT",
      role: "Dense Unicode signal texture for scan rooms and proof meters.",
      guardrail: "Braille texture is decorative telemetry, not a usage source.",
      frames: [brailleFrame("VibeTRACKER // Vibers Unite // c0vibe.app")],
    },
  ];
  return {
    schema: "vibetracker.oss-motion-receipt/0.1",
    title: "OSS Motion Receipt",
    motto: "Vibers Unite // c0vibe.app",
    safePreview: true,
    providerCalls: false,
    usageWrites: false,
    uploads: false,
    scripts: false,
    sources,
    terminalLines: [
      "+----------------------------------------------------------------+",
      terminalLine("VTK://OSS-MOTION-RECEIPT//REAL-LIB-FRAMES//NO-SIDEFX"),
      "|----------------------------------------------------------------|",
      terminalLine("cli-spinners frames drive the provider queue cadence"),
      terminalLine("ascii-globe renders the world source preview"),
      terminalLine("drawille renders the braille signal field"),
      terminalLine("providerCalls=0 usageWrites=0 uploads=0 scripts=0"),
      terminalLine("credits are visible; runtime frames stay local and offline"),
      terminalLine("Vibers Unite // c0vibe.app"),
      "+----------------------------------------------------------------+",
    ],
  };
}

export function renderOssMotionReceiptHtml(): string {
  const receipt = buildOssMotionReceipt();
  const cards = receipt.sources.map((source, index) => `<article class="source source--${esc(source.id)}" style="--i:${index}">
      <div class="source-top">
        <span>${esc(source.license)}</span>
        <b>${esc(source.label)}</b>
      </div>
      <div class="frame-stack" aria-label="${esc(source.project)} generated frames">
        ${source.frames.map((frame, frameIndex) => `<pre style="--frame:${frameIndex}">${esc(frame)}</pre>`).join("")}
      </div>
      <code>${esc(source.project)} · ${esc(source.author)}</code>
      <p>${esc(source.role)}</p>
      <small>${esc(source.guardrail)}</small>
    </article>`).join("");
  const safety = [
    ["providerCalls", receipt.providerCalls],
    ["usageWrites", receipt.usageWrites],
    ["uploads", receipt.uploads],
    ["scripts", receipt.scripts],
  ].map(([label, value]) => `<span>${esc(label)} <b>${value ? "YES" : "NO"}</b></span>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER OSS Motion Receipt</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 14% 16%,rgba(46,232,214,.16),transparent 26%),radial-gradient(circle at 82% 10%,rgba(255,79,216,.12),transparent 24%),radial-gradient(circle at 52% 100%,rgba(54,227,155,.1),transparent 30%);mix-blend-mode:screen}
  main{width:min(1240px,calc(100vw - 28px));margin:0 auto;padding:26px 0 44px}.hero{display:grid;grid-template-columns:minmax(300px,.72fr) minmax(0,1.28fr);gap:1px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.07);box-shadow:0 46px 130px -96px var(--cyan),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.copy,.terminal{min-height:430px;background:#050708}.copy{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 22% 18%,rgba(46,232,214,.15),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#050708)}.eyebrow{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.copy h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(36px,5.8vw,78px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24);overflow-wrap:anywhere}.copy p{max-width:58ch;margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.safety{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.safety span{border:1px solid rgba(54,227,155,.18);padding:8px;background:rgba(0,0,0,.24);color:#bff8e5;font-size:9px;font-weight:950;text-transform:uppercase}.safety b{float:right;color:var(--green)}.terminal{position:relative;padding:12px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.terminal::after{content:"";position:absolute;left:12px;right:12px;top:70px;height:34px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.18),rgba(54,227,155,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.23 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.terminal pre{min-height:342px}.sources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:14px;background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:14px;overflow:hidden}.source{position:relative;display:grid;grid-template-rows:auto minmax(190px,1fr) auto auto auto;gap:10px;min-height:430px;padding:14px;background:linear-gradient(145deg,rgba(46,232,214,.11),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 90ms)}.source--ascii-globe{background:linear-gradient(145deg,rgba(255,198,77,.12),#05080a)}.source--drawille{background:linear-gradient(145deg,rgba(255,79,216,.11),#05080a)}.source::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold),var(--pink));transform-origin:left;animation:fill .9s var(--motion) forwards;animation-delay:calc(180ms + var(--i) * 100ms)}.source-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.source-top span{color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.source-top b{color:#f8fff9;font-size:16px;text-transform:uppercase}.frame-stack{position:relative;min-height:190px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.28);overflow:hidden}.frame-stack::before{content:"";position:absolute;inset:auto 0 0 0;height:32px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.2),transparent);animation:scan 4.1s var(--motion) infinite}.frame-stack pre{position:absolute;inset:0;display:grid;place-items:center;border:0;background:transparent;opacity:0;animation:frame 8s var(--motion) infinite;animation-delay:calc(var(--frame) * 1.8s);text-align:center}.frame-stack pre:first-child{opacity:1}.source code{color:#ffe7a3;border:1px solid rgba(255,198,77,.16);padding:7px;background:rgba(255,198,77,.06);overflow-wrap:anywhere}.source p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}.source small{color:#bff8e5;overflow-wrap:anywhere}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(300px)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{to{transform:none}}@keyframes frame{0%,22%{opacity:1;transform:perspective(300px) rotateY(0)}28%,100%{opacity:0;transform:perspective(300px) rotateY(16deg)}}@media(max-width:980px){.hero,.sources{grid-template-columns:1fr}.copy,.terminal{min-height:320px}.source{min-height:340px}}@media(max-width:560px){main{width:min(100vw - 18px,1240px);padding-top:12px}.copy h1{font-size:40px}.safety{grid-template-columns:1fr}.terminal pre,.frame-stack pre{font-size:8px}.frame-stack{min-height:160px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.source::after{transform:none}.frame-stack pre{opacity:0;transform:none}.frame-stack pre:first-child{opacity:1}.frame-stack::before{display:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER OSS motion receipt">
  <section class="hero">
    <div class="copy">
      <div>
        <div class="eyebrow">VTK://OSS-MOTION-RECEIPT//LOCAL-LIBS//NO-SIDEFX</div>
        <h1>OSS<br>Motion<br>Receipt</h1>
        <p>Proof that the terminal motion is not only credited in text: this page is rendered from integrated local library output for spinner cadence, ASCII globe frames, and drawille braille texture.</p>
      </div>
      <div class="safety" aria-label="OSS motion safety flags">${safety}</div>
    </div>
    <aside class="terminal" aria-label="OSS motion terminal">
      <div class="top"><span>${esc(receipt.schema)}</span><b>Vibers Unite</b></div>
      <pre>${esc(receipt.terminalLines.join("\n"))}</pre>
    </aside>
  </section>
  <section class="sources" aria-label="OSS motion source cards">${cards}</section>
  <footer><span class="accent">Static, script-free, offline:</span> frames are generated at pack creation from installed OSS libraries, then written as plain HTML. They do not collect usage or move trust into spend.</footer>
</main>
</body>
</html>`;
}
