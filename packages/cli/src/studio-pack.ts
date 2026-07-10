import { renderAsciiMotionLabHtml } from "./ascii-motion-lab.ts";
import { renderCommandCockpitHtml } from "./command-cockpit.ts";
import { LOCAL_ENDPOINTS, renderLocalDetectionHtml } from "./detect.ts";
import { renderGitHubTrustHeatgridHtml } from "./github-trust-heatgrid.ts";
import { renderOssMotionReceiptHtml } from "./oss-motion-receipt.ts";
import { providerBrand } from "./provider-brand.ts";
import { renderShowcaseHtml } from "./showcase.ts";
import { renderSurpriseFlightRecorderHtml, renderSyncSurpriseDirectorHtml } from "./sync-surprises.ts";
import { renderVibeScoreReactorHtml } from "./vibe-score-reactor.ts";
import { renderVibersUniteRoomHtml } from "./vibers-unite-room.ts";
import { renderWizardRunwayHtml } from "./wizard-runway.ts";

export interface StudioPackOptions {
  providerIds?: string[];
}

export interface StudioPackFile {
  path: string;
  label: string;
  description: string;
  content: string;
}

export interface StudioPackManifestFile {
  path: string;
  label: string;
  description: string;
}

export interface StudioPackManifest {
  schema: "vibetracker.studio-pack/0.1";
  title: string;
  motto: string;
  safePreview: true;
  writes: false;
  uploads: false;
  providerCalls: false;
  secretsRead: false;
  files: StudioPackManifestFile[];
}

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

const studioEntries = [
  {
    path: "boot-panorama.html",
    label: "Boot Panorama",
    rail: "BOOT",
    description: "First-open offline command room with terminal handoff, scan theatre, proof boundary, trust side rail, and C0VIBE relay.",
  },
  {
    path: "vibers-unite-room.html",
    label: "Vibers Unite Room",
    rail: "UNITE",
    description: "High-impact first-open room combining terminal GUI, provider orbit, trust heatgrid, score datastream, and C0VIBE publish hold.",
  },
  {
    path: "showcase.html",
    label: "Offline Showcase",
    rail: "OVERVIEW",
    description: "The full terminal-to-GUI proof surface with source rails, trust boundaries, credits, and c0vibe.app handoff.",
  },
  {
    path: "surprise-reel.html",
    label: "Surprise Reel",
    rail: "THEATRE",
    description: "Provider-branded ASCII motion for Higgsfield, Codex, local AI, creators, regional adapters, and C0VIBE relay.",
  },
  {
    path: "ascii-motion-lab.html",
    label: "ASCII Motion Lab",
    rail: "MOTION",
    description: "Script-free research-backed motion lab with runtime-safe rigs, Linux terminal references, and visible attribution.",
  },
  {
    path: "github-trust-heatgrid.html",
    label: "GitHub Trust Heatgrid",
    rail: "TRUST",
    description: "Script-free official GitHub color contribution replay labelled as NOT USAGE trust evidence.",
  },
  {
    path: "vibe-score-reactor.html",
    label: "Vibe Score Reactor",
    rail: "SCORE",
    description: "Script-free score reactor showing usage datastream factors, profile lineage, heatgrid outputs, and trust quarantine.",
  },
  {
    path: "oss-motion-receipt.html",
    label: "OSS Motion Receipt",
    rail: "CREDITS",
    description: "Generated cli-spinners, ascii-globe, and drawille frames with visible attribution and zero-side-effect labels.",
  },
  {
    path: "flight-recorder.html",
    label: "Flight Recorder",
    rail: "RECORDER",
    description: "Replayable scan surprise tape proving phase, provider mark, rail, and visual-only safety boundaries.",
  },
  {
    path: "wizard-runway.html",
    label: "Wizard Runway",
    rail: "RUNWAY",
    description: "Script-free first-run terminal-to-GUI scan room with labelled usage, trust, local, privacy, and publish rails.",
  },
  {
    path: "local-ai-radar.html",
    label: "Local AI Radar",
    rail: "LOCAL",
    description: "Script-free preview shell for the live local endpoint radar; run detect --html for exact loopback proof.",
  },
  {
    path: "command-cockpit.html",
    label: "Command Cockpit",
    rail: "CONTROL",
    description: "First-run, doctor, surprise reel, detect, sync, audit, dry-run, and upload commands in one local control room.",
  },
  {
    path: "manifest.json",
    label: "Manifest",
    rail: "PROOF",
    description: "Machine-readable safety flags for the generated static pack.",
  },
] as const;

