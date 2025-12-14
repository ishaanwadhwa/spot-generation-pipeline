# Spot Output Format (Authoritative)

Cursor must ALWAYS output training spots in this exact JSON structure:

> This format matches `context/output/spot.ts` (`SpotOutput`).

{
  "id": "sXXXX",
  "fmt": "6m",
  "str": "f" | "t" | "r" | "p",
  "difficulty": <1-10>,
  "tags": ["..."],
  "data": {
    "id": "sXXXX",
    "st": <effective_stack>,
    "fmt": "6m",
    "str": "f" | "t" | "r" | "p",
    "hero": { "pos": "BTN", "hand": ["Ah", "Jd"] },
    "v": ["BB", ...],
    "brd": ["Ks", "7c", "2d"],
    "pot": <numeric>,
    "hist": [
      ["UTG", "f"],
      ["MP", "f"],
      ["CO", "r", "2.5x", 2.5],
      ["BTN", "c", null, 2.5],
      ["-", "f"],
      ["BB", "x"]
    ],
    "opts": [
      ["x"],
      ["b", 33, 2.0],
      ["b", 75, 4.5]
    ],
    "sol": {
      "b": <index_of_best_option>,
      "ev": [ev_for_opt0, ev_for_opt1, ...]
    },
    "meta": {
      "concept": ["range-check", "nut-advantage", "thin-value"],
      "summary": "1–2 sentence explanation of the best option.",
      "solverNotes": ["short bullet", "short bullet", "short bullet"],
      "freq": [0.5, 0.25, 0.25]
    }
  }
}

Rules:
- exactAmount is exact math (the 4th tuple element in `hist`/`opts` actions)
- UI display is rounded 0.5 increments
- unmentioned ranges = fold
