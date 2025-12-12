# GTO Turn Strategy for 6-Max NLHE Cash Games: Comprehensive Theoretical Reference

## Overview

The turn is often called the most decision-heavy street in No-Limit Hold'em. Hand values become more clearly defined, incentives sharpen, and the limited remaining betting opportunity forces players to pursue their equity with greater precision and urgency. This document synthesizes solver-based principles from GTOWizard, Upswing Poker, RunItOnce, Matthew Janda's "Applications of No-Limit Hold'em," Carroters' work, and other credible GTO sources to provide a complete theoretical framework for turn strategy.

Unlike the flop, where players can defer decisions with small bets and mixed strategies, the turn demands clarity. Medium-strength hands must decide: push equity or check it down? Strong hands must calculate pot-building geometry. Weak hands must commit to bluffing or surrender. This document explores how solver-optimal strategies emerge from these competing incentives across all turn textures and positions.

---

## Part 1: Turn Card Classifications

### 1.1 Blank Turns (Bricks)

**Definition:** A card appearing on the turn that has no connectivity to the flop and does not complete any draws (straight or flush). Examples: 2, 3, 4, 5 appearing on Kâ™ 8â™¥4â™¦.

**Characteristics:**
- Does not give a player a new pair
- Does not complete a straight draw
- Does not give a flush draw to a new-four-flush board
- Preserves the relative strength order from the flop

**Strategic Implications:**
- The player with the stronger flop range maintains advantage
- Encourages **polarized betting strategies** with clear separation between value and bluffs
- The IP player who c-bet the flop typically bets larger on brick turns
- Check occurs primarily with showdown value hands (weak pairs, undercards with BDFD)

**Sizing Patterns:**
- IP c-better typically uses **large sizing (60â€“75% pot or overbet)** on blank turns
- Small sizing (25â€“33%) occurs when the IP player is uncertain of their range advantage or the OOP range is strong

### 1.2 Overcards to the Flop (Scare Cards)

**Definition:** A card ranking higher than the highest card on the flop. Examples: Ace or King appearing on a Q72 flop; King appearing on a K84 flop.

**Characteristics:**
- Dramatically shift hand valuations
- Drastically change the BP player's perceived range (scare effect)
- May complete hands that had limited equity on the flop (AK on a K-high flop)
- Generate "narrative" opportunities for both value betting and bluffing

**Strategic Implications:**

**When IP Holds Range Advantage:**
- The IP player can continue aggressively with many hands, including semi-bluffs and air
- Overcards to the flop are favorable for IP because they reduce the BB's nut advantage
- The BB's range includes many medium-strength hands (pairs that didn't connect with the overcard) that must fold to a large turn bet

