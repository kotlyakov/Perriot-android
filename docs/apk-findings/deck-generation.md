# Initial plain deck and blind draw — APK reference, 2026-10-08

Scope: fresh explicitly seeded non-challenge white-stake Red or Blue deck, no starting Joker, unchanged base52 cards, no modifiers or skip. Original APK SHA256 `6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd`. Static source plus isolated original shuffle/RNG oracle; full Android game not executed.

## Canonical construction and shuffle

1. `assets/game.lua:302-355` lists52 plain card prototypes.
2. `assets/game.lua:2537-2572` collects normal prototypes, applies applicable deck/challenge filters, **sorts concatenated suit+rank+enhancement+edition+seal lexicographically**, then creates each via `card_from_control`.
3. For plain52 this means suits **C,D,H,S**, each with ranks **2,3,4,5,6,7,8,9,A,J,K,Q,T**. This is ASCII order, not numeric rank order. Prototype-table `pairs` iteration is irrelevant after explicit sort.
4. `assets/functions/misc_functions.lua:1610-1616` increments playing_card, constructs Card, emplaces in deck. `assets/card.lua:24-25` increments sort_id on every Card creation. Card relative sort_id order thus matches canonical prototype order even when global IDs include unrelated UI cards.
5. `assets/cardarea.lua:32-36` emplaces deck cards at index1, reversing deck physical array during creation. But **every pseudoshuffle first sorts by ascending sort_id** (`assets/functions/misc_functions.lua:209-220`). The reversal and previous shuffle order are erased before random swapping.
6. `assets/game.lua:2577-2583` performs a starting shuffle using default `CardArea:shuffle()` -> mutable key `shuffle` (`assets/cardarea.lua:578-581`).
7. `pseudoshuffle` reseeds native math.random from that keyed value, then Fisher–Yates i=52 down to2 inclusive, j=math.random(i). Exactly51 random draws for52 cards.

Never start shuffling a suit/rank-numeric sorted deck unless it matches sort_id canonical construction. Never reshuffle an already-shuffled array without original sort_id sort.

## First selected blind and gap draws

`assets/functions/button_callbacks.lua:2608-2650` selects the offered blind and queues `new_round()`; selecting increments round separately. `assets/functions/state_events.lua:313-373` resets hands/discards, sets blind and Joker hooks, then changes to DRAW_TO_HAND and executes `G.deck:shuffle('nr'..ante)`. Ante1 uses **nr1**, a different mutable key from initial **shuffle**.

In this scoped new run nr1 is first advanced here. It reseeds global RNG, so unrelated earlier poll consumption does not change first nr1 permutation. The nr1 seed depends on run seed and own saved key state. Plain Small Blind contributes no additional draw RNG; no Jokers/modifiers in this scope. Red/Blue differ in hands/discards, not hand size or deck shuffle.

`assets/functions/state_events.lua:375-397` fills min(deckCount, handLimit-currentHandCount), standard initial8 cards. `assets/cardarea.lua:66-79` removes the **last** array entry from a deck; top-to-bottom draw order is therefore reversed suffix of shuffled array. `assets/functions/common_events.lua:388-428` queues individual transfers and sorts destination hand after every arrival. `assets/cardarea.lua:585-593` uses configured descending rank or suit sorting; `assets/card.lua:951-955` normal rank ordering includes suits S>H>C>D. The fixture records **deal order**, not user-configured presentation order.

After playing/discarding n cards, replenish n empty slots by repeatedly popping remaining deck; do not shuffle for an ordinary gap draw. Existing hand cards close gaps and new cards are sorted on arrival. A hypothetical three-card gap draw is included as next3 deck pops, irrespective of which original cards were played.

## Subsequent blind in same ante

After cards are returned between rounds, next new_round again invokes **nr1**, advancing this SAME key a second time. Sorting by original sort_id restores canonical52 before shuffle. Initial `shuffle` and cashout shuffle (`assets/functions/button_callbacks.lua:3013`, keycashout1) are distinct keys and do not advance nr1. Fixtures include second nr1 permutation/deal for an unchanged deck. Modified/destroyed/added cards change actual canonical list and size; then draw count becomes n-1.

## Checked own oracle

- `scripts/reference-rng/generate-deck-fixtures.py`
- `scripts/reference-rng/deck-fixtures.json`

Original RNG/shuffle functions are temporarily extracted outside repo, called using pinned official LuaJIT2.1.1700008891, then deleted. Own harness constructs proven canonical52 objects and models documented pop operations. Fixture seeds are **AAAAAAA1**, **PIERROT1**, **12345678**. Interpreter and JIT-enabled modes match exactly. For every seed fixture includes canonical52, initial shuffled52, first nr1 shuffled52, initial8 deal order, remaining44, next3 refill, and second nr1 initial8 deal.

Reproduce:

```sh
python scripts/reference-rng/generate-deck-fixtures.py --apk /path/to/reference.apk --luajit /path/to/pinned/luajit --output /tmp/deck-fixtures.json
```

## Remaining scope gates

- Full APK runtime screenshot/trace confirmation remains unperformed; isolated numerical proof is not full integration parity.
- Starting Joker decks, Erratic, Abandoned, challenge decks, custom starting cards, altered editions/seals and destroyed cards need own canonical identity handling and fixtures.
- Blind/Joker effects that modify hand limit, face orientation or cards before/while dealing need ordered context implementation.
- Tutorial seed/profile flow and saved-run loading are different paths; loading must preserve saved object sort_id, deck order and keyed state.
- UI sort defaults depend on user settings; comparing displayed first hand must use the same selected sort mode.
