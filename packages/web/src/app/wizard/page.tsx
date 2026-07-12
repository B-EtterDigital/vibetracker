import { buildInstallRunway } from "../../lib/install-runway";
import { buildLaunchSequence, buildWizardFlightRecorder } from "../../lib/launch-sequence";
import { WizardShell } from "./wizard-shell";
import "./wizard.css";
import "./wizard-layout.css";

export const metadata = {
  title: "First run command deck · VibeUsage",
  description: "Build a local-first VibeTRACKER runbook, choose source rails, and review every command before anything runs.",
};

export default function WizardPage() {
  const runway = buildInstallRunway();
  const sequence = buildLaunchSequence();
  const recorder = buildWizardFlightRecorder();

  return (
    <WizardShell
      proofCounters={recorder.counters}
      runwaySummary={{
        tracks: runway.totals.tracks,
        localFirst: runway.totals.localFirst,
        publishGates: runway.totals.publishGates,
      }}
      sequence={sequence.map(({ id, call, title, note, status }) => ({
        id,
        call,
        title,
        note,
        status,
      }))}
    />
  );
}
