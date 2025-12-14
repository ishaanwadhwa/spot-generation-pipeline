"use strict";
/**
 * spotgen/templates/srp_universal.ts
 *
 * Universal SRP (Single Raised Pot) Template
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE: This is a PURE ORCHESTRATION LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This template is responsible for:
 * 1. Constructing a valid SRP scenario (hand, board)
 * 2. Calling Phase 1 → Phase 2 → Phase 3 in order
 * 3. Assembling the final Spot JSON
 *
 * This template contains NO:
 * - Betting rules (→ Phase 1)
 * - Sizing rules (→ Phase 2)
 * - Difficulty heuristics (→ Phase 2)
 * - Meta selection logic (→ Phase 3)
 * - Frequency tables (→ Phase 3)
 * - EV heuristics (→ Phase 3)
 * - Pot geometry calculation (→ lineBuilder.ts)
 * - Advantage inference (→ bettingContext.ts)
 *
 * Supports:
 * - Any IP vs OOP matchup
 * - Any street (flop, turn, river)
 * - Hero as opener or defender
 * - Flexible position configurations
 * ═══════════════════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniversalSrpSpot = generateUniversalSrpSpot;
exports.tryGenerateUniversalSpot = tryGenerateUniversalSpot;
const rangeIO_1 = require("../range/rangeIO");
const enumerateCombos_1 = require("../range/enumerateCombos");
const rng_1 = require("../util/rng");
const tags_1 = require("../tags");
const classify_1 = require("../poker/classify");
const turnClassify_1 = require("../poker/turnClassify");
const handFeatures_1 = require("../poker/handFeatures");
const intent_1 = require("../poker/intent");
const barrelEligibility_1 = require("../poker/barrelEligibility");
const ranks_1 = require("../poker/ranks");
const leverage_1 = require("../poker/leverage");
// ═══════════════════════════════════════════════════════════════════════════
// PHASE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
// Phase 1: Betting Context
const bettingContext_1 = require("../poker/bettingContext");
// Phase 1.5: Line Builder (NEW - handles pot/history construction)
const lineBuilder_1 = require("../poker/lineBuilder");
// Phase 2: Option Builder
const optionBuilder_1 = require("../poker/optionBuilder");
// Phase 3: Pedagogy
const pedagogy_1 = require("../poker/pedagogy");
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["s", "h", "d", "c"];
const POSITIONS = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Scenario Construction - NOT Poker Logic)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate a random card
 */
function randomCard(rng, exclude) {
    let card;
    do {
        const rank = RANKS[Math.floor(rng() * RANKS.length)];
        const suit = SUITS[Math.floor(rng() * SUITS.length)];
        card = rank + suit;
    } while (exclude.has(card));
    return card;
}
/**
 * Get flop class based on board texture (READ-ONLY classification)
 */
function classifyFlop(flop) {
    const ranks = flop.map(c => (0, ranks_1.rankOf)(c));
    const suits = flop.map(c => c[1]);
    const values = ranks.map(r => (0, ranks_1.valueOfRank)(r));
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const spread = maxVal - minVal;
    if (new Set(ranks).size < 3)
        return "paired";
    if (new Set(suits).size === 1)
        return "monotone";
    if (maxVal >= 14)
        return "dry_Axx_highcard";
    if (maxVal >= 12)
        return "dry_Kxx_Qxx";
    if (spread <= 4)
        return "medium_connected";
    return "low_disconnected";
}
/**
 * Classify river card relative to turn board (READ-ONLY classification)
 */
