# LLM Audit Workflow

## Overview

The LLM Audit Layer is a **human-in-the-loop quality gate** where the Cursor Agent (LLM) reviews generated spots against poker theory before they are committed to the database.

## Why LLM Audit Exists

The deterministic pipeline (Phase 1 → 2 → 3) handles:
- ✅ Mathematical correctness (pot math, sizing)
- ✅ Structural validity (schema, action legality)
- ✅ Strategic classification (hand intent, leverage)
- ✅ Pedagogical consistency (frequencies, EVs, meta)

But it **cannot** verify:
- ❌ Strategic nuance (is this *really* the best line?)
- ❌ Theory alignment (does this match solver principles?)
- ❌ Explanation quality (is the summary helpful, not misleading?)
- ❌ Edge case detection (weird board runouts, blocker effects)

**The LLM audit layer fills this gap.**

---

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPOT GENERATION PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. preview-spot                                                │
│     └─> Phase 1 (BettingContext)                                │
│     └─> Phase 2 (OptionBuilder)                                 │
│     └─> Phase 3 (Pedagogy)                                      │
│     └─> Rule-Based Validation ✓                                 │
│     └─> Spot JSON (not committed)                               │
│                                                                 │
│  2. llm-audit --id s527                                         │
│     └─> Build LLM Audit Packet                                  │
│     └─> Load relevant theory snippets                           │
│     └─> Format for LLM review                                   │
│     └─> Output to console                                       │
│                                                                 │
│  3. LLM REVIEWS (Cursor Agent)                                  │
│     └─> Read audit packet                                       │
│     └─> Compare against theory documents                        │
│     └─> Answer review questions                                 │
│     └─> Reply: APPROVE / REJECT / REFINE                        │
│                                                                 │
│  4. Based on verdict:                                           │
│     ├─> APPROVE: commit-spot (append to seed.ts)                │
│     ├─> REJECT: regenerate with constraints                     │
│     └─> REFINE: patch meta only (manual edit)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## CLI Commands

### Generate Preview
```bash
npm run spotgen preview-spot -- --type srp_universal \
  --hero MP --villain BB --street t --id s527
```

### Request LLM Audit
```bash
npm run spotgen llm-audit -- --id s527
```

This outputs a formatted packet containing:
- Spot overview (ID, street, difficulty, matchup)
- Hand & board
- Classifications (heroClass, pairQuality, handIntent, turnType)
- Hand features
- Options & solution
- Meta (concepts, summary, solverNotes)
- Relevant theory snippets
- Review questions

### Commit Approved Spot
```bash
npm run spotgen commit-spot < spot.json
```

---

## LLM Audit Packet Structure

```typescript
interface LLMAuditPacket {
  // Identity
  spotId: string;
  street: string;
  difficulty: number;

  // Hand info
  heroPosition: string;
  heroHand: string[];
  villainPosition: string;
  board: string[];
  pot: number;

  // Classifications to verify
  classifications: {
    heroClass: string;      // monster/strong/medium/weak/air
    pairQuality: string;    // top/second/bottom/overpair/etc
    handIntent: string;     // made_value/thin_value/combo_draw/etc
    turnType: string;       // blank/overcard/straight_completer/etc
    flopClass: string;      // dry_Axx/monotone/paired/etc
  };

  // Features
  handFeatures: {
    hasPair: boolean;
    pairRank?: string;
    hasFlushDraw: boolean;
    straightDraw: string;
    comboDraw: boolean;
    hasStraight: boolean;
    equityProxy: number;
  };

  // Solution
  options: string[];
  bestIdx: number;
  frequencies: number[];
  evs: number[];

  // Meta to review
  meta: {
    concepts: string[];
    summary: string;
    solverNotes: string[];
  };

  // Theory context
  theoryContext: string[];

  // Questions to answer
  reviewQuestions: string[];
}
```

---

## LLM Review Protocol

When reviewing a spot, the LLM should:

### 1. Verify Classifications
- Is `heroClass` correct for this hand on this board?
- Is `handIntent` appropriate (not thin_value for air, etc.)?
- Is `turnType` correctly identified?

### 2. Check Strategic Soundness
- Does `bestIdx` point to the strategically sound option?
- Does this line align with solver principles in theory docs?
- Are blockers/equity relevant and correctly considered?

### 3. Review Meta Quality
- Is the summary accurate and educational?
- Are solverNotes specific and not hallucinated?
- Are concepts appropriate for this spot?

### 4. Provide Verdict

**APPROVE** - Spot is production-ready
```
APPROVE
```

**REJECT** - Spot needs regeneration with constraints
```
REJECT {
  "constraints": {
    "avoidHeroClasses": ["air"],
    "requireTurnType": "blank_turn",
    "intent": "Focus on value spots"
  }
}
```

**REFINE** - Only meta needs adjustment
```
REFINE {
  "meta": {
    "summary": "Corrected summary...",
    "solverNotes": ["Fixed note 1", "Fixed note 2"]
  }
}
```

---

## Theory Documents Used

The LLM audit layer loads snippets from:

1. **`theory/core/CORE_HYBRID_ENGINE.md`** - Core GTO principles
2. **`theory/postflop/explanations/postflop_core.md`** - Postflop heuristics
3. **`theory/postflop/solver_truth_docs/turn_matrix.MD`** - Turn strategy
4. **`theory/postflop/solver_truth_docs/river_matrix.MD`** - River strategy
5. **`theory/postflop/solver_truth_docs/flop_matrix.MD`** - Flop strategy

---

## Benefits

1. **Quality Gate**: Catches strategic errors missed by deterministic checks
2. **Theory Alignment**: Ensures spots match documented principles
3. **Explanation Quality**: Verifies meta is helpful, not misleading
4. **Scalable**: LLM reviews only final spots, not intermediate attempts
5. **Traceable**: Audit packets provide clear reasoning trail

---

## Limitations

1. **Token Cost**: Each audit consumes LLM tokens
2. **Latency**: Adds human-in-the-loop delay
3. **Subjectivity**: LLM judgment may vary slightly

Mitigation: Use LLM audit only for final review, not intermediate retries.

