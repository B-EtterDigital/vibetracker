import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { renderShareBadgeMarkdown, renderShareBadgeSvg, renderSharePosterMarkdown, renderSharePosterSvg } from "./badge.ts";
import { buildStudioPackFiles } from "./studio-pack.ts";
import { buildSyncReceiptFiles, syncReceiptPayload, type SyncReceiptInput, type SyncReceiptPayload } from "./sync-receipt.ts";
import { receiptVaultPayload, renderReceiptVaultHtml } from "./receipt-vault.ts";
import { providerBrand } from "./provider-brand.ts";

export interface LaunchKitOptions {
  providerIds?: string[];
  generatedAt?: string;
}

export interface LaunchKitFile {
  path: string;
  label: string;
  description: string;
  content: string;
}

export interface LaunchKitManifestFile {
  path: string;
  label: string;
  description: string;
}

export interface LaunchKitManifest {
  schema: "vibetracker.launch-kit/0.1";
  title: string;
  motto: string;
  generatedAt: string;
  demoData: true;
  safety: {
    providerCalls: false;
    usageWrites: false;
    uploads: false;
    secretsRead: false;
    promptsExported: false;
    outputsExported: false;
  };
  demoReceipt?: {
    id: string;
    path: "receipt/sync-receipt.json";
    fingerprint: SyncReceiptPayload["fingerprint"];
    totals: Pick<SyncReceiptPayload["totals"], "fresh" | "accepted" | "duplicate" | "errors">;
    safety: Pick<SyncReceiptPayload["safety"], "uploads" | "secretsExported" | "promptsExported" | "outputsExported">;
  };
  files: LaunchKitManifestFile[];
}

const esc = (value: unknown): string => String(value).replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[char]!);

function launchKitId(generatedAt: string): string {
  return `launch-kit-${generatedAt.replace(/[:.]/g, "-")}`;
}

function demoReceipt(generatedAt: string, providerIds: string[]): SyncReceiptInput {
  const ids = providerIds.length ? providerIds : ["higgsfield", "codex-cli", "ollama", "replicate"];
  const wanted = new Set(ids.map((id) => id.toLowerCase()));
  const checkpoints: SyncReceiptInput["checkpoints"] = [];
  if (wanted.has("higgsfield") || checkpoints.length < 1) {
    checkpoints.push({
      providerId: "higgsfield",
      label: "Higgsfield",
      status: "new",
      received: 42,
      accepted: 40,
      fresh: 38,
      duplicate: 2,
      usd: 12.4,
      sourceMix: [
        { source: "ledger", count: 24 },
        { source: "feed_recon", count: 14 },
      ],
      hint: "demo receipt: validated creator usage would write to the local ledger",
    });
  }
  if (wanted.has("codex-cli") || wanted.has("github-cli") || wanted.has("claude-code") || checkpoints.length < 2) {
    checkpoints.push({
      providerId: "codex-cli",
      label: "Codex CLI",
      status: "up_to_date",
      received: 0,
      accepted: 0,
      fresh: 0,
      duplicate: 0,
      sourceMix: [],
      hint: "demo receipt: builder evidence is a NOT USAGE trust rail",
    });
  }
  if (wanted.has("ollama") || wanted.has("lmstudio") || wanted.has("comfyui") || checkpoints.length < 3) {
    checkpoints.push({
      providerId: "ollama",
      label: "Ollama",
      status: "new",
      received: 11,
      accepted: 11,
      fresh: 11,
      duplicate: 0,
      sourceMix: [{ source: "local", count: 11 }],
      hint: "demo receipt: local AI stays on-machine",
    });
  }
  if (wanted.has("replicate") || wanted.has("falai") || wanted.has("runway") || checkpoints.length < 4) {
    checkpoints.push({
      providerId: "replicate",
      label: "Replicate",
      status: "new",
      received: 8,
      accepted: 7,
      fresh: 6,
      duplicate: 1,
      usd: 3.8,
      sourceMix: [{ source: "api", count: 6 }],
      hint: "demo receipt: creator API spend remains source-labelled",
    });
  }
  return {
    id: `demo-${launchKitId(generatedAt)}`,
    generatedAt,
    storePath: "~/.vibetracker/records.jsonl",
    providerIds: ids,
    demo: true,
    checkpoints,
  };
}

function demoBadgeRecords(generatedAt: string, providerIds: string[]): NormalizedRecord[] {
  const ids = providerIds.length ? providerIds : ["higgsfield", "codex-cli", "ollama", "replicate"];
  const wanted = new Set(ids.map((id) => id.toLowerCase()));
  const records: NormalizedRecord[] = [
    {
      ts: generatedAt,
      provider: "higgsfield",
      category: "video",
      operation: "generation",
      quantity: 1,
      unit: "request",
      rawAmount: 42,
      rawUnit: "credits",
      usdEst: 12.4,
      source: "ledger",
      confidence: "high",
      verified: false,
    },
    {
      ts: generatedAt,
      provider: "ollama",
      category: "llm",
      operation: "chat",
      quantity: 11,
      unit: "request",
      rawAmount: 11,
      rawUnit: "request",
      source: "local",
      confidence: "medium",
      verified: false,
    },
    {
      ts: generatedAt,
      provider: "replicate",
      category: "image",
      operation: "generation",
      quantity: 7,
      unit: "request",
      rawAmount: 7,
      rawUnit: "request",
      usdEst: 3.8,
      source: "api",
      confidence: "medium",
      verified: false,
    },
  ];
  return records.filter((record) => wanted.has(record.provider) || record.provider === "higgsfield");
}

function demoBadgeTrustSignals(generatedAt: string): TrustSignal[] {
  return [
    {
      kind: "github_activity",
      source: "github_cli",
      label: "GitHub activity evidence (not AI usage)",
      handle: "demo-viber",
      fetchedAt: generatedAt,
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-07T00:00:00.000Z",
      windowDays: 7,
      totalContributions: 18,
      commitContributions: 14,
      issueContributions: 1,
      pullRequestContributions: 2,
      pullRequestReviewContributions: 1,
      repositoryContributions: 0,
      days: [
        { date: "2026-07-01", count: 0, level: 0 },
        { date: "2026-07-02", count: 2, level: 1 },
        { date: "2026-07-03", count: 5, level: 2 },
        { date: "2026-07-04", count: 9, level: 3 },
        { date: "2026-07-05", count: 18, level: 4 },
        { date: "2026-07-06", count: 3, level: 2 },
        { date: "2026-07-07", count: 0, level: 0 },
      ],
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Demo trust evidence only. Not counted as usage, spend, credits, or verified provider data.",
    },
  ];
}

