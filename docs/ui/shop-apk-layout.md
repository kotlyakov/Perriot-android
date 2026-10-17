# APK shop layout reference

Checked locally 2026-10-08. This is a reference specification, not UI implementation or a claim of completed visual parity. FieldstyleB, Rubik, and independently created artwork are the approved presentation choices. Source artwork and APK source files must not enter the project or release assets.

## Sources and screen identification

- `project_sources/02-Screenshot_2026-09-08-11-00-40-32_aea5bf60a1cfb2c5b2453e07eee2145b.jpg`: actual idle shop, 2412×1080 pixels. Visually inspected with `view_image` before measurements. It shows two main offers, one voucher and two Standard boosters, one owned joker and one owned consumable.
- Screenshot03 (same dimensions): language-selection dialog, not shop.
- Screenshot12 (same dimensions): opened Standard pack, with three cards, choose-one text and Skip. It verifies that owned top cards and deck persist while the shop body leaves the field.
- Screenshot13 (same dimensions): blind-selection tutorial, not shop.
- `project_sources/15-Balatro_1.0.1n_0.4_25_noPairip.apk`, entries `assets/functions/UI_definitions.lua`, `assets/game.lua`, `assets/cardarea.lua`: inspected in memory with Python `zipfile`, without copying source into the repository. APK takes priority for rules and exact layout-unit constraints. The supplied screenshots do not establish their patch identity; screenshot03 visibly says `1.0.1o-FULL [M]`. Therefore screenshot geometry and APK layout are separate evidence, not proof of identical versions.

## Measured idle shop geometry

Coordinate origin is the top-left of the entire supplied JPEG, including the thin black peripheral border. Do not crop before applying these coordinates. The project logical canvas is1536×688. Conversion is `logicalX = sourceX * 1536 / 2412`, `logicalY = sourceY * 688 / 1080`; widths/heights use the corresponding factors. Normalized coordinates divide by2412 and1080. Numeric conversion is exact for the listed measured boxes; the boundary measurements themselves are manual, approximately ±5 source pixels (±3.2 logical pixels), and may vary through CRT distortion, animation, shadows and rounded corners. Do not treat decimals as additional measurement precision.

Rectangles below cover the visible face/silhouette, excluding shadows where distinguishable. Voucher and booster artwork silhouettes are not rectangular interaction boundaries. The outer shop frame touches the bottom image edge; its full unclipped height is not established.

