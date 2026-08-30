import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import { safeNextPath } from "../../../account/account-session";
import { validWorkosBridgeClaim } from "../../../../lib/workos-account-link";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const bridge = requestUrl.searchParams.get("bridge");
  const requestedReturnTo = safeNextPath(requestUrl.searchParams.get("returnTo"));
  const hasBridge = validWorkosBridgeClaim(bridge);
  const returnTo = hasBridge ? "/account?c0vibe=linked" : requestedReturnTo ?? "/account";
  const signInUrl = await getSignInUrl({
    returnTo,
    state: hasBridge ? JSON.stringify({ bridge }) : undefined,
  });
  return NextResponse.redirect(signInUrl);
}
