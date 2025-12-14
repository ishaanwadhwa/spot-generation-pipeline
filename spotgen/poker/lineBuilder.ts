/**
 * poker/lineBuilder.ts
 *
 * PHASE 1.5: Line Construction
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module handles ALL betting line construction for SRP spots:
 * - Preflop history (folds, opens, calls)
 * - Postflop action (checks, bets, calls)
 * - Pot geometry calculation
 * - Effective stack calculation
 *
 * This logic was extracted from srp_universal.ts to enforce the principle:
 *
 *   "The template must not invent betting structure or geometry."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT THIS MODULE DOES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ✅ Deterministically construct action lines
 * ✅ Calculate pot based on street and prior action
 * ✅ Calculate effective stack
 * ✅ Build complete history for spot JSON
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT THIS MODULE DOES NOT DO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ❌ Consider difficulty
 * ❌ Consider leverage
 * ❌ Consider hand strength
 * ❌ Consider options
 * ❌ Make poker strategy decisions
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type Street = "f" | "t" | "r";
export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";

/**
 * Standard action history entry types
 */
export type HistoryAction =
  | ["-", Street]                           // Street marker
  | [Position, "f"]                         // Fold
  | [Position, "x"]                         // Check
  | [Position, "c", null, number]           // Call
  | [Position, "b", number, number]         // Bet (% of pot, amount)
  | [Position, "r", string, number];        // Raise (multiplier, amount)

/**
 * Output of line building
 */
export interface LineBuilderOutput {
  hist: HistoryAction[];
  pot: number;
  effectiveStack: number;
  flopBetPct: number;
  turnBetPct: number;
  flopBetAmount: number;
  turnBetAmount: number;
}

/**
 * Input to buildPostflopLine
 */
export interface LineBuilderInput {
  street: Street;
  heroIsIP: boolean;
  heroPosition: Position;
  villainPosition: Position;
  heroIsOpener: boolean;
  /** Optional seeded RNG for deterministic bet size selection */
  rng?: () => number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];

/** Starting stack */
const STARTING_STACK = 100;

/** Standard SRP preflop pot: 2.5 open + 2.5 call + 1.5 blinds */
const PREFLOP_POT = 6.5;

/** Open raise amount */
const OPEN_AMOUNT = 2.5;

/** Standard flop bet sizes (% of pot) */
const FLOP_BET_SIZES = [33, 50, 66, 75];

/** Standard turn bet sizes (% of pot) */
const TURN_BET_SIZES = [50, 66, 75];

// ═══════════════════════════════════════════════════════════════════════════
// LINE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Line patterns define how the action flows on prior streets.
 * 
 * Each pattern specifies:
 * - flopAction: who bets on the flop (if anyone)
 * - turnAction: who bets on the turn (if anyone)
 * 
 * Actions: "ip_cbet" | "oop_donk" | "check_through"
 */
export type StreetAction = "ip_cbet" | "oop_donk" | "check_through";

export interface LinePattern {
  id: string;
  name: string;
  flopAction: StreetAction;
  turnAction: StreetAction;
  weight: number;  // Relative frequency (higher = more common)
  description: string;
}

/**
 * Available line patterns for SRP spots.
 * 
 * Weights are based on solver frequencies:
 * - IP c-betting is most common
 * - Donking is rare but happens
 * - Check-throughs happen with weak IP ranges
 */
export const LINE_PATTERNS: LinePattern[] = [
  {
    id: "standard_cbet",
    name: "Standard IP C-bet",
    flopAction: "ip_cbet",
    turnAction: "ip_cbet",
    weight: 50,
    description: "OOP checks, IP bets, OOP calls (most common)",
  },
  {
    id: "oop_donk_flop",
    name: "OOP Donk Flop",
    flopAction: "oop_donk",
    turnAction: "ip_cbet",
    weight: 10,
    description: "OOP leads flop (strong hand/draw), checks turn",
  },
  {
    id: "oop_donk_both",
    name: "OOP Donk Both Streets",
    flopAction: "oop_donk",
    turnAction: "oop_donk",
    weight: 5,
    description: "OOP leads flop and turn (monster/polarized)",
  },
  {
    id: "check_through_flop",
    name: "Check-Through Flop",
    flopAction: "check_through",
    turnAction: "ip_cbet",
    weight: 15,
    description: "IP checks back flop, bets turn (delayed cbet)",
  },
  {
    id: "delayed_donk",
    name: "Delayed OOP Donk",
    flopAction: "ip_cbet",
    turnAction: "oop_donk",
    weight: 8,
    description: "Standard flop, OOP wakes up on turn",
  },
  {
    id: "full_check_through",
    name: "Full Check-Through",
    flopAction: "check_through",
    turnAction: "check_through",
    weight: 12,
    description: "Both streets check through (showdown value hands)",
  },
];

