/**
 * poker/pedagogy/types.ts
 *
 * PHASE 3: Pedagogy Layer - Type Definitions
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 3 is the TEACHING layer. It runs strictly AFTER:
 * - Phase 1: BettingContext (what betting is allowed)
 * - Phase 2: OptionBuilder (which 3 options to show)
 *
 * Phase 3 is responsible for:
 * - Frequencies (how often each option is "correct")
 * - EVs (relative value of each option)
 * - Meta (summary, solver notes, concepts)
 *
 * Phase 3 must NEVER:
 * - Change opts or bestIdx
 * - Inspect board cards
 * - Inspect exact bet sizes
 * - Inspect hero hand
 * - Use randomness
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { ActionIntent } from "../optionBuilder";
import type { BettingContext } from "../bettingContext";
import type { HandIntent } from "../intent";

/**
 * Difficulty level for pedagogy spacing
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Street type
 */
export type Street = "f" | "t" | "r";

/**
 * Input to the pedagogy phase.
 *
 * This is ALL that Phase 3 can see. No board, no hand, no bet sizes.
 */
export interface PedagogyInput {
  /** Options from Phase 2 (always exactly 3) */
  options: {
    opts: ActionIntent[];
    bestIdx: number;
  };

  /** Betting context from Phase 1 */
  bettingContext: BettingContext;

  /** Strategic intent (classified earlier, not inspected) */
  handIntent: HandIntent;

  /** Current street */
  street: Street;

  /** Difficulty level */
  difficulty: DifficultyLevel;
}

/**
 * Meta output from pedagogy phase
 */
export interface PedagogyMeta {
  summary: string;
  solverNotes: string[];
  concepts: string[];
}

/**
 * Full output from the pedagogy phase
 */
export interface PedagogyOutput {
  /** Frequencies for each option (sum to 1.0) */
  freq: number[];

  /** EVs for each option (bestIdx has highest) */
  ev: number[];

  /** Teaching meta-data */
  meta: PedagogyMeta;
}

/**
 * Frequency spread configuration by difficulty
 */
export interface FrequencySpread {
  /** Frequency for the best option */
  best: number;
  /** Frequency for the second-best option */
  second: number;
  /** Frequency for the worst option */
  worst: number;
}

/**
 * EV spread configuration by difficulty
 */
export interface EVSpread {
  /** EV for best option */
  best: number;
  /** EV gap between adjacent options */
  gap: number;
}

