"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTheoryCorpus = loadTheoryCorpus;
exports.buildSolverNotes = buildSolverNotes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function readText(p) {
    return fs_1.default.readFileSync(p, "utf8");
}
let cached = null;
function loadTheoryCorpus(repoRoot) {
    if (cached && cached.repoRoot === repoRoot)
        return cached.corpus;
    const coreHybrid = readText(path_1.default.join(repoRoot, "theory", "core", "CORE_HYBRID_ENGINE.md"));
    const preflopTheoryJson = JSON.parse(readText(path_1.default.join(repoRoot, "theory", "preflop", "metadata", "theory.json")));
    const postflopCore = readText(path_1.default.join(repoRoot, "theory", "postflop", "explanations", "postflop_core.md"));
    const flopDocs = readText(path_1.default.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "flop_matrix.MD"));
    const turnDocs = readText(path_1.default.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "turn_matrix.MD"));
    const riverDocs = readText(path_1.default.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "river_matrix.MD"));
    const corpus = { coreHybrid, preflopTheoryJson, postflopCore, flopDocs, turnDocs, riverDocs };
    cached = { repoRoot, corpus };
    return corpus;
}
function normalizeLine(s) {
    return s
        .replace(/â[\s\S]{0,3}/g, "") // strip common mojibake fragments
        .replace(/\s+/g, " ")
        .trim();
}
function extractSection(md, headingIncludes, maxLines = 120) {
    const lines = md.split("\n");
    const idx = lines.findIndex((l) => l.toLowerCase().includes(headingIncludes.toLowerCase()));
    if (idx === -1)
        return [];
    const out = [];
    for (let i = idx + 1; i < lines.length && out.length < maxLines; i++) {
        const line = lines[i];
        if (/^#{1,3}\s+/.test(line) && out.length > 0)
            break;
        out.push(line);
    }
    return out;
}
function extractBullets(sectionLines, maxBullets) {
    const bullets = [];
    for (const l of sectionLines) {
        const t = l.trim();
        if (t.startsWith("- ") || t.startsWith("* ")) {
            const b = normalizeLine(t.replace(/^[-*]\s+/, ""));
            // avoid generic examples / unrelated text leaking into spots
            if (!b || /^example:/i.test(b))
                continue;
            bullets.push(b);
            if (bullets.length >= maxBullets)
                break;
        }
    }
    return bullets;
}
function buildSolverNotes(params) {
    const notes = [];
    // Keep solverNotes tight and spot-relevant. Avoid generic "design philosophy" lines.
    // Flop texture note from solver-truth docs (bullet extraction)
    if (params.flopClassLabel === "low_disconnected") {
        const sec = extractSection(params.corpus.flopDocs, "Low Disconnected Boards");
        const bullets = extractBullets(sec, 2);
        for (const b of bullets)
            notes.push(b);
    }
    // Turn card classification note from turn docs
    if (params.turnType === "blank_turn") {
        const sec = extractSection(params.corpus.turnDocs, "Blank Turns");
        const bullets = extractBullets(sec, 1);
        for (const b of bullets)
            notes.push(b);
    }
    else if (params.turnType === "overcard_turn") {
        const sec = extractSection(params.corpus.turnDocs, "Overcards to the Flop");
        const bullets = extractBullets(sec, 1);
        for (const b of bullets)
            notes.push(b);
    }
    else if (params.turnType === "straight_completer") {
        const sec = extractSection(params.corpus.turnDocs, "Straight Completers");
        const bullets = extractBullets(sec, 1);
        for (const b of bullets)
            notes.push(b);
    }
    else if (params.turnType === "flush_completer") {
        const sec = extractSection(params.corpus.turnDocs, "Flush-Completing Turns");
        const bullets = extractBullets(sec, 1);
        for (const b of bullets)
            notes.push(b);
    }
    else if (params.turnType === "paired_turn") {
        const sec = extractSection(params.corpus.turnDocs, "Paired Turns");
        const bullets = extractBullets(sec, 1);
        for (const b of bullets)
            notes.push(b);
    }
    // Postflop core: large bet logic (good for turn barrel spots)
    const secCore = extractSection(params.corpus.postflopCore, "Large Bet Strategy");
    const coreBullets = extractBullets(secCore, 1);
    for (const b of coreBullets)
        notes.push(b);
    // Clamp to 2–4 bullets for UI
    return notes.filter(Boolean).slice(0, 4);
}
