import type { CSSProperties } from "react";
import {
  buildAiLifeCockpit,
  type AiLifeCockpit,
  type AiLifePersonaAtlas,
  type AiLifePracticePassport,
} from "../../lib/ai-life-cockpit";

export const metadata = {
  title: "VibeUsage AI Life Dashboard",
  description: "A terminal GUI dashboard for creator, builder, local AI, regional AI, manual ledger, and C0VIBE publish rails.",
};

function AiLifeRouteCockpit({ cockpit }: { cockpit: AiLifeCockpit }) {
  return (
    <section className="life-route-cockpit ai-life-cockpit" aria-label="VibeTRACKER AI life dashboard cockpit">
      <div className="ai-life-cockpit__head">
        <span>VTK://AI-LIFE-DASHBOARD//CREATORS-CODERS-LOCAL-GLOBAL//NO-MIXED-RAILS</span>
        <b>{cockpit.headline}</b>
      </div>
      <div className="ai-life-cockpit__body">
        <aside className="ai-life-cockpit__terminal" aria-label="AI life dashboard terminal">
          <div className="console-top"><span>life@vibetracker</span><b>VIBERS UNITE</b></div>
          <pre>{cockpit.terminalLines.join("\n")}</pre>
          <div className="ai-life-cockpit__totals" aria-label="AI life provider catalog totals">
            <span>{cockpit.totals.providers} providers</span>
            <span>{cockpit.totals.built} built</span>
            <span>{cockpit.totals.verified} verified</span>
            <span>{cockpit.totals.local} local</span>
            <span>{cockpit.totals.manual} manual</span>
          </div>
          <p>{cockpit.subline}</p>
        </aside>
        <div className="ai-life-cockpit__lanes" aria-label="AI life usage and trust lanes">
          {cockpit.lanes.map((lane, index) => (
            <article
              className={`ai-life-lane ai-life-lane--${lane.impact}`}
              data-impact={lane.impact}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="ai-life-lane__top">
                <i>{lane.mark}</i>
                <div>
                  <span>{lane.railLabel}</span>
                  <b>{lane.label}</b>
                </div>
                <strong>{lane.value}</strong>
              </div>
              <div className="ai-life-lane__screen" aria-hidden="true">
                <pre>{lane.ascii.join("\n")}</pre>
              </div>
              <div className="ai-life-lane__providers" aria-label={`${lane.label} source marks`}>
                {lane.providers.slice(0, 8).map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${lane.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <div className="ai-life-lane__meter" aria-label={`${lane.label} dashboard meter ${lane.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="ai-life-cockpit__rhythm" aria-label="AI life dashboard rhythm rail">
        {cockpit.rhythm.map((item, index) => (
          <article className={`ai-life-rhythm ai-life-rhythm--${item.impact}`} style={{ "--i": index } as CSSProperties} key={item.id}>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AiLifeBroadcastWallPanel({ cockpit }: { cockpit: AiLifeCockpit }) {
  const surfaces = cockpit.practice.surfaces;
  const terminalLines = [
    "VTK AI LIFE BROADCAST // NOT JUST CODERS",
    "$ vibetracker life --broadcast",
    "[creator] image/video/audio/3d usage metadata",
    "[builder] Codex/GitHub cadence -> NOT USAGE",
    "[local] Ollama/LM Studio/ComfyUI -> LOCAL ONLY",
    "[research] notes, citations, exports -> REVIEW",
    "[regional] Chinese + EU + global AI rails labelled",
    "[publish] c0vibe.app dry-run before public relay",
    "motto: Vibers Unite",
  ];

  return (
    <section className="life-broadcast-wall" aria-label="AI life Vibers Unite broadcast wall">
      <div className="life-broadcast-wall__head">
        <div>
          <span>VTK://AI-LIFE-BROADCAST//VIBERS-UNITE//NOT-JUST-CODERS</span>
          <b>Vibers Unite broadcast</b>
        </div>
        <p>
          A first-screen map for the whole AI practice: creator studios, builder agents, local labs,
          research desks, regional providers, manual review, and C0VIBE publish without mixing rails.
        </p>
      </div>
      <div className="life-broadcast-wall__body">
        <aside className="life-broadcast-wall__terminal" aria-label="AI life broadcast terminal">
          <div className="console-top"><span>broadcast@life</span><b>ALL VIBERS</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="life-broadcast-wall__totals" aria-label="AI life broadcast totals">
            <span>{cockpit.totals.providers} provider signals</span>
            <span>{cockpit.totals.local} local sources</span>
            <span>{cockpit.practice.totals.usage} usage rails</span>
            <span>{cockpit.practice.totals.notUsage} not usage</span>
            <span>{cockpit.practice.totals.publish} publish rail</span>
          </div>
        </aside>
        <div className="life-broadcast-cards" aria-label="AI life broadcast cards">
          {surfaces.map((surface, index) => (
            <article
              className={`life-broadcast-card life-broadcast-card--${surface.impact}`}
              data-impact={surface.impact}
              key={surface.id}
              style={{
                "--i": index,
                "--meter": `${surface.meter}%`,
                "--brand-from": surface.from,
                "--brand-to": surface.to,
                "--brand-ink": surface.ink,
              } as CSSProperties}
            >
              <div className="life-broadcast-card__top">
                <i>{surface.mark}</i>
                <div>
                  <span>{surface.railLabel}</span>
                  <b>{surface.label}</b>
                </div>
              </div>
              <div className="life-broadcast-card__screen" aria-hidden="true">
                <pre>{surface.ascii.join("\n")}</pre>
              </div>
              <strong>{surface.persona}</strong>
              <code>{surface.command}</code>
              <p>{surface.capture}</p>
              <small>{surface.boundary}</small>
              <div className="life-broadcast-card__providers" aria-label={`${surface.label} broadcast provider marks`}>
                {surface.providers.slice(0, 4).map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${surface.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <footer aria-label={`${surface.label} broadcast meter ${surface.meter} percent`}>
                <i />
                <em>{surface.id}</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiLifeConstellationPanel({ cockpit }: { cockpit: AiLifeCockpit }) {
  const usageRails = cockpit.lanes.filter((lane) => lane.impact === "usage").length;
  const labelledContextRails = cockpit.lanes.length - usageRails;
  const terminalLines = [
    "+------------------------------------------------------+",
    "| VTK://AI-LIFE-CONSTELLATION//ALL-RAILS//NO-MIXED-TOTALS |",
    `| catalog ${String(cockpit.totals.providers).padStart(3)} // local ${String(cockpit.totals.local).padStart(2)} // manual ${String(cockpit.totals.manual).padStart(2)} // built ${String(cockpit.totals.built).padStart(2)} |`,
    "| creator + regional rails can feed reviewed usage      |",
    "| builder trust is NOT USAGE; local AI is LOCAL ONLY    |",
    "| privacy review and C0VIBE publish are separate rails  |",
    "| constellation motion writes 0 records, 0 ranks        |",
    "| Vibers Unite // c0vibe.app                            |",
    "+------------------------------------------------------+",
  ];

  return (
    <section className="life-constellation" aria-label="AI life constellation">
      <div className="life-constellation__head">
        <div>
          <span>VTK://AI-LIFE-DASHBOARD//CONSTELLATION//USAGE-TRUST-LOCAL-PUBLISH</span>
          <b>AI life constellation</b>
        </div>
        <p>One map for creators, builders, local labs, regional AI, manual ledgers, and C0VIBE relay. Each rail keeps its proof boundary visible.</p>
      </div>
      <div className="life-constellation__body">
        <aside className="life-constellation__terminal" aria-label="AI life constellation terminal">
          <div className="console-top"><span>constellation@life</span><b>NO MIXED TOTALS</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="life-constellation__stats" aria-label="AI life constellation stats">
            <span>{usageRails} usage rails</span>
            <span>{labelledContextRails} labelled context rails</span>
            <span>{cockpit.totals.local} local sources</span>
            <span>0 hidden uploads</span>
          </div>
          <div className="life-constellation__rhythm" aria-label="AI life constellation rhythm">
            {cockpit.rhythm.map((item) => (
              <span data-impact={item.impact} key={item.id}>{item.label}: {item.value}</span>
            ))}
          </div>
        </aside>
        <div className="life-constellation__map" aria-label="AI life constellation rail map">
          <div className="life-constellation__core" aria-label="AI life constellation core">
            <strong>Vibers Unite</strong>
            <span>c0vibe.app</span>
            <code>{"local preview -> reviewed aggregate -> publish"}</code>
          </div>
          {cockpit.lanes.map((lane, index) => (
            <article
              className={`life-orbit life-orbit--${lane.impact}`}
              data-impact={lane.impact}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="life-orbit__top">
                <i>{lane.mark}</i>
                <span>{lane.railLabel}</span>
              </div>
              <b>{lane.label}</b>
              <strong>{lane.value}</strong>
              <code>{lane.command}</code>
              <p>{lane.guardrail}</p>
              <div className="life-orbit__providers" aria-label={`${lane.label} constellation sources`}>
                {lane.providers.slice(0, 5).map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${lane.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <footer aria-label={`${lane.label} constellation meter ${lane.meter} percent`}>
                <i />
                <em>{lane.meter}%</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiLifePersonaAtlasPanel({ atlas }: { atlas: AiLifePersonaAtlas }) {
  return (
    <section className="life-persona-atlas" aria-label="AI life persona atlas">
      <div className="life-persona-atlas__head">
        <div>
          <span>VTK://AI-LIFE-PERSONA-ATLAS//NOT-JUST-CODERS//ALL-VIBERS</span>
          <b>{atlas.headline}</b>
        </div>
        <p>{atlas.subline}</p>
      </div>
      <div className="life-persona-atlas__body">
        <aside className="life-persona-atlas__terminal" aria-label="AI life persona atlas terminal">
          <div className="console-top"><span>persona@life</span><b>{atlas.totals.averageMeter}% MAP</b></div>
          <pre>{atlas.terminalLines.join("\n")}</pre>
          <div className="life-persona-atlas__totals" aria-label="AI life persona atlas totals">
            <span>{atlas.totals.personas} personas</span>
            <span>{atlas.totals.usage} usage</span>
            <span>{atlas.totals.localOnly} local</span>
            <span>{atlas.totals.notUsage} not usage</span>
            <span>{atlas.totals.privacy} review</span>
            <span>{atlas.totals.publish} publish</span>
          </div>
        </aside>
        <div className="life-persona-cards" aria-label="AI life persona cards">
          {atlas.personas.map((card, index) => (
            <article
              className={`life-persona-card life-persona-card--${card.impact}`}
              data-impact={card.impact}
              style={{
                "--i": index,
                "--meter": `${card.meter}%`,
                "--brand-from": card.from,
                "--brand-to": card.to,
                "--brand-ink": card.ink,
              } as CSSProperties}
              key={card.id}
            >
              <div className="life-persona-card__top">
                <i>{card.mark}</i>
                <div>
                  <span>{card.railLabel}</span>
                  <b>{card.label}</b>
                </div>
              </div>
              <div className="life-persona-card__screen" aria-hidden="true">
                <pre>{card.ascii.join("\n")}</pre>
              </div>
              <strong>{card.persona}</strong>
              <code>{card.command}</code>
              <dl>
                <div>
                  <dt>tracked</dt>
                  <dd>{card.tracks}</dd>
                </div>
                <div>
                  <dt>blocked</dt>
                  <dd>{card.notTracked}</dd>
                </div>
              </dl>
              <p>{card.proof}</p>
              <div className="life-persona-card__providers" aria-label={`${card.label} provider marks`}>
                {card.providers.map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${card.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <footer aria-label={`${card.label} persona atlas meter ${card.meter} percent`}>
                <i />
                <span>{card.id}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiLifePracticePassportPanel({ passport }: { passport: AiLifePracticePassport }) {
  return (
    <section className="life-practice-passport" aria-label="AI practice passport">
      <div className="life-practice-passport__head">
        <div>
          <span>VTK://AI-LIFE-PASSPORT//CREATOR-BUILDER-LOCAL-RESEARCH//NO-MIXED-RANKS</span>
          <b>{passport.headline}</b>
        </div>
        <p>{passport.subline}</p>
      </div>
      <div className="life-practice-passport__body">
        <aside className="life-practice-passport__terminal" aria-label="AI practice passport terminal">
          <div className="console-top"><span>passport@life</span><b>ALL VIBERS</b></div>
          <pre>{passport.terminalLines.join("\n")}</pre>
          <div className="life-practice-passport__totals" aria-label="AI practice passport totals">
            <span>{passport.totals.surfaces} surfaces</span>
            <span>{passport.totals.usage} usage</span>
            <span>{passport.totals.localOnly} local</span>
            <span>{passport.totals.notUsage} not usage</span>
            <span>{passport.totals.privacy} review</span>
            <span>{passport.totals.publish} publish</span>
            <span>{passport.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="life-practice-surfaces" aria-label="AI practice surfaces">
          {passport.surfaces.map((surface, index) => (
            <article
              className={`life-practice-surface life-practice-surface--${surface.impact}`}
              data-impact={surface.impact}
              style={{
                "--i": index,
                "--meter": `${surface.meter}%`,
                "--brand-from": surface.from,
                "--brand-to": surface.to,
                "--brand-ink": surface.ink,
              } as CSSProperties}
              key={surface.id}
            >
              <div className="life-practice-surface__top">
                <i>{surface.mark}</i>
                <div>
                  <span>{surface.railLabel}</span>
                  <b>{surface.label}</b>
                </div>
              </div>
              <div className="life-practice-surface__screen" aria-hidden="true">
                <pre>{surface.ascii.join("\n")}</pre>
              </div>
              <strong>{surface.value}</strong>
              <em>{surface.persona}</em>
              <code>{surface.command}</code>
              <p>{surface.capture}</p>
              <small>{surface.boundary}</small>
              <div className="life-practice-surface__providers" aria-label={`${surface.label} provider marks`}>
                {surface.providers.map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${surface.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <footer aria-label={`${surface.label} practice meter ${surface.meter} percent`}>
                <i />
                <span>{surface.id}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LifePage() {
  const cockpit = buildAiLifeCockpit();

  return (
    <>
      <section className="life-route-intro" aria-label="VibeTRACKER AI life dashboard introduction">
        <div>
          <p className="eyebrow">AI life dashboard</p>
          <h1>Your whole AI practice, not just coding spend</h1>
          <p>
            A first-class cockpit for creators, coders, local model users, regional AI explorers,
            manual subscription ledgers, and publish proof. Usage, not-usage trust, local-only,
            privacy review, and C0VIBE publish rails stay visually separate.
          </p>
        </div>
        <div className="motto-rail" aria-label="AI life dashboard motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>NO MIXED RAILS</code>
        </div>
      </section>
      <AiLifeBroadcastWallPanel cockpit={cockpit} />
      <AiLifePersonaAtlasPanel atlas={cockpit.persona} />
      <AiLifeConstellationPanel cockpit={cockpit} />
      <AiLifePracticePassportPanel passport={cockpit.practice} />
      <AiLifeRouteCockpit cockpit={cockpit} />
    </>
  );
}
