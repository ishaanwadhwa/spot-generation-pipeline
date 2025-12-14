"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandHandClassToken = expandHandClassToken;
exports.expandHandClassList = expandHandClassList;
const handRanks_1 = require("./handRanks");
function expandPairs(token) {
    // "22-99", "66+", "TT"
    if (token.includes("+")) {
        const base = token.replace("+", "");
        const r = base[0];
        const start = (0, handRanks_1.rankIndex)(r);
        if (start < 0)
            return [];
        const out = [];
        for (let i = start; i >= 0; i--)
            out.push(`${handRanks_1.RANKS[i]}${handRanks_1.RANKS[i]}`);
        return out;
    }
    if (token.includes("-")) {
        const [a, b] = token.split("-");
        const start = (0, handRanks_1.rankIndex)(a[0]);
        const end = (0, handRanks_1.rankIndex)(b[0]);
        if (start < 0 || end < 0)
            return [];
        const out = [];
        for (let i = start; i >= end; i--)
            out.push(`${handRanks_1.RANKS[i]}${handRanks_1.RANKS[i]}`);
        return out;
    }
    return [token];
}
function expandNonPairPlus(token) {
    // Examples:
    // - "A2s+" => A2s..AKs
    // - "ATo+" => ATo..AKo
    // - "K9o+" => K9o..KQo (keep first rank fixed, walk second rank up to just below first)
    const baseToken = token.replace("+", "");
    const suitedness = baseToken.endsWith("s") ? "s" : baseToken.endsWith("o") ? "o" : null;
    if (!suitedness)
        return [token];
    const base = baseToken;
    const r1 = base[0];
    const r2 = base[1];
    const i1 = (0, handRanks_1.rankIndex)(r1);
    const i2 = (0, handRanks_1.rankIndex)(r2);
    if (i1 < 0 || i2 < 0)
        return [];
    const out = [];
    // second rank can climb towards the first rank (higher kicker)
    for (let j = i2; j > i1; j--)
        out.push(`${r1}${handRanks_1.RANKS[j]}${suitedness}`);
    return out;
}
function expandNonPairDash(token) {
    // Examples: "A2s-A9s", "KTs-KQs"
    const [a, b] = token.split("-");
    const suitedness = a.endsWith("s") ? "s" : a.endsWith("o") ? "o" : null;
    if (!suitedness)
        return [token];
    const r1a = a[0];
    const r2a = a[1];
    const r1b = b[0];
    const r2b = b[1];
    if (r1a !== r1b) {
        // keep v1: only support same first rank ranges (matches your charts)
        return [a, b];
    }
    const i1 = (0, handRanks_1.rankIndex)(r1a);
    const start = (0, handRanks_1.rankIndex)(r2a);
    const end = (0, handRanks_1.rankIndex)(r2b);
    if (i1 < 0 || start < 0 || end < 0)
        return [];
    const out = [];
    for (let j = start; j >= end; j--)
        out.push(`${r1a}${handRanks_1.RANKS[j]}${suitedness}`);
    return out;
}
function expandHandClassToken(token) {
    const t = token.trim();
    if (!t)
        return [];
    // Pairs: first two chars equal and no suitedness marker
    if (t.length >= 2 && t[0] === t[1] && !t.includes("s") && !t.includes("o")) {
        return expandPairs(t);
    }
    if (t.includes("-"))
        return expandNonPairDash(t);
    if (t.includes("+"))
        return expandNonPairPlus(t);
    return [t];
}
function expandHandClassList(list) {
    const out = [];
    for (const x of list)
        out.push(...expandHandClassToken(x));
    // de-dupe
    return Array.from(new Set(out));
}
