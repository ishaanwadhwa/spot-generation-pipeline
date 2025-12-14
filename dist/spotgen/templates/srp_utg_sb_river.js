"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryGenerateSrpUtgSbRiverSpot = tryGenerateSrpUtgSbRiverSpot;
exports.generateSrpUtgSbRiverSpot = generateSrpUtgSbRiverSpot;
const path_1 = __importDefault(require("path"));
const rangeIO_1 = require("../range/rangeIO");
const enumerateCombos_1 = require("../range/enumerateCombos");
const rng_1 = require("../util/rng");
const tags_1 = require("../tags");
const classify_1 = require("../poker/classify");
const handFeatures_1 = require("../poker/handFeatures");
const intent_1 = require("../poker/intent");
const concepts_1 = require("../meta/concepts");
const ranks_1 = require("../poker/ranks");
function loadRiverMatrix(repoRoot) {
    return require(path_1.default.join(repoRoot, "theory", "postflop", "solver_truth", "river_matrix.json"));
}
function pctAmount(pct, pot) {
    return Math.round(((pct / 100) * pot) * 10000) / 10000;
}
// Curated runouts for river spots
const RUNOUTS = {
    blank_river: [
        { flop: "Kh7d2c", turn: "5s", river: "3d" },
        { flop: "Qc8d4s", turn: "6h", river: "2c" },
    ],
    overcard_river: [
        { flop: "9h6d3c", turn: "2s", river: "Ah" },
        { flop: "Tc7d4s", turn: "5h", river: "Kd" },
    ],
    pairing_river: [
        { flop: "Jh8d5c", turn: "3s", river: "8h" },
        { flop: "Qc9d6s", turn: "4h", river: "9c" },
    ],
    straight_completer_river: [
        { flop: "Th9d6c", turn: "7s", river: "8h" },
        { flop: "9h8d5c", turn: "4s", river: "6d" },
    ],
    flush_completer_river: [
        { flop: "Kc9c4h", turn: "7d", river: "2c" },
        { flop: "Ah7h3d", turn: "5c", river: "Jh" },
    ],
};
function parseBoard(flop, turn, river) {
    return [
        flop.slice(0, 2),
        flop.slice(2, 4),
        flop.slice(4, 6),
        turn,
        river,
    ];
}
function classifyRiver(board) {
    const river = board[4];
    const riverRank = (0, ranks_1.rankOf)(river);
    const riverSuit = (0, ranks_1.suitOf)(river);
    const prevRanks = board.slice(0, 4).map(ranks_1.rankOf);
    const prevSuits = board.slice(0, 4).map(ranks_1.suitOf);
    // Pairing
    if (prevRanks.includes(riverRank))
        return "pairing_river";
    // Flush completer
    const suitCounts = {};
    for (const s of [...prevSuits, riverSuit]) {
        suitCounts[s] = (suitCounts[s] || 0) + 1;
    }
    if (Object.values(suitCounts).some(c => c >= 4) && suitCounts[riverSuit] >= 3) {
        return "flush_completer_river";
    }
    // Straight completer (simplified)
    const allVals = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const sorted = [...new Set(allVals)].sort((a, b) => a - b);
    for (let i = 0; i <= sorted.length - 5; i++) {
        if (sorted[i + 4] - sorted[i] === 4)
            return "straight_completer_river";
    }
    // Check wheel
    if ([14, 2, 3, 4, 5].every(v => allVals.includes(v)))
        return "straight_completer_river";
    // Overcard
    const riverVal = (0, ranks_1.valueOfRank)(riverRank);
    const maxPrev = Math.max(...prevRanks.map(ranks_1.valueOfRank));
    if (riverVal > maxPrev)
        return "overcard_river";
    return "blank_river";
}
/**
 * Generate a SRP UTG vs SB river decision spot.
 * Hero = UTG (OOP after preflop, but villain checked to hero on river)
 * Villain = SB
 * Difficulty target: 8 (complex river decision)
 */
