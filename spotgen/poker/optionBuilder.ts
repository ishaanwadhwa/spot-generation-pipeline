/**
 * poker/optionBuilder.ts
 *
 * PHASE 2: Option Construction & Difficulty Spacing
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MOTIVATION (Why This Design Exists)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The previous system incorrectly:
 * - Tied difficulty to which options existed
 * - Mixed betting permission, correctness, and difficulty
 * - Created endless edge-case tuning
 *
 * This phase enforces:
 * - Clear abstraction boundaries
 * - Poker-theoretic intent spacing
 * - Difficulty via SEPARABILITY, not complexity
 *
 * This aligns with how real poker trainers work.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY PRINCIPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. OPTIONS ARE NOT DIFFICULTY-DEPENDENT IN AVAILABILITY
 *    Every spot gets exactly 3 options. Period.
 *
 * 2. DIFFICULTY ONLY CONTROLS HOW FAR NON-OPTIMAL OPTIONS ARE FROM CORRECT
 *    Easy = clearly wrong alternatives. Hard = closely clustered intents.
 *
 * 3. THE "CORRECT" OPTION IS AN ANCHOR ACTION, NOT SOLVER TRUTH
 *    Anchor is determined by BettingContext (checkDominant, polarity).
 *    It's the strategic center, not the EV-maximizing action.
 *
 * 4. OPTIONS DIFFER BY INTENT DISTANCE, NOT ARBITRARY SIZING
 *    Intent ordering: check < small < large < overbet
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { BettingContext, Polarity } from "./bettingContext";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intent-based action reference (NOT a bet size)
 */
export type ActionIntent = "check" | "small" | "large" | "overbet";

/**
 * Difficulty level for option spacing
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Output of the option builder
 */
export interface OptionBuildResult {
  /** Always exactly 3 options */
  opts: ActionIntent[];
  /** Index of the anchor action (strategic center) */
  bestIdx: number;
  /** Reasoning trace for debugging */
  reasons: string[];
}

/**
 * Input to the option builder
 */
