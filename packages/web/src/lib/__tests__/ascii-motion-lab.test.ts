import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAsciiMotionLab } from "../ascii-motion-lab.ts";

test("ASCII motion lab exposes OSS credits and the not-usage boundary", () => {
  const lab = buildAsciiMotionLab();
  const terminal = lab.terminalLines.join("\n");

  assert.equal(lab.headline, "ASCII MOTION LAB");
  assert.match(terminal, /ASCII-MOTION-LAB/);
  assert.match(terminal, /OSS-CREDITS/);
  assert.match(terminal, /VIBERS-UNITE/);
  assert.match(terminal, /C0VIBE\.APP/);
  assert.match(terminal, /NOT USAGE/);
  assert.match(terminal, /reference bench 18: ASCII Motion Rune AsciiMorph xterm/);
  assert.match(terminal, /native bench: TerminalTextEffects Notcurses Chafa/);
  assert.match(terminal, /linux bench: pipes MapSCII cmatrix unimatrix/);
  assert.match(terminal, /replay bench: asciinema VHS Durdraw termdot/);
  assert.match(terminal, /theatre beats 6\s+CLI HF local map proof relay/);
  assert.equal(lab.terminalLines.every((line) => line.length <= 66), true);
});

test("ASCII motion lab maps each animation rig to a real credited source", () => {
  const lab = buildAsciiMotionLab();

  assert.deepEqual(lab.rigs.map((rig) => rig.id), ["cli-spinners", "ascii-globe", "mapscii", "drawille", "pipes-sh", "turntable"]);
  assert.ok(lab.rigs.every((rig) => rig.license === "MIT"));
  assert.ok(lab.rigs.every((rig) => rig.url.startsWith("https://github.com/")));
  assert.ok(lab.rigs.every((rig) => rig.frames.length === 4));
  assert.ok(lab.rigs.every((rig) => rig.glyphs.length === 4));
  assert.ok(lab.rigs.every((rig) => rig.meter >= 90 && rig.meter <= 100));
  assert.ok(lab.credits.some((credit) => credit.includes("cli-spinners by Sindre Sorhus")));
  assert.ok(lab.credits.some((credit) => credit.includes("ascii-globe by Jakub T. Jankiewicz")));
  assert.ok(lab.credits.some((credit) => credit.includes("MapSCII by Rastapasta")));
  assert.ok(lab.credits.some((credit) => credit.includes("drawille by Bence Danyi")));
  assert.ok(lab.credits.some((credit) => credit.includes("pipes.sh by Pipeseroni collective")));
});

test("ASCII motion theatre choreographs branded surprises without side effects", () => {
  const lab = buildAsciiMotionLab();

  assert.deepEqual(lab.theatreBeats.map((beat) => beat.id), [
    "codex-diff-cube",
    "higgsfield-prism",
    "local-sonar",
    "regional-source-map",
    "proof-vault",
    "vibers-unite-relay",
  ]);
  assert.deepEqual(lab.theatreBeats.map((beat) => beat.rail), ["boot", "creator", "local", "regional", "proof", "relay"]);
  assert.ok(lab.theatreBeats.every((beat) => beat.frames.length === 4));
  assert.ok(lab.theatreBeats.every((beat) => beat.checks.length === 3));
  assert.ok(lab.theatreBeats.every((beat) => beat.meter >= 90 && beat.meter <= 100));
  assert.ok(lab.theatreBeats.every((beat) => beat.metricValue === "0"));
  assert.ok(lab.theatreBeats.every((beat) => Object.values(beat.sideEffects).every((value) => value === 0)));
  assert.ok(lab.theatreBeats.some((beat) => beat.providerId === "higgsfield" && /not usage/i.test(beat.boundary)));
  assert.ok(lab.theatreBeats.some((beat) => beat.providerId === "c0vibe" && /Vibers Unite/.test(beat.checks.join(" "))));
});

