/**
 * spotgen/poker/pairQuality.ts
 *
 * PHASE 1.1: Pair Quality Classification
 *
 * This module provides deterministic pair quality classification
 * to prevent misclassification of bottom/medium pairs as thin_value.
 *
 * WHY THIS MATTERS:
 * - Bottom pair on a dangerous turn (straight completer, paired) is NOT thin value
 * - It's a give-up or check-fold situation
 * - Without this, the pipeline incorrectly suggests protection bets with weak holdings
 */

import { rankOf, valueOfRank } from "./ranks";

export type PairQuality =
  | "top_pair"       // Hero pairs the highest board card
  | "second_pair"    // Hero pairs the second-highest board card
  | "middle_pair"    // Hero pairs a middle board card (not top, not bottom)
  | "bottom_pair"    // Hero pairs the lowest board card
  | "underpair"      // Pocket pair below all board cards
  | "overpair"       // Pocket pair above all board cards
  | "board_pair_only" // Hero doesn't pair, but board is paired
  | "no_pair";       // No pair at all

/**
 * Classify the quality of hero's pair relative to the board.
 *
 * @param heroCards - Hero's two hole cards
 * @param board - The board cards (flop + turn, or full board)
 * @returns PairQuality classification
 */
export function classifyPairQuality(
  heroCards: [string, string],
  board: string[]
): PairQuality {
  const heroRanks = [rankOf(heroCards[0]), rankOf(heroCards[1])];
  const heroValues = heroRanks.map(valueOfRank);
  const boardRanks = board.map(rankOf);
  const boardValues = boardRanks.map(valueOfRank);

  const isPocketPair = heroRanks[0] === heroRanks[1];
  const pocketPairValue = isPocketPair ? heroValues[0] : null;

  // Check if hero pairs the board
  const heroPairsBoard = heroRanks.filter(r => boardRanks.includes(r));
  const pairedRank = heroPairsBoard.length > 0 ? heroPairsBoard[0] : null;
  const pairedValue = pairedRank ? valueOfRank(pairedRank) : null;

  // Sort board values to determine ranks
  const sortedBoardValues = [...new Set(boardValues)].sort((a, b) => b - a);
  const highestBoardValue = sortedBoardValues[0];
  const lowestBoardValue = sortedBoardValues[sortedBoardValues.length - 1];

  // Case 1: Pocket pair (no board pairing)
  if (isPocketPair && !boardRanks.includes(heroRanks[0])) {
    if (pocketPairValue! > highestBoardValue) {
      return "overpair";
    }
    return "underpair";
  }

  // Case 2: Hero pairs the board
  if (pairedValue !== null) {
    // Determine where this pair ranks on the board
    if (pairedValue === highestBoardValue) {
      return "top_pair";
    }
    if (pairedValue === lowestBoardValue) {
      return "bottom_pair";
    }
    // Check if it's second pair
    if (sortedBoardValues.length >= 2 && pairedValue === sortedBoardValues[1]) {
      return "second_pair";
    }
    // Otherwise it's a middle pair
    return "middle_pair";
  }

  // Case 3: Check if board itself is paired (hero doesn't contribute)
  const boardRankCounts = new Map<string, number>();
  for (const r of boardRanks) {
    boardRankCounts.set(r, (boardRankCounts.get(r) || 0) + 1);
  }
  const boardHasPair = Array.from(boardRankCounts.values()).some(c => c >= 2);
  if (boardHasPair) {
    return "board_pair_only";
  }

  // Case 4: No pair
  return "no_pair";
}

/**
 * Check if a pair quality is considered "weak" on dangerous turns.
 *
 * WHY BOTTOM PAIR IS NOT THIN VALUE:
 * - On straight completers: villain has many straights, two pairs
 * - On paired turns: villain has trips, boats
 * - Bottom pair has minimal showdown value in these spots
 * - "Protection betting" with bottom pair is a strategic error
 */
export function isWeakPairOnDangerousTurn(
  pairQuality: PairQuality,
  turnType: string
): boolean {
  const dangerousTurns = ["straight_completer", "paired_turn", "flush_completer"];
  const weakPairs: PairQuality[] = ["bottom_pair", "underpair"];

  if (weakPairs.includes(pairQuality) && dangerousTurns.includes(turnType)) {
    return true;
  }

  return false;
}

/**
 * Check if hero should consider giving up (check-fold) based on pair quality.
 */
export function shouldGiveUp(
  pairQuality: PairQuality,
  turnType: string
): boolean {
  // Bottom pair on non-blank turns should give up
  if (pairQuality === "bottom_pair" && turnType !== "blank_turn") {
    return true;
  }

  // Underpair on overcard/completer turns should give up
  if (pairQuality === "underpair" && turnType !== "blank_turn") {
    return true;
  }

  return false;
}

