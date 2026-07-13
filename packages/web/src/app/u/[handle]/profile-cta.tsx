// The C0VIBE band — two honest lanes at the foot of a profile:
//   claim/migrate this board into a free C0VIBE account (self-reported → attested), and
//   track your own usage from the CLI.
//
// The claim lane wears real C0VIBE branding: the C0:VIBE mark and the starfield the brand
// uses on its own surfaces, so the door out of VibeUsage looks like the place it leads to.
// No overclaiming: linking an account makes an upload ATTESTED (a real identity owns the
// handle). It does not make the numbers provider-verified — that stays a separate tier.

import { CopyInitChip } from "./panels";

export interface C0vibeBandProps {
  handle: string;
  claimed: boolean;
  joinHref: string;
  migrateHref: string;
  providerCount: number;
}

const CLAIM_POINTS = [
  "free forever, no card",
  "keeps every tracked day",
  "self-reported → attested",
  "one identity across C0VIBE",
];

export function C0vibeBand({ handle, claimed, joinHref, migrateHref, providerCount }: C0vibeBandProps) {
  return (
    <section className="vprofile-panel vjoin" aria-label="Join C0VIBE">
      <div className="vjoin-lane vjoin-lane--claim">
        <span className="vjoin-art" aria-hidden="true" />
        <span className="vjoin-seam" aria-hidden="true" />

        <div className="vjoin-brand">
          <img
            className="vjoin-logo"
            src="/brand/c0vibe-logo.png"
            alt="C0VIBE"
            width={707}
            height={133}
            loading="lazy"
            decoding="async"
          />
          <span className="vjoin-motto">vibers unite</span>
        </div>

        <h2 className="vjoin-title">
          {claimed ? <>@{handle} is linked to C0VIBE</> : <>Claim @{handle} on C0VIBE</>}
        </h2>
        <p className="vjoin-lede">
          {claimed
            ? "This board uploads as attested: a real C0VIBE identity owns the handle. Keep syncing from the CLI and every day lands here."
            : "This board is self-reported — uploaded from the CLI with no account behind it. Link it to a free C0VIBE account and every future sync uploads as attested, with your full history carried over."}
        </p>
        <ul className="vjoin-points">
          {CLAIM_POINTS.map((point) => (
            <li key={point}>
              <i aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <div className="vjoin-actions">
          <a className="vjoin-btn vjoin-btn--brand" href={joinHref}>
            Join C0VIBE — free
            <i aria-hidden="true">&#8599;</i>
          </a>
          {claimed ? null : <a className="vjoin-btn" href={migrateHref}>Migrate this profile</a>}
        </div>
      </div>

      <div className="vjoin-lane vjoin-lane--track">
        <p className="vjoin-eyebrow">your turn</p>
        <h2 className="vjoin-title vjoin-title--sm">Track yours, locally first</h2>
        <p className="vjoin-lede">
          Everything runs on your machine. Nothing leaves it until you upload — and you choose when.
        </p>
        <div className="vjoin-actions">
          <CopyInitChip />
          <a className="vjoin-btn" href="/providers">browse {providerCount} sources</a>
        </div>
      </div>
    </section>
  );
}
