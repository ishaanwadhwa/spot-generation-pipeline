"use strict";
/**
 * spotgen/frequencies/baseFreqTable.ts
 *
 * PHASE 1: Deterministic Base Frequency Lookup
 *
 * Sparse table + fallbacks = good engineering.
 * Missing keys are features, not bugs.
 *
 * Frequencies are ordered to match opts[] which is always:
 * [passive action, ...increasingly aggressive actions]
 * e.g., [check, bet small, bet large]
 *
 * These are poker-theory-grounded priors, NOT solver outputs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_FREQ_TABLE = void 0;
exports.lookupBaseFrequencies = lookupBaseFrequencies;
/**
 * BASE_FREQ_TABLE — v1 (PROPER)
 *
 * Sparse table: not every permutation is filled.
 * Missing entries fall back to balanced distribution.
 */
// Use Partial for HandIntent since "give_up" hands are filtered before reaching frequency lookup
exports.BASE_FREQ_TABLE = {
    // ═══════════════════════════════════════════════════════════════════════════
    // 1️⃣ MADE VALUE
    // Strong hands that want to extract value
    // ═══════════════════════════════════════════════════════════════════════════
    made_value: {
        // Blank turns (nothing changes)
        // - Value hands still mix checks
        // - Prefer medium → large
        // - Rarely pure checking
        blank_turn: {
            value: [0.15, 0.40, 0.45],
            pressure: [0.25, 0.45, 0.30],
        },
        // Overcard / Scare turns
        // - Pot control increases
        // - Value shifts toward protection
        // - Less large betting
        overcard_turn: {
            value: [0.35, 0.45, 0.20],
            pressure: [0.40, 0.40, 0.20],
        },
        // Straight / Flush completers
        // - Polarization hurts thin value
        // - Checking increases
        // - Betting still exists, but smaller
        straight_completer: {
            value: [0.45, 0.40, 0.15],
            pressure: [0.50, 0.35, 0.15],
        },
        flush_completer: {
            value: [0.50, 0.35, 0.15],
            pressure: [0.55, 0.30, 0.15],
        },
        // Paired turn
        // - Similar to scare card, pot control
        paired_turn: {
            value: [0.35, 0.45, 0.20],
            pressure: [0.40, 0.40, 0.20],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 2️⃣ THIN VALUE / PROTECTION
    // Medium-strength hands that want protection/thin value
    // - Protection bets prefer medium sizes
    // - Large bets fold out worse
    // - Checking still common
    // ═══════════════════════════════════════════════════════════════════════════
    thin_value: {
        blank_turn: {
            value: [0.30, 0.50, 0.20],
            pressure: [0.35, 0.45, 0.20],
        },
        overcard_turn: {
            value: [0.45, 0.40, 0.15],
            pressure: [0.50, 0.35, 0.15],
        },
        straight_completer: {
            value: [0.50, 0.35, 0.15],
            pressure: [0.55, 0.30, 0.15],
        },
        flush_completer: {
            value: [0.55, 0.30, 0.15],
            pressure: [0.60, 0.28, 0.12],
        },
        paired_turn: {
            value: [0.45, 0.40, 0.15],
            pressure: [0.50, 0.35, 0.15],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 3️⃣ COMBO DRAWS (most important category)
    // High-equity draws (NFD + straight draw)
    // - Medium bets maximize equity realization
    // - Large bets still common
    // - Flush turns reduce fold equity slightly
    // ═══════════════════════════════════════════════════════════════════════════
    combo_draw: {
        blank_turn: {
            semi_bluff: [0.20, 0.45, 0.35],
            pressure: [0.25, 0.40, 0.35],
        },
        overcard_turn: {
            semi_bluff: [0.25, 0.45, 0.30],
            pressure: [0.30, 0.40, 0.30],
        },
        straight_completer: {
            semi_bluff: [0.15, 0.50, 0.35],
            pressure: [0.20, 0.45, 0.35],
            value: [0.15, 0.40, 0.45], // If we made the straight
        },
        flush_completer: {
            semi_bluff: [0.30, 0.45, 0.25],
            pressure: [0.35, 0.40, 0.25],
            value: [0.15, 0.40, 0.45], // If we made the flush
        },
        paired_turn: {
            semi_bluff: [0.30, 0.45, 0.25],
            pressure: [0.35, 0.40, 0.25],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 4️⃣ DRAWS (non-combo)
    // Single draw (flush draw or straight draw, not combo)
    // - More checking
    // - Less leverage
    // - Still pressure occasionally
    // ═══════════════════════════════════════════════════════════════════════════
    draw: {
        blank_turn: {
            semi_bluff: [0.35, 0.45, 0.20],
            pressure: [0.40, 0.40, 0.20],
        },
        overcard_turn: {
            semi_bluff: [0.45, 0.40, 0.15],
            pressure: [0.50, 0.35, 0.15],
        },
        straight_completer: {
            semi_bluff: [0.30, 0.50, 0.20],
            value: [0.20, 0.45, 0.35], // If completed
        },
        flush_completer: {
            semi_bluff: [0.35, 0.45, 0.20],
            value: [0.20, 0.40, 0.40], // If completed
        },
        paired_turn: {
            semi_bluff: [0.45, 0.40, 0.15],
            pressure: [0.50, 0.35, 0.15],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 5️⃣ PURE BLUFF (rare, but needed)
    // No made hand, no meaningful draw
    // - Most bluffs give up
    // - Some pressure on scare cards
    // - Rare big bets
    // ═══════════════════════════════════════════════════════════════════════════
    pure_bluff: {
        blank_turn: {
            pressure: [0.55, 0.30, 0.15],
            semi_bluff: [0.60, 0.28, 0.12],
        },
        // Scare turns (overcards, completers) = more bluffing opportunity
        overcard_turn: {
            pressure: [0.40, 0.35, 0.25],
            semi_bluff: [0.45, 0.35, 0.20],
        },
        straight_completer: {
            pressure: [0.45, 0.35, 0.20],
            semi_bluff: [0.50, 0.35, 0.15],
        },
        flush_completer: {
            pressure: [0.50, 0.30, 0.20],
            semi_bluff: [0.55, 0.30, 0.15],
        },
        paired_turn: {
            pressure: [0.60, 0.25, 0.15],
            semi_bluff: [0.65, 0.25, 0.10],
        },
    },
};
/**
 * Fallback: balanced distribution
 * Missing keys are features, not bugs.
 */
function balancedFallback(n) {
    if (n <= 0)
        return [];
    if (n === 1)
        return [1.0];
    return Array(n).fill(Math.round((1 / n) * 100) / 100);
}
/**
 * Resize a frequency vector to target length while preserving relative skew.
 * Normalizes to sum to 1.0.
 */
function resizeFrequencies(source, targetLength) {
    if (source.length === targetLength)
        return [...source];
    if (targetLength <= 0)
        return [];
    if (targetLength === 1)
        return [1.0];
    const result = [];
    if (targetLength < source.length) {
        // Merge: combine entries proportionally
        const ratio = source.length / targetLength;
        for (let i = 0; i < targetLength; i++) {
            const start = i * ratio;
            const end = (i + 1) * ratio;
            let sum = 0;
            for (let j = Math.floor(start); j < Math.ceil(end) && j < source.length; j++) {
                const overlap = Math.min(end, j + 1) - Math.max(start, j);
                sum += source[j] * overlap;
            }
            result.push(sum);
        }
    }
    else {
        // Expand: interpolate
        for (let i = 0; i < targetLength; i++) {
            const srcIdx = (i / (targetLength - 1)) * (source.length - 1);
            const lower = Math.floor(srcIdx);
            const upper = Math.min(lower + 1, source.length - 1);
            const t = srcIdx - lower;
            result.push(source[lower] * (1 - t) + source[upper] * t);
        }
    }
    // Normalize
    const sum = result.reduce((a, b) => a + b, 0);
    return result.map((v) => Math.round((v / sum) * 100) / 100);
}
/**
 * Look up base frequencies from the table.
 *
 * Fallback chain:
 * 1. Exact match (handIntent + turnType + nodeIntent)
 * 2. Same handIntent + blank_turn + nodeIntent
 * 3. Same handIntent + blank_turn + any nodeIntent
 * 4. Balanced distribution
 *
 * @returns Frequency vector aligned to opts[] (sums to 1.0)
 */
function lookupBaseFrequencies(handIntent, turnType, nodeIntent, numOptions) {
    if (numOptions <= 0)
        return [];
    if (numOptions === 1)
        return [1.0];
    const nodeKey = nodeIntent;
    const handEntry = exports.BASE_FREQ_TABLE[handIntent];
    if (handEntry) {
        // Try exact match
        const turnEntry = handEntry[turnType];
        if (turnEntry) {
            const freqs = turnEntry[nodeKey];
            if (freqs) {
                return freqs.length === numOptions ? [...freqs] : resizeFrequencies(freqs, numOptions);
            }
            // Try any nodeIntent for this turn
            const anyFreqs = Object.values(turnEntry)[0];
            if (anyFreqs) {
                return anyFreqs.length === numOptions ? [...anyFreqs] : resizeFrequencies(anyFreqs, numOptions);
            }
        }
        // Fallback: try blank_turn
        const blankEntry = handEntry["blank_turn"];
        if (blankEntry) {
            const freqs = blankEntry[nodeKey];
            if (freqs) {
                return freqs.length === numOptions ? [...freqs] : resizeFrequencies(freqs, numOptions);
            }
            const anyFreqs = Object.values(blankEntry)[0];
            if (anyFreqs) {
                return anyFreqs.length === numOptions ? [...anyFreqs] : resizeFrequencies(anyFreqs, numOptions);
            }
        }
    }
    // Ultimate fallback: balanced
    return balancedFallback(numOptions);
}
