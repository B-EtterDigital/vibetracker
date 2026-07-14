const READS = [
  { label: "TRACKED SPEND", detail: "accepted priced rows", tone: "spend" },
  { label: "30D FORECAST", detail: "trailing local pace", tone: "forecast" },
  { label: "OPERATIONS", detail: "normalized AI actions", tone: "ops" },
  { label: "LOCAL SHADOW", detail: "hosted cost avoided", tone: "local" },
] as const;

const FLOW = [
  { index: "01", label: "CAPTURE", title: "Find local usage", detail: "Scan supported ledgers already on this machine.", href: "/scan", action: "OPEN SCAN" },
  { index: "02", label: "NORMALIZE", title: "Map every source", detail: "See which providers are automatic, proxied, or manual.", href: "/sources", action: "MAP SOURCES" },
  { index: "03", label: "INTERPRET", title: "Read the decisions", detail: "Turn cost and rhythm into a clear monthly operating plan.", href: "/insights", action: "OPEN INSIGHTS" },
  { index: "04", label: "PUBLISH", title: "Choose public proof", detail: "Your profile receives only the evidence you explicitly submit.", href: "/u/demo", action: "VIEW PROFILE" },
] as const;

export function LocalCockpitGuide() {
  return (
    <section className="vlife-guide" aria-labelledby="vlife-guide-title">
      <header className="vlife-guide-head">
        <div>
          <p>COMMAND CENTER MAP // AWAITING LOCAL SIGNAL</p>
          <h2 id="vlife-guide-title">Know what unlocks before you connect.</h2>
        </div>
        <span>NO SAMPLE NUMBERS // NO CLOUD READ</span>
      </header>

      <dl className="vlife-guide-reads" aria-label="Metrics available after local connection">
        {READS.map((read) => (
          <div key={read.label} data-tone={read.tone}>
            <dt>{read.label}</dt>
            <dd aria-label="Awaiting local connection">--</dd>
            <span>{read.detail}</span>
          </div>
        ))}
      </dl>

      <div className="vlife-guide-body">
        <section className="vlife-pipeline" aria-labelledby="vlife-pipeline-title">
          <div className="vlife-guide-label">
            <p>USAGE PIPELINE</p>
            <h3 id="vlife-pipeline-title">From machine evidence to useful action.</h3>
          </div>
          <ol>
            {FLOW.map((step) => (
              <li key={step.index}>
                <code>{step.index}</code>
                <div><span>{step.label}</span><b>{step.title}</b><small>{step.detail}</small></div>
                <a href={step.href}>{step.action}<span aria-hidden="true"> -&gt;</span></a>
              </li>
            ))}
          </ol>
        </section>

        <section className="vlife-boundary" aria-labelledby="vlife-boundary-title">
          <div className="vlife-guide-label">
            <p>DATA CUSTODY</p>
            <h3 id="vlife-boundary-title">The boundary is visible.</h3>
          </div>
          <div className="vlife-boundary-map" role="img" aria-label="Your ledger stays on this machine. Aggregate stats travel over loopback to this browser tab. Nothing is uploaded.">
            <div><span>01</span><b>THIS MACHINE</b><small>ledger + prompts stay here</small></div>
            <i aria-hidden="true">-&gt;</i>
            <div><span>02</span><b>127.0.0.1</b><small>tokenized aggregates only</small></div>
            <i aria-hidden="true">-&gt;</i>
            <div><span>03</span><b>THIS TAB</b><small>read-only live cockpit</small></div>
          </div>
          <p className="vlife-boundary-note"><b>ZERO UPLOAD</b> Public proof is a separate, explicit action. Connecting this page does not publish anything.</p>
        </section>
      </div>
    </section>
  );
}
