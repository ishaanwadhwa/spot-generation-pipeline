"use strict";
/**
 * spotgen/poker/leverage.ts
 *
 * Leverage Profile Classification
 *
 * This module determines how much "pressure capability" a hand has,
 * independent of showdown strength. Leverage is about the ability to
 * apply pressure and extract value, not just hand strength.
 *
 * KEY INSIGHT:
 * A wheel straight (A2345) has HIGH leverage even though it's the
 * bottom of the straight range. It's the nuts and can apply maximum pressure.
 *
 * LEVERAGE VS HERO CLASS:
 * - HeroClass = showdown strength (monster, strong_value, etc.)
 * - Leverage = pressure capability (can we bet big profitably?)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BET_SIZE_SETS = void 0;
exports.getSizeSet = getSizeSet;
exports.isValidLeverageMode = isValidLeverageMode;
exports.inferNodeIntentFromMode = inferNodeIntentFromMode;
exports.computeLeverageProfile = computeLeverageProfile;
exports.hasStrongBlockers = hasStrongBlockers;
exports.computeSPR = computeSPR;
exports.inferBettingMode = inferBettingMode;
exports.shouldBeAllIn = shouldBeAllIn;
const ranks_1 = require("./ranks");
/**
 * BET SIZE SETS
 *
 * Maps (leverage, mode) to available bet sizes.
 * Each option represents a different strategic intent, not just a different number.
 *
 * IMPORTANT: Invalid combinations MUST fail, not fallback.
 * This ensures poker logic is explicitly defined.
 */
exports.BET_SIZE_SETS = {
    low: {
        standard: [25, 33],
        // overbet: NOT ALLOWED for low leverage - would be strategically incorrect
    },
    medium: {
        standard: [33, 50],
        // overbet: NOT ALLOWED for medium leverage - not polarized enough
    },
    high: {
        standard: [50, 75],
        overbet: [100, 125],
    },
};
/**
 * Get size set for leverage/mode combination.
 * Returns null if the combination is invalid (no fallback allowed).
 */
function getSizeSet(leverage, mode) {
    const set = exports.BET_SIZE_SETS[leverage]?.[mode];
    return set ?? null; // NO FALLBACK - invalid combinations must fail
}
/**
 * Check if a leverage/mode combination is valid.
 */
function isValidLeverageMode(leverage, mode) {
    return exports.BET_SIZE_SETS[leverage]?.[mode] !== undefined;
}
function inferNodeIntentFromMode(mode, leverage, handIntent) {
    // Overbet mode = pressure (range collapse)
    if (mode === "overbet") {
        return "pressure";
    }
    // Standard mode - depends on hand intent
    if (handIntent === "combo_draw" || handIntent === "draw") {
        return "semi_bluff";
    }
    // Default to value for made hands
    return "value";
}
/**
 * Check if hero has the nut straight.
 * Returns true if hero's straight is the best possible straight on this board.
 */
