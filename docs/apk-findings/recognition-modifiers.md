# Four Fingers and Shortcut recognition — 2026-10-14

Authoritative source: uploaded APK native Lua. Only `src/core/hands.js` recognition options are implemented here; root integration must separately detect active supported jokers and pass `{fourFingers, shortcut}` to every scoring/preview/save-replay recognition call. Options default false and require booleans.

## Native contract

- `functions/misc_functions.lua:525-549`: Four Fingers reduces Flush threshold from five to four. Return **all** matching cards for the first qualifying suit, in native priority Spades, Hearts, Clubs, Diamonds. A fifth unrelated card does not score as part of that Flush. Wild can match any suit while active; debuffed Wild falls back to printed suit. Stone never matches a suit (`card.lua:4067-4078`).
- `misc_functions.lua:551-593`: Four Fingers reduces Straight threshold from five distinct ranks to four. Scan Ace-low, ranks 2 through Ace-high. Consecutive occupied rank groups increase length; **every card** at an occupied rank is included, including duplicates. Once threshold is reached retain the first qualifying run until its terminating gap. A fifth card extending the run scores too. An unrelated fifth card does not. Ace cannot wrap King-Ace-2.
- Shortcut allows one missing rank between occupied ranks. Each occupied rank resets the skipped flag, so several separated one-rank gaps are allowed; two consecutive missing ranks terminate the run. Skipping is not allowed at the final Ace-high position. With Four Fingers it recognizes four occupied ranks across these gaps.
- `misc_functions.lua:431-445`: Straight Flush is the **union of independently selected Flush and Straight sets**, not a straight restricted to flush-suited cards. Four Fingers can therefore recognize Straight Flush when the four-card flush and four-card straight differ, and the union can include an off-suit fifth card. It can also exclude an unrelated fifth card shared by neither set.
- `misc_functions.lua:407-424`: Flush Five / Flush House use the independently recognized Flush plus existing same-rank grouping, preserving precedence. A Four Fingers four-suited full house plus an off-suit fifth card is Flush House, and all full-house cards score.
- `functions/state_events.lua:579-585`: Royal display requires Straight Flush whose scoring set contains no rank below 10. With Four Fingers, **10-J-Q-K** of a suit is Royal despite lacking Ace. An unrelated lower fifth card excluded from both sets does not prevent Royal; a lower fifth included in either set does.

The JS result retains the existing public convention of scoring IDs in played-card order. Native get_straight internally groups by ascending scan rank and Straight Flush constructs flush-first union; later scoring orders by card position. Membership is exact, input permutation does not arbitrarily choose a different rank group. This change does not add Splash or automatically score Stone: the existing scoring stage owns those additions.

## Independent oracle and verification

`tests/core/recognition-modifiers.test.js` includes **368** numerical/membership fixtures from original `evaluate_poker_hand`, `get_flush`, `get_straight`, `get_X_same`, `get_highest`, and native `Card:get_id` / `Card:is_suit`, executed under pinned LuaJIT **2.1.1700008891**, upstream commit `43d0a19158ceabaa51b0462c1ebc97612b420a2e`. Fixture inputs are self-contained own data, not copied original code. Cases cover modifier combinations, reversed input order, overlapping/disjoint Straight/Flush membership, duplicated ranks, low/high Ace, illegal wrap, repeated one-rank gaps, excessive gaps, Wild and debuffed Wild, Stone, Flush House and Royal boundaries. An additional **200** fixture rows arise from 50 fixed generated four/five-card inputs across four modifier combinations; total remains 368.

The optional reproduction test extracts original function regions directly from provided APK assets into a temporary file, runs those functions independently, compares every stored fixture, and removes the file. It imports no JS gameplay into the native oracle. Its explicit card adapter supplies `get_nominal` as printed rank (Stone 0); highest-card suit tie-breaking is not asserted here. All modified Straight/Flush membership uses the original native methods. The oracle seeds unkeyed random to 42 before each case; native Stone `get_id` generates negative random values, excluded from Straight. JS recognition does not reproduce those preexisting unkeyed Stone random consumptions; this is an integrated RNG parity limitation, not evidence that Stone participates as a rank.

Reproduce from repo root with source/runtime paths available locally:

```sh
NATIVE_APK_ASSETS=/path/to/reference-apk/assets NATIVE_LUAJIT=/path/to/pinned/luajit node --test tests/core/recognition-modifiers.test.js
```

TDD: the unmodified evaluator failed the new modifier fixtures and option-validation check first. After implementation, all **369** ordinary tests passed; optional native reproduction also passed (**370** total). No Android/LÖVE runtime execution is claimed.

## Integration notes

Recognition must use active effects only: debuffed Four Fingers/Shortcut must not activate. Root owns joker registration and wiring. Joker containment checks must distinguish full played cards from recognized scoring members; use the same options when calling recognition on a candidate subset, but do not conflate a four-card Straight Flush union with five-card same-suit straight logic. Existing save-score recomputation must pass identical recognition modifiers or legitimate resumed hands will be rejected.
