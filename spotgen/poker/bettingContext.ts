/**
 * poker/bettingContext.ts
 *
 * PHASE 1: Betting Context Normalization
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module answers ONLY one question:
 * "What types of betting are structurally valid in this node?"
 *
 * It does NOT:
 * - Choose sizes
 * - Choose best action
 * - Care about pedagogy
 * - Care about frequencies
 *
 * It only defines what is ALLOWED and ENCOURAGED.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 1.5 UPDATE: Advantage Inference
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Range advantage and nut advantage are now DERIVED INTERNALLY.
 *
 * This was previously done in srp_universal.ts, but that violated the
 * principle that templates should not contain poker heuristics.
 *
 * The input now accepts:
 * - heroIsOpener: boolean
 * - heroClass: string (hand classification)
 * - handFeatures: { hasStraight, hasFlush }
 *
 * And internally computes:
 * - rangeAdvantage: hero | neutral | villain
 * - nutAdvantage: boolean
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Wheel straight on river, IP, high leverage:
 *    → allowsSmallBet: true, allowsLargeBet: true, allowsOverbet: true
 *    → polarity: "polarized" (nutAdvantage on river)
 *
 * 2. Medium pair on turn, OOP, low leverage:
 *    → allowsSmallBet: true, allowsLargeBet: false, allowsOverbet: false
 *    → checkDominant: true (OOP)
 *
 * 3. Air on flop, IP, no leverage:
 *    → allowsSmallBet: false, allowsLargeBet: false, allowsOverbet: false
 *    → checkDominant: true (no bets allowed)
 *
 * 4. Top pair on turn, IP, medium leverage, villain has range advantage:
 *    → allowsSmallBet: true, allowsLargeBet: false, allowsOverbet: false
 *    → checkDominant: true (range disadvantage)
 */

export type Street = "f" | "t" | "r";
export type Leverage = "none" | "low" | "medium" | "high";
export type RangeAdvantage = "hero" | "neutral" | "villain";
export type StackPressure = "low" | "medium" | "high";
export type Polarity = "merged" | "polarized";

/**
 * Villain Line Signal - What does villain's prior action tell us about their range?
 *
 * This is derived from the LINE PATTERN and affects hero's strategic decisions.
 *
 * - "passive": Villain showed weakness (check-through, no aggression)
 *              → Hero can bluff more, thin value works, expand aggression
 *
 * - "neutral": Standard line (IP c-betting is expected, doesn't narrow range much)
 *              → Play standard strategy
 *
 * - "aggressive": Villain showed strength (donk betting, barreling)
 *                 → Hero should be cautious, tighten value range, reduce bluffs
 */
export type VillainLineSignal = "passive" | "neutral" | "aggressive";

/**
 * BettingContext - The normalized betting context for a node.
 *
 * This is the single source of truth for what betting actions are structurally valid.
 */
export type BettingContext = {
  // Node identity
  street: Street;
  heroIsIP: boolean;

  // Structural forces
  leverage: Leverage;
  polarity: Polarity;
  rangeAdvantage: RangeAdvantage;
  nutAdvantage: boolean;
  stackPressure: StackPressure;

  // Strategic constraints (the outputs that matter)
  checkDominant: boolean;
  allowsSmallBet: boolean;
  allowsLargeBet: boolean;
  allowsOverbet: boolean;

  // Reasoning trace (for audit/debug only)
  reasons: string[];
};

/**
 * Hand features subset needed for advantage inference and betting permission
 */
export interface AdvantageFeatures {
  hasStraight: boolean;
  hasFlush: boolean;
  // FIX B: Added for combo equity detection
  hasPairPlusDraw?: boolean;
  comboDraw?: boolean;
}

/**
 * Hand class categories for showdown value inference
 */
const SHOWDOWN_VALUE_CLASSES = ["medium", "weak", "thin_value"];
const NUT_CLASSES = ["monster", "strong_value"];

/**
 * Input to computeBettingContext (NEW - derives advantages internally)
 */
export interface BettingContextInput {
  street: Street;
  heroIsIP: boolean;
  leverage: Leverage;
  effectiveStack: number;
  pot: number;

  // NEW: Raw inputs for advantage inference
  heroIsOpener: boolean;
  heroClass: string;  // e.g., "monster", "strong_value", "medium", etc.
  handFeatures: AdvantageFeatures;
}

/**
 * @deprecated Use BettingContextInput instead (with heroIsOpener, heroClass, handFeatures)
 * This interface is kept for backward compatibility only.
 */
