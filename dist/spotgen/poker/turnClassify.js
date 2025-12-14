"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyTurn = classifyTurn;
const ranks_1 = require("./ranks");
const ALL_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
function straightExists(ranks) {
    // wheel
    if (ranks.has(14) && ranks.has(2) && ranks.has(3) && ranks.has(4) && ranks.has(5))
        return true;
    for (let hi = 14; hi >= 6; hi--) {
        let ok = true;
        for (let x = hi; x > hi - 5; x--)
            if (!ranks.has(x))
                ok = false;
        if (ok)
            return true;
    }
    return false;
}
function turnCompletesAnyStraightDraw(flop, turn) {
    const flopRanks = new Set(flop.map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    const turnVal = (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(turn));
    // brute force over all possible 2-card rank pairs
    for (let i = 0; i < ALL_RANKS.length; i++) {
        for (let j = i + 1; j < ALL_RANKS.length; j++) {
            const r1 = (0, ranks_1.valueOfRank)(ALL_RANKS[i]);
            const r2 = (0, ranks_1.valueOfRank)(ALL_RANKS[j]);
            // flop only (5 ranks total with hand)
            const flopOnly = new Set([...flopRanks, r1, r2]);
            const withTurn = new Set([...flopRanks, turnVal, r1, r2]);
            if (!straightExists(flopOnly) && straightExists(withTurn))
                return true;
        }
    }
    return false;
}
function classifyTurn(flop, turn) {
    const flopRanks = flop.map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const turnRank = (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(turn));
    // paired turn
    if (flop.some((c) => (0, ranks_1.rankOf)(c) === (0, ranks_1.rankOf)(turn)))
        return "paired_turn";
    // flush completer: flop is two-tone and turn matches that suit
    const suits = flop.map(ranks_1.suitOf);
    const suitCounts = suits.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const twoToneSuit = Object.entries(suitCounts).find(([, n]) => n === 2)?.[0];
    if (twoToneSuit && (0, ranks_1.suitOf)(turn) === twoToneSuit)
        return "flush_completer";
    // overcard
    if (turnRank > Math.max(...flopRanks))
        return "overcard_turn";
    // straight completer (for someone)
    if (turnCompletesAnyStraightDraw(flop, turn))
        return "straight_completer";
    return "blank_turn";
}
