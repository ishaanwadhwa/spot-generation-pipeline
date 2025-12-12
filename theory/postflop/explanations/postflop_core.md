
# 📘 **Postflop Core Theory (6-Max Cash)**

*This file defines the foundational postflop heuristics used across all spot generation, solver guidance, and LLM explanations. It is article-derived but rewritten to be solver-consistent.*

---

# 1. Playing Postflop as the Preflop Aggressor (In-Position)

## 1.1 Continuation Betting — Small Bet Strategy (25–33%)

Small bets apply on:

* Dry, disconnected flops (K72, A93, 842, Q83)
* Boards where IP has **nut advantage**
* Flops where OOP has few strong made hands
* Rainbow or low-interaction textures

**Purpose of small bets:**

* deny equity vs hands like 98, JT, QJ, random floats
* widen profitable bluff frequency
* keep entire range uncapped
* generate fold equity vs underpairs and ace-highs
* set up multi-street barrels

**Small bet candidates:**

* Backdoor flush draws
* Backdoor straights
* Ace-high with overcards
* Weak pairs
* Overcards with no SDV
* Range-bet flops where entire IP range can bet profitably

---

## 1.2 Large Bet Strategy (75% – Overbet)

Large bets should be used selectively when:

* IP wants to polarize between strong hands + strong draws
* Villain has many medium-strength bluff-catchers
* Turn card or flop gives IP a significant **range advantage**
* IP holds hands that benefit from fold equity if called

**Large bet candidates:**

* Strong draws (NFD + BDSD, OESD + overs)
* Sets and two pairs
* Strong top pair / overpairs on favorable runouts
* Nut advantage combos
* A5♣-type hands with additional turn equity (as in article example)

---

## 1.3 Triple-Barrel Strategy

Hands that make strong triple-barrels:

* Backdoor draws that pick up equity
* Strong blockers that remove villain's strongest continue hands
* Range-advantaged textures that remain good for IP across streets
* Polarized hands: good value + high-equity bluffs

Avoid triple barrels:

* Versus calling stations
* On extremely dynamic, wet boards (9♥7♥6♦)
* When equity and fold equity do not justify investment

---

# 2. Playing Postflop as the Big Blind (OOP)

## 2.1 When to Check-Call

Use check-call for:

* Medium-strength one-pair hands
* Underpairs with show-down value
* Weak top pairs (TPTK may mix depending on board)
* Weak draws
* Hands that do not want to be check-raised and blown off equity

---

## 2.2 When to Check-Raise

You check-raise a **polarized** range:

### Value raises:

* Two pair
* Sets
* Straights
* Sometimes overpairs depending on board texture

### Bluff raises:

* Open-ended straight draws
* Combo draws (pair + draw, FD + gutshot)
* BDFD + BDSD combinations
* Overcards + equity
* Nut blockers

Continue barreling when:

* Turn card strengthens BB's perceived range
* Turn card improves BB's equity
* Turn card is neutral or bad for IP
* Board does not pair

---

# 3. Barrelling Principles (Universal Solver Heuristics)

## Principle 1 — Bet/Raise/Call when:

```
raw equity + fold equity > required investment
```

## Principle 2 — Check/Fold when:

```
combined equity < required investment
```

## Principle 3 — Hand strength is relative

Do not overplay medium-strength hands in medium pots.

## Principle 4 — Build big pots with big hands

Use larger sizings for polarization.

## Principle 5 — Avoid hero calls/folds without a strong read

Population underbluffs rivers; large river bets skew nutted.

---

# 4. Situation-Based Adjustments

## 4.1 Versus Calling Stations

Reduce bluff frequency.
Increase value betting frequency and size.

## 4.2 On Wet / Highly Dynamic Boards

Reduce c-bet frequency.
Prefer checking medium-strength value hands.
Delay c-betting becomes more common.

## 4.3 Versus Weak or Passive Players

* 3-bet or isolate more in position
* Value bet thinly and relentlessly
* Avoid tricky slowplays
* Overfold rivers vs large bets from passive players

---

# 5. Practical Street-by-Street Guidelines

## Flop:

* Small bets on dry flops with range advantage
* Larger bets on dynamic boards with polarization
* BB check-raise strategy essential vs small c-bets

## Turn:

* Barrel when equity improves
* Barrel on cards that improve IP's nut advantage
* Probe turns when IP checks flop
* Overbet polarized value + semi-bluffs

## River:

* Use blockers to determine bluff frequency
* Aggression from passive players = almost always value
* Polarize value hands and bluffs
* Avoid thin hero calls

---

# 6. Exploitative Layer (Optional for "Exploit Mode")

Use only when SpotGenerator or LLM explanation is in exploit mode:

* Identify recreational tendencies: call-heavy, draw-chasing
* Overbet value vs calling stations
* Underbluff vs passive opponents
* Value bet extremely thinly
* Avoid fancy bluffs
* Widen isolation and 3-bet ranges

---

# Summary

This module defines the **Level 1 foundational postflop heuristics** used for:

* Spot generation
* Action selection logic
* Street-by-street sizing justification
* LLM explanation generation
* Onboarding theory lessons

The goal is to separate **core solver-consistent theory** from:

* exploitative adjustments
* meta-game
* mindset concepts

