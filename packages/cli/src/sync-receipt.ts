import { createHash } from "node:crypto";
import type { CollectionCheckpoint } from "./sync-surprises.ts";
import { providerBrand } from "./provider-brand.ts";

export interface SyncReceiptInput {
  id: string;
  generatedAt: string;
  storePath: string;
  providerIds: string[];
  checkpoints: CollectionCheckpoint[];
  demo?: boolean;
}

export interface SyncReceiptProvider {
  providerId: string;
  label: string;
  rail: "usage" | "local" | "not_usage" | "publish" | "hold";
  status: CollectionCheckpoint["status"];
  received: number;
  accepted: number;
  fresh: number;
  duplicate: number;
  usdEst?: number;
  error?: string;
  hint?: string;
  sourceMix: { source: string; count: number }[];
}

export interface SyncReceiptPayload {
  schema: "vibetracker.sync-receipt/0.1";
  id: string;
  generatedAt: string;
  demo: boolean;
  storePath: string;
  fingerprint: {
    algorithm: "sha256";
    basis: "canonical-payload-without-fingerprint";
    value: string;
  };
  safety: {
    providerCalls: true;
    usageWrites: true;
    uploads: false;
    secretsExported: false;
    promptsExported: false;
    outputsExported: false;
  };
  totals: {
    providers: number;
    received: number;
    accepted: number;
    fresh: number;
    duplicate: number;
    errors: number;
    usdEst?: number;
  };
  providers: SyncReceiptProvider[];
}

export interface SyncReceiptFile {
  path: string;
  label: string;
  description: string;
  content: string;
}

const localProviderIds = new Set([
  "ollama",
  "lmstudio",
  "comfyui",
  "vllm",
  "localai",
  "jan",
  "llama-cpp",
  "automatic1111",
  "forge",
  "invokeai",
]);

const notUsageProviderIds = new Set([
  "codex",
  "codex-cli",
  "claude-code",
  "github",
  "github-cli",
  "gh",
  "antigravity",
  "augment",
  "roo-code",
  "gemini-cli",
]);

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function railFor(providerId: string, status: CollectionCheckpoint["status"]): SyncReceiptProvider["rail"] {
  const id = providerId.toLowerCase();
  if (status === "error") return "hold";
  if (notUsageProviderIds.has(id)) return "not_usage";
  if (localProviderIds.has(id)) return "local";
  if (id === "c0vibe") return "publish";
  return "usage";
}

