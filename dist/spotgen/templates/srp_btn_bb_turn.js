"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSrpBtnBbTurnSpot = generateSrpBtnBbTurnSpot;
exports.tryGenerateSrpBtnBbTurnSpot = tryGenerateSrpBtnBbTurnSpot;
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
function loadFlopMatrix(repoRoot) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path_1.default.join(repoRoot, "theory", "postflop", "solver_truth", "flop_matrix.json"));
}
function pctAmount(pct, pot) {
    // exactAmount should be unrounded math; we keep up to 4 decimals to avoid float drift in JSON.
    return Math.round(((pct / 100) * pot) * 10000) / 10000;
}
// Minimal curated boards to guarantee correct texture-class assignment (extend later).
const FLOPS = {
    low_disconnected: ["7h3d2c", "5d4c2s", "8c5d2h", "9d4c2s"],
    dry_Axx_highcard: ["Ah7d2c", "As3d9c"],
    dry_Kxx_Qxx: ["Kc3d2s", "Qh7c2d"],
    medium_connected: ["Td9c8s", "9h8d7c"],
    wet_two_suited: ["9h7h6d", "JhTh9d"],
    monotone: ["Kc8c2c", "AdJd7d"],
    paired_board: ["QsQd3c", "7h7c2d"],
    two_tone: ["Kh9h4c", "Tc7c3d"],
    rainbow_connected: ["JdTc9s", "8c7d6s"]
};
function parseBoard3(s) {
    return [s.slice(0, 2), s.slice(2, 4), s.slice(4, 6)];
}
// Turn cards by category for more controlled generation
const BLANK_TURNS = ["4d", "3s", "5h", "2d", "6c"];
const OVERCARD_TURNS = ["Kd", "Qh", "Jc", "As"];
function pickTurnCard(rand, flop, preferBlank) {
    const used = new Set(flop.map(c => c.toLowerCase()));
    // If we prefer blank, pick from blank candidates first
    if (preferBlank) {
        const blanks = BLANK_TURNS.filter(c => !used.has(c.toLowerCase()));
        if (blanks.length > 0)
            return (0, rng_1.pickOne)(rand, blanks);
    }
    // Otherwise pick from overcards or fallback
    const overcards = OVERCARD_TURNS.filter(c => !used.has(c.toLowerCase()));
    if (overcards.length > 0)
        return (0, rng_1.pickOne)(rand, overcards);
    // Ultimate fallback
    const candidates = ["9d", "6s", "Jh", "Qc", "Td", "8s"];
    for (const c of candidates)
        if (!used.has(c.toLowerCase()))
            return c;
    return "9d";
}
/**
 * Generate a SRP BTN vs BB turn decision spot.
 *
 * This version includes pre-filtering:
 * - Checks barrel eligibility before accepting a hand
 * - Uses deterministic meta templates
 * - Returns null if unable to generate a valid spot within constraints
 */
function generateSrpBtnBbTurnSpot(args) {
    const result = tryGenerateSrpBtnBbTurnSpot(args);
    if (!result.spot) {
        // Fallback: use a safe default spot
        throw new Error(`Failed to generate spot: ${result.reason}`);
    }
    return result.spot;
}
/**
 * Try to generate a spot, returns null if constraints can't be satisfied.
 */
