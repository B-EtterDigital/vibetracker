// Streamed while the profile dashboard resolves. Server component, no spinner:
// calm bones in the dashboard's real layout order (header, progress, four stat
// cards, wide chart). The shimmer is transform-only and disabled under
// prefers-reduced-motion, where the bones stay static.
export default function Loading() {
  return (
    <section className="vrel" aria-busy="true" aria-label="Loading profile dashboard">
      <div className="vrel-skel">
        <div className="vrel-skel-head" aria-hidden="true">
          <span className="vrel-bone vrel-bone-avatar" />
          <span className="vrel-skel-lines">
            <span className="vrel-bone vrel-bone-line vrel-bone-line--wide" />
            <span className="vrel-bone vrel-bone-line vrel-bone-line--narrow" />
          </span>
        </div>
        <div className="vrel-bone vrel-bone-progress" aria-hidden="true" />
        <div className="vrel-skel-stats" aria-hidden="true">
          <div className="vrel-bone vrel-bone-stat" />
          <div className="vrel-bone vrel-bone-stat" />
          <div className="vrel-bone vrel-bone-stat" />
          <div className="vrel-bone vrel-bone-stat" />
        </div>
        <div className="vrel-bone vrel-bone-chart" aria-hidden="true" />
      </div>
    </section>
  );
}
