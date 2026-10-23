# Shop economy — independently inspected APK, 08.10.2026

Reference SHA256:6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd. Static inspection only, not runtime parity.

## Price sequence
`assets/card.lua`, `Card:set_cost`: inflation and edition additions precede discount; rounding includes +0.5 before multiplying discount. Minimum price1 precedes booster ante/tutorial adjustments. Astronomer can make planets/celestial packs free, rental then forces1. Sell value is half the resulting cost rounded down, minimum1, plus extra value. Only afterwards does a coupon in shop_jokers/shop_booster force purchase price0. A coupon therefore does not necessarily make sale value1.

Own implementation: `src/core/shop-pricing.js`; tests `tests/core/shop-pricing.test.js`; independent reviewer PASS109/109. Transaction/UI integration pending.

## Generation trace and risk
`assets/functions/UI_definitions.lua:791`, `create_card_for_shop`: forced tutorial card → tag creation override → type poll keyed cdt+ante → ordered Joker/Tarot/Planet/playing/Spectral intervals → create_card with suffix sho → tag modification. Illusion's first random draw occurs during construction of the candidate list, even if a playing card is not ultimately selected; later Illusion draws are conditional on a selected playing card. This draw order must not be optimized away.

`assets/functions/common_events.lua:1983`, `get_pack`: first forced Buffoon variant uses math.random(1,2), not an explicit pseudoseed call. Subsequent pack polls use a key plus ante and the ordered available booster pool. Exact pool iteration order and ban/type filters matter at boundaries.

`assets/functions/common_events.lua:2312`, `calculate_reroll_cost`: negative free count clamps to0; positive free count gives0 and returns without changing paid increase; otherwise increment only when skip_increment is false, then use temporary base cost or normal base plus increase.

`assets/functions/misc_functions.lua:301/318`, `pseudoseed/pseudorandom`: keyed mutable state with decimal normalization feeds math.randomseed and math.random. Current counter32-v1 replay generator explicitly does not reproduce original seeds. Before declaring seeded shop parity, identify runtime PRNG and compare fixed-seed traces, including the unkeyed first pack draw.

## Remaining gates
Full version-specific catalogue metadata and unlock/ban/duplicate filters; create_card rarity/edition/sticker draws; original RNG runtime fixture; saved shop restoration; state transactions and exactly-once charging; selling/ending_shop effects; UI.
Do not substitute a reduced made-up pool for the original catalogue.

Native liblove.so arm64 includes the version string LuaJIT2.1.1700008891. This establishes a runtime clue, not verified random-sequence compatibility.
