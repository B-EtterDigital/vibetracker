// Minimal dependency-free table renderer for CLI output.

export function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells: string[]) =>
    cells.map((c, i) => (c ?? "").padEnd(widths[i])).join("  ").trimEnd();
  const sep = widths.map((w) => "─".repeat(w)).join("  ");
  return [line(headers), sep, ...rows.map(line)].join("\n");
}

export function money(n: number | undefined): string {
  return n == null ? "—" : `$${n.toFixed(2)}`;
}
