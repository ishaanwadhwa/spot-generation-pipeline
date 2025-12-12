# GTO Flop Strategy for 6-Max NLHE Cash Games: Comprehensive Theoretical Reference

## Overview

This document synthesizes solver-based flop strategy principles from established GTO sources. It is organized by flop texture type and explores range advantages, bet sizing heuristics, check-raising logic, and strategic principles that underpin modern solver play. This guide emphasizes theoretical understanding rather than frequency outputs, enabling adaptation to varied game conditions and stack depths.

---

## Part 1: Range Advantage & Positional Dynamics

### Foundational Concepts

**Range Advantage vs. Nut Advantage**

These are distinct strategic factors that must be kept separate:

- **Range Advantage** (also called positional advantage): The in-position player typically has a wider range that connects with more flop textures. This correlates directly with **bet frequency**. The IP player can profitably bet more hands because their overall range is stronger in distribution.

- **Nut Advantage** (also called the strength of the top of the range): The out-of-position player, particularly when they are the preflop aggressor, often retains the strongest hands at the top of their range (sets, two-pair combos). This correlates with **bet sizing**. When you hold the nuts advantage, you can size up; when you lack it, you typically size down.

### IP vs. OOP in Single-Raised Pots (Button vs. BB)

**Button's Strengths:**
- Connects with high-card boards more frequently (opens with more high cards like AK, KK, AQ, and suited high cards)
- Maintains range advantage on most flops due to range width
- Can realize equity efficiently in position

**BB's Strengths:**
- Holds a capped, narrower range after just calling the button raise
- Often lacks high cards in their range (has many more low suited cards and small pocket pairs)
- Can exploit this mismatch with strategic check-raising on favorable textures

**Key Insight:** Even though the BB is capped, the button's positioning and range advantage typically translates into more frequent continuation betting, provided the button utilizes correct sizing on different textures.

---

## Part 2: Dry High Boards (Axx, Kxx, Qxx with No Draws)

### Board Category Definition

Dry high boards are unpaired flops with a high card (Ace, King, or Queen) and no straight or flush draw possibilities. Examples: A92r, K73r, Q64r, A53r.

### Range Advantage & Strategic Principle

**Button (IP) has strong range advantage** but **lacks nut advantage**. The BB has AXs and AXo in their range but also many low cards that miss completely.

### Why Button Bets Less on Ace-High Boards

Counterintuitively, **Ace-high boards see the LOWEST continuation bet frequency** among high card boards (approximately 40â€“50%), even though the button connects well. This occurs for two reasons:

1. **Decreased Value Protection:** On a K73 board, marginal hands like K8 have incentive to bet to protect against overcards. On an Ace-high board, there are no overcards, so AX hands have minimal urgency to bet. Even modest AX holdings can comfortably check down for showdown.

2. **Polarized BB Response:** The BB's range on A-high boards is highly polarizedâ€”they either hit an Ace, an underpair, or completely miss. This polarity causes the BB to check-raise more frequently with hands like trips, two-pair, and some equity-denial plays. Strong hands like KKâ€“JJ often check back because they have little vulnerability and don't benefit from building the pot.

### Recommended Bet Sizing for Ace-High Boards

- **Small bet (25â€“33% pot)** when the button does bet
- **High check frequency (50â€“70%)**
- Button often checks back hands like KK, QQ, and marginal AX for showdown value

### OOP (BB) Check-Raise Strategy on Ace-High Boards

**Low check-raise frequency** relative to lower flops (approximately 20â€“30% frequency):

- **Value raise range:** 2-pair+, trips with multiple kickers, AQ+ combos
- **Semi-bluff/equity-denial raises:** Some draws (flush draws, gutshots), rare overcard combos with runner-runner backdoors
- **Call majority:** The BB calls most of their remaining hands and tries to get to showdown

**Why lower c-raise frequency?** The button's betting range is so wide and merged that simple calling is often more profitable than raising. Raising requires a polarized hand; marginal pairs do better calling down.

---

## Part 3: Medium to High Card Boards (Kxx, Qxx)

### Board Category Definition

Non-Ace high boards with King, Queen, or Jack as the top card, unpaired, with no draws. Examples: K84r, Q95r, J73r, J86r.

### Range Advantage

