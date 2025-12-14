"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_TO_VALUE = void 0;
exports.rankOf = rankOf;
exports.suitOf = suitOf;
exports.valueOfRank = valueOfRank;
exports.RANK_TO_VALUE = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
};
function rankOf(card) {
    return card[0];
}
function suitOf(card) {
    return card[1];
}
function valueOfRank(r) {
    const v = exports.RANK_TO_VALUE[r];
    if (!v)
        throw new Error(`Unknown rank: ${r}`);
    return v;
}