/**
 * Select a line pattern based on weights.
 */
export function selectLinePattern(rng: () => number): LinePattern {
  const totalWeight = LINE_PATTERNS.reduce((sum, p) => sum + p.weight, 0);
  let roll = rng() * totalWeight;
  
  for (const pattern of LINE_PATTERNS) {
    roll -= pattern.weight;
    if (roll <= 0) return pattern;
  }
  
  return LINE_PATTERNS[0]; // Fallback to standard
}

// ═══════════════════════════════════════════════════════════════════════════
// PREFLOP HISTORY BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build preflop history based on positions.
 *
 * Standard SRP preflop:
 * - All players before opener fold
 * - Opener raises to 2.5bb
 * - Players between opener and caller fold
 * - Caller calls 2.5bb
 */
export function buildPreflopHistory(
  heroPos: Position,
  villainPos: Position,
  heroIsOpener: boolean
): HistoryAction[] {
  const hist: HistoryAction[] = [];

  const openerPos = heroIsOpener ? heroPos : villainPos;
  const callerPos = heroIsOpener ? villainPos : heroPos;

  // All players before opener fold
  for (const pos of POSITIONS) {
    if (pos === openerPos) break;
    hist.push([pos, "f"]);
  }

  // Opener raises
  hist.push([openerPos, "r", "2.5x", OPEN_AMOUNT]);

  // Players between opener and caller fold or call
  const openerIdx = POSITIONS.indexOf(openerPos);

  for (let i = openerIdx + 1; i < POSITIONS.length; i++) {
    const pos = POSITIONS[i];
    if (pos === callerPos) {
      hist.push([pos, "c", null, OPEN_AMOUNT]);
      break;
    }
    // Blinds get special handling
    if (pos !== "SB" && pos !== "BB") {
      hist.push([pos, "f"]);
    } else if (pos === "SB" && pos !== callerPos) {
      hist.push([pos, "f"]);
    }
  }

  return hist;
}

// ═══════════════════════════════════════════════════════════════════════════
// POT CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate pot and bet amounts based on street and action percentages.
 *
 * @param street - Current street
 * @param flopBetPct - Flop bet as % of pot (0 if flop spot)
 * @param turnBetPct - Turn bet as % of pot (0 if flop/turn spot)
 * @returns Pot and bet amounts
 */
export function calculatePotGeometry(
  street: Street,
  flopBetPct: number,
  turnBetPct: number = 0
): { pot: number; flopBetAmount: number; turnBetAmount: number } {
  // Flop: pot is just the preflop pot
  if (street === "f") {
    return { pot: PREFLOP_POT, flopBetAmount: 0, turnBetAmount: 0 };
  }

  // Turn: pot = preflop + (flopBet * 2)
  const flopBetAmount = Math.round((PREFLOP_POT * flopBetPct) / 100 * 10000) / 10000;
  const postFlopPot = PREFLOP_POT + flopBetAmount * 2;

  if (street === "t") {
    return { pot: postFlopPot, flopBetAmount, turnBetAmount: 0 };
  }

  // River: pot = postFlopPot + (turnBet * 2)
  const turnBetAmount = Math.round((postFlopPot * turnBetPct) / 100 * 10000) / 10000;
  const riverPot = postFlopPot + turnBetAmount * 2;

  return { pot: riverPot, flopBetAmount, turnBetAmount };
}

