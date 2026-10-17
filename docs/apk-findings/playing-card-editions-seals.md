# Playing-card editions and seals — supplied APK 1.0.1n

Research date: 2026-10-16. Authority: supplied `Balatro_1.0.1n_0.4_25_noPairip.apk`, extracted private `reference-apk/assets`. All source references below use those original files and one-based lines. This document is research, not a claim that these mechanics are implemented. The source hashes pinned by `scripts/reference-rng/generate-scored-retrigger-fixtures.py` identify this same extraction; do not substitute rules from another version/wiki.

## Data and scoring

A playing card can simultaneously have one enhancement, one edition, and one seal. `Card:set_edition` replaces its edition (`card.lua:387–423`); `Card:set_seal` replaces its seal (`464–496`). Changing an enhancement through `set_ability` preserves the other properties; native `copy_card` copies ability, edition, seal and debuff (`functions/common_events.lua:2199–2228`).

| Modifier | Exact effect and trigger | Suppression / cardinality |
|---|---|---|
| Foil | +50 chips | Scoring playing card, every own-effect pass |
| Holographic | +10 Mult | Scoring playing card, every own-effect pass |
| Polychrome | ×1.5 Mult | Scoring playing card, every own-effect pass; retain exact fractional Mult until final floor |
| Gold seal | +$3 | Scoring playing card, every own-effect pass; no held/end-round payout from the seal |
| Red seal | +1 repetition | Scored own+individual pass; held/end-round pass only if the initial pass has an effect |
| Blue seal | Create the Planet for the **last played** poker hand | Held at successful end of round, when a consumable slot is available |
| Purple seal | Create one random Tarot | Discarded card, when a consumable slot is available |

Edition constants: `game.lua:660–663`; `Card:get_edition`, `card.lua:1018–1033`. Edition and all seal effect entry points return empty/zero when the card is debuffed (`1019`, `1035`, `1070`, `2246`). A debuffed hand skips scored/held processing through `evaluate_play`'s outer branch; the actual last-hand assignment occurs before that branch (`functions/state_events.lua:597`). Editions do not change recognition, rank or suit. Held Foil/Holographic/Polychrome have no scoring effect: `eval_card` only requests `get_edition` for `G.play`, not `G.hand` (`functions/common_events.lua:583–650`).

Playing-card own effect application order is chips → Mult → play dollars → dollars/extras → enhancement ×Mult → edition, followed by individual Joker entries. Own evaluation obtains Lucky rolls before application. The edition belongs to the card's own entry; therefore it applies **before** individual Joker effects, and repeats with the entire own+individual pass (`functions/state_events.lua:713–800`). This differs from Joker-edition timing: Joker Foil/Holographic occur before its independent effect, Joker Polychrome after (`900–963`). Glass destruction remains one check per physical scoring card after all repeats, not per pass (`965–1002`).

`get_p_dollars` sums Gold seal $3 and a successful Lucky $20 into one native return; that can be $23, with `dollar_buffer` updated before independent money Jokers (`card.lua:1069–1091`). Gold seal and Red seal cannot coexist on one card, but Gold seal repeats via Dusk/Hack/Sock/Chad and Red seal repeats Lucky or a Gold **enhancement**.

## Repetition contexts and order

Scored queue: initial pass, then one Red-seal pass, then all admitted Joker repetitions in owned Joker order (`functions/state_events.lua:687–712`). Queue discovery occurs once. Each pass recalculates own and individual effects; it does not recursively discover more repetitions. Non-scoring cards receive neither editions nor Gold/Red seal scored effects unless Splash promotes them to scoring. A boss-debuffed physical card receives none.

Held scoring queue: calculate initial held own and individual Joker effects; schedule Red only if own result is nonempty or an individual Joker result exists. Then schedule held repetition Jokers. Steel ×1.5 and held individual effects repeat; a plain Red-sealed card with no held effect does nothing (`819–852`). Editions and Gold seal alone are not held effects.

