# Independent Task 3 native shop review

Checked 2026-10-08 against the working tree. Scope: the 32 supported native Joker centres, buy/sell/reroll, save validation, shop UI integration and offline export wiring. Read `AGENTS.md`, `APK_REFERENCE_SPEC.md`, the APK shop plan and `docs/ui/shop-apk-layout.md`. This is a partial implementation review, not full-game parity or original Android runtime validation.

## Finding

**P2 — native purchase validation permits malformed metadata and playing-card identity collisions before payment.** `src/core/shop.js` `validMain` and `BUY_SHOP_CARD` check supported entity/edition, price and owned Joker identity, but do not check native `set`/`originalKey` consistency or collisions with `state.cards`. Persistence is stricter.

Reproduced using `createRun('AAAAAAA1', {runId:'review',money:20n,referenceRng:true,referenceShop:true})`, setting its phase/score to a won small blind and dispatching cashout. Replace `shop.main` with `{id:'probe',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:4n,sellCost:2n}` and vary:

| Mutation | Buy result | Save result |
| --- | --- | --- |
| `set:'Tarot'` | Success; money decreases by 4 | Rejects invalid save |
| `originalKey:'j_zany'` | Success; money decreases by 4 | Rejects invalid save |
| `id:'card_clubs_2'` | Success; money decreases by 4 | Rejects invalid save |
| Delete both `set` and `originalKey` | Success; money decreases by 4 | Accepts owned card without native metadata |

These inputs cannot arrive through the validated native save loader or the verified native producer. The app saves before publishing the new state, so the first three cases show a storage error while retaining the prior committed state; this review did not reproduce user data loss or an ordinary-game double charge. Nevertheless the pure transaction result violates the intended malformed-input rejection boundary and makes a future caller unsafe. Require native Joker metadata and centre consistency before buying, retain legacy alias compatibility, and reject identities shared with playing cards before charging.

## Verification and inspection

- Fresh `node --test tests/core/*.test.js`: **195 pass, 0 fail**, exit 0. This includes `native-joker-oracle.test.js`; its original-Lua-method fixture check covers at least 850 supported cases. It validates selected original method outputs, not original Android execution.
- Reviewed score ordering: base hand, each scoring card and owned Joker effects in order, Joker edition before its independent effect, then total. Unknown editions, polychrome, rental, perishable, debuffed Jokers and unsupported playing-card modifiers reject scoring.
- Reviewed cache validation: new `playedCardIds` preserves non-scoring kickers for contains-hand/half-Joker conditions. Loader recomputes totals, scoring order and full trace rather than trusting continuous arbitrary numbers. Legacy traces fall back to their scoring IDs. Existing tests exercise roundtrip and forged trace rejection.
- Reviewed stale action and transaction snapshots: revision check precedes mutation; accepted actions clone state; unsupported content and insufficient funds retain original state/RNG. Negative adds its own capacity, and owned negatives contribute persistent capacity. Eternal sale rejects. No additional valid-state transaction blocker found.
- Reviewed app save ordering: repository save succeeds before state replacement/animations. `busy` prevents repeated live UI dispatch while a purchase/reroll is in flight. Persistence failure retains the old app state. Reroll removes/animates only main offers; voucher/booster state remains.
- Reviewed UI source geometry against measured reference: distinct 655×481 shop body at logical (483,207), compact main pair, voucher/booster trays and owned-area anchors. These are code/reference checks only. Shop tooltip, selection, long press, modal compatibility and four viewport sizes still require the root agent's browser/Actions results. No local browser installation or retry performed.
- Reviewed offline wiring: `web/shop-screen.css` is included by the standalone preview exporter; Android asset preparation copies `src/` and `web/`, which includes the new module and style.

## Explicit remaining boundaries

Only 32/150 native Joker effects are supported. Full original shop pools remain present; unimplemented purchases display a viewing-only notice and do not dispatch purchase. Voucher effects, booster opening/selection, consumable effects, next-blind lifecycle, retriggers, polychrome, rental and perishable handling remain open. Native Next Round is disabled in UI and rejected in core. Task 3 and the overall game must not be marked complete on this review alone.

## Integrator follow-up

Boundary finding reproduced in native purchase refuses broken identity metadata and card-ID collisions before charging (RED). Mandatory native identity/category and playing-card collision precharge guards added; full suite198/198 GREEN. Confirmed ordinary Big Blind transition added after this review; covered by dedicated next-big-blind tests and upcoming browser/Actions regression. Boss,118remaining Jokers and other content still open.
