import { NextResponse } from "next/server";
import { createConsoleTelemetry } from "../../../../../../core/src/telemetry";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { issueCliToken, sha256Hex } from "../../../../lib/cli-auth";
import { GitHubIdentityError, verifyGitHubAccessToken } from "../../../../lib/auth";

export const runtime = "nodejs";

const telemetry = createConsoleTelemetry();

interface GitHubDeviceRequest {
  device_code?: unknown;
  github_token?: unknown;
}

// Fast path for an existing `gh auth` session. The GitHub token is used once to call /user,
// never logged or stored, and exchanged for a VibeTRACKER token bound to the immutable GitHub id.
export async function POST(req: Request) {
  let body: GitHubDeviceRequest;
  try {
    body = await req.json() as GitHubDeviceRequest;
  } catch (error) {
    telemetry.captureError(error, { area: "web.auth.github-device.parse", severity: "warn" });
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const deviceCode = typeof body.device_code === "string" ? body.device_code.trim() : "";
  const githubToken = typeof body.github_token === "string" ? body.github_token : "";
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(deviceCode)) {
    return NextResponse.json({ error: "invalid device code" }, { status: 400 });
  }

  try {
    const profile = await verifyGitHubAccessToken(githubToken);
    const { token, tokenHash } = issueCliToken();
    const { data, error } = await supabaseAdmin().rpc("vibetracker_verify_github_device", {
      p_device_code_hash: sha256Hex(deviceCode),
      p_token_hash: tokenHash,
      p_provider_subject: profile.subject,
      p_provider_login: profile.login,
      p_display_name: profile.displayName,
      p_avatar_url: profile.avatarUrl,
    });
    if (error) {
      const status = /invalid or expired device code/i.test(error.message) ? 400 : 500;
      telemetry.captureError(new Error(error.message), {
        area: "web.auth.github-device.persist",
        severity: status === 400 ? "warn" : "error",
        code: error.code,
      });
      return NextResponse.json({ error: status === 400 ? "invalid or expired device code" : "identity verification failed" }, { status });
    }

    const identity = Array.isArray(data) ? data[0] as { canonical_handle?: string } | undefined : undefined;
    return NextResponse.json({
      status: "approved",
      access_token: token,
      identity: {
        provider: "github",
        handle: identity?.canonical_handle ?? profile.login.toLowerCase(),
        verified: true,
      },
    });
  } catch (error) {
    const known = error instanceof GitHubIdentityError;
    telemetry.captureError(error, {
      area: "web.auth.github-device.verify",
      severity: known && error.status < 500 ? "warn" : "error",
      code: known ? error.code : "github_verify_failed",
    });
    return NextResponse.json(
      { error: known ? error.message : "GitHub identity verification failed" },
      { status: known ? error.status : 500 },
    );
  }
}
