# Conditional APK shop generator — 2026-10-08

Own implementation: `src/core/apk-shop.js`. Selection metadata: `src/content/apk-shop-catalog.js`. The catalogue contains factual centre keys, names, ordering, prices, rarity, lock defaults, prerequisite/flag/enhancement gates, compatibility, and pack weights. Its source APK hash is recorded in that file. Original Lua is executed only in a temporary directory by `scripts/reference-rng/export-shop-catalog.py`; no original source or artwork is copied into the repository.

The pools include 150 Jokers, 22 Tarot, 12 Planet, 18 Spectral, 32 Voucher, 32 Booster variants, and 8 enhancements. Missing/locked/duplicate/gated centres keep `UNAVAILABLE` positions before rejection sampling; an entirely unavailable pool uses the APK's fallback. Voucher prerequisite chains require every prerequisite and profile unlock. Owned Showman bypasses duplicate exclusion. Booster selection uses the full ordered weighted pool.

## Contract

- `createApkShopContext(options)` returns a JSON-serializable copy. Defaults are ante1, ordinary rates20/4/4/0/0, full edition, fresh profile locks, no ownership/vouchers/bans/flags/enhancements, motion enabled, inflation0/discount0, two main/two booster positions. The caller must supply actual played-hand/profile/run state.
- Context fields: `ante`, `reducedMotion`, `playedHands`, `ownedCentreIds`, `usedCentreIds`, `usedVoucherIds`, `shopVoucherIds`, `bannedCentreIds`, `unlockedCentreIds`, `lockedCentreIds`, `enhancementIds`, `poolFlags`, `editionRate`, `inflation`, `discountPercent`, `mainSlots`, `boosterSlots`, `modifiers`, `rates`, `visibleHandOrder`, optional `tutorialShopSurcharge`. Unknown fields and malformed values reject. Rates accept Joker/Tarot/Planet/Base/Spectral only; numeric money inputs here must be safe integers. Prices returned are bigint.
- `chooseApkVoucher(rng, context)` returns `{voucherId,rng}`. Invoke at start_run and retain that result; entering the shop does not select a new voucher.
- `generateApkShop(rng,context,{voucherId,firstShopBuffoon=false,instancePrefix='shop'})` returns `{offers:{main,vouchers,boosters},rng,firstShopBuffoon}`. Explicit `voucherId:null` means the already redeemed voucher area remains empty; omitted voucherId rejects. Caller supplies a unique prefix for each creation event and must persist `firstShopBuffoon`.
- `rerollApkShop(rng,context,{previousMain=[],instancePrefix='reroll'})` returns `{main,rng}`. It clears the previous main identities from temporary used-centre flags while retaining owned copies. Voucher and booster areas are outside this return value; the transaction layer retains them. The caller supplies currently occupied voucher identities in `shopVoucherIds` when selecting another voucher.
- Offers contain `id`, original centre `entityId` and `originalKey`, `set`, edition string (`base`, `foil`, `holographic`, `polychrome`, `negative`), and bigint `cost`/`sellCost`. Conditional sticker/front/To Do fields are included when applicable. These factual original centre IDs require an explicit supported-effect mapping in the transaction/scoring layer before buying becomes supported.

## Evidence

`node --test tests/core/apk-shop.test.js`: 17 passing tests. All six original conditional fixture cases (AAAAAAA1, PIERROT1, 12345678 × motion normal/reduced) compare every first-shop main/voucher/booster and reroll main centre, set, edition, buy/sell price. Final keyed stream maps compare exactly. Both first-shop and reroll global `math.random` states compare exactly against an independent replay of every original native trace draw/reseed; replay also verifies every native trace value. Cosmetic draws in immediate Card construction/materialization/reroll juice and the first forced Buffoon variant are retained.

Further tests cover full catalogue counts, hidden-hand softlocks, combined unlock/enhancement gates, banana extinction flags, Showman duplicate bypass, upgraded voucher prerequisites and occupied voucher exclusion, immutable inputs, unique instance IDs, malformed context rejection, explicit redeemed voucher absence, and the original first-Buffoon normal2-ban exception. `npm test`: 155 passed, zero failures at this checkpoint. npm emits its environment http-proxy configuration warning.

Re-export:

```sh
python scripts/reference-rng/export-shop-catalog.py --apk /private/path/reference.apk --luajit /private/path/luajit --output src/content/apk-shop-catalog.js
```

## Limits

This is a conditional selection foundation, not full Android/original-game execution or a complete shop UI/effect implementation. No tutorial forced-card list, tag effect callbacks, challenge/FTP/demo pool changes, deferred rendering/audio events, non-seeded unlock side effects, save-area loading, or purchased/opened booster-position restoration is reproduced here. Unknown context fields/modifiers reject instead of silently treating those paths as ordinary generation.

The verified oracle uses fresh meta, explicitly seeded White/Red ante1, no modifiers/tags/owned content, base deck, High Card played once, ordinary hands visible and hidden hands unplayed. Other pool gates are tested against documented factual conditions but have not yet received equally comprehensive original fixtures. Playing-card fronts and Illusion paths, all stake sticker paths, and To Do List initialization are implemented from the observed contract but are outside the six fixture cases. `visibleHandOrder` must be the original Lua table iteration order for the actual run when To Do List is eligible; default order records the fresh oracle's ordinary-hand order and cannot establish arbitrary profile/runtime order parity. Immediate RNG handling is verified, while later asynchronous animation consumption belongs to integration/device traces. Catalogue completeness does not mean all 150 effects or purchases are implemented.
