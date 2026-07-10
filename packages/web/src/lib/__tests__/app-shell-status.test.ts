import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAppShellStatus } from "../app-shell-status.ts";

test("app shell status keeps global usage, trust, local, privacy, and publish rails labelled", () => {
  const status = buildAppShellStatus();

  assert.equal(status.terminalLines.every((line) => line.length === 64), true);
  assert.match(status.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(status.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(status.terminalLines.join("\n"), /no fake proof/);
  assert.match(status.terminalLines.join("\n"), /hiddenUploads 0/);
  assert.equal(status.marquee.headline, "Global visual-only signal marquee");
  assert.deepEqual(status.marquee.steps.map((step) => step.id), [
    "usage-live",
    "trust-side",
    "local-lab",
    "privacy-dry-run",
    "score-feed",
    "c0vibe-unite",
  ]);
  assert.deepEqual(status.marquee.steps.map((step) => step.impact), [
    "usage",
    "trust",
    "local",
    "privacy",
    "usage",
    "publish",
  ]);
  assert.equal(status.marquee.steps.every((step) => step.meter > 0 && step.meter <= 100), true);
  assert.equal(status.marquee.steps.every((step) => step.from.startsWith("#") && step.to.startsWith("#")), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.providerCalls === 0), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.ledgerWrites === 0), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.hiddenUploads === 0), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.promptReads === 0), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.outputReads === 0), true);
  assert.equal(status.marquee.steps.every((step) => step.preview.usageMutations === 0), true);
  assert.equal(status.marquee.counters.sideEffects, 0);
  assert.match(status.marquee.steps.find((step) => step.id === "trust-side")?.value ?? "", /NOT USAGE/);
  assert.match(status.marquee.steps.find((step) => step.id === "privacy-dry-run")?.value ?? "", /0 raw reads/);
  assert.match(status.marquee.steps.find((step) => step.id === "c0vibe-unite")?.value ?? "", /Vibers Unite/);
  assert.match(status.marquee.steps.find((step) => step.id === "c0vibe-unite")?.guardrail ?? "", /reviewed aggregates/);
  assert.equal(status.relay.terminalLines.every((line) => line.length === 64), true);
  assert.match(status.relay.terminalLines.join("\n"), /UNITE-RELAY/);
  assert.match(status.relay.terminalLines.join("\n"), /c0vibe\.app/);
  assert.match(status.relay.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(status.relay.headline, "Vibers Unite relay");
  assert.deepEqual(status.relay.hops.map((hop) => hop.id), [
    "cli-ignite",
    "scan-theatre",
    "proof-gate",
    "score-reactor",
    "public-unite",
  ]);
  assert.deepEqual(status.relay.hops.map((hop) => hop.href), ["/wizard", "/scan", "/proof", "/score", "/u/demo"]);
  assert.deepEqual(status.relay.hops.map((hop) => hop.impact), ["local", "usage", "privacy", "usage", "publish"]);
  assert.equal(status.relay.hops.every((hop) => hop.frames.length === 4), true);
  assert.equal(status.relay.hops.every((hop) => hop.meter > 0 && hop.meter <= 100), true);
  assert.equal(status.relay.hops.every((hop) => hop.from.startsWith("#") && hop.to.startsWith("#")), true);
  assert.deepEqual(status.relay.counters, {
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUploads: 0,
    usageMutations: 0,
    promptReads: 0,
    outputReads: 0,
  });
  assert.equal(status.relay.hops.every((hop) => hop.preview.providerCalls === 0), true);
  assert.equal(status.relay.hops.every((hop) => hop.preview.promptReads === 0), true);
  assert.equal(status.relay.hops.every((hop) => hop.preview.outputReads === 0), true);
  assert.equal(status.relay.hops.every((hop) => hop.preview.hiddenUploads === 0), true);
  assert.match(status.relay.hops.find((hop) => hop.id === "cli-ignite")?.note ?? "", /GUI takes over/);
  assert.match(status.relay.hops.find((hop) => hop.id === "public-unite")?.value ?? "", /Vibers Unite/);
  assert.match(status.relay.hops.find((hop) => hop.id === "public-unite")?.note ?? "", /C0vibe\.app/);
  assert.equal(status.constellation.terminalLines.every((line) => line.length === 64), true);
  assert.equal(status.constellation.headline, "Usage constellation");
  assert.match(status.constellation.subline, /terminal setup, provider scan, proof, score, insights, and public profile/);
  assert.match(status.constellation.terminalLines.join("\n"), /APP-SHELL-CONSTELLATION/);
  assert.match(status.constellation.terminalLines.join("\n"), /NO-BACKGROUND-COLLECT/);
  assert.match(status.constellation.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(status.constellation.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(status.constellation.nodes.map((node) => node.id), [
    "terminal-seed",
    "provider-theatre",
    "privacy-airlock",
    "score-reactor",
    "budget-radar",
    "public-signal",
  ]);
  assert.deepEqual(status.constellation.nodes.map((node) => node.href), [
    "/wizard",
    "/scan",
    "/proof",
    "/score",
    "/insights",
    "/u/demo",
  ]);
  assert.deepEqual(status.constellation.nodes.map((node) => node.impact), [
    "local",
    "usage",
    "privacy",
    "usage",
    "local",
    "publish",
  ]);
  assert.deepEqual(status.constellation.counters, {
    providerCalls: 0,
    hiddenUploads: 0,
    usageMutations: 0,
  });
  assert.equal(status.constellation.nodes.every((node) => node.frames.length === 3), true);
  assert.equal(status.constellation.nodes.every((node) => node.meter > 0 && node.meter <= 100), true);
  assert.equal(status.constellation.nodes.every((node) => node.from.startsWith("#") && node.to.startsWith("#")), true);
  assert.equal(status.constellation.nodes.every((node) => node.preview.providerCalls === 0), true);
  assert.equal(status.constellation.nodes.every((node) => node.preview.hiddenUploads === 0), true);
  assert.equal(status.constellation.nodes.every((node) => node.preview.usageMutations === 0), true);
  assert.match(status.constellation.nodes.find((node) => node.id === "terminal-seed")?.detail ?? "", /hands control/);
  assert.match(status.constellation.nodes.find((node) => node.id === "budget-radar")?.guardrail ?? "", /NOT SPEND/);
  assert.match(status.constellation.nodes.find((node) => node.id === "public-signal")?.guardrail ?? "", /Hidden uploads remain 0/);
  assert.deepEqual(status.signals.map((signal) => signal.impact), [
    "usage",
    "trust",
    "local",
    "privacy",
    "publish",
  ]);
  assert.equal(status.signals.every((signal) => signal.meter > 0 && signal.meter <= 100), true);
  assert.equal(status.signals.every((signal) => signal.from.startsWith("#") && signal.to.startsWith("#")), true);
  assert.equal(status.signals.every((signal) => signal.frames.length === 4), true);
  assert.equal(status.signals.every((signal) => signal.preview.providerCalls === 0), true);
  assert.equal(status.signals.every((signal) => signal.preview.ledgerWrites === 0), true);
  assert.equal(status.signals.every((signal) => signal.preview.hiddenUploads === 0), true);
  assert.deepEqual(status.beacons.map((beacon) => beacon.id), [
    "higgsfield-prism",
    "codex-cube",
    "local-sonar",
    "c0vibe-flash",
  ]);
  assert.deepEqual(status.beacons.map((beacon) => beacon.impact), ["usage", "trust", "local", "publish"]);
  assert.equal(status.beacons.every((beacon) => beacon.frames.length === 4), true);
  assert.equal(status.beacons.every((beacon) => beacon.from.startsWith("#") && beacon.to.startsWith("#")), true);
  assert.match(status.beacons.find((beacon) => beacon.id === "codex-cube")?.guardrail ?? "", /NOT USAGE/);
  assert.match(status.beacons.find((beacon) => beacon.id === "local-sonar")?.guardrail ?? "", /never upload prompts/);
  assert.match(status.beacons.find((beacon) => beacon.id === "c0vibe-flash")?.frames.join("\n") ?? "", /UNITE/);
  assert.equal(status.spectrum.terminalLines.every((line) => line.length === 64), true);
  assert.equal(status.spectrum.headline, "Signal spectrum");
  assert.match(status.spectrum.subline, /visual-only equalizer/);
  assert.match(status.spectrum.terminalLines.join("\n"), /APP-SHELL-SPECTRUM/);
  assert.match(status.spectrum.terminalLines.join("\n"), /VISUAL-ONLY/);
  assert.match(status.spectrum.terminalLines.join("\n"), /NO-COLLECT/);
  assert.match(status.spectrum.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(status.spectrum.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(status.spectrum.rails.map((rail) => rail.id), [
    "usage-stream",
    "trust-sidecar",
    "local-loop",
    "privacy-gate",
    "c0vibe-relay",
  ]);
  assert.deepEqual(status.spectrum.rails.map((rail) => rail.impact), [
    "usage",
    "trust",
    "local",
    "privacy",
    "publish",
  ]);
  assert.deepEqual(status.spectrum.counters, {
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUploads: 0,
  });
  assert.equal(status.spectrum.rails.every((rail) => rail.bars.length === 7), true);
  assert.equal(status.spectrum.rails.every((rail) => rail.bars.every((bar) => bar >= 0 && bar <= 100)), true);
  assert.equal(status.spectrum.rails.every((rail) => rail.preview.providerCalls === 0), true);
  assert.equal(status.spectrum.rails.every((rail) => rail.preview.ledgerWrites === 0), true);
  assert.equal(status.spectrum.rails.every((rail) => rail.preview.hiddenUploads === 0), true);
  assert.match(status.spectrum.rails.find((rail) => rail.id === "trust-sidecar")?.value ?? "", /NOT USAGE/);
  assert.match(status.spectrum.rails.find((rail) => rail.id === "c0vibe-relay")?.value ?? "", /Vibers Unite/);
  assert.deepEqual(status.commands.map((command) => command.id), [
    "wizard-bootstrap",
    "scan-room",
    "proof-center",
    "score-lab",
    "insights-radar",
    "motion-lab",
    "public-profile",
  ]);
  assert.deepEqual(status.commands.map((command) => command.href), [
    "/wizard",
    "/scan",
    "/proof",
    "/score",
    "/insights",
    "/motion",
    "/u/demo",
  ]);
  assert.equal(status.commands.every((command) => command.meter > 0 && command.meter <= 100), true);
  assert.equal(status.commands.every((command) => command.from.startsWith("#") && command.to.startsWith("#")), true);
  assert.equal(status.commands.every((command) => command.frames.length === 4), true);
  assert.match(status.commands.find((command) => command.id === "wizard-bootstrap")?.command ?? "", /--gui/);
  assert.match(status.commands.find((command) => command.id === "wizard-bootstrap")?.note ?? "", /ASCII terminal/);
  assert.match(status.commands.find((command) => command.id === "proof-center")?.guardrail ?? "", /hiddenUploads=0/);
  assert.match(status.commands.find((command) => command.id === "motion-lab")?.guardrail ?? "", /never acts as evidence/);
  assert.match(status.commands.find((command) => command.id === "public-profile")?.value ?? "", /C0vibe\.app/);
  assert.match(status.commands.find((command) => command.id === "public-profile")?.guardrail ?? "", /Vibers Unite/);

  const trust = status.signals.find((signal) => signal.id === "trust-sidecar");
  assert.ok(trust);
  assert.equal(trust.value, "NOT USAGE");
  assert.match(trust.note, /stays separate/);
  assert.match(trust.guardrail, /never changes spend/);

  const privacy = status.signals.find((signal) => signal.id === "privacy-gate");
  assert.ok(privacy);
  assert.match(privacy.command, /upload --dry-run/);
  assert.match(privacy.guardrail, /providerCalls=0/);

  const publish = status.signals.find((signal) => signal.id === "c0vibe-relay");
  assert.ok(publish);
  assert.match(publish.value, /Vibers Unite/);
  assert.deepEqual(status.totals, {
    signals: 5,
    beacons: 4,
    commands: 7,
    relayHops: 5,
    spectrumRails: 5,
    brandedSignals: 5,
    previewProviderCalls: 0,
    previewLedgerWrites: 0,
    hiddenUploads: 0,
    relaySideEffects: 0,
    constellationNodes: 6,
    constellationSideEffects: 0,
    spectrumSideEffects: 0,
    marqueeSteps: 6,
    marqueeSideEffects: 0,
    notUsageRails: 1,
  });
});
