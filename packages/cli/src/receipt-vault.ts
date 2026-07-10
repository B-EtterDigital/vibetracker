import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { syncReceiptFingerprint, type SyncReceiptPayload } from "./sync-receipt.ts";
import { providerBrand } from "./provider-brand.ts";

export interface ReceiptVaultEntry {
  path: string;
  receipt: SyncReceiptPayload;
  fingerprintStatus?: "verified" | "normalized";
}

export interface ReceiptVaultSkippedFile {
  path: string;
  error: string;
}

export interface ReceiptVaultLoadResult {
  rootDir: string;
  entries: ReceiptVaultEntry[];
  skipped: ReceiptVaultSkippedFile[];
}

export interface ReceiptVaultPayload {
  schema: "vibetracker.receipt-vault/0.1";
  generatedAt: string;
  rootDir: string;
  safety: {
    receiptFileReads: true;
    providerCalls: false;
    usageWrites: false;
    uploads: false;
    secretsRead: false;
    promptsExported: false;
    outputsExported: false;
  };
  totals: {
    receipts: number;
    providers: number;
    fresh: number;
    accepted: number;
    duplicate: number;
    errors: number;
    usdEst?: number;
    skipped: number;
  };
  entries: ReceiptVaultEntry[];
  skipped: ReceiptVaultSkippedFile[];
}

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function fingerprintStatus(entry: ReceiptVaultEntry): "verified" | "normalized" {
  return entry.fingerprintStatus ?? "verified";
}

function shortFingerprint(receipt: SyncReceiptPayload): string {
  return receipt.fingerprint.value.slice(0, 12);
}

function normalizeSyncReceiptPayload(value: unknown): { receipt: SyncReceiptPayload; fingerprintStatus: "verified" | "normalized" } | null {
  const receipt = value as (Partial<SyncReceiptPayload> & Record<string, unknown>) | null;
  if (!receipt || receipt.schema !== "vibetracker.sync-receipt/0.1") return null;
  if (typeof receipt.id !== "string" || typeof receipt.generatedAt !== "string") return null;
  if (!receipt.totals || !Array.isArray(receipt.providers)) return null;

  const { fingerprint, ...withoutFingerprint } = receipt;
  const computedFingerprint = syncReceiptFingerprint(withoutFingerprint);
  let fingerprintStatus: "verified" | "normalized" = "normalized";
  if (fingerprint != null) {
    const parsedFingerprint = fingerprint as Partial<SyncReceiptPayload["fingerprint"]>;
    if (
      parsedFingerprint.algorithm !== computedFingerprint.algorithm ||
      parsedFingerprint.basis !== computedFingerprint.basis ||
      parsedFingerprint.value !== computedFingerprint.value
    ) return null;
    fingerprintStatus = "verified";
  }
  return {
    receipt: { ...withoutFingerprint, fingerprint: computedFingerprint } as SyncReceiptPayload,
    fingerprintStatus,
  };
}

function findReceiptJsonFiles(rootDir: string, maxDepth = 4): { found: string[]; skipped: ReceiptVaultSkippedFile[] } {
  if (!existsSync(rootDir)) return { found: [], skipped: [] };
  const found: string[] = [];
  const skipped: ReceiptVaultSkippedFile[] = [];
  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth) return;
    let children;
    try {
      children = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      skipped.push({ path: dir, error: (err as Error).message });
      return;
    }
    for (const child of children) {
      const path = join(dir, child.name);
      if (child.isDirectory()) {
        walk(path, depth + 1);
      } else if (child.isFile() && child.name === "sync-receipt.json") {
        found.push(path);
      }
    }
  };
  walk(rootDir, 0);
  return { found, skipped };
}

export function loadReceiptVault(rootDir: string): ReceiptVaultLoadResult {
  const entries: ReceiptVaultEntry[] = [];
  const { found, skipped } = findReceiptJsonFiles(rootDir);
  for (const path of found) {
    try {
      if (statSync(path).size > 2_000_000) {
        skipped.push({ path, error: "receipt file is too large" });
        continue;
      }
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      const normalized = normalizeSyncReceiptPayload(parsed);
      if (!normalized) {
        skipped.push({ path, error: "not a VibeTRACKER sync receipt" });
        continue;
      }
      entries.push({ path, receipt: normalized.receipt, fingerprintStatus: normalized.fingerprintStatus });
    } catch (err) {
      skipped.push({ path, error: (err as Error).message });
    }
  }
  entries.sort((a, b) => b.receipt.generatedAt.localeCompare(a.receipt.generatedAt) || a.path.localeCompare(b.path));
  return { rootDir, entries, skipped };
}

