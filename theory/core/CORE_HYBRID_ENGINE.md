# 6-Max NLHE Cash Game GTO Theory: Comprehensive Foundational Reference

## Overview

This document synthesizes Game Theory Optimal (GTO) principles for 6-handed No-Limit Hold'em cash games, derived from modern solver-backed frameworks (PioSOLVER, GTO Wizard, Monker), established poker theory (Janda's "Applications of No-Limit Hold'em," "Modern Poker Theory"), and credible GTO educators (Upswing Poker, RunItOnce, GTOWizard blog, Carroters, RaiseYourEdge).

The goal is to provide a theoretical frameworkâ€”not solver frequenciesâ€”that explains why GTO-optimal play works in 6-max cash games and how to reason about strategic decisions. This document serves as a foundation for understanding spot construction and strategic decision-making in 6-handed environments.

---

## Part 1: Core GTO Principles for 6-Max Cash Games

### 1.1 What Is GTO and Why It Matters in 6-Max

**GTO Definition:** Game Theory Optimal play is a strategically balanced approach designed to be unexploitable by opponents regardless of their tendencies. GTO doesn't require reading opponents; it creates a foundation that works against all player types.

**Why GTO for 6-Max?**

- **Faster Game Rotation:** In 6-max, you pay blinds every 6 hands instead of 9. Blind defense and positional play are critical; GTO provides unexploitable frameworks for these positions.
- **Skill-Heavy Format:** 6-max attracts skilled players. Playing exploitatively against balanced opponents becomes less profitable; GTO prevents exploitation.
- **Position Is King:** The wider opening ranges and aggressive play from late position require a balanced theoretical foundation to avoid making costly mistakes.

### 1.2 Core GTO Concepts

**Range Composition:**

A "range" is the set of hands a player can have in a given situation. GTO solvers determine optimal ranges for each position, action sequence, and board texture. Key concepts:

- **Polarized Range:** Hands split into two groupsâ€”strong hands and weak/bluff handsâ€”with few medium-strength hands. Typical on the river or after large bets.
- **Merged/Linear Range:** A wide distribution of hands across the spectrum (weak to strong) with many medium-strength hands. Common on early streets with small bet sizes.
- **Balanced Range:** A range that includes the correct ratio of value hands to bluffs (typically matching pot odds offered).

**Equity vs. Value Distribution:**