function classifyRiver(board4, riverCard) {
    const boardRanks = board4.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    const riverRank = (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(riverCard));
    const boardSuits = board4.map(c => c[1]);
    const riverSuit = riverCard[1];
    const suitCounts = {};
    for (const s of boardSuits)
        suitCounts[s] = (suitCounts[s] || 0) + 1;
    if (suitCounts[riverSuit] >= 3)
        return "flush_completer";
    const allRanks = [...boardRanks, riverRank].sort((a, b) => a - b);
    for (let i = 0; i <= allRanks.length - 5; i++) {
        if (allRanks[i + 4] - allRanks[i] <= 4)
            return "straight_completer";
    }
    if (boardRanks.includes(riverRank))
        return "paired_river";
    if (riverRank > Math.max(...boardRanks))
        return "overcard_river";
    return "blank_river";
}
/**
 * Load hero's range based on position and action
 */
function loadHeroRange(repoRoot, heroPos, villainPos, heroIsOpener) {
    try {
        if (heroIsOpener) {
            const rfiChart = (0, rangeIO_1.loadRFI)(heroPos.toLowerCase(), repoRoot);
            const classes = (0, rangeIO_1.expandRFIRange)(rfiChart);
            return classes.length > 0 ? classes : null;
        }
        else {
            const matchup = `${heroPos.toLowerCase()}_vs_${villainPos.toLowerCase()}`;
            const facingChart = (0, rangeIO_1.loadFacing)(matchup, repoRoot);
            const callClasses = (0, rangeIO_1.expandDefendingRange)(facingChart);
            return callClasses.length > 0 ? callClasses : null;
        }
    }
    catch {
        return null;
    }
}
/**
 * Convert LeverageProfile to Phase 1 Leverage type
 */
function leverageProfileToPhase1(profile) {
    switch (profile) {
        case "high": return "high";
        case "medium": return "medium";
        case "low": return "low";
        default: return "none";
    }
}
/**
 * Convert numeric difficulty to DifficultyLevel
 */
function numericToDifficulty(d) {
    if (d <= 3)
        return "easy";
    if (d <= 7)
        return "medium";
    return "hard";
}
// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Universal SRP spot generator
 *
 * This is a PURE ORCHESTRATION function that:
 * 1. Constructs the scenario (hand, board)
 * 2. Classifies hand/board features (READ-ONLY)
 * 3. Calls Phase 1.5 → Phase 1 → Phase 2 → Phase 3
 * 4. Assembles final Spot JSON
 */