function tryGenerateSrpBtnBbTurnSpot(args) {
    const rand = (0, rng_1.mulberry32)(args.seed);
    // Preflop ranges (grounded to charts)
    const btnRfi = (0, rangeIO_1.loadRFI)("btn", args.repoRoot);
    const bbVsBtn = (0, rangeIO_1.loadFacing)("bb_vs_btn", args.repoRoot);
    const heroClasses = [
        ...(0, rangeIO_1.expandBucket)(btnRfi, "pairs"),
        ...(0, rangeIO_1.expandBucket)(btnRfi, "suited"),
        ...(0, rangeIO_1.expandBucket)(btnRfi, "offsuit"),
    ];
    const flopMatrix = loadFlopMatrix(args.repoRoot);
    // BB defense check
    if ((0, rangeIO_1.expandBucket)(bbVsBtn, "call").length === 0) {
        return { spot: null, rejected: true, reason: "BB vs BTN call bucket is empty" };
    }
    // constrained sampling loop
    let flop = parseBoard3((0, rng_1.pickOne)(rand, FLOPS[args.flopClass]));
    let turn = pickTurnCard(rand, flop, true);
    let turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    let heroHand = null;
    let eligibility = null;
    const wantValueIntent = args.constraints?.intent === "value";
    for (let attempt = 0; attempt < 500; attempt++) {
        flop = parseBoard3((0, rng_1.pickOne)(rand, FLOPS[args.flopClass]));
        // Prefer blank turns for barrel spots
        const preferBlank = !wantValueIntent;
        turn = pickTurnCard(rand, flop, preferBlank);
        turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
        // If constraints require specific turn type
        if (args.constraints?.requireTurnType && turnType !== args.constraints.requireTurnType)
            continue;
        const board = [...flop, turn];
        const boardCards = new Set(board);
        const boardRanks = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
        const preferredClasses = heroClasses.filter((h) => typeof h === "string");
        let sampled = null;
        for (let tries = 0; tries < 200 && !sampled; tries++) {
            const hc = (0, rng_1.pickOne)(rand, preferredClasses);
            const combos = (0, enumerateCombos_1.enumerateCombos)(hc);
            if (combos.length === 0)
                continue;
            const viable = combos.filter(([c1, c2]) => !boardCards.has(c1) && !boardCards.has(c2));
            if (viable.length === 0)
                continue;
            const [c1, c2] = (0, rng_1.pickOne)(rand, viable);
            sampled = [c1, c2];
        }
        if (!sampled)
            continue;
        // PHASE 1.1: Use context-aware classification with turnType
        const heroClass = (0, classify_1.classifyHeroHandOnBoard)(sampled, board, turnType);
        // Check if hero class is avoided by constraints
        if (args.constraints?.avoidHeroClasses?.includes(heroClass))
            continue;
        const feats = (0, handFeatures_1.computeHandFeatures)(sampled, board);
        const pairQuality = (0, classify_1.getPairQuality)(sampled, board);
        const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, feats, pairQuality, turnType);
        // PHASE 1.1: Reject "give_up" hands - they should not be in barrel spots
        // WHY: Bottom pair on dangerous turns should not be offered bet options
        if (handIntent === "give_up") {
            continue; // Resample - this hand shouldn't be in a decision spot
        }
        // --- KEY ELIGIBILITY CHECK ---
        // Check if this hand is eligible for a barrel spot
        if (!(0, barrelEligibility_1.isEligibleForBarrelSpot)(heroClass, feats, turnType, boardRanks)) {
            continue; // Reject and resample
        }
        eligibility = (0, barrelEligibility_1.checkBarrelEligibility)(heroClass, feats, turnType, boardRanks);
        // If we want value intent but hand isn't strong enough for value
        if (wantValueIntent && (heroClass !== "monster" && heroClass !== "strong_value")) {
            continue;
        }
        // If hand can only check, it's not suitable for a turn decision spot
        if (!eligibility.canBarrelSmall && !eligibility.canBarrelLarge) {
            continue;
        }
        heroHand = sampled;
        break;
    }
    if (!heroHand || !eligibility) {
        return { spot: null, rejected: true, reason: "Could not find eligible hand within constraints" };
    }
    // Recalculate classifications for final hand
    // PHASE 1.1: Use context-aware classification
    const board = [...flop, turn];
    const boardRanks = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    const heroClass = (0, classify_1.classifyHeroHandOnBoard)(heroHand, board, turnType);
    const feats = (0, handFeatures_1.computeHandFeatures)(heroHand, board);
    const pairQuality = (0, classify_1.getPairQuality)(heroHand, board);
    const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, feats, pairQuality, turnType);
    // Pot math convention (matches validator): pot starts with blinds and adds exact contributions.
    const prePot = 0.5 + 1.0 + 2.5 + 2.5; // SB+BB+open+call
    const flopPct = (0, rng_1.pickOne)(rand, flopMatrix.board_classes[args.flopClass].flop.ip.preferred_sizings);
    const flopBet = pctAmount(flopPct, prePot);
    const turnPot = Math.round((prePot + flopBet + flopBet) * 10000) / 10000;
    // --- BUILD OPTIONS BASED ON LEVERAGE + BETTING MODE ---
    //
    // TWO AXES:
    // 1. LeverageProfile (low/medium/high) = pressure capability
    // 2. BettingMode (standard/overbet) = strategic regime
    //
    // OVERBET MODE is NOT "bigger bets" - it's a different game:
    // - Standard: Value / pressure, targets medium-strength hands
    // - Overbet: Range collapse, targets bluff-catchers, polarized only
    //
    // BarrelEligibility is used only as a GATE (can we bet at all?)
    // Calculate effective stack (starting stack minus all contributions)
    const effectiveStack = 100 - 2.5 - flopBet; // Start - open - flop bet
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
    // This ensures frequencies align with option semantics
    const nodeIntent = (0, leverage_1.inferNodeIntentFromMode)(bettingMode, leverage, handIntent);
    let opts;
    let bestIdx = 0;
    // Gate: If barrel eligibility says no betting, only offer check
    if (!eligibility.canBarrelSmall && !eligibility.canBarrelLarge) {
        opts = [["x"]];
        bestIdx = 0;
    }
    else {
        // FIXED: Use getSizeSet with NO FALLBACK - invalid combinations must fail
        const sizeSet = (0, leverage_1.getSizeSet)(leverage, bettingMode);
        if (!sizeSet) {
            // Invalid leverage/mode combination - reject the spot, don't silently fallback
            return { spot: null, rejected: true, reason: `Invalid leverage/mode combo: ${leverage}/${bettingMode}` };
        }
        const [size1, size2] = sizeSet;
        // Calculate bet amounts
        const bet1Amount = pctAmount(size1, turnPot);
        const bet2Amount = pctAmount(size2, turnPot);
        // Check if largest bet should become all-in
        const remainingStack = effectiveStack;
        const largestBetIsAllIn = (0, leverage_1.shouldBeAllIn)(bet2Amount, remainingStack, turnPot);
        if (largestBetIsAllIn) {
            // Replace largest bet with all-in
            opts = [
                ["x"],
                ["b", size1, bet1Amount],
                ["a", remainingStack],
            ];
        }
        else {
            // Standard option set
            opts = [
                ["x"],
                ["b", size1, bet1Amount],
                ["b", size2, bet2Amount],
            ];
        }
        // Determine best index based on hand intent and mode
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
    // FIXED: Pass bettingMode to meta template for alignment
    const metaTemplate = (0, templates_1.getMetaTemplate)(handIntent, heroClass, feats, turnType, bettingMode);
    const concepts = (0, tags_1.clampList)((0, concepts_1.filterConcepts)(metaTemplate.concepts), tags_1.MAX_CONCEPTS);
    const tags = (0, tags_1.clampList)(["turn", "SRP", "IP", nodeIntent === "value" ? "value" : "barrel", args.flopClass], tags_1.MAX_TAGS);
    // Build solver notes from template
    const solverNotes = metaTemplate.solverNotes.slice(0, 4);
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
        id: args.id,
        fmt: "6m",
        str: "t",
        difficulty: computeDifficulty(opts.length, handIntent, turnType),
        tags,
        data: {
            id: args.id,
            st: 100,
            fmt: "6m",
            str: "t",
            hero: { pos: "BTN", hand: heroHand },
            v: ["BB"],
            brd: [...flop, turn],
            pot: turnPot,
            hist: [
                ["UTG", "f"],
                ["MP", "f"],
                ["CO", "f"],
                ["BTN", "r", "2.5x", 2.5],
                ["SB", "f"],
                ["BB", "c", null, 2.5],
                ["-", "f"],
                ["BB", "x"],
                ["BTN", "b", flopPct, flopBet],
                ["BB", "c", null, flopBet],
                ["-", "t"],
                ["BB", "x"],
            ],
            opts: opts,
            sol: { b: bestIdx, ev },
            meta: {
                concept: concepts,
                summary: metaTemplate.summary,
                solverNotes,
                // Phase 1: Deterministic frequency lookup from baseFreqTable
                freq: (0, baseFreqTable_1.lookupBaseFrequencies)(handIntent, turnType, nodeIntent, opts.length),
            },
        },
    };
    return { spot, rejected: false };
}
/**
 * Compute difficulty based on hand complexity and turn type.
 *
 * RULE: All spots now have 3+ options, so base difficulty starts at 5.
 * Additional complexity from hand type and board texture.
 */
function computeDifficulty(_numOptions, handIntent, turnType) {
    // Base: 3+ options always, mixed frequencies
    let base = 5;
    // Combo draws are hardest (high equity, multiple lines valid)
    if (handIntent === "combo_draw")
        base += 2;
    // Thin value is tricky (protection vs pot control)
    if (handIntent === "thin_value")
        base += 1;
    // Pure draws have simpler logic
    if (handIntent === "draw")
        base += 1;
    // Non-blank turns add complexity (dynamics change)
    if (turnType === "straight_completer" || turnType === "flush_completer")
        base += 1;
    if (turnType === "paired_turn")
        base += 1;
    if (turnType === "overcard_turn")
        base += 1;
    return Math.min(Math.max(base, 4), 10);
}
// generateFrequencies removed in Phase 1
// Frequencies now come from lookupBaseFrequencies() in frequencies/baseFreqTable.ts
