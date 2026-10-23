# Ordinary boss expansion — APK findings

Checked 2026-10-09 against the uploaded extracted reference: `assets/blind.lua`, `assets/functions/state_events.lua`, and `assets/functions/common_events.lua`. These findings apply to canonical ordinary cards and the existing supported joker scope. All **23 ordinary bosses** are recognized: **22** have unconditional target availability; **Ox requires an exact uniquely resolved saved most-played snapshot**. The **five showdown bosses remain unsupported** in gameplay. Catalogue/selection inclusion alone does not claim effect parity.

## Scoring and entry contract

`SUPPORTED_BOSSES` follows APK catalogue order and excludes showdown. `canEnterBoss(state)` requires an integer ante **1–8**, the selected normal boss's `minAnte <= ante`, APK RNG, ante played-card history, and canonical card registry. Ox additionally requires a recognized `state.mostPlayedHand` ID. The old `FIRST_ANTE_BOSSES` and `canEnterFirstAnteBoss` retain their original contract. `bossTarget(state)` multiplies the ante base by APK boss `mult`, independent of eligibility: bases **300, 800, 2000, 5000, 11000, 20000, 35000, 50000**; Wall **×4**, Needle **×1**, other ordinary bosses **×2**. No progression import is used, avoiding a dependency cycle.

Plant weakens ordinary J/Q/K only (ranks **11–13**, not Ace). Debuffed cards still participate in hand recognition but skip their chips and card-triggered effects. Independent joker effects remain available. Psychic rejects fewer than five played cards. Eye reads prior hand IDs from `bossState.playedHands`; Mouth reads `bossState.firstHand`. Scoring evaluates those restrictions with the recognized hand ID and returns zero without independent joker scoring for a debuffed hand. These helpers and `scoreHand` never mutate history. Run integration must record Eye's successful first occurrence / Mouth's initial choice **after** scoring, preserving pre-score context for save validation.

Flint (`blind.lua:510–517`) modifies only initial hand chips/mult after level calculation and before card/joker contributions: `floor(value*0.5+0.5)`, with mult at least **1** and chips at least **0**. For positive integer `BigInt` values this is `(value+1n)/2n`, not truncating odd values downward. Arm must lower the recognized hand's level before `scoreHand` reads it.

## Run hooks and visibility

| Boss | Exact reference rule | Integration consequence |
| --- | --- | --- |
| House | `stay_flipped`, `blind.lua:612–614`: hide hand-bound draws while both `hands_played == 0` and `discards_used == 0`. | Initial deal is hidden; after the first play or manual discard new draws become visible. Already hidden retained cards remain hidden. |
| Wheel | `stay_flipped`, `blind.lua:609–611`: each hand-bound draw polls `pseudorandom(pseudoseed('wheel')) < probabilities.normal/7`. | Poll once per drawn card, in actual draw order. The comparison is strict; base probability is **1/7**. Persist advanced APK RNG even when no card is hidden. |
| Fish | `set_blind` clears `prepped` initially (`169–177`); `press_play` sets it (`493–495`); `stay_flipped` checks it (`618–620`); `drawn_to_hand` clears it (`602`). | Initial deal visible; draws after play hidden; draws after manual discard visible. Hide only newly drawn cards; clear preparation after the completed draw batch. |
| Mark | `stay_flipped`, `blind.lua:615–617`: `card:is_face(true)`. | Canonical J/Q/K draws are hidden, Ace visible. No card debuff follows from this visual state. |
| Serpent | `state_events.lua:384–389`: after at least one play **or** manual discard, draw `min(deck_count,3)`. | Initial deal fills normal hand capacity; subsequent batches draw three even when this exceeds normal hand size. Deck exhaustion limits the count. |
| Tooth | `press_play`, `blind.lua:497–506`: lose **$1 for every played card**, not just scoring cards. | Apply on each play, including hand/card debuffs and non-scoring kickers; money may go negative. No random draw. |
| Arm | `debuff_hand`, `blind.lua:555–564`: when hand level > **1**, lower by **1** on real evaluation, never during preview (`check`). | Apply before base values are read. Never reduce below level one; not a hand debuff and does not suppress scoring. |
| Ox | `debuff_hand`, `blind.lua:565–572`: matching `current_round.most_played_poker_hand` loses current dollars via `ease_dollars(-dollars,true)`. | Set balance exactly to zero, including recovery from negative money; not a hand debuff. Snapshot reference's current target at entry; do not retarget after each play. |
| Eye | `set_blind` initializes all hand names false (`157–170`); `debuff_hand` rejects used hand name and records a new name only for real evaluation (`535–542`). | History is per boss round, hand IDs (not card identities); pure previews must not update it. |
| Mouth | `set_blind` initializes `only_hand=false` (`171–173`); `debuff_hand` rejects different names after first real evaluation (`544–551`). | Store first recognized hand ID; repeated same types score normally. Preview never locks the type. |