export function launchKitManifest(files: LaunchKitFile[], generatedAt: string, receiptPayload?: SyncReceiptPayload): LaunchKitManifest {
  return {
    schema: "vibetracker.launch-kit/0.1",
    title: "VibeTRACKER Launch Kit",
    motto: "Vibers Unite // c0vibe.app",
    generatedAt,
    demoData: true,
    safety: {
      providerCalls: false,
      usageWrites: false,
      uploads: false,
      secretsRead: false,
      promptsExported: false,
      outputsExported: false,
    },
    ...(receiptPayload ? {
      demoReceipt: {
        id: receiptPayload.id,
        path: "receipt/sync-receipt.json" as const,
        fingerprint: receiptPayload.fingerprint,
        totals: {
          fresh: receiptPayload.totals.fresh,
          accepted: receiptPayload.totals.accepted,
          duplicate: receiptPayload.totals.duplicate,
          errors: receiptPayload.totals.errors,
        },
        safety: {
          uploads: receiptPayload.safety.uploads,
          secretsExported: receiptPayload.safety.secretsExported,
          promptsExported: receiptPayload.safety.promptsExported,
          outputsExported: receiptPayload.safety.outputsExported,
        },
      },
    } : {}),
    files: files.map(({ path, label, description }) => ({ path, label, description })),
  };
}

function renderLaunchKitReadme(manifest: LaunchKitManifest): string {
  return [
    "# VibeTRACKER Launch Kit",
    "",
    "Open `index.html` first.",
    "",
    "This is a local demo/showcase pack. It does not call providers, write usage records, upload, read secrets, or export prompts/outputs.",
    "",
    "Impress commands:",
    "",
    "```bash",
    "vibetracker impress --open",
    "vibetracker vibe --json",
    "```",
    "",
    "`impress --open` opens the Vibers Unite Room first. `vibe --json` prints the same launch manifest as machine-readable metadata.",
    "",
    "Files:",
    ...manifest.files.map((file) => `- ${file.path} - ${file.description}`),
    "",
    "Demo share badge:",
    "",
    "```md",
    renderShareBadgeMarkdown("./share/vibetracker-badge.svg", { handle: "demo-viber", profileUrl: "https://c0vibe.app/u/demo-viber" }),
    "```",
    "",
    "The badge is demo data and uses reviewed-aggregate semantics: usage metrics feed the badge, while GitHub trust heatgrid cells stay labelled not usage.",
    "",
    "Demo share poster:",
    "",
    "```md",
    renderSharePosterMarkdown("./share/vibetracker-poster.svg", { handle: "demo-viber", profileUrl: "https://c0vibe.app/u/demo-viber" }),
    "```",
    "",
    "The poster is a larger release/social card with the same local-first receipt: no prompts, outputs, secrets, or trust-to-usage inflation.",
    "",
    ...(manifest.demoReceipt ? [
      "Demo receipt seal:",
      "",
      `- id: ${manifest.demoReceipt.id}`,
      `- fingerprint: ${manifest.demoReceipt.fingerprint.algorithm}:${manifest.demoReceipt.fingerprint.value}`,
      "- demo uploads/prompts/outputs/secrets exported: no",
      "",
    ] : []),
    "Real collection command:",
    "",
    "```bash",
    "vibetracker sync --receipt --out ~/.vibetracker/receipts/<run>",
    "vibetracker receipts --html --out ~/.vibetracker/receipts/index.html",
    "```",
    "",
    "Vibers Unite // c0vibe.app",
    "",
  ].join("\n");
}