/**
 * Calculate effective stack after preflop and prior streets.
 *
 * @param flopBetAmount - Amount bet on flop
 * @param turnBetAmount - Amount bet on turn
 * @returns Effective stack remaining
 */
export function calculateEffectiveStack(
  flopBetAmount: number,
  turnBetAmount: number
): number {
  // Starting stack minus: open call (2.5) + flop bet + turn bet
  // Note: We assume hero has called all prior bets
  return STARTING_STACK - OPEN_AMOUNT - flopBetAmount - turnBetAmount;
}

// ═══════════════════════════════════════════════════════════════════════════
// POSTFLOP ACTION BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Append a single street's action based on the action type.
 */
function appendStreetAction(
  hist: HistoryAction[],
  action: StreetAction,
  oopPos: Position,
  ipPos: Position,
  betPct: number,
  betAmount: number
): void {
  switch (action) {
    case "ip_cbet":
      // Standard: OOP checks, IP bets, OOP calls
      hist.push([oopPos, "x"]);
      hist.push([ipPos, "b", betPct, betAmount]);
      hist.push([oopPos, "c", null, betAmount]);
      break;
    
    case "oop_donk":
      // Donk: OOP bets, IP calls
      hist.push([oopPos, "b", betPct, betAmount]);
      hist.push([ipPos, "c", null, betAmount]);
      break;
    
    case "check_through":
      // Check-through: both check
      hist.push([oopPos, "x"]);
      hist.push([ipPos, "x"]);
      break;
  }
}

/**
 * Build postflop action history with line pattern support.
 *
 * Now supports multiple action patterns:
 * - ip_cbet: OOP checks → IP bets → OOP calls
 * - oop_donk: OOP bets → IP calls
 * - check_through: OOP checks → IP checks
 *
 * @param hist - History array to append to (modified in place)
 * @param street - Current street
 * @param heroIsIP - Is hero in position
 * @param heroPos - Hero's position
 * @param villainPos - Villain's position
 * @param flopBetPct - Flop bet percentage
 * @param flopBetAmount - Flop bet amount
 * @param turnBetPct - Turn bet percentage
 * @param turnBetAmount - Turn bet amount
 * @param pattern - Line pattern to use (defaults to standard cbet)
 */
