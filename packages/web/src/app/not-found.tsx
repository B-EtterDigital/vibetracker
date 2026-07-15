// Root 404. Server component, zero JS: a single calm panel that points people
// back to the board instead of dead-ending them.
export default function NotFound() {
  return (
    <section className="vrel">
      <div className="vrel-panel">
        <p className="vrel-label">signal not found</p>
        <h1 className="vrel-title">This route carries no signal.</h1>
        <p className="vrel-text">Check the address, or start from the board.</p>
        <div className="vrel-actions">
          <a className="vrel-pill" href="/">back to the board</a>
        </div>
      </div>
    </section>
  );
}
