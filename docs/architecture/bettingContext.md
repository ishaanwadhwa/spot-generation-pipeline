# Phase 1: Betting Context

## Overview

`poker/bettingContext.ts` is the **Phase 1** module in the spot generation pipeline. It answers a single question:

> "What types of betting are structurally valid in this node?"

## Phase 1.5 Update: Advantage Inference

As of Phase 1.5, **range advantage** and **nut advantage** are now **derived internally** within `computeBettingContext()`.

### Why This Change?

Previously, `inferRangeAdvantage` and `inferNutAdvantage` were defined in `srp_universal.ts`. This violated the principle:

> "Templates must not contain poker heuristics."

These are poker strategy decisions, not orchestration logic.

### New Input Contract

```typescript
interface BettingContextInput {
  // Node identity
  street: Street;           // "f" | "t" | "r"
  heroIsIP: boolean;        // Is hero in position?
  
  // Leverage (computed upstream)
  leverage: Leverage;       // "none" | "low" | "medium" | "high"
  
  // Stack geometry
  effectiveStack: number;
  pot: number;
  
  // NEW: Raw inputs for advantage inference
  heroIsOpener: boolean;    // Did hero open preflop?
  heroClass: string;        // e.g., "monster", "strong_value", "medium"
  handFeatures: {
    hasStraight: boolean;
    hasFlush: boolean;
  };
}
```

### What Gets Derived Internally

```typescript
// Inside computeBettingContext():
const rangeAdvantage = inferRangeAdvantage(heroIsOpener, heroIsIP);
const nutAdvantage = inferNutAdvantage(heroClass, handFeatures);
```

## Advantage Inference Rules

### Range Advantage

```typescript
function inferRangeAdvantage(heroIsOpener: boolean, heroIsIP: boolean): RangeAdvantage {
  // IP opener: strongest range
  if (heroIsOpener && heroIsIP) return "hero";

  // OOP opener: still has advantage (stronger preflop range)
  if (heroIsOpener) return "hero";

  // OOP defender: weakest range
  if (!heroIsOpener && !heroIsIP) return "villain";

  // IP defender: neutral (positional advantage offsets range disadvantage)
  return "neutral";
}
```

**Rationale:**
- Opener has a stronger range due to preflop selection
- IP adds positional advantage
- OOP defender has the weakest structural position

### Nut Advantage

```typescript
function inferNutAdvantage(heroClass: string, feats: AdvantageFeatures): boolean {
  // Monster hands have nut advantage
  if (heroClass === "monster") return true;

  // Completed straights/flushes have nut advantage
  if (feats.hasStraight || feats.hasFlush) return true;

  return false;
}
```

**Rationale:**
- Nut advantage means hero can credibly represent the strongest hands
- Monsters, made straights, and flushes qualify

## Output

```typescript
type BettingContext = {
  // Copied from input
  street: Street;
  heroIsIP: boolean;
  leverage: Leverage;

  // Derived internally
  rangeAdvantage: RangeAdvantage;  // "hero" | "neutral" | "villain"
  nutAdvantage: boolean;
  stackPressure: StackPressure;    // "low" | "medium" | "high"
  polarity: Polarity;              // "merged" | "polarized"

  // Strategic constraints
  checkDominant: boolean;
  allowsSmallBet: boolean;
  allowsLargeBet: boolean;
  allowsOverbet: boolean;

  // Audit trace
  reasons: string[];
};
```

## Rules Applied

1. **Street Effects**: Flop is always merged; turn/river polarity depends on leverage/nutAdvantage
2. **Position Effects**: OOP has checkDominant, no overbets
3. **Leverage → Permissions**: Higher leverage unlocks larger bets
4. **Nut Advantage Overrides**: IP + nutAdvantage can unlock large bets/overbets
5. **Stack Pressure**: High SPR enables larger actions
6. **Range Disadvantage Lock**: Villain range advantage disables large bets
7. **Final Sanity Clamp**: No bets → checkDominant

## Usage in Template

```typescript
// In srp_universal.ts:
const bettingContext = computeBettingContext({
  street,
  heroIsIP,
  leverage,
  effectiveStack,
  pot,
  // Pass raw inputs - advantages derived inside
  heroIsOpener,
  heroClass: heroStrength,
  handFeatures: { hasStraight: feats.hasStraight, hasFlush: false },
});
```

## What Phase 1 Does NOT Do

- ❌ Choose specific bet sizes (Phase 2)
- ❌ Choose best action (Phase 2)
- ❌ Compute frequencies (Phase 3)
- ❌ Generate explanations (Phase 3)

## Backward Compatibility

The old interface `BettingContextInputLegacy` is deprecated but still exported:

```typescript
/** @deprecated Use BettingContextInput instead */
interface BettingContextInputLegacy {
  street: Street;
  heroIsIP: boolean;
  leverage: Leverage;
  rangeAdvantage: RangeAdvantage;  // ← explicitly provided
  nutAdvantage: boolean;           // ← explicitly provided
  effectiveStack: number;
  pot: number;
}
```

This should not be used in new code.

