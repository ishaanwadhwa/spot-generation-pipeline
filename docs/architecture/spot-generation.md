# Spot Generation Pipeline Architecture

## Overview

The spot generation pipeline converts poker theory into training spots through a **3-phase architecture** that cleanly separates concerns:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SPOT GENERATION PIPELINE                             │
│                                                                              │
│   Input: Hand, Board, Position, Street, Difficulty                           │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐     │
│   │                PHASE 1: BettingContext                             │     │
│   │                                                                    │     │
│   │   Question: "What betting is structurally ALLOWED?"                │     │
│   │                                                                    │     │
│   │   Inputs: street, position, leverage, ranges, stacks              │     │
│   │   Outputs: checkDominant, allowsSmallBet, allowsLargeBet,         │     │
│   │            allowsOverbet, polarity, stackPressure                 │     │
│   │                                                                    │     │
│   │   File: poker/bettingContext.ts                                   │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐     │
│   │                PHASE 2: OptionBuilder                              │     │
│   │                                                                    │     │
│   │   Question: "Which 3 options should the player see?"               │     │
│   │                                                                    │     │
│   │   Inputs: BettingContext, difficulty                              │     │
│   │   Outputs: opts[], bestIdx                                        │     │
│   │                                                                    │     │
│   │   File: poker/optionBuilder.ts                                    │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐     │
│   │                PHASE 3: Pedagogy                                   │     │
│   │                                                                    │     │
│   │   Question: "How should we TEACH this spot?"                       │     │
│   │                                                                    │     │
│   │   Inputs: options, BettingContext, handIntent, street, difficulty │     │
│   │   Outputs: freq[], ev[], meta                                     │     │
│   │                                                                    │     │
│   │   File: poker/pedagogy/index.ts                                   │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│   Output: Complete Spot JSON                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## The 3-Phase Philosophy

### Why 3 Phases?

Previous implementations mixed concerns:

```typescript
// ❌ OLD: Everything mixed together
function generateSpot(hand, board) {
  const options = computeOptions(hand, board);        // Poker logic
  const freq = lookupFrequencies(hand, board, ...);   // Teaching logic
  const meta = selectMeta(hand, board, feats, ...);   // More mixing
  // Edge cases everywhere, impossible to maintain
}
```

The 3-phase architecture enforces separation:

```typescript
// ✅ NEW: Clean separation
const ctx = computeBettingContext({ street, position, leverage, ... });  // Phase 1
const opts = buildOptionsFromContext({ context: ctx, difficulty });       // Phase 2
const pedagogy = runPedagogyPhase({ options: opts, ctx, handIntent, ... }); // Phase 3
```

### Phase Responsibilities

| Concern | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Betting legality | ✓ | | |
| Option selection | | ✓ | |
| Best action | | ✓ | |
| Difficulty | | ✓ | ✓ |
| Frequencies | | | ✓ |
| Explanations | | | ✓ |
| EVs | | | ✓ |

### What Each Phase Can/Cannot See

| Data | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| Board cards | ✓ | ❌ | ❌ |
| Hero hand | ✓ | ❌ | ❌ |
| Leverage | ✓ | ❌ | ❌ |
| BettingContext | - | ✓ | ✓ |
| Options | - | - | ✓ |
| Difficulty | ❌ | ✓ | ✓ |

---

## Phase 1: BettingContext

### Purpose

Determines what types of betting are **structurally valid** in a given node.

### Key Outputs

```typescript
{
  checkDominant: boolean;     // Is checking the natural action?
  allowsSmallBet: boolean;    // Can we bet 25-40%?
  allowsLargeBet: boolean;    // Can we bet 50-75%?
  allowsOverbet: boolean;     // Can we bet 100%+?
  polarity: "merged" | "polarized";
  stackPressure: "low" | "medium" | "high";
}
```

### Rules Applied

1. **Street effects**: Rivers allow more polarization
2. **Position effects**: IP can be more aggressive
3. **Leverage → permissions**: High leverage unlocks large bets
4. **Nut advantage**: Overrides normal restrictions
5. **Stack pressure**: Low SPR compresses options
6. **Range disadvantage**: May lock out aggressive lines

### File

`poker/bettingContext.ts`

---

## Phase 2: OptionBuilder

### Purpose

Selects exactly 3 options from the allowed universe and determines the "anchor" (strategic best).

### Algorithm

1. **Infer Anchor**: Based on `checkDominant` and `polarity`
2. **Build Universe**: `[check] + [allowed bets]`
3. **Apply Difficulty**: Select by intent distance from anchor
4. **Finalize**: Ensure 3 unique, sorted options

