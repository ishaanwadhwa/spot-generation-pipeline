# Spot Generation Decision Flow

## Architecture Overview

The spot generation pipeline is organized into clear phases with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPOT GENERATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │   Hand & Board  │                                                    │
│  │   Classification│                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │  PHASE 1        │  BettingContext                                    │
│  │  Betting        │  ───────────────                                   │
│  │  Context        │  • What betting is ALLOWED?                        │
│  │                 │  • checkDominant, allowsSmallBet, etc.             │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │  PHASE 2        │  OptionBuildResult                                 │
│  │  Option         │  ─────────────────                                 │
│  │  Construction   │  • Which 3 options to show?                        │
│  │                 │  • What is the anchor action?                      │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │  PHASE 3        │  Frequencies, EVs, Meta                            │
│  │  Pedagogy       │  ─────────────────────                             │
│  │                 │  • How to explain this spot?                       │
│  │                 │  • What frequencies/EVs?                           │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │   Spot JSON     │                                                    │
│  │   Output        │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Betting Context

**File**: `poker/bettingContext.ts`

**Question answered**: "What types of betting are structurally valid in this node?"

### Inputs

- `street`: f | t | r
- `heroIsIP`: boolean
- `leverage`: none | low | medium | high
- `rangeAdvantage`: hero | neutral | villain
- `nutAdvantage`: boolean
- `effectiveStack`: number
- `pot`: number

### Outputs

```typescript
{
  // Permissions
  checkDominant: boolean;
  allowsSmallBet: boolean;
  allowsLargeBet: boolean;
  allowsOverbet: boolean;

  // Context
  polarity: "merged" | "polarized";
  stackPressure: "low" | "medium" | "high";

  // Trace
  reasons: string[];
}
```

### Rules Applied

1. Street effects (flop/turn/river)
2. Position effects (IP/OOP)
3. Leverage → size permissions
4. Nut advantage overrides
5. Stack pressure effects
6. Range disadvantage lock
7. Final sanity clamp

## Phase 2: Option Construction

**File**: `poker/optionBuilder.ts`

**Question answered**: "Which 3 options should the player see?"

### Inputs

- `BettingContext` (from Phase 1)
- `difficulty`: easy | medium | hard | 1-10

### Outputs

```typescript
{
  opts: ActionIntent[];  // ALWAYS length === 3
  bestIdx: number;       // Index of anchor
  reasons: string[];     // Trace
}
```

### Algorithm

1. **Infer Anchor**: checkDominant → check, merged → small, polarized → large
2. **Build Universe**: [check] + allowed betting intents
3. **Select by Difficulty**: Apply intent distance offsets
4. **Finalize**: Ensure 3 unique, sorted options

### Key Invariants

- **Always 3 options**: No exceptions
- **Difficulty ≠ availability**: Difficulty only changes spacing
- **Anchor ≠ solver truth**: Anchor is strategic center
- **Deterministic**: Same inputs → same outputs

## Phase Separation

### What Phase 1 Does NOT Do

- Choose specific sizes
- Choose best action
- Consider difficulty
- Consider frequencies

### What Phase 2 Does NOT Do

- Compute betting permissions
- Run hand-strength logic
- Compute frequencies
- Generate solver notes

### Why This Separation Matters

| Concern | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Betting legality | ✓ | | |
| Option selection | | ✓ | |
| Difficulty | | ✓ | |
| Frequencies | | | ✓ |
| Explanations | | | ✓ |
| EVs | | | ✓ |

## Data Flow Example

```
Input: BTN vs BB, turn, hero has nut straight, difficulty=hard

Phase 1 (BettingContext):
  ─────────────────────────
  leverage = "high" (nut straight)
  polarity = "polarized" (high leverage on turn)
  nutAdvantage = true
  heroIsIP = true

  → allowsSmallBet = true
  → allowsLargeBet = true
  → allowsOverbet = true
  → checkDominant = false

Phase 2 (OptionBuilder):
  ─────────────────────────
  anchor = "large" (polarized)
  universe = ["check", "small", "large", "overbet"]
  difficulty = "hard" → ±1 spacing

  → opts = ["small", "large", "overbet"]
  → bestIdx = 1

Phase 3 (Pedagogy):
  ─────────────────────────
  freq = [0.15, 0.55, 0.30]
  ev = [1.6, 2.0, 1.6]
  summary = "With the nuts, apply maximum pressure..."
  solverNotes = [...]

Output:
  ─────────────────────────
  {
    opts: [["x"], ["b", 66, 21.45], ["b", 125, 40.63]],
    sol: { b: 1, ev: [1.6, 2.0, 1.6] },
    meta: { freq: [0.15, 0.55, 0.30], ... }
  }
```

## Testing the Flow

```bash
# Verify Phase 1
node -e "
const { computeBettingContext } = require('./dist/spotgen/poker/bettingContext');
console.log(computeBettingContext({
  street: 't', heroIsIP: true, leverage: 'high',
  rangeAdvantage: 'hero', nutAdvantage: true,
  effectiveStack: 50, pot: 30
}));
"

# Verify Phase 2
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

# Verify Phase 3
node -e "
const { computeBettingContext } = require('./dist/spotgen/poker/bettingContext');
const { buildOptionsFromContext } = require('./dist/spotgen/poker/optionBuilder');
const { runPedagogyPhase } = require('./dist/spotgen/poker/pedagogy');

const ctx = computeBettingContext({
  street: 't', heroIsIP: true, leverage: 'high',
  rangeAdvantage: 'hero', nutAdvantage: true,
  effectiveStack: 50, pot: 30
});

const opts = buildOptionsFromContext({ context: ctx, difficulty: 'hard' });

console.log(runPedagogyPhase({
  options: opts,
  bettingContext: ctx,
  handIntent: 'made_value',
  street: 't',
  difficulty: 'hard'
}));
"
```

## Phase 3: Pedagogy

**File**: `poker/pedagogy/index.ts`

**Question answered**: "How should we TEACH this spot?"

### Inputs

- `options`: { opts: ActionIntent[], bestIdx: number } (from Phase 2)
- `bettingContext`: BettingContext (from Phase 1)
- `handIntent`: HandIntent
- `street`: f | t | r
- `difficulty`: easy | medium | hard

### Outputs

```typescript
{
  freq: number[];    // Sum to 1.0, bestIdx has highest
  ev: number[];      // bestIdx has highest EV
  meta: {
    summary: string;
    solverNotes: string[];
    concepts: string[];
  }
}
```

### What Phase 3 Does NOT Inspect

- ❌ Board cards
- ❌ Exact bet sizes
- ❌ Hero hand
- ❌ Villain range
- ❌ Leverage internals

### Key Invariants

- **Deterministic**: Same inputs → same outputs
- **No solver claims**: EVs/frequencies are pedagogical
- **Difficulty controls spacing**: Easy = obvious, Hard = compressed
- **Never changes opts/bestIdx**: Phase 3 only adds teaching layer

See `/docs/architecture/phase3-pedagogy.md` for full documentation.

