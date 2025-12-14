"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONCEPT_WHITELIST = void 0;
exports.filterConcepts = filterConcepts;
exports.CONCEPT_WHITELIST = new Set([
    "range-advantage",
    "equity-denial",
    "barrel-geometry",
    "high-equity-combo-draw",
    "protection-bet",
    "value-max",
    "bet-sizing",
    "blockers",
]);
function filterConcepts(xs) {
    return xs.filter((x) => exports.CONCEPT_WHITELIST.has(x));
}
