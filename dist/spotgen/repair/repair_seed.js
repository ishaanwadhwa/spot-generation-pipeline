"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairSeedInPlace = repairSeedInPlace;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const validator_1 = require("../validator");
const repairSpot_1 = require("./repairSpot");
function findGeneratedSpotsArrayLiteralRange(seedText) {
    const anchor = seedText.indexOf("export const generatedSpots");
    if (anchor === -1)
        throw new Error('Could not find "export const generatedSpots" in seed.ts');
    const eq = seedText.indexOf("=", anchor);
    if (eq === -1)
        throw new Error('Could not find "=" after "export const generatedSpots"');
    const start = seedText.indexOf("[", eq);
    if (start === -1)
        throw new Error("Could not find '[' starting generatedSpots array");
    let i = start;
    let depth = 0;
    let inS = false;
    let inD = false;
    let inT = false;
    let inLineComment = false;
    let inBlockComment = false;
    let esc = false;
    for (; i < seedText.length; i++) {
        const c = seedText[i];
        const n = seedText[i + 1];
        if (inLineComment) {
            if (c === "\n")
                inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (c === "*" && n === "/") {
                inBlockComment = false;
                i++;
            }
            continue;
        }
        if (inS || inD || inT) {
            if (esc) {
                esc = false;
                continue;
            }
            if (c === "\\") {
                esc = true;
                continue;
            }
            if (inS && c === "'")
                inS = false;
            else if (inD && c === '"')
                inD = false;
            else if (inT && c === "`")
                inT = false;
            continue;
        }
        if (c === "/" && n === "/") {
            inLineComment = true;
            i++;
            continue;
        }
        if (c === "/" && n === "*") {
            inBlockComment = true;
            i++;
            continue;
        }
        if (c === "'") {
            inS = true;
            continue;
        }
        if (c === '"') {
            inD = true;
            continue;
        }
        if (c === "`") {
            inT = true;
            continue;
        }
        if (c === "[")
            depth++;
        if (c === "]") {
            depth--;
            if (depth === 0)
                return { start, end: i + 1 };
            if (depth < 0)
                throw new Error("Bracket matching went negative while parsing seed.ts");
        }
    }
    throw new Error("Unterminated generatedSpots array literal (no matching ']')");
}
function repairSeedInPlace(repoRoot) {
    const seedPath = path_1.default.join(repoRoot, "seed.ts");
    const txt = fs_1.default.readFileSync(seedPath, "utf8");
    const { start, end } = findGeneratedSpotsArrayLiteralRange(txt);
    const arrayLiteral = txt.slice(start, end);
    // eslint-disable-next-line no-new-func
    const existing = Function(`"use strict"; return (${arrayLiteral});`)();
    if (!Array.isArray(existing))
        throw new Error("generatedSpots is not an array");
    let repaired = 0;
    const fixed = existing.map((s) => {
        const before = (0, validator_1.validateSpotOutput)(s);
        if (before.ok)
            return s;
        repaired++;
        return (0, repairSpot_1.repairSpotMath)(s);
    });
    const replacement = JSON.stringify(fixed, null, 2);
    const out = txt.slice(0, start) + replacement + txt.slice(end);
    fs_1.default.writeFileSync(seedPath, out, "utf8");
    return { repaired, total: fixed.length };
}