function tryGenerateSrpUtgSbRiverSpot(args) {
    const rand = (0, rng_1.mulberry32)(args.seed);
    // Load ranges
    const utgRfi = (0, rangeIO_1.loadRFI)("utg", args.repoRoot);
    const sbVsUtg = (0, rangeIO_1.loadFacing)("sb_vs_utg", args.repoRoot);
    const riverMatrix = loadRiverMatrix(args.repoRoot);
    const heroClasses = [
        ...(0, rangeIO_1.expandBucket)(utgRfi, "pairs"),
        ...(0, rangeIO_1.expandBucket)(utgRfi, "suited"),
        ...(0, rangeIO_1.expandBucket)(utgRfi, "offsuit"),
    ];
    // Pick a runout
    const runout = (0, rng_1.pickOne)(rand, RUNOUTS[args.riverClass]);
    const board = parseBoard(runout.flop, runout.turn, runout.river);
    const boardCards = new Set(board);
    // Sample hero hand
    let heroHand = null;
    let heroClass = "air";
    let feats = null;
    let handIntent = "pure_bluff";
    for (let attempt = 0; attempt < 300; attempt++) {
        const preferredClasses = heroClasses.filter((h) => typeof h === "string");
        const hc = (0, rng_1.pickOne)(rand, preferredClasses);
        const combos = (0, enumerateCombos_1.enumerateCombos)(hc);
        if (combos.length === 0)
            continue;
        const viable = combos.filter(([c1, c2]) => !boardCards.has(c1) && !boardCards.has(c2));
        if (viable.length === 0)
            continue;
        const [c1, c2] = (0, rng_1.pickOne)(rand, viable);
        const sampled = [c1, c2];
        heroClass = (0, classify_1.classifyHeroHandOnBoard)(sampled, board);
        feats = (0, handFeatures_1.computeHandFeatures)(sampled, board);
        handIntent = (0, intent_1.classifyHandIntent)(heroClass, feats);
        // For difficulty 8, we want complex decisions:
        // - Thin value (vulnerable hands)
        // - Bluff catchers
        // - Polarized hands with blockers
        const isComplex = handIntent === "thin_value" ||
            (heroClass === "medium" && !feats.hasFlushDraw) ||
            (heroClass === "strong_value" && args.riverClass !== "blank_river");
        if (!isComplex)
            continue;
        heroHand = sampled;
        break;
    }
    if (!heroHand || !feats) {
        return { spot: null, rejected: true, reason: "Could not find complex river hand" };
    }
    // Recalculate final classifications
    const riverType = classifyRiver(board);
    const matrixEntry = riverMatrix.river_classes[riverType] || riverMatrix.river_classes["blank_river"];
    // Pot math: UTG open 2.5bb, SB calls, BB folds → heads up
    // Flop: UTG bets, SB calls
    // Turn: UTG bets, SB calls
    // River: SB checks to UTG
    const prePot = 0.5 + 1.0 + 2.5 + 2.5; // 6.5bb
    const flopBet = pctAmount(50, prePot); // 3.25bb
    const flopPot = prePot + flopBet + flopBet; // 13bb
    const turnBet = pctAmount(66, flopPot); // ~8.58bb
    const turnPot = flopPot + turnBet + turnBet; // ~30.16bb
    const riverPot = Math.round(turnPot * 100) / 100;
    // Build options based on hand intent
    // Key: thin value hands should NOT have large sizings (validator enforces this)
    let sizings;
    if (handIntent === "thin_value") {
        // Thin value: only small/medium sizings
        sizings = [25, 33];
    }
    else if (heroClass === "monster" || heroClass === "strong_value") {
        // Strong hands: can use larger sizing for value
        sizings = matrixEntry.ip.preferred_sizings.filter(s => s <= 75).slice(0, 2);
        if (sizings.length === 0)
            sizings = [50, 66];
    }
    else {
        // Default from matrix but cap at 66 for non-strong hands
        sizings = matrixEntry.ip.preferred_sizings.filter(s => s <= 66).slice(0, 2);
        if (sizings.length === 0)
            sizings = [33, 50];
    }
    const opts = [["x"]];
    for (const sz of sizings) {
        opts.push(["b", sz, pctAmount(sz, riverPot)]);
    }
    // Determine best action based on hand strength
    let bestIdx = 0;
    const valueFreq = matrixEntry.ip.value_bet_freq_num;
    const bluffFreq = matrixEntry.ip.bluff_freq_num;
    if (handIntent === "made_value" || heroClass === "monster" || heroClass === "strong_value") {
        // Value bet: prefer larger sizing
        bestIdx = opts.length > 2 ? 2 : 1;
    }
    else if (handIntent === "thin_value") {
        // Thin value: prefer smaller sizing
        bestIdx = 1;
    }
    else {
        // Check with bluff catchers
        bestIdx = 0;
    }
    // Generate frequencies from matrix (DETERMINISTIC from river_matrix.json)
    const betFreq = matrixEntry.ip.bet_freq_num;
    const checkFreq = 1 - betFreq;
    let freqs;
    if (opts.length === 3) {
        // Distribute bet freq across two sizes
        const smallBetFreq = betFreq * 0.45;
        const largeBetFreq = betFreq * 0.55;
        freqs = [
            Math.round(checkFreq * 100) / 100,
            Math.round(smallBetFreq * 100) / 100,
            Math.round(largeBetFreq * 100) / 100,
        ];
    }
    else {
        freqs = [
            Math.round(checkFreq * 100) / 100,
            Math.round(betFreq * 100) / 100,
        ];
    }
    // Concepts based on river type and hand
    const concepts = (0, tags_1.clampList)((0, concepts_1.filterConcepts)(heroClass === "monster" || heroClass === "strong_value"
        ? ["value-bet", "river-polarization", "sizing-tells"]
        : handIntent === "thin_value"
            ? ["thin-value", "pot-control", "showdown-value"]
            : ["bluff-catcher", "range-advantage", "blockers"]), tags_1.MAX_CONCEPTS);
    const tags = (0, tags_1.clampList)(["river", "SRP", "OOP", heroClass === "monster" ? "value" : "decision", args.riverClass], tags_1.MAX_TAGS);
    // Solver notes based on matrix and hand
    const solverNotes = [
        `River type: ${matrixEntry.label}.`,
        `Matrix suggests ${Math.round(betFreq * 100)}% betting frequency for IP.`,
        handIntent === "thin_value"
            ? "With thin value, prefer smaller sizing to get called by worse."
            : handIntent === "made_value"
                ? "Strong hands should bet for value, larger sizing preferred."
                : "With a bluff catcher, checking is often correct.",
        `Value/bluff ratio at this node: ${Math.round(valueFreq * 100)}/${Math.round(bluffFreq * 100)}.`,
    ];
    // Summary
    const summary = handIntent === "made_value"
        ? `On a ${riverType.replace("_", " ")}, hero has a strong hand. Betting for value with a polarizing size extracts maximum from villain's calling range.`
        : handIntent === "thin_value"
            ? `On a ${riverType.replace("_", " ")}, hero has marginal showdown value. A thin value bet or check are both reasonable; sizing should keep worse hands calling.`
            : `On a ${riverType.replace("_", " ")}, hero has a bluff catcher. Checking controls the pot and allows villain to bluff; betting risks being called only by better.`;
    const spot = {
        id: args.id,
        fmt: "6m",
        str: "r",
        difficulty: 8,
        tags,
        data: {
            id: args.id,
            st: 100,
            fmt: "6m",
            str: "r",
            hero: { pos: "UTG", hand: heroHand },
            v: ["SB"],
            brd: board,
            pot: riverPot,
            hist: [
                ["UTG", "r", "2.5x", 2.5],
                ["MP", "f"],
                ["CO", "f"],
                ["BTN", "f"],
                ["SB", "c", null, 2.5],
                ["BB", "f"],
                ["-", "f"],
                ["SB", "x"],
                ["UTG", "b", 50, flopBet],
                ["SB", "c", null, flopBet],
                ["-", "t"],
                ["SB", "x"],
                ["UTG", "b", 66, turnBet],
                ["SB", "c", null, turnBet],
                ["-", "r"],
                ["SB", "x"],
            ],
            opts: opts,
            sol: { b: bestIdx, ev: opts.map((_, i) => (i === bestIdx ? 2.5 : 1.9)) },
            meta: {
                concept: concepts,
                summary,
                solverNotes,
                freq: freqs,
            },
        },
    };
    return { spot, rejected: false };
}
function generateSrpUtgSbRiverSpot(args) {
    const result = tryGenerateSrpUtgSbRiverSpot(args);
    if (!result.spot) {
        throw new Error(`Failed to generate spot: ${result.reason}`);
    }
    return result.spot;
}
