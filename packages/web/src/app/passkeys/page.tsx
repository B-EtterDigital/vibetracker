import type { Metadata } from "next";
import { PasskeyLocalConsole } from "./passkey-local-console";
import "./passkey-local.css";

export const metadata: Metadata = {
  title: "Optional Local Key | VibeUsage",
  description: "An honest browser-local WebAuthn check that stays separate from GitHub account identity and usage proof.",
};

export default function PasskeysPage() {
  return <PasskeyLocalConsole />;
}
