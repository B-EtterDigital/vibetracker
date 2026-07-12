import "../../reliability.css";

// Shown when a handle has no public profile yet. Server component, zero JS: an
// honest invitation, not an error. The command is a static chip — no copy
// behaviour — so the surface works even before hydration.
export default function HandleNotFound() {
  return (
    <section className="vrel">
      <div className="vrel-panel">
        <p className="vrel-label">no signal yet</p>
        <h1 className="vrel-title">This handle has not uploaded yet.</h1>
        <p className="vrel-text">
          It could be you: track locally, upload when you choose, and this page becomes your dashboard.
        </p>
        <span className="vrel-cmd">
          <i aria-hidden="true">$</i>
          <code>npx vibetrack init</code>
        </span>
        <div className="vrel-actions">
          <a className="vrel-pill" href="/u/demo">see the sample profile</a>
          <a className="vrel-pill" href="/">back to the board</a>
        </div>
      </div>
    </section>
  );
}
