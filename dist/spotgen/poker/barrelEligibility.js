"use strict";
/**
 * spotgen/poker/barrelEligibility.ts
 *
 * Deterministic rules for whether a hand is eligible to barrel on the turn.
 * This prevents generating spots where hero barrels with weak/ineligible hands.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBarrelEligibility = checkBarrelEligibility;
exports.canBarrel = canBarrel;
exports.isEligibleForBarrelSpot = isEligibleForBarrelSpot;
const ranks_1 = require("./ranks");
/**
 * Determines if hero is allowed to barrel and at what sizing.
 *
 * Rules:
 * - Semi-bluff barrels require NFD, OESD, or true combo draw (not just weak gutshots)
 * - Value barrels require top pair+ or overpair
 * - Thin-value barrels require a pair that's ahead of the board (not underpair)
 * - Underpairs on overcard turns should not barrel
 * - Pure air with no draw should not barrel (check only)
 */
function checkBarrelEligibility(heroClass, feats, turnType, boardRanks) {
    // Default: can check, can't barrel
    const base = {
        canBarrelLarge: false,
        canBarrelSmall: false,
        canCheck: true,
        reason: "",
    };
    // --- MONSTERS / STRONG VALUE ---
    // These should value bet, not pressure. Small sizing preferred.
    if (heroClass === "monster" || heroClass === "strong_value") {
        return {
            canBarrelLarge: false, // Don't want to fold out everything
            canBarrelSmall: true, // Value sizing
            canCheck: true,
            reason: "Strong made hand: value bet with smaller sizing",
        };
    }
    // --- AIR WITH NO DRAW ---
    // Cannot barrel at all
    if (heroClass === "air" && !feats.hasFlushDraw && feats.straightDraw === "none") {
        return {
            canBarrelLarge: false,
            canBarrelSmall: false,
            canCheck: true,
            reason: "Air with no draw: cannot barrel",
        };
    }
    // --- UNDERPAIR ON OVERCARD TURN ---
    // If we have a pair that's now below the top of the board, don't barrel
    if (feats.hasPair && feats.pairRank && turnType === "overcard_turn") {
        const pairVal = (0, ranks_1.valueOfRank)(feats.pairRank);
        const topBoard = Math.max(...boardRanks);
        if (pairVal < topBoard) {
            return {
                canBarrelLarge: false,
                canBarrelSmall: false,
                canCheck: true,
                reason: "Underpair on overcard turn: check-only",
            };
        }
    }
    // --- WEAK PAIR (medium/weak class) without meaningful draw ---
    // These can small-barrel for protection, but not large barrel
    if ((heroClass === "medium" || heroClass === "weak") && feats.hasPair) {
        const hasGoodDraw = feats.isNutFlushDraw || feats.comboDraw || feats.straightDraw === "oesd";
        if (!hasGoodDraw) {
            // Can small barrel for protection/thin value, not large
            return {
                canBarrelLarge: false,
                canBarrelSmall: true,
                canCheck: true,
                reason: "Medium/weak pair: small sizing for protection",
            };
        }
        // If has good draw, can barrel larger
        return {
            canBarrelLarge: true,
            canBarrelSmall: true,
            canCheck: true,
            reason: "Medium pair with strong draw: can barrel",
        };
    }
    // --- HIGH EQUITY DRAWS (NFD, OESD, Combo) ---
    if (feats.isNutFlushDraw || feats.comboDraw) {
        return {
            canBarrelLarge: true,
            canBarrelSmall: true,
            canCheck: true,
            reason: "High equity draw (NFD/combo): can barrel any size",
        };
    }
    if (feats.hasFlushDraw && feats.straightDraw === "oesd") {
        // Non-nut combo draw
        return {
            canBarrelLarge: true,
            canBarrelSmall: true,
            canCheck: true,
            reason: "Combo draw: can barrel any size",
        };
    }
    if (feats.hasFlushDraw && !feats.isNutFlushDraw) {
        // Weak flush draw alone - small barrel ok, large questionable
        return {
            canBarrelLarge: false,
            canBarrelSmall: true,
            canCheck: true,
            reason: "Non-nut flush draw: prefer small sizing",
        };
    }
    if (feats.straightDraw === "oesd") {
        // OESD alone
        return {
            canBarrelLarge: true,
            canBarrelSmall: true,
            canCheck: true,
            reason: "OESD: can barrel",
        };
    }
    if (feats.straightDraw === "gutshot") {
        // Weak gutshot alone - only small barrel if we have something else
        if (feats.hasPair) {
            return {
                canBarrelLarge: false,
                canBarrelSmall: true,
                canCheck: true,
                reason: "Pair + gutshot: small barrel ok",
            };
        }
        // Pure gutshot with nothing - check only
        return {
            canBarrelLarge: false,
            canBarrelSmall: false,
            canCheck: true,
            reason: "Weak gutshot with no pair: check-only",
        };
    }
    // --- AIR WITH SOME DRAW ---
    // Note: by this point, if we have NFD or OESD we've already returned above.
    // This handles remaining air cases with weak draws (weak flush draw or gutshot already checked).
    if (heroClass === "air") {
        // If we have any draw at all (weak flush or we somehow got here with draw)
        if (feats.hasFlushDraw) {
            return {
                canBarrelLarge: false,
                canBarrelSmall: true,
                canCheck: true,
                reason: "Air with weak flush draw: small barrel only",
            };
        }
        // Pure air with no draw already handled at top
        return {
            canBarrelLarge: false,
            canBarrelSmall: false,
            canCheck: true,
            reason: "Air with no meaningful draw: check-only",
        };
    }
    // Default fallback: conservative
    return {
        canBarrelLarge: false,
        canBarrelSmall: false,
        canCheck: true,
        reason: "Default: check-only",
    };
}
/**
 * Quick check if hand can barrel at all (either size)
 */
function canBarrel(heroClass, feats, turnType, boardRanks) {
    const elig = checkBarrelEligibility(heroClass, feats, turnType, boardRanks);
    return elig.canBarrelLarge || elig.canBarrelSmall;
}
/**
 * Quick check if hand is eligible for generation in a barrel spot.
 * Returns false if the hand should be rejected and resampled.
 */
function isEligibleForBarrelSpot(heroClass, feats, turnType, boardRanks) {
    // For barrel spots, we need at least small barrel capability
    return canBarrel(heroClass, feats, turnType, boardRanks);
}
