import { handleAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../../core/src/telemetry";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  parseWorkosLinkState,
  workosLinkResultFromError,
  type WorkosLinkResult,
} from "../../../../lib/workos-account-link";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();

class WorkosLinkClaimError extends Error {
  constructor(readonly result: WorkosLinkResult, cause: string) {
    super(`WorkOS account link failed: ${cause}`);
  }
}

export const GET = handleAuth({
  returnPathname: "/account",
  onSuccess: async ({ user, state }) => {
    const link = parseWorkosLinkState(state);
    if (!link) return;

    const { error } = await supabaseAdmin().rpc("vibetracker_consume_workos_link_claim", {
      p_claim_token: link.bridge,
      p_workos_user_id: user.id,
    });
    if (!error) return;

    const result = workosLinkResultFromError(error.message);
    telemetry.captureError(new Error(error.message), {
      area: "web.auth.workos-link.consume",
      severity: result === "error" ? "error" : "warn",
      code: error.code,
      workosUserId: user.id,
    });
    throw new WorkosLinkClaimError(result, error.message);
  },
  onError: async ({ error, request }) => {
    const result = error instanceof WorkosLinkClaimError ? error.result : "error";
    if (!(error instanceof WorkosLinkClaimError)) {
      telemetry.captureError(error instanceof Error ? error : new Error(String(error)), {
        area: "web.auth.workos-callback",
        severity: "error",
      });
    }
    return NextResponse.redirect(new URL(`/account?c0vibe=${result}`, request.url));
  },
});
