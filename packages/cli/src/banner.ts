// NERD ART — zero-dep animated truecolor splash + wizard animation helpers.
// Reimplements the good ideas from chalk-animation / cli-spinners / cfonts by hand so the
// package keeps ZERO dependencies. TTY-only (pipes/CI stay clean). Honors NO_COLOR and
// VT_NO_ANIM (reduced motion). Palette is deliberately GREEN→CYAN→BLUE + GOLD — no purples.

const ESC = "\x1b";
const PLAIN = !!process.env.NO_COLOR;
const REDUCE = PLAIN || !!process.env.VT_NO_ANIM;
const sgr = (s: string): string => (PLAIN ? "" : `${ESC}[${s}`);
const RESET = sgr("0m"), DIM = sgr("2m"), BOLD = sgr("1m");
const HIDE = PLAIN ? "" : `${ESC}[?25l`, SHOW = PLAIN ? "" : `${ESC}[?25h`;
const up = (n: number): string => (PLAIN ? "" : `${ESC}[${n}A`);
const clr = PLAIN ? "" : `${ESC}[K`;
const rgb = (r: number, g: number, b: number): string => sgr(`38;2;${r};${g};${b}m`);

// HSL→RGB (fixed neon s/l).
function hsl(h: number): string {
  const s = 0.9, l = 0.6;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return rgb(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}
// Ping-pong hue over 150..212 (green→cyan→blue). Never enters purple/magenta.
function gradHue(t: number): number {
  const lo = 150, hi = 212, span = hi - lo, period = span * 2;
  let x = t % period; if (x < 0) x += period;
  return lo + (x <= span ? x : period - x);
}
const GOLD = rgb(255, 198, 64);
const WHITE = rgb(255, 255, 255);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ANSI-Shadow letters (6 rows, fixed width) — joined in code so alignment can't drift.
const L: Record<string, string[]> = {
  V: ["██╗   ██╗", "██║   ██║", "██║   ██║", "╚██╗ ██╔╝", " ╚████╔╝ ", "  ╚═══╝  "],
  I: ["██╗", "██║", "██║", "██║", "██║", "╚═╝"],
  B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
  E: ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
  U: ["██╗   ██╗", "██║   ██║", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  S: ["███████╗", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚══════╝"],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  G: [" ██████╗ ", "██╔════╝ ", "██║  ███╗", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  W: ["██╗    ██╗", "██║    ██║", "██║ █╗ ██║", "██║███╗██║", "╚███╔███╔╝", " ╚══╝╚══╝ "],
  L: ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"],
  C: [" ██████╗", "██╔════╝", "██║     ", "██║     ", "╚██████╗", " ╚═════╝"],
  O: [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  M: ["███╗   ███╗", "████╗ ████║", "██╔████╔██║", "██║╚██╔╝██║", "██║ ╚═╝ ██║", "╚═╝     ╚═╝"],
  R: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
};
const word = (s: string): string[] => [0, 1, 2, 3, 4, 5].map((r) => s.split("").map((ch) => L[ch][r]).join(""));
const VIBE = word("VIBE"), USAGE = word("USAGE");

// paint a block-logo, char-by-char, with a diagonal gradient (col+row+shift).
function paintDiag(lines: string[], shift: number): string {
  return lines.map((ln, row) => {
    let s = "  " + BOLD;
    let col = 0;
    for (const ch of ln) { s += ch === " " ? " " : `${hsl(gradHue(col * 2 + row * 5 + shift))}${ch}`; col++; }
    return s + RESET;
  }).join("\n");
}
const NOISE = "░▒▓█▚▞▙▟▛▜╱╲";
const noiseAt = (c: number, r: number, f: number): string => NOISE[(c * 7 + r * 13 + f * 29) % NOISE.length];

export async function showBanner(): Promise<void> {
  const out = process.stdout;
  if (!out.isTTY) return;
  const cols = out.columns ?? 80;
  const logo = cols >= 74 ? VIBE.map((v, i) => `${v}  ${USAGE[i]}`) : [...VIBE, "", ...USAGE];
  const n = logo.length;
  out.write(HIDE);
  try {
    if (!REDUCE) await bootSequence(out);
    if (REDUCE) { out.write("\n" + paintDiag(logo, 0) + "\n"); }
    else {
      out.write("\n");
      // 1) matrix "decode" — noise resolves into the logo
      for (let f = 0; f <= 6; f++) {
        const painted = logo.map((ln, row) => {
          let s = "  " + BOLD, col = 0;
          for (const ch of ln) {
            if (ch === " ") { s += " "; col++; continue; }
            const locked = ((col * 7 + row * 13) % 6) <= f - 1;
            s += `${hsl(gradHue(col * 2 + row * 5 + f * 6))}${locked ? ch : noiseAt(col, row, f)}`; col++;
          }
          return s + RESET;
        }).join("\n");
        if (f > 0) out.write(up(n));
        out.write(painted + "\n");
        await sleep(55);
      }
      // 2) flowing diagonal color wave
      for (let f = 1; f <= 9; f++) { out.write(up(n)); out.write(paintDiag(logo, f * 7) + "\n"); await sleep(52); }
      // 3) white glint sweeps across
      const width = Math.max(...logo.map((l) => l.length));
      for (let p = -2; p < width + 6; p += 3) {
        out.write(up(n));
        out.write(logo.map((ln, row) => {
          let s = "  " + BOLD, col = 0;
          for (const ch of ln) {
            if (ch === " ") { s += " "; col++; continue; }
            const d = Math.abs(col - (p - row));
            s += `${d < 2 ? WHITE : hsl(gradHue(col * 2 + row * 5))}${ch}`; col++;
          }
          return s + RESET;
        }).join("\n") + "\n");
        await sleep(24);
      }
      out.write(up(n)); out.write(paintDiag(logo, 0) + "\n");
    }

    // brand line — neon flicker, no purple, with Better Digital LLC
    const brand = "BY C0VIBE";
    const co = "BETTER DIGITAL LLC";
    if (!REDUCE) {
      for (let f = 0; f < 5; f++) {
        const bright = f % 2 === 0;
        out.write(`\r  ${hsl(gradHue(0))}◤◢${RESET} ${BOLD}${bright ? hsl(gradHue(20)) : DIM}${brand}${RESET} ${DIM}·${RESET} ${bright ? GOLD : DIM}${BOLD}${co}${RESET} ${hsl(gradHue(0))}◥◣${RESET}${clr}`);
        await sleep(85);
      }
      out.write("\n");
    } else {
      out.write(`  ◤◢ ${brand} · ${co} ◥◣\n`);
    }

    // gradient underline
    let uline = "  ";
    for (let i = 0; i < 44; i++) uline += `${hsl(gradHue(i * 3))}▔`;
    out.write(uline + RESET + "\n");

    // taglines
    out.write(`  ${DIM}track every AI you burn — ${RESET}${hsl(150)}coding ${hsl(165)}· image ${hsl(180)}· video ${hsl(195)}· music ${hsl(205)}· audio ${GOLD}· 3d${RESET}\n`);
    out.write(`  ${hsl(160)}◇${RESET} ${BOLD}71 services${RESET} ${DIM}·${RESET} ${hsl(180)}zero dependencies${RESET} ${DIM}·${RESET} 100% local-first ${DIM}·${RESET} ${GOLD}open source (MIT)${RESET}\n\n`);
  } finally {
    out.write(SHOW);
  }
}

function sparkles(shift: number): string {
  const marks = ["✦", "✧", "⋆", "·"];
  let s = "  ";
  for (let i = 0; i < 24; i++) s += `${hsl(gradHue(i * 4 + shift * 6))}${marks[(i + shift) % marks.length]} `;
  return s + RESET;
}

// Big finale after setup — "WELCOME VIBER" with a color wave + sparkles.
export async function showWelcome(subtitle: string): Promise<void> {
  const out = process.stdout;
  if (!out.isTTY) { console.log(`Welcome, Viber! ${subtitle}`); return; }
  const lines = [...word("WELCOME"), "", ...word("VIBER")];
  const n = lines.length;
  out.write(HIDE);
  try {
    out.write("\n" + sparkles(0) + "\n\n");
    out.write(paintDiag(lines, 0) + "\n");
    if (!REDUCE) for (let f = 1; f <= 10; f++) { out.write(up(n)); out.write(paintDiag(lines, f * 8) + "\n"); await sleep(46); }
    out.write("\n" + sparkles(2) + "\n");
    out.write(`\n  ${GOLD}✦${RESET} ${BOLD}${hsl(gradHue(18))}${subtitle}${RESET} ${GOLD}✦${RESET}\n\n`);
  } finally {
    out.write(SHOW);
  }
}

async function bootSequence(out: NodeJS.WriteStream): Promise<void> {
  const mods = ["telemetry cortex", "adapter registry", "ledger index", "trust boundary"];
  for (const m of mods) {
    out.write(`  ${DIM}◦ loading ${m}…${RESET}`);
    await sleep(90);
    out.write(`\r  ${hsl(gradHue(20))}◉${RESET} ${DIM}${m}${RESET} ${hsl(150)}ready${RESET}${clr}\n`);
  }
  const W = 30;
  for (let i = 0; i <= W; i++) {
    let bar = "";
    for (let j = 0; j < W; j++) bar += j < i ? `${hsl(gradHue(j * 4))}█` : `${DIM}░`;
    out.write(`\r  ${bar}${RESET} ${DIM}${String(Math.round((i / W) * 100)).padStart(3)}%${RESET}`);
    await sleep(11);
  }
  out.write(`\r${clr}`);
}

// ---- reusable animations ----
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export async function withSpinner<T>(label: string, task: () => Promise<T>): Promise<T> {
  const out = process.stdout;
  if (!out.isTTY || REDUCE) return task();
  let i = 0;
  out.write(HIDE);
  const timer = setInterval(() => {
    out.write(`\r  ${hsl(gradHue(i * 6))}${SPIN[i % SPIN.length]}${RESET} ${DIM}${label}…${RESET}${clr}`);
    i++;
  }, 75);
  try {
    return await task();
  } finally {
    clearInterval(timer);
    out.write(`\r${clr}${SHOW}`);
  }
}

export async function typeLine(text: string, color = hsl(gradHue(0)), delay = 10): Promise<void> {
  const out = process.stdout;
  if (!out.isTTY || REDUCE) { console.log(text); return; }
  out.write("  " + color);
  for (const ch of text) { out.write(ch); await sleep(delay); }
  out.write(`${RESET}\n`);
}

export function rule(label = ""): string {
  const dashN = Math.max(6, 50 - label.length);
  let line = "";
  for (let i = 0; i < dashN; i++) line += `${hsl(gradHue(i * 4))}─`;
  const chip = label ? `${hsl(gradHue(0))}⟨${RESET} ${BOLD}${hsl(gradHue(24))}${label}${RESET} ${hsl(gradHue(44))}⟩${RESET} ` : "";
  return `  ${chip}${line}${RESET}`;
}

// ---- provider marks (crisp geometric Unicode, hashed → stable glyph + hue; no emoji) ----
const GLYPHS = ["◈", "⬡", "❖", "✦", "⟡", "◆", "⬢", "◍", "⌗", "⯁", "⏣", "▰", "◇", "⧫", "⟢", "⎔"];
function h32(s: string): number { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export function icon(id: string, _category?: string): string {
  const h = h32(id);
  return `${hsl(gradHue(h % 62))}${GLYPHS[h % GLYPHS.length]}${RESET}`;
}

// sparkline-style magnitude bar (gradient, no purple).
export function bar(n: number, max = 18): string {
  if (n <= 0) return `${DIM}·${RESET}`;
  const w = Math.min(max, Math.max(1, Math.round(Math.log10(n + 1) * 4)));
  let s = "";
  for (let i = 0; i < w; i++) s += `${hsl(gradHue(i * 3))}▇`;
  return s + RESET;
}

export function human(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}K`;
  return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)}M`;
}

export const dim = (s: string): string => `${DIM}${s}${RESET}`;
export const paint = (s: string, hue: number): string => `${hsl(hue)}${s}${RESET}`;
export const gold = (s: string): string => `${GOLD}${s}${RESET}`;
export const ok = (s: string): string => `${hsl(150)}${s}${RESET}`;
export const bad = (s: string): string => `${rgb(248, 113, 113)}${s}${RESET}`;
