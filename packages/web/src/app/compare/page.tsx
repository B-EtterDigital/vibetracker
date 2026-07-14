import { getProfile, type ProfileView } from "../../lib/data";
import { CompareLab, type CompareProfileState } from "./compare-lab";
import {
  buildCompareParticipant,
  buildPublicComparison,
  DEFAULT_LEFT_HANDLE,
  DEFAULT_RIGHT_HANDLE,
  sanitizeCompareHandle,
} from "./compare-model";
import "./compare.css";
import "./compare-responsive.css";

export const metadata = {
  title: "Compare public usage · VibeUsage",
  description: "Put two real public VibeUsage receipts on one read-only scope without mixing evidence tiers, trust context, or private data.",
};

export const revalidate = 60;

interface ComparePageProps {
  searchParams: Promise<{ left?: string | string[]; right?: string | string[] }>;
}

function profileState(
  requestedHandle: string,
  result: PromiseSettledResult<ProfileView | null>,
): CompareProfileState {
  if (result.status === "rejected") return { requestedHandle, participant: null, state: "error" };
  if (!result.value?.latest) return { requestedHandle, participant: null, state: "missing" };
  return { requestedHandle, participant: buildCompareParticipant(result.value), state: "ready" };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const leftHandle = sanitizeCompareHandle(params.left, DEFAULT_LEFT_HANDLE);
  const rightHandle = sanitizeCompareHandle(params.right, DEFAULT_RIGHT_HANDLE);
  const [leftResult, rightResult] = await Promise.allSettled([
    getProfile(leftHandle),
    getProfile(rightHandle),
  ]);
  const leftState = profileState(leftHandle, leftResult);
  const rightState = profileState(rightHandle, rightResult);
  const leftProfile = leftResult.status === "fulfilled" && leftResult.value?.latest ? leftResult.value : null;
  const rightProfile = rightResult.status === "fulfilled" && rightResult.value?.latest ? rightResult.value : null;
  const snapshot = leftProfile && rightProfile ? buildPublicComparison(leftProfile, rightProfile) : null;

  return <CompareLab leftState={leftState} rightState={rightState} snapshot={snapshot} />;
}
