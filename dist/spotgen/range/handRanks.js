"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUITS = exports.RANKS = void 0;
exports.rankIndex = rankIndex;
exports.assertRank = assertRank;
exports.RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
exports.SUITS = ["s", "h", "d", "c"];
function rankIndex(r) {
    return exports.RANKS.indexOf(r);
}
function assertRank(r) {
    if (!exports.RANKS.includes(r))
        throw new Error(`Invalid rank: ${r}`);
}
