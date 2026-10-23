# Item 10b — eight native stakes and sticker rules

Source: supplied `Balatro_1.0.1n_0.4_25_noPairip.apk` (1.0.1n-FULL). Scratch extraction only; product repo not modified. Line numbers refer to LF-normalized original sources under `original/`.

## Cumulative stakes

Definitions/order: `game.lua:256–263`; application: `game.lua:2249–2258`.

| Level | Key | New cumulative change |
|---|---|---|
|1|stake_white|Base rules|
|2|stake_red|`modifiers.no_blind_reward.Small=true`: Small Blind win reward becomes0|
|3|stake_green|`modifiers.scaling=2`: replace base ante target table|
|4|stake_black|`enable_eternals_in_shop=true`|
|5|stake_blue|`starting_params.discards -=1`|
|6|stake_purple|`modifiers.scaling=3`: replace scaling2 table|
|7|stake_orange|`enable_perishables_in_shop=true`|
|8|stake_gold|`enable_rentals_in_shop=true`|

All are >= conditions. Purple replaces Green's scaling, not compounds it. No obsolete Gold hand-size reduction or Orange pack-cost inflation in this APK. Stake changes precede Back.apply_to_run, so Red Deck's+1discard adds to Blue stake's−1; ordinary base3→2, Red Deck4→3. Stake8 keeps every previous change. New-run only; never reapply when loading a save.

Red's no-reward applies in `Blind:set_blind` (`blind.lua:82–84`) by blind type; it removes only blind reward, not unused-hand/discard payout, Joker bonuses, tags, interest or the shop after defeating Small.

## Scaling tables and Endless

`functions/misc_functions.lua:922–958`, `get_blind_amount(ante)`:

| Scaling | Ante1 |2|3|4|5|6|7|8|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|1 (White/Red)|300|800|2000|5000|11000|20000|35000|50000|
|2 (Green/Black/Blue)|300|900|2600|8000|20000|36000|60000|100000|
|3 (Purple/Orange/Gold)|300|1000|3200|9000|25000|60000|110000|200000|

Ante<1 returns100 for every scaling. Above8, let `a=table[8]`, `c=ante-8`, `d=1+0.2*c`, `k=.75`, `b=1.6`:

```
amount = floor(a * (b + (k*c)^d)^c)
amount = amount - amount % (10 ^ floor(log10(amount) - 1))
```

All native arithmetic is binary64, including final modulo. It floors first then truncates to two leading significant digits. Preserve the existing project's finite/large-number contract; do not substitute arbitrary-precision math and claim binary64 equivalence.

Final requirement: `get_blind_amount(ante) * blind.mult * starting_params.ante_scaling` (`blind.lua:107`). Plasma ante_scaling2 multiplies the result; it does not select stake scaling2. UI preview uses the same expression (`UI_definitions.lua:1655`). Boss disabled target recomputation must retain chosen stake curve and Plasma factor.

## Sticker generation and exact RNG order

`functions/common_events.lua:2166–2194` `create_card`:

1. Select native center; construct Card (constructor raw RNG unchanged).
2. For Joker type, if `all_eternal`, call set_eternal first (challenge modifier; later10g).
3. Only when `area==G.shop_jokers` OR `area==G.pack_cards`, ALWAYS draw shared eternal/perishable poll, even at White stake:
   - Shop key: `etperpoll` + ante.
   - Pack key: `packetper` + ante.
   - Eternal flag enabled and roll>.7 ⇒ call set_eternal(true).
   - Else perishable flag enabled AND .4<roll<=.7 ⇒ call set_perishable(true).
   - Otherwise ordinary. At exactly.4 no sticker; exactly.7 perishable; >.7 eternal.
4. Only when rental enabled (Gold), draw independent rental poll:
   - Shop key `ssjr` + ante.
   - Pack key `packssjr` + ante.
   - Roll>.7 sets rental. Exactly.7 does not.
5. Poll edition `edi` + key_append + ante AFTER sticker polls; set edition.

Probabilities among compatible centers:30%Eternal atBlack+,30%Perishable atOrange+,30%Rental atGold. Shared eternal/perishable roll makes those mutually exclusive; Rental is independent and may coexist with either and any edition. Compatibility refusal does NOT reroll and does NOT fall through to the other branch. Rental has no center compatibility flag.

This applies to Buffoon-pack Jokers (`card.lua:1775–1776`) and rarity-tag forced shop Jokers (`tag.lua:356,370`) because their area matches. No random stickers for ordinary creations directly into owned G.jokers: Judgement/Soul (`card.lua:1419`), Wraith1458, Riff-Raff2538, Top-up tag (`tag.lua:138`). No stickers on consumables/playing cards. Forced center by itself does not bypass stickers when target area is shop/pack.

## Compatibility setters and full exclusion lists

`Card:set_eternal` (`card.lua:506–511`) only accepts center.eternal_compat AND not already perishable. `Card:set_perishable` (`513–519`) only accepts center.perishable_compat AND not eternal; sets true and `perish_tally=G.GAME.perishable_rounds` (5 by game.lua2106). Actual setter ignores argument value on successful application; product can expose only add-sticker behavior instead of pretending native false clears it.

