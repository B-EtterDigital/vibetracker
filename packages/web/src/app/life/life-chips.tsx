"use client";

// Copy-command chip for the AI Life overview. Mirrors the committed TrackYours
// chip in the profile dashboard: the visible copied / copy blocked state IS the
// error handling for the clipboard call — never a silent catch, so the user
// always sees whether the command landed on the clipboard.

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CopyChip({ command }: { command: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    timer.current = setTimeout(() => setCopyState("idle"), 1600);
  }
  const stateWord: ReactNode =
    copyState === "copied" ? "copied" : copyState === "blocked" ? "copy blocked" : "copy";
  return (
    <button
      type="button"
      className="vlife-chip"
      onClick={copy}
      data-state={copyState}
      aria-label={`Copy ${command} to clipboard`}
    >
      <code>{command}</code>
      <span aria-live="polite">{stateWord}</span>
    </button>
  );
}
