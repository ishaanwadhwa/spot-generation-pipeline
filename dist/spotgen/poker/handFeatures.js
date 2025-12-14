"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeHandFeatures = computeHandFeatures;
const ranks_1 = require("./ranks");
function unique(xs) {
    return Array.from(new Set(xs));
}
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
/**
 * Check if hero makes a wheel straight (A-2-3-4-5).
 * Returns true if wheel exists AND hero contributes to it.
 */
function isWheelStraightWithHero(hero, board) {
    const heroValues = new Set(hero.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    const boardValues = new Set(board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    const allValues = new Set([...heroValues, ...boardValues]);
    // Check if wheel exists
    const wheelCards = [14, 2, 3, 4, 5];
    const hasWheel = wheelCards.every(v => allValues.has(v));
    if (!hasWheel)
        return false;
    // Check if hero contributes to the wheel (not just playing board straight)
    const heroContributes = wheelCards.some(v => heroValues.has(v) && !boardValues.has(v));
    return heroContributes;
}
/**
 * Check if hero makes any straight (and contributes to it).
 */
function hasStraightWithHero(hero, board) {
    const heroValues = new Set(hero.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    const boardValues = new Set(board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    const allValues = new Set([...heroValues, ...boardValues]);
    if (!straightExists(allValues))
        return false;
    // Hero must contribute at least one card to the straight
    // Check wheel
    const wheelCards = [14, 2, 3, 4, 5];
    if (wheelCards.every(v => allValues.has(v))) {
        if (wheelCards.some(v => heroValues.has(v) && !boardValues.has(v)))
            return true;
    }
    // Check regular straights
    for (let hi = 14; hi >= 6; hi--) {
        const straightCards = [hi, hi - 1, hi - 2, hi - 3, hi - 4];
        if (straightCards.every(v => allValues.has(v))) {
            if (straightCards.some(v => heroValues.has(v) && !boardValues.has(v)))
                return true;
        }
    }
    return false;
}
function straightDrawType(hero, board) {
    const base = new Set([...board, ...hero].map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c))));
    if (straightExists(base))
        return "none"; // already made; we treat as "none" draw type here
    // brute-force: count how many single-rank additions create a straight
    let outs = 0;
    for (const r of ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]) {
        const v = (0, ranks_1.valueOfRank)(r);
        const t = new Set(base);
        t.add(v);
        if (straightExists(t))
            outs++;
    }
    if (outs >= 2)
        return "oesd";
    if (outs === 1)
        return "gutshot";
    return "none";
}
function computeHandFeatures(hero, board) {
    const heroRanks = [(0, ranks_1.rankOf)(hero[0]), (0, ranks_1.rankOf)(hero[1])];
    const boardRanks = board.map(ranks_1.rankOf);
    const hasPair = heroRanks.some((r) => boardRanks.includes(r)) || heroRanks[0] === heroRanks[1];
    const pairRank = heroRanks[0] === heroRanks[1] ? heroRanks[0] : heroRanks.find((r) => boardRanks.includes(r));
    // flush draw: 4+ of same suit among hero+board and not already flush
    const suits = [...hero, ...board].map(ranks_1.suitOf);
    const suitCounts = suits.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const maxSuit = Math.max(...Object.values(suitCounts));
    const hasFlushDraw = maxSuit === 4;
    const flushSuit = Object.entries(suitCounts).find(([, n]) => n === 4)?.[0];
    const isNutFlushDraw = hasFlushDraw && !!flushSuit && hero.some((c) => (0, ranks_1.suitOf)(c) === flushSuit && (0, ranks_1.rankOf)(c) === "A");
    const sd = straightDrawType(hero, board);
    const comboDraw = hasFlushDraw && (sd === "oesd" || sd === "gutshot");
    // NEW: Pair + draw combo (pair with flush draw OR pair with OESD)
    // This is distinct from comboDraw which is flush+straight
    // Pair + draw hands have combo equity and should not be treated as "weak"
    const hasDraw = hasFlushDraw || sd !== "none";
    const hasPairPlusDraw = hasPair && hasDraw;
    // equity proxy: coarse, for classification only
    let eq = 0.15;
    if (hasPair)
        eq += 0.18;
    if (hasFlushDraw)
        eq += isNutFlushDraw ? 0.28 : 0.22;
    if (sd === "gutshot")
        eq += 0.10;
    if (sd === "oesd")
        eq += 0.18;
    if (comboDraw)
        eq += 0.05;
    if (hasPairPlusDraw)
        eq += 0.08; // Pair + draw is worth more than sum
    if (eq > 0.85)
        eq = 0.85;
    // Straight detection
    const hasStraight = hasStraightWithHero(hero, board);
    const isWheelStraight = isWheelStraightWithHero(hero, board);
    return {
        hasPair,
        pairRank,
        hasFlushDraw,
        isNutFlushDraw,
        straightDraw: sd,
        comboDraw,
        hasPairPlusDraw,
        hasStraight,
        isWheelStraight,
        equityProxy: Math.round(eq * 1000) / 1000,
    };
}
