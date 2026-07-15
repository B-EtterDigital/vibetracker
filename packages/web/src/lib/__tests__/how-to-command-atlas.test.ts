import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildHowToCommandAtlas, type HowToCommandGroupInput } from "../how-to-command-atlas.ts";

const commandGroups: HowToCommandGroupInput[] = [
  {
    tag: "first-run",
    title: "First run",
    summary: "Open the local GUI, inspect coverage, connect the first provider, and see totals without uploading anything.",
    items: [
      ["Start the visual wizard", "npx vibetrack init --gui"],
      ["Open the impressive launch kit", "npx vibetrack impress --open"],
      ["Inspect the launch manifest", "npx vibetrack vibe --json"],
      ["Inspect coverage", "npx vibetrack providers --all"],
      ["Try safe demo data", "npx vibetrack sync --demo"],
      ["Connect a provider", "npx vibetrack connect openai --set adminKey=sk-..."],
      ["Use provider OAuth when available", "npx vibetrack oauth start huggingface --auth-url https://provider/oauth/authorize --token-url https://provider/oauth/token --client-id app"],
      ["Sync and view totals", "npx vibetrack sync -> npx vibetrack total --by provider"],
      ["Audit proof", "npx vibetrack audit"],
    ],
  },
  {
    tag: "local-ai",
    title: "Local and creator AI",
    summary: "Track local models, creator subscriptions, voice work, ROI notes, and the AI-life dashboard.",
    items: [
      ["Detect local AI", "npx vibetrack detect"],
      ["Detect an OpenAI-compatible URL", "npx vibetrack detect --target http://127.0.0.1:1234"],
      ["Check provider freshness", "npx vibetrack providers check"],
      ["Forecast spend", "npx vibetrack mission --budget 200"],
      ["Amortize subscriptions", "npx vibetrack subscription add canva --usd 15 --from 2026-07-01 --to 2026-07-31 --profile creator"],
      ["Track voice work", "npx vibetrack add elevenlabs --characters 12000 --operation voice_clone --category audio"],
      ["Add ROI notes", "npx vibetrack roi add --from 2026-07-01 --to 2026-07-05 --note \"finished client video pack\" --value-usd 1200"],
      ["Open the AI-life dashboard", "npx vibetrack life"],
    ],
  },
  {
    tag: "public-board",
    title: "Public surfaces",
    summary: "Use the web pages as proof boards while trust labels stay visible.",
    items: [
      ["Provider status board", "/providers"],
      ["Contributor badges", "/contributors"],
      ["Accepted roadmap", "npx vibetrack roadmap -> /roadmap"],
      ["Passkey account proof", "/passkeys"],
    ],
  },
  {
    tag: "open-source",
    title: "Open-source extension",
    summary: "Scaffold adapters, generate fixtures, inspect plugins, and capture browser or desktop activity.",
    items: [
      ["Start a custom adapter", "npx vibetrack adapter scaffold my-provider --dry-run"],
      ["Redact a provider fixture", "npx vibetrack fixture redact raw.json --out packages/adapters/src/my-provider/__fixtures__/usage.sample.json"],
      ["Inspect plugin manifests", "npx vibetrack plugins path"],
      ["Capture browser activity", "npx vibetrack api serve --port 8765, then load packages/browser-extension"],
      ["Snapshot desktop tools", "npx vibetrack desktop scan --record"],
    ],
  },
  {
    tag: "privacy",
    title: "Privacy, signing, export",
    summary: "Preview every upload, add noise, sign bundles, seal ledgers, and keep storage encrypted.",
    items: [
      ["Review privacy boundaries", "npx vibetrack privacy"],
      ["Preview sharing", "npx vibetrack upload --dry-run"],
      ["Share noisy aggregates", "npx vibetrack export --private --epsilon 1"],
      ["Sign and verify a bundle", "npx vibetrack bundle sign -> npx vibetrack bundle verify ~/.vibetracker/signed-upload-bundle.json"],
      ["Sign a CLI release", "npx vibetrack release sign --file dist/vibetracker.js"],
      ["Seal the local ledger", "npx vibetrack ledger seal -> npx vibetrack ledger verify"],
      ["Use encrypted local storage", "VT_STORE_PASSPHRASE=... vibetracker sync"],
      ["Preview opt-in telemetry", "npx vibetrack telemetry preview -> npx vibetrack telemetry opt-in"],
      ["Export for Obsidian or Notion", "npx vibetrack export --format markdown --out ~/vibetracker.md"],
      ["Export for data lakes", "npx vibetrack export --format parquet --out ~/vibetracker.parquet"],
      ["Share to the self-reported board", "npx vibetrack upload --handle you"],
    ],
  },
];