| Element | Screenshot02 px `[x,y,w,h]` | Logical1536×688 `[x,y,w,h]` | Normalized `[x,y,w,h]` |
| --- | --- | --- | --- |
| shop sign panel | `[246,60,431,287]` | `[156.66,38.22,274.47,182.83]` | `[0.101990,0.055556,0.178690,0.265741]` |
| shop outer frame (bottom clipped) | `[759,325,1028,755]` | `[483.34,207.04,654.65,480.96]` | `[0.314677,0.300926,0.426202,0.699074]` |
| Next Round face | `[791,355,245,128]` | `[503.72,226.15,156.02,81.54]` | `[0.327944,0.328704,0.101575,0.118519]` |
| Reroll face | `[792,493,244,140]` | `[504.36,314.06,155.38,89.19]` | `[0.328358,0.456481,0.101161,0.129630]` |
| main-offer tray | `[1049,345,717,301]` | `[668.02,219.78,456.60,191.75]` | `[0.434909,0.319444,0.297264,0.278704]` |
| main offer 1 card | `[1233,385,163,223]` | `[785.19,245.26,103.80,142.06]` | `[0.511194,0.356481,0.067579,0.206481]` |
| main offer 2 card | `[1419,385,164,223]` | `[903.64,245.26,104.44,142.06]` | `[0.588308,0.356481,0.067993,0.206481]` |
| main offer 1 price | `[1268,321,92,65]` | `[807.48,204.49,58.59,41.41]` | `[0.525705,0.297222,0.038143,0.060185]` |
| main offer 2 price | `[1456,322,92,64]` | `[927.20,205.13,58.59,40.77]` | `[0.603648,0.298148,0.038143,0.059259]` |
| voucher tray | `[801,696,481,313]` | `[510.09,443.38,306.31,199.39]` | `[0.332090,0.644444,0.199420,0.289815]` |
| voucher card artwork silhouette | `[994,741,142,224]` | `[633.00,472.04,90.43,142.70]` | `[0.412106,0.686111,0.058872,0.207407]` |
| voucher price | `[1018,678,95,62]` | `[648.28,431.91,60.50,39.50]` | `[0.422056,0.627778,0.039386,0.057407]` |
| booster tray | `[1289,697,455,313]` | `[820.86,444.01,289.75,199.39]` | `[0.534411,0.645370,0.188640,0.289815]` |
| booster 1 artwork silhouette | `[1330,711,174,284]` | `[846.97,452.93,110.81,180.92]` | `[0.551410,0.658333,0.072139,0.262963]` |
| booster 2 artwork silhouette | `[1530,711,177,284]` | `[974.33,452.93,112.72,180.92]` | `[0.634328,0.658333,0.073383,0.262963]` |
| booster 1 price | `[1371,658,95,56]` | `[873.07,419.17,60.50,35.67]` | `[0.568408,0.609259,0.039386,0.051852]` |
| booster 2 price | `[1575,658,95,56]` | `[1002.99,419.17,60.50,35.67]` | `[0.652985,0.609259,0.039386,0.051852]` |
| owned joker visible card | `[1087,36,164,224]` | `[692.22,22.93,104.44,142.70]` | `[0.450663,0.033333,0.067993,0.207407]` |
| owned consumable visible card | `[1799,39,150,222]` | `[1145.63,24.84,95.52,141.42]` | `[0.745854,0.036111,0.062189,0.205556]` |
| joker count label | `[743,264,50,24]` | `[473.15,168.18,31.84,15.29]` | `[0.308043,0.244444,0.020730,0.022222]` |
| consumable count label | `[2024,269,50,24]` | `[1288.92,171.36,31.84,15.29]` | `[0.839138,0.249074,0.020730,0.022222]` |
| deck top visible card | `[1901,764,175,223]` | `[1210.59,486.70,111.44,142.06]` | `[0.788143,0.707407,0.072554,0.206481]` |


The two main offers are a compact centered pair inside a much wider upper-right tray; do not stretch them across that tray. Next Round and Reroll are stacked in its upper-left column. Lower left is the voucher tray, lower right is the two-booster tray. Prices are dark plaques centered above each offer and may extend beyond their tray top. The shop sign occupies the existing left HUD blind/status region rather than a header above the shop body.

Visible screenshot02 data: main prices `$6` and `$9`, voucher `$10`, boosters `$4`/`$4`, reroll `$5`; owned counters `1/5` and `1/2`; run money `$13`; ante2, round2, hands4, discards4; deck52/52. These are state examples, not hardcoded pricing or inventory requirements.

Owned areas remain at the top of the field and outside the shop body. Screenshot02 places a single joker near logical center `(744,94)` and a single consumable near `(1193,95)`. Their full empty-area rectangles have no visible boundary and cannot be measured from this screenshot. Existing `layout.js` rectangles `[469,20,681,146]` and `[1210,20,212,146]` are explicitly inferred and do not prove the shop-owned consumable center; the latter needs checking before reuse. Screenshot12 shows two owned jokers distributed at roughly logical centers632 and852, with the same consumable position. Count labels remain near logicalx475 and1290. Reuse count anchors only after reference verification, and never use the right-side counter anchor as the single-card center.

## Exact APK layout constraints

These are Lua game/UI units, not screen pixels. No global pixels-per-unit constant is inferred from them.

