"use strict";
/**
 * spotgen/validator.ts
 *
 * Deterministic validator for SpotOutput objects.
 * - Validates basic shape
 * - Validates action tuple formats + street sequencing
 * - Recomputes pot from blinds + exactAmount entries in hist
 * - Validates opts % bet sizings against data.pot (unrounded exactAmount)
 *
 * Conventions:
 * - Blinds are assumed posted: SB=0.5, BB=1.0
 * - exactAmount is unrounded exact math (UI may round)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLINDS = void 0;
exports.potFromHist = potFromHist;
exports.validateSpotOutput = validateSpotOutput;
exports.BLINDS = { SB: 0.5, BB: 1.0 };
function isFiniteNumber(n) {
    return typeof n === "number" && Number.isFinite(n);
}
function betOptionSizes(spot) {
    const sizes = [];
    for (const o of spot.data.opts || []) {
        if (!Array.isArray(o))
            continue;
        if (o[0] === "b" && typeof o[1] === "number")
            sizes.push(o[1]);
    }
    return sizes;
}
function assert(cond, msg, errors) {
    if (!cond)
        errors.push(msg);
}
function isStreetMarker(a) {
    return (Array.isArray(a) &&
        a.length === 2 &&
        a[0] === "-" &&
        (a[1] === "p" || a[1] === "f" || a[1] === "t" || a[1] === "r"));
}
function sumActionContrib(action) {
    if (!Array.isArray(action) || action.length < 2)
        return 0;
    const code = action[1];
    if (code === "c" || code === "b" || code === "r" || code === "a") {
        const exact = action[3];
        return isFiniteNumber(exact) ? exact : 0;
    }
    return 0;
}
function potFromHist(hist) {
    let pot = exports.BLINDS.SB + exports.BLINDS.BB;
    for (const a of hist)
        pot += sumActionContrib(a);
    return pot;
}
function validateStreetOrder(hist, errors) {
    const order = ["p", "f", "t", "r"];
    let curIdx = -1;
    for (const a of hist) {
        if (!isStreetMarker(a))
            continue;
        const idx = order.indexOf(a[1]);
        assert(idx >= 0, `Invalid street marker: ${JSON.stringify(a)}`, errors);
        assert(idx >= curIdx, `Street marker goes backwards: ${JSON.stringify(a)}`, errors);
        curIdx = idx;
    }
}
function validateActionTuple(a, errors, ctx) {
    if (!Array.isArray(a)) {
        errors.push(`Non-array ${ctx} action: ${JSON.stringify(a)}`);
        return;
    }
    if (isStreetMarker(a))
        return;
    assert(typeof a[0] === "string" && a[0].length > 0, `Invalid position in action: ${JSON.stringify(a)}`, errors);
    const code = a[1];
    assert(typeof code === "string", `Invalid action code type: ${JSON.stringify(a)}`, errors);
    if (code === "x" || code === "f") {
        assert(a.length === 2, `Action ${code} must be length-2: ${JSON.stringify(a)}`, errors);
        return;
    }
    if (code === "c") {
        assert(a.length === 4, `Call must be [pos,"c",null,exact]: ${JSON.stringify(a)}`, errors);
        assert(a[2] === null, `Call sizeRef must be null: ${JSON.stringify(a)}`, errors);
        assert(isFiniteNumber(a[3]) && a[3] >= 0, `Call exact must be >=0: ${JSON.stringify(a)}`, errors);
        return;
    }
    if (code === "b") {
        assert(a.length === 4, `Bet must be [pos,"b",sizeRef,exact]: ${JSON.stringify(a)}`, errors);
        const sizeRef = a[2];
        assert((isFiniteNumber(sizeRef) && sizeRef > 0) || sizeRef === "pot", `Bet sizeRef invalid: ${JSON.stringify(a)}`, errors);
        assert(isFiniteNumber(a[3]) && a[3] >= 0, `Bet exact must be >=0: ${JSON.stringify(a)}`, errors);
        return;
    }
    if (code === "r") {
        assert(a.length === 4, `Raise must be [pos,"r",sizeRef,exact]: ${JSON.stringify(a)}`, errors);
        assert(typeof a[2] === "string" && a[2].length > 0, `Raise sizeRef must be string: ${JSON.stringify(a)}`, errors);
        assert(isFiniteNumber(a[3]) && a[3] >= 0, `Raise exact must be >=0: ${JSON.stringify(a)}`, errors);
        return;
    }
    if (code === "a") {
        assert(a.length === 4, `All-in must be [pos,"a","AI"|null,exact]: ${JSON.stringify(a)}`, errors);
        assert(a[2] === "AI" || a[2] === null, `All-in sizeRef must be "AI" or null: ${JSON.stringify(a)}`, errors);
        assert(isFiniteNumber(a[3]) && a[3] >= 0, `All-in exact must be >=0: ${JSON.stringify(a)}`, errors);
        return;
    }
    errors.push(`Unknown action code "${String(code)}" in ${ctx}: ${JSON.stringify(a)}`);
}
function validateOptionTuple(opt, errors) {
    if (!Array.isArray(opt) || opt.length < 1) {
        errors.push(`Invalid option: ${JSON.stringify(opt)}`);
        return;
    }
    const code = opt[0];
    if (code === "x" || code === "f") {
        assert(opt.length === 1, `Option ${String(code)} must be length-1: ${JSON.stringify(opt)}`, errors);
        return;
    }
    if (code === "c") {
        assert(opt.length === 3 && opt[1] === null && isFiniteNumber(opt[2]), `Call option must be ["c",null,exact]: ${JSON.stringify(opt)}`, errors);
        return;
    }
    if (code === "b") {
        assert(opt.length === 3, `Bet option must be ["b",sizeRef,exact]: ${JSON.stringify(opt)}`, errors);
        assert(isFiniteNumber(opt[1]) || opt[1] === "pot", `Bet option sizeRef invalid: ${JSON.stringify(opt)}`, errors);
        assert(isFiniteNumber(opt[2]) && opt[2] >= 0, `Bet option exact invalid: ${JSON.stringify(opt)}`, errors);
        return;
    }
    if (code === "r") {
        assert(opt.length === 3 && typeof opt[1] === "string", `Raise option must be ["r",sizeRef,exact]: ${JSON.stringify(opt)}`, errors);
        assert(isFiniteNumber(opt[2]) && opt[2] >= 0, `Raise option exact invalid: ${JSON.stringify(opt)}`, errors);
        return;
    }
    if (code === "a") {
        assert(opt.length === 3 && (opt[1] === "AI" || opt[1] === null), `All-in option must be ["a","AI"|null,exact]: ${JSON.stringify(opt)}`, errors);
        assert(isFiniteNumber(opt[2]) && opt[2] >= 0, `All-in option exact invalid: ${JSON.stringify(opt)}`, errors);
        return;
    }
    errors.push(`Unknown option code "${String(code)}": ${JSON.stringify(opt)}`);
}
function validateSizingAgainstPot(spot, errors) {
    // Check only % sizing (numeric) -> exact ~= (pct/100)*pot at decision point
    const pot = spot.data.pot;
    if (!isFiniteNumber(pot) || pot <= 0)
        return;
    for (const opt of spot.data.opts || []) {
        if (!Array.isArray(opt) || opt[0] !== "b")
            continue;
        const sizeRef = opt[1];
        const exact = opt[2];
        if (!isFiniteNumber(sizeRef))
            continue;
        const expected = (sizeRef / 100) * pot;
        assert(Math.abs(exact - expected) < 1e-3, `Option bet sizing mismatch: sizeRef=${sizeRef}% pot=${pot} expected=${expected} got=${exact}`, errors);
    }
}
function validateMeta(spot, errors) {
    const meta = spot.data.meta;
    if (!meta)
        return;
    assert(Array.isArray(meta.concept), "meta.concept must be string[]", errors);
    if (Array.isArray(meta.concept)) {
        assert(meta.concept.length <= 6, "meta.concept must be <= 6 items", errors);
    }
    if ("solverNotes" in meta) {
        assert(Array.isArray(meta.solverNotes), "meta.solverNotes must be string[]", errors);
        if (Array.isArray(meta.solverNotes)) {
            assert(meta.solverNotes.length >= 2 && meta.solverNotes.length <= 4, "meta.solverNotes should be 2–4 bullets", errors);
        }
    }
}
function validateIntentCompatibility(spot, errors) {
    // Deterministic "policy" check: ensure the node's sizing family matches the hero hand's intent.
    // We infer node intent from meta/tags + option families (no stored field required).
    // We infer hand intent from hand+board features (pairs/draws).
    // IMPORTANT: Use Phase 1.1 aware functions (same as generator)
    try {
        // local imports to avoid circular deps in validator core
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { classifyHeroHandOnBoard, getPairQuality } = require("./poker/classify");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { computeHandFeatures } = require("./poker/handFeatures");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { classifyHandIntentWithContext, inferNodeIntent } = require("./poker/intent");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { classifyTurn } = require("./poker/turnClassify");
        const brd = spot.data.brd;
        if (!Array.isArray(brd) || brd.length < 3)
            return;
        const hero = spot.data.hero?.hand;
        if (!Array.isArray(hero) || hero.length !== 2)
            return;
        // Compute turnType first (Phase 1.1 aware classification)
        const flop = [brd[0], brd[1], brd[2]];
        const turn = brd.length > 3 ? brd[3] : null;
        const turnType = turn ? classifyTurn(flop, turn) : "blank_turn";
        const heroClass = classifyHeroHandOnBoard(hero, brd, turnType);
        const feats = computeHandFeatures(hero, brd);
        const pairQuality = getPairQuality(hero, brd);
        const handIntent = classifyHandIntentWithContext(heroClass, feats, pairQuality, turnType);
        const nodeIntent = inferNodeIntent(spot);
        const sizes = betOptionSizes(spot);
        const hasLarge = sizes.some((s) => s >= 75);
        const hasSmall = sizes.some((s) => s > 0 && s <= 50);
        // NodeIntent policy table (v1)
        //
        // Valid combinations:
        // - value: made_value, thin_value
        // - semi_bluff: combo_draw, draw, thin_value (small only)
        // - pressure: made_value, thin_value (not large), combo_draw, draw
        // - bluffcatch: thin_value, give_up (pot control / showdown value)
        //
        // give_up hands should ONLY match bluffcatch (checking is dominant)
        // If a give_up hand has betting options, it's a generation error.
        if (handIntent === "give_up") {
            // give_up hands should only be in bluffcatch nodes (check-dominant)
            if (nodeIntent !== "bluffcatch") {
                errors.push(`Intent mismatch: give_up hand should have bluffcatch nodeIntent, got ${nodeIntent}`);
            }
        }
        if (nodeIntent === "value") {
            if (!(handIntent === "made_value" || handIntent === "thin_value")) {
                errors.push(`Intent mismatch: nodeIntent=value but handIntent=${handIntent}`);
            }
        }
        if (nodeIntent === "semi_bluff") {
            if (!(handIntent === "combo_draw" || handIntent === "draw")) {
                // allow thin_value when it's a pure protection/probe style spot, but only if we are small-only and not tagged barrel
                if (!(handIntent === "thin_value" && hasSmall && !hasLarge && !(spot.tags || []).includes("barrel"))) {
                    errors.push(`Intent mismatch: nodeIntent=semi_bluff but handIntent=${handIntent}`);
                }
            }
        }
        if (nodeIntent === "pressure") {
            // Hard gate: thin-value hands never get >=75 sizing families.
            if (handIntent === "thin_value" && sizes.some((s) => s >= 75)) {
                errors.push("Intent mismatch: thin_value hand cannot use >=75% sizing (protection/pot-control only)");
            }
            // If we offer big barrels, hero shouldn't be pure bluff with no draw equity.
            if (hasLarge && handIntent === "pure_bluff") {
                errors.push("Intent mismatch: large barrel options with pure_bluff hand (no draw/pair) are disallowed");
            }
            // Small-only with pure bluff is also suspicious (usually checking dominates).
            if (hasSmall && !hasLarge && handIntent === "pure_bluff") {
                errors.push("Intent mismatch: small-barrel-only node with pure_bluff hand is disallowed (prefer check)");
            }
        }
    }
    catch {
        // ignore if poker modules unavailable
    }
}
function validateSpotOutput(spot) {
    const errors = [];
    const s = spot;
    assert(!!spot && typeof spot === "object", "Spot must be an object", errors);
    assert(typeof s?.id === "string", "spot.id must be string", errors);
    assert(typeof s?.fmt === "string", "spot.fmt must be string", errors);
    assert(typeof s?.str === "string", "spot.str must be string", errors);
    assert(isFiniteNumber(s?.difficulty), "spot.difficulty must be number", errors);
    assert(Array.isArray(s?.tags), "spot.tags must be string[]", errors);
    if (Array.isArray(s?.tags)) {
        assert(s.tags.length <= 6, "spot.tags must be <= 6 items", errors);
    }
    const data = s?.data;
    assert(!!data && typeof data === "object", "spot.data must be object", errors);
    if (!data)
        return { ok: false, errors };
    assert(typeof data.id === "string", "data.id must be string", errors);
    assert(isFiniteNumber(data.st) && data.st > 0, "data.st must be positive number", errors);
    assert(typeof data.fmt === "string", "data.fmt must be string", errors);
    assert(typeof data.str === "string", "data.str must be string", errors);
    assert(typeof data.hero?.pos === "string", "data.hero.pos must be string", errors);
    assert(Array.isArray(data.hero?.hand) && data.hero.hand.length === 2, "data.hero.hand must be [c1,c2]", errors);
    assert(Array.isArray(data.v), "data.v must be string[]", errors);
    assert(Array.isArray(data.brd), "data.brd must be string[]", errors);
    assert(isFiniteNumber(data.pot) && data.pot >= 0, "data.pot must be number", errors);
    assert(Array.isArray(data.hist), "data.hist must be array", errors);
    assert(Array.isArray(data.opts), "data.opts must be array", errors);
    assert(typeof data.sol?.b === "number" && Array.isArray(data.sol?.ev), "data.sol must have b and ev[]", errors);
    if (Array.isArray(data.hist)) {
        validateStreetOrder(data.hist, errors);
        for (const a of data.hist)
            validateActionTuple(a, errors, "hist");
    }
    if (Array.isArray(data.opts)) {
        for (const o of data.opts)
            validateOptionTuple(o, errors);
    }
    if (Array.isArray(data.hist)) {
        const computed = potFromHist(data.hist);
        assert(Math.abs(computed - data.pot) < 1e-6, `data.pot mismatch: expected ${computed} got ${data.pot}`, errors);
    }
    validateSizingAgainstPot(s, errors);
    validateMeta(s, errors);
    validateIntentCompatibility(s, errors);
    return { ok: errors.length === 0, errors };
}
