import { signOut } from "@workos-inc/authkit-nextjs";

export const runtime = "nodejs";

const PRODUCTION_ORIGIN = "https://vibeusage.c0vibe.app";

function allowedReturnOrigin(request: Request): string {
  const origin = new URL(request.url).origin;
  if (origin === PRODUCTION_ORIGIN || origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    return origin;
  }
  return PRODUCTION_ORIGIN;
}

export async function GET(request: Request) {
  await signOut({ returnTo: allowedReturnOrigin(request) });
}