End-round queue uses the same initial-effect gate and source order (`201–228`). Gold enhancement held payout ($3) repeats with Red. Blue creation returns `effect=true` only when a slot is reserved, so future Mime repeats Blue creation only while capacity permits. Red and Blue cannot coexist. End-round held effects run only on the successful/non-game-over branch, after end-round Joker/rental/perishable processing (`87–145`, `192–255`). No held Gold/Blue payout on an ordinary loss. Cloned dispatcher settlement should commit once before animation; reload must not rerun it.

## Blue creation and exact Planet identity

`Card:get_end_of_round_effect` (`card.lua:1034–1066`) checks `#G.consumeables.cards + G.GAME.consumeable_buffer < G.consumeables.config.card_limit`, increments the buffer synchronously, queues a `before` callback, and marks the result as an effect. The callback maps `G.GAME.last_hand_played` through `G.P_CENTER_POOLS.Planet` and calls:

`create_card('Planet', G.consumeables, nil, nil, nil, nil, forcedPlanetKey, 'blusl')`

It then adds/emplaces the card and resets the shared buffer to zero. No random Planet-selection roll, Soul roll, Black Hole roll or edition roll occurs for an ordinary unbanned forced Planet. Forced key bypasses used-card exclusion and Planet softlocks. A banned forced key falls through to ordinary Planet pool selection (`functions/common_events.lua:2149–2164`): do not silently assume bans cannot matter. If `last_hand_played` is absent, the queued callback creates nothing and does not reset the buffer; this is a literal native edge, not a reason to invent a default hand. Normal successful play establishes the value.

| Native hand name | Forced centre |
|---|---|
| High Card | c_pluto |
| Pair | c_mercury |
| Two Pair | c_uranus |
| Three of a Kind | c_venus |
| Straight | c_saturn |
| Flush | c_jupiter |
| Full House | c_earth |
| Four of a Kind | c_mars |
| Straight Flush (including Royal) | c_neptune |
| Five of a Kind | c_planet_x |
| Flush House | c_ceres |
| Flush Five | c_eris |