export interface OptionBuildInput {
  context: BettingContext;
  difficulty: DifficultyLevel | number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Canonical intent ordering (least aggressive to most aggressive)
 * This is the universal distance metric for options.
 */
const INTENT_ORDER: readonly ActionIntent[] = ["check", "small", "large", "overbet"] as const;

/**
 * Get the index of an intent in the canonical ordering
 */
function intentIndex(intent: ActionIntent): number {
  return INTENT_ORDER.indexOf(intent);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: INFER ANCHOR ACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine the strategic anchor action.
 *
 * This is NOT solver-best. This is the STRATEGIC CENTER.
 *
 * Rules (in priority order):
 * 1. If checkDominant BUT leverage is high/medium → betting can be anchor
 *    - This fixes OOP strong hands defaulting to check
 *    - TPTK, trips on turn should often bet, not check
 * 2. If checkDominant with low/no leverage → anchor = "check"
 * 3. If merged polarity → anchor = "small"
 * 4. If polarized polarity → anchor = "large"
 * 5. Fallback → "check"
 *
 * FIX 2: OOP strong hands (high/medium leverage) should consider betting.
 * checkDominant alone does NOT force check as anchor.
 */
export function inferAnchorAction(context: BettingContext): ActionIntent {
  if (context.checkDominant) {
    // FIX 2: Leverage override for checkDominant
    // Strong hands (high/medium leverage) should NOT default to check
    // even when OOP, unless no betting is allowed
    if (
      (context.leverage === "high" || context.leverage === "medium") &&
      context.allowsSmallBet
    ) {
      // Betting is the anchor even when checkDominant
      // Use polarity to determine sizing
      if (context.polarity === "polarized" && context.allowsLargeBet) {
        return "large";
      }
      return "small";
    }

    // Low/no leverage: check is correct anchor
    return "check";
  }

  if (context.polarity === "merged") {
    return "small";
  }

  if (context.polarity === "polarized") {
    return "large";
  }

  // Fallback (should never reach here with proper BettingContext)
  return "check";
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: BUILD INTENT UNIVERSE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the allowed action universe based on BettingContext.
 *
 * Always starts with "check", then appends allowed betting intents.
 * Result is always ordered: check < small < large < overbet
 */
export function buildIntentUniverse(context: BettingContext): ActionIntent[] {
  const universe: ActionIntent[] = ["check"];

  if (context.allowsSmallBet) {
    universe.push("small");
  }

  if (context.allowsLargeBet) {
    universe.push("large");
  }

  if (context.allowsOverbet) {
    universe.push("overbet");
  }

  return universe;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: SELECT OPTIONS BY DIFFICULTY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize difficulty to a level.
 */
function normalizeDifficulty(difficulty: DifficultyLevel | number): DifficultyLevel {
  if (typeof difficulty === "string") {
    return difficulty;
  }

  if (difficulty <= 3) return "easy";
  if (difficulty <= 6) return "medium";
  return "hard";
}

/**
 * Select 3 options based on difficulty and anchor.
 *
 * Difficulty mapping:
 * - EASY → options at distance ±2 from anchor (clearly wrong alternatives)
 * - MEDIUM → options at distance ±1 to ±2 from anchor (moderate confusion)
 * - HARD → options tightly clustered around anchor ±1 (hard to distinguish)
 *
 * If fewer than 3 unique options exist, duplicate closest intent to reach 3.
 */
export function selectOptionsByDifficulty(
  universe: ActionIntent[],
  anchor: ActionIntent,
  difficulty: DifficultyLevel,
  reasons: string[]
): ActionIntent[] {
  const anchorIdx = intentIndex(anchor);

  // If anchor is not in universe, use the closest allowed action
  const effectiveAnchor = universe.includes(anchor)
    ? anchor
    : findClosestInUniverse(anchor, universe);

  reasons.push(`Anchor: ${anchor} → effective anchor: ${effectiveAnchor}`);

  const effectiveAnchorIdx = intentIndex(effectiveAnchor);

  // Determine spacing based on difficulty
  let lessAggressiveDistance: number;
  let moreAggressiveDistance: number;

  switch (difficulty) {
    case "easy":
      // Wide spacing - clearly wrong alternatives
      lessAggressiveDistance = 2;
      moreAggressiveDistance = 2;
      reasons.push("Easy: wide spacing (±2 intent distance)");
      break;

    case "medium":
      // Moderate spacing
      lessAggressiveDistance = 1;
      moreAggressiveDistance = 2;
      reasons.push("Medium: moderate spacing (−1, +2 intent distance)");
      break;

    case "hard":
      // Tight clustering - hard to distinguish
      lessAggressiveDistance = 1;
      moreAggressiveDistance = 1;
      reasons.push("Hard: tight spacing (±1 intent distance)");
      break;
  }

  // Find the less aggressive option
  const lessAggressiveIdx = effectiveAnchorIdx - lessAggressiveDistance;
  const lessAggressive = findOptionAtIndex(lessAggressiveIdx, universe);

  // Find the more aggressive option
  const moreAggressiveIdx = effectiveAnchorIdx + moreAggressiveDistance;
  const moreAggressive = findOptionAtIndex(moreAggressiveIdx, universe);

  // Build initial options array
  let opts: ActionIntent[] = [lessAggressive, effectiveAnchor, moreAggressive];

  // Deduplicate and ensure exactly 3 options
  opts = ensureThreeUniqueOptions(opts, universe, effectiveAnchor, reasons);

  // Sort by intent order (least aggressive first)
  opts.sort((a, b) => intentIndex(a) - intentIndex(b));

  return opts;
}

/**
 * Find the closest intent in the universe to a target.
 */
function findClosestInUniverse(target: ActionIntent, universe: ActionIntent[]): ActionIntent {
  if (universe.length === 0) return "check";

  const targetIdx = intentIndex(target);
  let closest = universe[0];
  let minDistance = Math.abs(intentIndex(closest) - targetIdx);

  for (const intent of universe) {
    const distance = Math.abs(intentIndex(intent) - targetIdx);
    if (distance < minDistance) {
      closest = intent;
      minDistance = distance;
    }
  }

  return closest;
}

/**
 * Find an option at a given intent index, clamped to universe bounds.
 */
function findOptionAtIndex(idx: number, universe: ActionIntent[]): ActionIntent {
  // Clamp to valid intent range
  const clampedIdx = Math.max(0, Math.min(idx, INTENT_ORDER.length - 1));
  const targetIntent = INTENT_ORDER[clampedIdx];

  // If target is in universe, use it
  if (universe.includes(targetIntent)) {
    return targetIntent;
  }

  // Otherwise, find closest in universe
  return findClosestInUniverse(targetIntent, universe);
}

/**
 * Ensure exactly 3 unique options exist.
 * If duplicates exist, expand to nearby intents.
 *
 * CRITICAL: We NEVER duplicate options. If the universe is too small,
 * we expand to the full intent order to ensure distinct choices.
 */
function ensureThreeUniqueOptions(
  opts: ActionIntent[],
  universe: ActionIntent[],
  anchor: ActionIntent,
  reasons: string[]
): ActionIntent[] {
  const unique = [...new Set(opts)];

  if (unique.length >= 3) {
    return unique.slice(0, 3);
  }

  reasons.push(`Only ${unique.length} unique options, expanding...`);

  // Need to add more options from universe
  const needed = 3 - unique.length;
  const candidates = universe.filter((i) => !unique.includes(i));

  // Sort candidates by distance to anchor (prefer closer)
  const anchorIdx = intentIndex(anchor);
  candidates.sort((a, b) => {
    return Math.abs(intentIndex(a) - anchorIdx) - Math.abs(intentIndex(b) - anchorIdx);
  });

  for (let i = 0; i < needed && i < candidates.length; i++) {
    unique.push(candidates[i]);
  }

  // If still not enough (universe too small), expand to FULL intent order
  // This ensures we NEVER have duplicate options
  if (unique.length < 3) {
    reasons.push("Universe too small, expanding to full intent order");
    const fullOrder: ActionIntent[] = ["check", "small", "large", "overbet"];
    const expansionCandidates = fullOrder.filter((i) => !unique.includes(i));

    // Prefer smaller bets first (more realistic for constrained spots)
    for (let i = 0; unique.length < 3 && i < expansionCandidates.length; i++) {
      unique.push(expansionCandidates[i]);
      reasons.push(`Added ${expansionCandidates[i]} from full intent order`);
    }
  }

  return unique;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: BUILD OPTIONS FROM CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build exactly 3 options from a BettingContext.
 *
 * This is the main entry point for Phase 2.
 *
 * Returns:
 * - opts: Always exactly 3 action intents
 * - bestIdx: Index of the anchor action
 * - reasons: Trace for debugging
 */
export function buildOptionsFromContext(input: OptionBuildInput): OptionBuildResult {
  const { context, difficulty } = input;
  const reasons: string[] = [];

  // Step 1: Infer anchor action
  const anchor = inferAnchorAction(context);
  reasons.push(`Step 1: Anchor = ${anchor} (checkDominant=${context.checkDominant}, polarity=${context.polarity})`);

  // Step 2: Build intent universe
  const universe = buildIntentUniverse(context);
  reasons.push(`Step 2: Universe = [${universe.join(", ")}]`);

  // Step 3: Select options by difficulty
  const level = normalizeDifficulty(difficulty);
  const opts = selectOptionsByDifficulty(universe, anchor, level, reasons);
  reasons.push(`Step 3: Options = [${opts.join(", ")}] (difficulty=${level})`);

  // Step 4: Find bestIdx (anchor position in final opts)
  const effectiveAnchor = universe.includes(anchor)
    ? anchor
    : findClosestInUniverse(anchor, universe);
  const bestIdx = opts.indexOf(effectiveAnchor);
  reasons.push(`Step 4: bestIdx = ${bestIdx} (anchor=${effectiveAnchor})`);

  return {
    opts,
    bestIdx: bestIdx >= 0 ? bestIdx : 0,
    reasons,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: CONVERT ACTION INTENT TO SIZING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map action intent to concrete bet sizing (% of pot).
 * This is a separate concern from option building.
 */
export function intentToSizing(intent: ActionIntent): number | null {
  switch (intent) {
    case "check":
      return null;
    case "small":
      return 33;
    case "large":
      return 66;
    case "overbet":
      return 125;
  }
}

/**
 * Build the actual opts array for spot JSON.
 * This converts intents to concrete bet actions.
 */
export function buildSpotOpts(
  intents: ActionIntent[],
  pot: number
): Array<["x"] | ["b", number, number] | ["a", number]> {
  return intents.map((intent) => {
    if (intent === "check") {
      return ["x"] as ["x"];
    }

    const pct = intentToSizing(intent)!;
    const amount = Math.round((pot * pct) / 100 * 10000) / 10000;

    if (intent === "overbet") {
      // Could be all-in in some cases, but we use bet for consistency
      return ["b", pct, amount] as ["b", number, number];
    }

    return ["b", pct, amount] as ["b", number, number];
  });
}

