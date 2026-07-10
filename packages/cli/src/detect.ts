import { providerBrand } from "./provider-brand.ts";

export interface LocalEndpointCandidate {
  id: string;
  label: string;
  url: string;
  proxyCommand: string;
}

export interface LocalEndpointStatus extends LocalEndpointCandidate {
  reachable: boolean;
  status?: number;
  error?: string;
}

export interface LocalManualTool {
  id: string;
  label: string;
  note: string;
  command: string;
}

export interface LocalDetectionSnapshot {
  schema: "vibetracker.local-detection/0.1";
  generatedAt: string;
  summary: {
    online: number;
    total: number;
    manualRails: number;
    uploads: false;
    secretsRead: false;
    usageWrites: false;
  };
  endpoints: LocalEndpointStatus[];
  manualRails: LocalManualTool[];
}

export interface OpenAICompatibleStatus {
  id: string;
  baseUrl: string;
  modelsUrl: string;
  reachable: boolean;
  compatible: boolean;
  status?: number;
  error?: string;
  proxyCommand: string;
}

export const LOCAL_ENDPOINTS: readonly LocalEndpointCandidate[] = [
  { id: "ollama", label: "Ollama", url: "http://127.0.0.1:11434/api/tags", proxyCommand: "vibetracker proxy --provider ollama --target http://127.0.0.1:11434" },
  { id: "lmstudio", label: "LM Studio", url: "http://127.0.0.1:1234/v1/models", proxyCommand: "vibetracker proxy --provider lmstudio --target http://127.0.0.1:1234" },
  { id: "comfyui", label: "ComfyUI", url: "http://127.0.0.1:8188/history", proxyCommand: "vibetracker connect comfyui && vibetracker sync" },
  { id: "llama-cpp", label: "llama.cpp server", url: "http://127.0.0.1:8080/v1/models", proxyCommand: "vibetracker proxy --provider llama-cpp --target http://127.0.0.1:8080" },
  { id: "jan", label: "Jan", url: "http://127.0.0.1:1337/v1/models", proxyCommand: "vibetracker proxy --provider jan --target http://127.0.0.1:1337" },
  { id: "gpt4all", label: "GPT4All", url: "http://127.0.0.1:4891/v1/models", proxyCommand: "vibetracker proxy --provider gpt4all --target http://127.0.0.1:4891" },
  { id: "vllm", label: "vLLM", url: "http://127.0.0.1:8000/v1/models", proxyCommand: "vibetracker proxy --provider vllm --target http://127.0.0.1:8000" },
  { id: "text-generation-webui", label: "text-generation-webui", url: "http://127.0.0.1:5000/v1/models", proxyCommand: "vibetracker proxy --provider text-generation-webui --target http://127.0.0.1:5000" },
  { id: "automatic1111", label: "AUTOMATIC1111", url: "http://127.0.0.1:7860/sdapi/v1/progress", proxyCommand: "vibetracker add automatic1111 --usd 0 --category image --note local-session" },
  { id: "invokeai", label: "InvokeAI", url: "http://127.0.0.1:9090/", proxyCommand: "vibetracker add invokeai --usd 0 --category image --note local-session" },
] as const;

export const LOCAL_MANUAL_TOOLS: readonly LocalManualTool[] = [
  { id: "forge", label: "Stable Diffusion WebUI Forge", note: "A1111-compatible port family; record when Forge is the running UI.", command: "vibetracker add forge --usd 0 --category image --note local-session" },
  { id: "fooocus", label: "Fooocus", note: "local output metadata; no stable universal usage endpoint.", command: "vibetracker add fooocus --usd 0 --category image --note local-session" },
  { id: "diffusers-local", label: "Diffusers local scripts", note: "script manifests, notebooks, and output folders stay local.", command: "vibetracker add diffusers-local --usd 0 --category image --note local-session" },
] as const;

export async function detectLocalEndpoints(opts: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}): Promise<LocalEndpointStatus[]> {
  const timeoutMs = opts.timeoutMs ?? 350;
  const fetchImpl = opts.fetchImpl ?? fetch;
  return Promise.all(LOCAL_ENDPOINTS.map(async (candidate) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(candidate.url, { method: "GET", signal: controller.signal });
      return { ...candidate, reachable: true, status: res.status };
    } catch (err) {
      return { ...candidate, reachable: false, error: (err as Error).name === "AbortError" ? "timeout" : (err as Error).message };
    } finally {
      clearTimeout(timer);
    }
  }));
}