function generateUniversalSrpSpot(config) {
    const { repoRoot, id, seed, street, heroPosition, villainPosition, heroIsIP, difficulty = 6 } = config;
    const rng = (0, rng_1.mulberry32)(seed);
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: SCENARIO CONSTRUCTION (Hand & Board)
    // ═══════════════════════════════════════════════════════════════════════
    const heroIsOpener = POSITIONS.indexOf(heroPosition) < POSITIONS.indexOf(villainPosition) ||
        (heroPosition === "SB" && villainPosition === "BB");
    // Load hero's range
    const heroClasses = loadHeroRange(repoRoot, heroPosition, villainPosition, heroIsOpener);
    if (!heroClasses || heroClasses.length === 0) {
        return { spot: null, rejected: true, reason: `No range found for ${heroPosition} ${heroIsOpener ? "opening" : "defending"}` };
    }
    // Sample a hero hand
    const heroClass = (0, rng_1.pickOne)(rng, heroClasses);
    const combos = (0, enumerateCombos_1.enumerateCombos)(heroClass);
    if (combos.length === 0) {
        return { spot: null, rejected: true, reason: `No combos for hand class: ${heroClass}` };
    }
    const heroHand = (0, rng_1.pickOne)(rng, combos);
    const usedCards = new Set(heroHand);
    // Generate board
    const boardLength = street === "f" ? 3 : street === "t" ? 4 : 5;
    const board = [];
    for (let i = 0; i < boardLength; i++) {
        board.push(randomCard(rng, usedCards));
        usedCards.add(board[board.length - 1]);
    }
    const flop = board.slice(0, 3);
    const flopClass = classifyFlop(flop);
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1.5: LINE BUILDER
    // Handles pot/history construction (was inline before)
    // ═══════════════════════════════════════════════════════════════════════
    const lineResult = (0, lineBuilder_1.buildPostflopLine)({
        street,
        heroIsIP,
        heroPosition,
        villainPosition,
        heroIsOpener,
        rng, // Pass seeded RNG for deterministic bet sizes
    });
    const { hist, pot, effectiveStack, flopBetPct, turnBetPct, pattern: linePattern } = lineResult;
    let turnType = "blank_turn";
    if (street !== "f" && board.length >= 4) {
        turnType = (0, turnClassify_1.classifyTurn)(flop, board[3]);
    }
    let riverType = "blank_river";
    if (street === "r" && board.length === 5) {
        riverType = classifyRiver(board.slice(0, 4), board[4]);
    }
    // Hand classification
    const pairQuality = (0, classify_1.getPairQuality)(heroHand, board);
    const heroStrength = (0, classify_1.classifyHeroHandOnBoard)(heroHand, board, turnType);
    const feats = (0, handFeatures_1.computeHandFeatures)(heroHand, board);
    const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroStrength, feats, pairQuality, turnType);
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: ELIGIBILITY GATING
    // ═══════════════════════════════════════════════════════════════════════
    const boardRanks = board.map(c => (0, ranks_1.valueOfRank)((0, ranks_1.rankOf)(c)));
    if (!(0, barrelEligibility_1.isEligibleForBarrelSpot)(heroStrength, feats, turnType, boardRanks)) {
        return { spot: null, rejected: true, reason: "Hand not eligible for barrel" };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: COMPUTE LEVERAGE (Input to Phase 1)
    // ═══════════════════════════════════════════════════════════════════════
    const leverageProfile = (0, leverage_1.computeLeverageProfile)({
        heroClass: heroStrength,
        handIntent,
        turnType: turnType,
        feats,
        board,
        hero: heroHand,
        pairQuality,
    });
    const leverage = leverageProfileToPhase1(leverageProfile);
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: BETTING CONTEXT
    // Answers: "What betting is structurally allowed?"
    // NOTE: Advantage inference now happens INSIDE Phase 1
    // ═══════════════════════════════════════════════════════════════════════
    const bettingContext = (0, bettingContext_1.computeBettingContext)({
        street,
        heroIsIP,
        leverage,
        effectiveStack,
        pot,
        // NEW: Pass raw inputs for advantage inference
        heroIsOpener,
        heroClass: heroStrength,
        handFeatures: { hasStraight: feats.hasStraight, hasFlush: false },
    });
    // ═══════════════════════════════════════════════════════════════════════
    // HARD REJECTION GATE (Fix B) — BEFORE Phase 2
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Rule: If ALL of the following are true:
    //   - street === "r" (river)
    //   - heroIsIP === false (OOP)
    //   - checkDominant === true
    //   - allowsSmallBet === false
    //   - allowsLargeBet === false
    //
    // Then: REJECT IMMEDIATELY
    //
    // WHY: This is a structurally invalid node. No betting is allowed,
    // check is the only option. Generating options and pedagogy would
    // produce a misleading spot. This is NOT a teaching opportunity.
    //
    // This gate runs BEFORE Phase 2 because there's no point building
    // options for a node where betting is structurally impossible.
    // ═══════════════════════════════════════════════════════════════════════
    const isStructurallyInvalidNode = (street === "r" &&
        !heroIsIP &&
        bettingContext.checkDominant &&
        !bettingContext.allowsSmallBet &&
        !bettingContext.allowsLargeBet);
    if (isStructurallyInvalidNode) {
        return {
            spot: null,
            rejected: true,
            reason: "Hard rejection: river OOP with no betting allowed (structurally invalid node)",
        };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: OPTION BUILDER
    // Answers: "Which 3 options should the user see?"
    // ═══════════════════════════════════════════════════════════════════════
    const difficultyLevel = numericToDifficulty(difficulty);
    const optionResult = (0, optionBuilder_1.buildOptionsFromContext)({
        context: bettingContext,
        difficulty: difficultyLevel,
    });
    // Convert ActionIntent[] to actual spot options
    const opts = (0, optionBuilder_1.buildSpotOpts)(optionResult.opts, pot);
    const bestIdx = optionResult.bestIdx;
    // ═══════════════════════════════════════════════════════════════════════
    // SURVIVOR GATE (Between Phase 2 and Phase 3)
    // ═══════════════════════════════════════════════════════════════════════
    //
    // PURPOSE: Curriculum quality control
    //
    // This gate rejects spots that are STRUCTURALLY VALID but NOT WORTH TEACHING.
    //
    // Key distinction:
    // - Phase 1 (bettingContext): Determines what betting is ALLOWED (poker logic)
    // - Phase 2 (optionBuilder): Always builds exactly 3 options
    // - Survivor Gate: Decides if the spot is PEDAGOGICALLY USEFUL
    // - Phase 3 (pedagogy): Teaches the spot (meta, frequencies, EVs)
    //
    // This is NOT:
    // ❌ Poker logic (that's Phase 1)
    // ❌ Option logic (that's Phase 2)
    // ❌ Pedagogy (that's Phase 3)
    //
    // This IS:
    // ✅ Curriculum quality control - "Is this spot worth showing to a student?"
    //
    // REJECTION CRITERIA (all must be true):
    // 1. checkDominant === true (betting is not structurally encouraged)
    // 2. street === "r" (river only - turn spots may have equity denial value)
    // 3. bestIdx === 0 (check is the anchor action)
    // 4. nutAdvantage === false (hero doesn't have the nuts)
    // 5. leverage === "none" or "low" (no pressure capability)
    //
    // WHY: A river spot where check is obviously best, with no nut advantage
    // and no leverage, teaches nothing valuable. It's just "check and pray."
    // ═══════════════════════════════════════════════════════════════════════
    const isTrivialNode = (bettingContext.checkDominant &&
        street === "r" &&
        optionResult.bestIdx === 0 &&
        !bettingContext.nutAdvantage &&
        (bettingContext.leverage === "none" || bettingContext.leverage === "low"));
    if (isTrivialNode) {
        return {
            spot: null,
            rejected: true,
            reason: "Survivor gate: trivial river node (check dominant, no leverage, no nut advantage)",
        };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: PEDAGOGY
    // Answers: "How should we TEACH this spot?"
    // ═══════════════════════════════════════════════════════════════════════
    const pedagogyResult = (0, pedagogy_1.runPedagogyPhase)({
        options: {
            opts: optionResult.opts,
            bestIdx: optionResult.bestIdx,
        },
        bettingContext,
        handIntent: handIntent,
        street,
        difficulty: difficultyLevel,
    });
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: ASSEMBLE FINAL SPOT JSON
    // ═══════════════════════════════════════════════════════════════════════
    // Tags (simple classification, not poker logic)
    const streetTag = street === "f" ? "flop" : street === "t" ? "turn" : "river";
    const positionTag = heroIsIP ? "IP" : "OOP";
    const tags = (0, tags_1.clampList)([streetTag, "SRP", positionTag, flopClass], tags_1.MAX_TAGS);
    const spot = {
        id,
        fmt: "6m",
        str: street,
        difficulty,
        tags,
        data: {
            id,
            st: 100,
            fmt: "6m",
            str: street,
            hero: { pos: heroPosition, hand: heroHand },
            v: [villainPosition],
            brd: board,
            pot,
            hist: hist,
            opts,
            sol: { b: bestIdx, ev: pedagogyResult.ev },
            meta: {
                concept: (0, tags_1.clampList)(pedagogyResult.meta.concepts, tags_1.MAX_CONCEPTS),
                summary: pedagogyResult.meta.summary,
                solverNotes: pedagogyResult.meta.solverNotes.slice(0, 4),
                freq: pedagogyResult.freq,
            },
        },
    };
    return {
        spot,
        rejected: false,
        linePattern: linePattern.id, // Expose pattern for audit/debug
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// RETRY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Try to generate a spot, with retries for rejection
 */
function tryGenerateUniversalSpot(config, maxRetries = 20) {
    for (let i = 0; i < maxRetries; i++) {
        const result = generateUniversalSrpSpot({ ...config, seed: config.seed + i });
        if (!result.rejected && result.spot) {
            return result;
        }
    }
    return { spot: null, rejected: true, reason: "Max retries exceeded" };
}
// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CODE (COMMENTED OUT - Preserved for Reference)
// ═══════════════════════════════════════════════════════════════════════════
/*
 * ❌ Legacy pot calculation — replaced by Phase 1.5 (lineBuilder.ts)
 *
 * function calculatePot(street: Street, flopBetPct: number, turnBetPct?: number): { pot: number; flopBet: number; turnBet?: number } {
 *   const prePot = 6.5;
 *   const flopBet = Math.round(prePot * flopBetPct / 100 * 10000) / 10000;
 *   const postFlopPot = prePot + flopBet * 2;
 *
 *   if (street === "f") {
 *     return { pot: prePot, flopBet: 0 };
 *   }
 *
 *   if (street === "t") {
 *     return { pot: postFlopPot, flopBet };
 *   }
 *
 *   const turnBet = turnBetPct ? Math.round(postFlopPot * turnBetPct / 100 * 10000) / 10000 : 0;
 *   const riverPot = postFlopPot + turnBet * 2;
 *   return { pot: riverPot, flopBet, turnBet };
 * }
 */
/*
 * ❌ Legacy preflop history builder — replaced by Phase 1.5 (lineBuilder.ts)
 *
 * function buildPreflopHistory(heroPos: Position, villainPos: Position, heroIsOpener: boolean): any[] {
 *   const positions: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
 *   const hist: any[] = [];
 *   ...
 * }
 */
/*
 * ❌ Legacy advantage inference — replaced by Phase 1 (bettingContext.ts)
 *
 * function inferRangeAdvantage(heroIsOpener: boolean, heroIsIP: boolean): RangeAdvantage {
 *   if (heroIsOpener && heroIsIP) return "hero";
 *   if (heroIsOpener) return "hero";
 *   if (!heroIsOpener && !heroIsIP) return "villain";
 *   return "neutral";
 * }
 *
 * function inferNutAdvantage(heroClass: string, feats: { hasStraight: boolean; hasFlush: boolean }): boolean {
 *   return heroClass === "monster" || feats.hasStraight || feats.hasFlush;
 * }
 */
/*
 * ❌ Legacy flopBetPct / turnBetPct selection — now in lineBuilder.ts
 *
 * const flopPcts = [33, 50, 66, 75];
 * const flopPct = pickOne(rng, flopPcts) as number;
 * ...
 * let turnPct = 0;
 * if (street === "r") {
 *   turnPct = pickOne(rng, [50, 66, 75]) as number;
 * }
 */
/*
 * ❌ Legacy effective stack calculation — now in lineBuilder.ts
 *
 * const effectiveStack = 100 - 2.5 - (flopBet || 0) - (turnBet || 0);
 */
/*
 * ❌ Legacy postflop history construction — now in lineBuilder.ts
 *
 * hist.push(["-", "f"]);
 * if (street !== "f") {
 *   const oopPos = heroIsIP ? villainPosition : heroPosition;
 *   const ipPos = heroIsIP ? heroPosition : villainPosition;
 *   hist.push([oopPos, "x"]);
 *   hist.push([ipPos, "b", flopPct, flopBet]);
 *   hist.push([oopPos, "c", null, flopBet]);
 * }
 * ...
 */
