/**
 * spotgen/audit/llmAuditPacket.ts
 *
 * LLM Audit Layer - Packet Builder
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module prepares spots for LLM review by:
 * 1. Extracting key features for strategic review
 * 2. Loading relevant theory snippets
 * 3. Formatting a structured packet for the LLM auditor
 *
 * The LLM (Cursor Agent) then reviews and provides one of:
 * - APPROVE: Spot is good, commit it
 * - REJECT: Spot has issues, regenerate with constraints
 * - REFINE: Meta needs adjustment, provide corrections
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { SpotOutputLike } from "../validator";
import { classifyHeroHandOnBoard, getPairQuality } from "../poker/classify";
import { computeHandFeatures } from "../poker/handFeatures";
import { classifyHandIntentWithContext } from "../poker/intent";
import { classifyTurn, type TurnType } from "../poker/turnClassify";
import fs from "fs";
import path from "path";

/**
 * LLM Audit Packet - Everything needed for LLM review
 */
export interface LLMAuditPacket {
  // Spot identification
  spotId: string;
  street: string;
  difficulty: number;

  // Hero info
  heroPosition: string;
  heroHand: string[];
  villainPosition: string;

  // Board state
  board: string[];
  pot: number;

  // Classifications (for LLM to verify)
  classifications: {
    heroClass: string;
    pairQuality: string;
    handIntent: string;
    turnType: string;
    flopClass: string;
  };

  // Hand features
  handFeatures: {
    hasPair: boolean;
    pairRank?: string;
    hasFlushDraw: boolean;
    straightDraw: string;
    comboDraw: boolean;
    hasStraight: boolean;
    equityProxy: number;
  };

  // Options and solution
  options: string[];
  bestIdx: number;
  frequencies: number[];
  evs: number[];

  // Meta (for LLM to review)
  meta: {
    concepts: string[];
    summary: string;
    solverNotes: string[];
  };

  // Theory snippets (relevant to this spot)
  theoryContext: string[];

  // Questions for LLM to answer
  reviewQuestions: string[];
}

/**
 * Format a hand for display
 */
function formatHand(hand: string[]): string {
  return hand.join("");
}

/**
 * Format board for display
 */
function formatBoard(board: string[]): string {
  return board.join(" ");
}

/**
 * Format options for display
 */
function formatOptions(opts: any[]): string[] {
  return opts.map((o, i) => {
    if (o[0] === "x") return `[${i}] Check`;
    if (o[0] === "b") return `[${i}] Bet ${o[1]}% (${o[2].toFixed(2)}bb)`;
    if (o[0] === "a") return `[${i}] All-in`;
    return `[${i}] ${o[0]}`;
  });
}

/**
 * Get relevant theory snippets for a spot
 */
