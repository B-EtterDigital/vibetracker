// The C0VIBE face of a viber's card — the same profile, flipped over. c0vibe.app has no public
// profile routes yet, so this face renders the viber's LINKED C0VIBE account from the shared
// backend (identity + achievements) instead of dead-linking off-site; when C0VIBE ships public
// profiles this route can hand off. Everything shown is real linked-account data — absent data
// renders nothing.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "../../../../lib/supabase-server";
import { C0vibeFaceStage } from "./face-stage";
import "./c0vibe-face.css";

export const revalidate = 300;

interface FaceIdentity {
  canonical_handle: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string;
  provider_login: string | null;
  user_id: string | null;
  verified_at: string | null;
  linked_at: string | null;
}

async function faceFor(handle: string): Promise<{ identity: FaceIdentity; achievements: number } | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("vibetracker_identities")
    .select("canonical_handle, display_name, avatar_url, provider, provider_login, user_id, verified_at, linked_at")
    .eq("canonical_handle", handle.toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  const identity = data as FaceIdentity;
  let achievements = 0;
  if (identity.user_id) {
    const { count, error: achErr } = await sb
      .from("c0_achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", identity.user_id)
      .eq("status", "unlocked");
    if (!achErr && typeof count === "number") achievements = count;
  }
  return { identity, achievements };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle.toLowerCase()} · C0VIBE face` };
}

export default async function C0vibeFace({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const face = await faceFor(handle);
  if (!face) notFound();
  const { identity, achievements } = face;
  const linked = Boolean(identity.user_id);
  const since = identity.linked_at ?? identity.verified_at;

  return (
    <C0vibeFaceStage handle={identity.canonical_handle}>
      <main className="vc0face">
        <header className="vc0face-brand" aria-label="C0VIBE">
          <span className="vc0face-mark">C0VIBE</span>
          <span className="vc0face-tag">the other face of this card</span>
        </header>

        <section className="vc0face-id">
          {identity.avatar_url ? (
            <img className="vc0face-avatar" src={identity.avatar_url} alt="" width={96} height={96} />
          ) : null}
          <h1 className="vc0face-name">{identity.display_name ?? `@${identity.canonical_handle}`}</h1>
          <p className="vc0face-handle">@{identity.canonical_handle}</p>
          <p className="vc0face-linkline" data-linked={linked || undefined}>
            {linked ? "C0VIBE account linked" : "no C0VIBE account linked yet"}
            {linked && since ? ` · since ${new Date(since).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
            {identity.provider === "github" && identity.provider_login ? ` · via GitHub @${identity.provider_login}` : ""}
          </p>
        </section>

        {achievements > 0 ? (
          <section className="vc0face-stats">
            <div className="vc0face-stat">
              <b>{achievements}</b>
              <span>achievements unlocked</span>
            </div>
          </section>
        ) : null}

        <footer className="vc0face-note">
          <p>
            C0VIBE public profile pages are on the way — this face shows the linked account from the
            shared backend. Meanwhile the product lives at{" "}
            <a href="https://c0vibe.app" rel="noopener">c0vibe.app</a>.
          </p>
        </footer>
      </main>
    </C0vibeFaceStage>
  );
}
