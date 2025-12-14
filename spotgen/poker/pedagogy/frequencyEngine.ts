/**
 * poker/pedagogy/frequencyEngine.ts
 *
 * PHASE 3: Frequency Assignment
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Assigns frequencies to each of the 3 options based on:
 * - Difficulty level (easy/medium/hard)
 * - bestIdx position
 * - Polarity (merged/polarized)
 * - Whether check is dominant
 *
 * NO SOLVER LOOKUPS.
 * NO BOARD LOGIC.
 * NO HAND INSPECTION.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DIFFICULTY PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * EASY:   Very obvious best option (70/20/10)
 *         User can easily identify the correct play.
 *
 * MEDIUM: Moderate clarity (50/30/20)
 *         Requires some thought but best is still clear.
 *
 * HARD:   Compressed frequencies (40/35/25)
 *         Options are close, requiring deep reasoning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { PedagogyInput, DifficultyLevel, FrequencySpread } from "./types";

/**
 * Base frequency spreads by difficulty.
 * These are pedagogical, not solver-derived.
 */
const FREQUENCY_SPREADS: Record<DifficultyLevel, FrequencySpread> = {
  easy: { best: 0.70, second: 0.20, worst: 0.10 },
  medium: { best: 0.50, second: 0.30, worst: 0.20 },
  hard: { best: 0.40, second: 0.35, worst: 0.25 },
};

/**
 * Assign frequencies to options.
 *
 * Rules:
 * - Sum MUST equal 1.0
 * - bestIdx always has highest frequency
 * - Difficulty controls spread
 * - checkDominant biases toward check
 * - Polarized contexts allow wider tails
 *
 * @param input - Pedagogy input (options, context, difficulty)
 * @returns Array of 3 frequencies summing to 1.0
 */
export function assignFrequencies(input: PedagogyInput): number[] {
  const { options, bettingContext, difficulty } = input;
  const { opts, bestIdx } = options;
  const numOptions = opts.length;

  // Always expect exactly 3 options
  if (numOptions !== 3) {
    throw new Error(`Frequency engine expects 3 options, got ${numOptions}`);
  }

  // Get base spread for difficulty
  const spread = { ...FREQUENCY_SPREADS[difficulty] };

  // ADJUSTMENT 1: Check-dominant contexts
  // If checkDominant and check is in options, boost check frequency
  if (bettingContext.checkDominant) {
    const checkIdx = opts.indexOf("check");
    if (checkIdx !== -1 && checkIdx === bestIdx) {
      // Increase check dominance
      spread.best = Math.min(spread.best + 0.10, 0.80);
      spread.second = Math.max(spread.second - 0.05, 0.10);
      spread.worst = Math.max(spread.worst - 0.05, 0.05);
    }
  }

  // ADJUSTMENT 2: Polarized contexts
  // Polarized play has more "extreme" frequencies (bigger gaps)
  if (bettingContext.polarity === "polarized" && difficulty !== "hard") {
    spread.best = Math.min(spread.best + 0.05, 0.75);
    spread.worst = Math.max(spread.worst - 0.05, 0.05);
    // Rebalance second
    spread.second = 1.0 - spread.best - spread.worst;
  }

  // Build frequency array
  const freq: number[] = [0, 0, 0];

  // Assign best frequency to bestIdx
  freq[bestIdx] = spread.best;

  // Determine remaining indices
  const remainingIndices = [0, 1, 2].filter((i) => i !== bestIdx);

  // Assign second and worst based on distance from bestIdx
  // The option closer to bestIdx gets second frequency
  const [idx1, idx2] = remainingIndices;
  const dist1 = Math.abs(idx1 - bestIdx);
  const dist2 = Math.abs(idx2 - bestIdx);

  if (dist1 <= dist2) {
    freq[idx1] = spread.second;
    freq[idx2] = spread.worst;
  } else {
    freq[idx1] = spread.worst;
    freq[idx2] = spread.second;
  }

  // Normalize to ensure sum = 1.0 (handle floating point)
  const sum = freq.reduce((a, b) => a + b, 0);
  return freq.map((f) => Math.round((f / sum) * 100) / 100);
}

/**
 * Get the raw spread for a difficulty level.
 * Exposed for testing.
 */
export function getSpreadForDifficulty(difficulty: DifficultyLevel): FrequencySpread {
  return { ...FREQUENCY_SPREADS[difficulty] };
}