- **Equity:** The percentage of the time a hand wins at showdown against a specific range.
- **Value Density:** The proportion of hands in a range that are "value" (hands that win > 50% when called by opponent's range). More important than raw equity percentage for determining strategy.
- **Nut Advantage:** The distribution of the strongest hands in a range. A player with AA, KK while opponent has QQ, JJ has a "nut advantage" even if their average equity is similar.

### 1.3 Position Names and Abbreviations in 6-Max

| Position | Abbreviation | Description |
|---|---|---|
| Lowjack | LJ or MP | 2 players act after you preflop; 3 players OOP postflop |
| Hijack | HJ | 1 player acts after you preflop (only button); 2 players OOP postflop |
| Cutoff | CO | Only button acts after you preflop; button is OOP postflop |
| Button | BTN | No one acts after you preflop; last to act postflop (always IP) |
| Small Blind | SB | Pays 0.5BB preflop; acts first postflop (always OOP) |
| Big Blind | BB | Pays 1BB preflop; acts last postflop (always IP in single-raised pots) |

**Key Insight:** Position determines your ability to realize equity. IP players can check behind when weak, bet when strong, and act last on every postflop street. OOP players face information disadvantage but occasionally gain range advantage in certain spots.

---

## Part 2: Preflop Strategy Framework

### 2.1 Opening Ranges by Position

**Fundamental Principle:** Open ranges widen as you move toward the button because you're less likely to face a strong hand and more likely to win the blinds uncontested.

**Position-Based Opening Ranges (Rough Guides):**

| Position | % of Hands to Open | Key Notes |
|---|---|---|
| **LJ (UTG/MP)** | 12â€“15% | Tightest range; avoid difficult postflop situations OOP |
| **HJ** | 16â€“20% | Slight expansion; more premium hands + some mid-pairs and SCs |
| **CO** | 20â€“25% | Widened range; include more speculative hands (small pairs, low SCs) |
| **BTN** | 25â€“35% | Widest range; position is huge; can open with marginal holdings |
| **SB** | 30â€“40% | Open nearly any two cards against tight BB; only beat BB to win 1.5BB pot |
| **BB** | N/A | Already in pot; decision is 3-bet vs call vs fold against steals |

**Hand Selection Within Ranges:**

- **Premium Value (AA, KK, QQ, AK):** Open 100% of the time
- **Strong Value (JJ, TT, AQ, AJ, KQ):** Open 100% of the time
- **Medium-Strength (99, 88, KJ, KT, ATo+):** Position-dependent; higher frequency from CO/BTN
- **Speculative (Suited Connectors: 87s, 76s; Suited Gappers: A9s, K9s):** Primarily from LP (CO/BTN/SB) where position advantage justifies the marginal EV
- **Weak Holdings (23o, 32o, 42o):** Generally avoid except SB vs BB; occasional bluffs with high-card blockers

### 2.2 Open-Raising Sizes

**Standard Sizing:**

- **From All Positions Except SB:** 2.25â€“3.0x BB
- **From Small Blind:** 3.0â€“4.0x BB (BB has position and pot odds; larger size mitigates your positional disadvantage)

**Why These Sizes?**

- **Too Small (<2x):** Opponents get great pot odds; calling range becomes too wide; multiway pots reduce your positional advantage
- **Too Large (>3.5x):** Worsens your own pot odds; mathematically requires a tighter range to justify
- **Standard (2.5â€“3x):** Optimal balance between denying pot odds and managing your risk

**Consistency:** Use the same sizing regardless of hand strength. This prevents opponents from exploiting bet-sizing tells.

### 2.3 Defense Against Open Raises

#### Big Blind Defense

**Scenario:** You're in the BB; someone opens from an earlier position.

**Decision Framework:**

1. **Calculate Pot Odds:** The BB already has 1 BB invested, giving you favorable odds to defend
2. **Position Assessment:** You'll be OOP postflop (disadvantage) but act last preflop
3. **Opener's Range:** Wider from LP (CO/BTN), narrower from EP (LJ/HJ)
4. **Stack Depth:** Deeper stacks favor wider calling ranges (more postflop play); shallow stacks favor polar strategies (3-bet or fold)

**General BB Defense Framework:**

| Opener Position | 2.5x Open | 3.0x Open |
|---|---|---|
| **LJ/HJ** | Fold ~60â€“65% of hands; 3-bet strong hands + some blockers; call speculative hands with good playability | Fold ~75â€“80%; 3-bet tighter; fewer calls |
| **CO/BTN** | Fold ~40â€“50%; 3-bet strong hands + more bluffs (blockers); call wide range of speculative hands | Fold ~55â€“65%; more defensive 3-betting; selective calls |

**Hand Types to Defend With:**

- **Call:** Speculative hands (88, 76s, 98s, A9s) that play well postflop; any hand that will have close-to-50%+ equity against opener's range
- **3-Bet:** Premium hands (JJ+, AK) for value; hands with strong blockers (Ax, Kx) as bluffs
- **Fold:** Weak offsuit holdings (92o, 32o) with poor playability and no blockers

**Raise Frequency in BB:** 10â€“15% across all opener positions (mixed between strong value and blockers; most BB continuance is through calling)

#### Small Blind Defense

**Scenario:** You're in the SB; someone opens from LP or someone acts from other positions.

**Special Considerations:**

- **Positional Disadvantage:** You'll be OOP postflop against the BB and any other caller
- **Pot Odds:** You need 1 additional BB to call (better than BB), but postflop position is worst at the table
- **Closing Action:** Only BB can act after you; they can 3-bet, call, or fold

**SB Defense Strategy:**

| Opponent | Strategy | Rationale |
|---|---|---|
| **vs. BTN Open** | 3-bet with strong hands or blockers (~15%); call with premium speculative hands (JJ+, AK, AQ) | BB's position and 3-betting range require you to 3-bet to regain initiative; calls are marginal |
| **vs. CO Open** | 3-bet ~12% (strong value + blockers); selective calls with strong suited hands | Less wide than BTN; fewer calls justify the position disadvantage |
| **vs. LJ Open** | Mostly fold; 3-bet only with strong hands (QQ+, AK); avoid calls (too OOP) | Opener has a tight range; position is too bad to justify marginal calls |
| **vs. BB Steals (SB Opens)** | Fold weak hands; call with JJ+ and AQ+; 3-bet sparingly (initiative less important against weak range) | Rare scenario; depends on opponent's opening range |

**3-Bet Frequencies from SB:** 12â€“18% (lower than BB because of OOP postflop position; mostly strong value + high-card blockers like AK, AQ)

### 2.4 3-Betting Strategy

#### Polarized vs. Merged 3-Bet Ranges

**Polarized 3-Bet Range:**

Structure: Very strong hands (AA, KK, QQ, AK) + weak hands with blockers (suited Aces, suited Kings)

**When to Use:**
- Against opponents who call 3-bets frequently
- From positions where you'll be OOP postflop (SB vs. steal)
- Shallow stacks (limited postflop play; polarization is safer)

**Advantage:** Clearer postflop play; strong hands don't fear calls; bluffs have legitimate fold equity

**Merged 3-Bet Range:**

Structure: Strong hands + medium-strength hands with good postflop playability (JJ, TT, AJ, AQ, KQ)

**When to Use:**
- From positions where you have IP postflop (BTN vs. blind or CO opens)
- Against opponents who fold to 3-bets frequently
- Deep stacks (more postflop play; marginal hands are profitable)

**Advantage:** Balances value and playability; 3-betting with hands like KQ, AJ adds credibility to your range

#### Hand Selection for 3-Betting

**Strong Value (Always 3-Bet):**
- AA, KK, QQ, AK

**Medium Value (Position/Stack Dependent):**
- JJ, TT, 99: From IP (BTN vs steal); avoid from SB/CO
- AQ, AJ, KQ: From IP; occasional 3-bet from SB/CO with blockers

**Bluff 3-Bets (Blockers Essential):**
- AK, AQ, AJ (high-card blockers)
- Ax, Kx (blocker properties; especially from IP)
- Weak offsuit connectors: 97o, 86o (occasional; rare)

**Never 3-Bet As Pure Bluff Without Blockers:**
- Small pairs (22, 33, 44) lack blocking power and have poor postflop equity
- Low offsuit cards (72o, 83o) unblock opponent's entire range

### 2.5 4-Betting

**When to 4-Bet (Rare Preflop Situation):**

4-betting occurs when someone opens, you 3-bet, and they re-raise again.

**4-Bet Ranges:**

| Situation | Action | Hands |
|---|---|---|
| **4-Bet for Value** | Nearly always shove or commit stack | AA, KK, AK (premium hands that dominate opponent's 3-bet calling range) |
| **4-Bet as Bluff** | Occasional, with excellent blockers | AQ, AJ (block opponent's value), possibly KQ if in favorable dynamic |
| **4-Bet Defensive** | Rare; mostly folding | If opponent 4-bets too wide, occasional 4-bet with strong hands to build pots |

**Stack Depth Consideration:** With 100+ BB deep stacks, 4-betting is rare and polarized (nuts or near-air). With shallow stacks (20â€“40 BB), ranges include more medium hands, and 4-betting becomes more frequent.

---

## Part 3: Postflop Strategy Framework

### 3.1 Flop Strategy Basics

#### Range Advantage vs. Nut Advantage

**Range Advantage:** Player with the stronger overall range (more hands beating opponent's average hand). Promotes betting frequency.

**Nut Advantage:** Player with the strongest hands at the top of their range. Promotes bet sizing.

**Example:**
- **BTN Opens; BB Calls**
- Flop: Aâ™  9â™¥ 5â™¦
- **Range Advantage:** BTN (all of BTN's holdings connect well with Aces and medium cards; BB's range is capped)
- **Nut Advantage:** BTN (has more AK, AA, KK combos due to preflop opening range; BB called and is less likely to have premium Aces)
- **Result:** BTN bets frequently, often with small sizing, and merged range

#### Flop Continuation Betting (C-Bet) Principles

**The Decision: Bet or Check?**

**Bet When:**
- You raised preflop (IP has high c-bet frequency; 65â€“85%)
- Your range connects with the board (Ace-high flops, paired flops)
- The board is dry and disconnected (few draws for opponent; opponent's range is weak)

**Check When:**
- You raised preflop but lack nut advantage (monotone boards, straight-draw-heavy boards)
- Checking back slow-plays strong hands and realizes showdown value on weak hands
- You're OOP and uncertain of your advantage (allow BB to show strength rather than committing more chips)

#### C-Bet Sizing on Different Board Textures

| Board Type | Typical Sizing | Rationale |
|---|---|---|
| **Dry, High-Card (A92, K73)** | 25â€“50% pot | Opponent's range is weak; small bet collects folds efficiently |
| **Medium-Strength (K97, Q86)** | 50â€“75% pot | Opponent has some equity (draws, pairs); medium sizing balances value/bluff |
| **Connected with Draws (T98, 876)** | 50â€“75% pot | Opponent's range is strong; larger sizing denies equity to draws |
| **Monotone (Kâ™  9â™  5â™ )** | 25â€“50% pot | IP's betting range is weak (few value hands); small sizing with wide range |
| **Paired (K9K, 334)** | 25â€“50% pot | Both players have pairs; check-raising is common; small sizing with merged range |

### 3.2 Turn Strategy

**Core Principle:** The turn is the bridge between the flop (many cards to come) and the river (no cards to come). Decisions become more polarized.

**Main Turn Actions:**

1. **Double Barrel:** IP bets flop, checks turn (opponent bets), then IP re-opens the action
2. **Triple Barrel:** IP bets flop and turn, then bets river
3. **Check Back:** IP checks, realizing showdown value or controlling pot size
4. **Delayed C-Bet:** IP checked flop; now bets turn

**Turn Bet Sizing:**

- **Large Bets (75%+ pot):** Used when IP has range/nut advantage on blank turn cards
- **Medium Bets (50%):** Balanced approach; used on dynamic turns or when advantage is moderate
- **Small Bets (25â€“33%):** Used on turns that improved opponent's range (straight-completing turns, flush-completing turns)

**Turn Check-Raising (OOP):**

OOP may check-raise with:
- **Strong value:** Sets, two-pair, strong draws + pair
- **Equity-denial draws:** Open-ended straights, strong flush draws
- **Pure bluffs:** Rare; requires exceptional blockers

### 3.3 River Strategy

**River Fundamentals:**

With no more cards to come, hand values are fixed. Strategies become highly polarized: **pure value** (seeking calls from worse hands) or **pure bluff** (seeking folds).

**River Actions:**

| Action | Conditions | Hand Types |
|---|---|---|
| **Bet** | Have the best hand or excellent bluff with blockers | Strong value hands, super-strong draws that hit, air with excellent blockers |
| **Check** | Showdown value but risk of check-raise; want to realize equity cheaply | Medium pairs, weak top pair, hands with no showdown value |
| **Raise** | Strong value hand + want to extract extra chips; or excellent bluff with blockers | Sets, two-pair, strong hands; rare bluffs with multiple blockers |
| **Call** | Facing a bet; deciding to call, fold, or raise based on blocker analysis and pot odds | Bluff-catchers, medium-strength hands with good blockers |
| **Fold** | Facing a bet; hand has no showdown value and poor blocker properties | Air without blockers; weak, unconnected hands |

**River Bet Sizing:**

- **Small (20â€“33%):** Merged range bet; gathering value from wide range of hands
- **Large (75%+):** Polarized range; high value density; opponent is capped
- **Overbet (100%+):** Extreme nut advantage; opponent is completely capped; rare in cash games (more common in tournaments)

### 3.4 Postflop Summary by Position

#### In Position (IP) Strategy

**Advantages:**
- Act last on every street; gather information before committing
- Can check behind to control pot size
- Can size bets strategically based on opponent's action
- Realize more of your equity through information gathering

**General Framework:**
- Bet more frequently with stronger ranges (70â€“80% on dry boards)
- Use smaller sizing with wide, merged ranges (25â€“50% on weak boards)
- Use larger sizing with strong, polar ranges (75%+ on turns with nut advantage)
- Check back sometimes with medium-strength hands to realize showdown value

#### Out of Position (OOP) Strategy

**Disadvantages:**
- Act first; less information before committing
- Cannot check behind to "give up" post-flop; must commit or fold
- Higher postflop risk; decisions are more binary

**General Framework:**
- Build stronger ranges before committing chips (fewer marginal hands continue)
- Raise when you have genuine hands (value or strong semi-bluffs); don't raise as a bluff as often as IP
- Check frequently with marginal hands (showdown value > betting value)
- Use check-raising strategically on favorable boards to extract value and deny equity
- Accept lower equity realization due to positional disadvantage

---

## Part 4: Hand Categories and Selection

### 4.1 Hand Strength Taxonomy

**Hands fall into several categories that determine their optimal play:**

#### Strong Made Hands (Sets, Two-Pair, Straights, Flushes)

**Incentive:** Build the pot as much as possible

**Strategy:**
- Bet frequently with large sizing
- Rarely check back (want pots larger)
- Comfortable facing all-in (have the equity)
- Aggressive plays: fast-play, build pots, take initiative

#### Medium-Strength Hands (Top Pair, Second Pair, Overpairs)

**Incentive:** Realize equity safely; avoid unnecessary risk

**Strategy:**
- Mixed play: sometimes bet, sometimes check
- When betting: smaller sizing (don't commit huge chips)
- When checking: willing to call one bet but not multiple
- Uncomfortable with all-in scenarios (marginal equity)

#### Weak Made Hands (Weak Pair, Low Kicker Issues)

**Incentive:** Reach showdown cheaply or semi-bluff for equity

**Strategy:**
- Check frequently (avoid building pots against stronger hands)
- Call one bet if blockers are good; otherwise fold
- Semi-bluff: add draws or better equity possibilities
- Rarely commit large chips (hand is vulnerable)

#### Strong Draws (OESD, Flush Draw + Pair, Gutshot + Overcards)

**Incentive:** Grow the pot or force folds

**Strategy:**
- Semi-bluff: bet or raise if equity (20â€“40%) warrants action
- Build pots when improving chances (two cards to come)
- Aggressive on favorable runouts (flush-completing turns, straight-completing turns)
- Cautious when equity diminishes (unlikely to hit)

#### Weak Draws (Gutshot Only, Single Overcard)

**Incentive:** Limited; mostly fold or check-call

**Strategy:**
- Rarely bet as a semi-bluff (insufficient equity)
- Check-call against reasonable bets
- Fold if facing large bets or multiple streets of action
- Become more valuable in multiway pots (better odds; better implied odds)

#### Air/Trash (No Pair, No Draw, No Showdown Value)

**Incentive:** Win immediately (fold equity) or give up

**Strategy:**
- Pure bluff only if excellent blockers (block opponent's value hands)
- Otherwise, check and fold to aggression
- Never semi-bluff without draws or overcards
- Rarely continue beyond one street

### 4.2 Blocker Strategy

**Core Concept:** The cards you hold affect the distribution of cards in your opponent's range. This "card removal effect" impacts your strategic decisions.

#### Blocker Types and Impact

**Nut Blockers (Highest Impact):**

Blocks the absolute strongest hand your opponent can have.

- Example: You hold Kâ™¦ on a K-high board; you block your opponent's AA, KK, KQ (reduce these combos)
- Impact: Increases your value betting reliability and makes your bluffs more credible

**High-Card Blockers:**

Blocks strong hands like pairs, straights, flushes.

- Example: You hold an Ace; you reduce opponent's AA combos by half (4 combos instead of 6)
- Impact: Useful for both value and bluffing; increases credibility

**Suit Blockers (Conditional):**

On flush-heavy boards, holding a card of the flush suit reduces opponent's flush combos.

- Example: On a 3-flush board (all spades), holding Aâ™  blocks all spade flushes; highly valuable
- Impact: Significant on monotone/two-tone boards; minimal on rainbow boards

**Trash Blockers (Negative):**

Blocks the weak hands you want your opponent to fold with.

- Example: You hold 7â™¦ on a 987r board; you block opponent's weak flush draws and gutshots (hands that would fold to your bluff)
- Impact: Makes bluffing less effective; prefer hands without trash blockers

#### Using Blockers in Decision-Making

**For Value Betting:**

- Ideal: Block trash, unblock better hands (you want worse hands to call)
- Example: Holding Kâ™¥ on a K-high board, you block weaker King combos, allowing stronger hands like AA, QQ to call

**For Bluffing:**

- Ideal: Block value hands, unblock trash (you want opponent to fold)
- Example: Holding Aâ™  as a bluff, you block opponent's AA, AK, reducing their value combos significantly

**For Bluff-Catching:**

- Ideal: Block value hands, unblock trash (opponent less likely to have strong hands when you block them)
- Example: Facing a bet with AJ on an A-high board, you block opponent's AA and AK, making their betting range weaker and your call more profitable

### 4.3 Hand Selection in Different Spots

#### Opening Range Hand Selection

**Premium (100% open from any position):**
- AA, KK, QQ, AK, AQ (from CO/BTN/SB)

**Strong (95%+ frequency):**
- JJ, TT, 99, AJ, KJ, KQ (from CO+)
- KJ, KQ (from HJ+ with caution)

**Medium (Position Dependent):**
- 88, 77 (from CO/BTN)
- ATo, KJo, QJo (from CO/BTN; avoided from EP)
- Suited connectors: 87s, 76s, 65s (from CO/BTN)
- Suited gappers: A9s, K9s, Q9s (from CO/BTN)

**Weak (Rare; Bluff-Only):**
- Small pairs: 22, 33 (occasional from BTN/SB)
- Trash offsuit: 72o, 83o (very rare; mostly avoided)

#### 3-Bet Range Hand Selection

**Value 3-Bets (Premium):**
- AA, KK, QQ, AK

**Value 3-Bets (Medium; Position Dependent):**
- JJ, TT (from IP against wider openers)
- AQ, AJ (from IP; selective from OOP)
- KQ (from IP; rare from OOP)

**Bluff 3-Bets (Blockers Essential):**
- AK, AQ, AJ (always; high-card blockers)
- A5s, A4s (occasional; blocker properties)
- KQ, KJ (occasional; blocker value)
- Small pairs: 22, 33 (rare; only if other conditions favorable)

**Bluff 3-Bets (Avoid Without Blockers):**
- Low offsuit: 72o, 83o (no blockers; no edge)
- Small pairs without blocker value (poor postflop equity)

---

## Part 5: Position-Specific Strategies

### 5.1 Early Position (Lowjack) Strategy

**Position Characteristics:**
- 2 players act after you preflop
- 3 players OOP postflop (worst position post-flop)

**Key Principles:**

1. **Open Tightly:** 12â€“15% of hands (AA, KK, QQ, AK, AQ, JJ, TT, AJ, KQ)
2. **Avoid Speculative:** Small pairs, weak suited connectors (poor postflop playability OOP)
3. **Prefer Premium Quality:** Your opening range should be hand quality over quantity
4. **Postflop Focus:** When you reach the flop, you're OOP; rely on premium hands, strong draws, or top pair

**Postflop Strategy:**
- C-bet more frequently (reduced range advantage but less multiway risk)
- Use larger sizing (compensate for position disadvantage)
- Avoid big pots with marginal hands (OOP play is difficult with weak holdings)

### 5.2 Middle Position (Hijack) Strategy

**Position Characteristics:**
- 1 player acts after you preflop (only button)
- 2 players OOP postflop

**Key Principles:**

1. **Expand Slightly:** 16â€“20% of hands vs. LJ
2. **Add Medium Strength:** Include 99, 88, KJ, medium suited connectors
3. **Monitor BTN:** BTN will 3-bet wider; adjust accordingly
4. **Playability Focus:** Hands should have good postflop potential

**Postflop Strategy:**
- Similar to LJ but with slightly more flexibility
- Still OOP if BB calls; IP if only BTN calls and BB folds
- Use medium c-bet sizing (50â€“66%) when appropriate

### 5.3 Cutoff Strategy

**Position Characteristics:**
- Position advantage: only BTN acts after you preflop
- IP postflop if you reach flop against blinds

**Key Principles:**

1. **Significant Range Expansion:** 20â€“25% (now opening with speculative hands)
2. **Suited Connectors and Gappers:** Add 87s, 76s, A9s, K9s (position justifies marginal preflop EV)
3. **Small Pairs:** Include 66, 55, 44 (can play more hands in position)
4. **Premium Focus:** Still weight toward strong hands; just wider overall

**Postflop Strategy:**
- IP most of the time (unless facing 3-bet); strong position for post-flop play
- Can use smaller c-bet sizing (25â€“50%) due to position advantage
- More comfortable playing medium hands postflop

### 5.4 Button Strategy

**Position Characteristics:**
- Best position preflop (no one acts after you)
- Always IP postflop

**Key Principles:**

1. **Maximum Range Expansion:** 25â€“35% (widest opening range)
2. **Speculative Hands:** Nearly any suited cards, small pairs, low cards with high-card blocker (K2s, Q3s)
3. **Play More Hands:** Position is valuable; even marginal hands gain value
4. **Aggressive Play:** Use size and aggression to exploit small blind and big blind weakness

**Postflop Strategy:**
- Very strong position; use this advantage
- Smaller c-bet sizing on weak board (25â€“50%) to build pots slowly
- Larger sizing on favorable boards (75%+) to extract value
- Check back with marginal hands to realize equity

### 5.5 Small Blind Strategy

**Position Characteristics:**
- Worst position postflop (act first every street OOP)
- Unique preflop dynamic (only BBto act; already 0.5BB in the pot)

**Key Principles:**

1. **Preflop Opening:** Can open nearly any two cards (only beat BB; 1.5BB in pot waiting)
2. **Tight Postflop:** Playing OOP postflop is the worst position; hands must be premium
3. **3-Betting Strategy:** Use 3-betting to regain initiative and minimize position disadvantage
4. **Folding Preference:** Folding is often better than playing OOP; don't call too loosely

**Preflop Opening Range:** 30â€“40% against most BB (22+, 32s+, 53s+, and Broadway)

**3-Betting vs. BTN:**
- 3-bet 15â€“20% with strong hands and good blockers
- Goal: regain initiative; folding is acceptable

**Playing OOP Postflop:**
- If you called preflop and reach flop, use strong hands primarily
- Check frequently with marginal hands; rarely slow-play
- Avoid big pots with questionable holdings

### 5.6 Big Blind Strategy

**Position Characteristics:**
- Good position preflop (last to act)
- Worst position postflop (act first every street OOP) against IP raisers
- Exception: IP if SB called and you're in position to act last

**Key Principles:**

1. **Defense Range:** Defend wide due to pot odds (already 1BB in); call more frequently than other positions
2. **3-Betting Mix:** Use 3-betting for value and selected bluffs with blockers
3. **Position Disadvantage:** Remember you'll be OOP postflop; adjust calling range accordingly
4. **Hand Playability:** Prefer speculative hands that improve significantly (pairs, suited cards)

**Defending Against Raises:**

| Raise Source | 3-Bet % | Call % | Fold % | Notes |
|---|---|---|---|---|
| **LJ/HJ (2.5x)** | 10â€“12% | 20â€“25% | 65â€“70% | Tight range; selective defense |
| **CO (2.5x)** | 12â€“14% | 25â€“30% | 55â€“60% | Moderate; widen defensively |
| **BTN (2.5x)** | 14â€“16% | 30â€“40% | 45â€“55% | Widest; BTN is stealing |
| **SB (3x)** | 10â€“12% | 15â€“20% | 65â€“75% | Narrow; SB is aggressive; less equity to realize |

**Postflop BB Strategy:**
- Play strong hands aggressively (sets, two-pair, strong draws)
- Check frequently with marginal hands
- Use check-raising strategically to exploit IP range
- Avoid large pots with weak holdings

---

## Part 6: Board Textures and Strategic Adjustments

### 6.1 Board Texture Classification

Flop texture fundamentally shapes both range advantage and betting strategy.

#### Dry, Unpaired, Disconnected (A92r, K73r, Q85r)

**Characteristics:**
- High card appears; little connectivity
- Few draws possible
- IP's range connects better (has more high cards from opening ranges)

**Strategic Implications:**
- **IP Advantage:** Significant; BB's range is weak
- **C-Bet Frequency:** Very high (70â€“85% from IP)
- **C-Bet Sizing:** Small (25â€“50% pot) with merged range
- **BB Response:** Mostly calling with marginal hands; occasional check-raise with premium hands
- **Turn Strategy:** IP likely to double-barrel blank turns; BB mostly checks down

#### Medium Connectivity, Some Draws (K97, Q96, T98)

**Characteristics:**
- Moderate connectivity; some straight draw possibilities
- Paired with lower card possible
- Both players have playable hands in range

**Strategic Implications:**
- **IP Advantage:** Moderate (more balanced range connection)
- **C-Bet Frequency:** Moderate-to-high (60â€“70%)
- **C-Bet Sizing:** Medium (50â€“66% pot)
- **BB Response:** Mix of folds, calls, and raises
- **Turn Strategy:** IP more cautious (board was dynamic); BB more likely to bet/raise

#### Highly Connected (T98, 987, 876)

**Characteristics:**
- High straight draw possibility
- Many improving cards for BB's range
- Dynamic; equity can shift dramatically on turn

**Strategic Implications:**
- **IP Advantage:** Minimal or disadvantaged (BB has many draws)
- **C-Bet Frequency:** Lower (50â€“65%)
- **C-Bet Sizing:** Large (50â€“75% pot) to deny draw equity
- **BB Response:** More check-raises; wider calling range with draws
- **Turn Strategy:** High volatility; large bets if favorable turn; checks if unfavorable

#### Monotone/Flush-Heavy (Kâ™ 9â™ 5â™ , Qâ™¥Tâ™¥8â™¥)

**Characteristics:**
- All cards same suit; full flush draws in both ranges
- IP's range is severely weakened (less value hands stand up)
- OOP's range strengthens (more flush combos)

**Strategic Implications:**
- **IP Disadvantage:** Significant (flush completion is likely)
- **C-Bet Frequency:** Very low (30â€“50%; IP has few value hands)
- **C-Bet Sizing:** Small (25â€“33% pot)
- **BB Response:** Wide calling range; checking is acceptable (many hands improve)
- **Turn Strategy:** IP mostly checks; BB aggressive with flushes and strong draws

#### Paired Boards (KK2r, 775r, 334r)

**Characteristics:**
- Trips possible; both players have pairs
- Low variance in top-pair equity (pair vs. pair hands are similar)
- Kicker play becomes important

**Strategic Implications:**
- **IP Advantage:** Moderate; depends on which card pairs
- **C-Bet Frequency:** Moderate (60â€“70%)
- **C-Bet Sizing:** Small (25â€“50% pot) with merged range
- **BB Response:** Many hands have showdown value; check-raising is common
- **Turn Strategy:** More balanced; less dramatic advantage shifts

### 6.2 Dynamic vs. Static Boards

**Dynamic Boards:**

Definition: Boards where future cards can dramatically shift equity and hand strength.

Examples: T98r, 876r, all two-tone/monotone boards, any board with many draws

**Strategic Approach:**
- Smaller c-bet sizing (difficult to deny all equity)
- Higher check frequencies
- More polarized ranges (value hands and draws; fewer medium-strength hands)
- Turn aggression matters (large bet on favorable turn; check on unfavorable)

**Static Boards:**

Definition: Boards where future cards don't significantly change equity distributions.

Examples: K73r, Q84r, A92r (any dry, high-card boards)

**Strategic Approach:**
- Larger c-bet sizing (easier to deny weak holdings)
- Lower check frequencies
- More merged ranges possible
- Turn play is more straightforward (continuation or value betting)

### 6.3 Equity Distribution and Betting Patterns

**Key Insight:** The distribution of hands in a range (polarized vs. merged) predicts betting frequency and sizing.

**Polarized Range Characteristics:**
- Many hands at 0â€“20% equity (bluffs)
- Many hands at 60%+ equity (strong value)
- Few hands in 30â€“60% (marginal)
- **Betting Pattern:** Bets large and infrequent; only nuts and bluffs

**Merged Range Characteristics:**
- Hands spread across 20â€“70% equity fairly evenly
- Many hands in 40â€“60% (marginal)
- **Betting Pattern:** Bets smaller and more frequently; includes many marginal hands

**Compressed Range Characteristics:**
- Hands concentrated in narrow equity band (e.g., 50â€“65%)
- Few very weak or very strong hands
- **Betting Pattern:** Bets moderate size; high call rate from opponent

---

## Part 7: Key Concepts for 6-Max Strategy

### 7.1 Equity Realization

**Definition:** The percentage of equity a hand actually wins relative to its raw equity percentage.

**Example:**
- A hand has 55% equity preflop
- If money goes in preflop, it realizes 55% equity (100% realization)
- If the hand is played postflop against good opponents making optimal decisions, it might realize only 45% equity (under-realization)

**Why It Matters:**
- Strong hands over-realize equity (can bet for value, denial, build pots)
- Weak hands under-realize equity (fold easily; few opportunities to improve)
- Position affects realization (IP realizes more; OOP realizes less)
- Draw hands vary (depend on board runout and opponent action)

**Position Impact on Equity Realization:**

| Hand Type | IP Realization | OOP Realization | Reason |
|---|---|---|---|
| **Strong Hands (2P+)** | 110â€“120% | 90â€“100% | IP bets/raises for value; OOP makes marginal decisions |
| **Top Pair** | 100â€“110% | 80â€“90% | IP can size appropriately; OOP struggles with range |
| **Medium Hands** | 95â€“105% | 70â€“85% | IP controls pots; OOP faces tough decisions |
| **Weak Hands** | 70â€“85% | 50â€“70% | Both players struggle; OOP especially vulnerable |
| **Draws** | 85â€“95% | 60â€“75% | IP can realize equity slowly; OOP commits more chips |

### 7.2 Pot Odds and Implied Odds

**Pot Odds:** The ratio of the current pot to the cost of a call.

- If pot is 100 and you must call 50, pot odds are 100:50 or 2:1 (you win 2 for every 1 you risk)
- You need at least 1/(2+1) = 33% equity to break even on a call

**Implied Odds:** The ratio including expected future winnings if you hit your hand.

- Example: Calling a 50 bet into 100 pot (33% break-even equity) with a flush draw that has 16% immediate equity, but you expect opponent to pay you off when you hit, raising your effective equity to 35%+

**Strategic Application in 6-Max:**

- **Tight Early Position:** Wider implied odds justification (opponent ranges are tight; less future action)
- **Loose Late Position:** Better implied odds (more players; larger pots)
- **Draws in 6-Max:** Better implied odds than full ring (bigger average pots; more aggressive action)

### 7.3 Value Density and Combo Counting

**Value Density:** The proportion of a betting range that consists of hands with genuine value (expected to win when called).

**Example:**
- You bet 100 into 100 pot (even odds = 50% threshold)
- Your betting range is 50 combos total
- 35 combos are hands that win > 50% (value)
- 15 combos are hands that win < 50% (bluffs/marginal)
- Value density = 35/(35+15) = 70%

**Why It Matters:**
- Higher value density = fewer bluffs; opponent can fold more often without penalty
- Lower value density = more bluffs; opponent must defend wider or get exploited
- Balanced betting has value/bluff ratios matching pot odds (e.g., for 50% pot, 75% value / 25% bluff)

**Combo Counting Method:**

1. List all hands in your range for this spot
2. Count how many combos win against opponent's expected calling range
3. Count how many don't
4. Calculate the ratio

**Example:**
- You c-bet on A93r as BTN vs. BB
- Your range: AA, AK, AQ, AJ, AT, 99, 88, 77, A9, A8, A5, K9, Q9, JT, 98, 87
- Against BB's calling range (22, 65, 76, 87, 98, T9, A9, A5, A4): AA/AK/AQ/AJ always win (20 combos); AT/99/88/77/A9/A8/A5/K9/Q9/JT/98/87 vary
- Count total value vs. bluff combos; determine ratio

### 7.4 Multiway Pots Strategy

**6-Max Tendency:** More multiway pots due to wider opening ranges and aggressive play.

**Strategic Adjustments for Multiway Pots:**

| Element | Adjustment | Rationale |
|---|---|---|
| **Hand Strength Requirement** | Tighter | More opponents = lower individual win rate; need stronger hands |
| **Bet Sizing** | Larger | Multiway calls reduce fold equity; bigger bets needed for denial |
| **Bluffing Frequency** | Lower | Multiple opponents to bluff; lower expected fold rates |
| **Draw Value** | Higher | Better implied odds with multiple opponents |
| **Showdown Value** | Lower | Weak holdings are often dominated; avoid marginal hands |
| **Hand Selection** | Cleaner | Prefer hands with potential to improve (draws, pairs, big cards) |

**Example Hand Selection for Multiway:**
- Avoid: KJ, KT, QJ, weak kickers (too easily dominated)
- Prefer: 99, TT, 87s, AK, AQ (strong draws, pairs, premium hands)

### 7.5 Blocker Effectiveness Tiers

| Blocker Tier | Impact | When to Use | Examples |
|---|---|---|---|
| **Nut Blockers** | Very High | Bluffing against polar ranges; value betting to appear weak | Holding Ace on A-high board; King on K-high board |
| **High Blockers** | High | Bluffing, bluff-catching, value betting | Holding A-K on high boards; blocks premium hands |
| **Suit Blockers** | Moderate-to-High | On flush-heavy boards; blocks flush combos | Holding spade on 3-flush board |
| **Medium Blockers** | Moderate | Bluff-catching; value betting with marginal hands | Holding mid-pairs, mid-cards |
| **Low Blockers** | Low | Generally avoid; prefer hands without | Holding deuce, trey |
| **No Blockers** | Negative | Bluff-catching (unblock value hands); avoid bluffing | Pure air with no card value |

---

## Part 8: GTO vs. Exploitative Play

### 8.1 When to Use GTO vs. Exploitative Play

**GTO Play:**
- Use when opponent tendencies are unknown
- Use in mixed games with varying opponents
- Use to prevent exploitation
- Use when you want unexploitable, balanced strategy

**Exploitative Play:**
- Use when you identify clear opponent tendencies (exploitable leaks)
- Tighten against overly aggressive opponents
- Loosen against overly tight opponents
- Adjust frequencies and ranges to exploit observed mistakes

**Example Exploitation Adjustments:**

| Opponent Leak | GTO Response | Exploitative Adjustment |
|---|---|---|
| **3-Bets too wide (20%+ from BTN)** | Balanced 4-bet with QQ+, AK, blockers | Widen 4-bet range with JJ, TT, AQ; expect more folds |
| **Calls 3-bets too often** | Balanced 3-betting range | Tighten 3-bet bluffs; value bet wider |
| **Folds to continuation bets 60%+** | Balanced c-betting | Increase c-bet frequency with wider range; use smaller sizing |
| **Never folds in BB** | Balanced c-betting; check back more | Bet fewer hands preflop against wide defending range; value bet more thinnly |
| **Plays too tight postflop** | Balanced mixed strategy | Bet more frequently; fewer checks; more bluffs |

### 8.2 The Balance Between Theory and Exploitation

**Best Approach:** Play fundamentally sound GTO strategy with exploitative adjustments.

**Method:**
1. Establish GTO baseline (balanced, unexploitable)
2. Identify opponent leaks (over-folding, over-calling, over-3-betting, etc.)
3. Make small, targeted adjustments
4. Monitor whether opponent adjusts to your changes
5. Return to balanced play if opponent corrects leak

---

## Part 9: Stack Depth Considerations

### 9.1 Effective Stack Depth Impact on Strategy

**Very Deep (150+ BB):**
- Wider opening ranges (position is more valuable; more postflop play)
- More speculative hands profitably played (implied odds)
- Merged 3-betting ranges (medium hands have postflop value)
- Fewer all-in preflop decisions; more turn/river decisions
- Equity realization matters more (more streets to realize)

**Deep (75â€“150 BB):**
- Standard GTO ranges apply well
- Balance between preflop value and postflop flexibility
- Mixed 3-betting ranges (some medium hands, some bluffs)
- Occasional all-in situations; mostly reach later streets

**Medium (40â€“75 BB):**
- Ranges tighten somewhat (all-in becomes more relevant)
- 3-betting becomes more polarized (less middle ground)
- Shorter postflop play; decisions become more binary
- Emphasis on value extraction preflop

**Shallow (20â€“40 BB):**
- Very tight ranges (all-in preflop is common outcome)
- 3-betting is highly polarized (nuts or near-air)
- Fold/call/shove decisions dominate
- Positional advantage diminishes (less postflop play)

**Very Shallow (<20 BB):**
- Ranges collapse to premium hands
- All-in preflop is expected
- Positional advantage nearly meaningless
- ICM considerations (tournament-like dynamics)

---

## Part 10: Summary of 6-Max GTO Foundations

### Core Principles Recap

1. **Position Is Critical:** Position determines information gathering and equity realization. Play wider from late position; play tighter from early position.

2. **Ranges Over Hands:** Think in terms of hand distributions, not individual hands. Understand what percentage of hands to bet, call, or fold.

3. **Balance Is Key:** GTO requires balanced play with correct value/bluff ratios. Over-betting or under-betting either component creates exploitable patterns.

4. **Equity Distribution Drives Strategy:** Polarized ranges bet large and infrequent; merged ranges bet small and frequent. Match your sizing and frequency to your actual range composition.

5. **Blockers Matter Most in Narrow Spots:** When ranges are condensed (river, after large bets), card removal effects become the primary decision factor.

6. **Postflop Advantage Follows Preflop Advantage:** Your preflop opening range determines your postflop potential. Hands that connect well with flops (premium hands, speculative hands with position) are profitable; hands that don't are liabilities.

7. **Bet Sizing Signals Information:** Consistent sizing prevents exploitation. Don't bet differently with AA vs. AK; balance ranges with sizing.

8. **Draw Handling Is Critical:** In 6-max with dynamic boards, draws are common. Treat draws as semi-bluffs with genuine equity; balance betting with calling ranges.

9. **Multiway Pots Require Tighter Standards:** More opponents = lower win percentages. Tighten hand selection and increase betting sizes in multiway situations.

10. **Adaptation Requires Understanding:** GTO is a foundation. Exploit opponents once you identify their leaks, but never deviate so far that you become exploitable yourself.

### Key Heuristics for Fast Decision-Making

**Preflop:**
- Open 20â€“25% from BTN/CO; 15â€“18% from HJ; 12â€“15% from EP
- 3-bet 12â€“18% depending on position and opener
- Defend BB with 25â€“40% against steals; fold 60â€“75% against tight EP raises

**Flop:**
- C-bet 65â€“80% on dry boards; 50â€“65% on connected boards; 30â€“50% on monotone boards
- Use 25â€“50% sizing with wide ranges; 50â€“75% with narrower ranges
- Check back sometimes with medium hands for showdown value

**Turn:**
- Bet large (75%+ pot) on blank turns with advantage; medium (50%) on dynamic turns
- Check back marginal hands (top pair, weak overpairs) to realize showdown value
- Double-barrel draws that improved; check improved made hands sometimes

**River:**
- Bet large (75%+) with polarized ranges; medium/small with merged ranges
- Check-raise only with strong value or excellent bluff+blockers
- Call bluff-catchers based on blocker analysis and opponent range composition

---

## Conclusion

6-max GTO strategy is fundamentally about understanding ranges, positioning, and equity distributions. Rather than memorizing specific hands or frequencies, develop intuition for:

- **Why** certain ranges are optimal (range advantage, nut advantage, postflop play)
- **How** board textures shape strategy (static vs. dynamic, dry vs. connected)
- **When** to deviate with exploitative adjustments (opponent tendencies)

Master these foundations, and you'll have the theoretical framework to construct dynamic training spots, evaluate decisions against solver outputs, and adapt to varied opponents and game conditions.