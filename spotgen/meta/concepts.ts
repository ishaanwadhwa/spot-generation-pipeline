export type Concept =
  | "range-advantage"
  | "equity-denial"
  | "barrel-geometry"
  | "high-equity-combo-draw"
  | "protection-bet"
  | "value-max"
  | "bet-sizing"
  | "blockers";

export const CONCEPT_WHITELIST: Set<string> = new Set<string>([
  "range-advantage",
  "equity-denial",
  "barrel-geometry",
  "high-equity-combo-draw",
  "protection-bet",
  "value-max",
  "bet-sizing",
  "blockers",
]);

export function filterConcepts(xs: string[]): string[] {
  return xs.filter((x) => CONCEPT_WHITELIST.has(x));
}