export function renderLaunchOperatorShowHtml(manifest: LaunchKitManifest, providerIds: string[] = []): string {
  const ids = providerIds.length ? providerIds : ["higgsfield", "codex-cli", "ollama", "replicate", "c0vibe"];
  const brands = Array.from(new Set([...ids, "c0vibe"])).slice(0, 9).map((id) => providerBrand(id));
  const marks = brands.map((brand, index) => `<span style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}" title="${esc(brand.label)}">${esc(brand.mark)}</span>`).join("");
  const providers = brands.map((brand, index) => `<article class="provider" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}">
      <i>${esc(brand.mark)}</i>
      <b>${esc(brand.label)}</b>
      <span>${index === 1 ? "NOT USAGE trust rail" : index === 2 ? "local-first source" : "branded source rail"}</span>
    </article>`).join("");
  const lanes = [
    ["USAGE ONLY", "Usage Datastream", "score + heatgrid + public profile", "Daily aggregates fill the official-color rhythm without importing trust points."],
    ["NOT USAGE", "Trust Side Rail", "GitHub + MCP + creator cadence", "Connection and contribution evidence is displayed, labelled, and excluded from spend."],
    ["LOCAL", "Local AI Proof", "Ollama + LM Studio + ComfyUI", "Local work can show saved cloud-equivalent value while staying on this machine."],
    ["PRIVACY", "Receipt Boundary", "dry-run -> redaction -> review", "No prompt text, output text, secrets, or raw files are part of the launch kit."],
    ["PUBLISH", "C0VIBE Relay", "c0vibe.app after explicit review", "The public score, profile, and leaderboard move only after the user approves upload."],
  ].map(([rail, title, target, copy], index) => `<article class="lane" data-rail="${esc(rail)}" style="--i:${index}">
      <span>${esc(rail)}</span>
      <b>${esc(title)}</b>
      <code>${esc(target)}</code>
      <p>${esc(copy)}</p>
      <em><strong></strong></em>
    </article>`).join("");
  const safety = [
    ["providerCalls", manifest.safety.providerCalls],
    ["ledgerWrites", manifest.safety.usageWrites],
    ["uploads", manifest.safety.uploads],
    ["secretReads", manifest.safety.secretsRead],
    ["promptReads", manifest.safety.promptsExported],
    ["outputReads", manifest.safety.outputsExported],
  ].map(([label, value]) => `<span>${esc(label)}=${value ? "1" : "0"}</span>`).join("");
  const flightSteps = [
    ["00", "boot show", "CSS-only provider flywheel", "visual feedback only"],
    ["01", "split rails", "usage, trust, local, privacy, publish", "trust never becomes spend"],
    ["02", "receipt path", "sync --receipt -> receipt vault", "real rows start after user command"],
    ["03", "relay hold", "c0vibe.app waits for review", "upload remains explicit"],
  ].map(([step, label, target, detail], index) => `<article class="flight-step" style="--i:${index}">
      <span>${esc(step)} ${esc(label)}</span>
      <b>${esc(target)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  const encoreSpecs = [
    ["codex-cli", "00", "Codex cube tilt", "boot rail", "vibetracker motion --preflight", "local-only; prompt reads=0", "┌CX┐\n╱CX╲\n└CX┘"],
    ["higgsfield", "11", "Higgsfield prism turn", "creator trust", "vibetracker trust higgsfield --mcp", "MCP trust signal; usage writes=0", " /HF\\ \n< HF >\n \\HF/ "],
    ["ollama", "22", "Local AI sonar bloom", "local rail", "vibetracker scan local-ai --dry-run", "Ollama/LM Studio/ComfyUI stay local", "  OL  \n((OL))\nOL::LM"],
    ["qwen", "33", "World source map snap", "regional rail", "vibetracker scan regional --capabilities", "capability context; provider calls=0", "CN⟷EU\nQW MI\nAI MAP"],
    ["github-actions", "44", "Receipt lock", "proof rail", "vibetracker upload --dry-run", "review before publish; uploads=0", "[GH]\n{SHA}\nLOCK"],
    ["c0vibe", "58", "Vibers Unite relay flash", "relay rail", "vibetracker profile --relay c0vibe.app", "explicit approval before c0vibe.app", "C0\nVIBE\nUNITE"],
  ] as const;
  const encoreBeats = encoreSpecs.map(([providerId, second, title, rail, command, boundary, frame], index) => {
    const brand = providerBrand(providerId);
    return `<article class="encore-beat" style="--i:${index};--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}">
      <div class="encore-frame" aria-hidden="true"><pre>${esc(frame)}</pre></div>
      <div>
        <span>${esc(second)}s / ${esc(rail)}</span>
        <b>${esc(title)}</b>
        <code>${esc(command)}</code>
        <p>${esc(boundary)}</p>
      </div>
      <footer><i>${esc(brand.mark)}</i><em>sidefx=0</em></footer>
    </article>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Operator Show</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.023) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 12% 10%,rgba(46,232,214,.14),transparent 26%),radial-gradient(circle at 90% 18%,rgba(255,79,216,.12),transparent 25%),radial-gradient(circle at 48% 100%,rgba(54,227,155,.1),transparent 30%);mix-blend-mode:screen}
  main{width:min(1280px,calc(100vw - 28px));margin:0 auto;padding:22px 0 42px}.show{position:relative;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,rgba(7,16,19,.97),rgba(4,7,9,.99));box-shadow:0 44px 130px -96px var(--cyan),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.show::before{content:"";position:absolute;left:0;right:10%;top:0;height:1px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold),var(--pink),transparent)}.hero{position:relative;z-index:1;display:grid;grid-template-columns:minmax(320px,.72fr) minmax(0,1.28fr);gap:1px;background:rgba(255,255,255,.07)}.poster,.console{min-height:560px;background:#050708}.poster{display:grid;align-content:space-between;gap:18px;padding:18px;background:radial-gradient(circle at 24% 20%,rgba(46,232,214,.15),transparent 32%),linear-gradient(180deg,rgba(10,20,24,.96),#050708)}.eyebrow{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.poster h1{margin:10px 0 8px;color:#f8fff9;font:950 clamp(38px,5vw,72px)/.86 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24);overflow-wrap:anywhere}.poster p{max-width:54ch;margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.stamp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.stamp span{display:grid;place-items:center;min-height:88px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.2);color:var(--cyan);font:1000 clamp(26px,5vw,58px)/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 24px rgba(46,232,214,.38);animation:tilt 5.8s var(--motion) infinite}.stamp span:nth-child(2){color:var(--pink);animation-delay:-1.6s}.stamp span:nth-child(3){color:var(--green);animation-delay:-3.1s}.safety{display:flex;flex-wrap:wrap;gap:6px}.safety span{border:1px solid rgba(54,227,155,.18);border-radius:999px;padding:6px 8px;background:rgba(0,0,0,.24);color:#bff8e5;font-size:9px;font-weight:950;text-transform:uppercase}.console{position:relative;padding:12px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 18px),#050708}.console::after{content:"";position:absolute;left:12px;right:12px;top:70px;height:34px;background:linear-gradient(180deg,transparent,rgba(46,232,214,.18),rgba(54,227,155,.1),transparent);animation:scan 4.4s var(--motion) infinite;pointer-events:none}.top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px;padding:6px 2px 12px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase;overflow-wrap:anywhere}.top b{color:var(--gold)}pre{position:relative;z-index:1;margin:0;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;white-space:pre-wrap;font:900 10px/1.23 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.providers{position:relative;z-index:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px;margin-top:10px}.provider{min-height:92px;padding:9px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(135deg,var(--from),var(--to));color:var(--ink);animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 62ms)}.provider i{display:block;color:var(--ink);font:1000 24px/1 ui-monospace,SFMono-Regular,Menlo,monospace;font-style:normal}.provider b,.provider span{display:block;color:var(--ink);text-shadow:0 1px 12px rgba(0,0,0,.24);overflow-wrap:anywhere}.provider b{margin-top:10px;text-transform:uppercase}.provider span{font-size:10px}.flight{position:relative;z-index:1;display:grid;grid-template-columns:minmax(280px,.7fr) minmax(0,1.3fr);gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.07)}.flight-head{display:grid;align-content:space-between;gap:14px;min-height:330px;padding:14px;background:radial-gradient(circle at 55% 45%,rgba(46,232,214,.15),transparent 36%),linear-gradient(160deg,rgba(159,124,255,.1),#05080a)}.flight-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.flight-head b{display:block;color:#f8fff9;font:950 28px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.flight-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.deck-marks{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.deck-marks span{display:grid;place-items:center;min-height:42px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,var(--from),var(--to));color:var(--ink);font:1000 16px/1 ui-monospace,SFMono-Regular,Menlo,monospace;animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 56ms)}.flight-console{display:grid;grid-template-rows:auto 1fr;gap:10px;padding:12px;background:#040708}.flight-console pre{min-height:214px}.flight-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.flight-step{position:relative;min-height:132px;padding:12px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(46,232,214,.09),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 76ms)}.flight-step::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--cyan),var(--green),var(--gold));transform-origin:left;animation:fill .9s var(--motion) forwards;animation-delay:calc(var(--i) * 92ms)}.flight-step span{position:relative;z-index:1;color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.flight-step b{position:relative;z-index:1;display:block;margin-top:8px;color:#f8fff9;font-size:13px;text-transform:uppercase;overflow-wrap:anywhere}.flight-step p{position:relative;z-index:1;margin:8px 0 0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.encore{position:relative;z-index:1;display:grid;grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);gap:1px;border-top:1px solid var(--line);background:rgba(255,255,255,.07)}.encore-head{display:grid;align-content:space-between;gap:14px;min-height:342px;padding:14px;background:radial-gradient(circle at 40% 48%,rgba(255,79,216,.12),transparent 34%),linear-gradient(160deg,rgba(46,232,214,.1),#05080a)}.encore-head span{color:var(--green);font-size:10px;font-weight:950;text-transform:uppercase}.encore-head b{display:block;color:#f8fff9;font:950 28px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.encore-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.encore-head pre{min-height:156px}.encore-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#040708}.encore-beat{position:relative;display:grid;grid-template-columns:86px 1fr;gap:10px;min-height:170px;padding:11px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,color-mix(in srgb,var(--from) 18%,transparent),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(var(--i) * 82ms)}.encore-beat::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill .9s var(--motion) forwards;animation-delay:calc(180ms + var(--i) * 96ms)}.encore-frame{position:relative;min-height:84px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.28);overflow:hidden}.encore-frame::before{content:"";position:absolute;inset:auto 0 0 0;height:26px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--to) 28%,transparent),transparent);animation:scan 4.2s var(--motion) infinite;animation-delay:calc(var(--i) * 130ms)}.encore-frame pre{display:grid;place-items:center;min-height:84px;padding:8px;border:0;background:transparent;color:var(--ink);font-size:16px;line-height:1.05;text-align:center;text-shadow:0 0 20px color-mix(in srgb,var(--to) 36%,transparent)}.encore-beat span{position:relative;z-index:1;color:var(--gold);font-size:10px;font-weight:950;text-transform:uppercase}.encore-beat b{position:relative;z-index:1;display:block;margin-top:7px;color:#f8fff9;font-size:13px;text-transform:uppercase;overflow-wrap:anywhere}.encore-beat code{position:relative;z-index:1;display:block;margin-top:7px;color:#dffef6;font-size:10px;overflow-wrap:anywhere}.encore-beat p{position:relative;z-index:1;margin:7px 0 0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}.encore-beat footer{position:relative;z-index:1;grid-column:1/-1;display:flex;justify-content:space-between;gap:8px;padding:0;color:#bff8e5}.encore-beat footer i{color:var(--ink);font-style:normal;font-weight:1000}.encore-beat footer em{font-style:normal;color:var(--green)}.lanes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.07)}.lane{position:relative;display:grid;grid-template-rows:auto auto auto 1fr auto;gap:9px;min-height:258px;padding:12px;background:linear-gradient(145deg,rgba(46,232,214,.12),#05080a);overflow:hidden;animation:rise .54s var(--motion) both;animation-delay:calc(160ms + var(--i) * 70ms)}.lane[data-rail="USAGE ONLY"]{background:linear-gradient(145deg,rgba(255,79,216,.13),#05080a)}.lane[data-rail="NOT USAGE"]{background:repeating-linear-gradient(-45deg,rgba(255,198,77,.07) 0 1px,transparent 1px 9px),linear-gradient(145deg,rgba(255,79,216,.1),#05080a)}.lane[data-rail="LOCAL"]{background:linear-gradient(145deg,rgba(54,227,155,.12),#05080a)}.lane[data-rail="PRIVACY"]{background:linear-gradient(145deg,rgba(255,198,77,.12),#05080a)}.lane[data-rail="PUBLISH"]{background:linear-gradient(145deg,rgba(46,232,214,.1),#05080a)}.lane::after{content:attr(data-rail);position:absolute;right:8px;bottom:10px;color:rgba(217,255,242,.08);font:1000 18px/.9 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}.lane span{position:relative;z-index:1;color:var(--gold);font-size:9px;font-weight:1000}.lane b{position:relative;z-index:1;color:#f8fff9;font-size:14px;text-transform:uppercase}.lane code{position:relative;z-index:1;color:#dffef6;border:1px solid rgba(255,255,255,.09);border-radius:7px;padding:7px;background:rgba(0,0,0,.22);overflow-wrap:anywhere}.lane p{position:relative;z-index:1;margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;overflow-wrap:anywhere}.lane em{position:relative;z-index:1;display:block;height:8px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:#030708;overflow:hidden}.lane em strong{display:block;width:96%;height:100%;background:linear-gradient(90deg,var(--cyan),var(--green));transform-origin:left center;transform:scaleX(0);animation:fill .9s var(--motion) forwards;animation-delay:calc(240ms + var(--i) * 90ms)}footer{padding:12px;color:var(--muted);font-size:11px;overflow-wrap:anywhere}.accent{color:var(--green)}@keyframes scan{to{transform:translateY(300px)}}@keyframes tilt{0%,100%{transform:perspective(340px) rotateY(-17deg)}50%{transform:perspective(340px) rotateY(17deg)}}@keyframes rise{from{transform:translateY(12px)}to{transform:none}}@keyframes fill{to{transform:none}}@media(max-width:1060px){.hero,.flight,.encore{grid-template-columns:1fr}.poster,.console{min-height:360px}.flight-steps,.encore-grid,.lanes{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){main{width:min(100vw - 18px,1280px);padding-top:10px}.poster h1{font-size:42px}.poster p{max-width:32ch;font-size:14px}.stamp{grid-template-columns:1fr}.stamp span{min-height:54px}.flight-steps,.encore-grid,.lanes{grid-template-columns:1fr}.flight-head,.encore-head{min-height:280px}.lane{min-height:220px}pre{font-size:8px}.providers{grid-template-columns:1fr}.encore-beat{grid-template-columns:1fr}.encore-frame pre{font-size:14px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.lane em strong,.flight-step::after,.encore-beat::after{transform:none}.encore-frame::before{display:none}}
</style>
</head>
<body>
<main aria-label="VibeTRACKER operator show">
  <section class="show">
    <section class="hero">
      <div class="poster">
        <div>
          <div class="eyebrow">VTK://OPERATOR-SHOW//OFFLINE//NO-SIDE-EFFECTS</div>
          <h1>Operator<br>Show</h1>
          <p>A guided first-click show for VibeTRACKER: terminal charm, branded provider theatre, the usage datastream, trust side rails, and the C0VIBE relay in one local file.</p>
        </div>
        <div class="stamp" aria-label="Animated operator marks"><span>HF</span><span>CX</span><span>C0</span></div>
        <div class="safety" aria-label="Operator show safety counters">${safety}</div>
      </div>
      <aside class="console" aria-label="Operator show terminal">
        <div class="top"><span>${esc(manifest.schema)}</span><b>Vibers Unite</b></div>
        <pre>+------------------------------------------------------------------+
| VTK://OPERATOR-SHOW//VIBETRACKER//C0VIBE.APP                   |
|------------------------------------------------------------------|
| 00  open operator-show.html      guided offline show             |
| 01  inspect usage datastream     score + heatgrid + profile      |
| 02  inspect trust side rail      NOT USAGE, never spend/rank     |
| 03  inspect receipt boundary     dry-run, redaction, review      |
| 04  relay to c0vibe.app          only after explicit approval    |
|                                                                  |
| providerCalls=0 ledgerWrites=0 uploads=0 secretsRead=0           |
| promptReads=0 outputReads=0 hiddenNetwork=0 confetti=0           |
|                                                                  |
| Motto: Vibers Unite                                              |
+------------------------------------------------------------------+</pre>
        <section class="providers" aria-label="Branded provider marks">${providers}</section>
      </aside>
    </section>
    <section class="flight" aria-label="Operator flight deck">
      <div class="flight-head">
        <span>VTK://OPERATOR-FLIGHT-DECK//CSS-ONLY//ZERO-SIDE-EFFECTS</span>
        <b>Operator<br>Flight Deck</b>
        <p>The first click now stages the scan like a control room: provider theatre, rail split, receipt route, and C0VIBE relay are visible before real collection starts.</p>
        <div class="deck-marks" aria-label="CSS-only provider flywheel">${marks}</div>
      </div>
      <div class="flight-console">
        <pre>+------------------------------------------------------------------+
| OPERATOR FLIGHT DECK                                             |
|------------------------------------------------------------------|
| providerCalls 0     ledgerWrites 0     uploads 0                 |
| secretReads   0     promptReads 0      outputReads 0             |
| hiddenNetwork 0     confetti 0         fakeUsage 0               |
|                                                                  |
| no provider calls, no usage writes, no uploads                   |
| C0VIBE relay only after review                                   |
| Vibers Unite // c0vibe.app                                       |
+------------------------------------------------------------------+</pre>
        <div class="flight-steps">${flightSteps}</div>
      </div>
    </section>
    <section class="encore" aria-label="Operator surprise encore tape">
      <div class="encore-head">
        <span>VTK://SURPRISE-ENCORE-TAPE//ASCII//ZERO-SIDEFX</span>
        <b>Encore<br>Tape</b>
        <p>Six authored ASCII surprises fire across boot, creator, local, regional, proof, and relay rails before real collection starts.</p>
        <pre>+--------------------------------------------------+
| SURPRISE ENCORE TAPE                             |
|--------------------------------------------------|
| Codex cube tilt         sidefx=0                 |
| Higgsfield prism turn   usage writes=0           |
| Local AI sonar bloom    hidden uploads=0         |
| World source map snap   provider calls=0         |
| Receipt lock            publish writes=0         |
| Vibers Unite relay      review before C0VIBE.APP |
+--------------------------------------------------+</pre>
      </div>
      <div class="encore-grid">${encoreBeats}</div>
    </section>
    <section class="lanes" aria-label="Operator show labelled rails">${lanes}</section>
    <footer><span class="accent">Static, script-free, offline:</span> this show is visual feedback only. It does not collect, upload, or read usage; real data starts after the user runs the connected sync path.</footer>
  </section>
</main>
</body>
</html>`;
}

function renderLaunchKitIndex(manifest: LaunchKitManifest, providerIds: string[] = []): string {
  const cards = [
    ["operator-show.html", "Operator Show", "guided first-click show with terminal, providers, score rails, and safety counters"],
    ["studio/index.html", "Studio Pack", "terminal theatre, command cockpit, surprise reel, and showcase"],
    ["studio/boot-panorama.html", "Boot Panorama", "first-open command room with zero-call proof rails"],
    ["studio/vibers-unite-room.html", "Vibers Unite Room", "terminal GUI wow room with provider orbit, trust heatgrid, score datastream, and C0VIBE publish hold"],
    ["studio/flight-recorder.html", "Flight Recorder", "replayable surprise tape with visual-only safety labels"],
    ["studio/ascii-motion-lab.html", "ASCII Motion Lab", "research-backed terminal motion bench with Linux references and visible attribution"],
    ["studio/github-trust-heatgrid.html", "GitHub Trust Heatgrid", "official GitHub color contribution replay labelled NOT USAGE"],
    ["studio/vibe-score-reactor.html", "Vibe Score Reactor", "score, profile, heatgrid, and trust quarantine from one reviewed stream"],
    ["studio/oss-motion-receipt.html", "OSS Motion Receipt", "real cli-spinners, ascii-globe, and drawille frames with attribution"],
    ["studio/wizard-runway.html", "Wizard Runway", "script-free first-run terminal-to-GUI scan room"],
    ["studio/local-ai-radar.html", "Local AI Radar", "detect --html preview shell for loopback probes and manual local rails"],
    ["share/vibetracker-badge.svg", "Demo Share Badge", "self-contained SVG badge with usage, trust heatgrid, and C0VIBE relay"],
    ["share/badge.md", "Badge Markdown", "copy-ready Markdown snippet for the demo badge"],
    ["share/vibetracker-poster.svg", "Vibers Unite Poster", "large self-contained SVG poster with provider brands, trust quarantine, and receipt strip"],
    ["share/poster.md", "Poster Markdown", "copy-ready Markdown snippet for the Vibers Unite poster"],
    ["receipt/sync-receipt.html", "Demo Sync Receipt", "black-box receipt with provider rails and no upload"],
    ["receipts/index.html", "Receipt Vault", "local index over receipt JSON files"],
    ["README.md", "Operator Notes", "what the pack proves and how to run the real path"],
    ["manifest.json", "Manifest", "machine-readable file list and safety flags"],
  ].map(([href, label, detail], index) => `<a class="card" href="${esc(href)}" style="--i:${index}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <b>${esc(label)}</b>
      <small>${esc(detail)}</small>
    </a>`).join("");
  const dossier = [
    ["00", "WATCH", "operator-show.html", "guided offline show before any command is run"],
    ["01", "OPEN", "studio/index.html", "script-free terminal GUI theatre"],
    ["02", "VERIFY", "manifest.json", "demoData=true and every network/write flag is false"],
    ["03", "INSPECT", "receipt/sync-receipt.json", "machine-readable demo receipt with local safety flags"],
    ["04", "RUN REAL", "sync --receipt", "replace demo rows with a real local receipt"],
  ].map(([step, verb, target, detail], index) => `<article class="proof-cell" style="--i:${index}">
      <span>${esc(step)} ${esc(verb)}</span>
      <b>${esc(target)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  const safetyTape = [
    ["provider calls", manifest.safety.providerCalls],
    ["usage writes", manifest.safety.usageWrites],
    ["uploads", manifest.safety.uploads],
    ["secret reads", manifest.safety.secretsRead],
    ["prompt export", manifest.safety.promptsExported],
    ["output export", manifest.safety.outputsExported],
  ].map(([label, value]) => `<span>${esc(label)} <b>${value ? "YES" : "NO"}</b></span>`).join("");
  const firstMinute = [
    ["00", "offline show", "operator-show.html", "visual theatre only; providerCalls=0"],
    ["01", "receipt seal", "receipt/sync-receipt.html", "demo fingerprint is visible before real sync"],
    ["02", "vault replay", "receipts/index.html", "reads local receipt JSON only"],
    ["03", "real path", "vibetracker sync --receipt", "replace demo rows with accepted local records"],
  ].map(([step, label, target, detail], index) => `<article class="minute-step" style="--i:${index}">
      <span>${esc(step)} ${esc(label)}</span>
      <b>${esc(target)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  const receiptSeal = manifest.demoReceipt
    ? `<div class="receipt-seal" aria-label="Demo receipt fingerprint">
        <span>VTK://DEMO-RECEIPT-SEAL//SHA256//NO-UPLOAD</span>
        <b>${esc(manifest.demoReceipt.fingerprint.algorithm)}:${esc(manifest.demoReceipt.fingerprint.value.slice(0, 16))}</b>
        <code>${esc(manifest.demoReceipt.fingerprint.value.match(/.{1,8}/g)?.join(" ") ?? manifest.demoReceipt.fingerprint.value)}</code>
        <p>${esc(manifest.demoReceipt.totals.fresh)} demo fresh records // uploads NO // prompts NO // outputs NO // secrets NO</p>
      </div>`
    : "";
  const theatreIds = [...providerIds, "c0vibe"].filter((id, index, all) => all.indexOf(id) === index);
  const theatreBrands = (theatreIds.length ? theatreIds : ["higgsfield", "codex-cli", "ollama", "replicate", "c0vibe"])
    .map((id) => providerBrand(id));
  const orbit = theatreBrands.map((brand, index) => {
    const rot = Math.round((360 / theatreBrands.length) * index);
    return `<span class="orbit-mark" style="--i:${index};--rot:${rot}deg;--from:${esc(brand.from)};--to:${esc(brand.to)};--ink:${esc(brand.ink)}" title="${esc(brand.label)}"><b>${esc(brand.mark)}</b><small>${esc(brand.label)}</small></span>`;
  }).join("");
  const signalRows = [
    ["USAGE", `${manifest.demoReceipt?.totals.accepted ?? 0} accepted`, "demo receipt only"],
    ["TRUST", "separate rail", "not usage, not score inflation"],
    ["LOCAL", "providerCalls=0", "CSS-only orbit and terminal tape"],
    ["PUBLISH", "dry-run first", "c0vibe.app only after review"],
  ].map(([rail, value, detail], index) => `<article class="signal-row" style="--i:${index}">
      <span>${esc(rail)}</span>
      <b>${esc(value)}</b>
      <p>${esc(detail)}</p>
    </article>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Launch Kit</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#081014;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 50%,transparent 50%) 0 0/100% 4px,radial-gradient(circle at 16% 18%,rgba(46,232,214,.16),transparent 28%),radial-gradient(circle at 86% 12%,rgba(255,79,216,.12),transparent 24%);mix-blend-mode:screen}
  main{width:min(1220px,calc(100vw - 28px));margin:0 auto;padding:28px 0 44px}.hero{display:grid;grid-template-columns:minmax(0,.78fr) minmax(360px,1.22fr);gap:14px;min-height:560px}.panel,.terminal,.card,.rail,.dossier,.proof-cell,.minute,.minute-step,.signal-theatre,.signal-row{position:relative;min-width:0;border:1px solid var(--line);background:linear-gradient(180deg,rgba(9,18,22,.94),rgba(4,7,9,.98));box-shadow:0 32px 96px -72px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel,.terminal,.dossier,.minute,.signal-theatre{border-radius:12px}.panel{display:flex;flex-direction:column;justify-content:space-between;padding:22px}.panel::after,.terminal::after,.card::after,.dossier::after,.proof-cell::after,.minute::after,.minute-step::after,.signal-theatre::after,.signal-row::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 59%);transform:translateX(-96%);animation:sweep 5.8s var(--motion) infinite;pointer-events:none}.eyebrow{color:var(--green);font-weight:950;text-transform:uppercase;font-size:11px}.panel h1{margin:10px 0 14px;color:#f8fff9;font:950 clamp(40px,7.2vw,88px)/.88 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 44px rgba(46,232,214,.24)}.panel p{max-width:58ch;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;overflow-wrap:anywhere}.guards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guards span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:10px;color:#bff8e5;font-size:10px;font-weight:900;text-transform:uppercase}.terminal{padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:498px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#030708;color:#dffef6;font:900 10px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}
  .signal-theatre{display:grid;grid-template-columns:minmax(280px,.86fr) minmax(0,1.14fr);gap:1px;margin-top:14px;background:rgba(255,255,255,.07)}.signal-stage{position:relative;z-index:1;display:grid;grid-template-rows:auto auto 1fr auto;gap:12px;min-height:430px;padding:16px;background:radial-gradient(circle at 50% 48%,rgba(46,232,214,.16),transparent 35%),linear-gradient(150deg,rgba(159,124,255,.09),rgba(4,10,12,.9))}.signal-stage span,.signal-console span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.signal-stage h2{margin:0;color:#f8fff9;font:950 36px/.92 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.signal-stage p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.orbit{position:relative;place-self:center;width:min(330px,78vw);aspect-ratio:1;border:1px solid rgba(46,232,214,.22);border-radius:999px;background:repeating-radial-gradient(circle,rgba(46,232,214,.06) 0 1px,transparent 1px 18px),radial-gradient(circle,rgba(255,79,216,.13),transparent 58%);box-shadow:inset 0 0 44px rgba(46,232,214,.12)}.orbit::before,.orbit::after{content:"";position:absolute;inset:14%;border:1px dashed rgba(255,198,77,.2);border-radius:999px;animation:orbitTurn 18s linear infinite}.orbit::after{inset:30%;border-color:rgba(54,227,155,.22);animation-duration:16s;animation-direction:reverse}.orbit-core{position:absolute;left:50%;top:50%;z-index:2;width:112px;height:112px;display:grid;place-items:center;text-align:center;transform:translate(-50%,-50%);border:1px solid rgba(46,232,214,.34);border-radius:999px;background:#03100f;color:#f8fff9;font:950 28px/.9 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 0 52px rgba(46,232,214,.25)}.orbit-core span{display:block;margin-top:5px;color:var(--gold);font-size:9px}.orbit-mark{position:absolute;left:50%;top:50%;z-index:3;display:grid;place-items:center;gap:2px;width:74px;min-height:54px;padding:7px 5px;transform:rotate(var(--rot)) translateX(clamp(72px,10vw,112px)) rotate(calc(var(--rot) * -1));border:1px solid rgba(255,255,255,.2);background:linear-gradient(135deg,var(--from),var(--to));color:var(--ink);box-shadow:0 16px 42px -24px var(--from);animation:markPulse 2.8s var(--motion) infinite;animation-delay:calc(var(--i) * 120ms)}.orbit-mark b{font-size:16px;line-height:1}.orbit-mark small{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;max-width:62px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.signal-console{position:relative;z-index:1;display:grid;grid-template-rows:auto 1fr auto;gap:10px;padding:16px;background:#040708}.signal-console pre{min-height:238px;padding:14px;border:1px solid rgba(46,232,214,.13);background:#020506;color:#dffef6;font:900 10px/1.24 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto}.signal-ledger{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.signal-row{min-height:116px;padding:12px;border-width:1px 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 88ms)}.signal-row span{position:relative;z-index:1;color:var(--gold);font-weight:950;font-size:10px}.signal-row b{position:relative;z-index:1;display:block;margin-top:8px;color:#f8fff9;font-size:15px;text-transform:uppercase;overflow-wrap:anywhere}.signal-row p{position:relative;z-index:1;margin:8px 0 0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
  .dossier{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.28fr);gap:1px;margin-top:14px}.dossier-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:14px;padding:16px;background:rgba(4,10,12,.72)}.dossier-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.dossier-head b{color:#f8fff9;font:950 28px/.95 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.dossier-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif}.safety-tape{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.safety-tape span{border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);padding:8px;color:#ffe7a3}.safety-tape b{float:right;color:var(--green);font-size:10px}.proof-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.proof-cell{min-height:184px;padding:13px;border-width:0 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 76ms)}.proof-cell span{position:relative;z-index:1;color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.proof-cell b{position:relative;z-index:1;display:block;margin-top:10px;color:#f8fff9;font-size:14px;line-height:1.05;text-transform:uppercase;overflow-wrap:anywhere}.proof-cell p{position:relative;z-index:1;margin:10px 0 0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}
  .minute{display:grid;grid-template-columns:minmax(260px,.68fr) minmax(0,1.32fr);gap:1px;margin-top:14px}.minute-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:14px;padding:16px;background:linear-gradient(150deg,rgba(255,198,77,.08),rgba(4,10,12,.82))}.minute-head span{color:var(--green);font-weight:950;font-size:10px;text-transform:uppercase}.minute-head b{color:#f8fff9;font:950 28px/.95 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.minute-head p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}.receipt-seal{display:grid;gap:7px;border:1px solid rgba(255,198,77,.18);background:rgba(255,198,77,.06);padding:10px}.receipt-seal b{font-size:13px;color:#ffe7a3;overflow-wrap:anywhere}.receipt-seal code{display:block;padding:7px;border:1px solid rgba(255,198,77,.18);background:rgba(0,0,0,.24);color:#ffe7a3;font:900 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.receipt-seal p{color:#bdd8d1;font-size:11px}.minute-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.minute-step{min-height:170px;padding:13px;border-width:0 0 0 1px;box-shadow:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 82ms)}.minute-step span{position:relative;z-index:1;color:var(--gold);font-weight:950;font-size:10px;text-transform:uppercase}.minute-step b{position:relative;z-index:1;display:block;margin-top:10px;color:#f8fff9;font-size:14px;line-height:1.05;text-transform:uppercase;overflow-wrap:anywhere}.minute-step p{position:relative;z-index:1;margin:10px 0 0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px}.card{display:grid;align-content:start;gap:10px;min-height:174px;padding:13px;border-radius:10px;color:inherit;text-decoration:none;animation:rise .52s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.card span{position:relative;z-index:1;color:var(--green);font-weight:950;font-size:10px}.card b{position:relative;z-index:1;color:#f8fff9;font-size:16px;line-height:1;text-transform:uppercase}.card small{position:relative;z-index:1;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.rails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.rail{border-radius:10px;padding:12px;min-height:112px}.rail b{display:block;margin-bottom:7px;color:var(--gold);font-size:11px;text-transform:uppercase}.rail p{margin:0;color:#c5ddd6;font-family:ui-sans-serif,system-ui,sans-serif}.accent{color:var(--green)}footer{margin-top:14px;color:var(--muted);font-size:11px}@keyframes sweep{to{transform:translateX(96%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes orbitTurn{to{transform:rotate(360deg)}}@keyframes markPulse{0%,100%{filter:saturate(1);box-shadow:0 16px 42px -24px var(--from)}50%{filter:saturate(1.35);box-shadow:0 22px 56px -18px var(--to)}}@media (max-width:1060px){.dossier,.minute,.signal-theatre{grid-template-columns:1fr}.proof-grid,.minute-grid,.signal-ledger{grid-template-columns:repeat(2,minmax(0,1fr))}.proof-cell,.minute-step{border-width:1px 0 0}.signal-console pre{min-height:210px}}@media (max-width:980px){.hero{grid-template-columns:1fr}.rails{grid-template-columns:1fr}.terminal pre{min-height:330px}}@media (max-width:560px){main{width:min(100vw - 18px,1220px);padding-top:12px}.cards,.guards,.proof-grid,.safety-tape,.minute-grid,.signal-ledger{grid-template-columns:1fr}.panel{padding:16px}.panel h1{font-size:40px}.terminal pre{font-size:8px}.proof-cell,.minute-step{min-height:148px}.signal-stage{min-height:390px}.orbit{width:min(292px,74vw)}.orbit-mark{width:58px;min-height:48px;transform:rotate(var(--rot)) translateX(clamp(60px,19vw,90px)) rotate(calc(var(--rot) * -1))}.orbit-mark small{display:none}.signal-console pre{font-size:8px}}@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER launch kit">
    <section class="hero">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://LAUNCH-KIT//OFFLINE-DEMO//LOCAL-FIRST</div>
          <h1>Launch<br>Kit</h1>
          <p>An offline product tour that connects the terminal theatre, demo sync receipt, receipt vault, and operator notes. It is demo data, clearly labelled, with no cloud calls or ledger writes.</p>
        </div>
        <div class="guards">
          <span>No provider calls</span>
          <span>No usage writes</span>
          <span>No uploads</span>
          <span>No secret reads</span>
        </div>
      </div>
      <section class="terminal" aria-label="Launch kit terminal">
        <div class="terminal-top"><span>${esc(manifest.schema)}</span><b>Vibers Unite</b></div>
        <pre>+------------------------------------------------------------+
| VTK://LAUNCH-KIT//VIBETRACKER//C0VIBE.APP                 |
|------------------------------------------------------------|
| 00  open operator-show.html       guided offline show      |
| 01  open studio/index.html        terminal GUI theatre     |
| 02  open studio/boot-panorama     first-open command room  |
| 03  open studio/vibers-unite-room terminal GUI wow room    |
| 04  open studio/ascii-motion-lab  credited motion bench    |
| 05  open studio/github-heatgrid   trust replay NOT USAGE   |
| 06  open studio/score-reactor     score stream reactor     |
| 07  open studio/oss-motion        real OSS frame receipt   |
| 08  open share/vibetracker-badge  demo share badge         |
| 09  open share/vibetracker-poster release/share poster     |
| 10  open receipt/sync-receipt     demo black-box receipt   |
| 11  open receipts/index.html      receipt vault            |
| 12  inspect manifest.json         safety + file list       |
| 13  vibetracker impress --open    open Vibers Unite Room   |
| 14  vibetracker vibe --json       print launch manifest    |
|                                                            |
| demo data         yes                                      |
| provider calls    no                                       |
| usage writes      no                                       |
| uploads           no                                       |
| prompts/outputs   no                                       |
| secrets read      no                                       |
|                                                            |
| Real path: sync --receipt -> receipts --html               |
| Motto: Vibers Unite // c0vibe.app                         |
+------------------------------------------------------------+</pre>
      </section>
    </section>
    <section class="signal-theatre" aria-label="Signal theatre">
      <div class="signal-stage">
        <span>VTK://SIGNAL-THEATRE//CSS-ONLY//NO-CALLS</span>
        <h2>Signal<br>Theatre</h2>
        <p>CSS-only provider orbit for the first open. The marks turn for orientation, not collection: no provider calls, no ledger writes, no uploads.</p>
        <div class="orbit" aria-label="CSS-only provider orbit">
          <div class="orbit-core">C0<span>Vibers Unite</span></div>
          ${orbit}
        </div>
      </div>
      <div class="signal-console">
        <span>VTK://BOOT-SIGNAL//VIBERS-UNITE//C0VIBE.APP</span>
        <pre>+------------------------------------------------------------+
| SIGNAL THEATRE                                             |
|------------------------------------------------------------|
| provider orbit       CSS-only                              |
| providerCalls        0                                     |
| ledgerWrites         0                                     |
| uploads              0                                     |
| secretsRead          0                                     |
|                                                            |
| HF creator rail      demo receipt                          |
| CX builder rail      trust side rail                       |
| OL local rail        on-machine                            |
| C0 relay rail        review before publish                 |
|                                                            |
| Motto: Vibers Unite // c0vibe.app                          |
+------------------------------------------------------------+</pre>
        <div class="signal-ledger" aria-label="Signal theatre proof rows">${signalRows}</div>
      </div>
    </section>
    <section class="dossier" aria-label="Offline operator dossier">
      <div class="dossier-head">
        <span>VTK://OPERATOR-DOSSIER//DEMO-SAFE</span>
        <b>Proof First</b>
        <p>Open-source launch artifact with the safety boundary visible before anyone runs a command.</p>
        <div class="safety-tape" aria-label="Launch kit safety flags">${safetyTape}</div>
      </div>
      <div class="proof-grid">${dossier}</div>
    </section>
    <section class="minute" aria-label="First minute proof route">
      <div class="minute-head">
        <span>VTK://FIRST-MINUTE-FLIGHT//DEMO-TO-REAL</span>
        <b>First Minute Flight</b>
        <p>The opening path now hands the user from theatre to receipt seal to vault replay, then to the real local sync command.</p>
        ${receiptSeal}
      </div>
      <div class="minute-grid">${firstMinute}</div>
    </section>
    <section class="cards" aria-label="Launch kit files">${cards}</section>
    <section class="rails" aria-label="Launch kit proof rails">
      <article class="rail"><b>Demo only</b><p>The pack shows the product end-to-end without pretending sample rows are real usage.</p></article>
      <article class="rail"><b>Open-source ready</b><p>Everything is plain files: HTML, JSON, and Markdown. No dev server required.</p></article>
      <article class="rail"><b>Real next step</b><p>Run <code>vibetracker sync --receipt</code>, then index receipts with <code>vibetracker receipts --html</code>.</p></article>
    </section>
    <footer><span class="accent">Static launch kit:</span> script-free local files. Generated ${esc(manifest.generatedAt)}.</footer>
  </main>
</body>
</html>`;
}

export function buildLaunchKitFiles(options: LaunchKitOptions = {}): LaunchKitFile[] {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const providerIds = options.providerIds?.length ? options.providerIds : ["higgsfield", "codex-cli", "ollama", "replicate"];
  const receiptInput = demoReceipt(generatedAt, providerIds);
  const receiptPayload = syncReceiptPayload(receiptInput);
  const badgeSvg = renderShareBadgeSvg(demoBadgeRecords(generatedAt, providerIds), demoBadgeTrustSignals(generatedAt), {
    handle: "demo-viber",
    profileUrl: "c0vibe.app/u/demo-viber",
  });
  const posterSvg = renderSharePosterSvg(demoBadgeRecords(generatedAt, providerIds), demoBadgeTrustSignals(generatedAt), {
    handle: "demo-viber",
    profileUrl: "c0vibe.app/u/demo-viber",
  });
  const badgeMarkdown = `${renderShareBadgeMarkdown("./vibetracker-badge.svg", {
    handle: "demo-viber",
    profileUrl: "https://c0vibe.app/u/demo-viber",
  })}\n`;
  const posterMarkdown = `${renderSharePosterMarkdown("./vibetracker-poster.svg", {
    handle: "demo-viber",
    profileUrl: "https://c0vibe.app/u/demo-viber",
  })}\n`;
  const receiptFiles = buildSyncReceiptFiles(receiptInput).map((file) => ({
    ...file,
    path: `receipt/${file.path}`,
  }));
  const vaultPayload = receiptVaultPayload({
    rootDir: "receipts",
    entries: [{ path: "receipt/sync-receipt.json", receipt: receiptPayload, fingerprintStatus: "verified" }],
    skipped: [],
  }, generatedAt);
  const studioFiles = buildStudioPackFiles({ providerIds }).map((file) => ({
    ...file,
    path: `studio/${file.path}`,
  }));
  const baseFiles: LaunchKitFile[] = [
    {
      path: "index.html",
      label: "Launch Index",
      description: "Entry point for the offline VibeTRACKER launch kit.",
      content: "",
    },
    {
      path: "operator-show.html",
      label: "Operator Show",
      description: "Guided first-click offline show for the VibeTRACKER datastream, provider theatre, and safety rails.",
      content: "",
    },
    ...studioFiles,
    ...receiptFiles,
    {
      path: "receipts/index.html",
      label: "Receipt Vault",
      description: "Static local receipt-vault index over the demo receipt.",
      content: renderReceiptVaultHtml(vaultPayload),
    },
    {
      path: "receipts/manifest.json",
      label: "Receipt Vault JSON",
      description: "Machine-readable receipt-vault payload for the demo receipt.",
      content: `${JSON.stringify(vaultPayload, null, 2)}\n`,
    },
    {
      path: "share/vibetracker-badge.svg",
      label: "Demo Share Badge",
      description: "Self-contained demo SVG badge with usage metrics, trust heatgrid, and C0VIBE relay labels.",
      content: badgeSvg,
    },
    {
      path: "share/badge.md",
      label: "Badge Markdown",
      description: "Copy-ready Markdown snippet for the demo share badge.",
      content: badgeMarkdown,
    },
    {
      path: "share/vibetracker-poster.svg",
      label: "Vibers Unite Poster",
      description: "Large self-contained SVG poster with provider brands, usage metrics, trust quarantine, and C0VIBE relay labels.",
      content: posterSvg,
    },
    {
      path: "share/poster.md",
      label: "Poster Markdown",
      description: "Copy-ready Markdown snippet for the Vibers Unite poster.",
      content: posterMarkdown,
    },
  ];
  const withManifestPlaceholders = [
    ...baseFiles,
    {
      path: "README.md",
      label: "Operator Notes",
      description: "Plain-language launch-kit notes and real commands.",
      content: "",
    },
    {
      path: "manifest.json",
      label: "Launch Manifest",
      description: "Machine-readable launch-kit file list and safety flags.",
      content: "",
    },
  ];
  const manifest = launchKitManifest(withManifestPlaceholders, generatedAt, receiptPayload);
  return withManifestPlaceholders.map((file) => {
    if (file.path === "index.html") return { ...file, content: renderLaunchKitIndex(manifest, providerIds) };
    if (file.path === "operator-show.html") return { ...file, content: renderLaunchOperatorShowHtml(manifest, providerIds) };
    if (file.path === "README.md") return { ...file, content: renderLaunchKitReadme(manifest) };
    if (file.path === "manifest.json") return { ...file, content: `${JSON.stringify(manifest, null, 2)}\n` };
    return file;
  });
}
