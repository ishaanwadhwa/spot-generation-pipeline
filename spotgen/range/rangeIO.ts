import fs from "fs";
import path from "path";
import { expandHandClassList, type HandClass } from "./expandClasses";

export interface ChartJSON {
  position?: string;
  matchup?: string;
  hands?: Record<string, string[]>;
  call?: Record<string, string[]>;
  threeBet?: Record<string, string[]>;
}

function readJSON(p: string): any {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function loadRFI(pos: string, repoRoot: string): ChartJSON {
  const p = path.join(repoRoot, "theory", "preflop", "charts", "rfi", `${pos}.json`);
  return readJSON(p) as ChartJSON;
}

export function loadFacing(matchup: string, repoRoot: string): ChartJSON {
  const p = path.join(repoRoot, "theory", "preflop", "charts", "facing", `${matchup}.json`);
  return readJSON(p) as ChartJSON;
}

export function expandBucket(chart: ChartJSON, bucket: string): HandClass[] {
  // Check in hands first (RFI charts), then call/threeBet (facing charts)
  if (chart.hands && chart.hands[bucket]) {
    return expandHandClassList(chart.hands[bucket]);
  }
  if (chart.call && chart.call[bucket]) {
    return expandHandClassList(chart.call[bucket]);
  }
  if (chart.threeBet && chart.threeBet[bucket]) {
    return expandHandClassList(chart.threeBet[bucket]);
  }
  return [];
}

/**
 * Get all hands from an RFI chart
 * RFI charts have various formats:
 * - { pairs, suited, offsuit }
 * - { raise, limp, offsuit }
 */
export function expandRFIRange(chart: ChartJSON): HandClass[] {
  if (!chart.hands) return [];
  const hands: HandClass[] = [];
  
  // Handle different key formats
  if (chart.hands.raise) hands.push(...expandHandClassList(chart.hands.raise));
  if (chart.hands.pairs) hands.push(...expandHandClassList(chart.hands.pairs));
  if (chart.hands.suited) hands.push(...expandHandClassList(chart.hands.suited));
  if (chart.hands.offsuit) hands.push(...expandHandClassList(chart.hands.offsuit));
  // Don't include limp range for raising - just the raise hands
  
  return hands;
}

/**
 * Get all hands from a facing chart's call range
 * Facing charts have hands: { call: [...], 3bet_small: [...], etc }
 */
export function expandCallRange(chart: ChartJSON): HandClass[] {
  // First check if it's a flat call array (older format)
  if (chart.call && Array.isArray(chart.call)) {
    return expandHandClassList(chart.call as unknown as string[]);
  }
  // Check if hands has 'call' bucket (mixed format)
  if (chart.hands && chart.hands.call) {
    return expandHandClassList(chart.hands.call);
  }
  // Check if there's a top-level 'call' array in hands (new format)
  if (chart.hands && Array.isArray((chart as any).hands?.call)) {
    return expandHandClassList((chart as any).hands.call);
  }
  return [];
}

/**
 * Get defending range from a facing chart (combined calls and some 3bets)
 */
export function expandDefendingRange(chart: ChartJSON): HandClass[] {
  const hands: HandClass[] = [];
  if (chart.hands) {
    // Try different possible structures
    if (chart.hands.call) hands.push(...expandHandClassList(chart.hands.call));
    if (chart.hands["3bet_small"]) hands.push(...expandHandClassList(chart.hands["3bet_small"]));
    if (chart.hands.pairs) hands.push(...expandHandClassList(chart.hands.pairs));
    if (chart.hands.suited) hands.push(...expandHandClassList(chart.hands.suited));
    if (chart.hands.offsuit) hands.push(...expandHandClassList(chart.hands.offsuit));
  }
  return hands;
}


