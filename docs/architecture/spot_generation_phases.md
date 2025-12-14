# Spot Generation Phases

## Overview

The spot generation pipeline uses a **3-phase architecture** (plus Phase 1.5) to cleanly separate concerns:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SRP UNIVERSAL TEMPLATE                               │
│                      (Pure Orchestration Layer)                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: Scenario Construction (Hand & Board)                            │ │
│  │   • Load ranges from theory/preflop/charts/                             │ │
│  │   • Sample hero hand                                                    │ │
│  │   • Generate random board                                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 1.5: Line Builder (poker/lineBuilder.ts)                          │ │
│  │   • Build preflop history                                               │ │
│  │   • Build postflop action (checks, bets, calls)                         │ │
│  │   • Calculate pot geometry                                              │ │
│  │   • Calculate effective stack                                           │ │
│  │   Output: { hist, pot, effectiveStack, flopBetPct, turnBetPct }         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: Hand/Board Classification (READ-ONLY)                           │ │
│  │   • classifyFlop() → FlopClassKey                                       │ │
│  │   • classifyTurn() → TurnType                                           │ │
│  │   • classifyHeroHandOnBoard() → HeroHandClass                           │ │
│  │   • computeHandFeatures() → HandFeatures                                │ │
│  │   • classifyHandIntent() → HandIntent                                   │ │
│  │   • computeLeverageProfile() → LeverageProfile                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: Eligibility Gating                                              │ │
│  │   • isEligibleForBarrelSpot() → reject if ineligible                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 1: computeBettingContext()                                        │ │
│  │   Input: street, heroIsIP, leverage, heroIsOpener, heroClass,           │ │
│  │          handFeatures, effectiveStack, pot                              │ │
│  │   Derives: rangeAdvantage, nutAdvantage (internally)                    │ │
│  │   Output: BettingContext                                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 2: buildOptionsFromContext()                                      │ │
│  │   Input: BettingContext, difficulty                                     │ │
│  │   Output: { opts: ActionIntent[], bestIdx: number }                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 3: runPedagogyPhase()                                             │ │
│  │   Input: options, bettingContext, handIntent, street, difficulty        │ │
│  │   Output: { freq: number[], ev: number[], meta: PedagogyMeta }          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 5: Assemble Final Spot JSON                                        │ │
│  │   • Combine all outputs into SpotOutputLike                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Responsibilities

### Phase 1.5: Line Builder (`poker/lineBuilder.ts`)

**Question**: "What is the pot geometry and action history?"

**Inputs**:
- `street`: f | t | r
- `heroIsIP`: boolean
- `heroPosition`, `villainPosition`: Position
- `heroIsOpener`: boolean
- `rng`: seeded RNG function

**Outputs**:
```typescript
{
  hist: HistoryAction[];       // Complete action history
  pot: number;                 // Current pot size
  effectiveStack: number;      // Remaining stack
  flopBetPct: number;          // Flop bet as % of pot
  turnBetPct: number;          // Turn bet as % of pot
  flopBetAmount: number;
  turnBetAmount: number;
}
```

**What Phase 1.5 Does NOT Do**:
- ❌ Consider difficulty
- ❌ Consider leverage or hand strength
- ❌ Make poker strategy decisions

---

### Phase 1: Betting Context (`poker/bettingContext.ts`)

**Question**: "What betting is structurally allowed in this node?"

**Inputs**:
- `street`: f | t | r
- `heroIsIP`: boolean
- `leverage`: none | low | medium | high
- `effectiveStack`: number
- `pot`: number
- `heroIsOpener`: boolean (NEW - for advantage inference)
- `heroClass`: string (NEW - for advantage inference)
- `handFeatures`: { hasStraight, hasFlush } (NEW - for advantage inference)

**Derived Internally**:
- `rangeAdvantage`: hero | neutral | villain
- `nutAdvantage`: boolean
- `nutAdvantage`: boolean
- `effectiveStack`: number
- `pot`: number

