# Shop transaction foundation — APK reference

This module is a transaction layer, not a complete original shop. It accepts already-generated offers; it does not generate a substitute pool or claim original seeded RNG parity. Source priority and trace: `APK_REFERENCE_SPEC.md`, sections Buying a normal shop card, Sell value / selling, Reroll price state machine, Leaving shop. Reference APK version: `1.0.1n-FULL [M]`.

## Contract

`src/core/shop.js` exports:

- `createShop({offers, rerollBase = 5n, freeRerolls = 0})`: returns independent cloned state `{main, vouchers, boosters, rerollBase, rerollIncrease: 0n, freeRerolls}`. `offers` supplies ordered arrays. Every record needs unique nonempty string `id` across all three areas. Main records additionally require `entityId`, nonnegative BigInt `cost` and `sellCost`. Voucher/booster metadata is preserved without reinterpretation.
- `getRerollCost(shop)`: returns `0n` while free uses remain; otherwise `rerollBase + rerollIncrease`.
- `hasJokerSpace(state, offer)`: checks default five base slots, optional integer `state.jokerSlots`, owned `edition: 'negative'` extra slots and the incoming Negative card's own extra slot. This helper is future-compatible; actual acquisition of modifiers remains blocked until scoring supports them.
- `applyShopAction(state, action, {refill, nextRound} = {})`: returns dispatcher-compatible `{state, events, error}`. Errors retain the exact original state reference and produce no events. All successful actions clone input, increment revision and clear `lastScore`.

Required outer state: `phase: 'shop'`, safe nonnegative `revision`, BigInt `money`, unique-ID `jokers`, `shop`; optional BigInt `bankruptAt` defaults `0n`. `rng.shop` is a serializable Counter32 RNG record for rerolls. Existing deck/effects RNG streams are retained. Root save codec must explicitly persist/validate shop prices, owned sell values and the shop RNG; this module does not modify SaveData.

Actions all require current `expectedRevision`:

| Action | Fields | Outcome |
|---|---|---|
| `BUY_SHOP_CARD` | `offerId` | Transfers a supported main-area Joker in offer order, removes exactly its shop record, charges its stored price once |
| `SELL_JOKER` | `jokerId` | Rejects Eternal, credits stored `sellCost`, removes the owned instance |
| `REROLL_SHOP` | — | Replaces main only, retains vouchers/boosters, charges current tier, consumes exactly one free use or advances paid tier by `1n` |
| `LEAVE_SHOP` | — | Requires explicit verified `nextRound`, resets zones/score and enters blind selection without shuffling/starting it |

Refill contract: pure synchronous `refill({rng, offers}) -> {main, rng}`. Inputs are independent clones; producer output is validated before money or RNG changes. Caller owns verified pool selection and instance ID generation. Producers must not use external I/O or `Math.random`. Failure/malformed output yields `INVALID_REFILL`; no producer yields `REFILL_UNAVAILABLE`. Full original RNG stream mapping is pending.

Next round contract: caller supplies `{blindId, ante, target: bigint > 0n, score: 0n, handsRemaining, discardsRemaining, handSize, ...}` in options `nextRound`. Absence/invalid config yields `NEXT_BLIND_UNAVAILABLE`; the module never pretends to progress by reusing the current blind. Integrator owns source-verified target/counter/boss configuration.

Events: `shop_card_bought {offerId,jokerId,cost}`, `joker_sold {jokerId,sellCost}`, `shop_rerolled {cost,offerIds,nextCost}`, `shop_left {nextBlindId}`, plus `money_changed {before,after,delta}` for economic actions. UI consumes these for animation; no frames affect results.

## Verified rules and limits

- RULE-SHOP-TX-001: phase/revision guards and clone-before-commit prevent repeated purchases and repeated charges.
- RULE-SHOP-TX-002: `money - bankruptAt >= cost`, with explicit free-cost exception, shared with `shop-pricing.js`.
- RULE-SHOP-TX-003: owned stored sell value survives coupon purchases; do not recompute from zero purchase price. Eternal sale is rejected.
- RULE-SHOP-TX-004: rerolls preserve secondary areas; free rerolls do not advance paid tier. Default paid prices 5, 6, 7... .
- RULE-SHOP-TX-005: next-round entry is a separate verified integration boundary, not automatic same-blind restart.

Only `SUPPORTED_JOKERS` already implemented by the scoring engine may be acquired. Rental, Perishable, debuffed and non-base editions are rejected before charging. Active inflation is rejected until atomic price recalculation is implemented. No buy/use consumables, redeem vouchers, opening booster packs, selling-self contexts, other-joker callbacks or boss-sale interactions are claimed. The four supported Jokers have no such transaction hooks; they are the explicit intermediate slice. Full shop effects/catalog/pool generation remain roadmap tasks, not replaced by a fabricated four-card pool.

## Test evidence

`node --test tests/core/shop.test.js`: 11 transaction cases. Initial RED: absent module (`/tmp/shop-red.log`); after implementation GREEN. Covers stale revision/double buy, missing offers, unsupported effects, bankruptcy/free prices, ordinary/Negative capacity, Eternal/coupon sale, paid/free reroll tiers, area preservation, RNG reproducibility after independent state clone, producer failure/mutation isolation, explicit next-blind config and factory input aliasing.
