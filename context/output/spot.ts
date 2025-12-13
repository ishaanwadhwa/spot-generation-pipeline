// ------------------------------
//  FINAL SPOT DATA TYPE SYSTEM
// ------------------------------
//  This defines the authoritative format for poker training spots.
//  All backend storage, frontend UI parsing, LLM reasoning, animation
//  logic, and solver imports MUST conform to this schema.

/**
 * Optional villain stat block for advanced modes
 */
export interface VillainStats {
    vpip: number;
    pfr: number;
    threeb: number;
    foldtocbet: number;
    xr: number; // check-raise %
    agg: number; // aggression factor
    notes?: string;
  }
  
  /**
   * Hero info
   */
  export interface HeroInfo {
    pos: string; // Ex: "BTN", "SB", "BB", "CO", etc.
    hand: [string, string]; // Ex: ["Ah", "Jd"]
  }
  
  // ------------------------
  // ACTION FORMAT (FINAL)
  // ------------------------
  // Format: [position, actionCode, sizingRef?, exactAmount?]
  //
  // Examples:
  // ["BB", "x"]              → check
  // ["BTN", "b", 33, 5.94]   → bet 33% pot for 5.94bb
  // ["BTN", "a", "AI", 82.1] → all-in for 82.1bb
  // ["BB", "c", null, 4.7]   → call 4.7bb
  // ["-", "t"]               → street marker (turn)
  //
  // Rules:
  // - sizingRef preserves strategy intent (percent, pot, 3x, AI, etc.)
  // - exactAmount is the precise chip contribution used for math
  // - Street markers use "-" for position and "p|f|t|r" for the value
  
  export type HistoryAction =
    // Street transitions
    | ["-", "p" | "f" | "t" | "r"]
    // Check / Fold
    | [position: string, action: "x" | "f"]
    // Calls (no sizing family needed)
    | [position: string, action: "c", sizeRef: null, exact: number]
    // Bets (percentage or pot sizing)
    | [position: string, action: "b", sizeRef: number | "pot", exact: number]
    // Raises (multi-sizing: 3x, 2.2x, pot raise, etc.)
    | [position: string, action: "r", sizeRef: string, exact: number]
    // All-in (jam)
    | [position: string, action: "a", sizeRef: "AI" | null, exact: number];
  
  // ------------------------
  // HERO ACTION OPTIONS
  // ------------------------
  // These represent choices the hero has at the decision point.
  // Same encoding as history actions but position is omitted.
  
  export type Option =
    | ["x"]
    | ["f"]
    | ["c", null, number]
    | ["b", number | "pot", number]
    | ["r", string, number]
    | ["a", "AI" | null, number];
  
  // ------------------------
  // SOLVER OUTPUT FORMAT
  // ------------------------
  // `b` is the index of the best option in opts[].
  // `ev` array matches ordering 1:1 with opts[].
  
  export interface Solution {
    b: number; // Best action index
    ev: number[]; // EV values in matching order
  }
  
  // ------------------------
  // SPOT META (LLM / AI Context)
  // ------------------------
  // Used for AI explanation, reasoning, personalization, and LLM grounding.
  
  export interface SpotMeta {
    concept: string[]; // Poker theory tags for reasoning e.g. ["range-check", "nut-advantage", "thin-value"]
    summary?: string; // Short human explanation (1–2 sentences)
    solverNotes?: string[]; // Bullet-point reasoning usable by LLM for accurate explanations
    freq?: number[]; // Optional: solver strategy frequencies per action index (same order as opts[])
  }
  
  // ------------------------
  // FINAL SPOT STRUCTURE
  // ------------------------
  
  export interface SpotData {
    id: string;
    st: number; // Fixed starting effective stack (BB) - constant baseline
    fmt: string; // "6m" | "9m" | "hu"
    str: string; // Decision street: "p" | "f" | "t" | "r"
    hero: HeroInfo;
    v: string[]; // Active villains
    brd: string[]; // Community cards
    pot: number; // Pot before hero decision (after all prior actions)
    hist: HistoryAction[];
    opts: Option[];
    sol: Solution;
  
    // Optional fields for advanced modes
    vill?: Record<string, VillainStats>;
    meta?: SpotMeta; // AI/LLM context for explanations and reasoning
    difficulty?: number;
    tags?: string[];
  }
  
  // ------------------------
  // GENERATED OUTPUT (LLM / Spot Generator)
  // ------------------------
  // This is the JSON shape Cursor should output when asked to "generate a spot".
  // It intentionally does NOT include DB timestamp fields.
  export interface SpotOutput {
    id: string;
    fmt: string;
    str: string;
    difficulty: number; // 1–10
    tags: string[];
    data: SpotData;
  }

  // ------------------------
  // DATABASE SPOT RECORD (storage layer)
  // ------------------------
  export interface SpotRecord extends SpotOutput {
    createdAt: Date;
    updatedAt: Date;
  }
  