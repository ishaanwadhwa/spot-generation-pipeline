/**
 * spotgen/poker/intent.ts
 *
 * PHASE 1.1: Enhanced with pair quality awareness.
 *
 * Hand intent classification now considers:
 * - Pair quality (top, second, bottom, etc.)
 * - Turn type (blank, dangerous)
 *
 * CRITICAL RULES:
 * - Bottom pair on non-blank turns = give_up (NOT thin_value)
 * - Underpair on dangerous turns = give_up
 * - This prevents "protection bet" hallucinations
 */

import type { HeroHandClass } from "./classify";
import type { HandFeatures } from "./handFeatures";
import type { SpotOutputLike } from "../validator";
import type { PairQuality } from "./pairQuality";
import type { TurnType } from "./turnClassify";

// PHASE 1.1: Added "give_up" intent for weak hands on dangerous boards
export type HandIntent = "made_value" | "thin_value" | "combo_draw" | "draw" | "pure_bluff" | "give_up";
export type NodeIntent = "value" | "pressure" | "semi_bluff" | "bluffcatch";

/**
 * Classify hand intent with pair quality and turn context.
 *
 * WHY THIS MATTERS:
 * - Q3 on 7-3-2-6 (bottom pair on straight completer) is NOT thin value
 * - It's give_up: checking with intent to fold to aggression
 * - "Protection betting" bottom pair is a strategic error
 *
 * PHASE 1.1 RULES:
 * - Bottom pair + non-blank turn = give_up
 * - Underpair + non-blank turn = give_up
 * - Thin value only applies to second pair or better
 */
export function classifyHandIntentWithContext(
  heroClass: HeroHandClass,
  feats: HandFeatures,
  pairQuality: PairQuality,
  turnType: TurnType
): HandIntent {
  // Strong hands are always made value
  if (heroClass === "monster" || heroClass === "strong_value") return "made_value";

  // Combo draws are semi-bluffs (flush + straight draw OR pair + draw)
  // FIX A: Pair + draw is combo equity, not weak
  if (feats.comboDraw || feats.hasPairPlusDraw) return "combo_draw";

  // PHASE 1.1: Bottom pair / underpair on dangerous turns = give_up
  // WHY: Bottom pair has minimal showdown value when board improves villain's range
  const dangerousTurns: TurnType[] = ["straight_completer", "paired_turn", "flush_completer", "overcard_turn"];
  const weakPairs: PairQuality[] = ["bottom_pair", "underpair"];

  if (weakPairs.includes(pairQuality) && dangerousTurns.includes(turnType)) {
    // Don't protection bet with bottom pair on scary boards
    // Check-fold is the correct strategy
    return "give_up";
  }

  // If we have a pair with extra draw equity, might be thin value
  if (feats.hasPair && (heroClass === "medium" || heroClass === "weak")) {
    // Only second pair or better qualifies for thin value
    if (pairQuality === "bottom_pair" || pairQuality === "underpair") {
      // Even on blank turns, bottom pair is marginal at best
      if (turnType === "blank_turn") {
        // Can consider thin value on truly blank boards
        return "thin_value";
      }
      return "give_up";
    }
    return "thin_value";
  }

  // Pure draws
  if (feats.hasFlushDraw || feats.straightDraw !== "none") return "draw";

  // Medium/weak without pair features
  if (heroClass === "medium" || heroClass === "weak") return "thin_value";

  return "pure_bluff";
}

/**
 * Legacy classify hand intent (backward compatible).
 * Use classifyHandIntentWithContext when pair quality is available.
 */
export function classifyHandIntent(heroClass: HeroHandClass, feats: HandFeatures): HandIntent {
  if (heroClass === "monster" || heroClass === "strong_value") return "made_value";
  if (feats.comboDraw) return "combo_draw";
  if (feats.hasPair && (heroClass === "medium" || heroClass === "weak")) return "thin_value";
  if (feats.hasFlushDraw || feats.straightDraw !== "none") return "draw";
  if (heroClass === "medium" || heroClass === "weak") return "thin_value";
  return "pure_bluff";
}

function betOptionSizes(spot: SpotOutputLike): number[] {
  const sizes: number[] = [];
  for (const o of spot.data.opts || []) {
    if (!Array.isArray(o)) continue;
    if (o[0] === "b" && typeof o[1] === "number") sizes.push(o[1]);
  }
  return sizes;
}

export function inferNodeIntent(spot: SpotOutputLike): NodeIntent {
  if (spot.data.str === "r") {
    const hasCall = (spot.data.opts || []).some((o) => Array.isArray(o) && o[0] === "c");
    if (hasCall) return "bluffcatch";
  }

  const concepts = spot.data.meta?.concept || [];
  if (concepts.includes("value-max")) return "value";
  if (concepts.includes("value-bet")) return "value";
  if (concepts.includes("protection-bet")) return "value";
  if (concepts.includes("trap")) return "value"; // Trapping is still a value play
  if (concepts.includes("slowplay")) return "value";
  if (concepts.includes("high-equity-combo-draw")) return "semi_bluff";
  if (concepts.includes("semi-bluff")) return "semi_bluff";
  if (concepts.includes("pot-control")) return "bluffcatch"; // Pot control = showdown value
  if (concepts.includes("showdown-value")) return "bluffcatch";

  // REMOVED: Legacy tag-based inference that caused mismatches
  // if (spot.tags?.includes("value")) return "value";

  const sizes = betOptionSizes(spot);
  const hasLarge = sizes.some((s) => s >= 75);
  const hasSmall = sizes.some((s) => s > 0 && s <= 50);

  if (hasLarge && !hasSmall) return "pressure";
  if (hasSmall && !hasLarge) return "semi_bluff";
  if (hasLarge && hasSmall) return "pressure";
  return "pressure";
}
