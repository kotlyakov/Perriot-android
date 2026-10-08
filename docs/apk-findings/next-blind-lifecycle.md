# Shop and next-blind lifecycle — direct APK inspection

Reference: uploaded `15-Balatro_1.0.1n_0.4_25_noPairip.apk`, inspected locally on 2026-10-08. These are own-prose observations from extracted `assets/` Lua. Original game execution has not been performed. Source paths/line numbers below refer to that APK, not JavaScript implementation. No original Lua is included here.

## Stored voucher and ante timing

- Fresh `Game:start_run` establishes the seed/hash, then selects the initial boss, current-round voucher, Small tag, Big tag, in that order (`game.lua:2361-2379`). Saved runs bypass these selections. Tutorial-forced voucher/tags override ordinary choices.
- The initial deck shuffle uses the default `shuffle` key (`game.lua:2579-2586`, `cardarea.lua:578-581`). The voucher selection precedes that shuffle and precedes gameplay.
- `get_next_voucher_key` obtains the complete eligible Voucher pool, polls its key, and rejects `UNAVAILABLE` positions with suffixes `_resample2`, `_resample3`, etc (`functions/common_events.lua:1940-1952`). The ordinary key ends with current ante (`:2091`). Used vouchers, every required prerequisite, existing voucher-area duplicates, unlocks, bans and pool flags affect eligibility (`:2002-2091`).
- Winning Small or Big marks that blind defeated without selecting a replacement voucher. An unredeemed voucher remains the same across shops of the same ante. Redeeming a shop voucher clears the stored current voucher and marks the voucher used (`card.lua:1821-1824`). Therefore subsequent shops within that ante can have no ordinary voucher.
- Boss victory increments ante during end-round events, **before** switching to round evaluation and selecting the new voucher (`functions/state_events.lua:259-285`; `ease_ante`, `functions/common_events.lua:195-206`). Consequently the shop after an ante-1 Boss already generates with ante 2 and its stored ante-2 voucher. This is not a voucher reroll when leaving the shop.
- Boss end also clears `voucher_restock`, resets playing-card `played_this_ante`, and restores temporary hand-size/reroll changes (`functions/state_events.lua:259-295`).

## Round → cashout → shop → blind selection

1. End-round applies Joker and held-card effects, returns hand/discard cards to the deck, sets defeated blind state, and performs reset hooks (`functions/state_events.lua:185-310`). An implementation that only totals the winning score does not cover this stage.
2. Cashout shuffles using `cashout` plus **the current ante** before shop creation (`functions/button_callbacks.lua:3007-3014`). For Boss cashout this is the already incremented ante. It credits the evaluated round dollars once, resets `jokers_purchased`, hands/discards for shop display, clears `shop_free`/`shop_d6ed`, and enters SHOP (`:3016-3044`). It also zeroes chips (`:3044`).
3. If Boss is defeated, cashout updates `blind_ante`, generates the new Small/Big tags, then calls `reset_blinds` (`:3045-3050`). `reset_blinds` sets all three states Upcoming, selects Small as on-deck, chooses a new boss, and clears boss-rerolled state (`functions/common_events.lua:2375-2386`). Thus next boss selection occurs at Boss cashout, after new tags and before the next blind starts.
4. Shop generation is main cards, stored voucher, two booster positions, then voucher/final-pass tag hooks (`game.lua:3458-3510`). Persisted area loads bypass their corresponding generation. Booster keys persist in `used_packs`; `USED` slots stay absent.
5. Leaving shop sends each owned Joker `ending_shop`, removes shop UI, and enters BLIND_SELECT (`functions/button_callbacks.lua:2576-2604`). It does not start the next blind or reroll its voucher.
6. Blind selection derives Small if unfinished/unskipped/unhidden, otherwise Big if unfinished/unskipped/unhidden, otherwise Boss (`functions/UI_definitions.lua:1548-1551`). The current selection becomes Select (`:1594-1596`). Choosing the blind increments round count, stores the exact catalogue blind, marks Current, and calls `new_round` (`functions/button_callbacks.lua:2625-2646`).
7. `new_round` resets hands/discards, per-round played counters, reroll increase and used packs; recalculates free rerolls from Chaos the Clown; clears one-round bonuses; configures the blind and sends setting-blind Joker contexts; then shuffles `nr` plus ante and draws (`functions/state_events.lua:311-371`).

Ordinary unskipped sequence is Small(ante n) → shop(n) → Big(n) → shop(n) → Boss(n) → shop(n+1) → Small(n+1). Boss choice is catalogue-driven, with actual boss effects required. There is no evidence supporting a generic substitute boss.

## White-stake plain-run targets and payouts

