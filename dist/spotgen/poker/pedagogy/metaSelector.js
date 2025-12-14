"use strict";
/**
 * poker/pedagogy/metaSelector.ts
 *
 * PHASE 3: Meta Selection
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Selects teaching meta-data based ONLY on:
 * - handIntent
 * - polarity (merged / polarized)
 * - street
 *
 * NO board texture references.
 * NO bet size references.
 * NO villain hand speculation.
 * NO solver claims.
 *
 * Language must be INSTRUCTIONAL, not solver-authoritative.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_CONCEPTS = void 0;
exports.selectMeta = selectMeta;
exports.filterConcepts = filterConcepts;
function checkTrapEligibility(bettingContext, street, anchor) {
    // Gate 1: Anchor must be check
    if (anchor !== "check") {
        return { eligible: false, reason: "Anchor is not check" };
    }
    // Gate 2: RIVER ONLY — no turn traps (too early, villain aggression not guaranteed)
    if (street !== "r") {
        return { eligible: false, reason: "Trap requires river — turn is too early" };
    }
    // Gate 3: Polarity must be polarized (trapping is a polar strategy)
    if (bettingContext.polarity !== "polarized") {
        return { eligible: false, reason: "Trap requires polarized context" };
    }
    // Gate 4: Must have nut advantage (trapping without nuts is pot-control)
    if (!bettingContext.nutAdvantage) {
        return { eligible: false, reason: "No nut advantage — pot-control, not trap" };
    }
    // Gate 5: Betting must be structurally allowed (forced check ≠ trap)
    if (!bettingContext.allowsSmallBet && !bettingContext.allowsLargeBet) {
        return { eligible: false, reason: "Betting not allowed — forced check, not trap" };
    }
    return { eligible: true, reason: "All trap gates passed (river + polarized + nut advantage)" };
}
/**
 * Select meta-data for a spot.
 *
 * Rules:
 * - Based on handIntent, bettingContext, street, AND anchor
 * - Trap/slowplay is GATED (rare, requires nut advantage + polar context)
 * - No board/hand inspection
 * - Instructional language only
 *
 * @param handIntent - Strategic intent
 * @param bettingContext - Betting context (full context for gating)
 * @param street - Current street
 * @param anchor - The best action (affects meta tone)
 * @returns Meta object with summary, solverNotes, concepts
 */
