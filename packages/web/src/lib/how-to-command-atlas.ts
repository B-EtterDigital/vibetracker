import { buildCollectionSurpriseRun, type CollectionSurpriseEncore, type CollectionSurpriseMark } from "./collection-surprises.ts";
import { providerBrand } from "./provider-brand.ts";

export type HowToCommandAtlasImpact = "first_run" | "usage" | "local_only" | "not_usage" | "privacy" | "publish" | "open_source";

export interface HowToCommandGroupInput {
  tag: string;
  title: string;
  summary: string;
  items: [string, string][];
}

export interface HowToCommandAtlasItem {
  id: string;
  label: string;
  command: string;
  impact: HowToCommandAtlasImpact;
  status: string;
  note: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface HowToCommandAtlasLane {
  id: string;
  label: string;
  summary: string;
  impact: HowToCommandAtlasImpact;
  commandCount: number;
  primaryCommand: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  items: HowToCommandAtlasItem[];
}

export interface HowToCommandAtlasSurprise {
  id: CollectionSurpriseEncore["id"];
  label: string;
  trigger: string;
  command: string;
  impact: CollectionSurpriseEncore["impact"];
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  caption: string;
  guardrail: string;
  source: string;
}

export interface HowToCommandAtlasLaunchStep {
  id: "ignite" | "preflight" | "collect" | "relay";
  label: string;
  status: string;
  command: string;
  impact: HowToCommandAtlasImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  terminalLine: string;
  result: string;
  guardrail: string;
}

export interface HowToCommandAtlasTotals {
  lanes: number;
  commands: number;
  usage: number;
  localOnly: number;
  privacy: number;
  publish: number;
  openSource: number;
  notUsage: number;
  firstRun: number;
}

export interface HowToCommandAtlas {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: HowToCommandAtlasLane[];
  surprises: HowToCommandAtlasSurprise[];
  launchBoard: HowToCommandAtlasLaunchStep[];
  totals: HowToCommandAtlasTotals;
  ticker: string[];
  credits: string[];
}

const TERMINAL_WIDTH = 62;

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function terminalLine(value: string): string {
  return `| ${fit(value, TERMINAL_WIDTH)} |`;
}

function compactLine(value: string): string {
  return fit(value.replace(/\s+/g, " "), 62);
}

function laneBrand(tag: string): string {
  switch (tag) {
    case "first-run":
      return "c0vibe";
    case "local-ai":
      return "higgsfield";
    case "public-board":
      return "c0vibe";
    case "open-source":
      return "github";
    case "privacy":
      return "openai";
    default:
      return "c0vibe";
  }
}

function laneImpact(tag: string): HowToCommandAtlasImpact {
  switch (tag) {
    case "first-run":
      return "first_run";
    case "local-ai":
      return "usage";
    case "public-board":
      return "publish";
    case "open-source":
      return "open_source";
    case "privacy":
      return "privacy";
    default:
      return "usage";
  }
}

function providerFor(tag: string, label: string, command: string): string {
  const value = `${tag} ${label} ${command}`.toLowerCase();
  if (value.includes("higgsfield")) return "higgsfield";
  if (value.includes("elevenlabs")) return "elevenlabs";
  if (value.includes("huggingface")) return "huggingface";
  if (value.includes("openai")) return "openai";
  if (value.includes("canva")) return "canva";
  if (value.includes("github") || value.includes("contributors")) return "github";
  if (value.includes("ollama")) return "ollama";
  if (value.includes("lm studio") || value.includes("lmstudio") || value.includes("127.0.0.1")) return "lmstudio";
  if (value.includes("comfyui")) return "comfyui";
  if (value.includes("browser-extension") || value.includes("desktop scan")) return "codex-cli";
  if (value.includes("passkey") || value.includes("upload") || value.includes("/providers") || value.includes("/roadmap")) return "c0vibe";
  return laneBrand(tag);
}

function classifyItem(tag: string, label: string, command: string): HowToCommandAtlasImpact {
  const value = `${tag} ${label} ${command}`.toLowerCase();
  const commandValue = command.toLowerCase();

  if (commandValue.includes("vibetracker impress") || commandValue.includes("vibetracker vibe") || commandValue.includes("launch-kit")) return "first_run";
  if (commandValue.includes("upload --handle") || value.includes("/providers") || value.includes("/contributors") || value.includes("/roadmap")) return "publish";
  if (value.includes("upload --dry-run") || value.includes("privacy") || value.includes("redact") || value.includes("export --private")) return "privacy";
  if (value.includes("bundle sign") || value.includes("release sign") || value.includes("ledger seal") || value.includes("passphrase") || value.includes("telemetry")) return "privacy";
  if (value.includes("passkey") || value.includes("audit") || value.includes("providers check")) return "not_usage";
  if (value.includes("detect") || value.includes("127.0.0.1") || value.includes("browser-extension") || value.includes("desktop scan")) return "local_only";
  if (value.includes("adapter scaffold") || value.includes("plugins path")) return "open_source";
  if (tag === "first-run") return "first_run";
  return laneImpact(tag);
}

function statusFor(impact: HowToCommandAtlasImpact): string {
  switch (impact) {
    case "first_run":
      return "setup";
    case "usage":
      return "usage";
    case "local_only":
      return "local only";
    case "not_usage":
      return "not usage";
    case "privacy":
      return "review";
    case "publish":
      return "publish";
    case "open_source":
      return "extend";
  }
}

function noteFor(impact: HowToCommandAtlasImpact): string {
  switch (impact) {
    case "first_run":
      return "Runs locally and helps the user connect sources.";
    case "usage":
      return "Feeds usage, cost, creator, or AI-life analytics.";
    case "local_only":
      return "Inspects local tools without publishing anything.";
    case "not_usage":
      return "Trust, proof, or account context only; excluded from spend.";
    case "privacy":
      return "Shows, redacts, encrypts, signs, or previews before upload.";
    case "publish":
      return "Public board or profile output after review.";
    case "open_source":
      return "Helps contributors add and verify adapters.";
  }
}

function framesFor(mark: string, impact: HowToCommandAtlasImpact): string[] {
  const rail = impact === "not_usage" ? "NO" : impact === "local_only" ? "127" : impact === "open_source" ? "OSS" : impact === "privacy" ? "KEY" : "RUN";
  return [mark, rail, impact === "publish" ? "C0" : impact === "first_run" ? "GUI" : "OK"];
}

function launchFrames(mark: string, id: HowToCommandAtlasLaunchStep["id"]): string[] {
  switch (id) {
    case "ignite":
      return [mark, "TTY", "GUI", "0UP"];
    case "preflight":
      return [mark, "HF", "CX", "NO$"];
    case "collect":
      return [mark, "SCAN", "LEDG", "OK"];
    case "relay":
      return [mark, "C0", "VIBE", "UNITE"];
  }
}

function itemMeter(index: number, impact: HowToCommandAtlasImpact): number {
  const base = impact === "publish" ? 100 : impact === "privacy" ? 94 : impact === "not_usage" ? 88 : impact === "local_only" ? 91 : 86;
  return Math.min(100, base + (index % 4) * 2);
}

function buildItem(group: HowToCommandGroupInput, item: [string, string], index: number): HowToCommandAtlasItem {
  const [label, command] = item;
  const impact = classifyItem(group.tag, label, command);
  const brand = providerBrand(providerFor(group.tag, label, command));

  return {
    id: `${group.tag}-${String(index + 1).padStart(2, "0")}`,
    label,
    command,
    impact,
    status: statusFor(impact),
    note: noteFor(impact),
    meter: itemMeter(index, impact),
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    frames: framesFor(brand.mark, impact),
  };
}

function countImpact(items: HowToCommandAtlasItem[], impact: HowToCommandAtlasImpact): number {
  return items.filter((item) => item.impact === impact).length;
}

function totalFor(items: HowToCommandAtlasItem[]): HowToCommandAtlasTotals {
  return {
    lanes: 0,
    commands: items.length,
    usage: countImpact(items, "usage"),
    localOnly: countImpact(items, "local_only"),
    privacy: countImpact(items, "privacy"),
    publish: countImpact(items, "publish"),
    openSource: countImpact(items, "open_source"),
    notUsage: countImpact(items, "not_usage"),
    firstRun: countImpact(items, "first_run"),
  };
}

function terminalLines(totals: HowToCommandAtlasTotals, surprises: HowToCommandAtlasSurprise[]): string[] {
  return [
    "+----------------------------------------------------------------+",
    terminalLine("VTK://COMMAND-ATLAS//AI-LIFE-USAGE//C0VIBE.APP"),
    "|----------------------------------------------------------------|",
    terminalLine(`lanes ${fit(totals.lanes, 2)} commands ${fit(totals.commands, 3)} usage ${fit(totals.usage, 3)} local ${fit(totals.localOnly, 3)}`),
    terminalLine(`privacy ${fit(totals.privacy, 3)} publish ${fit(totals.publish, 3)} open-source ${fit(totals.openSource, 3)}`),
    terminalLine(`first-run ${fit(totals.firstRun, 3)} trust/context NOT USAGE ${fit(totals.notUsage, 3)}`),
    terminalLine(`surprise encores ${fit(surprises.length, 2)}: HF turn / CX cube / LAN / C0`),
    terminalLine("dry-run before publish // Vibers Unite // c0vibe.app"),
    "+----------------------------------------------------------------+",
  ];
}

function launchStep(
  id: HowToCommandAtlasLaunchStep["id"],
  label: string,
  status: string,
  command: string,
  impact: HowToCommandAtlasImpact,
  provider: string,
  meter: number,
  result: string,
  guardrail: string,
): HowToCommandAtlasLaunchStep {
  const brand = providerBrand(provider);
  const lineLabel = impact === "not_usage" ? "NOT USAGE" : impact.replace(/_/g, " ").toUpperCase();

  return {
    id,
    label,
    status,
    command,
    impact,
    meter,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    frames: launchFrames(brand.mark, id),
    terminalLine: terminalLine(compactLine(`${id.toUpperCase()} ${lineLabel} ${command}`)),
    result,
    guardrail,
  };
}

function launchBoard(): HowToCommandAtlasLaunchStep[] {
  return [
    launchStep(
      "ignite",
      "Terminal ignition",
      "terminal -> gui",
      "npx vibetracker init --gui",
      "first_run",
      "c0vibe",
      96,
      "ASCII cockpit opens into the visual wizard.",
      "Starts locally; zero upload and zero provider reads before approval.",
    ),
    launchStep(
      "preflight",
      "Provider preflight",
      "coverage scan",
      "vibetracker providers --all",
      "not_usage",
      "higgsfield",
      91,
      "Higgsfield, Codex, local, creator, EU, and China rails light up.",
      "Registry and account capability checks are labelled context, not spend.",
    ),
    launchStep(
      "collect",
      "Usage collection",
      "reviewed ledger",
      "vibetracker sync -> vibetracker audit",
      "usage",
      "openai",
      94,
      "Accepted records feed score, profile, heatgrid, and analytics.",
      "Rejected, redacted, and trust-only rows cannot enter usage totals.",
    ),
    launchStep(
      "relay",
      "C0VIBE relay",
      "publish gate",
      "vibetracker upload --dry-run -> upload",
      "publish",
      "c0vibe",
      89,
      "Vibers Unite appears on the public profile only after review.",
      "c0vibe.app relay is explicit; no hidden background publishing.",
    ),
  ];
}

export function buildHowToCommandAtlas(groups: HowToCommandGroupInput[]): HowToCommandAtlas {
  const lanes = groups.map<HowToCommandAtlasLane>((group) => {
    const items = group.items.map((item, index) => buildItem(group, item, index));
    const brand = providerBrand(laneBrand(group.tag));
    const meter = Math.round(items.reduce((sum, item) => sum + item.meter, 0) / Math.max(1, items.length));

    return {
      id: group.tag,
      label: group.title,
      summary: group.summary,
      impact: laneImpact(group.tag),
      commandCount: items.length,
      primaryCommand: items[0]?.command ?? "vibetracker --help",
      meter,
      mark: brand.mark,
      from: brand.from,
      to: brand.to,
      ink: brand.ink,
      items,
    };
  });
  const allItems = lanes.flatMap((lane) => lane.items);
  const run = buildCollectionSurpriseRun();
  const surprises = run.encores.map<HowToCommandAtlasSurprise>((encore) => ({
    id: encore.id,
    label: encore.label,
    trigger: encore.trigger,
    command: encore.command,
    impact: encore.impact,
    status: encore.status,
    meter: encore.meter,
    delayMs: encore.delayMs,
    marks: encore.marks,
    frames: encore.frames,
    caption: encore.caption,
    guardrail: encore.guardrail,
    source: encore.source,
  }));
  const totals = { ...totalFor(allItems), lanes: lanes.length };

  return {
    headline: "COMMAND ATLAS",
    subline: "A single cockpit for setup, local AI, creator usage, open-source extension, privacy review, and public proof labels.",
    terminalLines: terminalLines(totals, surprises),
    lanes,
    surprises,
    launchBoard: launchBoard(),
    totals,
    ticker: lanes.map((lane) => `${lane.id} // ${lane.primaryCommand}`),
    credits: [
      "Integrated OSS motion sources: cli-spinners, ascii-globe, drawille.",
      "Reference bench: ASCII Motion, Rune, AsciiMorph, xterm.js, asciinema-player, VHS, Durdraw, termdot, Asciimatics.",
      "All terminal art is feedback and attribution; accepted records decide usage totals.",
    ],
  };
}
