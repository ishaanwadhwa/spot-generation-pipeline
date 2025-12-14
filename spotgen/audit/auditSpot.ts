import fs from "fs";
import path from "path";
import type { AuditPacket } from "./types";
import type { SpotOutputLike } from "../validator";
import { classifyHeroHandOnBoard, getPairQuality } from "../poker/classify";
import { classifyTurn, type TurnType } from "../poker/turnClassify";
import { computeHandFeatures } from "../poker/handFeatures";
import { classifyHandIntentWithContext, inferNodeIntent } from "../poker/intent";
import { loadTheoryCorpus, buildSolverNotes } from "../theory/snippets";

function findGeneratedSpotsArrayLiteral(seedText: string): string {
  const anchor = seedText.indexOf("export const generatedSpots");
  if (anchor === -1) throw new Error('Could not find "export const generatedSpots" in seed.ts');
  const eq = seedText.indexOf("=", anchor);
  if (eq === -1) throw new Error('Could not find "=" after "export const generatedSpots"');
  const start = seedText.indexOf("[", eq);
  if (start === -1) throw new Error("Could not find '[' starting generatedSpots array");

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
      if (c === "\n") inLineComment = false;
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
      if (inS && c === "'") inS = false;
      else if (inD && c === '"') inD = false;
      else if (inT && c === "`") inT = false;
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

    if (c === "[") depth++;
    if (c === "]") {
      depth--;
      if (depth === 0) return seedText.slice(start, i + 1);
      if (depth < 0) throw new Error("Bracket matching went negative while parsing seed.ts");
    }
  }
  throw new Error("Unterminated generatedSpots array literal (no matching ']')");
}

function loadSeedSpots(repoRoot: string): SpotOutputLike[] {
  const seedPath = path.join(repoRoot, "seed.ts");
  const txt = fs.readFileSync(seedPath, "utf8");
  const literal = findGeneratedSpotsArrayLiteral(txt);
  // eslint-disable-next-line no-new-func
  const arr = Function(`"use strict"; return (${literal});`)() as unknown;
  if (!Array.isArray(arr)) throw new Error("generatedSpots is not an array");
  return arr as SpotOutputLike[];
}

export function auditSpotById(repoRoot: string, id: string): AuditPacket {
  const spots = loadSeedSpots(repoRoot);
  const spot = spots.find((s) => s.id === id);
  if (!spot) throw new Error(`Spot not found: ${id}`);

  const brd = spot.data.brd;
  const flop: [string, string, string] = [brd[0], brd[1], brd[2]];
  const turn = brd[3];
  const hero = spot.data.hero.hand;

  // Compute turnType first (Phase 1.1 aware classification)
  const turnType: TurnType = classifyTurn(flop, turn);
  const heroClass = classifyHeroHandOnBoard(hero, brd, turnType);
  const hand = computeHandFeatures(hero, brd);
  const pairQuality = getPairQuality(hero, brd);
  const handIntent = classifyHandIntentWithContext(heroClass, hand, pairQuality, turnType);
  const nodeIntent = inferNodeIntent(spot);
  const flopClassTag = spot.tags.find((t) => t.includes("_")) || spot.tags.find((t) => t.includes("disconnected")) || undefined;

  const corpus = loadTheoryCorpus(repoRoot);
  const bullets = buildSolverNotes({
    corpus,
    flopClassLabel: (flopClassTag as any) || "low_disconnected",
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
      instructions:
        "Return ONLY a JSON object matching constraintsSchema. Do not edit the spot. If spot is acceptable, return {}.",
    },
  };
}

export function buildAuditPacketFromSpot(repoRoot: string, spot: SpotOutputLike): AuditPacket {
  const brd = spot.data.brd;
  const flop: [string, string, string] = [brd[0], brd[1], brd[2]];
  const turn = brd[3];
  const hero = spot.data.hero.hand;

  // Compute turnType first (Phase 1.1 aware classification)
  const turnType: TurnType = classifyTurn(flop, turn);
  const heroClass = classifyHeroHandOnBoard(hero, brd, turnType);
  const hand = computeHandFeatures(hero, brd);
  const pairQuality = getPairQuality(hero, brd);
  const handIntent = classifyHandIntentWithContext(heroClass, hand, pairQuality, turnType);
  const nodeIntent = inferNodeIntent(spot);
  const flopClassTag =
    spot.tags.find((t) => t.includes("_")) || spot.tags.find((t) => t.includes("disconnected")) || undefined;

  const corpus = loadTheoryCorpus(repoRoot);
  const bullets = buildSolverNotes({
    corpus,
    flopClassLabel: (flopClassTag as any) || "low_disconnected",
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
      instructions:
        "Return ONLY a JSON object matching constraintsSchema. Do not edit the spot. If spot is acceptable, return {}.",
    },
  };
}


