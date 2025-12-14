"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
