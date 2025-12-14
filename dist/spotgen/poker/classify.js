"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyHeroHandOnBoard = classifyHeroHandOnBoard;
exports.getPairQuality = getPairQuality;
const ranks_1 = require("./ranks");
const pairQuality_1 = require("./pairQuality");
function countRanks(cards) {
    const m = new Map();
    for (const c of cards)
        m.set((0, ranks_1.rankOf)(c), (m.get((0, ranks_1.rankOf)(c)) || 0) + 1);
    return m;
}
function hasFlushMade(hero, board) {
    const suits = new Map();
    for (const c of [...hero, ...board])
        suits.set((0, ranks_1.suitOf)(c), (suits.get((0, ranks_1.suitOf)(c)) || 0) + 1);
    for (const n of suits.values())
        if (n >= 5)
            return true;
    return false;
}
function hasStraightMade(hero, board) {
    const allRanks = new Set([...hero, ...board].map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    // Check for wheel
    if (allRanks.has(14) && allRanks.has(2) && allRanks.has(3) && allRanks.has(4) && allRanks.has(5))
        return true;
    // Check for regular straights
    for (let hi = 14; hi >= 6; hi--) {
        let ok = true;
        for (let x = hi; x > hi - 5; x--)
            if (!allRanks.has(x))
                ok = false;
        if (ok)
            return true;
    }
    return false;
}
/**
 * Classify hero's hand strength on the board.
 *
 * PHASE 1.1: Now includes pair quality awareness.
 *
 * CRITICAL RULES:
 * - Bottom pair on dangerous turns (straight_completer, paired_turn) → WEAK
 * - Bottom pair on blank_turn → MEDIUM (can protect)
 * - Bottom pair should NEVER be strong_value or thin_value
 *
 * WHY BOTTOM PAIR IS NOT THIN VALUE:
 * - On straight completers: villain has many straights, two pairs
 * - On paired turns: villain has trips, boats
 * - "Protection betting" with bottom pair is a strategic error
 *
 * @param hero - Hero's two hole cards
 * @param board - The board cards
 * @param turnType - Optional turn type for context-aware classification
 */
function classifyHeroHandOnBoard(hero, board, turnType) {
    const heroRanks = [(0, ranks_1.rankOf)(hero[0]), (0, ranks_1.rankOf)(hero[1])];
    const boardRanks = board.map(ranks_1.rankOf);
    const allRanks = countRanks([...hero, ...board]);
    const boardRankCounts = countRanks(board);
    const heroPair = heroRanks[0] === heroRanks[1];
    const pairRank = heroPair ? heroRanks[0] : null;
    // Get pair quality for later constraints
    const pairQuality = (0, pairQuality_1.classifyPairQuality)(hero, board);
    // --- MADE HANDS (flush, straight) ---
    if (hasFlushMade(hero, board))
        return "monster";
    if (hasStraightMade(hero, board))
        return "monster";
    // --- QUADS ---
    for (const [, count] of allRanks.entries()) {
        if (count === 4)
            return "monster";
    }
    // --- FULL HOUSE ---
    const tripsRanks = Array.from(allRanks.entries()).filter(([, n]) => n >= 3).map(([r]) => r);
    const pairRanks = Array.from(allRanks.entries()).filter(([, n]) => n >= 2).map(([r]) => r);
    if (tripsRanks.length >= 1 && pairRanks.length >= 2) {
        return "monster";
    }
    // --- TRIPS / SET ---
    if (tripsRanks.length >= 1) {
        const tripRank = tripsRanks[0];
        const heroContributes = heroRanks.includes(tripRank);
        if (heroContributes) {
            return "monster";
        }
    }
    // --- TWO PAIR ---
    if (pairRanks.length >= 2) {
        const boardPairs = Array.from(boardRankCounts.entries()).filter(([, n]) => n >= 2).map(([r]) => r);
        const heroPairsBoard = heroRanks.filter((r) => boardRanks.includes(r));
        // Vulnerable two pair: board pair + hero's one pair
        if (boardPairs.length >= 1 && heroPairsBoard.length === 1) {
            // PHASE 1.1: Apply pair quality constraints for two pair
            // Bottom pair + board pair on dangerous turn = weak
            if (pairQuality === "bottom_pair" && turnType) {
                if (turnType === "straight_completer" || turnType === "paired_turn" || turnType === "flush_completer") {
                    return "weak";
                }
            }
            return "medium";
        }
        // Hero pairs BOTH their cards to the board
        if (heroPairsBoard.length === 2 && heroRanks[0] !== heroRanks[1]) {
            return "strong_value";
        }
        // Pocket pair + board pair
        if (heroPair && boardPairs.length >= 1 && !boardPairs.includes(pairRank)) {
            const heroVal = (0, ranks_1.valueOfRank)(pairRank);
            const topBoard = Math.max(...boardRanks.map(ranks_1.valueOfRank));
            if (heroVal > topBoard) {
                return "strong_value";
            }
            return "medium";
        }
        return "strong_value";
    }
    // --- ONE PAIR ---
    const heroPairRanksOnBoard = heroRanks.filter((r) => boardRanks.includes(r));
    if (heroPairRanksOnBoard.length >= 1) {
        const topBoard = Math.max(...boardRanks.map(ranks_1.valueOfRank));
        const heroPairVal = Math.max(...heroPairRanksOnBoard.map(ranks_1.valueOfRank));
        // PHASE 1.1: Apply pair quality hard constraints
        // Bottom pair should NEVER be strong_value
        if (pairQuality === "bottom_pair") {
            // Bottom pair on dangerous turns = weak
            if (turnType && (turnType === "straight_completer" || turnType === "paired_turn" || turnType === "flush_completer")) {
                return "weak";
            }
            // Bottom pair on blank turn = medium (marginal protection opportunity)
            return "medium";
        }
        // Top pair is strong value
        if (heroPairVal === topBoard)
            return "strong_value";
        // Second pair or middle pair = medium
        return "medium";
    }
    // --- POCKET PAIR (no board pair) ---
    if (heroPair) {
        const topBoard = Math.max(...boardRanks.map(ranks_1.valueOfRank));
        const heroVal = (0, ranks_1.valueOfRank)(pairRank);
        // PHASE 1.1: Underpair constraints
        if (heroVal < topBoard) {
            // Underpair on dangerous turns = weak
            if (turnType && turnType !== "blank_turn") {
                return "weak";
            }
            return "weak";
        }
        // Overpair
        return "strong_value";
    }
    // --- AIR ---
    return "air";
}
/**
 * Get the pair quality for a hero hand on the board.
 * Exposed for use by other modules (e.g., intent classification).
 */
function getPairQuality(hero, board) {
    return (0, pairQuality_1.classifyPairQuality)(hero, board);
}