export function localDetectionSnapshot(statuses: LocalEndpointStatus[], generatedAt = new Date().toISOString()): LocalDetectionSnapshot {
  return {
    schema: "vibetracker.local-detection/0.1",
    generatedAt,
    summary: {
      online: statuses.filter((status) => status.reachable).length,
      total: statuses.length,
      manualRails: LOCAL_MANUAL_TOOLS.length,
      uploads: false,
      secretsRead: false,
      usageWrites: false,
    },
    endpoints: statuses,
    manualRails: [...LOCAL_MANUAL_TOOLS],
  };
}

export async function detectOpenAICompatible(baseUrl: string, opts: { provider?: string; timeoutMs?: number; fetchImpl?: typeof fetch } = {}): Promise<OpenAICompatibleStatus> {
  const withScheme = /^https?:\/\//i.test(baseUrl) ? baseUrl : `http://${baseUrl}`;
  const normalized = new URL(withScheme).toString().replace(/\/+$/, "");
  const modelsUrl = normalized.endsWith("/v1") ? `${normalized}/models` : `${normalized}/v1/models`;
  const id = opts.provider || new URL(normalized).hostname.replace(/[^a-z0-9_-]/gi, "-").toLowerCase() || "openai-compatible";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 650);
  try {
    const res = await (opts.fetchImpl ?? fetch)(modelsUrl, { method: "GET", signal: controller.signal });
    return {
      id,
      baseUrl: normalized,
      modelsUrl,
      reachable: true,
      compatible: res.status !== 404 && res.status < 500,
      status: res.status,
      proxyCommand: `vibetracker proxy --provider ${id} --target ${normalized}`,
    };
  } catch (err) {
    return {
      id,
      baseUrl: normalized,
      modelsUrl,
      reachable: false,
      compatible: false,
      error: (err as Error).name === "AbortError" ? "timeout" : (err as Error).message,
      proxyCommand: `vibetracker proxy --provider ${id} --target ${normalized}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

const fit = (text: string, width: number): string =>
  text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);

const frameLine = (text: string): string => `| ${fit(text, 52)} |`;

function brandMark(id: string, label?: string): string {
  const brand = providerBrand(id, label);
  return `[${fit(brand.mark, 2)}]`;
}

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));

function renderLocalRadar(statuses: LocalEndpointStatus[]): string {
  const online = statuses.filter((status) => status.reachable).length;
  const rows = [
    "+------------------------------------------------------+",
    frameLine("VTK://LOCAL-SCAN//VIBERS-UNITE//C0VIBE.APP"),
    "|------------------------------------------------------|",
    frameLine(`LOCAL AI RADAR ${online}/${statuses.length} online · local-first · no upload`),
    frameLine("Ollama · LM Studio · ComfyUI · llama.cpp · Jan"),
    frameLine("GPT4All · vLLM · A1111 · InvokeAI"),
  ];
  for (const status of statuses) {
    const brand = providerBrand(status.id, status.label);
    const state = status.reachable ? `ONLINE ${status.status ?? "?"}` : "offline";
    const signal = status.reachable ? "████████" : "░░░░░░░░";
    rows.push(frameLine(`${status.reachable ? "✓" : "·"} ${brandMark(status.id, status.label)} ${fit(status.label, 18)} ${fit(state, 10)} ${signal}`));
    rows.push(frameLine(`   brand ${brand.from}->${brand.to}`));
  }
  for (const tool of LOCAL_MANUAL_TOOLS) {
    const brand = providerBrand(tool.id, tool.label);
    rows.push(frameLine(`+ ${brandMark(tool.id, tool.label)} ${fit(tool.label, 18)} manual local rail`));
    rows.push(frameLine(`   brand ${brand.from}->${brand.to}`));
  }
  rows.push(frameLine("Vibers Unite · c0vibe.app · local tools stay local"));
  rows.push("+------------------------------------------------------+");
  return rows.join("\n");
}

export function renderLocalDetection(statuses: LocalEndpointStatus[]): string {
  const lines = [renderLocalRadar(statuses), "", "LOCAL AI DETECTION"];
  for (const s of statuses) {
    lines.push(`${s.reachable ? "✓" : "·"} ${s.label.padEnd(24)} ${s.reachable ? `reachable (${s.status})` : "not detected"}`);
    if (s.reachable) lines.push(`  ${s.proxyCommand}`);
  }
  lines.push("");
  lines.push("MANUAL LOCAL RAILS");
  for (const tool of LOCAL_MANUAL_TOOLS) {
    lines.push(`+ ${tool.label.padEnd(24)} ${tool.note}`);
    lines.push(`  ${tool.command}`);
  }
  if (!statuses.some((s) => s.reachable)) {
    lines.push("");
    lines.push("No common local AI endpoints detected. Start Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM, A1111, InvokeAI, or another OpenAI-compatible local server, then run this again.");
  }
  return lines.join("\n");
}

export function renderLocalDetectionHtml(statuses: LocalEndpointStatus[], opts: { generatedAt?: string; preview?: boolean } = {}): string {
  const snapshot = localDetectionSnapshot(statuses, opts.generatedAt);
  const terminal = opts.preview
    ? [
      "+------------------------------------------------------+",
      frameLine("VTK://LOCAL-SCAN//PREVIEW-SHELL//C0VIBE.APP"),
      "|------------------------------------------------------|",
      frameLine(`LOCAL AI RADAR PREVIEW · ${statuses.length} probes mapped`),
      frameLine("Run: vibetracker detect --html --out local.html"),
      frameLine("This studio page makes no loopback requests."),
      frameLine("Live radar writes exact online/offline proof."),
      frameLine("Vibers Unite · c0vibe.app · local tools stay local"),
      "+------------------------------------------------------+",
    ].join("\n")
    : renderLocalRadar(statuses);
  const cards = statuses.map((status, index) => {
    const brand = providerBrand(status.id, status.label);
    const state = opts.preview ? "PREVIEW" : status.reachable ? `ONLINE ${status.status ?? "?"}` : "OFFLINE";
    const stateNote = opts.preview ? "mapped probe" : status.reachable ? "loopback answered" : "not detected";
    const meter = opts.preview ? 34 : status.reachable ? 100 : 14;
    return `<article class="provider-card ${opts.preview ? "is-preview" : status.reachable ? "is-online" : "is-offline"}" style="--brand-from:${brand.from};--brand-to:${brand.to};--brand-ink:${brand.ink};--i:${index}">
      <div class="provider-card__head">
        <span>${esc(brand.mark)}</span>
        <b>${esc(status.label)}</b>
      </div>
      <p>${esc(status.url)}</p>
      <div class="provider-card__state"><strong>${esc(state)}</strong><i>${esc(stateNote)}</i></div>
      <div class="provider-card__meter" aria-label="${esc(status.label)} ${esc(state)}"><em style="width:${meter}%"></em></div>
      <code>${esc(status.proxyCommand)}</code>
    </article>`;
  }).join("\n");
  const manual = snapshot.manualRails.map((tool, index) => {
    const brand = providerBrand(tool.id, tool.label);
    return `<article class="manual-card" style="--brand-from:${brand.from};--brand-to:${brand.to};--brand-ink:${brand.ink};--i:${index}">
      <span>${esc(brand.mark)}</span>
      <b>${esc(tool.label)}</b>
      <p>${esc(tool.note)}</p>
      <code>${esc(tool.command)}</code>
    </article>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibeTRACKER Local AI Radar</title>
<style>
:root { color-scheme: dark; --bg:#040607; --panel:#0d1419; --line:rgba(255,255,255,.12); --text:#ecfff9; --muted:#8ca4a5; --accent:#2ee8d6; --verified:#36e39b; --self:#ffc64d; --err:#ff7768; }
* { box-sizing:border-box; }
body { margin:0; min-height:100vh; background:radial-gradient(circle at 12% 0%, rgba(46,232,214,.11), transparent 34%), linear-gradient(180deg, #040607, #071014 56%, #040607); color:var(--text); font:14px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing:0; }
main { width:min(1180px, calc(100vw - 28px)); margin:0 auto; padding:28px 0 38px; }
.hero { display:grid; grid-template-columns:minmax(0, .9fr) minmax(320px, .55fr); gap:1px; border:1px solid var(--line); background:rgba(255,255,255,.08); box-shadow:0 24px 80px rgba(0,0,0,.42); }
.hero > * { background:linear-gradient(180deg, rgba(13,20,25,.96), rgba(7,13,16,.98)); min-width:0; }
.hero-copy { padding:22px; }
.eyebrow { color:var(--accent); font-size:11px; font-weight:900; text-transform:uppercase; }
h1 { margin:10px 0 12px; max-width:760px; font-size:clamp(34px, 5vw, 76px); line-height:.92; letter-spacing:0; }
.hero-copy p { max-width:760px; color:var(--muted); margin:0; font-family:system-ui, sans-serif; font-size:16px; }
.stats { display:grid; grid-template-columns:repeat(3, 1fr); gap:1px; align-self:stretch; }
.stat { display:grid; align-content:center; gap:8px; padding:20px; border-left:1px solid var(--line); }
.stat span { color:var(--muted); font-size:11px; text-transform:uppercase; }
.stat b { font-size:42px; line-height:.9; color:var(--accent); }
.terminal { margin:18px 0 0; border:1px solid var(--line); background:#05090b; overflow:auto; }
pre { margin:0; padding:18px; min-width:620px; color:#ddfff7; }
.rail { display:flex; flex-wrap:wrap; gap:8px; margin:18px 0; }
.rail span { border:1px solid var(--line); padding:8px 10px; color:var(--muted); background:rgba(255,255,255,.035); }
.rail b { color:var(--verified); }
.grid { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:1px; border:1px solid var(--line); background:rgba(255,255,255,.08); }
.provider-card, .manual-card { position:relative; min-height:218px; padding:14px; background:linear-gradient(180deg, rgba(13,20,25,.96), rgba(5,8,10,.98)); overflow:hidden; }
.provider-card::before, .manual-card::before { content:\"\"; position:absolute; inset:0 0 auto; height:2px; background:linear-gradient(90deg, var(--brand-from), var(--brand-to)); }
.provider-card::after { content:\"\"; position:absolute; inset:0; background:linear-gradient(120deg, transparent 0 46%, color-mix(in srgb, var(--brand-to) 18%, transparent) 52%, transparent 58%); transform:translateX(-110%); animation:sweep 3.8s ease-in-out infinite; animation-delay:calc(var(--i) * 90ms); pointer-events:none; }
.provider-card > *, .manual-card > * { position:relative; z-index:1; }
.provider-card__head { display:grid; grid-template-columns:42px minmax(0, 1fr); align-items:center; gap:9px; }
.provider-card__head span, .manual-card span { display:inline-grid; place-items:center; width:38px; height:38px; border:1px solid color-mix(in srgb, var(--brand-to) 52%, var(--line)); color:var(--brand-ink); background:linear-gradient(135deg, var(--brand-from), var(--brand-to)); font-weight:950; }
.provider-card__head b, .manual-card b { display:block; overflow-wrap:anywhere; font-size:14px; color:#f5fffb; }
.provider-card p, .manual-card p { color:var(--muted); min-height:36px; margin:12px 0; overflow-wrap:anywhere; font-family:system-ui, sans-serif; }
.provider-card__state { display:flex; justify-content:space-between; gap:8px; align-items:center; margin:10px 0; }
.provider-card__state strong { color:var(--err); font-size:12px; }
.provider-card.is-online .provider-card__state strong { color:var(--verified); }
.provider-card.is-preview .provider-card__state strong { color:var(--self); }
.provider-card__state i { color:var(--muted); font-style:normal; font-size:11px; text-align:right; }
.provider-card__meter { height:9px; border:1px solid var(--line); background:#020405; overflow:hidden; }
.provider-card__meter em { display:block; height:100%; background:linear-gradient(90deg, var(--brand-from), var(--brand-to)); }
code { display:block; margin-top:12px; padding:9px; border:1px solid var(--line); background:rgba(0,0,0,.26); color:#f0fff9; overflow-wrap:anywhere; font:12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.manual { margin-top:18px; display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:1px; border:1px solid var(--line); background:rgba(255,255,255,.08); }
.manual-card { min-height:190px; }
footer { color:var(--muted); margin-top:18px; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
@keyframes sweep { 0%, 54% { transform:translateX(-110%); } 74%, 100% { transform:translateX(110%); } }
@media (prefers-reduced-motion: reduce) { .provider-card::after { animation:none; } }
@media (max-width: 980px) { .hero { grid-template-columns:1fr; } .stats { grid-template-columns:repeat(3, minmax(0, 1fr)); } .grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } .manual { grid-template-columns:1fr; } }
@media (max-width: 620px) { main { width:min(100vw - 16px, 560px); padding-top:12px; } .hero-copy { padding:16px; } h1 { font-size:38px; } .stats { grid-template-columns:1fr; } .stat { border-left:0; border-top:1px solid var(--line); } .grid { grid-template-columns:1fr; } pre { min-width:540px; font-size:12px; } }
</style>
</head>
<body>
<main>
  <section class="hero" aria-label="Local AI radar summary">
    <div class="hero-copy">
      <div class="eyebrow">VTK://LOCAL-AI-RADAR // VIBERS UNITE // C0VIBE.APP</div>
      <h1>${opts.preview ? "Local radar preview." : "Local tools stay local."}</h1>
      <p>${opts.preview ? "This is the studio preview shell for the live local radar. It maps common AI runtimes without making loopback requests; run vibetracker detect --html for exact online/offline proof." : "Loopback probes check common AI runtimes, then label what is online, what needs a proxy, and which creator tools belong on manual local rails. This report makes no uploads, writes no usage records, and reads no secrets."}</p>
    </div>
    <div class="stats" aria-label="Radar counters">
      <div class="stat"><span>online</span><b>${snapshot.summary.online}/${snapshot.summary.total}</b></div>
      <div class="stat"><span>manual rails</span><b>${snapshot.summary.manualRails}</b></div>
      <div class="stat"><span>uploads</span><b>0</b></div>
    </div>
  </section>
  <div class="rail" aria-label="Safety rails">
    <span><b>no upload</b> aggregate review required</span>
    <span><b>no secret read</b> loopback endpoints only</span>
    <span><b>no usage writes</b> detection is not tracking</span>
    <span><b>c0vibe.app</b> publish after dry-run</span>
  </div>
  <section class="terminal" aria-label="Terminal radar frame"><pre>${esc(terminal)}</pre></section>
  <section class="grid" aria-label="Endpoint probes">${cards}</section>
  <section class="manual" aria-label="Manual local rails">${manual}</section>
  <footer><span>generated ${esc(snapshot.generatedAt)}</span><span>Vibers Unite · local-first proof rail · script-free HTML</span></footer>
</main>
</body>
</html>`;
}

export function renderOpenAICompatibleDetection(status: OpenAICompatibleStatus): string {
  const brand = providerBrand(status.id);
  const radar = [
    "+------------------------------------------------------+",
    frameLine("VTK://OPENAI-COMPATIBLE//PROXY-RADAR"),
    "|------------------------------------------------------|",
    frameLine(`${status.compatible ? "READY" : "HOLD"} ${brandMark(status.id)} ${status.id}`),
    frameLine(`${status.reachable ? `responded ${status.status ?? "?"}` : `not reachable ${status.error ?? "unknown"}`}`),
    frameLine(`brand ${brand.from}->${brand.to} · Vibers Unite`),
    "+------------------------------------------------------+",
  ].join("\n");
  return [
    radar,
    "",
    "OPENAI-COMPATIBLE DETECTION",
    `${status.compatible ? "✓" : "·"} ${status.baseUrl} ${status.reachable ? `responded (${status.status})` : `not reachable (${status.error ?? "unknown"})`}`,
    `  checked: ${status.modelsUrl}`,
    status.compatible
      ? `  ${status.proxyCommand}`
      : "  not safe to auto-route yet; verify the provider base URL and auth requirement.",
  ].join("\n");
}
