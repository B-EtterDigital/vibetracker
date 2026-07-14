export type UplinkCopyState = "idle" | "copied" | "blocked";

interface SignalUplinkProps {
  tier: "verified" | "self_reported";
  copyState: UplinkCopyState;
  onCopy: () => void;
}

const COMMAND = "npx vibetrack init --gui";

export function SignalUplink({ tier, copyState, onCopy }: SignalUplinkProps) {
  const verified = tier === "verified";
  const identityTitle = verified ? "Prove identity" : "Attach handle";
  const identityDetail = verified
    ? "GitHub or C0VIBE proves the operator."
    : "CLI handle only. Identity stays unverified.";

  return (
    <section className="signal-uplink" aria-labelledby="signal-uplink-title">
      <div className="signal-uplink__head">
        <div>
          <p>SIGNAL ACQUISITION</p>
          <h2 id="signal-uplink-title">No public bundle yet.</h2>
          <span>The board is healthy. This lane has received no reviewed aggregate usage.</span>
        </div>
        <div className="signal-uplink__state" aria-label="Public uplink status">
          <i aria-hidden="true" />
          <span>UPLINK IDLE</span>
          <code>NO REVIEWED BUNDLE</code>
        </div>
      </div>

      <div className="signal-uplink__path-wrap">
        <ol className="signal-uplink__path" aria-label="Local usage to public leaderboard path">
          <li data-tone="local">
            <code>[L]</code>
            <div><b>Scan locally</b><span>Usage records stay on this device.</span></div>
          </li>
          <li data-tone="review">
            <code>[R]</code>
            <div><b>Review totals</b><span>Inspect the aggregate before upload.</span></div>
          </li>
          <li data-tone="identity">
            <code>[I]</code>
            <div><b>{identityTitle}</b><span>{identityDetail}</span></div>
          </li>
          <li data-tone="public">
            <code>[P]</code>
            <div><b>Publish bundle</b><span>Rank appears only after a valid upload.</span></div>
          </li>
        </ol>
        <i className="signal-uplink__packet" aria-hidden="true" />
      </div>

      <div className="signal-uplink__console">
        <div className="signal-uplink__scope" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
          <i />
        </div>
        <div className="signal-uplink__command">
          <span>LOCAL FIRST COMMAND</span>
          <code>{COMMAND}</code>
        </div>
        <div className="signal-uplink__actions">
          <button type="button" onClick={onCopy} data-state={copyState}>
            <span aria-hidden="true">[+]</span>
            <b aria-live="polite">
              {copyState === "copied" ? "COMMAND COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY COMMAND"}
            </b>
          </button>
          <a href="/u/demo">Open sample profile <span aria-hidden="true">-&gt;</span></a>
        </div>
      </div>

      <p className="signal-uplink__foot">
        Nothing is generated, uploaded, or ranked on this screen. The sample profile is bundled demo data and never enters leaderboard totals.
      </p>
    </section>
  );
}
