export function IdentityClaimRail() {
  return (
    <section className="identity-claim" aria-labelledby="identity-claim-title">
      <div className="identity-claim__legend" aria-label="Leaderboard identity labels">
        <span>IDENTITY LANE</span>
        <b><i aria-hidden="true">✓</i> GitHub verified</b>
        <b><i data-cli aria-hidden="true">CLI</i> handle only</b>
      </div>
      <div className="identity-claim__copy">
        <span>ALREADY USING VIBETRACKER?</span>
        <h2 id="identity-claim-title">Claim the blue check. Keep the ledger.</h2>
        <p>Verify the GitHub identity behind your CLI history. Linked records stay attached; identity proof never upgrades usage evidence.</p>
      </div>
      <div className="identity-claim__action">
        <a href="/account?next=%2F">Verify GitHub</a>
        <small>No C0VIBE account required</small>
      </div>
    </section>
  );
}
