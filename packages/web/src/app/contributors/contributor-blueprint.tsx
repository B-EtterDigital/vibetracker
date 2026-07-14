import badges from "../../../../contributors/badges.json";
import type { CSSProperties } from "react";
import {
  buildContributorAdapterFoundry,
  buildContributorForge,
  buildContributorLaunchpad,
  buildContributorMissionControl,
  buildContributorQuestBoard,
  contributorForgeSummary,
  type ContributorAdapterFoundry,
  type ContributorLaunchpad,
  type ContributorQuestBoard,
} from "../../lib/contributor-forge";

const proofSteps = [
  ["01", "Build or improve a real source", "Adapters, fixtures, trust signals, privacy checks, or local AI capture paths."],
  ["02", "Add tests and proof", "Golden samples, redaction evidence, capability labels, and failure paths matter."],
  ["03", "Keep rank honest", "Contributor badges are public credit only. They never change usage totals."],
];

const contributorRelayStages = [
  {
    id: "adapter-sdk",
    call: "SDK",
    label: "Adapter SDK",
    value: "GOOD-FIRST",
    impact: "adapter",
    meter: 96,
    note: "Start with a local provider packet, capability labels, and a fixture that can be reviewed without secrets.",
    command: "npx vibetracker adapter scaffold --provider <name>",
    proof: ["fixture", "capability", "tests"],
    guardrail: "No raw prompts. No usage score mutation.",
  },
  {
    id: "proof-harness",
    call: "TST",
    label: "Proof harness",
    value: "GREEN",
    impact: "test",
    meter: 92,
    note: "Every contribution carries a tiny receipt: parser output, redaction result, failure mode, and not-usage labels.",
    command: "node --test packages/adapters/src/__tests__/<provider>.test.ts",
    proof: ["golden", "redacted", "failure"],
    guardrail: "Trust signals stay separate from spend and usage.",
  },
  {
    id: "public-credit",
    call: "PUB",
    label: "Public credit",
    value: "C0VIBE",
    impact: "publish",
    meter: 89,
    note: "Useful open-source work can publish to c0vibe.app as contributor credit without polluting usage rank.",
    command: "npx vibetracker contributors publish --dry-run",
    proof: ["badge", "reviewed", "rank 0"],
    guardrail: "Public credit only. Leaderboard usage remains verified usage.",
  },
] as const;

const contributorRelayFrames = [
  [
    "      _______ VTK _______      ",
    "  ___/ SDK -> FIXTURE \\___    ",
    " /  TEST -> TRUST -> C0VIBE \\ ",
    " \\____ NOT USAGE / RANK 0 ___/",
  ].join("\n"),
  [
    "        .--VIBERS--.          ",
    "   .----|  UNITE   |----.     ",
    "   | SDK | TEST | PUB | C0 |  ",
    "   '---- rank impact: 00 ----'",
  ].join("\n"),
  [
    "  [adapter]=>[fixture]=>[test]",
    "       ||       ||       ||    ",
    "  [privacy]=>[review]=>[badge]",
    "       c0vibe.app / not usage ",
  ].join("\n"),
] as const;

