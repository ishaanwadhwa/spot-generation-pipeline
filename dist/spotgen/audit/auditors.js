"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleBasedAuditor = void 0;
const barrelEligibility_1 = require("../poker/barrelEligibility");
const ranks_1 = require("../poker/ranks");
function isEmptyConstraints(c) {
    return Object.keys(c).length === 0;
}
function mergeConstraints(base, next) {
    const out = { ...base, ...next };
    if (base.avoidHeroClasses || next.avoidHeroClasses) {
        out.avoidHeroClasses = Array.from(new Set([...(base.avoidHeroClasses || []), ...(next.avoidHeroClasses || [])]));
    }
    return out;
}
/**
 * Rule-based auditor (no network, deterministic).
 *
 * Uses barrel eligibility rules to catch:
 * - Ineligible hands being placed into barrel spots
 * - Size mismatches (large barrel with thin value)
 * - Intent mismatches (pressure with made hands)
 */
class RuleBasedAuditor {
    merge(base, next) {
        return mergeConstraints(base, next);
    }
    audit(packet) {
        const s = packet.spot;
        const heroClass = packet.features.heroClass;
        const turnType = packet.features.turnType;
        const hand = packet.features.hand;
        const handIntent = packet.features.handIntent;
        if (!hand) {
            // No hand features available, can't audit properly
            return {};
        }
        // Get board ranks for eligibility check
        const board = s.data.brd;
        const boardRanks = board.map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
        // Check barrel eligibility
        const eligibility = (0, barrelEligibility_1.checkBarrelEligibility)(heroClass, hand, turnType, boardRanks);
        // Get offered bet sizes
        const hasBigBarrelOpts = s.data.opts.some((o) => Array.isArray(o) && o[0] === "b" && (o[1] === 75 || o[1] === 100));
        const hasSmallBarrelOpts = s.data.opts.some((o) => Array.isArray(o) && o[0] === "b" && (o[1] === 33 || o[1] === 50));
        // Rule 1: If offering large barrels but hand can't barrel large
        if (hasBigBarrelOpts && !eligibility.canBarrelLarge) {
            return {
                avoidHeroClasses: [heroClass],
                intent: "value", // Force smaller sizings
            };
        }
        // Rule 2: If offering any barrels but hand can't barrel at all
        if ((hasBigBarrelOpts || hasSmallBarrelOpts) && !eligibility.canBarrelSmall && !eligibility.canBarrelLarge) {
            return {
                avoidHeroClasses: [heroClass, "air"],
                requireTurnType: "blank_turn",
            };
        }
        // Rule 3: Monster hands shouldn't be in pressure/barrel spots
        if (heroClass === "monster" && s.tags.includes("barrel")) {
            return { intent: "value" };
        }
        // Rule 4: Air with no draw should not be in any barrel spot
        if (heroClass === "air" && !hand.hasFlushDraw && hand.straightDraw === "none") {
            return { avoidHeroClasses: ["air"] };
        }
        // Rule 5: Underpair on overcard turn should not barrel
        if (hand.hasPair && hand.pairRank && turnType === "overcard_turn") {
            const pairVal = (0, ranks_1.valueOfRank)(hand.pairRank);
            const topBoard = Math.max(...boardRanks);
            if (pairVal < topBoard && (hasBigBarrelOpts || hasSmallBarrelOpts)) {
                return { avoidHeroClasses: [heroClass, "weak"] };
            }
        }
        // Rule 6: Thin value with large sizings is wrong
        if (handIntent === "thin_value" && hasBigBarrelOpts) {
            return { intent: "value" };
        }
        // Rule 7: Check meta consistency
        const concepts = s.data.meta?.concept || [];
        // "equity-denial" shouldn't be used with air hands that have no draw
        if (concepts.includes("equity-denial") && heroClass === "air" && !hand.hasFlushDraw && hand.straightDraw === "none") {
            // This is a meta error - the spot should be regenerated with a different hand
            return { avoidHeroClasses: ["air"] };
        }
        // "value-max" shouldn't be used with draws
        if (concepts.includes("value-max") && (handIntent === "draw" || handIntent === "combo_draw")) {
            return { avoidHeroClasses: ["air"], intent: "pressure" };
        }
        // All checks passed
        return {};
    }
}
exports.RuleBasedAuditor = RuleBasedAuditor;
