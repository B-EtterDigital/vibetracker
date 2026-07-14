import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description: "A public VibeUsage profile: recent momentum, work mix, source activity, signal depth, and clearly separated trust evidence.",
};

export default function PublicProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