test("ASCII motion lab credits researched terminal-art references separately", () => {
  const lab = buildAsciiMotionLab();

  assert.deepEqual(lab.references.map((reference) => reference.id), [
    "ascii-motion",
    "rune",
    "ascii-morph",
    "xterm",
    "asciinema-player",
    "vhs",
    "durdraw",
    "termdot",
    "asciimatics",
    "terminaltexteffects",
    "notcurses",
    "chafa",
    "cmatrix",
    "unimatrix",
    "pipes-sh",
    "mapscii",
    "cbonsai",
    "rbonsai",
  ]);
  assert.ok(lab.references.every((reference) => reference.url.startsWith("https://github.com/") || reference.url.startsWith("https://gitlab.com/")));
  assert.ok(lab.references.every((reference) => /Reference only/.test(reference.guardrail)));
  assert.ok(lab.references.some((reference) => reference.project === "ASCII Motion"));
  assert.ok(lab.references.some((reference) => reference.project === "Rune" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "AsciiMorph" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "xterm.js" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "asciinema-player" && reference.license === "Apache-2.0"));
  assert.ok(lab.references.some((reference) => reference.project === "Charm VHS"));
  assert.ok(lab.references.some((reference) => reference.project === "Durdraw" && reference.license === "BSD-3-Clause"));
  assert.ok(lab.references.some((reference) => reference.project === "termdot" && reference.license === "Apache-2.0"));
  assert.ok(lab.references.some((reference) => reference.project === "Asciimatics" && reference.license === "Apache-2.0"));
  assert.ok(lab.references.some((reference) => reference.project === "TerminalTextEffects" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "Notcurses" && reference.license === "Apache-2.0"));
  assert.ok(lab.references.some((reference) => reference.project === "Chafa" && reference.license === "LGPL-3.0-or-later"));
  assert.ok(lab.references.some((reference) => reference.project === "CMatrix" && reference.license === "GPL-3.0"));
  assert.ok(lab.references.some((reference) => reference.project === "UniMatrix" && reference.license === "GPL-3.0-or-later"));
  assert.ok(lab.references.some((reference) => reference.project === "pipes.sh" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "MapSCII" && reference.license === "MIT"));
  assert.ok(lab.references.some((reference) => reference.project === "cbonsai" && reference.license === "GPL-3.0-or-later"));
  assert.ok(lab.references.some((reference) => reference.project === "rbonsai" && reference.license === "GPL-3.0"));
});

test("ASCII motion lab is exposed as a first-class credited route", () => {
  const page = readFileSync("packages/web/src/app/motion/page.tsx", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(layout, /href="\/motion"><span>06<\/span>Motion lab/);
  assert.match(page, /buildAsciiMotionLab/);
  assert.match(page, /MOTION-LAB-ROUTE/);
  assert.match(page, /MotionScanDirectorBoard/);
  assert.match(page, /motion-director-board/);
  assert.match(page, /MOTION-DIRECTOR/);
  assert.match(page, /LIVE-SCAN/);
  assert.match(page, /SIDE-EFFECT-ZERO/);
  assert.match(page, /director@motion-lab/);
  assert.match(page, /VISUAL ONLY/);
  assert.match(page, /Codex cube -> Higgsfield prism -> local sonar -> map snap/);
  assert.match(page, /MotionAttributionCockpit/);
  assert.match(page, /motion-attribution-cockpit/);
  assert.match(page, /motion-attribution-lanes/);
  assert.match(page, /MOTION-ATTRIBUTION-COCKPIT/);
  assert.match(page, /Runtime-safe rigs/);
  assert.match(page, /Browser frame studies/);
  assert.match(page, /Linux bench/);
  assert.match(page, /Native terminal graphics/);
  assert.match(page, /TerminalTextEffects \/ Notcurses \/ Chafa/);
  assert.match(page, /Future growth cues/);
  assert.match(page, /REFERENCE ONLY/);
  assert.match(page, /GPL references are not bundled/);
  assert.match(page, /0 usage writes/);
  assert.match(page, /MotionSignalTheatre/);
  assert.match(page, /motion-lab-hero/);
  assert.match(page, /motion-signal-theatre/);
  assert.match(page, /motion-rig-wall/);
  assert.match(page, /motion-reference-wall/);
  assert.match(page, /beat\.sideEffects/);
  assert.match(page, /reference\.guardrail/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /C0vibe\.app/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.match(styles, /\.motion-lab-hero/);
  assert.match(styles, /\.motion-director-board/);
  assert.match(styles, /\.motion-director-board__terminal/);
  assert.match(styles, /\.motion-director-timeline/);
  assert.match(styles, /\.motion-director-cue/);
  assert.match(styles, /\.motion-director-cue__screen pre:first-child/);
  assert.match(styles, /\.motion-director-cue__meter i/);
  assert.match(styles, /\.motion-attribution-cockpit/);
  assert.match(styles, /\.motion-attribution-cockpit__terminal/);
  assert.match(styles, /\.motion-attribution-lanes/);
  assert.match(styles, /\.motion-attribution-lane/);
  assert.match(styles, /\.motion-attribution-lane--native/);
  assert.match(styles, /\.motion-attribution-lane__screen pre:first-child/);
  assert.match(styles, /\.motion-signal-theatre/);
  assert.match(styles, /\.motion-signal-beat__stage pre:first-child/);
  assert.match(styles, /\.motion-signal-ledger/);
  assert.match(styles, /\.motion-rig-card__screen pre:first-child/);
  assert.match(styles, /\.motion-reference-wall__grid/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /\.motion-attribution-lane__screen pre:first-child \{ opacity: 1; \}/);
  assert.match(styles, /@media \(max-width: 460px\)[\s\S]*\.motion-attribution-lanes \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /\.motion-signal-beat__stage pre:first-child \{ opacity: 1; \}/);
  assert.match(styles, /\.motion-rig-card__screen pre:first-child \{ opacity: 1; \}/);
});
