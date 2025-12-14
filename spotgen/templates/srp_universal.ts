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

import type { SpotOutputLike } from "../validator";
import { loadRFI, loadFacing, expandRFIRange, expandDefendingRange } from "../range/rangeIO";
import { enumerateCombos, type Card } from "../range/enumerateCombos";
import { mulberry32, pickOne } from "../util/rng";
import { clampList, MAX_CONCEPTS, MAX_TAGS } from "../tags";
import { classifyHeroHandOnBoard, getPairQuality } from "../poker/classify";
import { classifyTurn as classifyTurnCard } from "../poker/turnClassify";
import { computeHandFeatures } from "../poker/handFeatures";
import { classifyHandIntentWithContext } from "../poker/intent";
import { isEligibleForBarrelSpot } from "../poker/barrelEligibility";
import { valueOfRank, rankOf } from "../poker/ranks";
import { computeLeverageProfile, type LeverageProfile } from "../poker/leverage";

// ═══════════════════════════════════════════════════════════════════════════
// PHASE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Phase 1: Betting Context
import {
  computeBettingContext,
  type BettingContext,
  type Leverage,
} from "../poker/bettingContext";

// Phase 1.5: Line Builder (NEW - handles pot/history construction)
import {
  buildPostflopLine,
  type Position,
  type Street,
} from "../poker/lineBuilder";

// Phase 2: Option Builder
import {
  buildOptionsFromContext,
  buildSpotOpts,
  type DifficultyLevel,
} from "../poker/optionBuilder";

// Phase 3: Pedagogy
import {
  runPedagogyPhase,
  type PedagogyOutput,
  type DifficultyLevel as PedagogyDifficulty,
} from "../poker/pedagogy";

// Re-export types for external use
export type { Street, Position };

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UniversalConfig {
  repoRoot: string;
  id: string;
  seed: number;
  street: Street;
  heroPosition: Position;
  villainPosition: Position;
  heroIsIP: boolean;  // true if hero is in position
  difficulty?: number;
}

interface GenerateResult {
  spot: SpotOutputLike | null;
  rejected: boolean;
  reason?: string;
  linePattern?: string;  // Pattern ID for audit/debug (e.g., "standard_cbet", "oop_donk_flop")
}

type FlopClassKey =
  | "dry_Axx_highcard"
  | "dry_Kxx_Qxx"
  | "low_disconnected"
  | "medium_connected"
  | "monotone"
  | "paired";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["s", "h", "d", "c"];
const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Scenario Construction - NOT Poker Logic)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a random card
 */
