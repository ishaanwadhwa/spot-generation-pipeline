// expandRanges.ts (Node/TS)
// Lightweight range-expander for pattern shorthand (not full combo enumerator for human readability).
const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];

function expandPairs(range: string) {
  // e.g. "22-99" or "22+"
  if (range.includes("+")) {
    const base = range.replace("+", "");
    const start = RANKS.indexOf(base[0]);
    const pairs = [];
    for (let i = start; i < RANKS.length; i++) {
      pairs.push(RANKS[i] + RANKS[i]);
    }
    return pairs;
  }
  if (range.includes("-")) {
    const [a, b] = range.split("-");
    const start = RANKS.indexOf(a[0]);
    const end = RANKS.indexOf(b[0]);
    const pairs = [];
    for (let i = start; i <= end; i++) pairs.push(RANKS[i] + RANKS[i]);
    return pairs;
  }
  return [range];
}

function expandSuited(range: string) {
  // "A2s-A5s", "AJs", "A2s+"
  if (range.includes("+")) {
    const base = range.replace("+", "");
    const rank = base[1]; // e.g. AJs -> J
    const startIdx = RANKS.indexOf(rank);
    const res = [];
    for (let i = startIdx; i >= 0; i--) {
      res.push("A" + RANKS[i] + "s");
    }
    return res;
  }
  if (range.includes("-")) {
    const [a,b] = range.split("-");
    const low = a.slice(0,2); // A2s
    const high = b.slice(0,2);
    const start = RANKS.indexOf(low[1]);
    const end = RANKS.indexOf(high[1]);
    const out: string[] = [];
    for (let i = start; i >= end; i--) {
      out.push("A" + RANKS[i] + "s");
    }
    return out;
  }
  return [range];
}

export function expandPattern(pattern: string): string[] {
  // naive collector: check pairs, suited, offsuit
  if (pattern.includes("s") && pattern.length <= 3) {
    return expandSuited(pattern);
  }
  if (pattern.includes("-") && pattern[0] === pattern[1]) {
    return expandPairs(pattern);
  }
  // fallback: return as-is
  return [pattern];
}

// Example: expandPattern("22-99") -> ["22","33","44","55","66","77","88","99"]
// Use this basic library to expand grouped keys into explicit arrays for sampling.
