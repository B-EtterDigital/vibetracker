"use client";

// "Flip to C0VIBE" — the profile is one face of a card; its C0VIBE account is the other.
// Both faces are same-origin routes, so pressing this runs a REAL card flip: GSAP turns the
// page to the 90° hinge, the router swaps to /u/<handle>/c0vibe, and the destination face
// completes the turn with a physical overshoot (see flip-motion.ts). Reduced motion navigates
// plainly. Restored bfcache pages always un-flip on pageshow.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { flipOut } from "./flip-motion";

export function FlipToC0vibe({ handle }: { handle: string }) {
  const [mounted, setMounted] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
    const restore = () => {
      document.documentElement.classList.remove("vflip-stage");
      gsap.set(document.body, { clearProps: "transform" });
      document.querySelectorAll(".vflip-glare").forEach((el) => el.remove());
      setFlipping(false);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const go = () => {
    if (flipping) return;
    setFlipping(true);
    flipOut(1, () => router.push(`/u/${handle.toLowerCase()}/c0vibe`));
  };

  if (!mounted) return null;
  return createPortal(
    <button
      type="button"
      className="vflip-btn"
      data-flipping={flipping || undefined}
      onClick={go}
      title="Flip this card over — same viber, the C0VIBE face."
    >
      <i className="vflip-cube" aria-hidden="true"><b /><b /><b /></i>
      Flip to C0VIBE
    </button>,
    document.body,
  );
}