Hidden status belongs in `bossState.hiddenCardIds` (or other separate UI metadata), not on playing-card modifiers. Retained hidden cards stay hidden; remove IDs when cards leave the held hand; playing them reveals them. `scoreHand` intentionally does not consult visibility metadata. At boss completion/disable, restore ordinary visibility.

## RNG and original Ox tie caveat

Hook retains the existing exact keyed `hook` sampling implementation: sample up to two unplayed held cards without replacement from canonical creation order, polling the key separately for each selection. Wheel uses keyed fractional polling, **not** a direct global `Math.random`, integer draw, or a new probability stream per card. House/Fish/Mark and other deterministic ordinary effects introduce **no RNG polling**. Normal probability defaults to one; probability-changing joker integration is outside this patch's existing joker scope.

The native most-played Ox target is refreshed at **boss completion**, `state_events.lua:146–156`, initially defaulting to `High Card` (`game.lua:2156`). The loop initializes hand `High Card`, count `-1`, order `100`, then overwrites on larger counts or equal counts with `v.order < _order`. The reference does **not update `_order` inside the loop**. Therefore equal-max counts depend on native `pairs` traversal; a conventional strongest-hand tie breaker is incorrect.

This ambiguity was independently confirmed by restoring the prior Python oracle adapter with `lupa 2.8` and executing the original complete hand-table literal (`game.lua:2193–2206`) and the exact reference loop in two separate native **LuaJIT 2.1.1774896198** processes. The adapter is not the APK's LÖVE runtime, so these are evidence of runtime variability, not APK tie fixtures. Each run evaluated all **66 two-way ties**, with both tied counts set to three and all others zero; the last encountered tied name won every time. Same-source all-zero outcomes:

| Native process | `pairs` order | All-zero target |
| --- | --- | --- |
| A | High Card, Straight, Four of a Kind, Flush House, Full House, Five of a Kind, Two Pair, Pair, Straight Flush, Flush, Three of a Kind, Flush Five | Flush Five |
| B | Straight Flush, Flush, High Card, Straight, Four of a Kind, Flush House, Pair, Flush Five, Five of a Kind, Two Pair, Three of a Kind, Full House | Full House |

`resolveMostPlayedHand(playedHands)` accepts APK English-name count keys, treating absent names as zero, and returns a canonical hand ID only for a unique maximum. It returns **null for tied maxima**, including empty/all-zero counts, and rejects malformed counts/names. Integration initializes the native default `high_card`; boss cashout refreshes this snapshot to a unique result or null. **A tied snapshot does not block cashout or other bosses**. Ox entry with null/missing target fails atomically instead of inventing a tie rule. Exact tied Ox availability requires an original-runtime hash/snapshot adapter and remains open.

## Verification

`tests/core/expanded-boss-effects.test.js` covers boss coverage/ante gates, showdown rejection, canonical identity rejection, APK targets, Plant recognition/scoring, immutable Eye/Mouth histories, Flint odd-number rounding and order, and visibility-independent scoring. Run-level hand limits, draw hooks, money, history mutation, persistence, and UI integration are owned by the integrating task and require their own tests.

## Integration and review

Snapshot `mostPlayedHand` is stored at run level, starts as high_card and refreshes at boss cashout. A tied maximum stores null; only entry to Ox is gated. House/Wheel/Fish/Mark concealment lists must be arrays and subsets of current hand. Eye/Mouth lastScore stores pre-score bossHistory and validates the resulting boss history on reload. Serpent draws min(remaining deck,3) after each action.

Independent review found and fixed deck-dialog information leakage: concealed cards remain in the unknown pool together with undrawn cards, with identical availability and generic labels. Falsy hidden metadata now rejects saves. Core regression tests observed RED then GREEN. Exploratory browser uses an unchanged Chromium executable with a repaired scratch strings data pack; final Android CI must use official unmodified Chromium.
