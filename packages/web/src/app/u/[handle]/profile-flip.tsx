"use client";

// "Flip to C0VIBE" — a migrated profile's door to its other face. Pressing it rotates the whole
// page away like one face of a cube (perspective on <html>, rotateY on <body> — transform/opacity
// only, sci-fi glare sweep riding along) and lands on the viber's C0VIBE profile. The button only
// exists on account-linked profiles; reduced motion skips the theatre and just navigates.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const FLIP_MS = 760;

export function FlipToC0vibe({ handle }: { handle: string }) {
  const [mounted, setMounted] = useState(false);
  const [flipping, setFlipping] = useState(false);
  useEffect(() => setMounted(true), []);
  const target = `https://c0vibe.app/u/${handle.toLowerCase()}`;

  const go = () => {
    if (flipping) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(target);
      return;
    }
    setFlipping(true);
    document.documentElement.classList.add("vflip-stage");
    document.body.classList.add("vflip-out");
    window.setTimeout(() => window.location.assign(target), FLIP_MS);
  };

  if (!mounted) return null;
  return createPortal(
    <button
      type="button"
      className="vflip-btn"
      data-flipping={flipping || undefined}
      onClick={go}
      title="Flip this page over to your C0VIBE profile — same viber, the other face of the cube."
    >
      <i className="vflip-cube" aria-hidden="true"><b /><b /><b /></i>
      Flip to C0VIBE
    </button>,
    document.body,
  );
}
