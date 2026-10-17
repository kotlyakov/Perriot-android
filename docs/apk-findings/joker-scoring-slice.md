# APK Joker scoring facts and conditional native oracle

Source: uploaded `15-Balatro_1.0.1n_0.4_25_noPairip.apk`, SHA-256 `6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd`. Findings below refer to private APK asset paths; original source/art is not stored in this repository.

`scripts/reference-rng/joker-score-fixtures.json` contains **906 original-method return fixtures**, 12 original hand-containment fixtures, 39 factual Joker configurations and four edition configurations. Generator executes the APK's original `Card:set_ability`, `Card:calculate_joker`, `Card:get_edition`, card identity/suit methods and `evaluate_poker_hand` with the pinned original LuaJIT runtime. It loads original source privately at generation time. Adapter supplies areas, plain cards, localization, colors and absent interaction Jokers. Stencil's native update formula is explicitly applied by the adapter. Outputs retain numeric effect fields, not messages or source.

**Limit:** this is conditional native Lua method execution, not execution of the full Android APK or the full native scoring event loop. Whole-score arithmetic/order facts below come from inspecting `functions/state_events.lua`; they are not whole-score native execution fixtures. Rendering, retriggers, consumables, before/after events, boss modifiers, Smeared Joker/Pareidolia and round scheduling remain outside this oracle.

Regeneration from repository root:

```sh
python scripts/reference-rng/generate-joker-score-fixtures.py \
  --apk ../project_sources/15-Balatro_1.0.1n_0.4_25_noPairip.apk \
  --luajit ../private-apk-research/LuaJIT-43d0a19158ceabaa51b0462c1ebc97612b420a2e/src/luajit \
  --output scripts/reference-rng/joker-score-fixtures.json
```

## Native phases and order

- `card.lua:2294`: `Card:calculate_joker`; debuffed Joker exits immediately.
- `state_events.lua:562–589`: selected scoring hand and full `poker_hands` are separate outputs.
- `state_events.lua:598–618`: active Splash expands scoring hand to every played card. Normal scoring also includes played Stone cards. Splash does not replace combination identity/containment. The oracle records its empty config but does not execute this event-loop expansion.
- `state_events.lua:651`: before-Joker phase precedes base hand scoring. None of the listed static numerical effects requires a before-phase mutation.
- `state_events.lua:713–738`: each scoring card's own effects, then each Joker's individual-play effects in Joker order. Chips are added before Mult for a returned effect. Played debuffed cards are bypassed by outer scoring code (`:675–686`), not a universal gate in every `calculate_joker` predicate.
- `state_events.lua:819–892`: held-card own effects and held individual-Joker effects, in held-card order; `h_mult` adds before `x_mult` multiplies.
- `state_events.lua:895–961`: each Joker in positional order gets foil/holographic additive edition effects, its independent effect, other-Joker reaction effects, then polychrome multiplicative edition effect.
- `card.lua:3416`, `:3657–3673`: independent effects run with `cardarea=G.jokers` (normal scoring passes `joker_main=true`). Generic positive `ability.x_mult`, `t_mult`, `t_chips` checks precede named static effects.

## Fixed values

Amounts come from `game.lua` centre config, not descriptive `effect` labels. Some labels for The Duo/The Trio/The Family are stale. Actual APK IDs are **`j_duo`, `j_trio`, `j_family`, `j_order`, `j_tribe`**; there are no `j_the_*` keys.

| ID | Phase | Numeric rule | Native symbols/lines |
|---|---|---|---|
| `j_joker` | independent | +4 Mult | game:371; card:3983 |
| `j_greedy_joker`, `j_lusty_joker`, `j_wrathful_joker`, `j_gluttenous_joker` | individual play | +3 Mult for Diamonds, Hearts, Spades, Clubs respectively | game:372–375; card:3220 |
| `j_jolly`, `j_zany`, `j_mad`, `j_crazy`, `j_droll` | independent | +8/+12/+10/+12/+10 Mult when contains Pair/Three/Two Pair/Straight/Flush | game:376–380; card:3663 |
| `j_sly`, `j_wily`, `j_clever`, `j_devious`, `j_crafty` | independent | +50/+100/+80/+100/+80 Chips for same types | game:381–385; card:3669 |
| `j_half` | independent | +20 Mult if full played-card count ≤3 | game:387; card:3675 |
| `j_stencil` | independent | ×(empty Joker slots + Stencil count), if >1; otherwise no numeric effect | game:388; card:3657,3969,4206–4210 |
| `j_banner` | independent | +30 Chips per remaining discard, no effect at 0 | game:394; card:3710 |
| `j_mystic_summit` | independent | +15 Mult at exactly 0 remaining discards | game:395; card:3697 |
| `j_raised_fist` | individual held | +2×lowest held rank's nominal Chips as Mult | game:400; card:3323–3344 |
| `j_fibonacci` | individual play | +8 Mult on 2,3,5,8,A | game:403; card:3188 |
| `j_scary_face` | individual play | +30 Chips for face card | game:405; card:3139 |
| `j_even_steven` | individual play | +4 Mult on even numeric rank ≤10 | game:411; card:3199 |
| `j_odd_todd` | individual play | +31 Chips on odd numeric rank ≤10 or A | game:412; card:3209 |
| `j_scholar` | individual play | +20 Chips and +4 Mult on A | game:413; card:3162 |
| `j_smiley` | individual play | +5 Mult on face cards | game:480; card:3146 |
| `j_walkie_talkie` | individual play | +10 Chips and +4 Mult on 10 or 4 | game:477; card:3170 |
| `j_splash` | scoring selection | all played cards score | game:425; state_events:604 |
| `j_abstract` | independent | +3 Mult per owned Joker, including self/debuffed/negative Jokers | game:406; card:3681–3690 |
| `j_blackboard` | independent | ×3 if all held cards are black-suit matching; empty held hand qualifies | game:421; card:3954–3967 |
| `j_blue_joker` | independent | +2 Chips per card currently in draw deck; no effect at 0 | game:426; card:3890 |
| `j_arrowhead` | individual play | +50 Chips on Spades | game:495; card:3243 |
| `j_onyx_agate` | individual play | +7 Mult on Clubs | game:496; card:3236 |
| `j_flower_pot` | independent | ×3 if scoring hand supplies all four suits, counting each card once | game:500; card:3810–3847 |
| `j_duo`, `j_trio`, `j_family`, `j_order`, `j_tribe` | independent | ×2/×3/×4/×3/×2 when contains Pair/Three/Four/Straight/Flush | game:509–513; card:3657 |