**Button maintains range advantage**, and on these boards, the button also often holds the nut advantage (top pairs beat more of the BB's range).

### Recommended Bet Sizing and Frequency

- **Bet frequency: 65â€“75%**
- **Preferred sizing: 33% pot or larger (50â€“66% pot)**
- Button can bet more combos profitably and with less fear of check-raises
- The BB's range contains more vulnerable hands (low pairs, weak overcards)

### Strategic Principle

The button should **value bet thin on these boards** because the BB has many hands that are marginally worse (like K8, Q9, weak overcards). Increasing the c-bet size also denies equity from the BB's overcard hands that have limited equity.

### OOP (BB) Check-Raise Strategy on K/Q-High Boards

**Higher check-raise frequency** than Ace-high boards (approximately 25â€“40%):

- **Value raises:** Top pairs with strong kickers, underpairs (for semi-bluff value), some two-pair combos
- **Bluff raises:** Open-ended straight draws (when available), flush draws (when available), overcard combos with strong kicker-related blockers
- **Equity-denial raises:** Marginal pairs mixed in to balance value

---

## Part 4: Low Disconnected Boards (542, 732, 752, etc.)

### Board Category Definition

Flops with the highest card of 9 or lower and minimal connectivityâ€”no straight draws possible. Examples: 952r, 542r, 732r, 863r.

### Range Advantage & Special Dynamics

**Button has dominant range advantage** on these boards. The BB's range is heavily weighted toward small pocket pairs, low cards, and undercards. The button frequently has overpairs (TT+, JJ+), which are strong against the BB's range.

### Recommended Bet Sizing and Frequency

- **High bet frequency: 70â€“85%** (button bets most of the range)
- **Preferred sizing: 50â€“66% pot or larger (can reach toward overbet)**
- The reason: Button's overpairs want to build the pot. Small bets don't extract enough value from the BB's weak holdings (underpairs, high cards with no pair). Larger sizing denies equity from overcards more effectively.
- **Occasional checks:** Checking occurs with hands that have showdown value and aren't vulnerable (low pairs, weak Aces when the button suspects an overpair is already in).

### OOP (BB) Check-Raise Strategy on Low Disconnected Boards

**Low check-raise frequency** (approximately 15â€“30%):

- **Value raises:** Pocket pairs (any pair, even deuces, has value in a merged range), top pairs (when they connect), two-pair combos
- **Bluff raises:** Few available. These boards lack draws, so the BB has few semi-bluffs. When raising with a bluff, it's usually with hands that have overcards to the board or backdoor straight/flush potential.
- **Dominant call frequency:** The BB often calls with underpairs, hoping to improve on the turn or to apply pressure if they hit.

---

## Part 5: Medium Connected Boards (T98, 987, 876, etc.)

### Board Category Definition

Flops where two or three cards can form straights or near-straights. OESD-possible boards (e.g., T98, 986, K97, Q95) present straight-draw possibilities.

### Range Advantage & Dynamics

On these boards, **range advantage is less pronounced**. Both players have many draws, straight combos, and two-pair possibilities in their ranges. The flop is more dynamic because hand equities change significantly on the turn.

### Connected vs. Zero-Gap vs. Two-Gap Boards

**Zero-Gap Boards (e.g., T98, 987, 876):**
- The most impactful for hand equities (a straight can be made with two adjacent cards)
- Highest equity volatility on future streets
- Often favor the BB's range because they have more low-card combos that make straights

**Two-Gap Boards (e.g., J97, J84, Q94):**
- Less dramatic equity disruption
- Still allow straights but fewer combinations
- Button's range advantage more pronounced than on zero-gap boards

### Recommended Bet Sizing and Frequency on Medium Connected Boards

**OESD-Possible Boards:**
- **Bet frequency:** 50â€“65% (reduced due to dynamic nature)
- **Preferred sizing:** 50â€“66% pot or moderate overbet (IP wants to build pot and deny equity from draws)
- **Rationale:** IP is betting into a range with many draws. Sizing up gives draws unfavorable pot odds but also polarizes the IP's range. Draws are profitable against small bets, so a larger size is justified when IP wants to build for value.

**Connected Boards with Flopped Straights:**
- **Bet frequency:** 40â€“55% (lower because the BB can have many made straights)
- **Preferred sizing:** 25â€“33% pot (small bets to acknowledge the BB's strong holdings and avoid getting check-raised excessively)
- **Rationale:** When straight combos are in both ranges, sizing down is more prudent. The BB's range is polarized in their favor (many straights and over-pairs), so small bets deny less equity overall.

### OOP (BB) Check-Raise Strategy on Connected Boards

**Elevated check-raise frequency** (approximately 30â€“45%):

- **Value raises:** Flopped straights, two-pairs, strong draws (OESD + overcards), top pairs with extra blockers
- **Semi-bluff raises:** Open-ended straight draws, flush draws (if present)
- **Equity-denial raises:** Marginal pairs with over-card potential, gutshots with two overcards
- **Why higher?** The BB's range is stronger relative to the button's range on these textures, and many hands have legitimate semi-bluff value.

---

## Part 6: Paired Flops (AA2, KK3, QQ7, etc.)

### Board Category Definition

Any flop where two or more cards have the same rank. Examples: KK3, 772, 554r, JJ5.

### Range Advantage & Strategic Principle

Paired flops significantly change hand valuations:

- Both players have trips and full houses possible in their ranges (especially pocket pairs matching the pair)
- Unpaired hands have much lower relative value
- **Nut advantage shifts:** On a KK3 flop, the player with KX suddenly has a much stronger advantage. On a 223 flop, both players' equity becomes murky.

### Recommended Bet Sizing and Frequency

**General Pattern: Bet frequently but with SMALL SIZING (25â€“33% pot)**

- **Bet frequency:** 65â€“80% (button bets a wide, merged range)
- **Small sizing:** Because the button's nut advantage is reduced (trips are in both ranges), small bets don't risk large chips while still gathering information and maintaining the betting lead
- **Stack-depth dependent:** On low, disconnected paired boards (22X, 33X), the button's advantage is greater, and the button may use slightly larger sizes (33â€“50%)

### Why Small Sizes on Paired Boards?

Paired flops create an unusual dynamic: both players' ranges contain weak pairs, strong pairs (matching the pair), and few draws. Small bets pressure weak pairs and overcards without committing much when the button is behind. This allows the button to maintain aggression while managing risk.

### OOP (BB) Check-Raise Strategy on Paired Boards

**ELEVATED check-raise frequency** (approximately 35â€“50%, often the highest of any flop type):

- **Value raises:** Trips (especially overpairs that match the pair), full houses, two-pairs
- **Semi-bluffs:** Gutshots, weak draws that have connectivity to improve
- **Bluff raises:** The BB uses many bluffs on paired flops because the button's betting range is merged and wide. The button must call with many weak holdings to defend against the higher check-raise frequency.

**Why such frequent check-raising?** The BB's range includes any pocket pair (for value), and the button's merged range forces the button to call down often. This creates profitable check-raise opportunities with both strong hands and bluffs.

---

## Part 7: Monotone Boards (KHH, 9HHH, 5HHH, etc.)

### Board Category Definition

All three flop cards are the same suit (e.g., Kâ™¥9â™¥5â™¥, Aâ™ 7â™ 3â™ ). Monotone boards drastically shift equity distributions because all flush draws and made flushes are in play.

### Range Advantage & Nut Advantage

**Button's nut advantage is severely diminished.** The BB's flush draws and made flushes jump ahead of the button's strong hands. For example, QQ loses to any flush on a Kâ™¥9â™¥5â™¥ board.

### Why Button Bets LESS Frequently on Monotone Boards

**Dramatic decrease in betting frequency and sizing:**

1. **Flush Blocks:** When the button holds a flush, it blocks many of the BB's calling hands. For example, if the button has Aâ™¥Tâ™¥ on Kâ™¥9â™¥5â™¥, the button blocks QTâ™¥, JTâ™¥, and similar holdings from the BB. This reduces the button's value betting opportunities because the BB can defend fewer hands without a heart.

2. **Low Flushes Are Vulnerable:** Even strong holdings like low flushes (9â™¥6â™¥4â™¥) are vulnerable to a fourth heart on the turn or river. The button may prefer to check back low flushes on the flop and bet the turn on a clean runout (no heart) to reduce variance and protect value.

3. **Limited Fold Equity:** Flush draws are so profitable that they don't fold to small bets. Sizing up doesn't improve fold equity much; it only isolates the button against the BB's strongest hands.

### Recommended Bet Sizing and Frequency for Monotone Boards

- **Low betting frequency:** 25â€“40% (button checks back many hands, including some flush draws)
- **Small sizing when betting (25â€“33% pot):** When the button does bet, a small size is used to acknowledge the risk
- **Occasional overbet:** The button may overbet with the strongest holdings (nut flushes, sets) on some monotone boards to gain extra value, but this is situation-dependent

### Hand-Specific Strategy on Monotone Boards

**Strong Flush Draws (Aâ™¥Kâ™¥, Aâ™¥Qâ™¥):**
- Mixed strategy: sometimes bet, sometimes check
- If betting, use small sizing
- Betting with high-card flushes doesn't block as many hands and maintains strength even on a 4th heart

**Middling Flush Draws (Jâ™¥7â™¥, Tâ™¥8â™¥):**
- Check back majority of the time
- These hands make a flush but aren't strong enough to value bet on later streets

**Low Flush Draws (6â™¥2â™¥):**
- Can bet as a bluff
- These hands lack showdown value and want to win the pot immediately

**Pairs Without Flush Draw (KD KS on monotone board):**
- Merged strategy: some betting, mostly checking
- A pair without a flush draw has no upside equity realization, making it vulnerable

### OOP (BB) Check-Raise Strategy on Monotone Boards

**Low check-raise frequency** (approximately 15â€“30%), surprisingly lower than many other board types:

- **Why?** The primary value hand is a flush, which blocks the BB's own calling range (especially high and low flushes)
- **Value raises:** Flushes (nut, middle, low), strong draws (straight + flush draw combinations)
- **Bluff raises:** Rare; limited semi-bluffs available because draws are already semi-bluffing via direct betting
- **Dominant strategy:** Many hands in the BB's range check-call, hoping to improve to a flush or better on the turn/river

---

## Part 8: Two-Tone Boards (Kâ™¥9â™¦5â™¥, Qâ™ Jâ™¦8â™ , etc.)

### Board Category Definition

Two cards are the same suit; one card is a different suit. Examples: Kâ™¥9â™¦5â™¥, Qâ™ Jâ™¦8â™ , Tâ™ 3â™¥Tâ™¦.

### Range Advantage & Complexity

Two-tone boards present a **middle ground** between dry and monotone. Flush draws are present, but full flush-draw ranges are not blocked as heavily. Straight draws may be present.

### Recommended Bet Sizing: Context-Dependent

**The key insight:** Bet sizing depends on what the button's betting range is built around, not just on the presence of flush draws.

**On Low Two-Tone Boards (e.g., 8â™¥6â™¦4â™¥):**
- Button's betting range is built around **overpairs**
- Overpairs lose equity when facing flush draws
- **Recommendation: Small bet (25â€“33% pot) or high frequency**
- Rationale: The button prefers to bet small and get called by weak hands (low pairs, over-cards with BDFD) rather than size up and play against draws with good equity

**On High Two-Tone Boards (e.g., Kâ™¥Tâ™¦5â™¥):**
- Button's betting range is built around **marginal pairs, underpairs, and marginal top pair**
- These hands prefer sizing up on rainbow boards but welcome small sizing on two-tone boards
- **Recommendation: Larger bet (50â€“66% pot) or mixed sizing**
- Rationale: High boards don't generate strong range advantage for the button on two-tone layouts, so betting primarily occurs with the strongest combos (TP+). A larger size targets weaker holdings and is more polarized.

**General Pattern:** Avoid broad heuristics like "bet small on two-tone boards." The texture and specific range construction matter more.

### OOP (BB) Check-Raise Strategy on Two-Tone Boards

**Moderate check-raise frequency** (approximately 25â€“40%), similar to some medium-texture boards:

- **Value raises:** Top pairs, two-pairs, flush draws with strong kickers
- **Semi-bluffs:** Open-ended straight draws, flush draws, combination draws
- **Bluff raises:** Rare; the presence of draws reduces the need for pure bluffs

---

## Part 9: Rainbow Boards (Kâ™£9â™¦5â™¥, Qâ™ Jâ™£8â™¥, etc.)

### Board Category Definition

All three cards are different suits, with no flush draw possible. Examples: Kâ™£9â™¦5â™¥, Qâ™ Jâ™£8â™¥, Tâ™£5â™¦3â™¥.

### Range Advantage & Strategic Advantage

**Button has maximum range and nut advantage** (no flush draws reduce the BB's equity), especially when the board is also dry and unpaired.

### Recommended Bet Sizing and Frequency

- **Highest betting frequency:** 70â€“90% (button bets nearly the entire range)
- **Preferred sizing:** 33â€“66% pot, depending on connectivity and high-card status
- **High-card rainbow, unpaired (e.g., Kâ™£9â™¦5â™¥):** Bet 75â€“85% of hands with 33â€“50% pot sizing
- **Low-card rainbow, disconnected (e.g., 8â™£5â™¦2â™¥):** Bet 75â€“90% with 50â€“66% pot sizing or larger

**Rationale:** Without draws, the button's range advantage is maximized. The BB has few defensive options and must fold many hands or call with marginal holdings.

### OOP (BB) Check-Raise Strategy on Rainbow Boards

**Moderate to elevated check-raise frequency** (approximately 25â€“45%), building on the foundation of strong holdings:

- **Value raises:** Top pairs, two-pairs, overpairs (if any), strong hands with kicker advantage
- **Semi-bluffs:** Gutshot straights, back-door flush draws, two-overcard combos with additional blockers
- **Bluff raises:** Used more frequently on rainbow boards because the absence of draws reduces the button's semi-bluff equity, making pure bluffs more credible

---

## Part 10: Static vs. Dynamic Boards

### Definitions

**Static Board:** A board where hand equities are unlikely to change significantly when the next card (turn) arrives. High-card, unpaired, disconnected boards are the most static.

**Dynamic Board:** A board where hand equities are likely to shift substantially on the next card. Low-card boards, boards with many draws, and connected boards are the most dynamic.

### Examples

**Static:**
- Kâ™£7â™¦2â™¥ (highest card K, no draws, unpaired)
- Qâ™ 9â™£4â™¥ (high card Q, no draws, unpaired)
- Aâ™ 2â™¦3â™¥ (Ace, but three disconnected cards)

**Dynamic:**
- 9â™ 8â™¥7â™¦ (straight draw, many improving cards)
- 6â™¥5â™¦4â™¦ (two-tone, many improving cards, low connectivity)
- Tâ™¦7â™ 5â™£ (nut draw possible, many improving cards)

### Strategic Implications

**On Static Boards:**
- **Betting and calling are favored** over raising and folding
- **Small and medium sizing** is common (33â€“66% pot)
- **Checking occurs with hands that have showdown value** but limited vulnerability
- **Slower ranges:** Both players tend to get to later streets with wide distributions

**On Dynamic Boards:**
- **More checking, raising, and folding** are appropriate
- **Sizing varies:** Small bets on some dynamic boards, larger on others
- **Polarized ranges:** Both players benefit from clearer value/bluff separations
- **Fold equity becomes important** because many hands will improve or miss on the turn, making flop ranges more vulnerable

### Practical Application

Understanding static vs. dynamic helps determine **bet sizing and frequency without memorizing specific flops**:

- On static K7r boards, the button bets frequently with a wide, merged range and small sizing
- On dynamic connected boards like 986, the button bets a more polarized range with mixed sizing
- The BB raises more on dynamic boards and less on static boards

---

## Part 11: Recommended C-Bet Sizes by Category

### Small Bet: 25â€“33% Pot

**When to use:**
- Ace-high unpaired, disconnected boards
- Paired boards (especially low pairs)
- Monotone boards
- When the button's betting range is very wide and merged
- When betting a high frequency of hands

**Rationale:**
- Puts pressure on marginal holdings without risking large chips
- Allows betting with a wide range without overcommitting
- Effective against weak holdings that must fold (low pairs, backdoor flush draws)
- Opponents are forced to call more often, allowing the button to get thin value

### Medium Bet: 33â€“66% Pot

**When to use:**
- K/Q-high unpaired, disconnected boards
- Two-gap connected boards
- Two-tone boards with mixed construction
- Rainbow boards with moderate connectivity

**Rationale:**
- Balances between denying equity and not overcommitting
- Appropriate when the button has some nut advantage but not maximum
- Allows semi-bluff equity denial for flush/straight draws
- Typical "polarization" sizing when betting occurs

### Large Bet: 66%+ Pot or Overbet (100%+)

**When to use:**
- Low, disconnected boards where the button's range advantage is maximum
- Ace-high boards where the button holds strong nut holdings
- Overbet specifically on A-low-low boards where the button has set combos
- Dynamic boards where draws need poor equity

**Rationale:**
- Maximizes value extraction when the button has strong holdings
- Denies equity from draws
- Polarizes the button's range (removes medium-strength hands from betting range)
- Necessary against wide opponent calling ranges that can't be folded out

---

## Part 12: Range Betting (Merged Range) vs. Polarization

### Range Betting (Merged Range)

**Concept:** The button bets with a wide, relatively balanced distribution of hands (value, marginal, bluffs).

**When to apply:**
- Dry, static boards where the BB's range is weak
- Boards where the button has clear range advantage
- Small bet sizing environments (25â€“33% pot)

**Examples:**
- Button bets 75% on Kâ™£7â™¦2â™¥ with hands like TT+, AK, marginal pairs, weak Aces, and some bluffs

**Advantage:** Forces the BB to defend frequently; reduces the BB's fold equity; allows the button to bet with many hands without fear of check-raises.

### Polarized Range (Separated Value/Bluff)

**Concept:** The button bets only with strong hands and clear bluffs, checking the middle of the range.

**When to apply:**
- Dynamic, connected boards where the BB's range is strong
- Boards with draws present (flush draws, straights)
- Larger bet sizing (50%+ pot)
- Situations where the button lacks significant range advantage

**Examples:**
- Button bets 50% on 9â™ 8â™¥7â™¦ with hands like sets, two-pairs, strong draws, and pure bluffs, while checking hands like marginal pairs, weak draws, and middle-strength combos

**Advantage:** Reduces the BB's profitability of semi-bluff check-raises; forces clearer decisions; allows the button to size appropriately for the range composition.

### Dynamic Determination

The flop texture, connectivity, and high-card composition determine whether to range bet or polarize. Solvers naturally blend these strategies, using mixed approaches on many boards.

---

## Part 13: When OOP Should Check-Raise

### General Principles for OOP Check-Raise Decisions

**Optimal Check-Raise Hands:**

1. **Value Raises:** Strong hands that benefit from being called and paid off
   - Trips and full houses (especially on paired flops)
   - Two-pair combos
   - Strong top pairs with excellent kickers
   - Sets in all-in prone positions

2. **Semi-Bluff Raises:** Drawing hands with equity and fold potential
   - Open-ended straight draws (especially with overcards)
   - Flush draws (especially on two-tone/monotone boards)
   - Combination draws (straight + flush possibilities)
   - Gutshot straights with strong kickers or blockers

3. **Equity-Denial Raises:** Hands that want to deny IP's equity while remaining profitable
   - Small pairs with over-card potential
   - Hands with multiple outs and backdoors
   - Weak draws mixed into a polarized check-raise range

### Check-Raise Frequency by Flop Texture

| Flop Texture | Typical Check-Raise Frequency | Rationale |
|---|---|---|
| Ace-High, Unpaired | 20â€“30% | IP's range wide/merged; BB checks down frequently; limited incentive to raise |
| K/Q-High, Unpaired | 25â€“40% | Moderate strength disparity; BB has some value and semi-bluffs available |
| Low Disconnected | 15â€“30% | IP's range strong; BB lacks hands with genuine semi-bluff value |
| Connected (OESD) | 30â€“45% | BB's range stronger; many draws and two-pairs available |
| Paired | 35â€“50% | Highest frequency; merged ranges; BB gets value from any pair |
| Monotone | 15â€“30% | Flush blocks own calling range; limited value hand availability |
| Two-Tone | 25â€“40% | Context-dependent; moderate frequency |
| Rainbow | 25â€“45% | Depends on connectivity and high-card status |

### When OOP Should NOT Check-Raise

**Avoid check-raising when:**
- The board is heavily in IP's favor and the BB lacks strong combos (e.g., low disconnected boards)
- The BB's range is capped and weak (e.g., after calling a button open with marginal holdings)
- The BB holds weak draws with limited equity (e.g., solo gutshots on static boards)
- IP has a very polarized, strong betting range that already accounts for check-raises

---

## Part 14: Common Solver Heuristics & Patterns

### Ace-High Boards

- **Pattern:** Lowest c-bet frequency among high-card boards, small sizing, many checks
- **Reason:** No overcards to protect against; polarized BB response; AX hands content to check down
- **BB Response:** Moderate raise frequency; many value hands but also many checks

### Paired Boards

- **Pattern:** High betting frequency but small sizing; elevated BB check-raise frequency
- **Reason:** Both ranges have trips/pairs; small bets gather information cheaply; BB's range is merged
- **Solver behavior:** IP bets with merged range; BB raises frequently with any pair

### Connected Boards (esp. zero-gap)

- **Pattern:** Reduced IP betting frequency; medium/larger sizing; elevated BB raises
- **Reason:** BB's straights and two-pairs reduce IP's advantage; IP needs equity denial
- **Solver behavior:** IP polarizes; BB raises with value combos and semi-bluffs

### Monotone Boards

- **Pattern:** DRASTICALLY reduced IP betting frequency and sizing; many checks by IP
- **Reason:** IP's nut advantage eroded; flushes block calling range; draw combos are too profitable to fold
- **Solver behavior:** IP checks back strong flushes sometimes; BB rarely check-raises (flushes are in BB's betting range already)

### Dry, Static Boards (K74, Q85, etc.)

- **Pattern:** High IP betting frequency; small-to-medium sizing; merged range betting
- **Reason:** IP range advantage maximized; BB's holdings weak and vulnerable
- **Solver behavior:** IP bets most of the range; BB calls with wide distribution or folds weak hands

### Dynamic Boards with Multiple Draws

- **Pattern:** Polarized IP ranges; higher sizing; moderate IP betting frequency
- **Reason:** IP must protect against equity; BB's range strong and many-faceted
- **Solver behavior:** IP bets with nuts and clear bluffs; BB responds with mixed strategy

---

## Part 15: Card Removal Effects & Blocking

### Concept

**Card Removal (Blockers):** When you hold specific cards in your hand, you reduce the number of combinations of those cards available in your opponent's range. This affects your opponent's possible holdings and changes the optimal strategy.

### Practical Application on the Flop

**Bluffing with Blockers:**
- If you hold a King as a bluff on a flop like K73, you block KQ, KJ, KT from your opponent's range
- This makes your opponent less likely to have strong hands, making your bluff more credible
- Solvers use blockers to select which hands to bluff with (e.g., prefer KJ over 97 as a bluff when the board is K73r)

**Value Betting with Unblocking Hands:**
- If you hold AK on a flop like KQ7, you unblock KQ from your opponent's range
- This makes your opponent more likely to have strong holdings
- This is one reason solvers sometimes prefer not to value bet with certain hands on specific boards

**Check-Raising with Removal Effects:**
- When the OOP player check-raises with a hand like QJ on a J96 board, they block the IP player's QJ combos
- This makes the IP player less likely to have QQ, TT, and similar holdings that would call a check-raise
- Solvers use this to construct balanced check-raise ranges

### Example: Flop of Kâ™¥9â™£4â™¦

If you hold Kâ™¦9â™  (two-pair):
- You block KQ, K9 combos from your opponent's range
- This makes straight combos (QT) and other two-pair combos less likely
- Your two-pair is stronger relative to your opponent's possible holdings

---

## Part 16: IP Range Betting A-High Dry Boards

### Pattern

Despite Ace-high boards seeing lower c-bet frequencies overall, **when the button does bet, many hands are in the betting range**. This is a "range bet" or "merged range bet."

### Hands in IP's Range Bet on A92r (Button raises, BB calls):

- **Value bets:** AA, AK, AQ, AJ, AT, KK, QQ, JJ, TT
- **Marginal bets:** Weak AX combos (A9, A8, A7, A6, A5, A4, A3, A2), weak Kings
- **Bluffs:** Some gutshots, some backdoor draws, low equity combos

### Why This Works

The BB's range, after just calling, contains many weak holdings that must fold or call with bad odds. Betting a merged range with small sizing (25â€“33% pot) allows the button to:

1. Value bet thinly with marginal AX
2. Bluff efficiently with hands that have some outs
3. Force the BB to defend frequently
4. Avoid risk when bluffs are called (small sizing)

### BB's Response to IP Range Betting on A92r

- **Call majority:** The BB calls down with underpairs, weak Aces, and showdown value hands
- **Raise some hands:** Mostly value raises with sets and two-pairs; occasional semi-bluff raises with gutshots
- **Fold some hands:** Weak, unconnected holdings without equity

---

## Part 17: Adjustments Based on Stack Depth

### 100bb Effective Stacks

- **General pattern:** Smaller bet sizes, wider c-betting ranges, more checking on dry boards
- **Reason:** Both players can play more hands to completion; check-raising is more viable (leverage remaining stack)
- **IP strategy:** Small range bets common; polarization less necessary

### 50bb Effective Stacks

- **General pattern:** Medium sizing (33â€“50% pot); more polarized IP ranges
- **Reason:** Stacks shallower; flop decisions more impactful; turn/river less important
- **IP strategy:** Some increase in polarization; more value betting

### 30bb or Shorter Effective Stacks

- **General pattern:** Large sizing (50%+ pot); highly polarized IP ranges; all-in more likely
- **Reason:** Flop decision is effectively the game; SPR (stack-to-pot ratio) compressed
- **IP strategy:** Overbetting common; check mostly with air; bet primarily nuts and bluffs

---

## Part 18: Special Case - OOP Donk/Probe Bets

### When OOP May Lead (Donk/Probe) the Flop

Modern GTO solutions show that OOP sometimes **leads** the flop with certain hands, rather than check-raising or check-calling. This is a more advanced dynamic:

**When OOP May Donk:**
- **Weak, narrow ranges:** After calling from the BB against a wide button open, the BB sometimes bets the flop with hands that would fare poorly in a check-raise situation
- **Example:** BB calls button open; flop comes 865. BB might lead-bet with hands like 77â€“99 (underpairs with extra outs) or weak draws, rather than wait to check-raise

**Sizing:** Donks are typically small (25â€“50% pot) to minimize risk while gathering information.

**Note:** Donking is situation and game-theory dependent. In many cash game settings, OOP checking is still the standard approach; donking gains prominence in specific spots where the BB's range is narrow.

---

## Part 19: Theoretical Summary of Key Principles

### 1. Range Advantage Drives Bet Frequency

The player with the wider, better-connected range bets more frequently. On high-card boards, the IP player (typically the button) has range advantage and should c-bet often.

### 2. Nut Advantage Drives Bet Sizing

The player with the strongest hands at the top of their range can size up. The player lacking nut advantage (e.g., button on many monotone boards) sizes down. When both players have equal nut strength, medium sizing is common.

### 3. Static Boards Favor Range Betting

On static, dry boards, the button merges a wide range with small sizing. The BB's defense is wide and call-heavy.

### 4. Dynamic Boards Favor Polarization

On dynamic boards with draws, the button polarizes: betting strong hands and bluffs with larger sizing, checking marginal holdings. The BB's check-raising frequency rises.

### 5. Paired Boards Require Specific Handling

Paired boards see high IP betting frequency with small sizing and elevated OOP check-raise frequency. Hands like small pairs gain relative value.

### 6. Monotone Boards Drastically Reduce IP Activity

Monotone boards see the lowest IP betting frequencies and smallest sizing because IP's nut advantage is eroded and flush blocks reduce value betting opportunities.

### 7. Card Removal Matters for Hand Selection

Solvers select bluffs and value hands based on card removal effects. Hands that block opponent's likely holdings are preferred as bluffs; hands that unblock are preferred as value bets.

### 8. Check-Raise Frequency Varies by Texture

Check-raise frequency ranges from ~20% (low disconnected, monotone) to ~45â€“50% (paired, connected). The OOP player's ability to construct value combos and semi-bluffs determines frequency.

### 9. Overbet Scenarios Emerge on Polarized Boards

Overbets (100%+ pot) appear when ranges polarize heavily toward nuts, typically on Ace-low-low boards where the button has many sets and the BB has many weak holdings or draws.

### 10. Stack Depth Modifies All Above Patterns

Shallower stacks compress the importance of later streets, increasing polarization on the flop and larger sizing. Deeper stacks allow wider, merged ranges and smaller sizing.

---

## Conclusion

GTO flop strategy in 6-max NLHE is fundamentally driven by range advantage, nut advantage, board connectivity, and hand equity distributions. Rather than memorizing specific frequencies, strong players understand the principles behind:

- **When to bet frequently with small sizing** (static, high-card boards; merged ranges)
- **When to polarize with larger sizing** (dynamic boards; distinct value/bluff separation)
- **When to check** (lacking advantage; vulnerable hands; dynamic runouts)
- **How OOP constructs check-raises** (value combos, semi-bluffs, equity denial)
- **How card removal affects hand selection** (blockers for bluffs, unblockers for value)

This theoretical foundation allows adaptation to varied game states, opponent tendencies, and stack configurations, providing the robust framework necessary for modern poker excellence.