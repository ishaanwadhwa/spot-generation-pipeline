/**
 * poker/pedagogy/evEngine.ts
 *
 * PHASE 3: EV Computation
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Computes EVs for each of the 3 options.
 *
 * CRITICAL: These EVs are PEDAGOGICAL, not predictive.
 * They exist to reinforce the teaching, not to claim solver accuracy.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN PRINCIPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. bestIdx ALWAYS has highest EV
 * 2. Difficulty controls EV compression:
 *    - easy: large gaps (clear best)
 *    - hard: near-equal EVs (decision is close)
 * 3. Absolute values don't matter — only ordering and spacing
 * 4. Deterministic: same inputs → same outputs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { DifficultyLevel, EVSpread } from "./types";

/**
 * EV spread configuration by difficulty.
 *
 * - best: EV for the best option
 * - gap: EV difference between adjacent options
 */
const EV_SPREADS: Record<DifficultyLevel, EVSpread> = {
  easy: { best: 2.4, gap: 0.5 },
  medium: { best: 2.2, gap: 0.3 },
  hard: { best: 2.0, gap: 0.15 },
};

/**
 * Compute EVs for 3 options.
 *
 * Rules:
 * - bestIdx always highest EV
 * - Difficulty controls compression
 * - EV decreases with distance from bestIdx
 * - Deterministic only
 *
 * @param bestIdx - Index of the best option (0, 1, or 2)
 * @param difficulty - Difficulty level
 * @param numOptions - Number of options (always 3)
 * @returns Array of EVs
 */
export function computeEVs(
  bestIdx: number,
  difficulty: DifficultyLevel,
  numOptions: number = 3
): number[] {
  if (numOptions !== 3) {
    throw new Error(`EV engine expects 3 options, got ${numOptions}`);
  }

  const spread = EV_SPREADS[difficulty];
  const ev: number[] = [];

  for (let i = 0; i < numOptions; i++) {
    const distance = Math.abs(i - bestIdx);
    const value = spread.best - distance * spread.gap;
    ev.push(Math.round(value * 10) / 10);
  }

  return ev;
}

/**
 * Get the raw EV spread for a difficulty level.
 * Exposed for testing.
 */
export function getEVSpreadForDifficulty(difficulty: DifficultyLevel): EVSpread {
  return { ...EV_SPREADS[difficulty] };
}

/**
 * Verify EV array has correct properties.
 * Exposed for testing.
 */
export function validateEVs(ev: number[], bestIdx: number): boolean {
  if (ev.length !== 3) return false;

  // Best must be highest
  const maxEV = Math.max(...ev);
  if (ev[bestIdx] !== maxEV) return false;

  // All EVs must be positive
  if (ev.some((e) => e <= 0)) return false;

  return true;
}

