import type { SpotOutput } from "./spot";

export const spot: SpotOutput = {
  id: "s315",
  fmt: "6m",
  str: "r",
  difficulty: 6,
  tags: ["river", "3bet-pot", "bluff-catch"],
  data: {
    id: "s315",
    st: 100,
    fmt: "6m",
    str: "r",
    hero: { pos: "BTN", hand: ["Jc", "Tc"] },
    v: ["SB"],
    brd: ["Qs", "9d", "4h", "2s", "Ah"],
    pot: 63.0,
    hist: [
      ["UTG", "f"],
      ["MP", "f"],
      ["CO", "f"],
      ["BTN", "r", "2.5x", 2.5],
      ["SB", "r", "4x", 10.0],
      ["BB", "f"],
      ["BTN", "c", null, 7.5],
      ["-", "f"],
      ["SB", "b", 33, 7.0],
      ["BTN", "c", null, 7.0],
      ["-", "t"],
      ["SB", "b", 40, 14.0],
      ["BTN", "c", null, 14.0],
      ["-", "r"],
      ["SB", "a", "AI", 69.0],
    ],
    opts: [["f"], ["c", null, 69.0]],
    sol: { b: 0, ev: [0.0, -5.5] },
    meta: {
      concept: ["pure-bluff-catcher", "blocker-theory", "under-defend"],
      summary:
        "Hero faces a massive river jam with a weak pair and folds, as the hand does not block enough value hands to be a good bluff catcher.",
      solverNotes: [
        "Villain's line is highly polarized (nuts or air).",
        "JT is a poor bluff catcher: it doesn't block many missed draws (spades) and it blocks some of the hands SB might try to bluff (KT/QJ).",
        "The pot odds (1.9:1) are often not good enough for this hand's frequency in the BTN range against a large OOP jam.",
      ],
      freq: [0.75, 0.25],
    },
  },
};

export default spot;