Catalogue source: `game.lua:558–569`. Ordinary generated Planet has base cost $3/sell $1 before existing discount, inflation, Astronomer pricing modifiers. Creation does not count as using a consumable and must not replace `lastTarotPlanet` (Fool's last-used identity). Do not use `mostPlayedHand` or the previous consumed Planet as the Blue target.

## Purple creation, capacity and discard

`Card:calculate_seal` (`card.lua:2245–2274`) reserves the same shared buffer and queues:

`create_card('Tarot', G.consumeables, nil, nil, nil, nil, nil, '8ba')`

No `soulable` flag: The Soul cannot appear from Purple. No edition poll for non-Jokers. Native Tarot pool excludes already-used/owned centres without Showman, respects locks/bans/flags, preserves `UNAVAILABLE` positions, uses Strength fallback for empty pool, and retries unavailable picks with `_resample2`, `_resample3`, etc. (`functions/common_events.lua:2002–2090`, `2121–2196`). Selection stream is **`Tarot8ba<ante>`**, then `Tarot8ba<ante>_resampleN`; the High Priestess/Emperor `pri`/`emp` keys are incorrect here.

Discard order is left-to-right after highlighted sorting; seals execute before each discarded card's individual Joker discard effects. Seal invocation is unconditional with respect to `hook`, so Hook forced discard also triggers Purple (`functions/state_events.lua:400–431`). A Purple card destroyed by a discard Joker still triggers its seal first. No retrigger discovery occurs for discards: Red does not repeat Purple (one seal anyway) or discard effects. Played cards simply going to discard after scoring do not call this discard-seal path. Capacity includes existing Negative-consumable slot expansion through the area's limit; reservations prevent multiple simultaneous Purple/Blue requests from exceeding the shared limit. Reserve all qualifying requests before executing queued creation callbacks, otherwise later requests may observe newly created cards instead of the native shared buffer.

## Negative boundary and RNG scope

Supported production playing-card editions are base/Foil/Holographic/Polychrome. Standard pack (`card.lua:1761–1777`) and Aura (`1196`) pass `_no_neg=true` to `poll_edition`; Negative is used for Joker/consumable slot expansion. The low-level `set_edition` itself does not reject a Negative playing card; reject unsupported production categories at clone validation/capability boundaries, not by claiming the native setter enforces this.

Red, Gold and scored edition calculation add no keyed RNG. Repeated Lucky still consumes `lucky_mult`, then `lucky_money` each pass; repeated Stone predicates retain every existing raw getter draw. Blue unbanned forced identity consumes no pool RNG. Purple selection consumes `pseudoseed` + reseeded integer `math.random(poolSize)` per attempt (`misc_functions.lua:256–272`, `301–332`). Both created cards' native constructor consumes three raw `math.random` draws for discard rotation/x/y (`card.lua:46–50`). Materialization synchronously calls `juice_up` once (one raw draw; `card.lua:4340–4346`), then schedules more events. Discover/unlock, visual status text, materialization callbacks and frame updates can cause additional draws: a generator that stubs/dequeues them must label its exact boundary. Existing scored oracle deliberately excludes deferred events and cannot alone certify Blue/Purple creation chronology or complete frame parity.

## Current project touchpoints and recommended tests

- `src/core/score.js`: currently rejects every nonbase playing edition and every seal; extend modifier admission, scored queue (seal before Jokers), own edition timing, Gold money, held Red queue and action-RNG provenance activation. Preserve legacy original-53 replay semantics where needed.
- `src/core/run.js`: explicit `DISCARD` and Hook forced-discard paths; Purple must run at native action chronology, once, not on ordinary postplay discard. Track last played hand independently across `lastScore=null` resets. Ensure success settlement sees the final held hand.
- `src/core/cashout.js:settleRoundSuccess`: existing Gold-enhancement payout, before quote/interest snapshot; add held/end-round repetition and Blue creation once here or a pure dedicated settlement helper. Boss disable can also settle a win without a new hand, so last played hand must survive that path.
- `src/core/apk-shop.js:generateApkTarotConsumables`: reusable pool/constructor session logic, but currently fixes append keys to `emp`/`pri` and adds used-Tarot juice; add a separate precise seal creation entry rather than reusing incorrect chronology.
- `src/core/apk-deck.js`: creation/copy field allowlist currently omits edition/seal. `src/core/consumables.js` Death copy currently copies enhancement only; preserve edition/seal for exact copies. Strength/suit/enhancement edits must preserve the other independent categories.
- `src/persistence/save.js`: card/destruction allowlists, repeat source validation (physical seal source is not an owned Joker), scored-edition phase validation, held provenance, settlement money/recreated consumables and action RNG replay. Reject unknown modifiers and slot overflow; serialize/reload round_won without duplicate payout/creation. Existing decode assumes only Gold enhancement contributes held payout.
- `src/content/card-modifier-display.js` descriptions already exist but explicitly do not enable mechanics. `src/ui/field.js:cardMarkup`, hand renderer, `play-animation.js` reveal path and `deck-view.js` need consistent independent edition/seal data and own artwork. `score-animation.js` must anchor seal repetitions to the physical card rather than owned Joker.
- Native fixtures: extend/reuse pinned-source extraction of `generate-scored-retrigger-fixtures.py` for scored editions/Gold/Red with exact scores, markers and RNG. Add a separate original-function boundary for held/end-round/creation/discard, executing explicitly admitted callbacks in recorded order; do not fake native creation with a JS-derived oracle.

Minimum acceptance matrix: every edition with no-repeat and Red+Chad stacking; edition before individual Mult Joker; non-scoring/debuffed/held nontrigger; Red+Steel/Gold enhancement; Gold seal+Lucky+Bull; Purple normal/Hook, played-not-discarded, full/one/two slots, unavailable retries, owned exclusion and empty pool; Blue all 12 targets, duplicate owned forced target, full slots, multiple requests, banned forced fallback, boss-disable success; Negative consumable expansion; exact copy preservation; save tampering and reload during animation. Mime/Blueprint/Brainstorm/Pareidolia/Seltzer and complete new Standard/Spectral acquisition systems remain separately gated unless the lead explicitly includes them in item6.