function hasNutStraight(hero, board) {
    const allCards = [...hero, ...board];
    const allValues = new Set(allCards.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    // Check if we even have a straight
    const hasStraight = checkHasStraight(allValues);
    if (!hasStraight)
        return false;
    // Find the highest straight we have
    const ourHighest = getHighestStraightTop(allValues);
    if (ourHighest === 0)
        return false;
    // Check if a higher straight is possible on this board
    // Board values only
    const boardValues = new Set(board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    // For each possible straight (6-high to A-high), check if it's possible
    // A higher straight is possible if the board contains 3+ of its cards
    for (let top = 14; top > ourHighest; top--) {
        const straightCards = getStraightCards(top);
        const boardContains = straightCards.filter(v => boardValues.has(v)).length;
        // If board has 3+ cards of a higher straight, villain could have it
        if (boardContains >= 3) {
            return false; // Not the nuts
        }
    }
    return true; // We have the highest possible straight
}
function checkHasStraight(values) {
    // Check wheel (A-2-3-4-5)
    if (values.has(14) && values.has(2) && values.has(3) && values.has(4) && values.has(5)) {
        return true;
    }
    // Check regular straights
    for (let top = 14; top >= 6; top--) {
        let has = true;
        for (let i = 0; i < 5; i++) {
            if (!values.has(top - i)) {
                has = false;
                break;
            }
        }
        if (has)
            return true;
    }
    return false;
}
function getHighestStraightTop(values) {
    // Check from highest to lowest
    for (let top = 14; top >= 6; top--) {
        let has = true;
        for (let i = 0; i < 5; i++) {
            if (!values.has(top - i)) {
                has = false;
                break;
            }
        }
        if (has)
            return top;
    }
    // Check wheel
    if (values.has(14) && values.has(2) && values.has(3) && values.has(4) && values.has(5)) {
        return 5; // Wheel is 5-high
    }
    return 0;
}
function getStraightCards(top) {
    if (top === 5) {
        // Wheel
        return [14, 2, 3, 4, 5];
    }
    return [top, top - 1, top - 2, top - 3, top - 4];
}
/**
 * Check if hero has the nut flush.
 */
function hasNutFlush(hero, board) {
    const allCards = [...hero, ...board];
    // Find if we have a flush
    const suitCounts = new Map();
    for (const c of allCards) {
        const s = (0, ranks_1.suitOf)(c);
        if (!suitCounts.has(s))
            suitCounts.set(s, []);
        suitCounts.get(s).push(c);
    }
    for (const [suit, cards] of suitCounts.entries()) {
        if (cards.length >= 5) {
            // We have a flush in this suit
            // Check if hero has the ace of this suit
            const heroSuitCards = hero.filter(c => (0, ranks_1.suitOf)(c) === suit);
            const heroHasAce = heroSuitCards.some(c => (0, ranks_1.rankOf)(c) === "A");
            if (heroHasAce) {
                return true; // Nut flush
            }
            // Check if ace is on board (then hero needs King)
            const boardHasAce = board.some(c => (0, ranks_1.suitOf)(c) === suit && (0, ranks_1.rankOf)(c) === "A");
            if (boardHasAce) {
                const heroHasKing = heroSuitCards.some(c => (0, ranks_1.rankOf)(c) === "K");
                if (heroHasKing)
                    return true;
            }
        }
    }
    return false;
}
/**
 * Check if this is a dynamic board (many draws possible).
 */
function isDynamicBoard(board) {
    const values = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const suits = board.map(ranks_1.suitOf);
    // Flush draw possible (3+ of same suit)
    const suitCounts = new Map();
    for (const s of suits) {
        suitCounts.set(s, (suitCounts.get(s) || 0) + 1);
    }
    const hasFlushDraw = Array.from(suitCounts.values()).some(c => c >= 3);
    // Straight draw possible (connected cards)
    const sortedValues = [...new Set(values)].sort((a, b) => a - b);
    let maxConnected = 1;
    let current = 1;
    for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] - sortedValues[i - 1] <= 2) {
            current++;
            maxConnected = Math.max(maxConnected, current);
        }
        else {
            current = 1;
        }
    }
    const hasStraightDraw = maxConnected >= 3;
    return hasFlushDraw || hasStraightDraw;
}
/**
 * Compute the leverage profile for a hand.
 *
 * LEVERAGE is about PRESSURE CAPABILITY, not showdown strength:
 * - HIGH: Can bet big profitably (nuts, strong draws on dynamic boards)
 * - MEDIUM: Can bet medium (vulnerable value, non-nut made hands)
 * - LOW: Should bet small or check (thin value, pot control)
 *
 * WHY THIS MATTERS:
 * A wheel straight (A-2-3-4-5) is heroClass "monster" but that doesn't
 * tell us it should be betting 75% pot. Leverage tells us it CAN.
 *
 * PAIR DEPTH AWARENESS:
 * Bottom pair and second-bottom pair ALWAYS get LOW leverage.
 * This prevents protection-bet hallucinations on weak holdings.
 */
function computeLeverageProfile(args) {
    const { heroClass, handIntent, turnType, feats, board, hero, pairQuality } = args;
    // === PAIR DEPTH OVERRIDE (checked FIRST) ===
    // Bottom pair and weak pairs MUST get low leverage
    // This is non-negotiable poker logic - prevents large sizes on weak holdings
    if (pairQuality) {
        if (pairQuality === "bottom_pair" || pairQuality === "underpair") {
            return "low";
        }
        // Second pair on non-blank turns is also low leverage
        if (pairQuality === "second_pair" && turnType !== "blank_turn") {
            return "low";
        }
        // Medium class with weak pair quality = low
        if (heroClass === "medium" && (pairQuality === "bottom_pair" || pairQuality === "middle_pair")) {
            return "low";
        }
    }
    // === HIGH LEVERAGE ===
    // Nut hands that can apply maximum pressure
    // 1. Nut straight (including wheel)
    if (hasNutStraight(hero, board)) {
        return "high";
    }
    // 2. Wheel straight specifically (even if not "nut" in some edge cases)
    if (feats.hasStraight && feats.isWheelStraight) {
        return "high";
    }
    // 3. Nut flush
    if (hasNutFlush(hero, board)) {
        return "high";
    }
    // 4. Combo draw on dynamic turn (high equity + fold equity)
    if (feats.comboDraw && isDynamicBoard(board)) {
        return "high";
    }
    // 5. Nut flush draw (semi-bluff leverage)
    if (feats.isNutFlushDraw && turnType !== "flush_completer") {
        return "high";
    }
    // 6. Set+ on dynamic board (can deny equity aggressively)
    if (heroClass === "monster" && isDynamicBoard(board)) {
        return "high";
    }
    // === MEDIUM LEVERAGE ===
    // Strong but not nutty - can bet but shouldn't overbet
    // 7. Non-nut flush (vulnerable to higher flush)
    if (feats.hasFlushDraw && feats.isNutFlushDraw === false && heroClass === "monster") {
        return "medium";
    }
    // 8. Two pair / top pair strong kicker (vulnerable to better)
    if (heroClass === "strong_value") {
        return "medium";
    }
    // 9. Strong draw without nut potential
    if (handIntent === "combo_draw" && !feats.isNutFlushDraw) {
        return "medium";
    }
    // 10. OESD alone (good semi-bluff but not nutty)
    if (feats.straightDraw === "oesd" && !feats.hasFlushDraw) {
        return "medium";
    }
    // 11. Monster on static board (less need for protection)
    if (heroClass === "monster" && !isDynamicBoard(board)) {
        return "medium";
    }
    // === LOW LEVERAGE ===
    // Pot control, thin value, or check-call spots
    // 12. Thin value hands
    if (handIntent === "thin_value") {
        return "low";
    }
    // 13. Medium/weak pairs without draws
    if ((heroClass === "medium" || heroClass === "weak") && !feats.hasFlushDraw && feats.straightDraw === "none") {
        return "low";
    }
    // 14. Weak draws (gutshot only)
    if (feats.straightDraw === "gutshot" && !feats.hasFlushDraw && !feats.hasPair) {
        return "low";
    }
    // 15. Give up hands (shouldn't reach here, but safety)
    if (handIntent === "give_up") {
        return "low";
    }
    // Default to medium for anything unclassified
    return "medium";
}
/**
 * Check if hero has strong blockers (for polarized bluffs).
 *
 * Strong blockers block the nuts or near-nuts:
 * - Ace blocker on low boards (blocks sets of aces, straights)
 * - Top card blocker (blocks top pair, top set)
 * - Straight blockers on connected boards
 */