### Difficulty Mechanics

Difficulty controls **spacing**, not **availability**.

```
EASY:   [check] ────────── [small] ────────── [overbet]
                  ↑ far apart ↑

HARD:   [check] ── [small] ── [large]
            ↑ clustered ↑
```

### Key Invariant

**Always 3 options**. No exceptions.

### File

`poker/optionBuilder.ts`

---

## Phase 3: Pedagogy

### Purpose

Adds the **teaching layer**: frequencies, EVs, and explanations.

### Key Outputs

```typescript
{
  freq: [0.30, 0.50, 0.20],  // Sum to 1.0
  ev: [1.9, 2.2, 1.9],       // bestIdx has highest
  meta: {
    summary: "With a medium-strength hand...",
    solverNotes: ["...", "...", "..."],
    concepts: ["thin-value", "pot-control"]
  }
}
```

### Frequency Spreads by Difficulty

| Difficulty | Best | Second | Worst |
|------------|------|--------|-------|
| Easy       | 70%  | 20%    | 10%   |
| Medium     | 50%  | 30%    | 20%   |
| Hard       | 40%  | 35%    | 25%   |

### EV Philosophy

EVs are **pedagogical**, not **predictive**.

They reinforce the teaching by making the best option clearly best (easy) or ambiguously best (hard).

Phase 3 **never claims solver accuracy**.

### File

`poker/pedagogy/index.ts`

---

## Complete Flow Example

```typescript
// Input: BTN vs BB, turn, hero has top pair, medium difficulty

// PHASE 1: What betting is allowed?
const ctx = computeBettingContext({
  street: "t",
  heroIsIP: true,
  leverage: "medium",          // Top pair = medium leverage
  rangeAdvantage: "hero",
  nutAdvantage: false,
  effectiveStack: 45,
  pot: 25,
});
// Result: checkDominant=false, allowsSmallBet=true, allowsLargeBet=true,
//         allowsOverbet=false, polarity="merged"

// PHASE 2: Which 3 options?
const opts = buildOptionsFromContext({
  context: ctx,
  difficulty: "medium",
});
// Result: { opts: ["check", "small", "large"], bestIdx: 1 }

// PHASE 3: How to teach?
const pedagogy = runPedagogyPhase({
  options: opts,
  bettingContext: ctx,
  handIntent: "thin_value",
  street: "t",
  difficulty: "medium",
});
// Result: {
//   freq: [0.30, 0.50, 0.20],
//   ev: [1.9, 2.2, 1.9],
//   meta: { summary: "With a medium-strength hand...", ... }
// }

// Assemble final spot
const spot = {
  opts: [["x"], ["b", 33, 8.25], ["b", 66, 16.5]],
  sol: { b: 1, ev: pedagogy.ev },
  meta: { ...pedagogy.meta, freq: pedagogy.freq },
};
```

---

## Why This Architecture Works

### 1. Eliminates Edge-Case Creep

Before: "Wheel straight on paired board needs special meta"
After: Phase 1 sets leverage="high", Phase 2 builds options, Phase 3 teaches

### 2. Ensures Determinism

Same inputs → same outputs at every phase.

### 3. Enables Independent Testing

```bash
# Test Phase 1 only
node -e "const {computeBettingContext}=require('./dist/...'); ..."

# Test Phase 2 only
node -e "const {buildOptionsFromContext}=require('./dist/...'); ..."

# Test Phase 3 only
node -e "const {runPedagogyPhase}=require('./dist/...'); ..."
```

### 4. Prevents Solver Cosplay

Phase 3 explicitly states frequencies/EVs are pedagogical, not solver-derived.

---

## Files Reference

| Phase | Primary File | Documentation |
|-------|--------------|---------------|
| Template | `templates/srp_universal.ts` | `docs/architecture/spot_generation_phases.md` |
| 1 | `poker/bettingContext.ts` | `docs/architecture/decision_flow.md` |
| 2 | `poker/optionBuilder.ts` | `docs/architecture/phase2_option_construction.md` |
| 3 | `poker/pedagogy/` | `docs/architecture/phase3-pedagogy.md` |

---

## Future Considerations

### Possible Phase 4: Validation

A post-generation validation layer that:
- Checks spot coherence
- Verifies frequencies sum to 1
- Ensures EVs are ordered correctly
- May trigger regeneration with constraints

### Solver Integration

If actual solver data becomes available:
- Phase 3 could be replaced with solver-grounded frequencies
- The architecture cleanly separates this concern
- Phase 1 and 2 remain unchanged

