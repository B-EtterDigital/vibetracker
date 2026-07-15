"use client";

// Pre-login hero customization: pick a banner image and an avatar image RIGHT NOW — the preview
// applies instantly and persists on this device (localStorage data-URLs). Saving to the public
// profile needs a signed-in identity, and the note says so the moment you customize.

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const KEYS: Record<"banner" | "avatar", string> = {
  banner: "vt-custom-banner",
  avatar: "vt-custom-avatar",
};
const MAX_BYTES = 2_500_000; // keep localStorage sane

export function HeroCustomize() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState<string | null>(null);

  const apply = (kind: "banner" | "avatar", dataUrl: string) => {
    const hero = rootRef.current?.closest(".vhero");
    if (!hero) return;
    if (kind === "banner") {
      const art = hero.querySelector<HTMLElement>(".vhero-banner-art");
      if (art) {
        art.style.backgroundImage = `url(${dataUrl})`;
        art.classList.add("vhero-banner-art--custom");
      }
    } else {
      const avatar = hero.querySelector<HTMLElement>(".vhero-avatar");
      if (!avatar) return;
      let img = avatar.querySelector<HTMLImageElement>(".vhero-avatar-img");
      if (!img) {
        img = document.createElement("img");
        img.className = "vhero-avatar-img";
        img.alt = "";
        avatar.prepend(img);
      }
      img.src = dataUrl;
    }
  };

  // Re-apply a previously chosen preview on load — the device remembers it.
  useEffect(() => {
    for (const kind of ["banner", "avatar"] as const) {
      try {
        const saved = localStorage.getItem(KEYS[kind]);
        if (saved) apply(kind, saved);
      } catch {
        /* localStorage unavailable (private mode) — customization stays session-only */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (kind: "banner" | "avatar") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setNote("That image is over 2.5 MB — pick a smaller one for the preview.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      try {
        localStorage.setItem(KEYS[kind], dataUrl);
      } catch {
        /* quota/private mode — the in-memory preview below still applies */
      }
      apply(kind, dataUrl);
      setNote("Looking good — this preview lives on this device only. Sign in with GitHub to save it to your public profile.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="vhero-custom" ref={rootRef}>
      <label className="vhero-custom-btn" title="Pick a banner image — previews instantly, no login needed. Sign in with GitHub to save it to your public profile.">
        <input type="file" accept="image/*" onChange={pick("banner")} />
        set banner
      </label>
      <label className="vhero-custom-btn" title="Pick an avatar image — previews instantly, no login needed. Sign in with GitHub to save it to your public profile.">
        <input type="file" accept="image/*" onChange={pick("avatar")} />
        set avatar
      </label>
      {note ? <p className="vhero-custom-note" role="status">{note}</p> : null}
    </div>
  );
}
