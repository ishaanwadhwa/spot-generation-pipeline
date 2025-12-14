export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
export type Rank = (typeof RANKS)[number];

export const SUITS = ["s", "h", "d", "c"] as const;
export type Suit = (typeof SUITS)[number];

export function rankIndex(r: string): number {
  return (RANKS as readonly string[]).indexOf(r);
}

export function assertRank(r: string): asserts r is Rank {
  if (!RANKS.includes(r as Rank)) throw new Error(`Invalid rank: ${r}`);
}


