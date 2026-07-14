import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Connect the CLI · VibeUsage",
  description: "Connect VibeTRACKER through an existing GitHub CLI identity or a one-time browser device approval.",
};

export default function CliLoginLayout({ children }: { children: ReactNode }) {
  return children;
}
