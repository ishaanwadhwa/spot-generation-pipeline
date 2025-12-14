export const RANK_TO_VALUE: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function rankOf(card: string): string {
  return card[0];
}

export function suitOf(card: string): string {
  return card[1];
}

export function valueOfRank(r: string): number {
  const v = RANK_TO_VALUE[r];
  if (!v) throw new Error(`Unknown rank: ${r}`);
  return v;
}