export function appendPostflopHistory(
  hist: HistoryAction[],
  street: Street,
  heroIsIP: boolean,
  heroPos: Position,
  villainPos: Position,
  flopBetPct: number,
  flopBetAmount: number,
  turnBetPct: number,
  turnBetAmount: number,
  pattern: LinePattern = LINE_PATTERNS[0]
): void {
  const oopPos = heroIsIP ? villainPos : heroPos;
  const ipPos = heroIsIP ? heroPos : villainPos;

  // Add flop marker
  hist.push(["-", "f"]);

  // Flop action (for turn/river spots)
  if (street !== "f") {
    // Use pattern's flop action, but handle check-through pot differently
    if (pattern.flopAction === "check_through") {
      appendStreetAction(hist, "check_through", oopPos, ipPos, 0, 0);
    } else {
      appendStreetAction(hist, pattern.flopAction, oopPos, ipPos, flopBetPct, flopBetAmount);
    }
  }

  // Turn marker and action (for river spots)
  if (street === "r") {
    hist.push(["-", "t"]);
    // Use pattern's turn action
    if (pattern.turnAction === "check_through") {
      appendStreetAction(hist, "check_through", oopPos, ipPos, 0, 0);
    } else {
      appendStreetAction(hist, pattern.turnAction, oopPos, ipPos, turnBetPct, turnBetAmount);
    }
  }

  // Current street marker and OOP check (hero's decision point)
  if (street === "t") {
    hist.push(["-", "t"]);
    hist.push([oopPos, "x"]);
  } else if (street === "r") {
    hist.push(["-", "r"]);
    hist.push([oopPos, "x"]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LINE BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default deterministic RNG for bet size selection.
 * Uses a simple linear congruential generator seeded with current timestamp.
 */
function defaultRng(): () => number {
  let seed = Date.now();
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Select a value from an array using RNG.
 */
function selectFromArray<T>(arr: T[], rng: () => number): T {
  const idx = Math.floor(rng() * arr.length);
  return arr[idx];
}

/**
 * Extended output including pattern info
 */
export interface LineBuilderOutputExtended extends LineBuilderOutput {
  pattern: LinePattern;
}

/**
 * Build complete postflop line including history, pot, and effective stack.
 *
 * This is the main entry point for line construction.
 * Now supports varied line patterns (donks, check-throughs, etc.)
 *
 * @param input - Line builder input
 * @returns Complete line with history, pot, effective stack, and pattern used
 */
export function buildPostflopLine(input: LineBuilderInput): LineBuilderOutputExtended {
  const { street, heroIsIP, heroPosition, villainPosition, heroIsOpener, rng = defaultRng() } = input;

  // Step 1: Select line pattern (weighted random)
  const pattern = selectLinePattern(rng);

  // Step 2: Select bet sizes (deterministic with seeded RNG)
  // Adjust sizes based on pattern - no bet on check-through streets
  let flopBetPct = 0;
  let turnBetPct = 0;
  
  if (street !== "f" && pattern.flopAction !== "check_through") {
    flopBetPct = selectFromArray(FLOP_BET_SIZES, rng);
  }
  if (street === "r" && pattern.turnAction !== "check_through") {
    turnBetPct = selectFromArray(TURN_BET_SIZES, rng);
  }

  // Step 3: Calculate pot geometry (accounting for check-throughs)
  const { pot, flopBetAmount, turnBetAmount } = calculatePotGeometryWithPattern(
    street,
    flopBetPct,
    turnBetPct,
    pattern
  );

  // Step 4: Calculate effective stack
  const effectiveStack = calculateEffectiveStackWithPattern(flopBetAmount, turnBetAmount, pattern);

  // Step 5: Build preflop history
  const hist = buildPreflopHistory(heroPosition, villainPosition, heroIsOpener) as HistoryAction[];

  // Step 6: Append postflop history with pattern
  appendPostflopHistory(
    hist,
    street,
    heroIsIP,
    heroPosition,
    villainPosition,
    flopBetPct,
    flopBetAmount,
    turnBetPct,
    turnBetAmount,
    pattern
  );

  return {
    hist,
    pot,
    effectiveStack,
    flopBetPct,
    turnBetPct,
    flopBetAmount,
    turnBetAmount,
    pattern,
  };
}

/**
 * Calculate pot geometry accounting for check-through patterns.
 */
function calculatePotGeometryWithPattern(
  street: Street,
  flopBetPct: number,
  turnBetPct: number,
  pattern: LinePattern
): { pot: number; flopBetAmount: number; turnBetAmount: number } {
  // Flop: pot is just the preflop pot
  if (street === "f") {
    return { pot: PREFLOP_POT, flopBetAmount: 0, turnBetAmount: 0 };
  }

  // Calculate flop bet (0 if check-through)
  const flopBetAmount = pattern.flopAction === "check_through" 
    ? 0 
    : Math.round((PREFLOP_POT * flopBetPct) / 100 * 10000) / 10000;
  
  const postFlopPot = PREFLOP_POT + flopBetAmount * 2;

  if (street === "t") {
    return { pot: postFlopPot, flopBetAmount, turnBetAmount: 0 };
  }

  // Calculate turn bet (0 if check-through)
  const turnBetAmount = pattern.turnAction === "check_through"
    ? 0
    : Math.round((postFlopPot * turnBetPct) / 100 * 10000) / 10000;
  
  const riverPot = postFlopPot + turnBetAmount * 2;

  return { pot: riverPot, flopBetAmount, turnBetAmount };
}

/**
 * Calculate effective stack accounting for check-through patterns.
 */
function calculateEffectiveStackWithPattern(
  flopBetAmount: number,
  turnBetAmount: number,
  pattern: LinePattern
): number {
  // Starting stack minus: open call (2.5) + bets on prior streets (if any)
  const flopContribution = pattern.flopAction === "check_through" ? 0 : flopBetAmount;
  const turnContribution = pattern.turnAction === "check_through" ? 0 : turnBetAmount;
  
  return STARTING_STACK - OPEN_AMOUNT - flopContribution - turnContribution;
}