export interface BettingContextInputLegacy {
  street: Street;
  heroIsIP: boolean;
  leverage: Leverage;
  rangeAdvantage: RangeAdvantage;
  nutAdvantage: boolean;
  effectiveStack: number;
  pot: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANTAGE INFERENCE (Poker Heuristics)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Infer range advantage based on position dynamics.
 *
 * Simple heuristic:
 * - Opener usually has range advantage on most boards
 * - IP opener has strongest advantage
 * - Defender OOP has disadvantage
 *
 * This is a simplification; true range advantage depends on board texture,
 * but that level of detail is beyond this module's scope.
 */
export function inferRangeAdvantage(heroIsOpener: boolean, heroIsIP: boolean): RangeAdvantage {
  // IP opener: strongest range
  if (heroIsOpener && heroIsIP) return "hero";

  // OOP opener: still has advantage (stronger preflop range)
  if (heroIsOpener) return "hero";

  // OOP defender: weakest range
  if (!heroIsOpener && !heroIsIP) return "villain";

  // IP defender: neutral (positional advantage offsets range disadvantage)
  return "neutral";
}

/**
 * Infer nut advantage based on hand class and features.
 *
 * Nut advantage means hero has a hand at the top of their range
 * that can credibly threaten to have the nuts.
 *
 * True if:
 * - Hero has a monster hand (sets, straights, flushes)
 * - Hero has completed a made hand (straight, flush)
 */
export function inferNutAdvantage(heroClass: string, feats: AdvantageFeatures): boolean {
  // Monster hands have nut advantage
  if (heroClass === "monster") return true;

  // Completed straights/flushes have nut advantage
  if (feats.hasStraight || feats.hasFlush) return true;

  return false;
}

/**
 * Compute stack pressure from effective stack and pot.
 *
 * - high: effectiveStack <= 1.2 * pot (commit-or-fold territory)
 * - medium: effectiveStack <= 2.5 * pot (standard postflop)
 * - low: otherwise (deep stacked, more maneuvering)
 */
export function computeStackPressure(effectiveStack: number, pot: number): StackPressure {
  if (pot <= 0) return "low";
  const spr = effectiveStack / pot;

  if (spr <= 1.2) return "high";
  if (spr <= 2.5) return "medium";
  return "low";
}

/**
 * Compute the normalized betting context for a node.
 *
 * This function applies deterministic poker rules to determine
 * what betting actions are structurally valid.
 *
 * All decisions push a human-readable string into reasons[].
 *
 * @param input - Betting context input (with raw advantage inputs)
 * @returns Normalized betting context
 */
export function computeBettingContext(input: BettingContextInput): BettingContext {
  const {
    street,
    heroIsIP,
    leverage,
    effectiveStack,
    pot,
    heroIsOpener,
    heroClass,
    handFeatures,
  } = input;

  // PHASE 1.5: Derive advantages internally (was in template before)
  const rangeAdvantage = inferRangeAdvantage(heroIsOpener, heroIsIP);
  const nutAdvantage = inferNutAdvantage(heroClass, handFeatures);

  const reasons: string[] = [];

  // Compute stack pressure
  const stackPressure = computeStackPressure(effectiveStack, pot);
  reasons.push(`Stack pressure: ${stackPressure} (SPR = ${pot > 0 ? (effectiveStack / pot).toFixed(2) : "∞"})`);

  // Initialize betting permissions (will be refined by rules)
  let checkDominant = false;
  let allowsSmallBet = false;
  let allowsLargeBet = false;
  let allowsOverbet = false;
  let polarity: Polarity = "merged";

  // ═══════════════════════════════════════════════════════════════════
  // RULE 1: Street Effects
  // ═══════════════════════════════════════════════════════════════════

  if (street === "f") {
    polarity = "merged";
    allowsOverbet = false;
    reasons.push("Flop: polarity = merged, overbets disabled");
  }

  if (street === "t") {
    polarity = leverage === "high" ? "polarized" : "merged";
    reasons.push(`Turn: polarity = ${polarity} (leverage = ${leverage})`);
  }

  if (street === "r") {
    polarity = nutAdvantage ? "polarized" : "merged";
    reasons.push(`River: polarity = ${polarity} (nutAdvantage = ${nutAdvantage})`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 2: Position Effects (FIX B - refined OOP handling)
  // ═══════════════════════════════════════════════════════════════════
  //
  // PREVIOUS BUG: OOP always set checkDominant = true
  // FIX: OOP can still bet when:
  //   - Hand has combo equity (pair + draw)
  //   - Hand has protection value (medium strength)
  //   - Leverage is medium or high
  //
  // checkDominant for OOP requires:
  //   - Weak showdown value (heroClass = weak/air)
  //   - Low/no leverage
  //   - No combo equity

  if (!heroIsIP) {
    allowsOverbet = false;
    
    const hasProtectionValue = heroClass === "medium" || heroClass === "strong_value";
    const hasComboEquity = handFeatures.hasPairPlusDraw || handFeatures.comboDraw;
    const hasLeverage = leverage === "medium" || leverage === "high";
    
    // OOP checkDominant only for truly weak hands without equity
    if (!hasProtectionValue && !hasComboEquity && !hasLeverage) {
      checkDominant = true;
      reasons.push("OOP + weak showdown + no combo equity: checkDominant = true");
    } else {
      // OOP but can still bet
      reasons.push(`OOP but betting allowed: protection=${hasProtectionValue}, combo=${hasComboEquity}, leverage=${leverage}`);
    }
    
    reasons.push("OOP: overbets disabled");
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 3: Leverage → Size Permissions
  // ═══════════════════════════════════════════════════════════════════

  switch (leverage) {
    case "none":
      allowsSmallBet = false;
      allowsLargeBet = false;
      allowsOverbet = false;
      reasons.push("Leverage = none: no bets allowed");
      break;

    case "low":
      allowsSmallBet = true;
      allowsLargeBet = false;
      allowsOverbet = false;
      reasons.push("Leverage = low: small bets only");
      break;

    case "medium":
      allowsSmallBet = true;
      allowsLargeBet = true;
      allowsOverbet = false;
      reasons.push("Leverage = medium: small + large bets");
      break;

    case "high":
      allowsSmallBet = true;
      allowsLargeBet = true;
      allowsOverbet = true;
      reasons.push("Leverage = high: small + large + overbets");
      break;
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 4: Nut Advantage Overrides (Critical)
  // ═══════════════════════════════════════════════════════════════════

  if (nutAdvantage && heroIsIP && street !== "f") {
    allowsLargeBet = true;
    reasons.push("Nut advantage IP postflop: large bets unlocked");

    if (street === "r") {
      allowsOverbet = true;
      reasons.push("Nut advantage IP on river: overbets unlocked");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 5: Stack Pressure Effects
  // ═══════════════════════════════════════════════════════════════════

  if (stackPressure === "high") {
    allowsLargeBet = true;
    reasons.push("High stack pressure: large bets unlocked");

    if (nutAdvantage) {
      allowsOverbet = true;
      reasons.push("High stack pressure + nut advantage: overbets unlocked");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 6: Range Disadvantage Lock
  // ═══════════════════════════════════════════════════════════════════

  if (rangeAdvantage === "villain") {
    allowsLargeBet = false;
    allowsOverbet = false;
    checkDominant = true;
    reasons.push("Range disadvantage: large bets + overbets disabled, checkDominant = true");
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 7: OOP + River + Showdown Value = Check Dominant (Issue 1 Fix)
  // ═══════════════════════════════════════════════════════════════════
  //
  // When OOP on river without nut advantage and hero has showdown value,
  // betting is structurally invalid. Check is the only reasonable action.
  //
  // WHY: On river, OOP, with medium/weak hands, betting accomplishes nothing:
  // - Better hands call/raise
  // - Worse hands fold
  // - No more cards to come for protection
  // - No fold equity against villain's value range
  //
  // This clamp prevents "fake polarization" where betting options exist
  // but are never actually correct.

  const hasShowdownValue = SHOWDOWN_VALUE_CLASSES.includes(heroClass);
  const hasNuts = NUT_CLASSES.includes(heroClass);

  if (street === "r" && !heroIsIP && !nutAdvantage && hasShowdownValue) {
    checkDominant = true;
    allowsSmallBet = false;
    allowsLargeBet = false;
    allowsOverbet = false;
    reasons.push(
      "OOP river clamp: hero has showdown value (not nuts) with no nut advantage → check dominant, all bets disabled"
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 8: OOP + Turn + Low Leverage + Showdown Value = Small Probe Only
  // ═══════════════════════════════════════════════════════════════════
  //
  // On turn OOP with low/none leverage and showdown value,
  // only small probing bets are allowed (if any).
  //
  // WHY: Medium hands OOP on turn can sometimes bet small for:
  // - Equity denial against draws
  // - Information gathering
  // But NOT medium/large bets which bloat the pot.
  //
  // Exception: If hero has equity denial opportunities (draws on board)
  // or blocker effects, a small bet may be allowed.

  if (street === "t" && !heroIsIP && hasShowdownValue && !hasNuts) {
    if (leverage === "none" || leverage === "low") {
      allowsLargeBet = false;
      allowsOverbet = false;
      // Keep allowsSmallBet only if there's SOME leverage (equity denial)
      if (leverage === "none") {
        allowsSmallBet = false;
        checkDominant = true;
        reasons.push(
          "OOP turn clamp: showdown value + no leverage → check dominant, no bets allowed"
        );
      } else {
        reasons.push(
          "OOP turn clamp: showdown value + low leverage → small probe only (equity denial)"
        );
      }
    } else if (leverage === "medium") {
      // Medium leverage OOP with showdown value: small bets only
      allowsLargeBet = false;
      allowsOverbet = false;
      reasons.push(
        "OOP turn clamp: showdown value + medium leverage → small/medium bets only, no large bets"
      );
    }
    // High leverage OOP with showdown value: unusual, but allow (rare combo draw + pair)
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 9: Final Sanity Clamp
  // ═══════════════════════════════════════════════════════════════════

  if (!allowsSmallBet && !allowsLargeBet) {
    checkDominant = true;
    reasons.push("No bets allowed: checkDominant = true");
  }

  // ═══════════════════════════════════════════════════════════════════
  // RULE 10: OOP Overbet Clamp (re-apply after all overrides)
  // ═══════════════════════════════════════════════════════════════════

  if (!heroIsIP && allowsOverbet) {
    allowsOverbet = false;
    reasons.push("OOP overbet clamp: overbets disabled (final)");
  }

  return {
    street,
    heroIsIP,
    leverage,
    polarity,
    rangeAdvantage,
    nutAdvantage,
    stackPressure,
    checkDominant,
    allowsSmallBet,
    allowsLargeBet,
    allowsOverbet,
    reasons,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT-STYLE EXAMPLES (for testing and verification)
// ═══════════════════════════════════════════════════════════════════════════

/*
EXAMPLE 1: Wheel straight on river, IP, high leverage
─────────────────────────────────────────────────────
Input:
  street: "r"
  heroIsIP: true
  leverage: "high"
  rangeAdvantage: "hero"
  nutAdvantage: true
  effectiveStack: 50
  pot: 30

Expected Output:
  polarity: "polarized"       (river + nutAdvantage)
  checkDominant: false        (IP)
  allowsSmallBet: true        (high leverage)
  allowsLargeBet: true        (high leverage + nutAdvantage)
  allowsOverbet: true         (high leverage + nutAdvantage + river)

─────────────────────────────────────────────────────

EXAMPLE 2: Medium pair on turn, OOP, low leverage
─────────────────────────────────────────────────────
Input:
  street: "t"
  heroIsIP: false
  leverage: "low"
  rangeAdvantage: "neutral"
  nutAdvantage: false
  effectiveStack: 80
  pot: 20

Expected Output:
  polarity: "merged"          (turn + leverage != high)
  checkDominant: true         (OOP)
  allowsSmallBet: true        (low leverage)
  allowsLargeBet: false       (low leverage)
  allowsOverbet: false        (OOP)

─────────────────────────────────────────────────────

EXAMPLE 3: Air on flop, IP, no leverage
─────────────────────────────────────────────────────
Input:
  street: "f"
  heroIsIP: true
  leverage: "none"
  rangeAdvantage: "neutral"
  nutAdvantage: false
  effectiveStack: 95
  pot: 10

Expected Output:
  polarity: "merged"          (flop always merged)
  checkDominant: true         (no bets allowed)
  allowsSmallBet: false       (no leverage)
  allowsLargeBet: false       (no leverage)
  allowsOverbet: false        (flop)

─────────────────────────────────────────────────────

EXAMPLE 4: Top pair, turn, IP, medium leverage, villain range advantage
─────────────────────────────────────────────────────
Input:
  street: "t"
  heroIsIP: true
  leverage: "medium"
  rangeAdvantage: "villain"
  nutAdvantage: false
  effectiveStack: 70
  pot: 25

Expected Output:
  polarity: "merged"          (turn + leverage != high)
  checkDominant: true         (range disadvantage)
  allowsSmallBet: true        (medium leverage)
  allowsLargeBet: false       (range disadvantage overrides)
  allowsOverbet: false        (range disadvantage)

─────────────────────────────────────────────────────

EXAMPLE 5: Set on turn, IP, high leverage, high stack pressure
─────────────────────────────────────────────────────
Input:
  street: "t"
  heroIsIP: true
  leverage: "high"
  rangeAdvantage: "hero"
  nutAdvantage: true
  effectiveStack: 25
  pot: 30

Expected Output:
  stackPressure: "high"       (SPR < 1.2)
  polarity: "polarized"       (turn + high leverage)
  checkDominant: false        (IP)
  allowsSmallBet: true        (high leverage)
  allowsLargeBet: true        (high leverage + stack pressure)
  allowsOverbet: true         (high leverage + nutAdvantage + stack pressure)
*/