function randomCard(rng: () => number, exclude: Set<string>): string {
  let card: string;
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
function classifyFlop(flop: string[]): FlopClassKey {
  const ranks = flop.map(c => rankOf(c));
  const suits = flop.map(c => c[1]);
  const values = ranks.map(r => valueOfRank(r));
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const spread = maxVal - minVal;

  if (new Set(ranks).size < 3) return "paired";
  if (new Set(suits).size === 1) return "monotone";
  if (maxVal >= 14) return "dry_Axx_highcard";
  if (maxVal >= 12) return "dry_Kxx_Qxx";
  if (spread <= 4) return "medium_connected";

  return "low_disconnected";
}

/**
 * Classify river card relative to turn board (READ-ONLY classification)
 */
function classifyRiver(board4: string[], riverCard: string): string {
  const boardRanks = board4.map(c => valueOfRank(rankOf(c)));
  const riverRank = valueOfRank(rankOf(riverCard));
  const boardSuits = board4.map(c => c[1]);
  const riverSuit = riverCard[1];

  const suitCounts: Record<string, number> = {};
  for (const s of boardSuits) suitCounts[s] = (suitCounts[s] || 0) + 1;
  if (suitCounts[riverSuit] >= 3) return "flush_completer";

  const allRanks = [...boardRanks, riverRank].sort((a, b) => a - b);
  for (let i = 0; i <= allRanks.length - 5; i++) {
    if (allRanks[i + 4] - allRanks[i] <= 4) return "straight_completer";
  }

  if (boardRanks.includes(riverRank)) return "paired_river";
  if (riverRank > Math.max(...boardRanks)) return "overcard_river";

  return "blank_river";
}

/**
 * Load hero's range based on position and action
 */
function loadHeroRange(repoRoot: string, heroPos: Position, villainPos: Position, heroIsOpener: boolean): string[] | null {
  try {
    if (heroIsOpener) {
      const rfiChart = loadRFI(heroPos.toLowerCase(), repoRoot);
      const classes = expandRFIRange(rfiChart);
      return classes.length > 0 ? classes : null;
    } else {
      const matchup = `${heroPos.toLowerCase()}_vs_${villainPos.toLowerCase()}`;
      const facingChart = loadFacing(matchup, repoRoot);
      const callClasses = expandDefendingRange(facingChart);
      return callClasses.length > 0 ? callClasses : null;
    }
  } catch {
    return null;
  }
}

/**
 * Convert LeverageProfile to Phase 1 Leverage type
 */
function leverageProfileToPhase1(profile: LeverageProfile): Leverage {
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
function numericToDifficulty(d: number): DifficultyLevel {
  if (d <= 3) return "easy";
  if (d <= 7) return "medium";
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
export function generateUniversalSrpSpot(config: UniversalConfig): GenerateResult {
  const { repoRoot, id, seed, street, heroPosition, villainPosition, heroIsIP, difficulty = 6 } = config;

  const rng = mulberry32(seed);

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
  const heroClass = pickOne(rng, heroClasses) as string;
  const combos = enumerateCombos(heroClass);
  if (combos.length === 0) {
    return { spot: null, rejected: true, reason: `No combos for hand class: ${heroClass}` };
  }
  const heroHand = pickOne(rng, combos) as [Card, Card];
  const usedCards = new Set<string>(heroHand);

  // Generate board
  const boardLength = street === "f" ? 3 : street === "t" ? 4 : 5;
  const board: string[] = [];
  for (let i = 0; i < boardLength; i++) {
    board.push(randomCard(rng, usedCards));
    usedCards.add(board[board.length - 1]);
  }

  const flop = board.slice(0, 3) as [string, string, string];
  const flopClass = classifyFlop(flop);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1.5: LINE BUILDER
  // Handles pot/history construction (was inline before)
  // ═══════════════════════════════════════════════════════════════════════

  const lineResult = buildPostflopLine({
    street,
    heroIsIP,
    heroPosition,
    villainPosition,
    heroIsOpener,
    rng,  // Pass seeded RNG for deterministic bet sizes
  });

  const { hist, pot, effectiveStack, flopBetPct, turnBetPct, pattern: linePattern } = lineResult;

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: HAND/BOARD CLASSIFICATION (READ-ONLY)
  // ═══════════════════════════════════════════════════════════════════════

  type TurnType = "blank_turn" | "overcard_turn" | "straight_completer" | "flush_completer" | "paired_turn";
  let turnType: TurnType = "blank_turn";
  if (street !== "f" && board.length >= 4) {
    turnType = classifyTurnCard(flop, board[3] as Card) as TurnType;
  }

  let riverType = "blank_river";
  if (street === "r" && board.length === 5) {
    riverType = classifyRiver(board.slice(0, 4), board[4]);
  }

  // Hand classification
  const pairQuality = getPairQuality(heroHand, board);
  const heroStrength = classifyHeroHandOnBoard(heroHand, board, turnType);
  const feats = computeHandFeatures(heroHand, board);
  const handIntent = classifyHandIntentWithContext(heroStrength, feats, pairQuality, turnType);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: ELIGIBILITY GATING
  // ═══════════════════════════════════════════════════════════════════════

  const boardRanks = board.map(c => valueOfRank(rankOf(c)));

  if (!isEligibleForBarrelSpot(heroStrength, feats, turnType, boardRanks)) {
    return { spot: null, rejected: true, reason: "Hand not eligible for barrel" };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: COMPUTE LEVERAGE (Input to Phase 1)
  // ═══════════════════════════════════════════════════════════════════════

  const leverageProfile = computeLeverageProfile({
    heroClass: heroStrength,
    handIntent,
    turnType: turnType as any,
    feats,
    board,
    hero: heroHand,
    pairQuality,
  });

  const leverage: Leverage = leverageProfileToPhase1(leverageProfile);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: BETTING CONTEXT
  // Answers: "What betting is structurally allowed?"
  // NOTE: Advantage inference now happens INSIDE Phase 1
  // ═══════════════════════════════════════════════════════════════════════

  const bettingContext: BettingContext = computeBettingContext({
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

  const isStructurallyInvalidNode = (
    street === "r" &&
    !heroIsIP &&
    bettingContext.checkDominant &&
    !bettingContext.allowsSmallBet &&
    !bettingContext.allowsLargeBet
  );

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

  const difficultyLevel: DifficultyLevel = numericToDifficulty(difficulty);

  const optionResult = buildOptionsFromContext({
    context: bettingContext,
    difficulty: difficultyLevel,
  });

  // Convert ActionIntent[] to actual spot options
  const opts = buildSpotOpts(optionResult.opts, pot) as any[];
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

  const isTrivialNode = (
    bettingContext.checkDominant &&
    street === "r" &&
    optionResult.bestIdx === 0 &&
    !bettingContext.nutAdvantage &&
    (bettingContext.leverage === "none" || bettingContext.leverage === "low")
  );

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

  const pedagogyResult: PedagogyOutput = runPedagogyPhase({
    options: {
      opts: optionResult.opts,
      bestIdx: optionResult.bestIdx,
    },
    bettingContext,
    handIntent: handIntent as any,
    street,
    difficulty: difficultyLevel as PedagogyDifficulty,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: ASSEMBLE FINAL SPOT JSON
  // ═══════════════════════════════════════════════════════════════════════

  // Tags (simple classification, not poker logic)
  const streetTag = street === "f" ? "flop" : street === "t" ? "turn" : "river";
  const positionTag = heroIsIP ? "IP" : "OOP";
  const tags = clampList([streetTag, "SRP", positionTag, flopClass], MAX_TAGS);

  const spot: SpotOutputLike = {
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
      hist: hist as any,
      opts,
      sol: { b: bestIdx, ev: pedagogyResult.ev },
      meta: {
        concept: clampList(pedagogyResult.meta.concepts, MAX_CONCEPTS),
        summary: pedagogyResult.meta.summary,
        solverNotes: pedagogyResult.meta.solverNotes.slice(0, 4),
        freq: pedagogyResult.freq,
      },
    },
  };

  return { 
    spot, 
    rejected: false,
    linePattern: linePattern.id,  // Expose pattern for audit/debug
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Try to generate a spot, with retries for rejection
 */
export function tryGenerateUniversalSpot(config: UniversalConfig, maxRetries = 20): GenerateResult {
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
