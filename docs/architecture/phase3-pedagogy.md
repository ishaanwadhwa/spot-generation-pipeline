# Phase 3: Pedagogy Layer

## Purpose

Phase 3 is the **teaching layer** of the spot generation pipeline. It exists to separate **pedagogy** (how to teach) from **poker mechanics** (what is allowed).

### Why Phase 3 Exists

The previous system mixed solver-like logic directly into templates:

```typescript
// ❌ OLD: Mixing pedagogy into poker logic
const freq = lookupBaseFrequencies(handIntent, turnType, nodeIntent, opts.length);
const ev = generateDeterministicEV(opts.length, bestIdx);
const meta = getMetaTemplate(handIntent, heroClass, feats, turnType, bettingMode);
```

This caused:
- **Endless edge-case tuning** - Every new board texture required special handling
- **Solver cosplay** - Frequencies claimed to be "solver-derived" but weren't
- **Tight coupling** - Couldn't change teaching without touching poker logic

### What Phase 3 Replaces

Phase 3 consolidates and replaces:

| Old Logic | Replaced By |
|-----------|-------------|
| `lookupBaseFrequencies()` | `frequencyEngine.ts` |
| `generateDeterministicEV()` | `evEngine.ts` |
| `getMetaTemplate()` | `metaSelector.ts` |
| `BASE_FREQ_TABLE` | Difficulty-based spreads |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SPOT GENERATION PIPELINE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 1: BettingContext                             │    │
│  │                                                     │    │
│  │ Answers: "What betting is ALLOWED?"                 │    │
│  │                                                     │    │
│  │ Outputs: checkDominant, allowsSmallBet,             │    │
│  │          allowsLargeBet, polarity, etc.             │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                               │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 2: OptionBuilder                              │    │
│  │                                                     │    │
│  │ Answers: "Which 3 options to show?"                 │    │
│  │                                                     │    │
│  │ Outputs: opts[], bestIdx                            │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                               │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 3: Pedagogy                                   │    │
│  │                                                     │    │
│  │ Answers: "How to TEACH this spot?"                  │    │
│  │                                                     │    │
│  │ Outputs: freq[], ev[], meta                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Input Contract

Phase 3 receives **only**:

```typescript
interface PedagogyInput {
  options: {
    opts: ActionIntent[];   // always length === 3
    bestIdx: number;
  };
  bettingContext: BettingContext;
  handIntent: HandIntent;
  street: "f" | "t" | "r";
  difficulty: "easy" | "medium" | "hard";
}
```

### ❌ Phase 3 Must NOT Inspect

- Board cards
- Exact bet sizes
- Hero hand
- Villain range
- Leverage computation internals

---

## How Difficulty Works

Difficulty is the **only** variable that controls the **clarity** of the correct answer.

### Frequency Spreads

| Difficulty | Best | Second | Worst |
|------------|------|--------|-------|
| Easy       | 70%  | 20%    | 10%   |
| Medium     | 50%  | 30%    | 20%   |
| Hard       | 40%  | 35%    | 25%   |

### EV Spreads

| Difficulty | Best EV | Gap |
|------------|---------|-----|
| Easy       | 2.4     | 0.5 |
| Medium     | 2.2     | 0.3 |
| Hard       | 2.0     | 0.15|

### Key Insight

Difficulty affects **spacing**, not **availability**.

```
EASY:    █████████████████████░░░░░░░░░░  (clear gap)
MEDIUM:  ██████████████░░░░░░░░░░░░░░░░░  (moderate gap)
HARD:    ████████████░░░░░░░░░░░░░░░░░░░  (compressed)
```

---

## Why EVs Are Pedagogical, Not Predictive

### The Problem with "Solver EVs"

Claiming solver-derived EVs requires:
1. Actual solver data
2. Specific board/hand/range inputs
3. Verified calculations

We have none of these. Claiming solver accuracy is **dishonest**.

### The Solution: Pedagogical EVs

EVs in this system serve ONE purpose: **reinforce the teaching**.

```typescript
// Easy spot: Clear best choice
ev = [1.9, 2.4, 1.9]  // "best is obviously best"

// Hard spot: Close decision
ev = [1.85, 2.0, 1.85]  // "options are similar"
```

### Absolute Values Don't Matter

The user never sees "2.4 bb/100". They see:

```
Option A: ██████████░░░░░░░░░░ (40%)
Option B: ████████████████████ (BEST - 50%)
Option C: ████░░░░░░░░░░░░░░░░ (10%)
```

The ordering and spacing matter. The numbers don't.

---

## How This Prevents Infinite Iteration

### Before Phase 3

```
Developer: "Wheel straight on blank turn needs special meta"
           → Add wheel_straight_blank_turn template
Developer: "But what about wheel straight on overcard turn?"
           → Add wheel_straight_overcard_turn template
Developer: "What about wheel straight vs paired board?"
           → (infinite loop)
```

### After Phase 3

```
Phase 1: Computes leverage = "high" (wheel is nuts)
Phase 2: Outputs ["check", "large", "overbet"], bestIdx = 1
Phase 3: Receives handIntent = "made_value", polarity = "polarized"
         → Returns standard "made_value" + "polarized" template
         → NO board-specific logic needed
```

The wheel straight is handled **automatically** by Phase 1 and Phase 2.
Phase 3 doesn't need to know it's a wheel straight.

---

## File Structure

```
spotgen/poker/pedagogy/
├── types.ts          # Type definitions
├── frequencyEngine.ts # Frequency assignment
├── evEngine.ts       # EV computation
├── metaSelector.ts   # Meta/explanation selection
└── index.ts          # Main export
```

---

## Usage

```typescript
import { runPedagogyPhase } from "./poker/pedagogy";

const pedagogyResult = runPedagogyPhase({
  options: { opts: ["check", "small", "large"], bestIdx: 1 },
  bettingContext: ctx,
  handIntent: "thin_value",
  street: "t",
  difficulty: "medium",
});

// Result:
// {
//   freq: [0.30, 0.50, 0.20],
//   ev: [1.9, 2.2, 1.9],
//   meta: {
//     summary: "With a medium-strength hand on the turn...",
//     solverNotes: ["Medium-strength hands are vulnerable...", ...],
//     concepts: ["thin-value", "pot-control"]
//   }
// }
```

---

## Invariants

1. **Same inputs → Same outputs** (deterministic)
2. **opts and bestIdx never change**
3. **freq always sums to 1.0**
4. **bestIdx always has highest EV**
5. **No board/hand inspection**
6. **No randomness**
7. **No solver claims**

