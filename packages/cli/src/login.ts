// Device-authorization login (RFC 8628 style), reused for C0VIBE/WorkOS auth: the CLI
// starts a device request, opens the browser to the site where the user (already WorkOS-
// authenticated) approves, then polls until a CLI token is issued. Reliable over SSH — no
// localhost callback. The pure flow takes injected transport/open/sleep so it's unit-testable.

export interface DeviceStart {
  device_code: string;   // secret, CLI-held
  user_code: string;     // short, shown to the human
  verify_url: string;    // e.g. https://vibeusage.c0vibe.app/cli-login
  interval?: number;     // poll seconds
  expires_in?: number;
}
export interface DevicePoll { status: "pending" | "approved" | "denied"; access_token?: string }

export interface AuthTransport {
  start(): Promise<DeviceStart>;
  poll(deviceCode: string): Promise<DevicePoll>;
}

export interface LoginDeps {
  open: (url: string) => void;
  sleep: (ms: number) => Promise<void>;
  log: (msg: string) => void;
  maxAttempts?: number;
}

export async function runLogin(t: AuthTransport, deps: LoginDeps): Promise<string> {
  const s = await t.start();
  const url = `${s.verify_url}?code=${encodeURIComponent(s.user_code)}`;
  deps.log(`\nAuthorize this device (opening your browser):\n  ${url}\nConfirm the code shown: ${s.user_code}\n`);
  deps.open(url);

  const interval = Math.max(1, s.interval ?? 3);
  const max = deps.maxAttempts ?? 100;
  for (let i = 0; i < max; i++) {
    await deps.sleep(interval * 1000);
    const p = await t.poll(s.device_code);
    if (p.status === "approved" && p.access_token) return p.access_token;
    if (p.status === "denied") throw new Error("authorization was denied");
  }
  throw new Error("login timed out — run `vibetracker login` again");
}

export function createHttpAuthTransport(site: string): AuthTransport {
  return {
    async start() {
      const res = await fetch(`${site}/api/cli/start`, { method: "POST" });
      if (!res.ok) throw new Error(`login start ${res.status}: ${await res.text()}`);
      return (await res.json()) as DeviceStart;
    },
    async poll(deviceCode) {
      const res = await fetch(`${site}/api/cli/poll`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device_code: deviceCode }),
      });
      if (!res.ok) throw new Error(`login poll ${res.status}: ${await res.text()}`);
      return (await res.json()) as DevicePoll;
    },
  };
}
