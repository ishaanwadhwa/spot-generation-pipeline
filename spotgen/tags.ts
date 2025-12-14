/**
 * spotgen/tags.ts
 *
 * Tags/concepts are user-visible and will be indexed in DB.
 * Keep them small, consistent, and enumerable.
 */

export const MAX_TAGS = 6;
export const MAX_CONCEPTS = 6;

export function clampList<T>(xs: T[], max: number): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const key = String(x);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}