export function receiptVaultPayload(load: ReceiptVaultLoadResult, generatedAt = new Date().toISOString()): ReceiptVaultPayload {
  const providers = new Set<string>();
  let usd = 0;
  let hasUsd = false;
  for (const entry of load.entries) {
    for (const provider of entry.receipt.providers) providers.add(provider.providerId);
    if (entry.receipt.totals.usdEst != null) {
      usd += entry.receipt.totals.usdEst;
      hasUsd = true;
    }
  }
  return {
    schema: "vibetracker.receipt-vault/0.1",
    generatedAt,
    rootDir: load.rootDir,
    safety: {
      receiptFileReads: true,
      providerCalls: false,
      usageWrites: false,
      uploads: false,
      secretsRead: false,
      promptsExported: false,
      outputsExported: false,
    },
    totals: {
      receipts: load.entries.length,
      providers: providers.size,
      fresh: load.entries.reduce((sum, entry) => sum + entry.receipt.totals.fresh, 0),
      accepted: load.entries.reduce((sum, entry) => sum + entry.receipt.totals.accepted, 0),
      duplicate: load.entries.reduce((sum, entry) => sum + entry.receipt.totals.duplicate, 0),
      errors: load.entries.reduce((sum, entry) => sum + entry.receipt.totals.errors, 0),
      ...(hasUsd ? { usdEst: usd } : {}),
      skipped: load.skipped.length,
    },
    entries: load.entries,
    skipped: load.skipped,
  };
}

function terminalVault(payload: ReceiptVaultPayload): string {
  const rows = payload.entries.slice(0, 12).map((entry) => {
    const receipt = entry.receipt;
    const usd = receipt.totals.usdEst != null ? ` $${receipt.totals.usdEst.toFixed(2)}` : "";
    return `${receipt.generatedAt.slice(0, 19)} ${fingerprintStatus(entry).padEnd(10)} ${shortFingerprint(receipt)} fresh ${String(receipt.totals.fresh).padStart(5)} accepted ${String(receipt.totals.accepted).padStart(5)}${usd}`;
  });
  return [
    "+------------------------------------------------------------+",
    "| VTK://RECEIPT-VAULT//LOCAL-INDEX//NO-PROVIDER-CALLS        |",
    "|------------------------------------------------------------|",
    `| root        ${payload.rootDir.padEnd(48).slice(0, 48)} |`,
    `| receipts    ${String(payload.totals.receipts).padEnd(48)} |`,
    `| providers   ${String(payload.totals.providers).padEnd(48)} |`,
    `| fresh       ${String(payload.totals.fresh).padEnd(48)} |`,
    `| accepted    ${String(payload.totals.accepted).padEnd(48)} |`,
    `| duplicate   ${String(payload.totals.duplicate).padEnd(48)} |`,
    `| holds       ${String(payload.totals.errors).padEnd(48)} |`,
    `| skipped     ${String(payload.totals.skipped).padEnd(48)} |`,
    "|------------------------------------------------------------|",
    "| recent receipts                                            |",
    ...(rows.length ? rows.map((row) => `| ${row.padEnd(58).slice(0, 58)} |`) : ["| no sync receipts found yet                                |"]),
    "|------------------------------------------------------------|",
    "| sha256 checked // receipt JSON only // provider calls no    |",
    "| usage writes no // prompts no // outputs no // secrets no  |",
    "| Vibers Unite // c0vibe.app                                 |",
    "+------------------------------------------------------------+",
  ].join("\n");
}

function providerMarks(entry: ReceiptVaultEntry): string {
  return entry.receipt.providers.slice(0, 5).map((provider) => {
    const brand = providerBrand(provider.providerId, provider.label);
    return `<span style="--from:${esc(brand.from)};--to:${esc(brand.to)}">${esc(brand.mark)}</span>`;
  }).join("");
}

