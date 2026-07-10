export interface SecretFinding {
  path: string;
  kind: string;
  preview: string;
}

const SECRET_KEY_NAMES = /(?:api[_-]?key|token|secret|password|authorization|session[_-]?cookie|bearer)/i;
const SECRET_VALUE_PATTERNS: Array<{ kind: string; re: RegExp }> = [
  { kind: "openai_key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { kind: "anthropic_key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { kind: "replicate_token", re: /\br8_[A-Za-z0-9_-]{20,}\b/g },
  { kind: "github_token", re: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { kind: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { kind: "bearer_token", re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/gi },
];

function previewSecret(value: string): string {
  const compact = value.replace(/\s+/g, " ");
  if (compact.length <= 10) return "***";
  return `${compact.slice(0, 4)}…${compact.slice(-4)}`;
}

function scanString(value: string, path: string, findings: SecretFinding[]): void {
  for (const { kind, re } of SECRET_VALUE_PATTERNS) {
    re.lastIndex = 0;
    for (const match of value.matchAll(re)) {
      findings.push({ path, kind, preview: previewSecret(match[0]) });
    }
  }
}

export function scanSecrets(value: unknown, path = "$"): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<unknown>();
  const visit = (node: unknown, p: string) => {
    if (node == null) return;
    if (typeof node === "string") {
      scanString(node, p, findings);
      return;
    }
    if (typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${p}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const childPath = `${p}.${key}`;
      if (SECRET_KEY_NAMES.test(key) && typeof child === "string" && child.length > 8) {
        findings.push({ path: childPath, kind: "sensitive_field", preview: previewSecret(child) });
      }
      visit(child, childPath);
    }
  };
  visit(value, path);
  return findings;
}

export function redactSecrets<T>(value: T): T {
  const seen = new WeakMap<object, unknown>();
  const redact = (node: unknown): unknown => {
    if (typeof node === "string") {
      let out = node;
      for (const { re } of SECRET_VALUE_PATTERNS) {
        re.lastIndex = 0;
        out = out.replace(re, "[REDACTED]");
      }
      return out;
    }
    if (node == null || typeof node !== "object") return node;
    if (seen.has(node)) return seen.get(node);
    if (Array.isArray(node)) {
      const arr: unknown[] = [];
      seen.set(node, arr);
      node.forEach((item) => arr.push(redact(item)));
      return arr;
    }
    const out: Record<string, unknown> = {};
    seen.set(node, out);
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      out[key] = SECRET_KEY_NAMES.test(key) && typeof child === "string" && child.length > 8
        ? "[REDACTED]"
        : redact(child);
    }
    return out;
  };
  return redact(value) as T;
}
