/**
 * spotgen/difficulty.ts
 *
 * Deterministic difficulty rubric (user-approved):
 * - 1–3: single obvious action, 2 options
 * - 4–6: 3 options with a clear best
 * - 7–8: polarized nodes / blockers / close EVs
 * - 9–10: river big-bet bluffcatch, multiway, weird runouts
 *
 * This is intentionally heuristic; it should be stable and extensible.
 */

export interface DifficultyFeatures {
  street: "p" | "f" | "t" | "r";
  optionsCount: number;
  isMultiway: boolean;
  isRiverBigBetBluffcatch: boolean;
  isPolarizedNode: boolean;
  isCloseEV: boolean;
}

export function scoreDifficulty(f: DifficultyFeatures): number {
  // Baseline by option count and street
  let d = 1;
  if (f.optionsCount <= 2) d = 2;
  else if (f.optionsCount === 3) d = 5;
  else d = 6;

  if (f.street === "t") d += 1;
  if (f.street === "r") d += 2;

  if (f.isPolarizedNode) d += 2;
  if (f.isCloseEV) d += 1;
  if (f.isMultiway) d = Math.max(d, 9);
  if (f.isRiverBigBetBluffcatch) d = Math.max(d, 9);

  if (d < 1) d = 1;
  if (d > 10) d = 10;
  return d;
}