export function ContributorBlueprint() {
  const badgeRows = buildContributorForge(badges.badges);
  const summary = contributorForgeSummary(badgeRows);
  const launchpad = buildContributorLaunchpad(badgeRows);
  const missionControl = buildContributorMissionControl(badgeRows);
  const questBoard = buildContributorQuestBoard(badgeRows);
  const adapterFoundry = buildContributorAdapterFoundry(badgeRows);
  const relayLines = [
    "+------------------------------------------------------------+",
    "| VTK://CONTRIBUTOR-SIGNAL-RELAY//OPEN-SOURCE//NOT-USAGE    |",
    "| handoff        SDK -> fixture -> harness -> publish        |",
    `| badge lanes    ${String(summary.lanes).padStart(2, "0")}   launch lanes ${String(launchpad.totals.lanes).padStart(2, "0")}   quests ${String(questBoard.totals.quests).padStart(2, "0")} |`,
    `| foundry lanes  ${String(adapterFoundry.totals.lanes).padStart(2, "0")}   proof ${String(summary.averageMeter).padStart(3, "0")}%   rank impact 00 |`,
    "| motto          Vibers Unite / c0vibe.app                   |",
    "+------------------------------------------------------------+",
  ];

  return (
    <>
      <section className="contributors-hero">
        <div className="contributors-copy">
          <p className="eyebrow">Open-source signal</p>
          <h1>Contributor cockpit</h1>
          <p>Public credit paths for the people who make VibeTRACKER broader, safer, and more useful across AI tools.</p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="contributors-terminal" aria-label="Contributor badge terminal">
          <div className="console-top"><span>contributors@vibetracker</span><b>proof-first</b></div>
          <pre>{[
            "+--------------------------------------------+",
            "| VTRK://OPEN-SOURCE//BADGE-RAIL             |",
            "|--------------------------------------------|",
            `| badge lanes     ${String(summary.lanes).padStart(2, "0")} public credit paths        |`,
            "| rank impact     00 usage-score mutation    |",
            "| required proof  tests + fixtures + labels  |",
            "| motto           Vibers Unite               |",
            "+--------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <section className="contributor-stats" aria-label="Contributor program facts">
        <div><b>{summary.lanes}</b><span>badge lanes</span></div>
        <div><b>{summary.rankImpacting}</b><span>rank impact</span></div>
        <div><b>{summary.averageMeter}%</b><span>proof readiness</span></div>
      </section>

      <ContributorSignalRelayPanel lines={relayLines} />

      <ContributorLaunchpadPanel launchpad={launchpad} />

      <section className="contributor-mission-control" aria-label="Open-source contributor mission control">
        <div className="contributor-mission-control__head">
          <span>VTK://CONTRIBUTOR-MISSION//OPEN-SOURCE//ZERO-RANK-MUTATION</span>
          <b>{missionControl.headline}</b>
        </div>
        <div className="contributor-mission-control__body">
          <aside className="contributor-mission-terminal" aria-label="Contributor mission terminal">
            <div className="console-top"><span>mission@contributors</span><b>{missionControl.totals.rails} RAILS</b></div>
            <pre>{missionControl.terminalLines.join("\n")}</pre>
            <div className="contributor-mission-terminal__totals" aria-label="Contributor mission totals">
              <span>{missionControl.totals.badges} badges</span>
              <span>{missionControl.totals.notUsage} not usage</span>
              <span>{missionControl.totals.rankImpacting} rank impact</span>
              <span>{missionControl.totals.averageMeter}% proof</span>
            </div>
          </aside>
          <div className="contributor-mission-rails">
            {missionControl.rails.map((rail, index) => (
              <article
                className={`contributor-mission-rail contributor-mission-rail--${rail.impact}`}
                data-impact={rail.impact}
                style={{ "--i": index, "--meter": `${rail.meter}%` } as CSSProperties}
                key={rail.id}
              >
                <div className="contributor-mission-rail__top">
                  <span>{rail.call}</span>
                  <b>{rail.label}</b>
                  <em>{rail.impact.replace("_", " ")}</em>
                </div>
                <pre>{rail.terminal.join("\n")}</pre>
                <p>{rail.note}</p>
                <code>{rail.command}</code>
                <div className="contributor-mission-rail__marks" aria-label={`${rail.label} badge marks`}>
                  {rail.marks.map((mark, markIndex) => <i style={{ "--i": markIndex } as CSSProperties} key={`${rail.id}-${mark}`}>{mark}</i>)}
                </div>
                <div className="contributor-mission-rail__meter" aria-label={`${rail.label} readiness ${rail.meter} percent`}>
                  <i />
                </div>
                <strong>{rail.guardrail}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContributorQuestBoardPanel board={questBoard} />

      <ContributorAdapterFoundryPanel foundry={adapterFoundry} />

      <section className="contributor-forge" aria-label="Contributor adapter forge packets">
        <div className="contributor-forge__head">
          <span>VTK://CONTRIBUTOR-FORGE//GOOD-FIRST-PACKETS//NOT-USAGE</span>
          <b>PUBLIC CREDIT / ZERO RANK MUTATION</b>
        </div>
        <div className="contributor-forge__grid">
          {badgeRows.map((badge, index) => (
            <article
              className="contributor-forge-card"
              style={{ "--i": index, "--meter": `${badge.meter}%` } as CSSProperties}
              key={badge.id}
            >
              <div className="contributor-forge-card__top">
                <i>{badge.mark}</i>
                <div>
                  <span>{badge.lane}</span>
                  <b>{badge.label}</b>
                </div>
              </div>
              <pre>{badge.terminal.join("\n")}</pre>
              <p>{badge.issue}</p>
              <code>{badge.command}</code>
              <div className="contributor-forge-meter" aria-label={`${badge.label} proof readiness ${badge.meter} percent`}>
                <i />
              </div>
              <footer>
                <span>{badge.usageImpact}</span>
                <span>rank impact: {badge.rankImpact}</span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="badge-board" aria-label="Contributor badge catalog">
        {badgeRows.map((badge) => (
          <article key={badge.id}>
            <i>{badge.mark}</i>
            <span>{badge.id}</span>
            <b>{badge.label}</b>
            <p>{badge.description}</p>
            <em>{badge.lane}</em>
            <small>{badge.proof}</small>
          </article>
        ))}
      </section>

      <section className="contributor-proof">
        <h2>How to earn one</h2>
        <div>
          {proofSteps.map(([step, title, detail]) => (
            <article key={step}>
              <span>{step}</span>
              <b>{title}</b>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <p>Badges are public credit only; they do not change usage totals, spend, trust tier, or leaderboard rank.</p>
      </section>
    </>
  );
}

function ContributorSignalRelayPanel({ lines }: { lines: string[] }) {
  return (
    <section className="contributor-relay" aria-label="Contributor signal relay">
      <div className="contributor-relay__head">
        <span>VTK://CONTRIBUTOR-RELAY//SDK-TO-C0VIBE//PUBLIC-CREDIT</span>
        <b>OPEN SOURCE / NOT USAGE</b>
      </div>
      <div className="contributor-relay__body">
        <aside className="contributor-relay__terminal" aria-label="Contributor signal relay terminal">
          <div className="console-top"><span>relay@contributors</span><b>RANK 0</b></div>
          <pre>{lines.join("\n")}</pre>
          <div className="contributor-relay__screen" aria-label="Animated contributor relay frames">
            {contributorRelayFrames.map((frame, frameIndex) => (
              <pre style={{ "--frame": frameIndex } as CSSProperties} key={frame}>{frame}</pre>
            ))}
          </div>
          <div className="contributor-relay__motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="contributor-relay__stages">
          {contributorRelayStages.map((stage, index) => (
            <article
              className={`contributor-relay-stage contributor-relay-stage--${stage.impact}`}
              data-impact={stage.impact}
              style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties}
              key={stage.id}
            >
              <div className="contributor-relay-stage__top">
                <span>{stage.call}</span>
                <div>
                  <b>{stage.label}</b>
                  <em>{stage.value}</em>
                </div>
              </div>
              <p>{stage.note}</p>
              <code>{stage.command}</code>
              <div className="contributor-relay-stage__proof" aria-label={`${stage.label} proof labels`}>
                {stage.proof.map((proof) => <i key={`${stage.id}-${proof}`}>{proof}</i>)}
              </div>
              <div className="contributor-relay-stage__meter" aria-label={`${stage.label} readiness ${stage.meter} percent`}>
                <i />
              </div>
              <footer>
                <strong>not usage</strong>
                <span>rank impact: none</span>
              </footer>
              <small>{stage.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributorLaunchpadPanel({ launchpad }: { launchpad: ContributorLaunchpad }) {
  return (
    <section className="contributor-launchpad" aria-label="Open-source contributor launchpad">
      <div className="contributor-launchpad__head">
        <div>
          <span>VTK://CONTRIBUTOR-LAUNCHPAD//OPEN-SOURCE//NOT-USAGE</span>
          <b>{launchpad.headline}</b>
        </div>
        <p>{launchpad.subline}</p>
      </div>
      <div className="contributor-launchpad__body">
        <aside className="contributor-launchpad__terminal" aria-label="Contributor launchpad terminal">
          <div className="console-top"><span>launchpad@contributors</span><b>{launchpad.totals.lanes} LANES</b></div>
          <pre>{launchpad.terminalLines.join("\n")}</pre>
          <div className="contributor-launchpad__totals" aria-label="Contributor launchpad totals">
            <span>{launchpad.totals.packets} packets</span>
            <span>{launchpad.totals.docs} docs</span>
            <span>{launchpad.totals.adapters} adapter</span>
            <span>{launchpad.totals.fixtures} fixture</span>
            <span>{launchpad.totals.tests} harness</span>
            <span>{launchpad.totals.privacy} privacy</span>
            <span>{launchpad.totals.publish} publish</span>
            <span>{launchpad.totals.rankImpacting} rank impact</span>
            <span>{launchpad.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="contributor-launchpad__lanes">
          {launchpad.lanes.map((lane, index) => (
            <article
              className={`contributor-launch-lane contributor-launch-lane--${lane.impact}`}
              data-impact={lane.impact}
              style={{ "--i": index, "--meter": `${lane.meter}%` } as CSSProperties}
              key={lane.id}
            >
              <div className="contributor-launch-lane__top">
                <span>{lane.call}</span>
                <div>
                  <b>{lane.label}</b>
                  <em>{lane.impact}</em>
                </div>
              </div>
              <div className="contributor-launch-lane__screen" aria-label={`${lane.label} animated proof frames`}>
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${lane.id}-${frame}`}>{frame}</pre>
                ))}
              </div>
              <p>{lane.note}</p>
              <code>{lane.command}</code>
              <small>{lane.path}</small>
              <ul className="contributor-launch-lane__checklist" aria-label={`${lane.label} checklist`}>
                {lane.checklist.map((item) => <li key={`${lane.id}-${item}`}>{item}</li>)}
              </ul>
              <div className="contributor-launch-lane__marks" aria-label={`${lane.label} proof marks`}>
                {lane.marks.map((mark, markIndex) => (
                  <i style={{ "--i": markIndex } as CSSProperties} key={`${lane.id}-${mark}-${markIndex}`}>{mark}</i>
                ))}
              </div>
              <footer>
                <strong>{lane.usageImpact}</strong>
                <span>rank impact: {lane.rankImpact}</span>
                <em aria-label={`${lane.label} proof readiness ${lane.meter} percent`} />
              </footer>
              <small>{lane.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributorQuestBoardPanel({ board }: { board: ContributorQuestBoard }) {
  return (
    <section className="contributor-quest-board" aria-label="Open-source contributor quest board">
      <div className="contributor-quest-board__head">
        <div>
          <span>VTK://CONTRIBUTOR-QUESTS//GOOD-FIRST-ISSUES//NOT-USAGE</span>
          <b>{board.headline}</b>
        </div>
        <p>{board.subline}</p>
      </div>
      <div className="contributor-quest-board__body">
        <aside className="contributor-quest-terminal" aria-label="Contributor quest terminal">
          <div className="console-top"><span>quests@contributors</span><b>{board.totals.quests} QUESTS</b></div>
          <pre>{board.terminalLines.join("\n")}</pre>
          <div className="contributor-quest-terminal__totals" aria-label="Contributor quest totals">
            <span>{board.totals.proofPackets} proof packets</span>
            <span>{board.totals.starter} starter</span>
            <span>{board.totals.advanced} advanced</span>
            <span>{board.totals.notUsage} not usage</span>
            <span>{board.totals.rankImpacting} rank impact</span>
            <span>{board.totals.localFirst} local first</span>
            <span>{board.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="contributor-quest-grid">
          {board.quests.map((quest, index) => (
            <article
              className={`contributor-quest-card contributor-quest-card--${quest.impact}`}
              data-impact={quest.impact.replace("_", " ")}
              style={{ "--i": index, "--meter": `${quest.meter}%` } as CSSProperties}
              key={quest.id}
            >
              <div className="contributor-quest-card__top">
                <span>{quest.call}</span>
                <div>
                  <b>{quest.label}</b>
                  <em>{quest.difficulty}</em>
                </div>
              </div>
              <pre>{quest.terminal.join("\n")}</pre>
              <p>{quest.issue}</p>
              <code>{quest.command}</code>
              <small>{quest.proof}</small>
              <div className="contributor-quest-card__checks" aria-label={`${quest.label} proof checklist`}>
                {quest.checklist.map((item) => <i key={`${quest.id}-${item}`}>{item}</i>)}
              </div>
              <div className="contributor-quest-card__marks" aria-label={`${quest.label} badge marks`}>
                {quest.marks.map((mark, markIndex) => (
                  <strong style={{ "--i": markIndex } as CSSProperties} key={`${quest.id}-${mark}-${markIndex}`}>{mark}</strong>
                ))}
              </div>
              <div className="contributor-quest-card__meter" aria-label={`${quest.label} proof readiness ${quest.meter} percent`}>
                <i />
              </div>
              <footer>
                <span>{quest.usageImpact}</span>
                <span>rank impact: {quest.rankImpact}</span>
              </footer>
              <small>{quest.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributorAdapterFoundryPanel({ foundry }: { foundry: ContributorAdapterFoundry }) {
  return (
    <section className="contributor-adapter-foundry" aria-label="Open-source adapter foundry">
      <div className="contributor-adapter-foundry__head">
        <span>VTK://ADAPTER-FOUNDRY//GLOBAL-AI//NOT-USAGE</span>
        <b>{foundry.headline}</b>
      </div>
      <div className="contributor-adapter-foundry__body">
        <aside className="contributor-adapter-foundry__terminal" aria-label="Adapter foundry terminal">
          <div className="console-top"><span>foundry@contributors</span><b>{foundry.totals.lanes} LANES</b></div>
          <pre>{foundry.terminalLines.join("\n")}</pre>
          <p>{foundry.subline}</p>
          <div className="contributor-adapter-foundry__totals" aria-label="Adapter foundry totals">
            <span>{foundry.totals.packets} proof packets</span>
            <span>{foundry.totals.notUsage} not usage</span>
            <span>{foundry.totals.rankImpacting} rank impact</span>
            <span>{foundry.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="contributor-adapter-foundry__lanes">
          {foundry.lanes.map((lane, index) => (
            <article
              className={`contributor-adapter-lane contributor-adapter-lane--${lane.impact}`}
              data-impact={lane.impact}
              style={{ "--i": index, "--meter": `${lane.meter}%` } as CSSProperties}
              key={lane.id}
            >
              <div className="contributor-adapter-lane__top">
                <span>{lane.call}</span>
                <div>
                  <b>{lane.label}</b>
                  <em>{lane.impact.replace("_", " ")}</em>
                </div>
              </div>
              <pre>{lane.terminal.join("\n")}</pre>
              <p>{lane.note}</p>
              <code>{lane.command}</code>
              <div className="contributor-adapter-lane__marks" aria-label={`${lane.label} foundry marks`}>
                {lane.marks.map((mark, markIndex) => (
                  <i style={{ "--i": markIndex } as CSSProperties} key={`${lane.id}-${mark}-${markIndex}`}>{mark}</i>
                ))}
              </div>
              <div className="contributor-adapter-lane__meter" aria-label={`${lane.label} proof readiness ${lane.meter} percent`}>
                <i />
              </div>
              <footer>
                <strong>{lane.value}</strong>
                <span>{lane.usageImpact}</span>
                <span>rank impact: {lane.rankImpact}</span>
              </footer>
              <small>{lane.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
