# Item 9 — voucher and tag native contract

Inspected 21 October 2026 directly from the uploaded `Balatro_1.0.1n_0.4_25_noPairip.apk` Lua assets. The private extracted source stays outside the repository and release. These are own-prose static findings; this document alone does not establish runtime or full frame/event RNG parity.

## Native source landmarks

- `tag.lua`, `Tag:apply_to_run`: all 24 tag handlers, contexts and consumption.
- `functions/UI_definitions.lua:790`, `create_card_for_shop`: rarity interception, ordinary rate poll, edition dispatch.
- `functions/UI_definitions.lua:1354`, `add_tag`: existing Double tags observe additions before append.
- `game.lua:3415`, `Game:update_shop`: initial shop context order and saved-shop handling.
- `game.lua:3554`, `Game:update_draw_to_hand`: Juggle before first draw.
- `card.lua:1815`, `Card:redeem`; `:1882`, `Card:apply_to_run`: voucher purchase and effects.
- `functions/common_events.lua:1112`, `change_shop_size`; `:1940`, `get_next_voucher_key`; `:2312`, `calculate_reroll_cost`; `:2387`, `get_new_boss`.
- `functions/state_events.lua:1180–1240`: cashout components and Investment; `:291` temporary effects cleanup.
- `functions/button_callbacks.lua:2835–2876`: skip; `:2879–2945`: boss reroll; `:3046`: ante panel reset.

## Skip and tag lifecycle

Skip increments lifetime skips before adding the selected tag, advances Small→Big or Big→Boss, invokes owned Joker skip callbacks in order, saves, processes all immediate tags, then processes `new_blind_choice` until one handler reports an action. It does not cash out, draw, shuffle or regenerate the Small/Big tag choices.

Existing Double tags observe a newly added non-Double tag and each schedule one copy; adding another Double never consumes them. Copied Orbital tags inherit the original hand identity. A counter representation is equivalent only if consumed Doubles cannot react again while their copies are being added, and the resulting non-Double rewards retain source order.

| Tag | Native trigger | Result |
|---|---|---|
| Handy | immediate | $1 × lifetime hands played |
| Garbage | immediate | $1 × lifetime unused discards |
| Speed (`tag_skip`) | immediate | $5 × already-incremented lifetime skips |
| Economy | immediate | max(0,min(current dollars,40)); sequential copies see prior payouts |
| Orbital | immediate | saved hand gains 3 levels |
| Top-up | immediate | up to 2 Common Jokers; check actual available capacity before each construction; suffix `top` |
| Investment | eval | $25 after defeated Boss; remains pending on other blinds |
| Boss | new_blind_choice | ordinary exact boss RNG/usage update without $10; still marks boss rerolled for the ante |
| Standard | new_blind_choice | free `p_standard_mega_1` |
| Buffoon | new_blind_choice | free `p_buffoon_mega_1` |
| Ethereal | new_blind_choice | free `p_spectral_normal_1` |
| Charm | new_blind_choice | free Mega Arcana variant chosen with unkeyed math.random(1,2) |
| Meteor | new_blind_choice | free Mega Celestial variant chosen with unkeyed math.random(1,2) |
| Voucher | voucher_add | extra paid voucher from `Voucher_fromtag` stream |
| Juggle | round_start_bonus | +3 real hand size until actual end of next played round |
| D6 | shop_start | temporary reroll base 0 for one shop; paid increases remain |
| Rare | store_joker_create | forced Rare Joker, rarity input 1, suffix `rta`; free purchase |
| Uncommon | store_joker_create | forced Uncommon Joker, rarity input .9, suffix `uta`; free purchase |
| Foil/Holo/Polychrome/Negative | store_joker_modify | first eligible uneditioned Joker gains edition and free purchase |
| Coupon | shop_final_pass | initial main and booster cards free; vouchers excluded |
| Double | tag_add | copies next non-Double reward once |

Free pack dispatch stops after one handler, and returning from the pack resumes pending immediate/new-choice effects. A doubled pack therefore opens sequential packs, each saved independently, then returns to the same upcoming blind selection. It must not enter or require a paid shop.

## Shop ordering and RNG

For a newly built shop: D6 shop-start callbacks → main slots one by one → primary voucher → ordinary boosters → Voucher-tag extras → Coupon final pass. Saved shop restoration must preserve instantiated offers and must not repeat initial generation or consume the same Voucher/Coupon again.

For every main slot, `store_joker_create` tags are checked **before** the ordinary `cdt<ante>` type poll and before the candidate-list Illusion poll. Rare/Uncommon cannot be implemented by generating a normal card then replacing it: doing so advances wrong streams. A forced Joker is constructed directly with its original suffix, then edition tags are checked. Ordinary cards similarly pass edition tags after construction. The first applicable edition tag claims the card; another edition tag waits for a later eligible Joker. A naturally editioned Joker does not consume an edition tag.

Rare checks the number of distinct owned Rare identities against the complete Rare pool; if all are already held, it expires with no forced card and ordinary generation proceeds. Pool filtering and source constructor order still apply. Free-tagged cards retain the sell value computed for their ordinary/edition price; zeroing the purchase price must not replace sell value with zero or one.