- `G.UIDEF.shop()`, UI_definitions.lua line666: main CardArea width is `joker_max * 1.02 * CARD_W`, height `1.05 * CARD_H`, type shop, highlight limit1. `game.lua` initializes joker_max2. Its parent tray has minimum width8.2, padding0.2 and radius0.2.
- Voucher CardArea: width `2.1 * CARD_W`, height `1.05 * CARD_H`, card_limit1, highlight limit1. Lower-left outer cell padding0.15; inner cell padding0.2, max height `voucherArea.h + 0.4`. A vertically oriented ante-voucher label appears to its left, text scale0.45.
- Booster CardArea: width `2.4 * CARD_W`, height `1.15 * CARD_H`, card_limit2, highlight limit1; card spacing width `1.27 * CARD_W`. Its enclosing lower-right cell padding0.15.
- Upper-row padding0.05; actions column padding0.1. Next Round minimum2.8×1.5, Reroll minimum2.8×1.6; both radius0.15. Both use two text rows with max width1.3 and internal padding0.07. Next Round labels scale0.4; reroll label0.4, dollar0.7, cost0.75.
- Empty spacer row between upper and lower sections has minimum height0.2. Lower row padding0.1. Shop outer column padding0.1, emboss0.05, radius0.1.
- Sign sprite dimensions4.4×2.2. Inner sign panel minimum4.72×3.1, padding0.1; enclosing root padding0.1. The sign anchors to HUD `row_blind`, center alignment, offset changes fromy−15 to0 on entry.
- `game.lua` lines3420–3427: shop box anchors to hand with `tmi`, offset starts `{x=0,y=ROOM.y+11}` and settles at `{x=0,y=-5.3}`. These are engine-relative alignment offsets, not CSStop positions. When a pack opens, shop offset moves back to `ROOM.y+11`.
- `cardarea.lua` lines501–509: shop cards have rotation0 and center vertically in their CardArea; selected cards subtract `HIGHLIGHT_H`. Horizontal spacing derives from area width, card spacing width, current count and temp_limit; voucher card_limit1 applies an extra half-width correction to center the sole card.
- `create_shop_card_ui`, lines853–924: price plaque inner minimum1×0.55, padding0.03, radius0.1, text scale0.5; outer minimum width0.6 and height1, padding0.05. Price box anchors `tm` to the card, final y offset0.38 for nonboosters and0.5 for boosters.
- Buy/Redeem/Open box anchors `bm`, offsety−0.3; minimum width1.1, maximum width1.3, minimum height0.94, padding0.1, radius0.08. Voucher Redeem label scale0.4, booster Open0.5, Buy0.5. Consumables additionally create Buy-and-Use to the card's right, with minimum1.1×1.1. This specifies selected-state controls, not their screenshot pixel coordinates.

## Existing UI integration points

`src/ui/post-round.js` currently renders cashout and a placeholder shop in the same `#post_round`. It caches only `currentPhase`, returning when the phase is unchanged. Real shop purchases/rerolls happen without changing phase, so a shop renderer must refresh state within shop; retaining that early return unchanged would leave prices, stock, money-dependent actions and owned inventory stale.

The current `#post_round` geometry in `web/styles.css` is `[515,214,594,474]`, a cashout panel, which does not match the shop reference `[483.34,207.04,654.65,480.96 clipped]`. Use a distinct shop body style or renderer. Do not overwrite the cashout rectangle to approximate both screens. Shop actions should use existing app dispatch flow rather than inventing engine state in the view. `renderPostRound` currently receives only a cashout callback, so actual actions need explicit integration through `src/ui/app.js`.

`hiddenIds` already hides the active-blind panel, hand, play/discard and sorting controls while shop/cashout is visible. Left HUD counters, deck and top owned areas remain present. The sign needs a shop-specific HUD overlay in the former blind-panel rectangle. Existing Rubik/fieldstyleB surface primitives may style all shop cards, plaques, trays and controls without copying original artwork.

## Unknowns and acceptance boundaries

- No supplied inspected screenshot shows a highlighted shop offer, purchase/open/redeem controls, Buy-and-Use popup, tooltip, sold voucher, bought booster gap or a rerolled shop. APK constraints are available, but exact screenshot pixel geometry for those states is not established.
- Empty/full owned-area boundaries and precise positions for every inventory count are not established by screenshot02. APK CardArea alignment supports a derivation, but projected screen positions require room/card-unit mapping or a live source rendering.
- Full shop outer height below the captured screen and dewarped geometry before CRT shader are not recoverable exactly from a single distorted JPEG. Manual measurements are a bounded reference, not exact engine coordinates.
- A formal visual acceptance run should match the supplied screenshot aspect ratio, use the same coordinate origin, overlay structural boxes, compare main offer centers, actions, price anchors, trays and owned-card positions, and report residual differences. Original texture/art/CRT pixels are outside the approved own-art design.
