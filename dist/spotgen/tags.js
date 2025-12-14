"use strict";
/**
 * spotgen/tags.ts
 *
 * Tags/concepts are user-visible and will be indexed in DB.
 * Keep them small, consistent, and enumerable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CONCEPTS = exports.MAX_TAGS = void 0;
exports.clampList = clampList;
exports.MAX_TAGS = 6;
exports.MAX_CONCEPTS = 6;
function clampList(xs, max) {
    const out = [];
    const seen = new Set();
    for (const x of xs) {
        const key = String(x);
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(x);
        if (out.length >= max)
            break;
    }
    return out;
}