function entryCards(payload: ReceiptVaultPayload): string {
  const maxFresh = Math.max(1, ...payload.entries.map((entry) => entry.receipt.totals.fresh));
  return payload.entries.map((entry, index) => {
    const receipt = entry.receipt;
    const fill = Math.max(0.04, receipt.totals.fresh / maxFresh).toFixed(3);
    const rel = entry.path.replace(`${payload.rootDir}/`, "");
    const usd = receipt.totals.usdEst != null ? `$${receipt.totals.usdEst.toFixed(2)} est.` : "no USD estimate";
    return `<article class="receipt" style="--i:${index};--fill:${fill}">
      <div class="receipt-top"><span>${esc(receipt.generatedAt.slice(0, 10))}</span><b>${esc(receipt.id)}</b><strong>${receipt.demo ? "DEMO" : "LIVE"}</strong></div>
      <div class="fingerprint-line"><span>${esc(fingerprintStatus(entry))}</span><code>${esc(receipt.fingerprint.algorithm)}:${esc(shortFingerprint(receipt))}</code></div>
      <div class="marks">${providerMarks(entry)}</div>
      <div class="meter"><i></i></div>
      <dl>
        <div><dt>fresh</dt><dd>${esc(receipt.totals.fresh)}</dd></div>
        <div><dt>accepted</dt><dd>${esc(receipt.totals.accepted)}</dd></div>
        <div><dt>duplicate</dt><dd>${esc(receipt.totals.duplicate)}</dd></div>
        <div><dt>holds</dt><dd>${esc(receipt.totals.errors)}</dd></div>
      </dl>
      <p>${esc(usd)} // ${esc(receipt.providers.length)} provider rails // ${esc(rel)}</p>
    </article>`;
  }).join("");
}

function vaultTimelineHtml(payload: ReceiptVaultPayload): string {
  const rows = payload.entries.slice(0, 8).map((entry, index) => {
    const receipt = entry.receipt;
    const mode = receipt.demo ? "DEMO" : "LIVE";
    return `${String(index + 1).padStart(2, "0")} ${mode.padEnd(4)} ${fingerprintStatus(entry).padEnd(10)} ${shortFingerprint(receipt)} fresh ${String(receipt.totals.fresh).padStart(4)} accepted ${String(receipt.totals.accepted).padStart(4)}`;
  });
  const events = payload.entries.slice(0, 8).map((entry, index) => {
    const receipt = entry.receipt;
    const mode = receipt.demo ? "DEMO" : "LIVE";
    const topProvider = receipt.providers[0];
    const brand = providerBrand(topProvider?.providerId ?? "vibetracker", topProvider?.label);
    return `<article class="timeline-event" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)}">
      <span>${esc(String(index + 1).padStart(2, "0"))}</span>
      <b>${esc(receipt.generatedAt.slice(0, 19))}</b>
      <strong>${esc(mode)} // ${esc(receipt.totals.providers)} providers</strong>
      <div class="marks">${providerMarks(entry)}</div>
      <p>fresh ${esc(receipt.totals.fresh)} // accepted ${esc(receipt.totals.accepted)} // duplicate ${esc(receipt.totals.duplicate)} // holds ${esc(receipt.totals.errors)}</p>
      <code>${esc(fingerprintStatus(entry))} // ${esc(receipt.fingerprint.algorithm)}:${esc(shortFingerprint(receipt))} // ${esc(receipt.id)}</code>
    </article>`;
  }).join("");
  return `<section class="timeline" aria-label="Receipt flight recorder timeline">
    <div class="timeline-head">
      <span>VTK://VAULT-TIMELINE//RECEIPT-FLIGHT-RECORDER//READ-ONLY</span>
      <b>Vault Timeline</b>
      <p>Receipts replay newest to oldest from local JSON only. This view makes no provider calls, usage writes, uploads, prompt exports, output exports, or secret reads.</p>
      <pre class="timeline-terminal">${esc(rows.length ? rows.join("\n") : "no receipt timeline yet")}</pre>
    </div>
    <div class="timeline-track">${events || `<article class="timeline-event empty"><b>No receipts yet</b><p>Run vibetracker sync --receipt to create the first local black-box receipt.</p></article>`}</div>
  </section>`;
}

