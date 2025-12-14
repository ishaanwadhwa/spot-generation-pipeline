import { RANKS, SUITS, type Suit, rankIndex } from "./handRanks";
import type { HandClass } from "./expandClasses";

export type Card = `${string}${Suit}`; // e.g. "As"
export type Combo = [Card, Card];

function card(rank: string, suit: Suit): Card {
  return `${rank}${suit}` as Card;
}

export function enumerateCombos(h: HandClass): Combo[] {
  const out: Combo[] = [];

  // Pair: "TT"
  if (h.length === 2 && h[0] === h[1]) {
    const r = h[0];
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        out.push([card(r, SUITS[i]), card(r, SUITS[j])]);
      }
    }
    return out;
  }

  // Suited/offsuit: "AKs" / "AKo"
  const r1 = h[0];
  const r2 = h[1];
  const suitedness = h[2]; // "s" | "o"
  if (suitedness !== "s" && suitedness !== "o") return out;

  // normalize order (A before K etc.) but keep as given
  const i1 = rankIndex(r1);
  const i2 = rankIndex(r2);
  if (i1 < 0 || i2 < 0 || i1 === i2) return out;

  if (suitedness === "s") {
    for (const s of SUITS) out.push([card(r1, s), card(r2, s)]);
    return out;
  }

  // offsuit: all suit pairs where suits differ
  for (const s1 of SUITS) {
    for (const s2 of SUITS) {
      if (s1 === s2) continue;
      out.push([card(r1, s1), card(r2, s2)]);
    }
  }
  return out;
}

export function all169Classes(): HandClass[] {
  const out: HandClass[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    // pairs
    out.push(`${RANKS[i]}${RANKS[i]}`);
    for (let j = i + 1; j < RANKS.length; j++) {
      out.push(`${RANKS[i]}${RANKS[j]}s`);
      out.push(`${RANKS[i]}${RANKS[j]}o`);
    }
  }
  return out;
}