function selectMeta(handIntent, bettingContext, street, anchor = "small" // Default to betting for backwards compatibility
) {
    const { polarity } = bettingContext;
    // Check trap eligibility BEFORE selecting template
    const trapCheck = checkTrapEligibility(bettingContext, street, anchor);
    // Select template based on handIntent AND anchor
    switch (handIntent) {
        case "made_value":
            return getMadeValueMeta(polarity, street, anchor, trapCheck);
        case "thin_value":
            return getThinValueMeta(polarity, street, anchor);
        case "combo_draw":
            return getComboDrawMeta(polarity, street);
        case "draw":
            return getDrawMeta(polarity, street);
        case "pure_bluff":
            return getPureBluffMeta(polarity, street);
        case "give_up":
            return getGiveUpMeta(polarity, street);
        default:
            return getDefaultMeta(polarity, street);
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// INTENT-SPECIFIC META GENERATORS
// ═══════════════════════════════════════════════════════════════════════════
function getMadeValueMeta(polarity, street, anchor, trapCheck) {
    const streetName = streetToName(street);
    // TRAP/SLOWPLAY — Only if ALL gates pass
    // This is RARE and requires nut advantage + polar context
    if (anchor === "check" && trapCheck.eligible) {
        return {
            concepts: ["trap", "slowplay"],
            summary: `With a nutted hand on the ${streetName}, checking to trap can extract more value. Villain is likely to bet, allowing you to check-raise or call down.`,
            solverNotes: [
                "Trapping works when villain has incentive to bet.",
                "Nut advantage allows safe slowplaying.",
                "Checking disguises your strength.",
                "Be prepared to check-raise for maximum value.",
            ],
        };
    }
    // CHECK WITHOUT TRAP — Anchor is check but trap gates failed
    // This is value protection / pot control, NOT trapping
    if (anchor === "check") {
        return {
            concepts: ["value-bet", "pot-control"],
            summary: `With a strong hand on the ${streetName}, checking can be correct to control the pot or induce. However, betting for value is often preferred when villain's range includes many calling hands.`,
            solverNotes: [
                "Strong hands often prefer betting for value.",
                "Checking protects your range but may miss value.",
                "Consider villain's likely response to a bet.",
                "Balance checking with betting to remain unpredictable.",
            ],
        };
    }
    // BETTING ANCHOR — Polarized context
    if (polarity === "polarized") {
        return {
            concepts: ["value-max", "range-polarization"],
            summary: `With a strong hand on the ${streetName}, focus on maximizing value. In polarized spots, larger sizings target the top of villain's continuing range.`,
            solverNotes: [
                "Strong hands can bet for value and protection.",
                "Sizing should match the strength of your range.",
                "Consider how villain's range connects with the board.",
                "Larger bets work when villain's calling range is inelastic.",
            ],
        };
    }
    // BETTING ANCHOR — Merged context (default)
    return {
        concepts: ["value-bet", "range-advantage"],
        summary: `With a strong hand on the ${streetName}, bet for value while keeping villain's weaker hands in the pot.`,
        solverNotes: [
            "Strong hands should usually bet for value.",
            "Choose a sizing that keeps worse hands calling.",
            "Avoid over-betting which folds out calls.",
            "Balance value with protection when vulnerable.",
        ],
    };
}
function getThinValueMeta(polarity, street, anchor) {
    const streetName = streetToName(street);
    // When anchor is "check", emphasize pot control
    if (anchor === "check") {
        return {
            concepts: ["pot-control", "showdown-value"],
            summary: `With a medium-strength hand on the ${streetName}, checking often maximizes value by keeping the pot manageable. You have showdown value but are vulnerable to better hands.`,
            solverNotes: [
                "Medium-strength hands prefer smaller pots.",
                "Checking avoids bloating the pot against better.",
                "You can call reasonable bets with showdown value.",
                "Be prepared to fold to heavy aggression.",
            ],
        };
    }
    return {
        concepts: ["thin-value", "pot-control"],
        summary: `With a medium-strength hand on the ${streetName}, bet thinly for value while controlling the pot size. Avoid bloating the pot against stronger holdings.`,
        solverNotes: [
            "Medium-strength hands are vulnerable to better.",
            "Small bet sizes target worse hands that might fold to larger.",
            "Consider checking to control pot size.",
            "Be prepared to fold to significant aggression.",
        ],
    };
}
function getComboDrawMeta(polarity, street) {
    const streetName = streetToName(street);
    // FIX C: River has no draws — busted draws are bluffs or give-ups
    if (street === "r") {
        return {
            concepts: ["bluff", "fold-equity"],
            summary: `On the river with a busted draw, decide between bluffing or giving up. Your equity is realized — this is now purely about fold equity.`,
            solverNotes: [
                "Draws that missed have zero showdown value.",
                "Bluffing requires strong blockers to be profitable.",
                "Sizing should match your value range.",
                "Giving up is often correct without fold equity.",
            ],
        };
    }
    if (polarity === "polarized") {
        return {
            concepts: ["semi-bluff", "equity-pressure"],
            summary: `With a strong draw on the ${streetName}, apply pressure. Your combination of equity and fold equity makes aggression profitable.`,
            solverNotes: [
                "Combo draws have high equity even when called.",
                "Semi-bluffing builds fold equity.",
                "Aggression denies villain's equity realization.",
                "Larger sizes work when you can credibly represent strength.",
            ],
        };
    }
    return {
        concepts: ["semi-bluff", "equity-pressure"],
        summary: `With a draw on the ${streetName}, balance aggression with equity. Your combo equity supports semi-bluffing.`,
        solverNotes: [
            "Strong draws can profitably semi-bluff.",
            "Consider stack-to-pot ratio when sizing.",
            "Combo equity provides backup when called.",
            "Betting applies pressure and builds fold equity.",
        ],
    };
}
function getDrawMeta(polarity, street) {
    const streetName = streetToName(street);
    // FIX C: River draws are BUSTED — no equity realization language
    if (street === "r") {
        return {
            concepts: ["bluff", "give-up"],
            summary: `On the river with a missed draw, you have no showdown value. Choose between bluffing or conceding the pot.`,
            solverNotes: [
                "Missed draws cannot win at showdown.",
                "Bluffing requires fold equity to profit.",
                "Check-folding is often correct without blockers.",
                "Only bluff with hands that block villain's calls.",
            ],
        };
    }
    return {
        concepts: ["draw-play", "semi-bluff"],
        summary: `With a draw on the ${streetName}, consider semi-bluffing to apply pressure while preserving your equity.`,
        solverNotes: [
            "Draws can semi-bluff for immediate fold equity.",
            "Betting can win the pot before showdown.",
            "Consider pot odds and implied odds.",
            "Balance aggression with pot control.",
        ],
    };
}
function getPureBluffMeta(polarity, street) {
    const streetName = streetToName(street);
    if (polarity === "polarized") {
        return {
            concepts: ["bluff", "range-polarization"],
            summary: `With no made hand on the ${streetName}, your only path to winning is folding out better. In polarized spots, commit fully to the bluff or give up.`,
            solverNotes: [
                "Bluffing requires fold equity to be profitable.",
                "Choose hands with blocking effects.",
                "Sizing should match your value range.",
                "Giving up is often correct without strong blockers.",
            ],
        };
    }
    return {
        concepts: ["bluff", "fold-equity"],
        summary: `With no made hand on the ${streetName}, evaluate whether bluffing or giving up is more profitable. Consider villain's continuing range.`,
        solverNotes: [
            "Bluffs need fold equity to profit.",
            "Smaller bluffs risk less when called.",
            "Consider giving up with poor blockers.",
            "Select bluff candidates strategically.",
        ],
    };
}
function getGiveUpMeta(polarity, street) {
    const streetName = streetToName(street);
    return {
        concepts: ["pot-control", "showdown-value"],
        summary: `With a weak holding on the ${streetName}, prioritize getting to showdown cheaply. Avoid building a pot you cannot win.`,
        solverNotes: [
            "Weak hands should minimize losses.",
            "Checking preserves your stack.",
            "Calling may have value with showdown equity.",
            "Folding to aggression is often correct.",
        ],
    };
}
function getDefaultMeta(polarity, street) {
    const streetName = streetToName(street);
    return {
        concepts: ["decision-making"],
        summary: `On the ${streetName}, consider your range, villain's range, and the pot odds to make the best decision.`,
        solverNotes: [
            "Evaluate your hand strength relative to the board.",
            "Consider villain's likely holdings.",
            "Choose actions that maximize expected value.",
            "Think about future streets.",
        ],
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function streetToName(street) {
    switch (street) {
        case "f":
            return "flop";
        case "t":
            return "turn";
        case "r":
            return "river";
        default:
            return "board";
    }
}
/**
 * Get concepts whitelist.
 * These are the only concepts that can appear in meta.
 */
exports.ALLOWED_CONCEPTS = [
    "value-bet",
    "value-max",
    "thin-value",
    "trap",
    "slowplay",
    "range-advantage",
    "range-polarization",
    "semi-bluff",
    "bluff",
    "bluffcatcher",
    "fold-equity",
    "equity-pressure",
    "equity-realization",
    "pot-control",
    "showdown-value",
    "draw-play",
    "decision-making",
];
/**
 * Filter concepts to whitelist.
 */
function filterConcepts(concepts) {
    return concepts.filter((c) => exports.ALLOWED_CONCEPTS.includes(c));
}