function vaultCustodyHtml(payload: ReceiptVaultPayload): string {
  const verified = payload.entries.filter((entry) => fingerprintStatus(entry) === "verified").length;
  const normalized = payload.entries.filter((entry) => fingerprintStatus(entry) === "normalized").length;
  const cells = payload.entries.slice(0, 10).map((entry, index) => {
    const receipt = entry.receipt;
    const blocks = receipt.fingerprint.value.match(/.{1,8}/g)?.slice(0, 4).join(" ") ?? receipt.fingerprint.value;
    return `<article class="custody-cell" style="--i:${index}">
      <span>${esc(fingerprintStatus(entry))}</span>
      <b>${esc(receipt.demo ? "DEMO" : "LIVE")} ${esc(receipt.generatedAt.slice(0, 10))}</b>
      <code>${esc(blocks)}</code>
      <p>${esc(receipt.totals.fresh)} fresh // ${esc(receipt.totals.accepted)} accepted // ${esc(entry.path.replace(`${payload.rootDir}/`, ""))}</p>
    </article>`;
  }).join("");
  return `<section class="custody" aria-label="Vault custody proof wall">
    <div class="custody-head">
      <span>VTK://VAULT-CUSTODY//SHA256//LOCAL-ONLY</span>
      <b>Custody Wall</b>
      <p>Every current receipt carries a deterministic SHA-256 seal. Legacy receipts without a seal are normalized locally; receipts with mismatched seals are skipped before aggregation.</p>
      <div class="custody-stats">
        <span><b>${esc(verified)}</b> verified</span>
        <span><b>${esc(normalized)}</b> normalized legacy</span>
        <span><b>${esc(payload.totals.skipped)}</b> skipped</span>
      </div>
    </div>
    <div class="custody-grid">${cells || `<article class="custody-cell"><b>No custody entries yet</b><p>Run vibetracker sync --receipt to create a local sealed receipt.</p></article>`}</div>
  </section>`;
}

export function renderReceiptVault(payload: ReceiptVaultPayload): string {
  return terminalVault(payload);
}

