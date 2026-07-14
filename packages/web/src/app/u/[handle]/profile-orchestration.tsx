import type { OrchestrationTrace } from "../../../lib/profile-orchestration-data";

// A local orchestration trace reconstructed from bounded gaps between session events. It is
// deliberately labelled as derived evidence: useful for workload shape, not exact process time,
// billing time, human effort, concurrency proof, or proof the user was away.

function fmtHours(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value >= 100 ? Math.round(value).toLocaleString("en-US") : value.toFixed(1);
}

function fmtBytes(value: number): string {
  const mib = value / (1024 * 1024);
  return mib >= 1024 ? `${(mib / 1024).toFixed(1)} GiB` : `${Math.round(mib)} MiB`;
}

export function OrchestrationHours({ orch }: { orch: OrchestrationTrace }) {
  const stats = [
    {
      label: "wall span",
      value: `${fmtHours(orch.wallHours)}h`,
      note: "union of reconstructed activity spans",
    },
    {
      label: "overlap ratio",
      value: `${orch.overlapRatio.toFixed(1)}x`,
      note: "summed span divided by wall span",
    },
    {
      label: "peak overlap",
      value: String(orch.peakOverlap),
      note: "maximum reconstructed spans crossing",
    },
    {
      label: "longest span",
      value: `${fmtHours(orch.longestSpanHours)}h`,
      note: "one event sequence with gaps under 30m",
    },
    {
      label: "night starts",
      value: orch.nightStarts.toLocaleString("en-US"),
      note: "local starts between 23:00 and 07:00",
    },
  ];

  return (
    <section className="vprofile-panel vorch">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">Orchestration trace</h2>
        <span className="vprofile-panel-sub">local derived evidence · {orch.windowDays}-day window</span>
      </header>

      <div className="vorch-hero">
        <div className="vorch-lead">
          <span className="vorch-lead-eyebrow">observed agent activity span</span>
          <strong className="vorch-lead-value">{fmtHours(orch.activityHours)}<em>h</em></strong>
          <span className="vorch-lead-note">
            summed timestamp spans across {orch.sessionFiles.toLocaleString("en-US")} session files · overlapping spans count separately
          </span>
        </div>
      </div>

      <div className="vorch-grid">
        {stats.map((stat) => (
          <div className="vorch-stat" key={stat.label}>
            <span className="vorch-stat-label">{stat.label}</span>
            <strong className="vorch-stat-value">{stat.value}</strong>
            <span className="vorch-stat-note">{stat.note}</span>
          </div>
        ))}
      </div>

      <div className="vorch-coverage">
        <span>coverage {orch.filesScanned.toLocaleString("en-US")}/{orch.filesAvailable.toLocaleString("en-US")} recent files</span>
        <span>{fmtBytes(orch.readBytes)} read</span>
        <span>{orch.sampledFiles.toLocaleString("en-US")} large files sampled</span>
        <span>{orch.limited ? "budget-limited" : "window complete"}</span>
      </div>
      <p className="vorch-foot">derived from event timestamps with gaps capped at 30 minutes · uploaded by the CLI · not exact runtime, billing time, human effort, or server-verified concurrency</p>
    </section>
  );
}
