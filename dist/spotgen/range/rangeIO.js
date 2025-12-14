"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRFI = loadRFI;
exports.loadFacing = loadFacing;
exports.expandBucket = expandBucket;
exports.expandRFIRange = expandRFIRange;
exports.expandCallRange = expandCallRange;
exports.expandDefendingRange = expandDefendingRange;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const expandClasses_1 = require("./expandClasses");
function readJSON(p) {
    return JSON.parse(fs_1.default.readFileSync(p, "utf8"));
}
function loadRFI(pos, repoRoot) {
    const p = path_1.default.join(repoRoot, "theory", "preflop", "charts", "rfi", `${pos}.json`);
    return readJSON(p);
}
function loadFacing(matchup, repoRoot) {
    const p = path_1.default.join(repoRoot, "theory", "preflop", "charts", "facing", `${matchup}.json`);
    return readJSON(p);
}
function expandBucket(chart, bucket) {
    // Check in hands first (RFI charts), then call/threeBet (facing charts)
    if (chart.hands && chart.hands[bucket]) {
        return (0, expandClasses_1.expandHandClassList)(chart.hands[bucket]);
    }
    if (chart.call && chart.call[bucket]) {
        return (0, expandClasses_1.expandHandClassList)(chart.call[bucket]);
    }
    if (chart.threeBet && chart.threeBet[bucket]) {
        return (0, expandClasses_1.expandHandClassList)(chart.threeBet[bucket]);
    }
    return [];
}
/**
 * Get all hands from an RFI chart
 * RFI charts have various formats:
 * - { pairs, suited, offsuit }
 * - { raise, limp, offsuit }
 */
function expandRFIRange(chart) {
    if (!chart.hands)
        return [];
    const hands = [];
    // Handle different key formats
    if (chart.hands.raise)
        hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.raise));
    if (chart.hands.pairs)
        hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.pairs));
    if (chart.hands.suited)
        hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.suited));
    if (chart.hands.offsuit)
        hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.offsuit));
    // Don't include limp range for raising - just the raise hands
    return hands;
}
/**
 * Get all hands from a facing chart's call range
 * Facing charts have hands: { call: [...], 3bet_small: [...], etc }
 */
function expandCallRange(chart) {
    // First check if it's a flat call array (older format)
    if (chart.call && Array.isArray(chart.call)) {
        return (0, expandClasses_1.expandHandClassList)(chart.call);
    }
    // Check if hands has 'call' bucket (mixed format)
    if (chart.hands && chart.hands.call) {
        return (0, expandClasses_1.expandHandClassList)(chart.hands.call);
    }
    // Check if there's a top-level 'call' array in hands (new format)
    if (chart.hands && Array.isArray(chart.hands?.call)) {
        return (0, expandClasses_1.expandHandClassList)(chart.hands.call);
    }
    return [];
}
/**
 * Get defending range from a facing chart (combined calls and some 3bets)
 */
function expandDefendingRange(chart) {
    const hands = [];
    if (chart.hands) {
        // Try different possible structures
        if (chart.hands.call)
            hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.call));
        if (chart.hands["3bet_small"])
            hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands["3bet_small"]));
        if (chart.hands.pairs)
            hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.pairs));
        if (chart.hands.suited)
            hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.suited));
        if (chart.hands.offsuit)
            hands.push(...(0, expandClasses_1.expandHandClassList)(chart.hands.offsuit));
    }
    return hands;
}
