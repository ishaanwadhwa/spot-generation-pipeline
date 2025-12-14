"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumerateCombos = enumerateCombos;
exports.all169Classes = all169Classes;
const handRanks_1 = require("./handRanks");
function card(rank, suit) {
    return `${rank}${suit}`;
}
function enumerateCombos(h) {
    const out = [];
    // Pair: "TT"
    if (h.length === 2 && h[0] === h[1]) {
        const r = h[0];
        for (let i = 0; i < handRanks_1.SUITS.length; i++) {
            for (let j = i + 1; j < handRanks_1.SUITS.length; j++) {
                out.push([card(r, handRanks_1.SUITS[i]), card(r, handRanks_1.SUITS[j])]);
            }
        }
        return out;
    }
    // Suited/offsuit: "AKs" / "AKo"
    const r1 = h[0];
    const r2 = h[1];
    const suitedness = h[2]; // "s" | "o"
    if (suitedness !== "s" && suitedness !== "o")
        return out;
    // normalize order (A before K etc.) but keep as given
    const i1 = (0, handRanks_1.rankIndex)(r1);
    const i2 = (0, handRanks_1.rankIndex)(r2);
    if (i1 < 0 || i2 < 0 || i1 === i2)
        return out;
    if (suitedness === "s") {
        for (const s of handRanks_1.SUITS)
            out.push([card(r1, s), card(r2, s)]);
        return out;
    }
    // offsuit: all suit pairs where suits differ
    for (const s1 of handRanks_1.SUITS) {
        for (const s2 of handRanks_1.SUITS) {
            if (s1 === s2)
                continue;
            out.push([card(r1, s1), card(r2, s2)]);
        }
    }
    return out;
}
function all169Classes() {
    const out = [];
    for (let i = 0; i < handRanks_1.RANKS.length; i++) {
        // pairs
        out.push(`${handRanks_1.RANKS[i]}${handRanks_1.RANKS[i]}`);
        for (let j = i + 1; j < handRanks_1.RANKS.length; j++) {
            out.push(`${handRanks_1.RANKS[i]}${handRanks_1.RANKS[j]}s`);
            out.push(`${handRanks_1.RANKS[i]}${handRanks_1.RANKS[j]}o`);
        }
    }
    return out;
}
