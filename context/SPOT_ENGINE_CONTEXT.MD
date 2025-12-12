### *Authoritative Context for the Spot Generation Engine*

---

# 🎯 Purpose of This Repo

This repository contains the full **theory + rules + data structures** needed to generate **solver-approximate poker training spots** for a 6-max No-Limit Hold’em training app.

The Spot Generation Agent (Cursor Ultra) uses this repo to:

* Build fully structured training spots
* Ensure consistency with preflop ranges, postflop heuristics, and solver-style play
* Produce exact JSON that the frontend animation engine and backend API accept
* Provide high-quality theoretical explanation metadata

This repo **does NOT** contain UI or backend code.
It is exclusively the *theory → spot* production engine.

---

# 📦 **1. Spot JSON Schema (FINAL & REQUIRED)**

Every generated spot MUST follow this structure exactly:

```json
{
  "id": "s001",
  "fmt": "6m",
  "str": "t",
  "difficulty": 6,
  "tags": ["turn", "IP", "barrel"],
  "data": {
    "id": "s001",
    "st": 100,
    "fmt": "6m",
    "str": "t",
    "hero": { "pos": "BTN", "hand": ["Ah", "Jh"] },
    "v": ["BB"],
    "brd": ["Ks", "7c", "4d", "Tc"],
    "pot": 12.5,

    "hist": [
      ["UTG", "f"],
      ["MP", "f"],
      ["CO", "f"],
      ["BTN", "r", "2.5x", 2.5],
      ["SB", "f"],
      ["BB", "c", null, 1.5],
      ["-", "f"],
      ["BB", "x"],
      ["BTN", "b", 33, 1.8],
      ["BB", "c", null, 1.8],
      ["-", "t"],
      ["BB", "x"]
    ],

    "opts": [
      ["x"],
      ["b", 75, 7.2],
      ["a", "AI", 83.5]
    ],

    "sol": { "b": 1, "ev": [1.0, 1.8, 1.4] },

    "meta": {
      "why_hero_acts": "",
      "board_texture": "",
      "range_advantage": "",
      "value_logic": "",
      "bluff_logic": "",
      "solver_principle": ""
    }
  }
}
```

### **Strict Rules**

* `exactAmount` must always be present.
* Sizing must be **rounded to nearest 0.5** for animation/UI.
* All non-participating seats must fold explicitly in `hist`.
* Only **valid solver-style lines** permitted.

---

# 🪑 **2. Seat Map (Fixed for All Spots)**

All spots assume **6-max** with fixed seats:

```
UTG
MP
CO
BTN
SB
BB
```

Your engine must always include folds from all non-participants.

---

# 🔍 **3. Required Theory Sources (Files Under /theory)**

The agent must consult:

### **Preflop**

```
/theory/preflop/charts/*.json
/theory/preflop/facing/*.json
/theory/preflop/metadata/*.json
```

These define:

* RFI ranges
* Calling ranges
* 3-bet / 4-bet behavior
* BB/SB defense vs position

### **Postflop Solver-Approx Matrices**

```
/theory/postflop/solver_truth/flop_matrix.json
/theory/postflop/solver_truth/turn_matrix.json
/theory/postflop/solver_truth/river_matrix.json
```

These define:

* Board category classification
* Preferred bet sizes & frequencies
* IP vs OOP tendencies
* Check/raise heuristics
* Polarization rules

### **Postflop Explanations**

```
/theory/postflop/explanations/*.md
```

These are used to fill `data.meta.*` fields.

### **Core Theory**

```
/theory/core/CORE_PRE_FLOP.md
/theory/core/CORE_POST_FLOP.md
/theory/core/CORE_HYBRID_ENGINE.md
```

These override all other heuristics when conflicting.

---

# 🧩 4. Spot Generation Workflow (MUST FOLLOW IN ORDER)

The agent must generate spots using this exact sequence:

### **Step 1 — Choose scenario**

* Pick hero position
* Pick villain(s)
* Pick preflop action tree (open, call, 3bet, multiway)

### **Step 2 — Build correct preflop hist[]**

Explicit folds:

```
["UTG", "f"], ["MP", "f"], ...
```

### **Step 3 — Choose board texture**

Use flop_matrix classification:

* A-high dry
* Broadways
* Dynamic
* Low disconnected
* Two-tone
* Monotone
* Paired

### **Step 4 — Apply solver-style postflop logic**

Using flop_matrix, turn_matrix, river_matrix:

* IP cbet frequency
* OOP XR frequency
* Sizing preferences
* Merge/polar logic

### **Step 5 — Produce valid actions**

Actions must use:

```
[actionCode, sizingRef, exactAmount]
```

### **Step 6 — Compute pot using exact math**

Pot after each action = sum of `exactAmount`.

### **Step 7 — Provide solver-style approximated EV**

Use matrices or conservative estimation.

### **Step 8 — Fill explanation metadata**

Use heuristics/explanations MD files:

* why hero prefers this line
* blockers
* range advantage
* board texture heuristics
* value vs bluff logic

### **Step 9 — Validate output**

Final JSON must:

* Follow schema
* Include all folds
* Include exactAmount for all monetary actions
* Include meta fields

---

# ⭐ **5. Difficulty Rating Rules**

Difficulty from 1–10 must reflect:

* Decision complexity
* Board texture density
* Number of reasonable candidate actions
* Balancing / block effects
* Solver nuance required

Example scale:

```
1–3 simple (range bet, trivial folds)
4–6 medium (broadway boards, turns needing range mixing)
7–8 hard (multiway, XR nodes, dynamic boards)
9–10 expert (river polar decisions, bluff-jams, thin value)
```

---

# 🔥 **6. Spot Variety Requirements**

Your generator must:

* Rotate hero across **all positions**
* Use a mix of:

  * SRP IP
  * SRP OOP
  * 3bet pots
  * Multiway pots
  * Limped pots (later)
* Include:

  * Check-backs
  * XR nodes
  * Probe nodes
  * Overbets
  * Polar rivers

Frequency guidance:

```
60% IP spots
25% OOP SRP
10% Multiway
5% Exotic (rare but solver-plausible)
```

---

# 🚫 7. Things the Agent Must *Never* Do

* Never modify JSON schema.
* Never output solver frequencies as percentages.
* Never guess ranges that contradict preflop charts.
* Never output unbalanced or unrealistic lines.
* Never skip explanation metadata.
* Never include incomplete pot math.

---

# 🎯 **8. Output Format Rules**

When asked to generate spots:

* Respond with **a pure JSON array**
* No text, no commentary
* Fully schema-valid
* Exact BB amounts correct
* Meta explanations included

---

# 🧠 Summary

This context defines the **entire operating system** for your spot generator:

* What files to read
* How to classify flops/turns/rivers
* How to structure spots
* How to reason solver-style
* How to generate explanations
* How to keep everything consistent

**Every spot must be:**

* Theoretically grounded
* Solver-plausible
* JSON-valid
* Animation-compatible
* Explanation-ready

---