## Boundary facts

`functions/misc_functions.lua:379–526` is native `evaluate_poker_hand`. `get_X_same` initially selects exact group size (`:595–615`), then evaluation explicitly propagates Five→Four→Three→Pair (`:510–520`). `Two Pair` requires two pairs or a separate three+pair (`:480–498`). Thus containment is not inferred from selected hand's rank ordering.

| Selected hand | Pair | Two Pair | Three | Four | Straight | Flush |
|---|---:|---:|---:|---:|---:|---:|
| High Card | no | no | no | no | no | no |
| Pair | yes | no | no | no | no | no |
| Two Pair | yes | yes | no | no | no | no |
| Three | yes | no | yes | no | no | no |
| Full House | yes | yes | yes | no | no | no |
| Four | yes | no | yes | yes | no | no |
| Five | yes | no | yes | yes | no | no |
| Straight Flush | no | no | no | no | yes | yes |
| Flush House | yes | yes | yes | no | no | yes |
| Flush Five | yes | no | yes | yes | no | yes |

All rows were executed with native evaluation; full lists including High Card are in fixture `contains`.

Raised Fist scans held cards by ascending `base.id`, excludes Stone cards, and updates selection on `>=`, so the **last** tied lowest card triggers. Ace has ID14 and nominal11; faces nominal10. Lowest debuffed card stays selected and yields a debuff message without numeric effect; it does not fall back to next lowest. Native fixtures verify ties, Ace vs King, Stone exclusion and debuffed minimum.

Blackboard uses `Card:is_suit(..., nil, true)` (`card.lua:3958`), so ordinary debuffed black cards qualify; Stone does not; active Wild qualifies even if underlying suit is red. Empty hand meets zero=zero. `Card:is_suit` is at `:4067–4091`.

Flower Pot processes non-Wild cards before Wild cards; each supplies at most one missing suit. Non-Wild suit checks bypass debuff, so ordinary debuffed cards count; debuffed Wild cannot fill a missing suit. It checks scoring hand, not the full played hand. Fixtures include four suits, missing suit, active Wild, debuffed plain and debuffed Wild.

Stencil recalculates `ability.x_mult = capacity − occupied count + Stencil count` in `Card:update`. The generic xmult branch runs first: a full row of five Stencils still returns ×5. One Stencil in a full five-Joker row has xmult1 and returns no numeric effect. Negative expands capacity by1 through edition lifecycle; do not count it as a spare slot while ignoring its occupied card.

## Editions and rational boundary

Native `Card:get_edition` (`card.lua:1017–1032`) returns foil `chip_mod=50`, holographic `mult_mod=10`, polychrome `x_mult_mod=1.5`; negative has no numeric scoring field. Config values are `game.lua:660–663`. Negative adds one Joker capacity slot in its lifecycle (`card.lua:407–423`, add-to-deck methods).

Native Joker score order is foil/holo **before** Joker's own effect, polychrome **after** (`state_events.lua:900–961`). With input Chips10/Mult2, a holographic ×2 Duo yields Mult24; reversing order would incorrectly yield14. A polychrome +4 Joker yields Mult9 from input2. These are arithmetic consequences of inspected ordering, not whole-loop execution results.

Polychrome is a **3/2 rational multiplier**. Do not truncate 1.5 to an integer or round after each multiplication. A core limited to integer Mult must explicitly block scoring polychrome until fractional-safe arithmetic is provided. Foil, holographic and negative do not require fractional Mult. Final score flooring is separate from intermediate Mult arithmetic (`state_events.lua:1052,1056,1070` explicitly floor the Chips×Mult product).

## Remaining verification blockers

Whole original scoring event-loop execution has not been harnessed. The oracle directly verifies return effects and containment, while edition sequencing, Splash expansion and outer debuff/retrigger scheduling are inspection evidence. A production subset must keep unsupported Joker/edition scoring explicit; catalog presence alone does not establish implemented gameplay behavior. Advanced card enhancements, retriggers, Four Fingers, Shortcut, Smeared Joker, Pareidolia, copy Jokers, scaling/stateful Jokers and bosses require later independent scenarios.
