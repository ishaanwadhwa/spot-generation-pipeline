export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(rand: () => number, xs: T[]): T {
  if (xs.length === 0) throw new Error("pickOne on empty array");
  const idx = Math.floor(rand() * xs.length);
  return xs[Math.min(xs.length - 1, Math.max(0, idx))];
}