test("how-to command atlas builds a deterministic operator map", () => {
  const atlas = buildHowToCommandAtlas(commandGroups);
  const terminal = atlas.terminalLines.join("\n");

  assert.equal(atlas.headline, "COMMAND ATLAS");
  assert.deepEqual(atlas.lanes.map((lane) => lane.id), ["first-run", "local-ai", "public-board", "open-source", "privacy"]);
  assert.deepEqual(atlas.lanes.map((lane) => lane.impact), ["first_run", "usage", "publish", "open_source", "privacy"]);
  assert.equal(atlas.totals.lanes, 5);
  assert.equal(atlas.totals.commands, 37);
  assert.equal(atlas.terminalLines.every((line) => line.length === 66), true);
  assert.deepEqual(atlas.launchBoard.map((step) => step.id), ["ignite", "preflight", "collect", "relay"]);
  assert.deepEqual(atlas.launchBoard.map((step) => step.impact), ["first_run", "not_usage", "usage", "publish"]);
  assert.equal(atlas.launchBoard.every((step) => step.frames.length === 4), true);
  assert.equal(atlas.launchBoard.every((step) => step.terminalLine.length === 66), true);
  assert.match(terminal, /COMMAND-ATLAS/);
  assert.match(terminal, /Vibers Unite/);
  assert.match(terminal, /c0vibe\.app/);
  assert.match(terminal, /NOT USAGE/);
});

test("how-to command atlas keeps dry-run privacy separate from publishing", () => {
  const atlas = buildHowToCommandAtlas(commandGroups);
  const allItems = atlas.lanes.flatMap((lane) => lane.items);
  const dryRun = allItems.find((item) => item.command === "npx vibetrack upload --dry-run");
  const upload = allItems.find((item) => item.command === "npx vibetrack upload --handle you");
  const audit = allItems.find((item) => item.command === "npx vibetrack audit");
  const localTarget = allItems.find((item) => item.command.includes("127.0.0.1"));
  const customAdapter = allItems.find((item) => item.command.includes("adapter scaffold"));
  const impress = allItems.find((item) => item.command === "npx vibetrack impress --open");
  const vibe = allItems.find((item) => item.command === "npx vibetrack vibe --json");

  assert.ok(dryRun);
  assert.equal(dryRun.impact, "privacy");
  assert.equal(dryRun.status, "review");
  assert.ok(upload);
  assert.equal(upload.impact, "publish");
  assert.equal(upload.status, "publish");
  assert.ok(audit);
  assert.equal(audit.impact, "not_usage");
  assert.ok(localTarget);
  assert.equal(localTarget.impact, "local_only");
  assert.ok(customAdapter);
  assert.equal(customAdapter.impact, "open_source");
  assert.ok(impress);
  assert.equal(impress.impact, "first_run");
  assert.equal(impress.status, "setup");
  assert.ok(vibe);
  assert.equal(vibe.impact, "first_run");
  assert.equal(vibe.status, "setup");
});