Voucher-tag selection uses the exact key `Voucher_fromtag`, then `Voucher_fromtag_resample2`, etc. The ordinary ante voucher uses the existing ordinary Voucher pool key instead. Extra vouchers exclude redeemed identities and current shop voucher identities. They remain paid and are excluded from Coupon.

D6 permits one tag to activate per shop; surplus D6 tags remain for later shops. Coupon follows the same one-per-shop rule. Leaving shop clears each shop activation flag; temporary reroll base clears at next actual round end. Free Chaos rerolls cost zero without incrementing the paid reroll increase.

## Voucher effects

All 32 metadata identities belong to 16 pairs. Tier-two profile unlock conditions remain a separate profile concern; runtime effect support must not silently unlock locked entries or shorten the original pools.

| Pair | Runtime effect |
|---|---|
| Overstock / Overstock Plus | +1 main shop capacity each; immediately refill **all currently empty slots** up to new capacity using normal tagged construction |
| Clearance Sale / Liquidation | set discount to 25% / 50%; recalculate all extant card costs using native price order |
| Hone / Glow Up | set edition rate 2 / 4 |
| Reroll Surplus / Reroll Glut | subtract 2 from permanent reroll base and current payable cost each, current clamped to zero |
| Crystal Ball / Omen Globe | +1 consumable slot / full Arcana Spectral substitution rule |
| Telescope / Observatory | first Celestial choice targets most-played visible hand / held matching Planet cards each multiply scoring by 1.5 |
| Grabber / Nacho Tong | +1 permanent hands and current hands each |
| Wasteful / Recyclomancy | +1 permanent discards and current discards each |
| Tarot Merchant / Tarot Tycoon | set Tarot rate to 9.6 / 32; display values 2× / 4× are not actual rate multipliers |
| Planet Merchant / Planet Tycoon | set Planet rate to 9.6 / 32 |
| Seed Money / Money Tree | set interest dollar cap to 50 / 100 (cashout amount cap 10 / 20 at ordinary interest rate) |
| Blank / Antimatter | profile redemption event only / +1 Joker capacity |
| Magic Trick / Illusion | playing-card rate 4; Illusion enables its generation enhancement/edition polls |
| Hieroglyph / Petroglyph | ante and blind-ante -1; permanent/current hands -1 / discards -1 |
| Director’s Cut / Retcon | paid $10 boss reroll once per ante / unlimited; affordability includes bankrupt floor |
| Paint Brush / Palette | +1 real hand size each |

Redemption records the voucher before callbacks, spends its displayed price once, applies its effect, then dispatches Joker `buying_card` callbacks. The native function clears the current-round ordinary voucher identity even when an extra tag voucher was bought. This unusual behavior is source-observed and should not be guessed away.

Overstock refill is not limited to one new slot: if the player bought existing offers first, all emptied positions up to the expanded maximum refill. Pending rarity and edition tags apply to these constructions too.

Observatory is a consumable-area scoring contribution under `joker_main`: each non-debuffed held Planet whose hand type matches the scored hand yields ×1.5; inventory order determines its event order. Planets used and removed before scoring contribute nothing.

## Ante reduction and retained selections

`ease_ante(-1)` is not clamped. Hieroglyph and Petroglyph may reduce ante to zero or negative one. `get_blind_amount` returns 100 whenever ante is below 1. Boss selection uses max(1,ante) for ordinary eligibility, and showdown only if ante≥2 and divisible by win ante.

Buying either voucher does not regenerate the already selected boss or tags. Boss eligibility therefore cannot be revalidated only against the lowered live ante. The source selection provenance and current blind-scaling ante are distinct. The already completed round keeps its earned target; later blind panels use the reduced blind-ante. Boss cashout sets blind-ante to the incremented live ante before shop construction; buying a glyph there then decreases both live ante and blind-ante while retaining that preselected upcoming boss. RNG keys and shop context use the live ante, including zero/negative values.

## Cashout and persistence risks

Cashout resets current-round hands/discards to next-round permanent totals before entering the shop. Buying Hieroglyph after a last-hand victory therefore normally changes next-round hands from 4 to 3, rather than earned remaining hands from 0 to −1. The earned hand payout must remain separately snapshotted.

Investment contributes to the local cashout aggregate before the interest row, but interest is calculated from current wallet dollars before cashout. An Investment payout must not increase interest on the same receipt. Quotes and retries must consume each investment exactly once.

The pre-item9 codec assumptions requiring revision are: pack requires paid shop, pack round must already be won, real hand size equals only base+Spectral+Joker deltas, ante≥1, selected boss eligibility against current ante, and shop/pack normal-target equality against current ante. Extend provenance instead of dropping validation wholesale. Save pending rewards and free-pack return state, voucher ownership/modifiers, boss-reroll quota, temporary Juggle/D6 activation and current shop free status. Reopening a persisted shop must keep identical offers, prices, choices, pending tags and future RNG.

Full original frame/event RNG parity and installation on a physical Android device are outside what static inspection proves.