**Outputs**:
```typescript
{
  checkDominant: boolean;     // Is checking the natural action?
  allowsSmallBet: boolean;    // Can we bet 25-40%?
  allowsLargeBet: boolean;    // Can we bet 50-75%?
  allowsOverbet: boolean;     // Can we bet 100%+?
  polarity: "merged" | "polarized";
  stackPressure: "low" | "medium" | "high";
  reasons: string[];          // Audit trail
}
```

**What Phase 1 Does NOT Do**:
- ❌ Choose specific bet sizes
- ❌ Choose best action
- ❌ Consider difficulty
- ❌ Compute frequencies or EVs

---

### Phase 2: Option Builder (`poker/optionBuilder.ts`)

**Question**: "Which 3 options should the user see?"

**Inputs**:
- `context`: BettingContext (from Phase 1)
- `difficulty`: easy | medium | hard | 1-10

**Outputs**:
```typescript
{
  opts: ActionIntent[];  // ALWAYS exactly 3: ["check" | "small" | "large" | "overbet"]
  bestIdx: number;       // Index of anchor action
  reasons: string[];     // Audit trail
}
```

**What Phase 2 Does NOT Do**:
- ❌ Compute betting permissions (that's Phase 1)
- ❌ Compute frequencies or EVs (that's Phase 3)
- ❌ Generate solver notes (that's Phase 3)

---

### Phase 3: Pedagogy (`poker/pedagogy/index.ts`)

**Question**: "How should we TEACH this spot?"

**Inputs**:
- `options`: { opts: ActionIntent[], bestIdx: number } (from Phase 2)
- `bettingContext`: BettingContext (from Phase 1)
- `handIntent`: HandIntent
- `street`: f | t | r
- `difficulty`: easy | medium | hard

**Outputs**:
```typescript
{
  freq: number[];        // Frequencies (sum to 1.0)
  ev: number[];          // EVs (bestIdx has highest)
  meta: {
    summary: string;
    solverNotes: string[];
    concepts: string[];
  }
}
```

**What Phase 3 Does NOT Do**:
- ❌ Change opts or bestIdx
- ❌ Inspect board cards
- ❌ Inspect hero hand
- ❌ Claim solver accuracy

---

## What the Template DOES

`srp_universal.ts` is a **pure orchestration layer** that:

1. **Constructs the scenario**
   - Loads ranges from `theory/preflop/charts/`
   - Samples a hero hand using seeded RNG
   - Generates a random board
   - Calculates pot and betting history

2. **Classifies hand/board features** (READ-ONLY)
   - Calls classification functions
   - Does not make strategic decisions

3. **Gates ineligible spots**
   - Rejects hands that shouldn't be in training

4. **Wires Phase 1 → Phase 2 → Phase 3**
   - Passes outputs from one phase to the next
   - Does not add logic between phases

5. **Assembles final Spot JSON**
   - Combines all phase outputs
   - Does not modify phase outputs

---

## What the Template Does NOT Contain

| Logic Type | Where It Lives Now |
|------------|-------------------|
| Betting rules | Phase 1: `bettingContext.ts` |
| Sizing rules | Phase 2: `optionBuilder.ts` |
| Difficulty heuristics | Phase 2: `optionBuilder.ts` |
| Meta selection | Phase 3: `pedagogy/metaSelector.ts` |
| Frequency tables | Phase 3: `pedagogy/frequencyEngine.ts` |
| EV heuristics | Phase 3: `pedagogy/evEngine.ts` |

---

## Logic Removed From Template

The following logic was **removed** from `srp_universal.ts` and **replaced** with phase calls:

### Replaced by Phase 1

```typescript
// ❌ REMOVED: Betting mode inference
const bettingMode = inferBettingMode({
  leverage, heroClass, handIntent, turnType, hero, board,
  effectiveStack, pot, feats
});
const nodeIntent = inferNodeIntentFromMode(bettingMode, leverage, handIntent);
```

### Replaced by Phase 2

```typescript
// ❌ REMOVED: Manual option building
const sizeSet = getSizeSet(leverage, bettingMode);
const [size1, size2] = sizeSet;
const bet1Amount = pctAmount(size1, pot);
const bet2Amount = pctAmount(size2, pot);

if (bettingMode === "overbet") {
  bestIdx = heroClass2 === "monster" ? 2 : 1;
} else {
  switch (leverage) {
    case "high": bestIdx = handIntent === "made_value" ? 2 : 1; break;
    case "medium": bestIdx = 1; break;
    case "low": /* ... */ break;
  }
}
```

### Replaced by Phase 3

```typescript
// ❌ REMOVED: Direct meta template selection
const metaTemplate = getMetaTemplate(handIntent, heroClass2, feats, turnType, bettingMode);
const concepts = clampList(filterConcepts(metaTemplate.concepts), MAX_CONCEPTS);
const solverNotes = metaTemplate.solverNotes.slice(0, 4);

// ❌ REMOVED: Manual EV calculation
const ev = Array.from({ length: opts.length }, (_, i) => {
  const distFromBest = Math.abs(i - bestIdx);
  return Math.round((2.0 - distFromBest * 0.4) * 10) / 10;
});

// ❌ REMOVED: Direct frequency lookup
const freqs = lookupBaseFrequencies(handIntent, turnType, nodeIntent, opts.length);
```

---

## Why This Separation Prevents Heuristic Explosion

### Before: Monolithic Template

```
Template contains:
├── Scenario construction
├── Hand classification
├── Betting rules          ← edge cases everywhere
├── Sizing rules           ← if/else chains
├── Difficulty logic       ← mixed with sizing
├── Meta selection         ← depends on board/hand
├── Frequency lookup       ← huge lookup table
└── EV calculation         ← arbitrary formulas
```

**Problems**:
- Every new board type requires new if/else branches
- Difficulty logic leaks into betting logic
- Meta depends on implementation details
- Impossible to test in isolation

### After: Phase Architecture

```
Template (Orchestration):
├── Scenario construction
├── Hand classification (READ-ONLY)
├── Phase 1 call ──────────► Betting rules (isolated)
├── Phase 2 call ──────────► Sizing + difficulty (isolated)
├── Phase 3 call ──────────► Teaching (isolated)
└── JSON assembly
```

**Benefits**:
- Each phase has **single responsibility**
- Edge cases are **localized** to one phase
- Phases can be **tested independently**
- Future fixes require touching **one phase only**

---

## Testing the Pipeline

```bash
# Test Phase 1 only
node -e "
const { computeBettingContext } = require('./dist/spotgen/poker/bettingContext');
console.log(computeBettingContext({
  street: 't', heroIsIP: true, leverage: 'high',
  rangeAdvantage: 'hero', nutAdvantage: true,
  effectiveStack: 50, pot: 30
}));
"

# Test Phase 2 only
node -e "
const { computeBettingContext } = require('./dist/spotgen/poker/bettingContext');
const { buildOptionsFromContext } = require('./dist/spotgen/poker/optionBuilder');

const ctx = computeBettingContext({
  street: 't', heroIsIP: true, leverage: 'high',
  rangeAdvantage: 'hero', nutAdvantage: true,
  effectiveStack: 50, pot: 30
});

console.log(buildOptionsFromContext({ context: ctx, difficulty: 'hard' }));
"

# Test Phase 3 only
node -e "
const { runPedagogyPhase } = require('./dist/spotgen/poker/pedagogy');
console.log(runPedagogyPhase({
  options: { opts: ['check', 'small', 'large'], bestIdx: 1 },
  bettingContext: { polarity: 'merged', checkDominant: false },
  handIntent: 'thin_value',
  street: 't',
  difficulty: 'medium'
}));
"

# Test full pipeline
npm run spotgen:validate
```

---

## Files Reference

| Component | File | Responsibility |
|-----------|------|----------------|
| Template | `templates/srp_universal.ts` | Orchestration only |
| Phase 1 | `poker/bettingContext.ts` | Betting permissions |
| Phase 2 | `poker/optionBuilder.ts` | Option selection |
| Phase 3 | `poker/pedagogy/` | Teaching (freq, EV, meta) |
| Classification | `poker/classify.ts` | Hand strength |
| Classification | `poker/turnClassify.ts` | Turn type |
| Classification | `poker/handFeatures.ts` | Hand features |
| Classification | `poker/leverage.ts` | Leverage profile |