export function renderStudioBootPanoramaHtml(providerIds: string[] = ["higgsfield", "codex-cli", "ollama", "qwen", "mistral", "c0vibe"]): string {
  const wanted = providerIds.length ? providerIds : ["higgsfield", "codex-cli", "ollama", "qwen", "mistral", "c0vibe"];
  const brands = Array.from(new Set([...wanted, "c0vibe"])).slice(0, 8).map((id) => providerBrand(id));
  const marks = brands.map((brand, index) => `<span style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}" title="${esc(brand.label)}">${esc(brand.mark)}</span>`).join("");
  const rails = [
    ["LOCAL", "Terminal handoff", "npx vibetrack init --gui", "CLI charm stays visible inside the GUI. providerCalls=0 hiddenUpload=0", "VT"],
    ["USAGE", "Branded scan theatre", "vibetracker scan --dry-run", "Higgsfield, creator, local, regional, and C0VIBE beats are staged before rows are accepted.", "HF"],
    ["PRIVACY", "Proof boundary", "vibetracker sync --dry-run --receipt", "No prompt text, output text, secrets, or raw files leave the machine in this preview.", "PR"],
    ["NOT USAGE", "Trust side rail", "vibetracker trust --collect", "GitHub, Codex, creator cadence, and MCP connection evidence never change spend or rank.", "NO"],
    ["PUBLISH", "C0VIBE relay", "vibetracker upload --review", "Profile, score, heatgrid, and public relay only move after explicit review.", "C0"],
  ].map(([impact, label, command, copy, mark], index) => `<article class="rail" data-impact="${esc(impact)}" style="--i:${index}">
        <div><i>${esc(mark)}</i><span>${esc(impact)}</span></div>
        <b>${esc(label)}</b>
        <code>${esc(command)}</code>
        <p>${esc(copy)}</p>
        <em><strong></strong></em>
      </article>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Boot Panorama</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f4fffb;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 14% 18%,rgba(46,232,214,.16),transparent 26%),radial-gradient(circle at 86% 10%,rgba(255,198,77,.12),transparent 24%),linear-gradient(115deg,transparent,rgba(54,227,155,.05),transparent);mix-blend-mode:screen;opacity:.9}
  main{width:min(1260px,calc(100vw - 28px));margin:0 auto;padding:24px 0 42px}.shell{position:relative;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(7,16,19,.96),rgba(4,7,9,.99));box-shadow:0 46px 130px -92px var(--cyan),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.shell::before{content:"";position:absolute;left:0;right:12%;top:0;height:1px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold),var(--pink),transparent)}.head{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.72fr) minmax(280px,.58fr);gap:14px;align-items:center;padding:14px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(46,232,214,.1),rgba(54,227,155,.075),rgba(255,198,77,.06))}.head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.head h1{margin:8px 0 0;color:#f8fff9;font:950 clamp(34px,5.6vw,74px)/.9 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 40px rgba(46,232,214,.24)}.head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif}.body{display:grid;grid-template-columns:minmax(330px,.62fr) minmax(240px,.42fr) minmax(0,1.36fr);gap:1px;background:rgba(255,255,255,.07)}.term,.radar,.rails{min-height:438px;background:#050708}.term{position:relative;padding:12px;overflow:hidden;background:radial-gradient(circle at 22% 0,rgba(46,232,214,.15),transparent 32%),repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 16px),#050708}.term::after{content:"";position:absolute;left:12px;right:12px;top:54px;height:30px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.15),rgba(54,227,155,.11),transparent);animation:scan 4.1s var(--motion) infinite;pointer-events:none}.top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 0 10px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:12px;border:1px solid rgba(46,232,214,.14);border-radius:9px;background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.28 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.15);overflow:auto}.seals{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.seals span{border:1px solid rgba(46,232,214,.22);border-radius:999px;padding:5px 8px;background:rgba(0,0,0,.26);color:#d9fff2;font-size:9px;font-weight:950;text-transform:uppercase}.radar{position:relative;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 45%,rgba(46,232,214,.14),transparent 34%),linear-gradient(180deg,rgba(5,13,14,.98),#050708)}.radar::before,.radar::after{content:"";position:absolute;inset:24px;border:1px solid rgba(46,232,214,.16);border-radius:50%;box-shadow:inset 0 0 30px rgba(46,232,214,.05)}.radar::after{inset:62px;border-color:rgba(255,198,77,.18);animation:turn 9s linear infinite}.radar strong{position:relative;z-index:1;display:grid;place-items:center;width:78px;height:78px;border-radius:50%;color:#071013;background:radial-gradient(circle at 35% 20%,#d9fff2,var(--cyan) 52%,var(--green));font:1000 26px/1 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 0 34px -12px var(--cyan)}.marks{position:absolute;inset:0}.marks span{position:absolute;display:grid;place-items:center;width:46px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:9px;color:var(--ink);background:linear-gradient(135deg,var(--from),var(--to));font-weight:1000;animation:float 5.8s var(--motion) infinite;animation-delay:calc(var(--i) * -.42s)}.marks span:nth-child(1){left:12%;top:18%}.marks span:nth-child(2){right:12%;top:22%}.marks span:nth-child(3){left:14%;bottom:20%}.marks span:nth-child(4){right:16%;bottom:18%}.marks span:nth-child(5){left:42%;top:9%}.marks span:nth-child(6){left:44%;bottom:9%}.marks span:nth-child(7){left:4%;top:48%}.marks span:nth-child(8){right:4%;top:49%}.rails{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.07)}.rail{position:relative;display:grid;grid-template-rows:auto auto auto 1fr auto;gap:9px;min-height:438px;padding:12px;background:linear-gradient(145deg,rgba(46,232,214,.12),#05080a);overflow:hidden;animation:rise .56s var(--motion) both;animation-delay:calc(var(--i) * 80ms)}.rail[data-impact="USAGE"]{background:linear-gradient(145deg,rgba(255,79,216,.14),#05080a)}.rail[data-impact="PRIVACY"]{background:linear-gradient(145deg,rgba(255,198,77,.13),#05080a)}.rail[data-impact="NOT USAGE"]{background:repeating-linear-gradient(-45deg,rgba(255,198,77,.07) 0 1px,transparent 1px 9px),linear-gradient(145deg,rgba(255,79,216,.11),#05080a)}.rail[data-impact="PUBLISH"]{background:linear-gradient(145deg,rgba(54,227,155,.13),#05080a)}.rail::after{content:attr(data-impact);position:absolute;right:8px;bottom:12px;color:rgba(217,255,242,.08);font:1000 19px/.9 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}.rail div{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center}.rail i{display:grid;place-items:center;width:32px;height:28px;border-radius:8px;color:#071013;background:linear-gradient(135deg,var(--cyan),var(--green));font-style:normal;font-weight:1000}.rail span{color:var(--gold);font-size:8px;font-weight:1000}.rail b,.rail code,.rail p,.rail em{position:relative;z-index:1}.rail b{font-size:13px;text-transform:uppercase}.rail code{color:#dffef6;border:1px solid rgba(255,255,255,.09);border-radius:7px;padding:7px;background:rgba(0,0,0,.24);overflow-wrap:anywhere}.rail p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.rail em{display:block;height:8px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:#030708;overflow:hidden}.rail em strong{display:block;width:96%;height:100%;background:linear-gradient(90deg,var(--cyan),var(--green));transform-origin:left center;transform:scaleX(0);animation:fill .85s var(--motion) forwards;animation-delay:calc(160ms + var(--i) * 80ms)}footer{margin-top:12px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(240px)}}@keyframes turn{to{transform:rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{to{transform:none}}@media(max-width:1040px){.body{grid-template-columns:1fr}.term,.radar,.rails{min-height:320px}.rails{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){main{width:min(100vw - 18px,1260px);padding-top:10px}.head{grid-template-columns:1fr}.head h1{font-size:38px}.term pre{font-size:8px}.seals{display:grid}.rails{grid-template-columns:1fr}.rail{min-height:250px}.radar{min-height:250px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.rail em strong{transform:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER boot panorama">
  <section class="shell">
    <div class="head">
      <div>
        <span>VTK://BOOT-PANORAMA//OFFLINE-STUDIO//NO-FAKE-USAGE</span>
        <h1>Boot<br>Panorama</h1>
      </div>
      <p>Open this first when demoing VibeTRACKER offline: it shows the terminal handoff, branded scan theatre, proof boundary, trust side rail, and C0VIBE relay without collecting anything.</p>
    </div>
    <div class="body">
      <aside class="term" aria-label="Boot panorama terminal">
        <div class="top"><span>boot@studio</span><b>Vibers Unite</b></div>
        <pre>+--------------------------------------------------------------+
| VTK://BOOT-PANORAMA//TERMINAL-GUI//C0VIBE.APP              |
|--------------------------------------------------------------|
| terminal handoff     npx vibetrack init --gui                |
| branded scan theatre vibetracker scan --dry-run              |
| proof boundary       sync --dry-run --receipt                |
| trust side rail      trust signals are NOT USAGE             |
| C0VIBE relay         upload only after explicit review        |
|                                                              |
| providerCalls 0  ledgerWrites 0  hiddenUploads 0             |
| promptReads   0  outputReads  0  secretsRead   0             |
|                                                              |
| Motto: Vibers Unite // c0vibe.app                            |
+--------------------------------------------------------------+</pre>
        <div class="seals" aria-label="Boot panorama zero side effect seals">
          <span>providerCalls 0</span>
          <span>ledgerWrites 0</span>
          <span>hiddenUpload 0</span>
          <span>promptReads 0</span>
          <span>outputReads 0</span>
        </div>
      </aside>
      <section class="radar" aria-label="Provider mark radar">
        <div class="marks">${marks}</div>
        <strong>C0</strong>
      </section>
      <section class="rails" aria-label="Boot panorama proof rails">${rails}</section>
    </div>
  </section>
  <footer><span class="accent">Static, script-free, offline:</span> visual theatre only. Real usage starts only when the user runs sync after connecting sources.</footer>
</main>
</body>
</html>`;
}

export function studioPackManifest(files: StudioPackFile[]): StudioPackManifest {
  return {
    schema: "vibetracker.studio-pack/0.1",
    title: "VibeTRACKER Studio Pack",
    motto: "Vibers Unite // c0vibe.app",
    safePreview: true,
    writes: false,
    uploads: false,
    providerCalls: false,
    secretsRead: false,
    files: files.map(({ path, label, description }) => ({ path, label, description })),
  };
}

export function renderStudioPackIndex(files: StudioPackManifestFile[]): string {
  const cards = studioEntries.map((entry, index) => {
    const file = files.find((item) => item.path === entry.path) ?? entry;
    return `<a class="card" href="${esc(entry.path)}" style="--i:${index}" data-rail="${esc(entry.rail)}">
        <span>${esc(entry.rail)}</span>
        <b>${esc(file.label)}</b>
        <small>${esc(file.description)}</small>
      </a>`;
  }).join("");
  const commandMap = studioEntries.map((entry, index) => {
    const file = files.find((item) => item.path === entry.path) ?? entry;
    return `<a class="map-row" href="${esc(entry.path)}" style="--i:${index}" data-rail="${esc(entry.rail)}">
        <span>${String(index).padStart(2, "0")} ${esc(entry.rail)}</span>
        <b>${esc(file.label)}</b>
        <code>${esc(entry.path)}</code>
        <p>${esc(file.description)}</p>
      </a>`;
  }).join("");
  const safetyMatrix = [
    ["providerCalls", "0", "preview never phones adapters"],
    ["ledgerWrites", "0", "no local records are mutated"],
    ["uploads", "0", "c0vibe.app waits for review"],
    ["secretsRead", "0", "no key or token inspection"],
    ["scripts", "0", "plain static HTML"],
    ["fakeUsage", "0", "sample theatre stays labelled"],
  ].map(([label, value, detail], index) => `<article class="matrix-cell" style="--i:${index}">
      <span>${esc(label)}</span>
      <b>${esc(value)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Studio Pack</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.024) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 14% 18%,rgba(46,232,214,.16),transparent 26%),radial-gradient(circle at 86% 10%,rgba(255,79,216,.12),transparent 24%),linear-gradient(115deg,transparent,rgba(54,227,155,.05),transparent);mix-blend-mode:screen;opacity:.9}
  main{width:min(1220px,calc(100vw - 28px));margin:0 auto;padding:28px 0 44px}.stage{position:relative;display:grid;grid-template-columns:minmax(0,.82fr) minmax(340px,1.18fr);gap:14px;min-height:620px}.panel,.term,.card,.rail,.mission,.map-row,.matrix-cell{position:relative;min-width:0;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 32px 96px -72px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel,.term,.mission{border-radius:12px}.panel{display:flex;flex-direction:column;justify-content:space-between;padding:22px}.panel::after,.term::after,.card::after,.rail::after,.mission::after,.map-row::after,.matrix-cell::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.11) 50%,transparent 59%);transform:translateX(-96%);animation:sweep 5.6s var(--motion) infinite;pointer-events:none}.eyebrow{color:var(--green);font-weight:950;text-transform:uppercase;font-size:11px}.panel h1{margin:10px 0 14px;color:#f8fff9;font:950 clamp(38px,7.2vw,90px)/.88 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24)}.panel p{max-width:59ch;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px}.stamp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:18px 0}.stamp span{min-height:76px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);font-size:clamp(22px,4vw,48px);font-weight:950;color:var(--cyan);text-shadow:0 0 20px rgba(46,232,214,.45);animation:turn 5.8s var(--motion) infinite}.stamp span:nth-child(2){color:var(--pink);animation-delay:-1.6s}.stamp span:nth-child(3){color:var(--green);animation-delay:-3.2s}.guards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guards span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:9px;color:#bff8e5;font-size:10px;font-weight:900;text-transform:uppercase}
  .term{padding:10px}.term-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase}.term-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.term pre{min-height:558px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:900 11px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px}.card{display:grid;align-content:start;gap:9px;min-height:166px;padding:13px;border-radius:10px;color:inherit;text-decoration:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 75ms)}.card:nth-child(1){--tone:var(--cyan)}.card:nth-child(2){--tone:var(--pink)}.card:nth-child(3){--tone:var(--gold)}.card:nth-child(4){--tone:var(--green)}.card:nth-child(5){--tone:var(--violet)}.card:nth-child(6){--tone:var(--red)}.card::before{content:attr(data-rail);position:absolute;right:10px;top:10px;color:color-mix(in srgb,var(--tone) 72%,white);font-size:9px;font-weight:950}.card span{position:relative;z-index:1;color:var(--tone);font-weight:950;font-size:10px}.card b{position:relative;z-index:1;color:#f7fff9;font-size:18px;line-height:1;text-transform:uppercase}.card small{position:relative;z-index:1;color:#b6d0c8;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.rails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.rail{border-radius:10px;padding:12px;min-height:112px}.rail b{display:block;margin-bottom:7px;color:var(--gold);font-size:11px;text-transform:uppercase}.rail p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif}.rail code{color:#dffef6;overflow-wrap:anywhere}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(96%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes turn{0%,100%{transform:perspective(340px) rotateY(-18deg)}50%{transform:perspective(340px) rotateY(18deg)}}@media (max-width:980px){.stage{grid-template-columns:1fr}.rails{grid-template-columns:1fr}.term pre{min-height:360px}}@media (max-width:560px){main{width:min(100vw - 18px,1220px);padding-top:12px}.cards,.guards{grid-template-columns:1fr}.panel{padding:16px}.panel h1{font-size:40px}.term pre{font-size:9px}.stamp{grid-template-columns:1fr}.stamp span{min-height:54px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}}
  .mission{display:grid;grid-template-columns:minmax(270px,.7fr) minmax(0,1.3fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.mission-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:12px;padding:15px;background:linear-gradient(150deg,rgba(46,232,214,.09),rgba(4,10,12,.86))}.mission-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.mission-head b{display:block;color:#f8fff9;font:950 28px/.94 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.mission-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.matrix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px}.matrix-cell{min-height:88px;padding:10px;border-width:1px 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 55ms)}.matrix-cell span{position:relative;z-index:1;color:var(--gold);font-weight:950;font-size:9px;text-transform:uppercase}.matrix-cell b{position:relative;z-index:1;display:block;margin-top:5px;color:var(--green);font-size:20px}.matrix-cell p{position:relative;z-index:1;margin:4px 0 0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px}.map{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:#050708}.map-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px 10px;min-height:132px;padding:12px;color:inherit;text-decoration:none;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 62ms)}.map-row::before{content:attr(data-rail);position:absolute;right:10px;top:10px;color:rgba(255,198,77,.42);font-size:9px;font-weight:950}.map-row span{position:relative;z-index:1;color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.map-row b{position:relative;z-index:1;color:#f8fff9;font-size:14px;text-transform:uppercase;overflow-wrap:anywhere}.map-row code{position:relative;z-index:1;grid-column:1/-1;color:#ffe7a3;border:1px solid rgba(255,198,77,.16);border-radius:7px;padding:7px;background:rgba(255,198,77,.06);overflow-wrap:anywhere}.map-row p{position:relative;z-index:1;grid-column:1/-1;margin:0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px}.card{display:grid;align-content:start;gap:9px;min-height:166px;padding:13px;border-radius:10px;color:inherit;text-decoration:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 75ms)}.card:nth-child(1){--tone:var(--cyan)}.card:nth-child(2){--tone:var(--pink)}.card:nth-child(3){--tone:var(--gold)}.card:nth-child(4){--tone:var(--green)}.card:nth-child(5){--tone:var(--violet)}.card:nth-child(6){--tone:var(--red)}.card::before{content:attr(data-rail);position:absolute;right:10px;top:10px;color:color-mix(in srgb,var(--tone) 72%,white);font-size:9px;font-weight:950}.card span{position:relative;z-index:1;color:var(--tone);font-weight:950;font-size:10px}.card b{position:relative;z-index:1;color:#f7fff9;font-size:18px;line-height:1;text-transform:uppercase}.card small{position:relative;z-index:1;color:#b6d0c8;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.rails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.rail{border-radius:10px;padding:12px;min-height:112px}.rail b{display:block;margin-bottom:7px;color:var(--gold);font-size:11px;text-transform:uppercase}.rail p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif}.rail code{color:#dffef6;overflow-wrap:anywhere}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(96%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes turn{0%,100%{transform:perspective(340px) rotateY(-18deg)}50%{transform:perspective(340px) rotateY(18deg)}}@media (max-width:980px){.stage,.mission{grid-template-columns:1fr}.rails{grid-template-columns:1fr}.term pre{min-height:360px}}@media (max-width:680px){.map{grid-template-columns:1fr}}@media (max-width:560px){main{width:min(100vw - 18px,1220px);padding-top:12px}.cards,.guards,.matrix{grid-template-columns:1fr}.panel{padding:16px}.panel h1{font-size:40px}.term pre{font-size:9px}.stamp{grid-template-columns:1fr}.stamp span{min-height:54px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER Studio Pack">
    <section class="stage">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://STUDIO-PACK//OFFLINE-GUI//LOCAL-FIRST</div>
          <h1>Vibe<br>Tracker<br>Studio</h1>
          <p>One local folder for the first-run theatre: terminal charm, provider-branded scan feedback, proof rails, and the c0vibe.app handoff. It is a preview pack, not a data collector.</p>
          <div class="stamp" aria-label="Animated ASCII mark">
            <span>HF</span><span>CX</span><span>C0</span>
          </div>
        </div>
        <div class="guards">
          <span>No provider calls</span>
          <span>No usage writes</span>
          <span>No uploads</span>
          <span>No secret reads</span>
        </div>
      </div>
      <section class="term" aria-label="Studio terminal">
        <div class="term-top"><span>studio@vibetracker</span><b>Vibers Unite</b></div>
        <pre>+------------------------------------------------------------+
| VTK://STUDIO-PACK//VIBERS-UNITE//C0VIBE.APP               |
|------------------------------------------------------------|
| 00  open boot-panorama.html     first-open command room    |
| 01  open vibers-unite-room      terminal GUI wow room      |
| 02  open showcase.html          overview + proof rails     |
| 03  open surprise-reel.html     Higgsfield/Codex turntable |
| 04  open ascii-motion-lab.html  credited motion research   |
| 05  open github-trust-heatgrid  official GH colors, trust  |
| 06  open vibe-score-reactor     score/profile/heatgrid     |
| 07  open oss-motion-receipt     real OSS motion frames     |
| 08  open flight-recorder.html   replayable surprise tape   |
| 09  open wizard-runway.html     first-run scan control     |
| 10  open local-ai-radar.html    local endpoint preview     |
| 11  open command-cockpit.html   first-run command surface  |
| 12  inspect manifest.json       safety flags, file list    |
|                                                            |
| surprise stack                                             |
|   HF prism turn      usage only after consented source     |
|   CX trust cube      NOT USAGE; never spend                |
|   local sonar        Ollama/LM Studio/ComfyUI stay local   |
|   C0 relay           c0vibe.app only after dry-run review  |
|                                                            |
| status                                                     |
|   static HTML        yes                                   |
|   scripts            none                                  |
|   network calls      none                                  |
|   provider calls     none                                  |
|   local ledger write none                                  |
|                                                            |
| Motto: Vibers Unite // c0vibe.app                         |
+------------------------------------------------------------+</pre>
      </section>
    </section>
    <section class="mission" aria-label="Studio command map">
      <div class="mission-head">
        <span>VTK://STUDIO-COMMAND-MAP//ROUTE-TO-PROOF//NO-SIDE-EFFECTS</span>
        <b>Studio<br>Command Map</b>
        <p>Every page in the pack has a job: boot, overview, surprise theatre, replay, wizard, command control, and manifest proof. This map keeps the tour fast and honest.</p>
        <div class="matrix" aria-label="Studio pack safety matrix">${safetyMatrix}</div>
      </div>
      <div class="map" aria-label="Studio pack route map">${commandMap}</div>
    </section>
    <section class="cards" aria-label="Studio pack files">${cards}</section>
    <section class="rails" aria-label="Safety rails">
      <article class="rail"><b>Preview boundary</b><p>This pack is generated from local static renderers. It does not collect usage or promote trust signals into spend.</p></article>
      <article class="rail"><b>Terminal to GUI</b><p>The same scan cadence from the CLI appears here as a browsable local folder, so demos can start in ASCII and land in a cleaner GUI.</p></article>
      <article class="rail"><b>Next command</b><p><code>vibetracker sync</code> collects real usage only after the user connects sources and starts the run.</p></article>
    </section>
    <footer><span class="accent">Static pack:</span> index, boot panorama, showcase, surprise reel, flight recorder, command cockpit, and manifest. Open files directly; no dev server required.</footer>
  </main>
</body>
</html>`;
}

export function buildStudioPackFiles(options: StudioPackOptions = {}): StudioPackFile[] {
  const filesWithoutManifest: StudioPackFile[] = [
    {
      path: "index.html",
      label: "Studio Index",
      description: "Entry point for the offline VibeTRACKER GUI pack.",
      content: "",
    },
    {
      path: "boot-panorama.html",
      label: "Boot Panorama",
      description: "Script-free first-open command room for terminal handoff, scan theatre, proof boundary, trust side rail, and C0VIBE relay.",
      content: renderStudioBootPanoramaHtml(options.providerIds),
    },
    {
      path: "vibers-unite-room.html",
      label: "Vibers Unite Room",
      description: "Script-free terminal GUI wow room combining provider orbit, trust heatgrid, score datastream, and C0VIBE publish hold.",
      content: renderVibersUniteRoomHtml(options.providerIds),
    },
    {
      path: "showcase.html",
      label: "Offline Showcase",
      description: "Script-free overview of local-first collection, proof rails, source atlas, and share path.",
      content: renderShowcaseHtml({ compact: false }),
    },
    {
      path: "surprise-reel.html",
      label: "Surprise Reel",
      description: "Script-free provider-branded scan theatre with labelled safety rails.",
      content: renderSyncSurpriseDirectorHtml(options.providerIds),
    },
    {
      path: "ascii-motion-lab.html",
      label: "ASCII Motion Lab",
      description: "Script-free research-backed motion lab for ASCII/Unicode rigs with visible attribution and no side effects.",
      content: renderAsciiMotionLabHtml(),
    },
    {
      path: "github-trust-heatgrid.html",
      label: "GitHub Trust Heatgrid",
      description: "Script-free official GitHub color contribution replay labelled as NOT USAGE trust evidence.",
      content: renderGitHubTrustHeatgridHtml(),
    },
    {
      path: "vibe-score-reactor.html",
      label: "Vibe Score Reactor",
      description: "Script-free score reactor showing usage datastream factors, profile lineage, heatgrid outputs, and trust quarantine.",
      content: renderVibeScoreReactorHtml(),
    },
    {
      path: "oss-motion-receipt.html",
      label: "OSS Motion Receipt",
      description: "Script-free generated cli-spinners, ascii-globe, and drawille frame receipt with attribution.",
      content: renderOssMotionReceiptHtml(),
    },
    {
      path: "flight-recorder.html",
      label: "Flight Recorder",
      description: "Replayable scan surprise tape proving phase, provider mark, rail, and visual-only safety boundaries.",
      content: renderSurpriseFlightRecorderHtml(options.providerIds),
    },
    {
      path: "wizard-runway.html",
      label: "Wizard Runway",
      description: "Script-free first-run terminal-to-GUI scan room with labelled surprise rails.",
      content: renderWizardRunwayHtml({ providerIds: options.providerIds }),
    },
    {
      path: "local-ai-radar.html",
      label: "Local AI Radar",
      description: "Script-free preview shell for local endpoint probes, manual local rails, and detect --html handoff.",
      content: renderLocalDetectionHtml(LOCAL_ENDPOINTS.map((endpoint) => ({
        ...endpoint,
        reachable: false,
        error: "studio-preview",
      })), { generatedAt: "studio-preview", preview: true }),
    },
    {
      path: "command-cockpit.html",
      label: "Command Cockpit",
      description: "Script-free local command cockpit for first run, scan, audit, dry-run, and publish.",
      content: renderCommandCockpitHtml(),
    },
  ];
  const manifest = studioPackManifest([
    ...filesWithoutManifest,
    {
      path: "manifest.json",
      label: "Manifest",
      description: "Machine-readable safety metadata for the studio pack.",
      content: "",
    },
  ]);
  filesWithoutManifest[0] = {
    ...filesWithoutManifest[0],
    content: renderStudioPackIndex(manifest.files),
  };
  return [
    ...filesWithoutManifest,
    {
      path: "manifest.json",
      label: "Manifest",
      description: "Machine-readable safety metadata for the studio pack.",
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
  ];
}
