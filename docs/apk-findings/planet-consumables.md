# Planet and Black Hole owned use

Reference: `01-Balatro_1.0.1n_0.4_25_noPairip.apk`. Lua was inspected in scratch research, outside this repository. No original executable Lua or assets are included in this change.

## Exact source behaviour

- `assets/card.lua:1092–1096`: `Card:use_consumeable` records usage before executing the effect (unless a copier), then checks debuff.
- `assets/card.lua:1154–1176`: Black Hole calls `level_up_hand` for every entry in `G.GAME.hands`, including unplayed hidden combinations.
- `assets/card.lua:1265–1268`: a consumable with `hand_type` levels precisely that combination.
- `assets/card.lua:1524–1533`: these are targetless effects. Native use is blocked by play/controller/use locks and transient playing states. The application represents synchronous actions with four stable inventory phases: `blind_selection`, `playing`, `round_won`, `shop`.
- `assets/functions/common_events.lua:467–471`: default increment is one. Chips and Mult are recomputed from base plus per-level gains; existing scoring already derives them from `handLevels`. Levelling does not increment play counts or make hidden poker combinations played/discovered. The unlock check at lines 492–496 is a separate profile system.
- `assets/functions/button_callbacks.lua:2303–2316`: removes the owned card, executes its effect, then dispatches `using_consumeable` to owned Jokers. None of the currently supported Jokers has a reaction to these effects. Future Constellation support must implement the native reaction (`assets/card.lua:2730–2736`), not just scoring from usage count.

Catalogue `handType` is mapped through `APK_HAND_NAMES`, rather than deriving a hand from planet spelling/order:

| Centre | Hand |
| --- | --- |
| c_pluto | high_card |
| c_mercury | pair |
| c_uranus | two_pair |
| c_venus | three_of_a_kind |
| c_saturn | straight |
| c_jupiter | flush |
| c_earth | full_house |
| c_mars | four_of_a_kind |
| c_neptune | straight_flush |
| c_planet_x | five_of_a_kind |
| c_ceres | flush_house |
| c_eris | flush_five |

## Transaction contract

`canUseConsumable(state, card)` is read-only and returns `{available, code, reason}`. It requires owned card identity, known catalogue/set/originalKey, stable phase, exact safe hand levels/counters, and a refreshable APK duplicate context. It enables only all twelve Planets and `c_black_hole`; Tarot and other Spectral cards remain unavailable. UI purchase previews must separately account for ownership (the capability query is for an owned card).

`applyConsumableAction(state, {type:'USE_CONSUMABLE', cardId, expectedRevision})` returns `{state, events, error}`. It validates revision itself, so direct calls are safe. Rejection returns the identical original state and an empty event list. Success clones state, consumes one owned card, increments revision once, clears `lastScore`, refreshes shop duplicate eligibility, and emits `consumable_used`, `hand_level_changed` for every affected hand, and `consumable_usage_changed`. No RNG draw, hand discovery, inventory limit, playing-card zone, money or round counter changes occur. Unbought duplicate shop offers continue to block duplicate eligibility after consumption.

## Usage state and integration

`assets/functions/misc_functions.lua:1192–1235` specifies both profile usage and run usage. The implementation preserves exact run fields with application naming:

| Application field | Native field | Value |
| --- | --- | --- |
| consumableUsage | G.GAME.consumeable_usage | map centre key to `{count,order,set}` |
| consumableUsageTotal | G.GAME.consumeable_usage_total | `{tarot,planet,spectral,tarot_planet,all}` counts |
| lastTarotPlanet | G.GAME.last_tarot_planet | last used Tarot/Planet centre key or null |

Planet increments `planet`, `tarot_planet`, `all` and updates `lastTarotPlanet`; Black Hole increments `spectral`, `all` and preserves the previous last Tarot/Planet. Native last-key update occurs through nested immediate animation events; the synchronous transaction commits the equivalent final state. Safe integer overflow rejects the complete action.

Old save versions never implemented consumable use. Omitted usage fields therefore migrate to zero usage on first use; this is based on the known previous implementation, not an assumption about arbitrary foreign saves. New-run initialization and persistence validation/roundtrip of these fields are dispatcher/save integration responsibilities. Existing consumable ownership format remains unchanged. Per-centre `count`, `order`, and `set` retain enough data for future run usage; do not replace usage with hand levels. Native most-used Planet statistics are profile statistics: `assets/functions/UI_definitions.lua:2539–2559` reads `G.PROFILES[G.SETTINGS.profile].consumeable_usage`, filters keys by catalogue set `Planet` and discovered centres, sorts descending by `count`, then renders the top ten. Native sorting does not define a tie-breaker. Therefore run usage alone must not be displayed as a lifetime most-used statistic; profile persistence is still required. Satellite counts distinct Planet keys (`assets/card.lua:910–912`, `1670–1677`), rather than total uses. Global profile usage (`{count,order}`), card-centre discovery, settings save and upgrade unlocks remain profile integration work, separate from poker hand discovery.

The implementation owns only `src/core/consumables.js`, `tests/core/planet-consumables.test.js`, and this report. Parent integration must route dispatch, wire owned use and buy-and-use, and validate/save the three new fields.

## Verification

Seventeen tests cover the independent twelve-hand mapping, Black Hole hidden levels, normal/locked phases, unsupported effects, exact usage count accumulation, stale retry/double consumption, malformed action/identity/state, revision/level/counter overflow, unchanged input/RNG/round/money/slots/discovery, and duplicate-shop context refresh. Initial capability stubs failed every test, then implementation passed all sixteen; an additional case verifies unbought offers and Spectral counter overflow. At the time of module completion, `npm test` passed 287/287 tests.

## Integrated verification — 09.10.2026
Dispatcher routes USE_CONSUMABLE; shops buy supported Planets/Black Hole into their own two-slot inventory (negative cards supply a slot). Usage and totals are persisted and mutually checked; omitted old fields migrate on first use. Debuffed cards match native consume+count without levelling, including maximum safe hand levels. Selected owned cards expose Use; selling remains right-side drag. Neutral level increments are bold. New browser and feedback suites pass locally with exploratory Chromium; official Android CI remains pending. Profile persistence, packs, original use/level animations and buy-and-use convenience are not complete.