function providerRows(input: SyncReceiptInput): SyncReceiptProvider[] {
  const seen = new Set<string>();
  const rows = input.checkpoints.map((checkpoint) => {
    seen.add(checkpoint.providerId);
    const brand = providerBrand(checkpoint.providerId, checkpoint.label);
    return {
      providerId: checkpoint.providerId,
      label: brand.label,
      rail: railFor(checkpoint.providerId, checkpoint.status),
      status: checkpoint.status,
      received: checkpoint.received,
      accepted: checkpoint.accepted,
      fresh: checkpoint.fresh,
      duplicate: checkpoint.duplicate,
      ...(checkpoint.usd != null ? { usdEst: checkpoint.usd } : {}),
      ...(checkpoint.error ? { error: checkpoint.error } : {}),
      ...(checkpoint.hint ? { hint: checkpoint.hint } : {}),
      sourceMix: checkpoint.sourceMix ?? [],
    };
  });
  for (const providerId of input.providerIds) {
    if (seen.has(providerId)) continue;
    const brand = providerBrand(providerId);
    rows.push({
      providerId,
      label: brand.label,
      rail: railFor(providerId, "up_to_date"),
      status: "up_to_date",
      received: 0,
      accepted: 0,
      fresh: 0,
      duplicate: 0,
      sourceMix: [],
      hint: "provider was planned but produced no checkpoint",
    });
  }
  return rows;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function syncReceiptFingerprint(payload: unknown): SyncReceiptPayload["fingerprint"] {
  return {
    algorithm: "sha256",
    basis: "canonical-payload-without-fingerprint",
    value: createHash("sha256").update(canonicalJson(payload)).digest("hex"),
  };
}

export function syncReceiptPayload(input: SyncReceiptInput): SyncReceiptPayload {
  const providers = providerRows(input);
  const usd = providers.reduce((sum, row) => sum + (row.usdEst ?? 0), 0);
  const payload = {
    schema: "vibetracker.sync-receipt/0.1",
    id: input.id,
    generatedAt: input.generatedAt,
    demo: Boolean(input.demo),
    storePath: input.storePath,
    safety: {
      providerCalls: true,
      usageWrites: true,
      uploads: false,
      secretsExported: false,
      promptsExported: false,
      outputsExported: false,
    },
    totals: {
      providers: providers.length,
      received: providers.reduce((sum, row) => sum + row.received, 0),
      accepted: providers.reduce((sum, row) => sum + row.accepted, 0),
      fresh: providers.reduce((sum, row) => sum + row.fresh, 0),
      duplicate: providers.reduce((sum, row) => sum + row.duplicate, 0),
      errors: providers.filter((row) => row.status === "error").length,
      ...(usd > 0 ? { usdEst: usd } : {}),
    },
    providers,
  } satisfies Omit<SyncReceiptPayload, "fingerprint">;
  return { ...payload, fingerprint: syncReceiptFingerprint(payload) };
}

function statusLabel(row: SyncReceiptProvider): string {
  if (row.status === "error") return "HOLD";
  if (row.fresh > 0) return "LOCK";
  return "CLEAR";
}

function meter(value: number, max: number): string {
  const width = 18;
  const filled = max > 0 ? Math.max(1, Math.min(width, Math.round((value / max) * width))) : 0;
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`;
}

function sourceLine(row: SyncReceiptProvider): string {
  if (!row.sourceMix.length) return "source: none in this checkpoint";
  return `source: ${row.sourceMix.map((source) => `${source.source} ${source.count}`).join(" / ")}`;
}

function terminalReceipt(payload: SyncReceiptPayload): string {
  const maxFresh = Math.max(1, ...payload.providers.map((row) => row.fresh));
  const rows = payload.providers.map((row) => {
    const usd = row.usdEst != null ? ` $${row.usdEst.toFixed(2)}` : "";
    return `[${statusLabel(row)}] ${row.providerId.padEnd(16)} ${row.rail.padEnd(9)} fresh ${String(row.fresh).padStart(5)} accepted ${String(row.accepted).padStart(5)} ${meter(row.fresh, maxFresh)}${usd}`;
  });
  return [
    "+------------------------------------------------------------+",
    "| VTK://SYNC-RECEIPT//BLACK-BOX//LOCAL-FIRST                 |",
    "|------------------------------------------------------------|",
    `| id          ${payload.id.padEnd(48).slice(0, 48)} |`,
    `| generated   ${payload.generatedAt.padEnd(48).slice(0, 48)} |`,
    `| store       ${payload.storePath.padEnd(48).slice(0, 48)} |`,
    `| sha256      ${payload.fingerprint.value.slice(0, 48).padEnd(48)} |`,
    `|             ${payload.fingerprint.value.slice(48).padEnd(48)} |`,
    "|------------------------------------------------------------|",
    `| providers   ${String(payload.totals.providers).padEnd(48)} |`,
    `| received    ${String(payload.totals.received).padEnd(48)} |`,
    `| accepted    ${String(payload.totals.accepted).padEnd(48)} |`,
    `| fresh       ${String(payload.totals.fresh).padEnd(48)} |`,
    `| duplicate   ${String(payload.totals.duplicate).padEnd(48)} |`,
    `| errors      ${String(payload.totals.errors).padEnd(48)} |`,
    "|------------------------------------------------------------|",
    "| provider rails                                             |",
    ...rows.map((row) => `| ${row.padEnd(58).slice(0, 58)} |`),
    "|------------------------------------------------------------|",
    "| provider calls yes // local usage writes yes // uploads no |",
    "| prompts no // outputs no // secrets exported no            |",
    "| Vibers Unite // c0vibe.app                                 |",
    "+------------------------------------------------------------+",
  ].join("\n");
}

function providerCards(payload: SyncReceiptPayload): string {
  const maxFresh = Math.max(1, ...payload.providers.map((row) => row.fresh));
  return payload.providers.map((row, index) => {
    const brand = providerBrand(row.providerId, row.label);
    const usd = row.usdEst != null ? `$${row.usdEst.toFixed(2)} est.` : "no USD estimate";
    const error = row.error ? `<em>${esc(row.error)}</em>` : "";
    const fill = Math.max(0.04, row.fresh / maxFresh).toFixed(3);
    return `<article class="provider" data-rail="${esc(row.rail)}" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--fill:${fill}">
      <div class="provider-top"><span>${esc(brand.mark)}</span><b>${esc(row.label)}</b><strong>${esc(statusLabel(row))}</strong></div>
      <div class="meter"><i></i></div>
      <dl>
        <div><dt>fresh</dt><dd>${esc(row.fresh)}</dd></div>
        <div><dt>accepted</dt><dd>${esc(row.accepted)}</dd></div>
        <div><dt>duplicate</dt><dd>${esc(row.duplicate)}</dd></div>
        <div><dt>rail</dt><dd>${esc(row.rail)}</dd></div>
      </dl>
      <p>${esc(sourceLine(row))}</p>
      <code>${esc(usd)} // ${esc(row.hint ?? "local checkpoint recorded")}</code>
      ${error}
    </article>`;
  }).join("");
}

function blackBoxReplay(payload: SyncReceiptPayload): string {
  const gates = [
    ["01 call", payload.safety.providerCalls ? "YES" : "NO", "provider adapters were asked for usage"],
    ["02 verify", "YES", "records passed schema and duplicate gates"],
    ["03 ledger", payload.safety.usageWrites ? "YES" : "NO", "accepted fresh rows reached the local store"],
    ["04 upload", payload.safety.uploads ? "YES" : "NO", "public sharing remains a separate review step"],
  ].map(([step, value, detail], index) => `<article class="replay-gate" style="--i:${index}">
      <span>${esc(step)}</span>
      <b>${esc(value)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  const providers = payload.providers.map((row, index) => {
    const brand = providerBrand(row.providerId, row.label);
    const sources = row.sourceMix.length
      ? row.sourceMix.map((source) => `${source.source}:${source.count}`).join(" / ")
      : "source:none";
    return `<article class="replay-event replay-${esc(row.rail)}" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)}">
      <span>${esc(brand.mark)}</span>
      <b>${esc(row.label)}</b>
      <em>${esc(statusLabel(row))} // ${esc(row.rail)}</em>
      <p>accepted ${esc(row.accepted)} // fresh ${esc(row.fresh)} // duplicate ${esc(row.duplicate)}</p>
      <code>${esc(sources)}${row.error ? ` // hold:${esc(row.error)}` : ""}</code>
    </article>`;
  }).join("");
  return `<section class="replay" aria-label="Receipt replay flight recorder">
    <div class="replay-head">
      <span>VTK://RECEIPT-REPLAY//SOURCE-TO-LEDGER//NO-SECRETS</span>
      <b>Black Box Replay</b>
      <p>Provider calls, validation, local ledger writes, and no-upload boundaries are replayed without prompts, outputs, keys, or media files.</p>
    </div>
    <div class="replay-gates">${gates}</div>
    <div class="replay-track">${providers}</div>
  </section>`;
}

function sourceLedgerChain(payload: SyncReceiptPayload): string {
  const maxAccepted = Math.max(1, ...payload.providers.map((row) => row.accepted));
  const nodes = payload.providers.map((row, index) => {
    const brand = providerBrand(row.providerId, row.label);
    const sources = row.sourceMix.length
      ? row.sourceMix.map((source) => `${source.source}:${source.count}`).join(" / ")
      : "source:none";
    const railLabel = row.rail === "not_usage" ? "not usage" : row.rail;
    const verdict = row.rail === "usage"
      ? "usage datastream"
      : row.rail === "not_usage"
        ? "excluded from usage score"
        : "held before ledger";
    const fill = Math.max(0.05, row.accepted / maxAccepted).toFixed(3);
    return `<article class="chain-node chain-${esc(row.rail)}" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--fill:${fill}">
      <span>${esc(brand.mark)}</span>
      <b>${esc(row.label)}</b>
      <em>${esc(railLabel)}</em>
      <p>${esc(sources)}</p>
      <code>${esc(row.fresh)} fresh -> ${esc(row.accepted)} accepted // ${esc(verdict)}</code>
    </article>`;
  }).join("");
  return `<section class="chain" aria-label="Receipt source to ledger chain">
    <div class="chain-head">
      <span>VTK://RECEIPT-DATASTREAM//SOURCE-TO-SCORE//NO-TRUST-SPEND</span>
      <b>Source To Ledger Chain</b>
      <p>Accepted usage rows can feed the score, profile, heatgrid, and public relay after review. Trust and hold rails stay visible, labelled, and excluded from usage totals.</p>
    </div>
    <div class="chain-terminal">
      <pre>+------------------------------------------------------------+
| RECEIPT DATASTREAM                                         |
|------------------------------------------------------------|
| usage input       accepted provider rows                   |
| score/profile     usage rows only after approved upload    |
| trust signals     visible side rail, not spend             |
| holds/errors      skipped before aggregation               |
| privacy           prompts=0 outputs=0 secrets=0 media=0    |
| motto             Vibers Unite // c0vibe.app               |
+------------------------------------------------------------+</pre>
    </div>
    <div class="chain-nodes">${nodes}</div>
  </section>`;
}

function proofSeal(payload: SyncReceiptPayload): string {
  const fingerprintBlocks = payload.fingerprint.value.match(/.{1,8}/g) ?? [payload.fingerprint.value];
  const seals = [
    ["digest", "SHA-256", "canonical local receipt JSON"],
    ["usage", `${payload.totals.fresh} fresh`, "accepted usage rows only"],
    ["privacy", "0 exported", "prompts, outputs, secrets, media"],
    ["publish", payload.safety.uploads ? "uploaded" : "review", "public relay waits for upload review"],
  ].map(([label, value, detail], index) => `<article class="seal-cell" style="--i:${index}">
      <span>${esc(label)}</span>
      <b>${esc(value)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  return `<section class="seal" aria-label="Receipt fingerprint seal">
    <div class="seal-head">
      <span>VTK://RECEIPT-SEAL//SHA256//LOCAL-PROOF</span>
      <b>Receipt Fingerprint</b>
      <p>This fingerprint changes when the local receipt JSON changes. It proves the artifact being inspected is the same artifact represented by the machine-readable payload.</p>
    </div>
    <div class="fingerprint">${fingerprintBlocks.map((block, index) => `<code style="--i:${index}">${esc(block)}</code>`).join("")}</div>
    <div class="seal-grid">${seals}</div>
  </section>`;
}

export function renderSyncReceiptHtml(input: SyncReceiptInput): string {
  const payload = syncReceiptPayload(input);
  const terminal = terminalReceipt(payload);
  const cards = providerCards(payload);
  const replay = blackBoxReplay(payload);
  const chain = sourceLedgerChain(payload);
  const seal = proofSeal(payload);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Sync Receipt</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 15% 16%,rgba(46,232,214,.15),transparent 28%),radial-gradient(circle at 86% 12%,rgba(255,79,216,.12),transparent 24%);mix-blend-mode:screen}
  main{width:min(1220px,calc(100vw - 28px));margin:0 auto;padding:28px 0 44px}.hero{display:grid;grid-template-columns:minmax(0,.78fr) minmax(360px,1.22fr);gap:14px;min-height:560px}.panel,.terminal,.provider,.rail,.replay,.replay-gate,.replay-event,.chain,.chain-node{position:relative;min-width:0;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 32px 96px -72px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel,.terminal,.replay,.chain{border-radius:12px}.panel{display:flex;flex-direction:column;justify-content:space-between;padding:22px}.panel::after,.terminal::after,.provider::after,.rail::after,.replay::after,.replay-gate::after,.replay-event::after,.chain::after,.chain-node::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 59%);transform:translateX(-96%);animation:sweep 5.8s var(--motion) infinite;pointer-events:none}.eyebrow{color:var(--green);font-weight:950;text-transform:uppercase;font-size:11px}.panel h1{margin:10px 0 14px;color:#f8fff9;font:950 clamp(40px,7.2vw,88px)/.88 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24)}.panel p{max-width:58ch;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.totals span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:10px;color:#bff8e5;font-size:10px;font-weight:900;text-transform:uppercase}.totals b{display:block;color:#fff;font-size:20px}.terminal{padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:498px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:900 10px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}
  .provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.provider{border-radius:10px;padding:12px;min-height:260px;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms);box-shadow:0 24px 82px -62px var(--from),inset 0 1px 0 rgba(255,255,255,.07)}.provider::before{content:attr(data-rail);position:absolute;right:10px;top:10px;color:var(--gold);font-size:9px;font-weight:950;text-transform:uppercase}.provider-top{position:relative;z-index:1;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:8px;align-items:center}.provider-top span{display:grid;place-items:center;height:36px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font-weight:950}.provider-top b{min-width:0;color:#f4fff9;font-size:12px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.provider-top strong{color:var(--green);font-size:10px}.provider[data-rail="hold"] .provider-top strong{color:var(--red)}.meter{position:relative;z-index:1;height:9px;margin:12px 0;border:1px solid rgba(255,255,255,.11);background:#030708;overflow:hidden}.meter i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1s var(--motion) both}dl{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0}dt{color:var(--muted);font-size:9px;text-transform:uppercase}dd{margin:2px 0 0;color:#fff;font-size:18px}p{position:relative;z-index:1;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35;overflow-wrap:anywhere}code{position:relative;z-index:1;display:block;padding:8px;border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);color:#ffe7a3;font:800 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}em{position:relative;z-index:1;display:block;margin-top:8px;color:var(--red);font-style:normal;font-size:11px}.rails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.rail{border-radius:10px;padding:12px;min-height:112px}.rail b{display:block;margin-bottom:7px;color:var(--gold);font-size:11px;text-transform:uppercase}.rail p{margin:0;color:#c5ddd6}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(96%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(var(--fill))}}@media (max-width:980px){.hero{grid-template-columns:1fr}.provider-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rails{grid-template-columns:1fr}.terminal pre{min-height:330px}}@media (max-width:560px){main{width:min(100vw - 18px,1220px);padding-top:12px}.provider-grid,.totals{grid-template-columns:1fr}.panel{padding:16px}.panel h1{font-size:40px}.terminal pre{font-size:8px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.meter i{transform:scaleX(var(--fill))}}
  .replay{display:grid;grid-template-columns:260px minmax(0,1fr);gap:1px;margin-top:14px}.replay-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:12px;padding:14px;background:rgba(4,10,12,.72)}.replay-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.replay-head b{color:#f8fff9;font:950 24px/.95 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.replay-head p{margin:0;color:#c6ded7}.replay-gates{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.replay-gate{min-height:144px;padding:12px;border-width:0 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.replay-gate span,.replay-event em{position:relative;z-index:1;color:var(--gold);font-weight:950;font-size:10px;text-transform:uppercase}.replay-gate b{position:relative;z-index:1;display:block;margin:10px 0;color:var(--green);font-size:24px}.replay-gate p{margin:0}.replay-track{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;border-top:1px solid var(--line)}.replay-event{min-height:176px;padding:12px;border-width:0 0 0 1px;box-shadow:none;background:linear-gradient(160deg,color-mix(in srgb,var(--from) 10%,rgba(9,18,22,.94)),rgba(4,7,9,.98));animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 72ms)}.replay-event::before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 110ms)}.replay-event>span{position:relative;z-index:1;display:grid;place-items:center;width:34px;height:30px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font-weight:950}.replay-event b{position:relative;z-index:1;display:block;margin-top:9px;color:#f8fff9;font-size:12px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.replay-event p{margin:8px 0}.replay-hold em{color:var(--red)}
  .chain{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.06)}.chain-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:12px;padding:14px;background:linear-gradient(150deg,rgba(46,232,214,.08),rgba(4,10,12,.86))}.chain-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.chain-head b{display:block;color:#f8fff9;font:950 25px/.95 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.chain-head p{margin:0;color:#c6ded7}.chain-terminal{position:relative;z-index:1;padding:12px;background:#040708}.chain-terminal pre{min-height:212px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#020506;color:#dffef6;font:900 10px/1.24 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto}.chain-nodes{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;border-top:1px solid var(--line)}.chain-node{min-height:172px;padding:12px;border-width:0 0 0 1px;background:linear-gradient(160deg,color-mix(in srgb,var(--from) 12%,rgba(9,18,22,.94)),rgba(4,7,9,.98));box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 76ms)}.chain-node::before{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;transform:scaleX(var(--fill))}.chain-node>span{position:relative;z-index:1;display:grid;place-items:center;width:36px;height:32px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font-weight:950}.chain-node b{position:relative;z-index:1;display:block;margin-top:9px;color:#f8fff9;font-size:12px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chain-node em{position:relative;z-index:1;display:block;margin-top:5px;color:var(--gold);font-style:normal;font-size:10px;font-weight:950;text-transform:uppercase}.chain-hold em{color:var(--red)}
  .seal{position:relative;min-width:0;margin-top:14px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(180deg,rgba(7,15,18,.96),rgba(4,7,9,.99));box-shadow:0 34px 110px -86px var(--gold),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.seal::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,var(--gold),var(--green),var(--cyan),var(--pink),transparent)}.seal-head{position:relative;z-index:1;padding:14px 14px 8px}.seal-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.seal-head b{display:block;margin-top:7px;color:#f8fff9;font:950 28px/.95 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.seal-head p{max-width:78ch;margin:8px 0 0;color:#c6ded7}.fingerprint{position:relative;z-index:1;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:1px;margin:0 14px 14px;border:1px solid rgba(255,198,77,.16);background:rgba(255,198,77,.06);overflow:hidden}.fingerprint code{display:grid;place-items:center;min-height:50px;border:0;border-radius:0;background:rgba(0,0,0,.18);color:#ffe7a3;font-size:12px;letter-spacing:0;animation:rise .46s var(--motion) both;animation-delay:calc(var(--i) * 45ms)}.seal-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.06)}.seal-cell{position:relative;min-width:0;min-height:132px;padding:12px;background:linear-gradient(145deg,rgba(255,198,77,.09),#05080a);overflow:hidden;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.seal-cell span{position:relative;z-index:1;color:var(--gold);font-weight:950;font-size:10px;text-transform:uppercase}.seal-cell b{position:relative;z-index:1;display:block;margin-top:10px;color:#f8fff9;font-size:18px;text-transform:uppercase}.seal-cell p{position:relative;z-index:1;margin:10px 0 0;color:#bdd8d1}
  @media (max-width:1060px){.replay,.chain{grid-template-columns:1fr}.replay-gates,.replay-track,.chain-nodes,.seal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.replay-gate,.replay-event,.chain-node{border-width:1px 0 0}.fingerprint{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (max-width:560px){.replay-gates,.replay-track,.chain-nodes,.seal-grid{grid-template-columns:1fr}.replay-gate,.replay-event,.chain-node{min-height:132px}.chain-terminal pre{font-size:8px}.fingerprint{grid-template-columns:repeat(2,minmax(0,1fr))}.seal-head b{font-size:24px}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER sync receipt">
    <section class="hero">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://SYNC-RECEIPT//BLACK-BOX//LOCAL-FIRST</div>
          <h1>Sync<br>Receipt</h1>
          <p>A durable local proof artifact for one collection run. Provider calls and local usage writes happened; uploads, prompt export, output export, and secret export did not.</p>
        </div>
        <div class="totals">
          <span><b>${esc(payload.totals.fresh)}</b> fresh records</span>
          <span><b>${esc(payload.totals.accepted)}</b> accepted records</span>
          <span><b>${esc(payload.totals.duplicate)}</b> duplicates held</span>
          <span><b>${esc(payload.totals.errors)}</b> provider holds</span>
        </div>
      </div>
      <section class="terminal" aria-label="Receipt terminal">
        <div class="terminal-top"><span>${esc(payload.id)}</span><b>Vibers Unite</b></div>
        <pre>${esc(terminal)}</pre>
      </section>
    </section>
    <section class="provider-grid" aria-label="Provider checkpoints">${cards}</section>
    ${replay}
    ${chain}
    ${seal}
    <section class="rails" aria-label="Receipt safety rails">
      <article class="rail"><b>Usage write</b><p>This receipt follows a real sync path, so local ledger writes are explicitly marked as yes.</p></article>
      <article class="rail"><b>No upload</b><p>The receipt is local. Public profile updates still require the separate upload or dry-run path.</p></article>
      <article class="rail"><b>Black box</b><p>It records counts, rails, source mix, and errors, not raw prompts, outputs, API keys, or media files.</p></article>
    </section>
    <footer><span class="accent">Static receipt:</span> script-free local HTML plus JSON. Open directly; no dev server required.</footer>
  </main>
</body>
</html>`;
}

export function buildSyncReceiptFiles(input: SyncReceiptInput): SyncReceiptFile[] {
  const payload = syncReceiptPayload(input);
  return [
    {
      path: "sync-receipt.html",
      label: "Sync Receipt HTML",
      description: "Script-free local sync receipt with provider checkpoints.",
      content: renderSyncReceiptHtml(input),
    },
    {
      path: "sync-receipt.json",
      label: "Sync Receipt JSON",
      description: "Machine-readable local sync receipt.",
      content: `${JSON.stringify(payload, null, 2)}\n`,
    },
  ];
}
