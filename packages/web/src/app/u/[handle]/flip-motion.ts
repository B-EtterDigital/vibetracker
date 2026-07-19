"use client";

// The C0VIBE card-flip choreography (planner-authored signature interaction, 2026-07-20).
// The two profile faces live on the SAME origin (/u/<h> and /u/<h>/c0vibe), so the flip is a
// real two-half turn: this page rotates away to 90°, the router swaps routes at the hinge, and
// the destination completes 90°→0 with a physical overshoot. GSAP drives both halves;
// sessionStorage carries the hinge state across the route change.

import gsap from "gsap";

export const FLIP_KEY = "vtk-flip-hinge";
const OUT_MS = 0.46;

function stage(on: boolean) {
  document.documentElement.classList.toggle("vflip-stage", on);
}

/** First half: lift the card and turn it to the hinge, then hand off to the router. */
export function flipOut(dir: 1 | -1, navigate: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    navigate();
    return;
  }
  stage(true);
  try { sessionStorage.setItem(FLIP_KEY, String(dir)); } catch (storageBlocked) { /* private mode: entrance simply fades */ }
  const glare = document.createElement("div");
  glare.className = "vflip-glare";
  document.body.appendChild(glare);
  const tl = gsap.timeline({ onComplete: navigate });
  tl.to(document.body, { scale: 0.965, duration: 0.16, ease: "power2.out" })
    .to(document.body, {
      rotationY: 90 * dir,
      xPercent: -3 * dir,
      duration: OUT_MS,
      ease: "power3.in",
    }, "<0.04")
    .fromTo(glare, { xPercent: -110 * dir }, { xPercent: 110 * dir, duration: OUT_MS + 0.1, ease: "power2.inOut" }, "<");
}

/** Second half: run on mount of the destination face. Returns true when it animated. */
export function flipIn(): boolean {
  let dir = 0;
  try {
    dir = Number(sessionStorage.getItem(FLIP_KEY) ?? 0);
    sessionStorage.removeItem(FLIP_KEY);
  } catch (storageBlocked) { dir = 0; }
  if (!dir || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage(false);
    gsap.set(document.body, { clearProps: "transform" });
    return false;
  }
  stage(true);
  gsap.fromTo(
    document.body,
    { rotationY: -90 * dir, scale: 0.965 },
    {
      rotationY: 0,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.35)", // the landing wobble — the card settles like a physical object
      onComplete: () => {
        stage(false);
        gsap.set(document.body, { clearProps: "transform" });
      },
    },
  );
  return true;
}
