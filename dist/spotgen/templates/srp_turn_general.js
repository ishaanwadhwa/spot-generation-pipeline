"use strict";
/**
 * spotgen/templates/srp_turn_general.ts
 *
 * Generalized SRP Turn Template
 *
 * Supports any IP vs OOP matchup:
 * - MP vs BB
 * - CO vs BB
 * - BTN vs BB
 * - etc.
 *
 * Also supports difficulty targeting:
 * - easy (1-3): clear value hands, obvious action
 * - medium (4-6): standard decisions, 3 options
 * - hard (7-8): polarized, close EVs, tricky spots
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSrpTurnSpot = generateSrpTurnSpot;
exports.tryGenerateSrpTurnSpot = tryGenerateSrpTurnSpot;
const path_1 = __importDefault(require("path"));
const rangeIO_1 = require("../range/rangeIO");
const enumerateCombos_1 = require("../range/enumerateCombos");
const rng_1 = require("../util/rng");
const tags_1 = require("../tags");
const classify_1 = require("../poker/classify");
const turnClassify_1 = require("../poker/turnClassify");
const handFeatures_1 = require("../poker/handFeatures");
const intent_1 = require("../poker/intent");
const concepts_1 = require("../meta/concepts");
const barrelEligibility_1 = require("../poker/barrelEligibility");
const templates_1 = require("../meta/templates");
const ranks_1 = require("../poker/ranks");
const baseFreqTable_1 = require("../frequencies/baseFreqTable");
const leverage_1 = require("../poker/leverage");
const fs_1 = __importDefault(require("fs"));
// Flop class definitions
const FLOP_CLASS_MAP = {
    dry_Axx_highcard: [["Ah", "7c", "2d"], ["As", "8d", "3h"], ["Ad", "6s", "4c"]],
    dry_Kxx_Qxx: [["Kh", "7c", "2d"], ["Qs", "8d", "3h"], ["Kd", "6s", "4c"]],
    low_disconnected: [
        ["7h", "3d", "2c"], ["8c", "5d", "2h"], ["9d", "4c", "2s"],
        ["6h", "4d", "2c"], ["8h", "3d", "2s"], ["5d", "4c", "2s"],
    ],
    medium_connected: [["9h", "8d", "5c"], ["Th", "9c", "6d"], ["Jh", "Tc", "7d"]],
    monotone: [["7h", "5h", "2h"], ["9d", "6d", "3d"], ["8c", "5c", "2c"]],
    paired: [["7h", "7d", "2c"], ["5d", "5c", "2s"], ["8h", "8d", "3c"]],
};
// Turn cards for different types
const TURN_CARDS = {
    blank: ["3s", "4h", "6d", "8s", "2d"],
    overcard: ["Jh", "Qd", "Ks", "Ah", "Tc"],
    completer: ["4d", "5h", "6c", "3s"], // Can complete straights on low boards
    paired: ["2d", "3h", "5s", "7d"],
    flush: ["5d", "6d", "7d", "8d"], // For monotone boards
};
function pctAmount(pct, pot) {
    return Math.round((pct / 100) * pot * 10000) / 10000;
}
function computeDifficulty(opts, handIntent, turnType, leverage, mode) {
    // Base difficulty from options
    let d = opts <= 2 ? 3 : 5;
    // Street modifier (turn)
    d += 1;
    // Hand intent modifiers
    if (handIntent === "combo_draw")
        d += 1;
    if (handIntent === "thin_value")
        d += 1;
    if (handIntent === "pure_bluff")
        d += 2;
    // Turn type modifiers
    if (turnType === "straight_completer" || turnType === "flush_completer")
        d += 1;
    // Leverage/mode modifiers
    if (mode === "overbet")
        d += 1;
    return Math.min(Math.max(d, 1), 10);
}
function generateSrpTurnSpot(args) {
    const { repoRoot, id, seed, heroPosition, villainPosition, flopClass = "low_disconnected", difficulty = "medium", constraints = {}, } = args;
    const rand = (0, rng_1.mulberry32)(seed);
    // Load preflop charts (note: loadRFI takes (pos, repoRoot))
    const heroRFI = (0, rangeIO_1.loadRFI)(heroPosition.toLowerCase(), repoRoot);
    const facingFile = `${villainPosition.toLowerCase()}_vs_${heroPosition.toLowerCase()}`;
    const villainFacing = (0, rangeIO_1.loadFacing)(facingFile, repoRoot);
    if (!heroRFI || !villainFacing) {
        return { spot: null, rejected: true, reason: "Missing preflop chart" };
    }
    // Load flop matrix
    const flopMatrixPath = path_1.default.join(repoRoot, "theory/postflop/solver_truth/flop_matrix.json");
    const flopMatrix = JSON.parse(fs_1.default.readFileSync(flopMatrixPath, "utf8"));
    // Build deck
    const suits = ["h", "d", "c", "s"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    const fullDeck = ranks.flatMap((r) => suits.map((s) => `${r}${s}`));
    // Pick flop
    const flopOptions = FLOP_CLASS_MAP[flopClass];
    const flop = (0, rng_1.pickOne)(rand, flopOptions);
    // Pick turn based on difficulty target
    let turnPool;
    switch (difficulty) {
        case "easy":
            // Easy: blank turns, value hands
            turnPool = TURN_CARDS.blank;
            break;
        case "hard":
            // Hard: completers, dynamic boards
            turnPool = [...TURN_CARDS.completer, ...TURN_CARDS.overcard];
            break;
        default:
            // Medium: mix
            turnPool = [...TURN_CARDS.blank, ...TURN_CARDS.completer];
    }
    // Filter turns that don't overlap with flop
    const usedCards = new Set(flop);
    const validTurns = turnPool.filter((t) => !usedCards.has(t));
    const turn = (0, rng_1.pickOne)(rand, validTurns);
    usedCards.add(turn);
    let turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    const board = [...flop, turn];
    const boardRanks = board.map((c) => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    // Build hero range from RFI chart - collect all hand classes
    const heroHandClasses = [];
    if (heroRFI.hands) {
        for (const key of Object.keys(heroRFI.hands)) {
            if (key === "notes")
                continue;
            // expandBucket returns hand classes like "AKs", "QQ", etc.
            const expanded = (0, rangeIO_1.expandBucket)(heroRFI, key);
            heroHandClasses.push(...expanded);
        }
    }
    if (heroHandClasses.length === 0) {
        return { spot: null, rejected: true, reason: "No hero hands in range" };
    }
    // Filter hero hands for difficulty
    const wantValueIntent = difficulty === "easy";
    const wantPolarized = difficulty === "hard";
    // Sample hero hand
    let heroHand = null;
    let eligibility = null;
    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const cls = (0, rng_1.pickOne)(rand, heroHandClasses);
        const combos = (0, enumerateCombos_1.enumerateCombos)(cls);
        if (combos.length === 0)
            continue;
        // Filter combos that don't conflict with board
        const viable = combos.filter(([c1, c2]) => !usedCards.has(c1) && !usedCards.has(c2));
        if (viable.length === 0)
            continue;
        const [c1, c2] = (0, rng_1.pickOne)(rand, viable);
        const sampled = [c1, c2];
        const heroClass = (0, classify_1.classifyHeroHandOnBoard)(sampled, board, turnType);
        if (constraints?.avoidHeroClasses?.includes(heroClass))
            continue;
        const feats = (0, handFeatures_1.computeHandFeatures)(sampled, board);
        const pairQuality = (0, classify_1.getPairQuality)(sampled, board);
        const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, feats, pairQuality, turnType);
        if (handIntent === "give_up")
            continue;
        if (!(0, barrelEligibility_1.isEligibleForBarrelSpot)(heroClass, feats, turnType, boardRanks))
            continue;
        eligibility = (0, barrelEligibility_1.checkBarrelEligibility)(heroClass, feats, turnType, boardRanks);
        // Difficulty filtering
        if (wantValueIntent && heroClass !== "monster" && heroClass !== "strong_value")
            continue;
        if (wantPolarized && handIntent !== "combo_draw" && handIntent !== "thin_value")
            continue;
        if (!eligibility.canBarrelSmall && !eligibility.canBarrelLarge)
            continue;
        heroHand = sampled;
        break;
    }
    if (!heroHand || !eligibility) {
        return { spot: null, rejected: true, reason: "Could not find eligible hand" };
    }
    // Recalculate classifications
    turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    const heroClass = (0, classify_1.classifyHeroHandOnBoard)(heroHand, board, turnType);
    const feats = (0, handFeatures_1.computeHandFeatures)(heroHand, board);
    const pairQuality = (0, classify_1.getPairQuality)(heroHand, board);
    const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, feats, pairQuality, turnType);
    // Pot math
    const prePot = 0.5 + 1.0 + 2.5 + 2.5; // SB+BB+open+call
    const sizings = flopMatrix.board_classes[flopClass]?.flop?.ip?.preferred_sizings || [50];
    const flopPct = (0, rng_1.pickOne)(rand, sizings);
    const flopBet = pctAmount(flopPct, prePot);
    const turnPot = Math.round((prePot + flopBet + flopBet) * 10000) / 10000;
    const effectiveStack = 100 - 2.5 - flopBet;
    // FIXED: Pass pairQuality to leverage computation
    const leverage = (0, leverage_1.computeLeverageProfile)({
        heroClass,
        handIntent,
        turnType,
        feats,
        board,
        hero: heroHand,
        pairQuality, // Pair depth awareness
    });
    // FIXED: Pass feats to betting mode (for wheel straight detection)
    const bettingMode = (0, leverage_1.inferBettingMode)({
        leverage,
        heroClass,
        handIntent,
        turnType,
        hero: heroHand,
        board,
        effectiveStack,
        pot: turnPot,
        feats: { hasStraight: feats.hasStraight, isWheelStraight: feats.isWheelStraight },
    });
    // FIXED: NodeIntent derived from bettingMode BEFORE frequency lookup
    const nodeIntent = (0, leverage_1.inferNodeIntentFromMode)(bettingMode, leverage, handIntent);
    // Build options
    let opts;
    let bestIdx = 0;
    if (!eligibility.canBarrelSmall && !eligibility.canBarrelLarge) {
        opts = [["x"]];
        bestIdx = 0;
    }
    else {
        // FIXED: Use getSizeSet with NO FALLBACK - invalid combinations must fail
        const sizeSet = (0, leverage_1.getSizeSet)(leverage, bettingMode);
        if (!sizeSet) {
            // Invalid leverage/mode combination - reject the spot
            return { spot: null, rejected: true, reason: `Invalid leverage/mode combo: ${leverage}/${bettingMode}` };
        }
        const [size1, size2] = sizeSet;
        const bet1Amount = pctAmount(size1, turnPot);
        const bet2Amount = pctAmount(size2, turnPot);
        const largestBetIsAllIn = (0, leverage_1.shouldBeAllIn)(bet2Amount, effectiveStack, turnPot);
        if (largestBetIsAllIn) {
            opts = [
                ["x"],
                ["b", size1, bet1Amount],
                ["a", effectiveStack],
            ];
        }
        else {
            opts = [
                ["x"],
                ["b", size1, bet1Amount],
                ["b", size2, bet2Amount],
            ];
        }
        // Best index based on mode
        if (bettingMode === "overbet") {
            bestIdx = heroClass === "monster" ? 2 : 1;
        }
        else {
            switch (leverage) {
                case "high":
                    bestIdx = handIntent === "made_value" ? 2 : 1;
                    break;
                case "medium":
                    bestIdx = 1;
                    break;
                case "low":
                    if (handIntent === "thin_value" && !feats.hasFlushDraw && feats.straightDraw === "none") {
                        bestIdx = 0;
                    }
                    else {
                        bestIdx = 1;
                    }
                    break;
            }
        }
    }
    // FIXED: Pass bettingMode to meta template
    const metaTemplate = (0, templates_1.getMetaTemplate)(handIntent, heroClass, feats, turnType, bettingMode);
    const concepts = (0, tags_1.clampList)((0, concepts_1.filterConcepts)(metaTemplate.concepts), tags_1.MAX_CONCEPTS);
    const tags = (0, tags_1.clampList)(["turn", "SRP", "IP", nodeIntent === "value" ? "value" : "barrel", flopClass], tags_1.MAX_TAGS);
    const solverNotes = metaTemplate.solverNotes.slice(0, 4);
    // Compute final difficulty
    const spotDifficulty = computeDifficulty(opts.length, handIntent, turnType, leverage, bettingMode);
    // Build history with correct format:
    // - Raise: [pos, "r", sizeRef (string), exactAmount]
    // - Call: [pos, "c", null, exactAmount]
    // - Bet: [pos, "b", sizeRef (number %), exactAmount]
    const hist = [
        ["UTG", "f"],
    ];
    // Add folds between hero and villain
    if (heroPosition === "MP") {
        hist.push(["MP", "r", "2.5x", 2.5]);
        hist.push(["CO", "f"]);
        hist.push(["BTN", "f"]);
        hist.push(["SB", "f"]);
        hist.push(["BB", "c", null, 2.5]);
    }
    else if (heroPosition === "CO") {
        hist.push(["MP", "f"]);
        hist.push(["CO", "r", "2.5x", 2.5]);
        hist.push(["BTN", "f"]);
        hist.push(["SB", "f"]);
        hist.push(["BB", "c", null, 2.5]);
    }
    else if (heroPosition === "BTN") {
        hist.push(["MP", "f"]);
        hist.push(["CO", "f"]);
        hist.push(["BTN", "r", "2.5x", 2.5]);
        hist.push(["SB", "f"]);
        hist.push(["BB", "c", null, 2.5]);
    }
    // Flop action
    hist.push(["BB", "x"]);
    hist.push([heroPosition, "b", flopPct, flopBet]);
    hist.push(["BB", "c", null, flopBet]);
    // Turn check
    hist.push(["BB", "x"]);
    // Frequencies
    const freqs = (0, baseFreqTable_1.lookupBaseFrequencies)(handIntent, turnType, nodeIntent, opts.length);
    // FIXED: Deterministic EV generation tied to bestIdx
    // EV decreases as you move away from best option - feels solver-like without lying
    const generateDeterministicEV = (numOpts, bestIndex) => {
        return Array.from({ length: numOpts }, (_, i) => {
            const distFromBest = Math.abs(i - bestIndex);
            return Math.round((2.0 - distFromBest * 0.4) * 10) / 10;
        });
    };
    const ev = generateDeterministicEV(opts.length, bestIdx);
    const spot = {
        id,
        fmt: "6m",
        str: "t",
        difficulty: spotDifficulty,
        tags,
        data: {
            id,
            st: 100,
            fmt: "6m",
            str: "t",
            hero: { pos: heroPosition, hand: heroHand },
            v: [villainPosition],
            brd: board,
            pot: turnPot,
            hist,
            opts,
            sol: { b: bestIdx, ev },
            meta: {
                concept: concepts,
                summary: metaTemplate.summary,
                solverNotes,
                freq: freqs,
            },
        },
    };
    return { spot, rejected: false };
}
function tryGenerateSrpTurnSpot(args) {
    return generateSrpTurnSpot(args);
}
