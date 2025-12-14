"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairSpotMath = repairSpotMath;
const validator_1 = require("../validator");
function round4(n) {
    return Math.round(n * 10000) / 10000;
}
function repairSpotMath(spot) {
    // Recompute pot at decision point from hist contributions + blinds
    const pot = round4((0, validator_1.potFromHist)(spot.data.hist));
    spot.data.pot = pot;
    // Repair opts bet exact amounts when sizeRef is numeric %
    spot.data.opts = spot.data.opts.map((o) => {
        if (Array.isArray(o) && o[0] === "b" && typeof o[1] === "number") {
            return ["b", o[1], round4((o[1] / 100) * pot)];
        }
        return o;
    });
    // Repair % bet exact amounts in hist by walking pot street-by-street
    // Convention: bet sizingRef is % of current pot before the bet.
    let runningPot = 0.5 + 1.0;
    const newHist = [];
    for (const a of spot.data.hist) {
        if (!Array.isArray(a)) {
            newHist.push(a);
            continue;
        }
        const code = a[1];
        if (code === "b" && typeof a[2] === "number") {
            const pct = a[2];
            const exact = round4((pct / 100) * runningPot);
            newHist.push([a[0], "b", pct, exact]);
            runningPot += exact;
            continue;
        }
        if (code === "c" || code === "r" || code === "a") {
            const exact = a[3];
            newHist.push(a);
            if (typeof exact === "number")
                runningPot += exact;
            continue;
        }
        // x/f/street markers
        newHist.push(a);
    }
    spot.data.hist = newHist;
    // After repairing hist, re-sync pot again (since we changed bet exacts)
    spot.data.pot = round4((0, validator_1.potFromHist)(spot.data.hist));
    // And re-sync opts again
    spot.data.opts = spot.data.opts.map((o) => {
        if (Array.isArray(o) && o[0] === "b" && typeof o[1] === "number") {
            return ["b", o[1], round4((o[1] / 100) * spot.data.pot)];
        }
        return o;
    });
    return spot;
}