**When OOP Holds Advantage:**
- An overcard favoring the OOP player (turning OOP's nut advantage) reduces IP's equity and willingness to barrel
- IP may check back more hands to realize equity without risk
- OOP may probe bet or check-raise with value combos to exploit IP's weakened range

**Sizing Patterns:**
- When favorable to the barrelller: **Large sizing (75%+ pot or overbet)** to maximize value
- When favorable to the defender: **Small sizing (25â€“50% pot)** or checking back

### 1.3 Dynamic Improving Turns (Straight Completers)

**Definition:** A card that completes an open-ended or gutshot straight draw. Examples: T9, 98, 87 flops with a blank turn; then a J (or K/Q, etc.) on the turn completing straights.

**Characteristics:**
- Creates new strong hands in both ranges (straight combos)
- Typically improves the OOP player's range (more straight combos in the calling range)
- Increases equity volatility for IP
- Reduces IP's nut advantage significantly

**Strategic Implications:**
- IP betting frequency often **decreases** on straight-completing turns because the range becomes less polarized
- If IP does bet, sizing may be **smaller (33â€“50% pot)** to acknowledge the increased strength of OOP's range
- OOP's check-raising frequency typically **increases** with value combos and semi-bluffs
- Straight completers favor **OOP, especially when the straight is in the middle of both ranges** (e.g., 987 flop with a 6 on the turn)

### 1.4 Flush-Completing Turns

**Definition:** A card that brings a fourth card of the same suit, completing a flush draw on a two-tone flop or monotone flop.

**Characteristics:**
- Makes all flush combos instantly strong (nut potential or middle equity hands)
- Blocks IP's betting range (IP may have been betting with Broadway hands that now lose)
- Drastically shifts equity in favor of the player holding the flush

**Strategic Implications:**
- IP betting frequency **drops dramatically** (often to 20â€“40% or less)
- When IP does bet, **small sizing is standard (25â€“50% pot)** because IP rarely has the nuts
- OOP may bet or check depending on the flush strength:
  - Strong flushes: Often bet for value or slow-play
  - Medium flushes: May check to avoid giving away hand strength
- Check-raising becomes **less frequent** because flush combos are already in the betting range (making check-raising less balanced and credible)

### 1.5 Paired Turns

**Definition:** A card that pairs any flop card. Examples: pairing the flop's first, second, or third card.

**Characteristics:**
- Drastically changes hand valuations (trips and full houses possible)
- Reduces IP's nut advantage unless IP holds the pair
- OOP's weak pairs suddenly become stronger (any pair has showdown value in a merged range)

**Strategic Implications:**
- IP betting frequency depends on board dynamics:
  - **High-card pairings (pairing K on a K-high flop):** IP may bet frequently with a merged range
  - **Low-card pairings (pairing a 4 on K84):** More polarized, with lower frequency
- When IP bets, **small to medium sizing (33â€“66% pot)** is common because both players have pairs
- OOP check-raising frequency typically **increases** because:
  - OOP may have improved to trips (from pocket pairs)
  - OOP can use many hands to value raise (any pair now has real value)
  - The board texture allows for many semi-bluff combos

**Special Case: Pairing the Bottom Card**
- OOP gains significant equity (many small pairs in OOP range suddenly stronger)
- IP's advantages may flip on some boards
- This favors aggressive OOP play with mixed strategies

### 1.6 Brick vs. Equity-Shifting Turns (Runout Sensitivity)

**Brick Turns (Static):**
- Favor IP betting large with a polarized range
- OOP typically checks most of the range unless strong
- River is likely to remain consistent in equity order (unless two river cards could swing things)

**Equity-Shifting Turns (Dynamic):**
- Favor more merged or mixed strategies
- Both players have incentive to control or build pots based on hand strength
- River may dramatically change hand strength again (e.g., another overcard, a three-flush, a pairing card)
- Typically lead to higher turn check frequencies from IP and more OOP aggression

---

## Part 2: Range Advantage Shifts on the Turn

### 2.1 IP Flop C-Bettor Perspective

**Flop Advantage vs. Turn Reality:**

On the flop, the IP player typically has a **range advantage** (better connected, wider range) and often a **nut advantage** (retains stronger top of range after a raise).

By the turn, especially after a flop c-bet gets called, the dynamic shifts:

- **BB has folded weaker hands** on the flop (low pairs, weak overcards that couldn't justify continuing)
- **BB's calling range is now stronger on average** (pairs that called, strong draws, some two-pair combos)
- **IP's medium-strength hands lose leverage** because they've already gotten some flop protection; with one card to come, the downside of betting again (facing a raise, having to fold) becomes more acute

**Result:** IP's flop range advantage doesn't fully translate to the turn. This is why IP betting frequency drops on most turns despite range advantage still existing positionally.

### 2.2 OOP (BB) Equity Rebalancing

**Card Removal on Calling Ranges:**

When BB calls a flop c-bet, they are **removing certain combos from their range** (the hands that folded). This means:

1. **BB's turn range is more weighted toward hands with connectivity** (draws, pairs, two-pair combos)
2. **BB's turn range has fewer weak holdings** (all the worst hands folded on the flop)
3. **BB's equity is higher on turns that improve draws or pairs** (straight completers, paired turns)
4. **BB's equity is lower on turns that don't help their narrowed range** (bricks favoring high cards when BB has many small pairs)

### 2.3 Nut Advantage Shifts

**Turn Card Dependency:**

The **nut advantage** (who can have the strongest hands) shifts dramatically based on turn card:

- **Overcards appearing:** IP gains nut advantage (more Ace-X, King-X combos in IP's range than OOP's narrowed range)
- **Straight completers:** OOP may gain nut advantage (more straights in OOP's flop-calling range than IP's betting range)
- **Paired turns:** Depends on whether IP's pocket pairs are in the range; typically reduces IP's advantage
- **Blank turns:** IP's relative nut advantage persists or strengthens (OOP called with mid-pairs, draws; IP retains overs and better pairs)

### 2.4 "Counterfeit" and Blocking Dynamics

**Counterfeit:** When the turn card makes a previously strong hand weaker by creating a stronger hand for the opponent.

- Example: IP holds KK on K84 flop, turn is K. IP improves to trips, but OOP's AK now has a stronger full house potential.

**Blocking Effects on Equity Distribution:**
- When IP holds AA on an A-high flop, IP blocks other Aces, meaning OOP's possible range includes fewer strong Ace holdings
- This affects OOP's willingness to check-raise bluff with hands like K-Ace combos (fewer blockers for Aces)

---

## Part 3: Turn C-Bet Strategy for IP

### 3.1 The Core Principle: Hand Class Incentives

**The fundamental shift from flop to turn:**

On the flop, IP can bet small with a wide range and realize equity slowly. On the turn, with only one card to come:

- **Strong hands (2-pair+, strong overpairs):** Gain incentive to **bet larger and more frequently** to build the pot (last opportunity for value)
- **Medium-strength hands (top pair, second pair, weak overpairs):** **Check more, bet less** (already received flop protection; risk of facing a raise is high relative to value of betting again)
- **Weak hands and draws:** **Either commit to a bluff or give up** (limited value in semi-bluffing with extra equity; facing a raise is disastrous)

### 3.2 When to Fire a Second Barrel

**Good Barrel Candidates:**

1. **Hands that improved from flop to turn** (flush draws that now have a pair, gutshots that now have OESD, overcards that now pair)
2. **Sets and stronger two-pairs** (want to build pot; almost always bet)
3. **Overcards with showdown value** (AK on a K-high flop; gained top pair)
4. **Hands blocking OOP's calling range** (e.g., holding the King on a K-high board blocks KQ, KJ; useful for bluffing because OOP is less likely to have strong holdings)

**Marginal Barrel Candidates (Mixed Strategy):**

1. **Weak top pairs** (KJ on K84; vulnerable, but checking allows slow-play)
2. **Second pair** (TT on K84; has showdown value but risks a check-raise)
3. **Flush draws with showdown value** (Aâ™¥Qâ™¥ on a Kâ™¥8â™¥4â™¦; gained another heart; mixed strategy between betting and checking)

**Bad Barrel Candidates (Mostly Check):**

1. **Hands with little showdown value and no draws** (2â™¥3â™  on Kâ™ 8â™¥4â™¦; air with no redraw)
2. **Hands that block IP's strong holdings** (full houses checking more than betting to avoid giving away the hand, since if OOP has a medium pair and sees another check, they may assume air)

### 3.3 When to Check Back

**Checking Incentives:**

1. **Medium-strength hands needing showdown value** (KJ on K84; checking allows reaching showdown without risking more money to a raise)
2. **Super strong hands blocking value targets** (QQ on K84; checks back because the value range (Kx) might fold to a c-bet, or checks to induce a check-raise from weaker hands)
3. **Hands vulnerable to overcards** (JJ on K84, any flop where one more card could cause collapse; checking can realize value immediately rather than risking a bet)
4. **When board texture unfavorable** (connected, dynamic boards where OOP's range is particularly strong; checking allows IP to control pot size)

### 3.4 Sizing Concepts on the Turn

**Small Sizing (25â€“50% pot):**

Used when:
- IP wants to preserve a wide, merged range
- The turn improved OOP's range more than IP's (dynamic turns, straight-completing turns)
- IP is betting many hands for protection (medium-strength hands pushing for fold equity without overcommitting)
- Flush-completing turns (acknowledging OOP's improved holdings)

**Medium Sizing (50â€“75% pot):**

Used when:
- IP has clear advantage but wants some balance
- The turn is favorable to IP but not dramatically so
- IP is mixing value and bluffs with a moderately polar range
- This sizing is often "linear": IP can use it with many hands from weak to strong

**Large Sizing (75%+ or overbet):**

Used when:
- IP has strong nut advantage (overcards favoring IP)
- The turn is a blank and IP's range is significantly stronger
- IP wants to build pot aggressively with strong hands while bluffing wider
- IP polarizes: only bets the very strong hands and clear bluffs; checks marginal holdings

**Conceptual Rule:**
- **Higher bet frequency â†’ smaller sizing** (need to include more marginal hands; can't risk large chips)
- **Lower bet frequency â†’ larger sizing** (more polar; sizing up gets more value from strong hands and fold equity from bluffs)

### 3.5 Hand Classes Benefiting from Barreling

**Backdoor Equity Improved:**

- **Example:** IP holds 9â™£7â™£ on a Kâ™¦8â™¦4â™  flop. Turn is the 5â™¦. IP now has BDFD to the backdoor flush draw and gained a straight card. This hand gains incentive to bet the turn because equity increased and river completion probability is higher.
- **General Pattern:** Hands that picked up additional equity cards (second flush draw card, gutshot upgraded to OESD) benefit from betting because equity realization improves

**Overcards Gaining Showdown Value:**

- **Example:** IP holds AJ on a Kâ™ 8â™¥4â™¦ flop. Turn is the 3â™  (blank). IP now can't beat a pair, but the Ace still has some value. However, if the turn is a J (paired), AJ becomes a strong hand.
- **General Pattern:** When overcards actually pair or connect with new drawing possibilities, they become genuine value bets

**Weak Pairs Turning into Bluffs:**

- **Example:** IP holds 3â™£2â™¦ on a Kâ™ 8â™¥4â™¦ flop. On the turn, if an ace appears, IP now has an overcard. Before, the hand had minimal redraw equity; now it has outs to the best pair.
- **General Pattern:** Air hands that gain outs transition from "fold" to "bluff" and become legitimate turn barrels

**Strong Top Pairs Polarizing:**

- **Example:** IP holds Kâ™¦Qâ™¦ on a Kâ™ 8â™¥4â™¦ flop. On a blank turn, KQ remains a strong hand and should barrel. On a Q (pairing the second card), KQ improves further.
- **General Pattern:** Top pairs with strong kickers almost always barrel on blank turns, adjusting sizing based on board dynamics

---

## Part 4: Turn Probe Betting (OOP)

### 4.1 Definition and Concept

**Probe Bet:** A bet made by the OOP player on the turn after the IP player (the preflop aggressor) checked back the flop.

**Signals:** When IP checks back the flop, OOP learns:
- IP didn't have enough conviction to c-bet (or IP is using a delayed strategy)
- IP's range is merged (not polarized with strong hands and clear bluffs)
- OOP's range is likely **stronger than IP's** on this particular board texture

### 4.2 Board Textures Favoring OOP Probe Betting

**High Equity Tilt Toward OOP:**

- **Connected flops where OOP retains straight combos:** 987 flop, OOP called with many 5x combos; IP checked back, signaling weakness
- **Paired flops:** OOP may have improved to trips from pocket pairs
- **Overcards appearing:** An Ace on a K-high flop; OOP may have AX combos, while IP's check back indicates missed opportunity

**Range Strength:**

- OOP's range after IP's flop check-back is narrower but **stronger on average** (weak hands from both ranges folded preflop; IP's check-back indicates marginal hands; OOP's calling range was moderate strength)
- IP's range on the turn consists of:
  - **Weak holdings** (air, marginal hands checking for showdown or pot control)
  - **Medium hands** (medium pairs, weak draws checking for equity realization)
  - **Some strong hands** (checking for balance or blocking value targets)

### 4.3 Good Probe Betting Candidates

**Value Combos:**

1. **Hands that improved to strong made hands** (gutshot that now has OESD + a pair; turned a straight draw into a pair + draw; trips from a pocket pair)
2. **Hands with thin value potential** (weak top pair + blocker; underpair with showdown value + blockers)
3. **Combination draws that are now strong** (straight draw + pair + flush draw)

**Semi-Bluff Candidates:**

1. **Gutshots + BDFD** (enough equity to be profitable as a bet even if called; bluff often enough because IP's check-back range has many air hands)
2. **Weak top pairs for thin-denial** (AT on Kâ™ 8â™¥4â™¦; gained a pair. If IP is weak (check-back), thin value bet or equity-denial bet works)
3. **Turned equity (pair + draw)** (turned a flush draw into a pair + flush draw combo)

### 4.4 Sizing on Probe Bets

**Small Sizing (25â€“50% pot):**

- Puts pressure on weak hands (underpairs, weak draws) that win less than 50% vs. the bet
- Creates a situation where IP needs to defend wider (is willing to call with marginal hands to avoid folding too much)
- Good when OOP is balanced between value and bluff

**Large Sizing (75%+ or overbet):**

- Used when OOP wants to polarize their range
- Effective when OOP has a strong range advantage (turned a strong hand)
- Forces IP into a bluff-catch situation with marginal hands
- Works especially well on very dynamic turns where OOP improved significantly and IP's range is weak

**Mixed Sizing:**

- On some boards, OOP may use 2â€“3 different sizes, treating different hand classes with different sizing based on their incentives

### 4.5 Risk Factors in Probe Betting

**Shoving Risk:** If IP had a very strong flop hand and checked back strategically (planning to check-raise the turn or trap), a probe bet runs the risk of facing a check-raise or shove, losing more chips than anticipated.

**Read-Dependent:** Probe betting requires reading the specific board texture and IP's likely hand distribution. Probing too widely without board texture judgment is a leak.

---

## Part 5: Turn Check-Raise Strategy (OOP)

### 5.1 Core Principles

**When Check-Raises Are Optimal:**

Check-raising is a powerful tool when:
1. **OOP wants to deny IP's equity** (making IP pay a large price for any equity)
2. **OOP has genuine value** (strong enough hands to justify the aggressive line)
3. **IP's betting range is wide and somewhat merged** (making check-raises credible and profitable)
4. **OOP has good blockers** (card removal effects favor check-raising as a bluff with certain hands)

**When Check-Raises Are Weak:**

- When IP's betting range is **highly polarized** (already separated value from bluff), a check-raise doesn't gain much fold equity
- When **stack-to-pot ratios are very small** (all-in happens too quickly; check-calling or folding might be better than raising)
- When **the board heavily favors IP** (small underpairs with no draws; marginal equity; too weak to justify a raise)

### 5.2 Value Check-Raise Hands

**Strong Made Hands:**

1. **Two pair and better** (trips, full houses, straights, strong draws)
2. **Top pair with strong kicker** (especially with blockers to IP's strong holdings)
3. **Strong draws with backup value** (OESD + over-pair; flush draw + top pair)

**Medium-Strength Raised for Thin Value:**

1. **Second pair with blockers** (TT on K84 with a J blocker; blocks KJ)
2. **Weak top pair with multiple blockers** (A2 on an A-high board; blocks lots of Ace combos)
3. **Drawn-out hands that improved** (JJ on a K-high flop when a Queen comes; JJ was weak, now has an OESD)

### 5.3 Semi-Bluff Check-Raise Hands

**Good Removing Blockers (Bluffs):**

1. **Straight blockers** (holding a card that blocks the nuts or near-nuts straight; makes it less likely IP has the straight)
   - Example: Holding the 6 on a 987 flop blocks both 654 and 765 nut straights
2. **Weak flush blockers** (holding a card of the flush suit; reduces IP's flush combos)
3. **Combo draws** (gutshot + BDFD + overcards; has 8â€“10 outs; profitable as a semi-bluff)

**Equity-Denial Raises:**

1. **Marginal pairs with over-card outs** (33 on K84; has showdown value + outs to a three-pair board or trips; raising denies IP's floating overcards)
2. **Hands with many outs but poor showdown value** (6â™ 5â™  on a Kâ™¦8â™¦4â™£; turned a flush draw; raising denies equity to overcards)

### 5.4 Stack Depth Impact on Check-Raises

**All-In Check-Raises (Shallow Stacks, ~20â€“30 BB):**

- Used with the strongest value hands that want all-in
- Used with pure bluffs that have enough equity or blocker value
- Hands in the middle (mediocre pairs, medium draws) often just call or fold

**Non-All-In Check-Raises (Deeper Stacks, 50+ BB):**

- Can include more medium-value hands (second pair, weak top pair with blockers)
- Allow for more balanced semi-bluffs (better draws with some outs)
- Create complex turn-river interactions (board changes again on river; more decisions ahead)

### 5.5 Check-Raise Frequency by Turn Texture

| Turn Texture | Frequency | Rationale |
|---|---|---|
| Blank turn after weak flop | 15â€“25% | IP's range is merged; check-raising doesn't gain much fold equity; many hands are too weak to justify it |
| Overcards appearing | 25â€“40% | OOP gains equity; more value combos; semi-bluffs become viable |
| Straight completing | 30â€“45% | OOP improved significantly; value range deepens |
| Paired turn | 35â€“50% | OOP may have trips; many hands gained value; highest frequency |
| Flush completing | 10â€“20% | Fewer hands want to raise (flushes already in betting range) |
| Dynamic boards overall | 25â€“45% | Varies by specific board |

---

## Part 6: Polarization and Sizing Logic on the Turn

### 6.1 Merged Range Betting

**Concept:** Betting with a wide distribution of hands across the strength spectrum (weak to strong).

**Characteristics:**
- Similar bet sizes across many hands
- High bet frequency (60â€“80% of hands bet)
- Opponent faces a wide range and must call more often
- Less clear value/bluff separation

**When Solvers Use Merged Ranges:**
- Dry, static boards heavily favoring the bettor
- Boards where the bettor has extreme range advantage
- When stack-to-pot ratios are deep (more streets to come; less urgency to polarize)

**Sizing Used:** Usually **smaller sizing (33â€“50% pot)** because:
- Need to include many marginal hands; can't risk large chips
- Smaller bets encourage wider defense
- Keeps the pot-to-stack ratio manageable for later streets

**Example:** IP on a Kâ™ 8â™¥4â™¦ blank turn after BB called flop c-bet. IP bets 50% pot with KK, KJ, KT, 99, 88, flush draws, weak overcards, gutshotsâ€”a merged range.

### 6.2 Polarized Range Betting

**Concept:** Betting only with the strongest hands and the weakest hands (clear bluffs); checking the middle of the range.

**Characteristics:**
- Larger bet sizes with the value/bluff separation
- Lower bet frequency (30â€“60% of hands bet)
- Clearer narrative for both bettor and caller
- Opponent faces a simplified choice (fold vs. call strong hands / call or fold vs. bluffs)

**When Solvers Use Polarized Ranges:**
- Dynamic boards (straight-completing, paired)
- Boards where range advantages are less pronounced
- Shallow stacks (all-in considerations make betting for value or bluffing more important than marginal hands)
- When the bettor's range was compressed by opponent action (flop check-raise forcing a polar range)

**Sizing Used:** Usually **larger sizing (75%+ pot or overbet)** because:
- Bets are less frequent; stronger hands want to build pot
- Overcalls from weaker hands are less likely; want to punish
- Bluffs need fold equity; larger sizing helps fold equity

**Example:** IP on 9â™ 8â™ 6â™¥ flop with a 5â™¦ turn (straight-completing). IP bets only sets, strong straights, strong draws, and bluffs with blockersâ€”a polar range with larger sizing (75% pot).

### 6.3 Conceptual Sizing Framework

**33% Sizing (Range-Bet Sizing):**

- Bet with a **wide, condensed range** including many marginal hands
- High frequency (70%+)
- Opponents must defend often
- Creates a "small-bet, get-called" dynamic where IP hopes to get to showdown often

**50% Sizing (Linear Sizing):**

- Middle ground between merged and polarized
- Can work with both wide and narrow ranges
- Moderate frequency (50â€“70%)
- Balances between value extraction and bluff frequency
- Often used when solvers recognize the optimal strategy is "in-between"

**75%+ or Overbet (Polarized Sizing):**

- Bet with a **narrow, polar range** (strong and bluff only)
- Lower frequency (30â€“60%)
- Forces opponent into tough decisions
- Overcommits chips only with justified hands
- Often uses geometric growth (each street's bet is 75% of the pot created)

### 6.4 Range Dynamics and Sizing Selection

**After a Flop Check-Through:**

- IP's range that appears at the turn is **condensed** (weak flops don't generate betting actions; IP checks back)
- This allows for **smaller sizing with a wide range** (many hands IP checked back with now warrant betting on the turn with improved equity or for thin value)

**After a Flop C-Bet and Call:**

- IP's range that appears at the turn is **potentially wide or polar** depending on the flop bet size and texture
- OOP's range is **narrowed but stronger** (bad hands folded; good hands called)
- IP may **polarize** with larger sizing to simplify decisions

**After a Flop Check-Raise:**

- IP's range is **very compressed** (strong hands and bluffs that check-raised)
- IP's turn strategy may be:
  - **Bet larger with value/bluffs** (already polarized; increase sizing)
  - **Check to get to showdown or induce a river bluff** (avoid another street of risk)

---

## Part 7: Equity Realization Principles

### 7.1 IP Equity Realization

**Position Advantage:**

IP can realize **more of their raw equity** because:
- Acting last on every street gives information advantage
- Can check behind on bad cards
- Can size appropriately based on opponent's action
- Can value bet thinly or induce bluffs

**Typical Realization Patterns:**
- **Strong hands** (sets, two-pair) realize most of their equity by betting and getting called or inducing a river bluff
- **Medium hands** (top pair, weak overpairs) often realize **50â€“70%** of their raw equity (some fold to check-raises; some reach showdown)
- **Weak hands** (gutshots, weak draws) realize **30â€“50%** of equity (rely on fold equity; if called, must hit runner-runner or fold on river)

### 7.2 OOP Equity Realization

**Position Disadvantage:**

OOP can realize **less of their raw equity** because:
- Must act first on every street
- Can't see opponent's action before deciding
- Often forces incorrect sized bets to deny equity
- May face tough all-in decisions

**Typical Realization Patterns:**
- **Strong hands** (sets, two-pair) realize **high equity** by betting or check-raising (forcing action) or calling to showdown
- **Medium hands** (top pair, mid-draws) realize **40â€“65%** of equity (must guess opponent's action; some hands miss river)
- **Weak hands** (weak draws, air with no redraw) realize **20â€“40%** of equity (rely on bluff fold equity; unlikely to improve)

### 7.3 Hands That Improve from Turn to River

**Equity-Gaining Hands (Incentive to Bet Turn for Value):**

1. **Drawing hands that connected but didn't complete** (flush draw + pair; gutshot + pair; now have two ways to win)
2. **Overcards that improved** (King on a 9-high flop becomes a strong hand)
3. **Hands with multiple outs** (six-outer draws; can bet turn knowing many river cards help)

**Equity-Losing Hands (Incentive to Check Turn for Showdown):**

1. **Hands about to be counterfeited** (medium pairs on an A-high flop; many river cards hurt)
2. **One-dimensional hands** (AK on a K-high board; has one pair; vulnerable to a river overcard)
3. **Hands with bad runouts** (weak top pair; needs a blank river; betting gives opponent fold equity he doesn't deserve)

### 7.4 SPR and Equity Realization

**High SPR (100bb+ effective):**
- Both players can realize equity more gradually
- Draws realize more equity (more money to stack off on river)
- Marginal hands realize less (more streets to lose)

**Low SPR (10â€“30bb):**
- Short-term equity matters more (all-in likely soon)
- Strong hands realize more immediately
- Draws realize less (less money to bet turn-river to make up for negative equity)

---

## Part 8: Turn Barrels That Set Up River Bluffs

### 8.1 Blockers and Removal Effects

**Straight Blockers:**

- Holding a card that blocks the straight **significantly increases** the profitability of a turn barrel as a bluff
- Example: On a 987 board, holding the 6 blocks 654 and 765 straights (the two nut straights). If you air-bet with many combos of 6x, your opponent is less likely to have a straight and more likely to fold

**High-Card Blockers (Aces, Kings):**

- Blocking high cards reduces opponent's likely holding of strong hands
- Betting as a bluff becomes more profitable (opponent has fewer strong holdings blocked)

**Suit Blockers:**

- On flush-draw-heavy boards, holding a card of the flush suit reduces the number of strong flushes opponent can have
- Useful for bluffing on non-flush-completing turns (opponent's flush didn't complete; fewer flushes possible)

### 8.2 Range-Gap Exploitation

**Concept:** After a flop check-back, IP's range is weak on average. The turn allows OOP to exploit this by betting hands that don't have pure showdown value but beat many of IP's checking hands.

**Example:** IP checked back the flop on Kâ™ 8â™¥4â™¦. OOP bets the turn with Jâ™£Tâ™£ (gutshot + overcard + blockers). This hand doesn't have showdown value, but it beats most of IP's checking range (weak pairs, weaker Aces, missed draws).

### 8.3 Planning Triple Barrels

**Geometric Pot Growth:**

A triple barrel plan uses consistent **proportional sizing** to build the pot geometrically:
- Flop bet: 33% pot (pot becomes 1.33x)
- Turn bet: 75% new pot (remaining stack accommodates river shove)
- River: All-in (geometric growth ensures stacks are properly leveraged)

**Blocker-Heavy Hands Best for Triple Barrels:**

- Hands that block opponent's strong holdings benefit most from triple barrel
- Each street's bet is more credible when blockers are present
- Example: AcQâ™£ on a Kâ™ Jâ™¥9â™¦ flop (blocks KQ top two pair; blocks AJ, AK as calls); triple barrel this hand confidently

**Turn Card Dependency:**

- Turn card that improves IP's narrative (overcard appearing) makes a triple barrel more credible
- Turn that doesn't help (blank, pairs a flop card) requires stronger bluff hands for triple barrel

**When Triple Barrels Fail:**

- Against opponents with strong check-raising tendencies (will check-raise turn and force a decision)
- On boards where OOP's range is stronger than expected (more calling hands than estimated)
- With hands that have no equity if called (true air with no redraw) and opponent is aggressive

---

## Part 9: Overbets on the Turn

### 9.1 When Solvers Prefer Overbets

**Scenario 1: IP Has Nut Advantage**

- IP holds more of the strongest hands than OOP
- Examples:
  - IP holds many sets and two-pairs; OOP has medium pairs and weak draws
  - IP hit an overcard; OOP called flop with marginal holdings
- **Action:** IP overbets (100%+ pot) to maximize value extraction and force folding of medium-strength hands

**Scenario 2: OOP's Range Is Capped**

- OOP likely doesn't have very strong hands (if they did, they would have check-raised the flop)
- IP can exploit this by overbetting with medium-strength hands (not just nuts)
- Example: IP on Kâ™ 8â™¥4â™¦ after OOP called small flop c-bet. If OOP would have check-raised all their sets and two-pairs on the flop, turn overbets work well because OOP's calling range is weak

**Scenario 3: Scare Card / Brick Turn**

- Turn card is a brick and doesn't interact with either range significantly
- IP can safely overbet because the board dynamics haven't changed; IP's flop advantage is preserved
- Example: Qâ™¦ on a Kâ™ 8â™¥4â™¦ flop (overcard). Even though Q helps OOP somewhat, IP's range advantage is strong enough that an overbet works with both value and bluffs

### 9.2 When Overbets Lose Value

**Static Board Textures Favoring OOP:**

- Overbets become less effective when OOP improves significantly (straight completion, paired turn)
- IP's bet frequency drops even if overbetting remains option (prefer smaller bets or checks)

**When IP Has No Nut Advantage:**

- Overbets require polarization; if IP doesn't have clear best hands, overbetting commits too much with mediocre hands
- Better to use smaller sizing and check more

**After IP Check-Back from Flop:**

- If IP checked back the flop, overbetting the turn is less credible (why check weak, then suddenly overbet strong?)
- Better to use merged or smaller bet sizing

### 9.3 Overbetting Frequencies and Amounts

**Typical Overbet Ranges:**
- 100% pot: Two times the pot as bet; aggressive but not extreme
- 125â€“150% pot: 1.25â€“1.5x the pot; moderate overbet
- 200%+ pot: Very large overbets; reserved for extremely polarized situations with nut hands and air

**Frequency Guidelines:**
- Overbets should occur **infrequently** (10â€“30% of betting range) to avoid becoming exploitable
- Concentrated on specific hand classes (strongest value, clear bluffs with blockers)
- Depend on board texture and stack depth

---

## Part 10: Delayed C-Bet (IP) on the Turn

### 10.1 Definition

**Delayed C-Bet:** IP checks back the flop, then bets on the turn (after OOP also checks).

**Signal:** IP's delayed c-bet indicates:
- IP is more confident in their hand on the turn than the flop
- Or IP is exploiting OOP's weakness shown by flop check
- Or IP is balancing their range (needs some hands in delayed c-betting position for balance)

### 10.2 Ideal Turn Cards for Delayed C-Bets

**Overcards:**

- **Scenario:** IP held AK on a Kâ™ 8â™¥4â™¦ flop, checked. Turn is an Ace. AK improves to top pair.
- **Advantage:** The overcard makes IP's hand stronger relative to OOP's range (OOP's range is unchanged; IP just improved)
- **Strategy:** Bet with high frequency and sizing that matches strength (medium to large)

**Completed Backdoor Draws:**

- **Scenario:** IP held Aâ™¦Qâ™¦ on a Kâ™ 8â™¥4â™£ flop (BDFD), checked. Turn is a 5â™¦. IP now has a flush draw.
- **Advantage:** Equity increased; semi-bluff value gained
- **Strategy:** Bet for value/semi-bluff with moderate sizing

**Board-Pairing Turns:**

- **Scenario:** IP held JJ on a Kâ™ 8â™¥4â™¦ flop, checked. Turn is a J, improving to trips.
- **Advantage:** Massive improvement; now a strong hand
- **Strategy:** Bet large; this is a value hand with nut-like strength

### 10.3 Hand Classes in Delayed C-Betting Range

**Genuine Value Hands:**

1. **Hands that improved** (overcards that paired, draws that became two-pair, weak hands that turned strong)
2. **Hands that block strong holdings** (King-high on a K-high flop; when paired, blocks opponent's Kings)

**Semi-Bluff Hands:**

1. **Hands that gained equity** (any hand that picked up outs or additional draws)
2. **Hands with blockers** (reduce opponent's likely holdings; better bluff candidates)

**Bluff Hands:**

1. **Air hands that became stronger** (gained overcards to the flop, picked up a draw, or have good blockers)
2. **Hands with many outs** (even if not called, have redraw value; profitable semi-bluff)

### 10.4 Why Delayed C-Betting Works

**Strengthened Checking Range:**

- By checking the flop with some strong hands, IP's overall checking range is stronger
- This means OOP is more hesitant to attack check-back situations
- IP's subsequent betting range (delayed c-bets) becomes credible

**Opponent Assumption:**

- OOP assumes IP's flop check-back was on weak or marginal hands
- When IP bets the turn, OOP may assume only mid-strength (not strong)
- This allows IP to bet with stronger hands at lower cost

**Exploitation of Weakness:**

- If OOP shows weakness twice (flop check, turn check), IP can bet with hands that don't have strong showdown value
- Example: Middle pair that can't survive a check-down but can get folds on the turn

---

## Part 11: Turn-to-River Transition Concepts

### 11.1 Which Turn Actions Simplify River Trees

**Betting Actions (Large Bets or Overbets):**

- Polarizes the range immediately
- Simplifies river because many hands have already folded or committed
- Example: IP overbets turn with strong hands and air; river is now much simpler (most medium hands folded)

**Checking Actions:**

- River strategy after a turn check depends heavily on:
  - Who checks (IP, OOP, or both)
  - What river card comes
  - Stack depth
- Checking doesn't simplify the tree; it postpones decisions

### 11.2 Which Turn Actions Demand Aggression on Many Rivers

**Checking Turn When Ahead:**

- IP checked turn with medium-strong hands
- River card might be scary (overcard, pair, straight completer)
- IP may be forced to bet many rivers despite medium strength
- Result: More aggressive river strategy required

**Probe Betting from OOP:**

- OOP's probe bet is credible but not polarized
- Many rivers will allow further aggression (if OOP misses, can fire river; if card helps, value bet)
- River becomes more active and requires aggressive planning

### 11.3 Value-Heavy vs. Bluff-Heavy Rivers

**Value-Heavy Rivers (Most Likely):**

- Occur after IP polarized and has strong value hands in range
- Example: After IP's turn overbet, only strong hands remain in IP's range; river bets are often value
- River play is straightforward (bet strong hands, check weak)

**Bluff-Heavy Rivers:**

- Occur when the river card favors the defending player
- Example: IP bet the turn but river brings a dangerous card (overcard, straight, pair)
- Now IP must bluff to maintain fold equity despite weakened range

**Mixed Rivers:**

- Most common outcome
- Both players have value, bluffs, and call-downs
- Require nuanced strategy based on river card and equity distribution

---

## Part 12: Summary of Core Turn Solver Principles

### Essential Rules of Turn Strategy

1. **Hand Values Are Static, Incentives Are Clear**

   The turn defines what each hand class wants to do. Strong hands want pots larger; medium hands want showdown; weak hands commit to bluffing or folding. Players must pursue these incentives explicitly.

2. **Medium-Strength Hands Check Most**

   The most common mistake is betting medium-strength hands that are better off checking for pot control. Solver outputs show that top pairs, second pairs, and weak overpairs check frequently (40â€“70%) rather than bet.

3. **Blank Turns Favor Polarized Betting**

   When nothing changes on the turn, the bettor uses large sizes and low frequency. The defender must call or fold; few marginal hands in between.

4. **Scare Cards Shift Nut Advantage**

   An overcard appearing on the turn can shift the nut advantage from IP to OOP (or vice versa). Adjust betting frequency and sizing based on who the overcard helped.

5. **Straight Completers Favor OOP**

   On connected flops, the turn straight completer improves OOP's range more than IP's range. IP's betting frequency drops and sizing shrinks.

6. **Flush Completers Drastically Cut IP Activity**

   The fourth card of a suit removes much of IP's betting range (what was a promising hand becomes lost equity). IP c-betting drops to 20â€“40% with small sizing.

7. **Paired Turns Elevate OOP Check-Raising**

   Both players' pairs improve; OOP's range balances value (trips from pocket pairs, any pair) and semi-bluffs. Check-raising frequency rises (35â€“50%).

8. **Card Removal Drives Hand Selection**

   Bluffs should block opponent's strong holdings; value hands should unblock. A hand with the 6 is a better bluff on a 987 board (blocks straights) than a hand without the 6.

9. **Smaller Bet Sizing Requires Wider, More Merged Ranges**

   Small bets (25â€“33% pot) allow betting many hands. Large bets (75%+) require a polarized range. Match sizing to range composition.

10. **Overbets Work When Range Advantage Is Clear**

    Overbets are optimal when the bettor has significant nut advantage (IP has sets and two-pair; OOP has marginal holdings) or when the turn is a brick preserving the flop advantage.

11. **Delayed C-Betting Requires Turn Improvement**

    IP's delayed c-bet must come with a hand that improved (overcard pairing, draw completing, or genuine value). Betting air on the turn from a flop check-back is easily exploitable.

12. **SPR Determines Strategy Spectrum**

    At 20bb, focus on strong hands and bluffs; at 100bb, merge more hands and use smaller sizing. Stack depth fundamentally alters optimal turn play.

---

## Conclusion

Turn strategy in GTO-optimal play is distinguished by clarity of incentive and precision of execution. The combination of a larger pot, fewer remaining decisions, and more clearly defined hand strength forces players to commit to explicit strategies rather than the flop's merged, small-bet worlds.

**Key Takeaways for Implementation:**

- Identify the **turn card classification** immediately (blank, overcard, straight completer, flush completer, pair)
- Determine **who holds the nut advantage** and whose range improved
- Apply **sizing and frequency heuristics** based on range advantage and hand class incentives
- Select **appropriate hand classes** for betting, checking, bluffing, and check-raising
- Adjust **all strategies** for actual stack depth and board dynamics
- Remember that **medium-strength hands are the hardest to play**; solver outputs show they check much more than amateur intuition suggests

The turn is where amateur players' tendencies diverge most dramatically from GTO play. Close study of these principles and their application to specific boards will yield significant game theory edge.