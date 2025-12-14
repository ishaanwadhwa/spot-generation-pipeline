/**
 * poker/pedagogy/index.ts
 *
 * PHASE 3: Pedagogy Layer - Main Export
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE 3-PHASE PIPELINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 1: BettingContext
 *   → Answers: "What betting is ALLOWED?"
 *   → Produces: checkDominant, allowsSmallBet, allowsLargeBet, etc.
 *
 * Phase 2: OptionBuilder
 *   → Answers: "Which 3 options to show?"
 *   → Produces: opts[], bestIdx
 *
 * Phase 3: Pedagogy (THIS FILE)
 *   → Answers: "How to TEACH this spot?"
 *   → Produces: freq[], ev[], meta
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3 GUARANTEES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ✅ ALWAYS deterministic (same inputs → same outputs)
 * ✅ NEVER changes opts or bestIdx
 * ✅ NEVER inspects board cards or hand
 * ✅ NEVER uses randomness
 * ✅ NEVER claims solver authority
 *
 * ❌ NO solver lookups
 * ❌ NO board texture analysis
 * ❌ NO villain speculation
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { PedagogyInput, PedagogyOutput } from "./types";
import { assignFrequencies } from "./frequencyEngine";
import { computeEVs } from "./evEngine";
import { selectMeta, filterConcepts, type AnchorAction } from "./metaSelector";

// Re-export types
export type {
  PedagogyInput,
  PedagogyOutput,
  PedagogyMeta,
  DifficultyLevel,
  Street,
  FrequencySpread,
  EVSpread,
} from "./types";

// Re-export sub-modules for testing
export { assignFrequencies, getSpreadForDifficulty } from "./frequencyEngine";
export { computeEVs, getEVSpreadForDifficulty, validateEVs } from "./evEngine";
export { selectMeta, filterConcepts, ALLOWED_CONCEPTS } from "./metaSelector";

/**
 * Run the complete pedagogy phase.
 *
 * This is the main entry point for Phase 3.
 *
 * @param input - Pedagogy input (options, context, intent, street, difficulty)
 * @returns Pedagogy output (freq, ev, meta)
 *
 * @example
 * ```typescript
 * const pedagogyResult = runPedagogyPhase({
 *   options: { opts: ["check", "small", "large"], bestIdx: 1 },
 *   bettingContext: ctx,
 *   handIntent: "thin_value",
 *   street: "t",
 *   difficulty: "medium",
 * });
 *
 * // Result:
 * // {
 * //   freq: [0.30, 0.50, 0.20],
 * //   ev: [1.9, 2.2, 1.9],
 * //   meta: { summary: "...", solverNotes: [...], concepts: [...] }
 * // }
 * ```
 */
export function runPedagogyPhase(input: PedagogyInput): PedagogyOutput {
  const { options, bettingContext, handIntent, street, difficulty } = input;
  const { opts, bestIdx } = options;
  const numOptions = opts.length;

  // Validate input
  if (numOptions !== 3) {
    throw new Error(`Pedagogy phase expects 3 options, got ${numOptions}`);
  }

  // Step 1: Assign frequencies
  const freq = assignFrequencies(input);

  // Step 2: Compute EVs
  const ev = computeEVs(bestIdx, difficulty, numOptions);

  // Step 3: Derive anchor from options (the best action intent)
  // This affects meta selection - "check" means trap/slowplay, "small"/"large" means betting
  const anchor: AnchorAction = opts[bestIdx] as AnchorAction;

  // Step 4: Select meta with anchor context
  const rawMeta = selectMeta(handIntent, bettingContext, street, anchor);

  // Step 5: Concept Gating (Fix A)
  //
  // Rule: If checkDominant + OOP + turn/river + NOT strong hand:
  //   - DISALLOW: trap, slowplay, polar-bet, range-polarization
  //   - FORCE: pot-control, showdown-value, or bluffcatcher
  //
  // WHY: "Trap/slowplay" requires nut advantage. Medium hands with
  // checkDominant are NOT trapping — they're pot-controlling.
  //
  const isCheckDominantOOPNode = (
    bettingContext.checkDominant &&
    !bettingContext.heroIsIP &&
    (street === "t" || street === "r")
  );
  const isStrongHand = (handIntent === "made_value");

  let gatedConcepts = filterConcepts(rawMeta.concepts);

  if (isCheckDominantOOPNode && !isStrongHand) {
    // Remove trap/slowplay concepts (these require nut advantage)
    const disallowed = ["trap", "slowplay", "polar-bet", "range-polarization"];
    gatedConcepts = gatedConcepts.filter(c => !disallowed.includes(c));

    // Ensure at least one valid concept exists
    const validOOPConcepts = ["pot-control", "showdown-value", "bluffcatcher"];
    const hasValidConcept = gatedConcepts.some(c => validOOPConcepts.includes(c));

    if (!hasValidConcept) {
      // Force pot-control as default for check-dominant OOP nodes
      gatedConcepts = ["pot-control", "showdown-value"];
    }
  }

  const meta = {
    ...rawMeta,
    concepts: gatedConcepts,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX 3: Phase 2 ↔ Phase 3 Consistency Invariant
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // RULE: If pedagogy summary says "betting often preferred" or similar,
  //       bestIdx must NOT be check.
  //
  // If bestIdx = check, pedagogy must justify why betting is inferior.
  //
  // Auto-correct: If anchor is "check" but summary suggests betting,
  // replace summary with check-appropriate language.
  //
  const summaryPrefersBetting = (
    meta.summary.toLowerCase().includes("betting is often preferred") ||
    meta.summary.toLowerCase().includes("betting for value") ||
    meta.summary.toLowerCase().includes("bet for value") ||
    meta.summary.toLowerCase().includes("should usually bet")
  );

  if (anchor === "check" && summaryPrefersBetting) {
    // Auto-correct: Replace with check-appropriate language
    meta.summary = `With this hand strength on the ${street === "r" ? "river" : street === "t" ? "turn" : "flop"}, checking is often correct to control the pot and realize showdown value. Avoid bloating the pot against a range that can have better.`;
    meta.solverNotes = [
      "Checking controls pot size with marginal hands.",
      "Villain's range may contain many better hands.",
      "Showdown value is preserved by checking.",
      "Betting risks getting raised or called by stronger hands.",
    ];
  }

  return { freq, ev, meta };
}

/**
 * Validate pedagogy output.
 * Exposed for testing.
 */
export function validatePedagogyOutput(
  output: PedagogyOutput,
  bestIdx: number
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate frequencies
  if (output.freq.length !== 3) {
    errors.push(`Expected 3 frequencies, got ${output.freq.length}`);
  }
  const freqSum = output.freq.reduce((a, b) => a + b, 0);
  if (Math.abs(freqSum - 1.0) > 0.01) {
    errors.push(`Frequencies must sum to 1.0, got ${freqSum}`);
  }
  if (output.freq.some((f) => f < 0)) {
    errors.push("Frequencies must be non-negative");
  }

  // Validate EVs
  if (output.ev.length !== 3) {
    errors.push(`Expected 3 EVs, got ${output.ev.length}`);
  }
  const maxEV = Math.max(...output.ev);
  if (output.ev[bestIdx] !== maxEV) {
    errors.push(`bestIdx (${bestIdx}) must have highest EV`);
  }

  // Validate meta
  if (!output.meta.summary || output.meta.summary.length === 0) {
    errors.push("Meta summary is required");
  }
  if (!output.meta.solverNotes || output.meta.solverNotes.length === 0) {
    errors.push("Meta solverNotes is required");
  }

  return { ok: errors.length === 0, errors };
}