function hasStrongBlockers(hero, board) {
    const heroRanks = hero.map(c => (0, ranks_1.rankOf)(c));
    const heroValues = hero.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const boardValues = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const topBoard = Math.max(...boardValues);
    // Ace blocker on low board (top card < J)
    if (topBoard <= 11 && heroRanks.includes("A")) {
        return true;
    }
    // Top card blocker (blocks top set / top pair)
    if (heroValues.includes(topBoard)) {
        return true;
    }
    // High card blockers (K, Q on medium boards)
    if (topBoard <= 10 && (heroRanks.includes("K") || heroRanks.includes("Q"))) {
        return true;
    }
    return false;
}
/**
 * Compute SPR (Stack-to-Pot Ratio).
 *
 * SPR determines how "deep" we are:
 * - SPR < 1.5: Commit or fold situations
 * - SPR 2-4: Standard postflop play
 * - SPR > 5: Very deep, more maneuvering room
 */
function computeSPR(effectiveStack, pot) {
    if (pot <= 0)
        return Infinity;
    return effectiveStack / pot;
}
/**
 * Infer the betting mode (standard vs overbet).
 *
 * OVERBET MODE REQUIREMENTS (all must be true):
 * 1. leverage === "high" (opponent's range is capped)
 * 2. heroClass === "monster" OR (handIntent === "pure_bluff" && hasStrongBlockers) OR wheel straight
 * 3. turnType === "blank_turn" OR "paired_turn" OR (straight_completer with made straight)
 * 4. SPR >= 2.5 (overbet actually applies pressure)
 *
 * WHEEL STRAIGHTS:
 * Wheel straights on low boards get overbet mode because:
 * - Villain's range is heavily capped
 * - Hero has leverage asymmetry (nut advantage)
 * - Solvers overbet these spots consistently
 */
function inferBettingMode(args) {
    const { leverage, heroClass, handIntent, turnType, hero, board, effectiveStack, pot, feats } = args;
    // Must be high leverage
    if (leverage !== "high") {
        return "standard";
    }
    // Check for wheel straight (special case - always overbet eligible)
    const isWheelStraight = feats?.isWheelStraight ?? false;
    const hasMadeStraight = feats?.hasStraight ?? false;
    // Must have polarized hand
    const isPolarizedValue = heroClass === "monster";
    const isPolarizedBluff = handIntent === "pure_bluff" && hasStrongBlockers(hero, board);
    const isPolarized = isPolarizedValue || isPolarizedBluff || isWheelStraight;
    if (!isPolarized) {
        return "standard";
    }
    // Turn type requirements (relaxed for made straights)
    const validTurnForOverbet = turnType === "blank_turn" ||
        turnType === "paired_turn" ||
        (hasMadeStraight && turnType === "straight_completer"); // Straights can overbet on completers
    if (!validTurnForOverbet) {
        return "standard";
    }
    // Must have sufficient SPR
    const spr = computeSPR(effectiveStack, pot);
    if (spr < 2.5) {
        return "standard";
    }
    // All conditions met - overbet mode allowed
    return "overbet";
}
/**
 * Check if a bet should become an all-in.
 *
 * ALL-IN is a stack resolution event, not a bet size.
 *
 * Rules:
 * - If bet >= 80% of remaining stack → all-in
 * - If SPR <= 1.2 → all-in replaces largest bet
 */
function shouldBeAllIn(betAmount, remainingStack, pot) {
    // If bet is >= 80% of remaining stack, just shove
    if (betAmount >= remainingStack * 0.8) {
        return true;
    }
    // If SPR is very low, all-in makes sense
    const spr = computeSPR(remainingStack, pot);
    if (spr <= 1.2) {
        return true;
    }
    return false;
}
