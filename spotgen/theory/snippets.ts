import fs from "fs";
import path from "path";

function readText(p: string): string {
  return fs.readFileSync(p, "utf8");
}

export interface TheoryCorpus {
  coreHybrid: string;
  preflopTheoryJson: any;
  postflopCore: string;
  flopDocs: string;
  turnDocs: string;
  riverDocs: string;
}

let cached: { repoRoot: string; corpus: TheoryCorpus } | null = null;

export function loadTheoryCorpus(repoRoot: string): TheoryCorpus {
  if (cached && cached.repoRoot === repoRoot) return cached.corpus;
  const coreHybrid = readText(path.join(repoRoot, "theory", "core", "CORE_HYBRID_ENGINE.md"));
  const preflopTheoryJson = JSON.parse(
    readText(path.join(repoRoot, "theory", "preflop", "metadata", "theory.json"))
  );
  const postflopCore = readText(path.join(repoRoot, "theory", "postflop", "explanations", "postflop_core.md"));
  const flopDocs = readText(path.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "flop_matrix.MD"));
  const turnDocs = readText(path.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "turn_matrix.MD"));
  const riverDocs = readText(path.join(repoRoot, "theory", "postflop", "examples", "solver_truth_docs", "river_matrix.MD"));
  const corpus = { coreHybrid, preflopTheoryJson, postflopCore, flopDocs, turnDocs, riverDocs };
  cached = { repoRoot, corpus };
  return corpus;
}

function normalizeLine(s: string): string {
  return s
    .replace(/â[\s\S]{0,3}/g, "") // strip common mojibake fragments
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(md: string, headingIncludes: string, maxLines = 120): string[] {
  const lines = md.split("\n");
  const idx = lines.findIndex((l) => l.toLowerCase().includes(headingIncludes.toLowerCase()));
  if (idx === -1) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length && out.length < maxLines; i++) {
    const line = lines[i];
    if (/^#{1,3}\s+/.test(line) && out.length > 0) break;
    out.push(line);
  }
  return out;
}

function extractBullets(sectionLines: string[], maxBullets: number): string[] {
  const bullets: string[] = [];
  for (const l of sectionLines) {
    const t = l.trim();
    if (t.startsWith("- ") || t.startsWith("* ")) {
      const b = normalizeLine(t.replace(/^[-*]\s+/, ""));
      // avoid generic examples / unrelated text leaking into spots
      if (!b || /^example:/i.test(b)) continue;
      bullets.push(b);
      if (bullets.length >= maxBullets) break;
    }
  }
  return bullets;
}

export function buildSolverNotes(params: {
  corpus: TheoryCorpus;
  flopClassLabel: "low_disconnected" | "dry_Axx_highcard" | "dry_Kxx_Qxx" | "medium_connected" | "wet_two_suited" | "monotone" | "paired_board" | "two_tone" | "rainbow_connected";
  turnType: "blank_turn" | "overcard_turn" | "straight_completer" | "flush_completer" | "paired_turn" | "unknown";
}): string[] {
  const notes: string[] = [];

  // Keep solverNotes tight and spot-relevant. Avoid generic "design philosophy" lines.

  // Flop texture note from solver-truth docs (bullet extraction)
  if (params.flopClassLabel === "low_disconnected") {
    const sec = extractSection(params.corpus.flopDocs, "Low Disconnected Boards");
    const bullets = extractBullets(sec, 2);
    for (const b of bullets) notes.push(b);
  }

  // Turn card classification note from turn docs
  if (params.turnType === "blank_turn") {
    const sec = extractSection(params.corpus.turnDocs, "Blank Turns");
    const bullets = extractBullets(sec, 1);
    for (const b of bullets) notes.push(b);
  } else if (params.turnType === "overcard_turn") {
    const sec = extractSection(params.corpus.turnDocs, "Overcards to the Flop");
    const bullets = extractBullets(sec, 1);
    for (const b of bullets) notes.push(b);
  } else if (params.turnType === "straight_completer") {
    const sec = extractSection(params.corpus.turnDocs, "Straight Completers");
    const bullets = extractBullets(sec, 1);
    for (const b of bullets) notes.push(b);
  } else if (params.turnType === "flush_completer") {
    const sec = extractSection(params.corpus.turnDocs, "Flush-Completing Turns");
    const bullets = extractBullets(sec, 1);
    for (const b of bullets) notes.push(b);
  } else if (params.turnType === "paired_turn") {
    const sec = extractSection(params.corpus.turnDocs, "Paired Turns");
    const bullets = extractBullets(sec, 1);
    for (const b of bullets) notes.push(b);
  }

  // Postflop core: large bet logic (good for turn barrel spots)
  const secCore = extractSection(params.corpus.postflopCore, "Large Bet Strategy");
  const coreBullets = extractBullets(secCore, 1);
  for (const b of coreBullets) notes.push(b);

  // Clamp to 2–4 bullets for UI
  return notes.filter(Boolean).slice(0, 4);
}


