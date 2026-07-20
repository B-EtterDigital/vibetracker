"use client";

// Client shell of the C0VIBE face: completes the card turn on mount (second half of the flip)
// and offers the symmetric flip back to the usage face.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { flipIn, flipOut } from "../flip-motion";

export function C0vibeFaceStage({ handle, children }: { handle: string; children: React.ReactNode }) {
  const [flipping, setFlipping] = useState(false);
  const router = useRouter();
  useEffect(() => {
    flipIn();
    const restore = () => {
      document.documentElement.classList.remove("vflip-stage");
      gsap.set(document.body, { clearProps: "transform" });
      document.querySelectorAll(".vflip-glare").forEach((el) => el.remove());
      setFlipping(false);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const back = () => {
    if (flipping) return;
    setFlipping(true);
    flipOut(-1, () => router.push(`/u/${handle.toLowerCase()}`));
  };

  const href = `/u/${handle.toLowerCase()}`;
  return (
    <div className="vc0face-stage">
      {/* Always-visible way home (user report 2026-07-20: the bottom-right pill alone wasn't
          found). A real link — works without JS — that upgrades to the card flip when it can. */}
      <a
        className="vc0face-return"
        href={href}
        onClick={(e) => { e.preventDefault(); back(); }}
      >
        ← @{handle.toLowerCase()} · usage face
      </a>
      {children}
      <button type="button" className="vflip-btn vc0face-back" data-flipping={flipping || undefined} onClick={back}
        title="Flip the card back to the usage face.">
        <i className="vflip-cube" aria-hidden="true"><b /><b /><b /></i>
        Flip to VibeUsage
      </button>
    </div>
  );
}
