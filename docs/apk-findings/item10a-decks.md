# Item 10a — native deck contracts

Source: attached `Balatro_1.0.1n_0.4_25_noPairip.apk`, extracted `assets/*.lua`; target definitions are `game.lua:629–643`. These are 1.0.1n rules. Profile unlocks/stakes belong to later item10 parts.

## Fifteen decks

| ID | Native startup / persistent effect |
|---|---|
| red | +1 discard every round: base4 hands/4discards/8cards/5joker slots/2consumable slots/$4 |
| blue | +1 hand every round:5hands/3discards |
| yellow | +$10 starting money, total$14 |
| green | $2 per unused hand +$1 per unused discard; no interest |
| black | −1 hand every round (3), +1 Joker slot (6) |
| magic | pre-redeem Crystal Ball (`v_crystal_ball`), consumable capacity3; start with2 distinct physical Fool (`c_fool`) instances |
| nebula | pre-redeem Telescope (`v_telescope`); −1 consumable slot (capacity1) |
| ghost | spectral category shop weight2; start with1 Hex (`c_hex`) |
| abandoned | omit J/Q/K before creation:40 starting cards; Aces stay |
| checkered | transform Clubs→Spades, Diamonds→Hearts, preserving each physical identity;26 Spades+26 Hearts |
| zodiac | pre-redeem Tarot Merchant, Planet Merchant, Overstock in that order (`v_tarot_merchant`,`v_planet_merchant`,`v_overstock_norm`); rates9.6 Tarot and9.6 Planet,3shop slots |
| painted | +2 hand size (10), −1 Joker slot (4) |
| anaglyph | add1 Double Tag on each Boss round evaluation |
| plasma | blind requirements×2; after all scoring card/Joker/edition effects, both chips and multiplier become `floor((chips+mult)/2)` |
| erratic |52 independent random front draws with replacement from full52prototype pool, keyed `erratic`; sort resulting prototypes by ASCII suit+rank before creating physical cards |

Base params: `functions/misc_functions.lua:1853–1867`. Back effects: `back.lua:175–280`. Voucher application effects: `card.lua:1882–1980`.

## Startup chronology and RNG

`Game:start_run` applies stake modifiers then Back before selecting seed-dependent objects (`game.lua:2249–2260`). Back sets used_vouchers flags immediately and increments `starting_voucher_count` for pre-redeemed vouchers. The latter is subtracted from purchased-voucher unlock counting (`common_events.lua:1277`); do not treat deck vouchers as purchases/discoveries.

Then seed initializes, followed by boss → first voucher → Small tag → Big tag (`game.lua:2359–2379`). Thus used_vouchers from Magic/Nebula/Zodiac must already exclude initial vouchers from eligible pool. No on-load repeat of these effects.

New-run card generation is synchronous (`game.lua:2537–2573`): iterate52 original prototypes; Erratic draws a new full prototype on each iteration using `pseudorandom_element(G.P_CARDS,pseudoseed('erratic'))`; Abandoned removes faces; resulting prototypes sorted by suit+rank(+enhancement/edition/seal); create in that order. `pseudorandom_element` sorts keys unless values have sort_id (`misc_functions.lua:256–273`). For P_CARDS, order is ASCII C,D,H,S; ranks2..9,A,J,K,Q,T. Erratic is NOT independent suit/rank rolls and does NOT preserve the unsorted52draw order as physical creation order.

After creation, record starting_deck_size; initial shuffle (`shuffle`) → reset Idol → Mail → Ancient → Castle (`game.lua:2574–2588`). `CardArea:shuffle` uses `pseudoshuffle(cards,pseudoseed(_seed or 'shuffle'))` (`cardarea.lua:578–581`).

Back's Checkered transformation is queued (`back.lua:241–255`), so synchronous creation/shuffle occur on original faces; later callback changes C→S,D→H while preserving physical sort IDs. Shuffles later still use immutable creation IDs; do not reassign ordinals based on transformed suits.

Back's initial consumables are queued (`back.lua:186–197`): `create_card('Tarot',G.consumeables,...,forced_key,'deck')`. Forced key bypasses pool/soul RNG; its actual set overrides Tarot (Hex becomes Spectral). Forced Fools may coexist despite ordinary duplicate-pool filtering. Constructor still consumes3 raw `math.random` draws for discard_pos (`card.lua:5–57`); materialization may schedule additional audio raw RNG (`card.lua:2186+`). Full animation/event raw RNG parity is an inherited separate issue; do not claim it solved by matching keyed streams.

Magic Crystal Ball and Zodiac voucher callbacks are queued; their used flags precede the first voucher selection. Zodiac callback order follows voucher list. Crystal Ball increments consumable capacity1; Overstock increments shop size1; merchants set category weights `4*2.4=9.6` (`card.lua:1887–1924`).

## Green cashout

`state_events.lua:1184–1226`: selected_back eval; unused hand money (`hands_left*(money_per_hand or1)`); unused discard money if modifier set; Joker bonuses; tag payouts; interest only if not no_interest. Green multipliers replace base per-hand payout rather than adding an extra$2 on top. Double/ToTheMoon interest cannot resurrect interest when no_interest=true. Snapshot earned counters at settlement; later inventory sale must not change earned payout.

## Anaglyph timing

`back.lua:112–122` checks context `eval` AND last_blind.boss, then queues `add_tag(Tag('tag_double'))`. Round eval is before cashout-button action (`state_events.lua:1184`). Award once per completed boss; save/reload or cashout retries must not duplicate it. Existing Double tags explicitly ignore another Double (`tag.lua:319–333`), so grant adds one to pending Doubles without consuming prior Doubles. This also applies if Mr Bones saves a boss evaluation; effect checks boss, not score threshold.

## Plasma

`back.lua:127–172`, called at `state_events.lua:967`: balance after all scored/held/independent/Joker-edition effects and before Glass destruction. Sum may be fractional; take floor of half of full exact sum, not floor mult first, and never round to nearest. e.g chips10,mult1.5 ⇒ balanced5/5,score25. `blind.lua:107` multiplies entire blind amount (`get_blind_amount(ante)*blind.mult`) by ante_scaling2; UI preview does same (`UI_definitions.lua:1655`). Applies to Small/Big/Boss and disabled-boss target recomputation.

## Ghost shop

`UI_definitions.lua:813–835`: cdt weighted order Joker20,Tarot4,Planet4,Base0,Spectral2. Category interval `(previous,previous+weight]`. Shop create_card has soulable=nil, so Soul/BlackHole cannot appear through the generic Spectral shop category; full ordinary Spectral pool retains placeholders and duplicate rules (`common_events.lua:2020–2083`). Ghost is not a special forced spectral every shop.

## Evidence limits / later work

No physical Android test or full-frame RNG equivalence performed here. Deck unlock conditions are present in `game.lua:630–643` but intentionally belong to10v. Stakes belong to10b; challenges10g. Native default Blue itself is locked until20 discoveries, but existing accepted preview exposes Red/Blue; do not silently change those accepted preview defaults in10a.