function getRelevantTheory(
  repoRoot: string,
  street: string,
  handIntent: string,
  turnType: string
): string[] {
  const snippets: string[] = [];

  try {
    // Load core engine principles
    const coreEngine = path.join(repoRoot, "theory/core/CORE_HYBRID_ENGINE.md");
    if (fs.existsSync(coreEngine)) {
      const content = fs.readFileSync(coreEngine, "utf8");
      // Extract relevant section based on street
      const streetSection = street === "t" ? "TURN" : street === "r" ? "RIVER" : "FLOP";
      const lines = content.split("\n");
      let capturing = false;
      let captured: string[] = [];
      for (const line of lines) {
        if (line.includes(streetSection) && line.startsWith("#")) {
          capturing = true;
          captured = [line];
        } else if (capturing && line.startsWith("#")) {
          break;
        } else if (capturing) {
          captured.push(line);
        }
      }
      if (captured.length > 0) {
        snippets.push(`[CORE_ENGINE - ${streetSection}]\n${captured.slice(0, 10).join("\n")}`);
      }
    }

    // Load postflop core for intent-specific guidance
    const postflopCore = path.join(repoRoot, "theory/postflop/explanations/postflop_core.md");
    if (fs.existsSync(postflopCore)) {
      const content = fs.readFileSync(postflopCore, "utf8");
      // Extract intent-related guidance
      const intentKeywords: Record<string, string[]> = {
        "made_value": ["value", "extract", "bet for value"],
        "thin_value": ["thin value", "protection", "vulnerable"],
        "combo_draw": ["semi-bluff", "equity", "combo draw"],
        "draw": ["draw", "equity realization"],
        "pure_bluff": ["bluff", "fold equity"],
        "give_up": ["give up", "pot control", "check-fold"],
      };
      const keywords = intentKeywords[handIntent] || [];
      const lines = content.split("\n");
      for (const kw of keywords) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(kw.toLowerCase())) {
            const context = lines.slice(Math.max(0, i - 1), i + 3).join("\n");
            snippets.push(`[POSTFLOP_CORE - ${kw}]\n${context}`);
            break;
          }
        }
      }
    }

    // Load turn/river matrix doc
    const matrixDoc = street === "t"
      ? path.join(repoRoot, "theory/postflop/examples/solver_truth_docs/turn_matrix.MD")
      : street === "r"
        ? path.join(repoRoot, "theory/postflop/examples/solver_truth_docs/river_matrix.MD")
        : path.join(repoRoot, "theory/postflop/examples/solver_truth_docs/flop_matrix.MD");

    if (fs.existsSync(matrixDoc)) {
      const content = fs.readFileSync(matrixDoc, "utf8");
      // Extract turnType-related content
      const turnTypeKeywords: Record<string, string[]> = {
        "blank_turn": ["blank", "brick"],
        "overcard_turn": ["overcard"],
        "straight_completer": ["straight", "completer"],
        "flush_completer": ["flush", "completer"],
        "paired_turn": ["paired", "pair"],
      };
      const keywords = turnTypeKeywords[turnType] || [];
      const lines = content.split("\n");
      for (const kw of keywords) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(kw.toLowerCase())) {
            const context = lines.slice(Math.max(0, i - 1), i + 4).join("\n");
            snippets.push(`[MATRIX - ${turnType}]\n${context}`);
            break;
          }
        }
      }
    }
  } catch {
    // Ignore errors, return what we have
  }

  return snippets.slice(0, 5); // Limit to 5 snippets
}

/**
 * Build LLM audit packet from a spot
 */
export function buildLLMAuditPacket(repoRoot: string, spot: SpotOutputLike): LLMAuditPacket {
  const brd = spot.data.brd;
  const hero = spot.data.hero.hand;
  const flop = [brd[0], brd[1], brd[2]] as [string, string, string];
  const turn = brd.length > 3 ? brd[3] : null;

  // Classifications
  // IMPORTANT: Must match generator logic EXACTLY
  // 1. First compute turnType (needed for Phase 1.1 context)
  const turnType: TurnType = turn ? classifyTurn(flop, turn) : "blank_turn";

  // 2. Then compute heroClass WITH turnType (Phase 1.1 aware)
  const heroClass = classifyHeroHandOnBoard(hero as [string, string], brd, turnType);

  // 3. Then pairQuality and features
  const pairQuality = getPairQuality(hero, brd);
  const feats = computeHandFeatures(hero, brd);

  // 4. Finally handIntent with FULL context (Phase 1.1 aware)
  const handIntent = classifyHandIntentWithContext(heroClass, feats, pairQuality, turnType);

  // Infer flop class from tags
  const flopClass = spot.tags.find(t =>
    ["dry_Axx_highcard", "dry_Kxx_Qxx", "low_disconnected", "medium_connected", "monotone", "paired"].includes(t)
  ) || "unknown";

  // Theory context
  const theoryContext = getRelevantTheory(repoRoot, spot.str, handIntent, turnType);

  // Review questions
  const reviewQuestions = [
    `1. Is "${handIntent}" the correct strategic intent for ${formatHand(hero)} on ${formatBoard(brd)}?`,
    `2. Is bestIdx=${spot.data.sol.b} (${formatOptions(spot.data.opts)[spot.data.sol.b]}) strategically sound?`,
    `3. Does the summary "${spot.data.meta?.summary?.slice(0, 50)}..." match the spot's teaching goal?`,
    `4. Are the solverNotes accurate and not hallucinated?`,
    `5. Do the frequencies [${spot.data.meta?.freq?.join(", ")}] align with the hand's strategic profile?`,
  ];

  return {
    spotId: spot.id,
    street: spot.str === "f" ? "flop" : spot.str === "t" ? "turn" : "river",
    difficulty: spot.difficulty,

    heroPosition: spot.data.hero.pos,
    heroHand: hero,
    villainPosition: spot.data.v[0],

    board: brd,
    pot: spot.data.pot,

    classifications: {
      heroClass,
      pairQuality,
      handIntent,
      turnType,
      flopClass,
    },

    handFeatures: {
      hasPair: feats.hasPair,
      pairRank: feats.pairRank,
      hasFlushDraw: feats.hasFlushDraw,
      straightDraw: feats.straightDraw,
      comboDraw: feats.comboDraw,
      hasStraight: feats.hasStraight,
      equityProxy: feats.equityProxy,
    },

    options: formatOptions(spot.data.opts),
    bestIdx: spot.data.sol.b,
    frequencies: spot.data.meta?.freq || [],
    evs: spot.data.sol.ev,

    meta: {
      concepts: spot.data.meta?.concept || [],
      summary: spot.data.meta?.summary || "",
      solverNotes: spot.data.meta?.solverNotes || [],
    },

    theoryContext,
    reviewQuestions,
  };
}

