# Phase 2: Option Construction & Difficulty Spacing

## Overview

Phase 2 introduces a deterministic option construction layer that consumes `BettingContext` (from Phase 1) and produces exactly 3 options for every spot.

## Core Principles

### 1. Options Are Not Difficulty-Dependent in Availability

Every spot gets exactly 3 options. Always. The difficulty level does NOT control which options exist—only how "confusing" the alternatives feel.

### 2. Difficulty Controls Spacing, Not Complexity

| Difficulty | Intent Distance | Effect |
|------------|-----------------|--------|
| **Easy** | ±2 from anchor | Clearly wrong alternatives |
| **Medium** | −1, +2 from anchor | Moderate confusion |
| **Hard** | ±1 from anchor | Tightly clustered, hard to distinguish |

### 3. Anchor ≠ Solver Truth

The "correct" option is the **strategic anchor**, determined by `BettingContext`:

```
if checkDominant → anchor = "check"
else if polarity === "merged" → anchor = "small"
else if polarity === "polarized" → anchor = "large"
fallback → "check"
```

This is NOT the EV-maximizing action. It's the strategic center around which alternatives are placed.

### 4. Intent Distance Ordering

Options differ by **intent distance**, not arbitrary sizing:

```
check < small < large < overbet
  0       1       2        3
```

## Implementation

### Module: `poker/optionBuilder.ts`

#### Exports

```typescript
// Main entry point
buildOptionsFromContext(input: OptionBuildInput): OptionBuildResult

// Sub-functions (for testing/debugging)
inferAnchorAction(context: BettingContext): ActionIntent
buildIntentUniverse(context: BettingContext): ActionIntent[]
selectOptionsByDifficulty(...): ActionIntent[]
```

#### Types

```typescript
type ActionIntent = "check" | "small" | "large" | "overbet";
type DifficultyLevel = "easy" | "medium" | "hard";

interface OptionBuildResult {
  opts: ActionIntent[];  // Always length === 3
  bestIdx: number;       // Index of anchor action
  reasons: string[];     // Debug trace
}
```

## Algorithm

### Step 1: Infer Anchor Action

```typescript
function inferAnchorAction(context: BettingContext): ActionIntent {
  if (context.checkDominant) return "check";
  if (context.polarity === "merged") return "small";
  if (context.polarity === "polarized") return "large";
  return "check";
}
```

### Step 2: Build Intent Universe

Start with `["check"]`, then append based on `BettingContext`:

```typescript
function buildIntentUniverse(context: BettingContext): ActionIntent[] {
  const universe = ["check"];
  if (context.allowsSmallBet) universe.push("small");
  if (context.allowsLargeBet) universe.push("large");
  if (context.allowsOverbet) universe.push("overbet");
  return universe;
}
```

### Step 3: Select by Difficulty

1. Find anchor in universe (or closest allowed)
2. Apply distance offsets based on difficulty
3. Clamp to available intents
4. Ensure exactly 3 unique options

### Step 4: Finalize

- Sort by intent order
- Set `bestIdx` to anchor position
- Return result

## Examples

### Example 1: High Leverage, Polarized, Hard Difficulty

```
Input:
  context.checkDominant = false
  context.polarity = "polarized"
  context.allowsSmallBet = true
  context.allowsLargeBet = true
  context.allowsOverbet = true
  difficulty = "hard"

Process:
  Anchor = "large" (polarized)
  Universe = ["check", "small", "large", "overbet"]
  Hard = ±1 spacing → ["small", "large", "overbet"]

Output:
  opts = ["small", "large", "overbet"]
  bestIdx = 1 (large)
```

### Example 2: Low Leverage, Merged, Easy Difficulty

```
Input:
  context.checkDominant = false
  context.polarity = "merged"
  context.allowsSmallBet = true
  context.allowsLargeBet = false
  context.allowsOverbet = false
  difficulty = "easy"

Process:
  Anchor = "small" (merged)
  Universe = ["check", "small"]
  Easy = ±2 spacing → ["check", "small", "small"] → dedupe → ["check", "small"]
  Expand to 3 → ["check", "small", "small"]

Output:
  opts = ["check", "small", "small"]
  bestIdx = 1 (small)
```

### Example 3: Check Dominant, Medium Difficulty

```
Input:
  context.checkDominant = true
  context.allowsSmallBet = true
  context.allowsLargeBet = false
  difficulty = "medium"

Process:
  Anchor = "check" (checkDominant)
  Universe = ["check", "small"]
  Medium = −1, +2 spacing → ["check", "small"]
  Expand to 3 → ["check", "check", "small"]

Output:
  opts = ["check", "check", "small"]
  bestIdx = 0 (check)
```

## Why This Design?

### Previous Problems

1. **Difficulty tied to option availability**: Easy spots had 2 options, hard spots had 3-4. This conflated pedagogy with structure.

2. **Mixed concerns**: Option building contained hand-strength logic, solver heuristics, and frequency computation.

3. **Endless edge cases**: Every new scenario required special-case tuning.

### New Benefits

1. **Clear abstraction**: Phase 1 = permissions, Phase 2 = construction, Phase 3 = pedagogy

2. **Deterministic**: Same inputs always produce same outputs

3. **Poker-theoretic**: Intent distance is a real concept (passive → aggressive spectrum)

4. **Extensible**: Adding new intents or difficulty mappings is trivial

## Integration

Templates consume the option builder like this:

```typescript
import { computeBettingContext } from "./bettingContext";
import { buildOptionsFromContext, buildSpotOpts } from "./optionBuilder";

// Phase 1: Compute context
const context = computeBettingContext({
  street, heroIsIP, leverage, rangeAdvantage, nutAdvantage, effectiveStack, pot
});

// Phase 2: Build options
const { opts: intents, bestIdx } = buildOptionsFromContext({
  context,
  difficulty
});

// Convert to spot format
const opts = buildSpotOpts(intents, pot);
```

## Testing

Verify with:

```bash
node -e "
const { buildOptionsFromContext } = require('./dist/spotgen/poker/optionBuilder');
const { computeBettingContext } = require('./dist/spotgen/poker/bettingContext');

const ctx = computeBettingContext({
  street: 't',
  heroIsIP: true,
  leverage: 'high',
  rangeAdvantage: 'hero',
  nutAdvantage: true,
  effectiveStack: 50,
  pot: 30,
});

console.log(buildOptionsFromContext({ context: ctx, difficulty: 'hard' }));
"
```