`functions/misc_functions.lua:922-956` defines scaling tables. Default/scaling 1 Small base amounts by ante 1–8 are **300, 800, 2000, 5000, 11000, 20000, 35000, 50000**. Ante below 1 yields 100. `blind.lua:107` multiplies the amount by the selected blind's multiplier and `starting_params.ante_scaling`; it does not round that product in this statement.

| Blind | Multiplier | Base reward | Ante-1 target |
|---|---:|---:|---:|
| Small | 1 | $3 | 300 |
| Big | 1.5 | $4 | 450 |

Sources: `game.lua:267-268`. Normal bosses have catalogue rewards generally $5, showdown bosses $8. Multipliers vary: e.g. Wall 4, Needle 1, Violet Vessel 6; many others 2 (`game.lua:269-300`). Reward suppression modifiers are applied in `Blind:set_blind` (`blind.lua:78-85`).

For default scaling after ante 8: let c=ante−8, d=1+0.2c; floor `50000 × (1.6 + (0.75c)^d)^c`, then discard the remainder modulo `10^floor(log10(amount)−1)`. Scaling 2/3 uses the same expression with its own ante-8 base. JavaScript large-number arithmetic is not automatically equivalent to the original Lua double behavior.

## RNG invariants across rounds

- Cashout and next-round shuffles are both required. Omitting cashout changes the saved global native RNG state before shop creation, even when later keyed polls overwrite it.
- Small/Big/Boss in one ante reuse **the same advancing `nrN` stream**. Never reset that stream on each blind; `cashoutN` is an independent advancing stream. At Boss completion cashout uses N+1, while the winning Boss's start used nrN.
- `CardArea:shuffle` calls `pseudoshuffle(cards, pseudoseed(key))`; this reseeds native math RNG without first polling a float (`cardarea.lua:578-581`, `functions/misc_functions.lua:209-220`).
- Every shuffle sorts cards by persistent construction `sort_id` before Fisher–Yates. Previous deck/discard order therefore does not determine plain-card shuffle input. Added/duplicated/transformed cards need persistent sort IDs (`card.lua:24-25`, `:4715`, `:4798`), which the current plain-card helper does not support.
- Retain keyed streams plus native four-word state through saves. Generation receives the post-cashout RNG, not a fresh seed-only RNG. Restoring a generated shop must not advance selection RNG again.

## Minimum concrete implementation interfaces

- Run-start selection function takes APK RNG, current ante, profile unlock/discovery defaults, full catalogues, bans, boss-use counts, used vouchers, prerequisites, pool flags, tutorial/FTP/challenge state; returns stored boss/voucher/tags and updated RNG. Preserve original order.
- End-round result distinguishes played blind identity from current ante. Preserve the winning blind's reward/target for evaluation after Boss advances ante. Produce an idempotent pending cashout rather than deriving old reward from the next selected blind.
- Fresh-shop producer takes **whole selection context**, not just `{rng, offers}`: ante, stored voucher, hand-play history, owned and offered used-name flags, enhancements, rates, shop capacity, tags, used packs, first Buffoon flag, inflation/discount/edition modifiers, profile eligibility and reduced motion. Return offers, state mutations and APK RNG together.
- Next-blind configuration returns an exact catalogue key and target; keeps Small/Big/Boss status separate from boss catalogue identity; clears score/counters at the appropriate boundary and preserves run history, ownership, money and RNG.
- Save validation needs Big and real boss IDs, later antes, stored voucher/used-voucher state, full shop selection state and APK RNG. Restore must preserve next offer IDs, purchased booster absence and advancing stream counters.

## Current effect and schema obstacles

Current `src/core/run.js` only credits a Small cashout, clears deck partitions, and enters shop; it neither performs cashout shuffle nor automatically generates inventory. `START_BLIND` already uses nr+ante but rounds never advance automatically. `src/core/shop.js` requires caller-supplied nextRound and its reroll producer accepts a 32-bit generic shop RNG, incompatible with full APK RNG/context.

`src/content/jokers.js` implements only Joker, Sly Joker, Clever Joker and Splash. `BUY_SHOP_CARD` only buys those four with base editions; other editions/rental/perishable/debuff/inflation reject. Tarot/Planet/playing-card purchases, consumable ownership/use, voucher redeem, booster opening/choices and most Joker contexts are absent. A complete selection catalogue cannot be represented as a complete playable shop by simply replacing four offers with 150 possible Jokers: unsupported generated offers need truthful availability/effect status until their behavior exists, and must retain original RNG/pool positions.

`src/persistence/save.js` currently only accepts `blindId==='small'`, antes 1–8, plain three-field card identities (id/rank/suit), owned supported Jokers, three ordinary score operations, and no complete selection/lifecycle fields. Full effects also require expanded score validation, persistent card modifications/sort IDs, consumables and effect state. These are implementation gaps, not evidence that original generation should narrow its pool.
