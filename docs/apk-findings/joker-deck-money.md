# Deterministic held, suit, deck and money Jokers

Reference: uploaded APK `01-Balatro_1.0.1n_0.4_25_noPairip.apk`, extracted `assets/card.lua`, `game.lua`, `blind.lua`, `functions/state_events.lua`, and `functions/common_events.lua`. No original visual/audio resources are included.

| Joker | Native source | Exact supported behavior |
|---|---|---|
| Baron | card.lua 3290–3304; game.lua 446 | Each nondebuffed held King gives ×1.5; Stone has no King identity. |
| Shoot the Moon | card.lua 3275–3289; game.lua 519 | Each nondebuffed held Queen gives +13 Mult. |
| Flower Pot | card.lua 3810–3842; game.lua 500 | Scoring hand must supply four distinct suit assignments; plain cards are scanned before Wilds in Hearts, Diamonds, Spades, Clubs order. Ordinary card debuffs are bypassed; Wild debuffs are respected. A single Wild fills one missing suit. |
| Seeing Double | card.lua 3843–3877; game.lua 506 | ×2 requires scoring Clubs and a different suit assignment; Wilds fill one missing suit in Clubs, Diamonds, Spades, Hearts order. Debuffed cards do not supply suits. |
| Stone Joker | card.lua 3925–3931, 4200–4204; game.lua 464 | +25 Chips per Stone playing card across the whole owned deck. |
| Steel Joker | card.lua 3932–3938, 4188–4192; game.lua 404 | ×(1 + 0.2 per Steel playing card across the owned deck), represented as an exact fraction. |
| Bull | card.lua 3939–3945; game.lua 469 | +2 Chips per positive effective dollar. Zero and negative money produce no effect. |
| Driver's License | card.lua 3946–3954, 4182–4186; game.lua 520 | ×3 at 16 enhanced owned playing cards; editions alone are not enhancements. |
| Bootstraps | card.lua 4049–4055; game.lua 524 | +2 Mult per complete $5 of effective money; money below $5 produces no effect. |

Native `Card:update` refreshes deck tallies from `G.playing_cards` each frame; it does not maintain incremental score-trigger counters. The supported score pipeline makes no pre-independent enhancement or deck mutation, so its initial whole `state.cards` collection gives the same refreshed tally. Glass destruction runs after independent effects; save replay restores `glassDestroyedCards` before re-evaluating the tally. A regression proves Driver's License still activates with 16 enhanced cards before one Glass shatters, although the restored final deck contains only 15. Future transformation Jokers must respect the native frame/event lifecycle before being enabled; this slice does not claim that immediate recomputation covers those effects.

Money follows the native scoring phase. Lucky `Card:get_p_dollars` (card.lua 1066–1088) fills `G.GAME.dollar_buffer` before independent Joker calculation. `ease_dollars` (common_events.lua 70 onward) commits queued dollars. Bull and Bootstraps therefore see starting money plus scoring Lucky payouts. Tooth `Blind:press_play` (blind.lua 497–505; state_events.lua 509) removes $1 per played card before scoring; Ox `Blind:debuff_hand` (blind.lua 560–568; state_events.lua 635) zeroes starting money before scoring. The pure scorer accounts for that effective money, while the run reducer retains responsibility for committing currency changes once. Held Gold payouts occur after the score and do not strengthen money Jokers in the current hand.

## Replay corrections

The baseline scorer saved held IDs only when a held Steel card existed. A Raised Fist score with no Steel generated a held score-step whose missing held IDs failed save validation. Blackboard could be replayed against newly drawn cards. The baseline validator also replayed Acrobat using post-PLAY remaining hands, instead of the counter used for the original score.

The score now captures ordered held IDs (including an empty hand), pre-PLAY counters for dependent Jokers, and initial money for money Jokers. Replay restores those inputs before applying effects; Lucky RNG restoration retains these inputs. Before-hands must equal the current remaining hands plus one. Before-discards can exceed the current count because DISCARD retains the preceding score. Held IDs cannot reference the current draw pile and must fit the pre-PLAY hand capacity after subtracting played cards; Serpent retains its supported overdraw behavior and uses the owned deck bound. The money snapshot must produce current money after Lucky payouts, Tooth/Ox and any round-end held Gold payout. Ox destroys the old dollar value, so it cannot independently prove an otherwise inert initial value; the resulting effect/trace is still fully verified.

Compatible previous scores without round snapshots derive pre-PLAY remaining hands. Previous scores without held metadata remain accepted only when the complete effect trace can still be reproduced; unavailable original held context is not invented. Previously unsaveable Raised Fist traces are not claimed recoverable.

## Verification

`tests/core/joker-deck-money.test.js` covers positive cases, absent triggers, material thresholds, physical held/Joker ordering, exact fraction arithmetic, Wild/debuff exceptions, save replay before redraw, money corruption, compatible legacy metadata, and post-score Glass destruction.

`scripts/reference-rng/generate-joker-deck-money-fixtures.py` executes original `Card:set_ability` and `Card:calculate_joker` methods and produces 89 fixtures checked by the test. It reuses the existing minimal non-rendering adapter and explicitly supplies the native tally formula. The initial check used a Lua 5.4 compatibility launcher; the final checked-in fixtures were regenerated successfully with the original pinned LuaJIT-43d0a19158ceabaa51b0462c1ebc97612b420a2e runtime (LuaJIT 2.1.1700008891). This is independent deterministic native-method evidence, **not** the complete Android APK, RNG/event scheduling, or the full `Card:update` lifecycle. The exact APK SHA-256 is stored in fixture `source` metadata.

Commands:

```sh
node --test tests/core/joker-deck-money.test.js tests/core/native-joker-oracle.test.js
python3 scripts/reference-rng/generate-joker-deck-money-fixtures.py --apk /path/to/reference.apk --lua /path/to/lua-runtime --output /tmp/joker-deck-money-fixtures.json
npm test
```

Final scoped core run: **16/16** new Joker tests passed; full shared suite **456/456** passed after integration of the Hook ordering correction. Scoped changed-code whitespace check passed.
