# Spot Generation Pipeline Architecture

## Overview

The spot generation pipeline has a strict multi-phase architecture where each phase has a single responsibility. This document explains the separation of concerns and why each phase exists.

---

## The 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: Betting Context (bettingContext.ts)                   │
│  └─> Answers: "What betting is STRUCTURALLY ALLOWED?"           │
│  └─> Outputs: checkDominant, allowsSmallBet, allowsLargeBet...  │
│  └─> Contains: Poker legality rules, position effects           │
│  └─> NEVER rejects spots                                        │
│                                                                 │
│  PHASE 2: Option Builder (optionBuilder.ts)                     │
│  └─> Answers: "Which 3 options should the user see?"            │
│  └─> Outputs: opts[], bestIdx                                   │
│  └─> Contains: Anchor inference, difficulty spacing             │
│  └─> ALWAYS builds exactly 3 options                            │
│                                                                 │
│  SURVIVOR GATE (srp_universal.ts)                               │
│  └─> Answers: "Is this spot WORTH TEACHING?"                    │
│  └─> Outputs: rejected (boolean)                                │
│  └─> Contains: Curriculum quality control                       │
│  └─> CAN reject spots                                           │
│                                                                 │
│  PHASE 3: Pedagogy (pedagogy/*.ts)                              │
│  └─> Answers: "How should we TEACH this spot?"                  │
│  └─> Outputs: freq[], ev[], meta                                │
│  └─> Contains: Frequency assignment, EV spacing, explanations   │
│  └─> NEVER affects options or bestIdx                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Betting Context (Clamping)

### Purpose
Determine what betting actions are **structurally valid** based on:
- Position (IP/OOP)
- Street (flop/turn/river)
- Leverage (hand strength, equity, draws)
- Range advantage
- Nut advantage
- Stack pressure

### What It Does
- Sets `checkDominant`, `allowsSmallBet`, `allowsLargeBet`, `allowsOverbet`
- Applies poker-theoretic rules about when betting is sensible
- Adds reasoning strings to `reasons[]` for debugging

### What It Does NOT Do
- ❌ Choose specific sizes
- ❌ Choose the best action
- ❌ Reject spots entirely
- ❌ Consider difficulty or pedagogy

### Key Clamps (Issue 1 Fix)

**OOP River Showdown Value Clamp:**
```
IF:
  - street === "r" (river)
  - heroIsIP === false (OOP)
  - nutAdvantage === false
  - heroClass in ["medium", "weak", "thin_value"]
THEN:
  - checkDominant = true
  - allowsSmallBet = false
  - allowsLargeBet = false
  - allowsOverbet = false
WHY:
  Betting OOP on river with medium-strength hands accomplishes nothing.
  Better hands call/raise, worse hands fold. Check is the only sane action.
```

**OOP Turn Low Leverage Clamp:**
```
IF:
  - street === "t" (turn)
  - heroIsIP === false (OOP)
  - leverage in ["none", "low"]
  - heroClass in ["medium", "weak", "thin_value"]
THEN:
  - If leverage === "none": all bets disabled, checkDominant = true
  - If leverage === "low": only small probing bets allowed
WHY:
  OOP on turn with showdown value should not build big pots.
  Small bets may have equity denial value; large bets do not.
```

---

## Phase 2: Option Builder

### Purpose
Build exactly 3 options for the user to choose from.

### What It Does
- Infers the **anchor action** (strategic center)
- Builds an **intent universe** from BettingContext
- Selects options by **difficulty spacing**
- Returns `opts[]` (always length 3) and `bestIdx`

### What It Does NOT Do
- ❌ Apply poker logic (that's Phase 1)
- ❌ Reject spots
- ❌ Generate frequencies or EVs

---

## Survivor Gate (Curriculum Quality Control)

### Purpose
Reject spots that are **structurally valid but not worth teaching**.

### Location
Between Phase 2 and Phase 3 in `srp_universal.ts`.

### Rejection Criteria (Issue 2 Fix)
All of the following must be true:
1. `checkDominant === true`
2. `street === "r"` (river only for now)
3. `bestIdx === 0` (check is anchor)
4. `nutAdvantage === false`
5. `leverage in ["none", "low"]`

### Why This Exists
A river spot where:
- Check is obviously best
- Hero has no nut advantage
- Hero has no leverage

...teaches nothing valuable. It's just "check and pray."

These spots are structurally valid (Phase 1 allows them) and Phase 2 can build options, but they waste the student's time.

### Key Distinction

| Layer | Question | Can Reject? |
|-------|----------|-------------|
| Phase 1 | Is betting allowed? | NO |
| Phase 2 | What options to show? | NO |
| Survivor Gate | Is this worth teaching? | YES |
| Phase 3 | How to teach it? | NO |

---

## Phase 3: Pedagogy

### Purpose
Generate the teaching components:
- **Frequencies**: How often each option is "correct"
- **EVs**: Relative value of each option
- **Meta**: Summary, solver notes, concepts

### What It Does
- Assigns frequencies based on difficulty
- Computes EVs based on bestIdx and difficulty
- Selects explanations based on handIntent and anchor

### What It Does NOT Do
- ❌ Change options or bestIdx
- ❌ Apply poker logic
- ❌ Reject spots

---

## Why Both Issue 1 and Issue 2 Are Required

### Issue 1 (Phase 1 Clamping) Alone Is Not Enough
Even with correct clamps, Phase 2 always builds 3 options. If check is dominant, Phase 2 might build:
- `[check, small, large]`

But if the spot is OOP river bluffcatcher with no leverage, the "small" and "large" options are fake - they should never be taken. This is technically valid but pedagogically useless.

### Issue 2 (Survivor Gate) Alone Is Not Enough
Without Phase 1 clamps, the system might generate spots where:
- Large bets are "allowed" when they shouldn't be
- Polarity appears when it shouldn't

The Survivor Gate catches trivial nodes, but Phase 1 must first correctly identify when betting is structurally invalid.

### Together
1. Phase 1 ensures betting permissions are correct
2. Survivor Gate rejects spots that pass Phase 1 but aren't worth teaching

---

## Summary

| Phase | Responsibility | File | Can Reject? |
|-------|---------------|------|-------------|
| 1 | Betting legality | `bettingContext.ts` | NO |
| 2 | Option construction | `optionBuilder.ts` | NO |
| Gate | Curriculum quality | `srp_universal.ts` | YES |
| 3 | Teaching | `pedagogy/*.ts` | NO |

Phase 1 clamps what's allowed.
Phase 2 builds options from what's allowed.
Survivor Gate rejects trivial nodes.
Phase 3 teaches non-trivial nodes.

