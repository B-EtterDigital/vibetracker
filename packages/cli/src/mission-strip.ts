import { money } from "./format.ts";
import { providerBrand } from "./provider-brand.ts";

export interface MissionStripInput {
  surface: "total" | "stats" | "insights";
  title: string;
  ops: number;
  providers: number;
  credits?: number;
  usd?: number;
  spendLabel?: string;
  localSavingsUsd?: number;
  topProvider?: string;
  range?: string;
  next: string;
  empty?: boolean;
}

const frameWidth = 66;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function spendLine(input: MissionStripInput): string {
  if (input.usd == null) return `${input.spendLabel ?? "spend"} unestimated`;
  return `${input.spendLabel ?? "est spend"} ${money(input.usd)}`;
}

function providerLine(provider?: string): string {
  if (!provider) return "top rail none yet";
  const brand = providerBrand(provider);
  return `top rail [${brand.mark}] ${brand.label} · ${brand.from}->${brand.to}`;
}

export function renderMissionStrip(input: MissionStripInput): string {
  const surface = input.surface.toUpperCase();
  const range = input.range ?? (input.empty ? "range no records yet" : "range local ledger");
  const savings = input.localSavingsUsd ? `local savings ${money(input.localSavingsUsd)}` : "local savings pending";
  return [
    "+----------------------------------------------------------------+",
    frameLine(`VTK://MISSION-STRIP//${surface}//VIBERS-UNITE`),
    "|----------------------------------------------------------------|",
    frameLine(`${input.title} · c0vibe.app`),
    frameLine(range),
    frameLine(`${input.ops} ops · ${input.providers} providers · ${input.credits ?? 0} credits · ${spendLine(input)}`),
    frameLine(providerLine(input.topProvider)),
    frameLine(`${savings} · privacy local-first`),
    frameLine("trust/builder/social signals separate · NOT USAGE"),
    frameLine("surprise cadence: queue -> scan beat -> checkpoint encore"),
    frameLine(`next ${input.next}`),
    "+----------------------------------------------------------------+",
  ].join("\n");
}