test("how-to command atlas carries provider colors, surprise encores, and OSS credits", () => {
  const atlas = buildHowToCommandAtlas(commandGroups);

  assert.equal(atlas.lanes.every((lane) => lane.items.length === lane.commandCount), true);
  assert.equal(atlas.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.equal(atlas.lanes.flatMap((lane) => lane.items).every((item) => item.frames.length === 3), true);
  assert.equal(atlas.lanes.flatMap((lane) => lane.items).every((item) => item.from.startsWith("#") && item.to.startsWith("#")), true);
  assert.deepEqual(atlas.surprises.map((surprise) => surprise.id), [
    "higgsfield-logo-turn",
    "codex-cube-flip",
    "local-sonar-bloom",
    "c0vibe-unite-flash",
  ]);
  assert.equal(atlas.surprises.every((surprise) => surprise.frames.length === 4), true);
  assert.equal(atlas.surprises.every((surprise) => surprise.marks.length > 0), true);
  assert.match(atlas.surprises[0]?.frames.join("\n") ?? "", /HF/);
  assert.match(atlas.surprises[1]?.frames.join("\n") ?? "", /CX/);
  assert.match(atlas.launchBoard.find((step) => step.id === "preflight")?.frames.join("\n") ?? "", /HF/);
  assert.match(atlas.launchBoard.find((step) => step.id === "preflight")?.terminalLine ?? "", /NOT USAGE/);
  assert.match(atlas.launchBoard.find((step) => step.id === "preflight")?.guardrail ?? "", /not spend/);
  assert.match(atlas.launchBoard.find((step) => step.id === "collect")?.result ?? "", /score, profile, heatgrid/);
  assert.match(atlas.launchBoard.find((step) => step.id === "relay")?.frames.join("\n") ?? "", /UNITE/);
  assert.match(atlas.launchBoard.find((step) => step.id === "relay")?.result ?? "", /Vibers Unite/);
  assert.ok(atlas.credits.some((credit) => credit.includes("cli-spinners")));
  assert.ok(atlas.credits.some((credit) => credit.includes("ASCII Motion")));
  assert.ok(atlas.credits.some((credit) => credit.includes("accepted records decide usage totals")));
});

test("how-to route surfaces the impressive launch aliases", () => {
  const page = readFileSync("packages/web/src/app/how-to/page.tsx", "utf8");
  const fastStart = readFileSync("packages/web/src/app/how-to/how-to-fast-start.tsx", "utf8");
  const fastStartStyles = readFileSync("packages/web/src/app/how-to/how-to-fast-start.css", "utf8");

  assert.match(page, /Show the launch kit/);
  assert.match(page, /cliCommand\("impress --open"\)/);
  assert.match(page, /Inspect the launch manifest/);
  assert.match(page, /cliCommand\("vibe --json"\)/);
  assert.doesNotMatch(page, /"(?:npx )?vibetracker (?:init|connect|sync|audit|upload|detect|providers|impress)/);
  assert.match(page, /<HowToFastStart commands=\{quickCommands\} \/>/);
  assert.match(page, /<details className="howto-manual">/);
  assert.match(page, /Open 37 commands, five lanes, setup choreography, and proof rails/);
  assert.match(page, /buildHowToCommandAtlas\(commandGroups\)/);

  assert.match(fastStart, /Boot your usage cockpit\./);
  assert.match(fastStart, /commands\.map/);
  assert.match(fastStart, /navigator\.clipboard\.writeText\(item\.command\)/);
  assert.match(fastStart, /Open identity gateway/);
  assert.match(fastStart, /Browse provider coverage/);
  assert.match(fastStart, /zero hidden uploads/);
  assert.match(fastStart, /prompt reads<\/dt><dd>0/);
  assert.match(fastStart, /provider calls<\/dt><dd>0/);
  assert.match(fastStart, /hidden uploads<\/dt><dd>0/);
  assert.match(fastStart, /publish actions<\/dt><dd>0/);
  assert.match(fastStart, /aria-live="polite"/);

  assert.match(fastStartStyles, /\.howto-fast__hero/);
  assert.match(fastStartStyles, /\.howto-manual:not\(\[open\]\) > \.howto-manual__body \{ display: none; \}/);
  assert.match(fastStartStyles, /@media \(max-width: 620px\)/);
  assert.match(fastStartStyles, /@media \(min-width: 2200px\)/);
  assert.match(fastStartStyles, /\.howto-fast,\n  \.howto-manual \{/);
  assert.match(fastStartStyles, /width: min\(2640px, 95vw\)/);
  assert.match(fastStartStyles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(fastStartStyles, /transform: translateX\(-50%\)/);
  assert.match(fastStartStyles, /@media \(prefers-reduced-motion: reduce\)/);
});
