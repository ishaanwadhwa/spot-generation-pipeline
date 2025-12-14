import { rankOf, suitOf, valueOfRank } from "./ranks";

export type TurnType =
  | "blank_turn"
  | "overcard_turn"
  | "straight_completer"
  | "flush_completer"
  | "paired_turn";

const ALL_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;

function straightExists(ranks: Set<number>): boolean {
  // wheel
  if (ranks.has(14) && ranks.has(2) && ranks.has(3) && ranks.has(4) && ranks.has(5)) return true;
  for (let hi = 14; hi >= 6; hi--) {
    let ok = true;
    for (let x = hi; x > hi - 5; x--) if (!ranks.has(x)) ok = false;
    if (ok) return true;
  }
  return false;
}

function turnCompletesAnyStraightDraw(flop: [string, string, string], turn: string): boolean {
  const flopRanks = new Set<number>(flop.map((c) => valueOfRank(rankOf(c))));
  const turnVal = valueOfRank(rankOf(turn));

  // brute force over all possible 2-card rank pairs
  for (let i = 0; i < ALL_RANKS.length; i++) {
    for (let j = i + 1; j < ALL_RANKS.length; j++) {
      const r1 = valueOfRank(ALL_RANKS[i]);
      const r2 = valueOfRank(ALL_RANKS[j]);
      // flop only (5 ranks total with hand)
      const flopOnly = new Set<number>([...flopRanks, r1, r2]);
      const withTurn = new Set<number>([...flopRanks, turnVal, r1, r2]);
      if (!straightExists(flopOnly) && straightExists(withTurn)) return true;
    }
  }
  return false;
}

export function classifyTurn(
  flop: [string, string, string],
  turn: string
): TurnType {
  const flopRanks = flop.map((c) => valueOfRank(rankOf(c)));
  const turnRank = valueOfRank(rankOf(turn));

  // paired turn
  if (flop.some((c) => rankOf(c) === rankOf(turn))) return "paired_turn";

  // flush completer: flop is two-tone and turn matches that suit
  const suits = flop.map(suitOf);
  const suitCounts = suits.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const twoToneSuit = Object.entries(suitCounts).find(([, n]) => n === 2)?.[0];
  if (twoToneSuit && suitOf(turn) === twoToneSuit) return "flush_completer";

  // overcard
  if (turnRank > Math.max(...flopRanks)) return "overcard_turn";

  // straight completer (for someone)
  if (turnCompletesAnyStraightDraw(flop, turn)) return "straight_completer";

  return "blank_turn";
}


