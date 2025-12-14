"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditSpotById = auditSpotById;
exports.buildAuditPacketFromSpot = buildAuditPacketFromSpot;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const classify_1 = require("../poker/classify");
const turnClassify_1 = require("../poker/turnClassify");
const handFeatures_1 = require("../poker/handFeatures");
const intent_1 = require("../poker/intent");
const snippets_1 = require("../theory/snippets");
function findGeneratedSpotsArrayLiteral(seedText) {
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
                return seedText.slice(start, i + 1);
            if (depth < 0)
                throw new Error("Bracket matching went negative while parsing seed.ts");
        }
    }
    throw new Error("Unterminated generatedSpots array literal (no matching ']')");
}
function loadSeedSpots(repoRoot) {
    const seedPath = path_1.default.join(repoRoot, "seed.ts");
    const txt = fs_1.default.readFileSync(seedPath, "utf8");
    const literal = findGeneratedSpotsArrayLiteral(txt);
    // eslint-disable-next-line no-new-func
    const arr = Function(`"use strict"; return (${literal});`)();
    if (!Array.isArray(arr))
        throw new Error("generatedSpots is not an array");
    return arr;
}
function auditSpotById(repoRoot, id) {
    const spots = loadSeedSpots(repoRoot);
    const spot = spots.find((s) => s.id === id);
    if (!spot)
        throw new Error(`Spot not found: ${id}`);
    const brd = spot.data.brd;
    const flop = [brd[0], brd[1], brd[2]];
    const turn = brd[3];
    const hero = spot.data.hero.hand;
    // Compute turnType first (Phase 1.1 aware classification)
    const turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    const heroClass = (0, classify_1.classifyHeroHandOnBoard)(hero, brd, turnType);
    const hand = (0, handFeatures_1.computeHandFeatures)(hero, brd);
    const pairQuality = (0, classify_1.getPairQuality)(hero, brd);
    const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, hand, pairQuality, turnType);
    const nodeIntent = (0, intent_1.inferNodeIntent)(spot);
    const flopClassTag = spot.tags.find((t) => t.includes("_")) || spot.tags.find((t) => t.includes("disconnected")) || undefined;
    const corpus = (0, snippets_1.loadTheoryCorpus)(repoRoot);
    const bullets = (0, snippets_1.buildSolverNotes)({
        corpus,
        flopClassLabel: flopClassTag || "low_disconnected",
        turnType,
    });
    return {
        id,
        spot,
        features: { heroClass, turnType, flopClassTag, hand, handIntent, nodeIntent },
        theory: { bullets },
        outputFormat: {
            constraintsSchema: {
                avoidHeroClasses: ["monster"],
                requireTurnType: "blank_turn",
                intent: "pressure",
            },
            instructions: "Return ONLY a JSON object matching constraintsSchema. Do not edit the spot. If spot is acceptable, return {}.",
        },
    };
}
function buildAuditPacketFromSpot(repoRoot, spot) {
    const brd = spot.data.brd;
    const flop = [brd[0], brd[1], brd[2]];
    const turn = brd[3];
    const hero = spot.data.hero.hand;
    // Compute turnType first (Phase 1.1 aware classification)
    const turnType = (0, turnClassify_1.classifyTurn)(flop, turn);
    const heroClass = (0, classify_1.classifyHeroHandOnBoard)(hero, brd, turnType);
    const hand = (0, handFeatures_1.computeHandFeatures)(hero, brd);
    const pairQuality = (0, classify_1.getPairQuality)(hero, brd);
    const handIntent = (0, intent_1.classifyHandIntentWithContext)(heroClass, hand, pairQuality, turnType);
    const nodeIntent = (0, intent_1.inferNodeIntent)(spot);
    const flopClassTag = spot.tags.find((t) => t.includes("_")) || spot.tags.find((t) => t.includes("disconnected")) || undefined;
    const corpus = (0, snippets_1.loadTheoryCorpus)(repoRoot);
    const bullets = (0, snippets_1.buildSolverNotes)({
        corpus,
        flopClassLabel: flopClassTag || "low_disconnected",
        turnType,
    });
    return {
        id: spot.id,
        spot,
        features: { heroClass, turnType, flopClassTag, hand, handIntent, nodeIntent },
        theory: { bullets },
        outputFormat: {
            constraintsSchema: {
                avoidHeroClasses: ["monster"],
                requireTurnType: "blank_turn",
                intent: "pressure",
            },
            instructions: "Return ONLY a JSON object matching constraintsSchema. Do not edit the spot. If spot is acceptable, return {}.",
        },
    };
}
