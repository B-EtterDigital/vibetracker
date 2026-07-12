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
  const sequencer = readFileSync("packages/web/src/app/motion/motion-sequencer.tsx", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/motion/motion.css", "utf8");
  const controls = readFileSync("packages/web/src/app/motion/motion-controls.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/motion/motion-responsive.css", "utf8");

  assert.match(layout, /href="\/motion"><span>06<\/span>Motion lab/);
  assert.match(page, /buildAsciiMotionLab/);
  assert.match(page, /<MotionSequencer lab=/);
  assert.match(sequencer, /^"use client";/);
  assert.match(sequencer, /lab\.theatreBeats/);
  assert.match(sequencer, /lab\.rigs/);
  assert.match(sequencer, /lab\.references\.map/);
  assert.match(sequencer, /selected\.sideEffects/);
  assert.match(sequencer, /selected\.checks\.map/);
  assert.match(sequencer, /selected\.author/);
  assert.match(sequencer, /selected\.license/);
  assert.match(sequencer, /target="_blank"/);
  assert.match(sequencer, /rel="noreferrer"/);
  assert.doesNotMatch(sequencer, /dangerouslySetInnerHTML/);
  assert.match(styles, /\.seq-screen/);
  assert.match(controls, /\.seq-transport/);
  assert.match(responsive, /prefers-reduced-motion: reduce/);
  assert.match(responsive, /@media \(max-width: 420px\)/);
});
