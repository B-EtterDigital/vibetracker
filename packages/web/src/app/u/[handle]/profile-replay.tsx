"use client";

// Click-to-replay wrapper for the infographic instruments: clicking re-mounts the children
// (key bump), so their CSS entrance animations run again. Subtle affordance, no library.

import { useState, type ReactNode } from "react";

export function Replay({ children, hint }: { children: ReactNode; hint: string }) {
  const [round, setRound] = useState(0);
  return (
    <div
      className="vinfo-replay"
      key={round}
      onClick={() => setRound((r) => r + 1)}
      title={`${hint} · click to replay the draw-in animation`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRound((r) => r + 1);
        }
      }}
    >
      {children}
    </div>
  );
}