/**
 * Format LLM audit packet for display
 */
export function formatLLMAuditPacket(packet: LLMAuditPacket): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════════════════════════════════",
    `                    LLM AUDIT PACKET - ${packet.spotId}`,
    "═══════════════════════════════════════════════════════════════════════════",
    "",
    "┌─────────────────────────────────────────────────────────────────────────┐",
    "│ SPOT OVERVIEW                                                           │",
    "├─────────────────────────────────────────────────────────────────────────┤",
    `│ ID:         ${packet.spotId.padEnd(58)}│`,
    `│ Street:     ${packet.street.padEnd(58)}│`,
    `│ Difficulty: ${String(packet.difficulty).padEnd(58)}│`,
    `│ Matchup:    ${(packet.heroPosition + "(hero) vs " + packet.villainPosition).padEnd(58)}│`,
    "└─────────────────────────────────────────────────────────────────────────┘",
    "",
    "┌─────────────────────────────────────────────────────────────────────────┐",
    "│ HAND & BOARD                                                            │",
    "├─────────────────────────────────────────────────────────────────────────┤",
    `│ Hero Hand:  ${packet.heroHand.join(" ").padEnd(58)}│`,
    `│ Board:      ${packet.board.join(" ").padEnd(58)}│`,
    `│ Pot:        ${(packet.pot.toFixed(2) + "bb").padEnd(58)}│`,
    "└─────────────────────────────────────────────────────────────────────────┘",
    "",
    "┌─────────────────────────────────────────────────────────────────────────┐",
    "│ CLASSIFICATIONS (Verify these)                                          │",
    "├─────────────────────────────────────────────────────────────────────────┤",
    `│ Hero Class:   ${packet.classifications.heroClass.padEnd(56)}│`,
    `│ Pair Quality: ${packet.classifications.pairQuality.padEnd(56)}│`,
    `│ Hand Intent:  ${packet.classifications.handIntent.padEnd(56)}│`,
    `│ Turn Type:    ${packet.classifications.turnType.padEnd(56)}│`,
    `│ Flop Class:   ${packet.classifications.flopClass.padEnd(56)}│`,
    "└─────────────────────────────────────────────────────────────────────────┘",
    "",
    "┌─────────────────────────────────────────────────────────────────────────┐",
    "│ HAND FEATURES                                                           │",
    "├─────────────────────────────────────────────────────────────────────────┤",
    `│ Has Pair:     ${String(packet.handFeatures.hasPair).padEnd(56)}│`,
    `│ Pair Rank:    ${(packet.handFeatures.pairRank || "n/a").padEnd(56)}│`,
    `│ Flush Draw:   ${String(packet.handFeatures.hasFlushDraw).padEnd(56)}│`,
    `│ Straight Draw:${packet.handFeatures.straightDraw.padEnd(56)}│`,
    `│ Combo Draw:   ${String(packet.handFeatures.comboDraw).padEnd(56)}│`,
    `│ Has Straight: ${String(packet.handFeatures.hasStraight).padEnd(56)}│`,
    `│ Equity Proxy: ${packet.handFeatures.equityProxy.toFixed(2).padEnd(56)}│`,
    "└─────────────────────────────────────────────────────────────────────────┘",
    "",
    "┌─────────────────────────────────────────────────────────────────────────┐",
    "│ OPTIONS & SOLUTION                                                      │",
    "├─────────────────────────────────────────────────────────────────────────┤",
  ];

  for (let i = 0; i < packet.options.length; i++) {
    const marker = i === packet.bestIdx ? " ★ BEST" : "";
    lines.push(`│ ${packet.options[i].padEnd(64)}${marker.padEnd(5)}│`);
  }

  lines.push(`├─────────────────────────────────────────────────────────────────────────┤`);
  lines.push(`│ Frequencies: [${packet.frequencies.map(f => f.toFixed(2)).join(", ").padEnd(55)}]│`);
  lines.push(`│ EVs:         [${packet.evs.map(e => e.toFixed(1)).join(", ").padEnd(55)}]│`);
  lines.push("└─────────────────────────────────────────────────────────────────────────┘");

  lines.push("");
  lines.push("┌─────────────────────────────────────────────────────────────────────────┐");
  lines.push("│ META (Review for accuracy)                                             │");
  lines.push("├─────────────────────────────────────────────────────────────────────────┤");
  lines.push(`│ Concepts: ${packet.meta.concepts.join(", ").slice(0, 60).padEnd(60)}│`);
  lines.push("├─────────────────────────────────────────────────────────────────────────┤");

  // Wrap summary
  const summaryWords = packet.meta.summary.split(" ");
  let currentLine = "│ Summary: ";
  for (const word of summaryWords) {
    if (currentLine.length + word.length > 70) {
      lines.push(currentLine.padEnd(72) + "│");
      currentLine = "│          " + word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  lines.push(currentLine.padEnd(72) + "│");

  lines.push("├─────────────────────────────────────────────────────────────────────────┤");
  lines.push("│ Solver Notes:                                                          │");
  for (const note of packet.meta.solverNotes) {
    lines.push(`│   • ${note.slice(0, 65).padEnd(65)}│`);
  }
  lines.push("└─────────────────────────────────────────────────────────────────────────┘");

  lines.push("");
  lines.push("┌─────────────────────────────────────────────────────────────────────────┐");
  lines.push("│ THEORY CONTEXT                                                         │");
  lines.push("├─────────────────────────────────────────────────────────────────────────┤");
  for (const snippet of packet.theoryContext) {
    const snippetLines = snippet.split("\n").slice(0, 3);
    for (const sl of snippetLines) {
      lines.push(`│ ${sl.slice(0, 69).padEnd(69)}│`);
    }
    lines.push("│                                                                         │");
  }
  lines.push("└─────────────────────────────────────────────────────────────────────────┘");

  lines.push("");
  lines.push("┌─────────────────────────────────────────────────────────────────────────┐");
  lines.push("│ REVIEW QUESTIONS (Answer each)                                         │");
  lines.push("├─────────────────────────────────────────────────────────────────────────┤");
  for (const q of packet.reviewQuestions) {
    lines.push(`│ ${q.slice(0, 69).padEnd(69)}│`);
  }
  lines.push("└─────────────────────────────────────────────────────────────────────────┘");

  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════════════════════");
  lines.push("                         LLM VERDICT REQUIRED");
  lines.push("═══════════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("Reply with ONE of:");
  lines.push("  APPROVE              - Spot is good, commit to seed.ts");
  lines.push("  REJECT <constraints> - Regenerate with constraints (JSON)");
  lines.push("  REFINE <meta>        - Only fix meta (provide corrected meta)");
  lines.push("");

  return lines.join("\n");
}