export function renderReceiptVaultHtml(payload: ReceiptVaultPayload): string {
  const terminal = terminalVault(payload);
  const cards = entryCards(payload);
  const timeline = vaultTimelineHtml(payload);
  const custody = vaultCustodyHtml(payload);
  const skipped = payload.skipped.length
    ? `<section class="skipped"><b>Skipped files</b>${payload.skipped.map((file) => `<p>${esc(file.path)} // ${esc(file.error)}</p>`).join("")}</section>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Receipt Vault</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 16% 18%,rgba(46,232,214,.14),transparent 28%),radial-gradient(circle at 86% 12%,rgba(255,79,216,.12),transparent 24%);mix-blend-mode:screen}
  main{width:min(1220px,calc(100vw - 28px));margin:0 auto;padding:28px 0 44px}.hero{display:grid;grid-template-columns:minmax(0,.78fr) minmax(360px,1.22fr);gap:14px;min-height:560px}.panel,.terminal,.receipt,.skipped,.timeline,.timeline-event,.custody,.custody-cell{position:relative;min-width:0;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 32px 96px -72px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel,.terminal,.timeline,.custody{border-radius:12px}.panel{display:flex;flex-direction:column;justify-content:space-between;padding:22px}.panel::after,.terminal::after,.receipt::after,.timeline::after,.timeline-event::after,.custody::after,.custody-cell::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 59%);transform:translateX(-96%);animation:sweep 5.8s var(--motion) infinite;pointer-events:none}.eyebrow{color:var(--green);font-weight:950;text-transform:uppercase;font-size:11px}.panel h1{margin:10px 0 14px;color:#f8fff9;font:950 clamp(40px,7.2vw,88px)/.88 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24)}.panel p{max-width:58ch;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.totals span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:10px;color:#bff8e5;font-size:10px;font-weight:900;text-transform:uppercase}.totals b{display:block;color:#fff;font-size:20px}.terminal{padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:498px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:900 10px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}
  .timeline{display:grid;grid-template-columns:minmax(270px,.72fr) minmax(0,1.28fr);gap:1px;margin-top:14px}.timeline-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:14px;padding:14px;background:rgba(5,10,12,.84)}.timeline-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.timeline-head b{color:#f8fff9;font:950 26px/.94 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.timeline-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.timeline-terminal{position:relative;z-index:1;margin:0;padding:10px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:850 10px/1.32 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.timeline-track{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.timeline-event{min-height:198px;padding:12px;border-width:0 0 0 1px;box-shadow:none;background:linear-gradient(160deg,color-mix(in srgb,var(--from) 12%,rgba(9,18,22,.94)),rgba(4,7,9,.98));animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.timeline-event::before{content:"";position:absolute;left:12px;right:12px;bottom:12px;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 120ms)}.timeline-event>span{position:relative;z-index:1;display:grid;place-items:center;width:34px;height:28px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font-weight:950}.timeline-event b{position:relative;z-index:1;display:block;margin-top:10px;color:#f8fff9;font-size:12px;text-transform:uppercase}.timeline-event strong{position:relative;z-index:1;display:block;margin-top:8px;color:var(--gold);font-size:10px;text-transform:uppercase}.timeline-event code{position:relative;z-index:1;display:block;margin-top:8px;padding:7px;border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);color:#ffe7a3;font:800 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.timeline-event.empty{grid-column:1/-1;--from:var(--cyan);--to:var(--green)}
  .custody{display:grid;grid-template-columns:minmax(270px,.7fr) minmax(0,1.3fr);gap:1px;margin-top:14px}.custody-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:13px;padding:14px;background:linear-gradient(150deg,rgba(255,198,77,.08),rgba(4,10,12,.82))}.custody-head span,.custody-cell span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.custody-head b{color:#f8fff9;font:950 26px/.94 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.custody-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35;overflow-wrap:anywhere}.custody-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.custody-stats span{border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);padding:8px;color:#ffe7a3}.custody-stats b{display:block;color:#fff;font-size:18px}.custody-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px}.custody-cell{min-height:162px;padding:12px;border-width:0 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.custody-cell b{position:relative;z-index:1;display:block;margin-top:10px;color:#f8fff9;font-size:13px;text-transform:uppercase}.custody-cell code,.fingerprint-line code{position:relative;z-index:1;display:block;margin-top:8px;padding:7px;border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);color:#ffe7a3;font:800 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.custody-cell p{position:relative;z-index:1;margin:10px 0 0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.receipt{border-radius:10px;padding:12px;min-height:270px;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.receipt-top{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center}.receipt-top span{color:var(--green);font-size:10px;font-weight:950}.receipt-top b{min-width:0;color:#f4fff9;font-size:12px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.receipt-top strong{color:var(--gold);font-size:10px}.fingerprint-line{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;margin-top:10px}.fingerprint-line span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.fingerprint-line code{margin-top:0}.marks{position:relative;z-index:1;display:flex;gap:6px;margin:12px 0}.marks span{display:grid;place-items:center;width:36px;height:30px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font-weight:950}.meter{position:relative;z-index:1;height:9px;margin:12px 0;border:1px solid rgba(255,255,255,.11);background:#030708;overflow:hidden}.meter i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--pink),var(--cyan),var(--green));transform-origin:left;animation:fill 1s var(--motion) both}dl{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0}dt{color:var(--muted);font-size:9px;text-transform:uppercase}dd{margin:2px 0 0;color:#fff;font-size:18px}.receipt p,.timeline-event p,.skipped p{position:relative;z-index:1;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.skipped{margin-top:14px;border-radius:10px;padding:12px}.skipped b{color:var(--red);font-size:11px;text-transform:uppercase}footer{margin-top:14px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(96%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(var(--fill))}}@media (max-width:980px){.hero,.timeline,.custody{grid-template-columns:1fr}.grid,.timeline-track,.custody-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.terminal pre{min-height:330px}}@media (max-width:560px){main{width:min(100vw - 18px,1220px);padding-top:12px}.grid,.totals,.timeline-track,.custody-grid,.custody-stats{grid-template-columns:1fr}.panel{padding:16px}.panel h1{font-size:40px}.terminal pre,.timeline-terminal{font-size:8px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.meter i{transform:scaleX(var(--fill))}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER receipt vault">
    <section class="hero">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://RECEIPT-VAULT//LOCAL-INDEX//NO-PROVIDER-CALLS</div>
          <h1>Receipt<br>Vault</h1>
          <p>A local index of sync receipts. It reads black-box receipt JSON only and never calls providers, uploads, mutates usage, or exports prompts, outputs, or secrets.</p>
        </div>
        <div class="totals">
          <span><b>${esc(payload.totals.receipts)}</b> receipts</span>
          <span><b>${esc(payload.totals.providers)}</b> providers</span>
          <span><b>${esc(payload.totals.fresh)}</b> fresh records</span>
          <span><b>${esc(payload.totals.errors)}</b> provider holds</span>
        </div>
      </div>
      <section class="terminal" aria-label="Receipt vault terminal">
        <div class="terminal-top"><span>receipt-vault@vibetracker</span><b>Vibers Unite</b></div>
        <pre>${esc(terminal)}</pre>
      </section>
    </section>
    ${timeline}
    ${custody}
    <section class="grid" aria-label="Receipt runs">${cards || ""}</section>
    ${skipped}
    <footer><span class="accent">Static vault:</span> script-free local HTML. Receipt JSON reads only; no provider calls, no uploads, no usage writes.</footer>
  </main>
</body>
</html>`;
}
