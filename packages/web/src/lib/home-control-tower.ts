import { providerBrand } from "./provider-brand.ts";

export type HomeControlTowerRail = "start" | "usage" | "trust" | "local_only" | "privacy" | "score" | "publish" | "credit";

export interface HomeControlTowerSideEffects {
  providerCalls: number;
  ledgerWrites: number;
  hiddenUploads: number;
  promptReads: number;
  outputReads: number;
  publishWrites: number;
}

export interface HomeControlTowerDeck {
  id: string;
  href: string;
  label: string;
  route: string;
  command: string;
  rail: HomeControlTowerRail;
  status: string;
  note: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  checks: string[];
  sideEffects: HomeControlTowerSideEffects;
}

export interface HomeControlTower {
  headline: string;
  subline: string;
  terminalLines: string[];
  decks: HomeControlTowerDeck[];
  totals: HomeControlTowerSideEffects & {
    decks: number;
    routes: number;
    zeroSideEffects: boolean;
    notUsageDecks: number;
    localOnlyDecks: number;
  };
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function line(value: string): string {
  return `| ${fit(value, 62)} |`;
}

function zeroSideEffects(): HomeControlTowerSideEffects {
  return {
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUploads: 0,
    promptReads: 0,
    outputReads: 0,
    publishWrites: 0,
  };
}

function brand(providerId: string) {
  const brand = providerBrand(providerId);
  return {
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

const decks: HomeControlTowerDeck[] = [
  {
    id: "wizard",
    href: "/wizard",
    label: "First-run wizard",
    route: "/wizard",
    command: "npx vibetrack init --gui",
    rail: "start",
    status: "CLI -> GUI",
    note: "ASCII terminal boot hands off to the guided GUI without scanning accounts.",
    meter: 98,
    ...brand("codex-cli"),
    frames: ["CLI", "GUI", "VTK", "GO"],
    checks: ["local boot", "guided setup", "zero writes"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "motion",
    href: "/motion",
    label: "Motion lab",
    route: "/motion",
    command: "npx vibetrack surprises --static",
    rail: "credit",
    status: "OSS CREDIT",
    note: "Credited ASCII and Unicode motion references stay visual-only.",
    meter: 96,
    ...brand("higgsfield"),
    frames: ["HF", "CX", "OL", "C0"],
    checks: ["credited", "not usage", "no bundle GPL"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "scan",
    href: "/scan",
    label: "Scan room",
    route: "/scan",
    command: "npx vibetrack providers check",
    rail: "usage",
    status: "READ ONLY",
    note: "Provider scans preview usage sources before local records are accepted.",
    meter: 94,
    ...brand("openai"),
    frames: ["OA", "RP", "FA", "RW"],
    checks: ["dry run", "usage labelled", "review first"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "sources",
    href: "/sources",
    label: "Source atlas",
    route: "/sources",
    command: "npx vibetrack providers --all",
    rail: "local_only",
    status: "LOCAL MAP",
    note: "Creator, local, Chinese, European, and infra sources stay classified.",
    meter: 93,
    ...brand("qwen"),
    frames: ["CN", "EU", "LO", "AI"],
    checks: ["regions", "local rails", "manual ledgers"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "score",
    href: "/score",
    label: "Score mixer",
    route: "/score",
    command: "npx vibetrack audit",
    rail: "score",
    status: "+0 TRUST",
    note: "Usage streams feed score while trust sidecars remain labelled context.",
    meter: 97,
    ...brand("c0vibe"),
    frames: ["USE", "TRU", "+0", "C0"],
    checks: ["score feed", "trust +0", "receipts"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "life",
    href: "/life",
    label: "AI life",
    route: "/life",
    command: "npx vibetrack life",
    rail: "local_only",
    status: "ALL VIBERS",
    note: "Creators, builders, researchers, publishers, and local model users share one map.",
    meter: 95,
    ...brand("comfyui"),
    frames: ["IMG", "AUD", "3D", "LOC"],
    checks: ["creator", "builder", "local"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "proof",
    href: "/proof",
    label: "Proof center",
    route: "/proof",
    command: "npx vibetrack upload --dry-run",
    rail: "privacy",
    status: "REVIEW",
    note: "Upload review shows what leaves the machine before anything is published.",
    meter: 99,
    ...brand("github-actions"),
    frames: ["SHA", "R/O", "0UP", "OK"],
    checks: ["redaction", "dry run", "receipt"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "profile",
    href: "/u/demo",
    label: "Public profile",
    route: "/u/demo",
    command: "npx vibetrack upload",
    rail: "publish",
    status: "VIBERS UNITE",
    note: "Public profile relay is explicit publish state, not hidden sync.",
    meter: 100,
    ...brand("c0vibe"),
    frames: ["C0", "APP", "VIBE", "PUB"],
    checks: ["profile", "relay", "explicit"],
    sideEffects: zeroSideEffects(),
  },
];

export function buildHomeControlTower(): HomeControlTower {
  const totals = decks.reduce<HomeControlTower["totals"]>(
    (sum, deck) => ({
      decks: sum.decks + 1,
      routes: sum.routes + 1,
      providerCalls: sum.providerCalls + deck.sideEffects.providerCalls,
      ledgerWrites: sum.ledgerWrites + deck.sideEffects.ledgerWrites,
      hiddenUploads: sum.hiddenUploads + deck.sideEffects.hiddenUploads,
      promptReads: sum.promptReads + deck.sideEffects.promptReads,
      outputReads: sum.outputReads + deck.sideEffects.outputReads,
      publishWrites: sum.publishWrites + deck.sideEffects.publishWrites,
      zeroSideEffects: true,
      notUsageDecks: sum.notUsageDecks + (["trust", "credit"].includes(deck.rail) ? 1 : 0),
      localOnlyDecks: sum.localOnlyDecks + (deck.rail === "local_only" ? 1 : 0),
    }),
    {
      decks: 0,
      routes: 0,
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUploads: 0,
      promptReads: 0,
      outputReads: 0,
      publishWrites: 0,
      zeroSideEffects: true,
      notUsageDecks: 0,
      localOnlyDecks: 0,
    },
  );
  totals.zeroSideEffects = [
    totals.providerCalls,
    totals.ledgerWrites,
    totals.hiddenUploads,
    totals.promptReads,
    totals.outputReads,
    totals.publishWrites,
  ].every((value) => value === 0);

  return {
    headline: "CONTROL TOWER",
    subline: "A first-screen route flight deck for the whole product: setup, scan, sources, score, life, proof, motion, and public relay.",
    terminalLines: [
      "+----------------------------------------------------------------+",
      line("VTK://HOME-CONTROL-TOWER//ROUTE-FLIGHT-DECK//VIBERS-UNITE"),
      "|----------------------------------------------------------------|",
      line(`decks ${fit(totals.decks, 3)} routes ${fit(totals.routes, 3)} providerCalls ${fit(totals.providerCalls, 3)} uploads ${fit(totals.hiddenUploads, 3)}`),
      line(`ledgerWrites ${fit(totals.ledgerWrites, 3)} promptReads ${fit(totals.promptReads, 3)} outputReads ${fit(totals.outputReads, 3)}`),
      line("wizard motion scan sources score life proof profile"),
      line("trust/credits/local/publish rails stay visibly labelled"),
      line("Vibers Unite // c0vibe.app // no hidden sync"),
      "+----------------------------------------------------------------+",
    ],
    decks,
    totals,
  };
}
