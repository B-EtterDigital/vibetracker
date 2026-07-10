import type { CSSProperties } from "react";
import { buildAsciiMotionLab } from "../../lib/ascii-motion-lab";

export const metadata = {
  title: "VibeUsage Motion Lab",
  description: "Credited ASCII and Unicode motion lab for VibeTRACKER scan feedback.",
};

function groupCredits(credits: string[]) {
  return {
    runtime: credits.slice(0, 3),
    visual: credits.slice(3),
  };
}

function MotionScanDirectorBoard({ lab }: { lab: ReturnType<typeof buildAsciiMotionLab> }) {
  const sideEffects = lab.theatreBeats.reduce(
    (totals, beat) => ({
      providerCalls: totals.providerCalls + beat.sideEffects.providerCalls,
      hiddenUploads: totals.hiddenUploads + beat.sideEffects.hiddenUploads,
      usageWrites: totals.usageWrites + beat.sideEffects.usageWrites,
      trustWrites: totals.trustWrites + beat.sideEffects.trustWrites,
      promptReads: totals.promptReads + beat.sideEffects.promptReads,
      outputReads: totals.outputReads + beat.sideEffects.outputReads,
      publishWrites: totals.publishWrites + beat.sideEffects.publishWrites,
    }),
    {
      providerCalls: 0,
      hiddenUploads: 0,
      usageWrites: 0,
      trustWrites: 0,
      promptReads: 0,
      outputReads: 0,
      publishWrites: 0,
    },
  );
  const totalSideEffects = Object.values(sideEffects).reduce((sum, value) => sum + value, 0);
  const terminalLines = [
    "+------------------------------------------------------------+",
    "| VTK://MOTION-DIRECTOR//LIVE-SCAN//SIDE-EFFECT-ZERO        |",
    "|------------------------------------------------------------|",
    `| cues ${String(lab.theatreBeats.length).padEnd(2)} runtime rigs ${String(lab.rigs.length).padEnd(2)} references ${String(lab.references.length).padEnd(2)} sidefx ${String(totalSideEffects).padEnd(2)} |`,
    "| Codex cube -> Higgsfield prism -> local sonar -> map snap  |",
    "| proof vault -> C0VIBE relay // Vibers Unite                |",
    "| every cue is visual-only, credited, labelled, and dry-run  |",
    "| prompt reads 0 output reads 0 hidden uploads 0             |",
    "+------------------------------------------------------------+",
  ];

  return (
    <section className="motion-director-board" aria-label="Live scan motion director board">
      <div className="motion-director-board__head">
        <div>
          <span>VTK://MOTION-LAB//SCAN-DIRECTOR//ASCII-SURPRISES</span>
          <b>Live scan director</b>
        </div>
        <p>The first minute of collection is storyboarded like an operator show: every surprise has a provider mark, a proof boundary, and a visible zero side-effect counter.</p>
      </div>
      <div className="motion-director-board__body">
        <aside className="motion-director-board__terminal" aria-label="Motion director terminal">
          <div className="console-top"><span>director@motion-lab</span><b>VISUAL ONLY</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="motion-director-board__counters" aria-label="Motion director counters">
            <span>{totalSideEffects} total sidefx</span>
            <span>{sideEffects.usageWrites} usage writes</span>
            <span>{sideEffects.hiddenUploads} hidden uploads</span>
            <span>{sideEffects.publishWrites} publish writes</span>
          </div>
        </aside>
        <div className="motion-director-timeline" aria-label="Motion director timeline">
          {lab.theatreBeats.map((beat, index) => (
            <article
              className={`motion-director-cue motion-director-cue--${beat.rail}`}
              style={{
                "--i": index,
                "--meter": `${beat.meter}%`,
                "--brand-from": beat.from,
                "--brand-to": beat.to,
                "--brand-ink": beat.ink,
              } as CSSProperties}
              key={beat.id}
            >
              <div className="motion-director-cue__top">
                <i>{beat.mark}</i>
                <div>
                  <span>{String(beat.second).padStart(2, "0")}s / {beat.rail}</span>
                  <b>{beat.label}</b>
                </div>
              </div>
              <div className="motion-director-cue__screen" aria-hidden="true">
                {beat.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${beat.id}-director-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <p>{beat.surprise}</p>
              <small>{beat.boundary}</small>
              <div className="motion-director-cue__checks" aria-label={`${beat.label} director checks`}>
                {beat.checks.map((check) => <span key={`${beat.id}-director-${check}`}>{check}</span>)}
              </div>
              <footer>
                <span>{beat.metricLabel}: {beat.metricValue}</span>
                <em>{beat.providerId}</em>
              </footer>
              <div className="motion-director-cue__meter" aria-label={`${beat.label} director meter ${beat.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MotionAttributionCockpit({ lab }: { lab: ReturnType<typeof buildAsciiMotionLab> }) {
  const referenceById = new Map(lab.references.map((reference) => [reference.id, reference]));
  const lanes = [
    {
      id: "runtime",
      label: "Runtime-safe rigs",
      command: "vibetracker motion --runtime",
      rail: "VISUAL ONLY",
      count: lab.rigs.length,
      source: "cli-spinners / ascii-globe / MapSCII / drawille / pipes.sh",
      note: "Tiny authored frames borrow timing and texture ideas from permissive projects while staying inside VibeTRACKER's own UI.",
      guardrail: "No animation changes usage, trust, rank, or spend.",
      meter: 96,
      tone: "#2ee8d6",
      tone2: "#36e39b",
      ink: "#071013",
      frames: ["⠋\nHF\n⠙", "⣀\nMAP\n⠿", "╭─\nC0\n─╯"],
      marks: lab.rigs.slice(0, 4).map((rig) => rig.mark),
    },
    {
      id: "browser",
      label: "Browser frame studies",
      command: "vibetracker motion --references browser",
      rail: "REFERENCE ONLY",
      count: ["ascii-motion", "rune", "ascii-morph", "xterm", "asciinema-player"].filter((id) => referenceById.has(id)).length,
      source: "ASCII Motion / Rune / AsciiMorph / xterm.js / asciinema-player",
      note: "The browser-side references explain why the GUI keeps replayable terminal frames instead of opaque loader glitter.",
      guardrail: "Credited inspiration only; no pseudo-terminal pretends to run commands.",
      meter: 90,
      tone: "#ffc64d",
      tone2: "#ff4fd8",
      ink: "#1b0b00",
      frames: ["TXT\nMORPH\nGUI", "TERM\nCAST\nREEL", "FRAME\nSTATE\nOK"],
      marks: ["AM", "RU", "XM", "AS"],
    },
    {
      id: "linux",
      label: "Linux bench",
      command: "vibetracker motion --references linux",
      rail: "REFERENCE ONLY",
      count: ["durdraw", "termdot", "asciimatics", "cmatrix", "unimatrix", "pipes-sh", "mapscii"].filter((id) => referenceById.has(id)).length,
      source: "Durdraw / termdot / Asciimatics / CMatrix / UniMatrix",
      note: "Linux/TUI references give the scan rooms their operator-grade cadence without importing GPL screensaver code.",
      guardrail: "GPL references are not bundled; VibeTRACKER ships authored micro-frames.",
      meter: 88,
      tone: "#9f7cff",
      tone2: "#2ee8d6",
      ink: "#ffffff",
      frames: ["ANSI\nTUI\nLAB", "RAIN\nPIPE\nMAP", "GPL\nREF\nONLY"],
      marks: ["DU", "TD", "CM", "UM"],
    },
    {
      id: "native",
      label: "Native terminal graphics",
      command: "vibetracker motion --references native",
      rail: "REFERENCE ONLY",
      count: ["terminaltexteffects", "notcurses", "chafa"].filter((id) => referenceById.has(id)).length,
      source: "TerminalTextEffects / Notcurses / Chafa",
      note: "Native-grade terminal references raise the bar for text reveals, Unicode TUI scenes, and future local media preview rails.",
      guardrail: "Reference only; no Python, native, GPL, or LGPL runtime is bundled into the web app.",
      meter: 87,
      tone: "#36e39b",
      tone2: "#9f7cff",
      ink: "#071013",
      frames: ["TTE\nTEXT\nFX", "NC\nUNICODE\nTUI", "CHAFA\nANSI\nGIF"],
      marks: ["TTE", "NC", "CH", "VT"],
    },
    {
      id: "growth",
      label: "Future growth cues",
      command: "vibetracker motion --references growth",
      rail: "NOT USAGE",
      count: ["cbonsai", "rbonsai"].filter((id) => referenceById.has(id)).length,
      source: "cbonsai / rbonsai",
      note: "Growth references are held for future cumulative usage visuals where the data grows from real accepted records.",
      guardrail: "Growth art can decorate history, but history still comes from the ledger.",
      meter: 84,
      tone: "#36e39b",
      tone2: "#ffc64d",
      ink: "#071013",
      frames: ["ROOT\nLEDGER\nSEED", "BRANCH\nDAILY\nUSE", "C0VIBE\nPROFILE\nTREE"],
      marks: ["CB", "RB", "VT", "C0"],
    },
  ];
  const terminalLines = [
    "+------------------------------------------------------------+",
    "| VTK://MOTION-ATTRIBUTION-COCKPIT//CREDITED-ASCII//NO-USAGE |",
    "|------------------------------------------------------------|",
    `| runtime rigs ${String(lab.rigs.length).padEnd(2)} references ${String(lab.references.length).padEnd(2)} visual writes 0 hidden uploads 0 |`,
    "| permissive projects can inspire bundled micro-frames        |",
    "| copyleft/Linux bench stays credited as reference-only       |",
    "| native terminal graphics stay credited as reference-only    |",
    "| every frame keeps usage, trust, local, proof, publish split |",
    "| Vibers Unite // C0vibe.app                                 |",
    "+------------------------------------------------------------+",
  ];

  return (
    <section className="motion-attribution-cockpit" aria-label="Credited ASCII motion attribution cockpit">
      <div className="motion-attribution-cockpit__head">
        <div>
          <span>VTK://MOTION-LAB//ATTRIBUTION-COCKPIT//REFERENCE-ONLY</span>
          <b>Attribution cockpit</b>
        </div>
        <p>Runtime rigs, browser studies, Linux bench references, native terminal graphics, and future growth cues are separated before they become scan feedback.</p>
      </div>
      <div className="motion-attribution-cockpit__body">
        <aside className="motion-attribution-cockpit__terminal" aria-label="Motion attribution terminal">
          <div className="console-top"><span>credits@motion-lab</span><b>NO USAGE WRITE</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="motion-attribution-cockpit__totals" aria-label="Motion attribution totals">
            <span>{lab.rigs.length} runtime rigs</span>
            <span>{lab.references.length} references</span>
            <span>0 hidden uploads</span>
            <span>0 usage writes</span>
          </div>
        </aside>
        <div className="motion-attribution-lanes" aria-label="Motion attribution lanes">
          {lanes.map((lane, index) => (
            <article
              className={`motion-attribution-lane motion-attribution-lane--${lane.id}`}
              data-rail={lane.rail}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--tone": lane.tone,
                "--tone-2": lane.tone2,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="motion-attribution-lane__top">
                <span>{String(lane.count).padStart(2, "0")}</span>
                <b>{lane.label}</b>
                <i>{lane.rail}</i>
              </div>
              <div className="motion-attribution-lane__screen" aria-hidden="true">
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="motion-attribution-lane__marks" aria-label={`${lane.label} source marks`}>
                {lane.marks.map((mark, markIndex) => (
                  <em style={{ "--m": markIndex } as CSSProperties} key={`${lane.id}-${mark}`}>{mark}</em>
                ))}
              </div>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <footer>
                <span>{lane.source}</span>
                <i />
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MotionRunwayPanel({ lab }: { lab: ReturnType<typeof buildAsciiMotionLab> }) {
  const linuxBench = lab.references.filter((reference) =>
    /TerminalTextEffects|Notcurses|Chafa|Durdraw|termdot|Asciimatics|CMatrix|UniMatrix|pipes|MapSCII|bonsai/i.test(reference.project + reference.label),
  );
  const permissiveRigs = lab.rigs.filter((rig) => /MIT|Apache|BSD/.test(rig.license)).length;
  const referenceOnly = lab.references.filter((reference) => /Reference only/.test(reference.guardrail)).length;
  const terminalLines = [
    "+------------------------------------------------------+",
    "| VTK://MOTION-RUNWAY//ASCII-UNICODE//LOCAL-FIRST      |",
    "|------------------------------------------------------|",
    `| runtime rigs ${String(lab.rigs.length).padEnd(2)} permissive ${String(permissiveRigs).padEnd(2)} reference-only ${String(referenceOnly).padEnd(2)} |`,
    "| queue -> world -> regional -> signal -> collect      |",
    "| cli-spinners ascii-globe MapSCII drawille pipes HF   |",
    "| TerminalTextEffects Notcurses Chafa are native refs   |",
    "| Linux bench stays credited; GPL refs are not bundled |",
    "| animation labels never change usage, trust, or rank  |",
    "| Vibers Unite // c0vibe.app                           |",
    "+------------------------------------------------------+",
  ];

  return (
    <section className="motion-runway" aria-label="OSS terminal motion runway">
      <div className="motion-runway__head">
        <div>
          <span>VTK://MOTION-RUNWAY//OSS-ATTRIBUTED//NO-RUNTIME-GPL</span>
          <b>Terminal motion runway</b>
        </div>
        <p>Credited runtime rigs on the left, reference-only Linux/TUI inspiration on the right, all labelled before scan feedback enters the GUI.</p>
      </div>
      <div className="motion-runway__body">
        <aside className="motion-runway__terminal" aria-label="Motion runway terminal">
          <div className="console-top"><span>runway@motion-lab</span><b>NO FAKE PROOF</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="motion-runway__stats" aria-label="Motion runway stats">
            <span>{lab.rigs.length} runtime rigs</span>
            <span>{linuxBench.length} Linux/TUI refs</span>
            <span>{referenceOnly} reference-only</span>
            <span>0 usage writes</span>
          </div>
        </aside>
        <div className="motion-runway__lanes" aria-label="Attributed motion runway lanes">
          {lab.rigs.map((rig, index) => (
            <article
              className={`motion-runway-lane motion-runway-lane--${rig.id}`}
              style={{
                "--i": index,
                "--meter": `${rig.meter}%`,
                "--brand-from": rig.from,
                "--brand-to": rig.to,
                "--brand-ink": rig.ink,
              } as CSSProperties}
              key={rig.id}
            >
              <div className="motion-runway-lane__top">
                <i>{rig.mark}</i>
                <span>{rig.stage}</span>
                <b>{rig.license}</b>
              </div>
              <div className="motion-runway-lane__screen" aria-hidden="true">
                {rig.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${rig.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="motion-runway-lane__glyphs" aria-label={`${rig.label} glyph cadence`}>
                {rig.glyphs.map((glyph, glyphIndex) => (
                  <i style={{ "--g": glyphIndex } as CSSProperties} key={`${rig.id}-${glyph}`}>
                    {glyph}
                  </i>
                ))}
              </div>
              <div className="motion-runway-lane__copy">
                <strong>{rig.label}</strong>
                <code>{rig.command}</code>
                <p>{rig.note}</p>
                <small>{rig.guardrail}</small>
              </div>
              <footer>
                <a href={rig.url}>{rig.library}</a>
                <span>{rig.author}</span>
              </footer>
              <div className="motion-runway-lane__meter" aria-label={`${rig.label} runway meter ${rig.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MotionSignalTheatre({ lab }: { lab: ReturnType<typeof buildAsciiMotionLab> }) {
  const sideEffects = lab.theatreBeats.reduce(
    (totals, beat) => ({
      providerCalls: totals.providerCalls + beat.sideEffects.providerCalls,
      hiddenUploads: totals.hiddenUploads + beat.sideEffects.hiddenUploads,
      usageWrites: totals.usageWrites + beat.sideEffects.usageWrites,
      trustWrites: totals.trustWrites + beat.sideEffects.trustWrites,
      promptReads: totals.promptReads + beat.sideEffects.promptReads,
      outputReads: totals.outputReads + beat.sideEffects.outputReads,
      publishWrites: totals.publishWrites + beat.sideEffects.publishWrites,
    }),
    {
      providerCalls: 0,
      hiddenUploads: 0,
      usageWrites: 0,
      trustWrites: 0,
      promptReads: 0,
      outputReads: 0,
      publishWrites: 0,
    },
  );
  const totalSideEffects = Object.values(sideEffects).reduce((sum, value) => sum + value, 0);
  const terminalLines = [
    "+------------------------------------------------------------+",
    "| VTK://SIGNAL-THEATRE//SURPRISE-SEQUENCE//ZERO-SIDEFX      |",
    "|------------------------------------------------------------|",
    `| beats ${String(lab.theatreBeats.length).padEnd(2)} provider calls ${String(sideEffects.providerCalls).padEnd(2)} hidden uploads ${String(sideEffects.hiddenUploads).padEnd(2)} |`,
    `| usage writes ${String(sideEffects.usageWrites).padEnd(2)} trust writes ${String(sideEffects.trustWrites).padEnd(2)} publish writes ${String(sideEffects.publishWrites).padEnd(2)} |`,
    `| prompt reads ${String(sideEffects.promptReads).padEnd(2)} output reads ${String(sideEffects.outputReads).padEnd(2)} total sidefx ${String(totalSideEffects).padEnd(2)} |`,
    "| Codex -> Higgsfield -> local AI -> regional map -> proof   |",
    "| Every surprise is branded, credited, labelled, and dry-run |",
    "| Vibers Unite // c0vibe.app                                 |",
    "+------------------------------------------------------------+",
  ];
  const ledgerRows = [
    ["provider calls", sideEffects.providerCalls],
    ["hidden uploads", sideEffects.hiddenUploads],
    ["usage writes", sideEffects.usageWrites],
    ["trust writes", sideEffects.trustWrites],
    ["prompt reads", sideEffects.promptReads],
    ["output reads", sideEffects.outputReads],
    ["publish writes", sideEffects.publishWrites],
  ] as const;

  return (
    <section className="motion-signal-theatre" aria-label="Choreographed scan signal theatre">
      <div className="motion-signal-theatre__head">
        <div>
          <span>VTK://SIGNAL-THEATRE//CLI-GUI-SURPRISES//LOCAL-FIRST</span>
          <b>Signal theatre</b>
        </div>
        <p>One choreographed scan minute: terminal pulse, branded provider encores, proof vault, and C0VIBE relay with the side-effect ledger visible the whole time.</p>
      </div>
      <div className="motion-signal-theatre__body">
        <aside className="motion-signal-theatre__terminal" aria-label="Signal theatre terminal">
          <div className="console-top"><span>signal@motion-lab</span><b>ZERO SIDEFX</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="motion-signal-theatre__clock" aria-label="Signal theatre timing rail">
            {lab.theatreBeats.map((beat) => (
              <span style={{ "--brand-from": beat.from, "--brand-to": beat.to } as CSSProperties} key={`${beat.id}-clock`}>
                {String(beat.second).padStart(2, "0")}s
              </span>
            ))}
          </div>
        </aside>
        <div className="motion-signal-board" aria-label="Branded scan surprise sequence">
          {lab.theatreBeats.map((beat, index) => (
            <article
              className={`motion-signal-beat motion-signal-beat--${beat.id}`}
              style={{
                "--i": index,
                "--meter": `${beat.meter}%`,
                "--brand-from": beat.from,
                "--brand-to": beat.to,
                "--brand-ink": beat.ink,
              } as CSSProperties}
              key={beat.id}
            >
              <div className="motion-signal-beat__top">
                <i>{beat.mark}</i>
                <span>{beat.rail}</span>
                <b>{String(beat.second).padStart(2, "0")}s</b>
              </div>
              <div className="motion-signal-beat__stage" aria-hidden="true">
                {beat.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${beat.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="motion-signal-beat__copy">
                <strong>{beat.label}</strong>
                <code>{beat.command}</code>
                <p>{beat.signal}</p>
                <small>{beat.boundary}</small>
              </div>
              <div className="motion-signal-beat__checks" aria-label={`${beat.label} checks`}>
                {beat.checks.map((check) => <span key={`${beat.id}-${check}`}>{check}</span>)}
              </div>
              <footer>
                <span>{beat.surprise}</span>
                <em>{beat.metricLabel}: {beat.metricValue}</em>
              </footer>
              <div className="motion-signal-beat__meter" aria-label={`${beat.label} theatre meter ${beat.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
        <aside className="motion-signal-ledger" aria-label="Signal theatre side-effect ledger">
          <div>
            <span>VTK://LEDGER//VISIBLE-COUNTERS</span>
            <b>{totalSideEffects}</b>
            <p>total side effects</p>
          </div>
          {ledgerRows.map(([label, value]) => (
            <span key={label}>
              <strong>{value}</strong>
              {label}
            </span>
          ))}
          <footer>
            <b>Vibers Unite</b>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </footer>
        </aside>
      </div>
    </section>
  );
}

export default function MotionLabPage() {
  const lab = buildAsciiMotionLab();
  const credits = groupCredits(lab.credits);
  const permissive = lab.references.filter((reference) => /MIT|Apache|BSD/.test(reference.license)).length;
  const copyleft = lab.references.length - permissive;

  return (
    <>
      <section className="motion-lab-hero" aria-label="ASCII motion lab route">
        <div className="motion-lab-copy">
          <p className="eyebrow">Motion lab route</p>
          <h1>{lab.headline}</h1>
          <p>
            A credited ASCII and Unicode control room for scan feedback: provider logo turns, braille fields,
            pipe paths, globe cues, and replay discipline. Motion is feedback only; accepted usage records still decide totals.
          </p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">C0vibe.app</a>
          </div>
        </div>
        <div className="motion-lab-terminal" aria-label="Motion lab terminal">
          <div className="console-top"><span>motion@vibetracker</span><b>OSS CREDIT</b></div>
          <pre>{lab.terminalLines.join("\n")}</pre>
          <div className="motion-lab-terminal__stats" aria-label="Motion lab stats">
            <span>{lab.rigs.length} rigs</span>
            <span>{lab.references.length} references</span>
            <span>{permissive} permissive</span>
            <span>{copyleft} reference-only copyleft</span>
          </div>
        </div>
      </section>

      <section className="motion-credit-strip" aria-label="Motion runtime credits">
        <div>
          <span>VTK://MOTION-LAB-ROUTE//RUNTIME-CREDITS//VISUAL-ONLY</span>
          <b>Runtime rigs</b>
        </div>
        <div>
          {credits.runtime.map((credit) => <span key={credit}>{credit}</span>)}
          {credits.visual.map((credit) => <span key={credit}>{credit}</span>)}
        </div>
      </section>

      <MotionScanDirectorBoard lab={lab} />

      <MotionAttributionCockpit lab={lab} />

      <MotionSignalTheatre lab={lab} />

      <MotionRunwayPanel lab={lab} />

      <section className="motion-rig-wall" aria-label="Animated ASCII motion rigs">
        {lab.rigs.map((rig, index) => (
          <article
            className={`motion-rig-card motion-rig-card--${rig.id}`}
            style={{
              "--i": index,
              "--meter": `${rig.meter}%`,
              "--brand-from": rig.from,
              "--brand-to": rig.to,
              "--brand-ink": rig.ink,
            } as CSSProperties}
            key={rig.id}
          >
            <div className="motion-rig-card__screen" aria-hidden="true">
              {rig.frames.map((frame, frameIndex) => (
                <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${rig.id}-${frameIndex}`}>{frame}</pre>
              ))}
              <div>
                {rig.glyphs.map((glyph, glyphIndex) => (
                  <i style={{ "--g": glyphIndex } as CSSProperties} key={`${rig.id}-${glyph}`}>
                    {glyph}
                  </i>
                ))}
              </div>
            </div>
            <div className="motion-rig-card__copy">
              <div>
                <i>{rig.mark}</i>
                <span>{rig.stage}</span>
                <em>{rig.license}</em>
              </div>
              <b>{rig.label}</b>
              <code>{rig.command}</code>
              <p>{rig.note}</p>
              <small>{rig.guardrail}</small>
            </div>
            <footer>
              <a href={rig.url}>{rig.library}</a>
              <span>{rig.author}</span>
            </footer>
            <div className="motion-rig-card__meter" aria-label={`${rig.label} visual readiness ${rig.meter} percent`}>
              <i />
            </div>
          </article>
        ))}
      </section>

      <section className="motion-reference-wall" aria-label="Credited terminal motion research wall">
        <div className="motion-reference-wall__head">
          <span>VTK://REFERENCE-WALL//ASCII-UNICODE-LINUX//NOT-USAGE</span>
          <b>Reference wall</b>
        </div>
        <div className="motion-reference-wall__grid">
          {lab.references.map((reference, index) => (
            <article style={{ "--i": index } as CSSProperties} key={reference.id}>
              <span>{reference.cue}</span>
              <b>{reference.label}</b>
              <a href={reference.url}>{reference.project}</a>
              <small>{reference.author} · {reference.license}</small>
              <p>{reference.note}</p>
              <em>{reference.guardrail}</em>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
