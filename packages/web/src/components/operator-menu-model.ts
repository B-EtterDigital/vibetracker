export type OperatorLane = "read" | "operate" | "system";

export interface OperatorRoute {
  index: string;
  href: string;
  label: string;
  description: string;
  lane: OperatorLane;
}

export const OPERATOR_ROUTES: readonly OperatorRoute[] = [
  { index: "01", href: "/u/demo", label: "Profile", description: "usage, disciplines, models, rhythm", lane: "read" },
  { index: "02", href: "/life", label: "AI Life", description: "your whole AI practice", lane: "read" },
  { index: "03", href: "/compare", label: "Compare lab", description: "two public receipts on one scope", lane: "read" },
  { index: "04", href: "/score", label: "Score lab", description: "how the signal score is built", lane: "read" },
  { index: "05", href: "/proof", label: "Proof center", description: "what is verified vs self-reported", lane: "read" },
  { index: "06", href: "/scan", label: "Scan", description: "run a local usage scan", lane: "operate" },
  { index: "07", href: "/wizard", label: "Wizard", description: "set up tracking step by step", lane: "operate" },
  { index: "08", href: "/sources", label: "Source atlas", description: "every source lane, mapped", lane: "operate" },
  { index: "09", href: "/motion", label: "Motion lab", description: "the ASCII motion references", lane: "system" },
  { index: "10", href: "/contributors", label: "Contributors", description: "open-source credit", lane: "system" },
  { index: "11", href: "/passkeys", label: "Passkeys", description: "local browser key boundary", lane: "system" },
  { index: "12", href: "/roadmap", label: "Roadmap", description: "what ships next", lane: "system" },
  { index: "13", href: "/account", label: "Identity", description: "GitHub proof and account link", lane: "system" },
] as const;

export function filterOperatorRoutes(query: string): OperatorRoute[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...OPERATOR_ROUTES];

  return OPERATOR_ROUTES.filter((route) => {
    const searchable = `${route.label} ${route.description} ${route.lane}`.toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function operatorRouteIsActive(pathname: string, href: string): boolean {
  if (href === "/u/demo") return pathname.startsWith("/u/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