Native eternal_compat=false (11):
`j_gros_michel`, `j_ice_cream`, `j_cavendish`, `j_luchador`, `j_turtle_bean`, `j_diet_cola`, `j_popcorn`, `j_ramen`, `j_selzer`, `j_mr_bones`, `j_invisible`.

Native perishable_compat=false (18):
`j_ceremonial`, `j_ride_the_bus`, `j_runner`, `j_constellation`, `j_green_joker`, `j_red_card`, `j_madness`, `j_square`, `j_vampire`, `j_hologram`, `j_rocket`, `j_obelisk`, `j_lucky_cat`, `j_flash`, `j_trousers`, `j_castle`, `j_glass`, `j_wee`.

These are original catalog IDs (note `j_selzer` spelling). Eternal prevents selling (`card.lua:1642–1655`) and exclusion from destructive effects is checked by those effects: Ankh1433–1440, Hex1492, Madness2510, Dagger2569. It does not prevent rental or debuff. No Eternal+Perishable valid generated instance.

## Rental pricing and fees

`Card:set_rental` (`card.lua:521–524`) sets ability.rental and calls set_cost. In `set_cost:369–384` native base/edition/discount calculation occurs, then Astronomer free logic, then rental cost override1, then sell value `max(1,floor(cost/2))+extra_value`, then couponed-shop purchase cost override0. Thus:
- Rental purchase price$1 irrespective of edition/ordinary discounts.
- Sell value$1+extra_value (Egg/Gift Card growth still matters).
- Couponed rental may purchase for$0 yet retain its$1+extra_value sell value.
- Rental is not an edition; changing edition must not erase it or reset it.

`calculate_rental` (`2274–2279`) charges `-G.GAME.rental_rate` ($3, game.lua2107) on EVERY completed played round, even if card already debuffed or perishable expired; no money floor or affordability guard. It may make money negative. No fee on skip, buy, boss select, saved-game load, cashout retry.

## End-round ordering, expiry and passive effects

`state_events.lua:end_round:87–109`: establish game_over from score, then for each OWNED Joker in order:

```
calculate_joker({end_of_round=true, game_over=game_over})
if result.saved then game_over=false end
calculate_rental()
calculate_perishable()
```

This occurs both on win and loss, and when MrBones saves the round. Perish ticks once per played round (not skipped blinds) and while boss-debuffed. Owned-only: pack/shop stock does not age. `calculate_perishable:2281–2292`:
- tally>1 ⇒ decrement1.
- tally1 ⇒ set0 and set_debuff().
- tally0 stays0.

Expiry happens before held end-round card effects (Gold/Mime/Blue seals etc, state_events199+), before round evaluation cashout bonuses/interest. The fifth round can score with active Joker, but after it ends the expired Joker has no cashout Golden/Cloud bonus, ToTheMoon interest passive, Mime held Gold retrigger, etc. Freeze resulting quote only after this phase.

Important queued-removal interaction: native calculate_joker endround may schedule self-destruction (GrosMichel/Cavendish/MrBones etc), but object remains in owned loop and STILL owes rental immediately afterward. A synchronous reducer that removes it before running a surviving-inventory sticker pass must capture original owned list for fees or process per-slot first; otherwise it loses the fee.

`set_debuff` (`card.lua:526–538`) gives expired perishable absolute precedence: when tally<=0, ensure debuff true and remove_from_deck(true) once, then return even if requested should_debuff=false. CrimsonHeart clearing and boss defeat must never revive an expired Joker. Heart's candidate pool is built from nondebuffed cards (or sole Joker) before clears (`blind.lua:588–596`), so expired Jokers normally excluded unless sole card.

Passive removal via `Card:remove_from_deck(true)` (`645–704`) removes hand/discard capacity, CreditCard debt allowance, Chaos reroll grant, Turtle size, Oops probability, ToTheMoon interest, Astronomer pricing, Troubadour hands/size, Stuntman size. Negative edition is SPECIAL: debuff sets queue_negative_removal=true instead of removing inventory capacity (`card.lua:688+`); actual removal later decrements its slot. Retain occupied Negative slot after perish expiry.

## Copies and persistence

`copy_card` (`common_events.lua:2197–2225`) copies every ability field, deep copies tables, copies debuff verbatim. Thus Ankh/Invisible copy preserves Eternal/Rental/Perishable and REMAINING perish tally including0; never reset to5. Edition stripping is separate (Ankh strips Negative) and must not strip stickers. Blueprint/Brainstorm copy effects only; no physical sticker duplication/fee multiplication merely by copied effect.

Save needs stake choice, sticker flags, remaining perish lifetime, and any resulting disabled/passive state; normal load must neither repoll nor charge nor decrement. Existing full-frame/audio RNG limitation remains unchanged.

## Additional native Gold-seed behavior (profile-dependent, later10v)

`misc_functions.lua:223–244` generate_starting_seed special-cases stake>=8: if profile has a mixture of Gold-win and non-Gold-win Legendary Joker stickers, generate candidate seeds until first legendary is a not-yet-Gold-win one. Explicit seeded runs bypass generated-starting-seed. This is profile-based seed selection, not gameplay sticker RNG; preserve as documented later-profile dependency if not implementing in10b.

## Verification evidence limits

Static source inspection and exact lists only. No physical Android or complete event/frame RNG parity claimed. Native LuaJIT was unavailable during this research; no newly executed independent LuaJIT stake fixture is asserted.
