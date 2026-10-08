# Independent APK shop state review — 2026-10-08

Scope: Task 2 of `docs/superpowers/plans/2026-10-08-apk-shop.md`, reviewing the current working tree. Read-only code review; this report is the only edited file. No original source or artwork copied. The APK was not needed for these state invariants.

## Findings requiring attention

1. **Native shop saves accept missing inventory and stripped native metadata.** `src/persistence/save.js:23–35,37–52` validates native offer metadata only when either `originalKey` or `set` is present; there is no native-only inventory/category invariant. Starting from a serialized successful native cashout, each of these changes independently deserializes successfully:
   - Delete `payload.state.shop` while retaining `phase: 'shop'` and `apkShop`.
   - Delete both `originalKey` and `set` on a main offer, then replace `entityId` with `'forged'`.
   - Move the voucher offer from `shop.vouchers` to `shop.main`.

   The first accepts loss of the entire persisted inventory. The second accepts an unknown centre and makes the next native reroll fail. The third accepts an impossible area/category assignment. Native saves should require inventory when the shop is active, mandatory native metadata, known centres and compatible areas. Keep existing permissive legacy behavior for runs without `apkShop`. Required centre-specific metadata such as playing-card `frontKey` and To Do List hand should also be considered when validating native inventory.

2. **An exposed native leave-shop transition can return a state that cannot be saved.** `src/core/shop.js:99–105` accepts a supplied next-round configuration with `ante: 2`, updates `round.ante`, but leaves `apkShop.context.ante` at 1. `serializeState` then fails because `decodeApkShop` requires matching antes. Reproduction: create a native run, set a legal won round, cash out, then dispatch `LEAVE_SHOP` with `nextRound: {...state.round, ante: 2, score: 0n}`. Action returns `error: null`; serialization throws `Invalid save data`. This crosses into the still-open Task 4 next-blind work. Before exposing that transition, synchronize supported context/voucher lifecycle or atomically reject unsupported configurations. Updating the ante alone does not establish complete next-blind or voucher-refresh parity.

Both findings were sent to the integrator immediately. Status at the first review: unresolved; tests below pass despite these gaps.

## Verified evidence

- `node --test tests/core/*.test.js`: **167 passed, 0 failed**.
- Read `src/core/run.js`, `shop.js`, `apk-shop-state.js`, `apk-shop.js`, `src/persistence/save.js`, `tests/core/apk-shop-run.test.js`, relevant legacy shop/save tests and the application new-run options.
- The six first-shop conditional golden fixtures pass for three seeds, normal/reduced motion. They check stored offers, prices, metadata, pre-shop cashout shuffle, resulting APK RNG, input immutability, stale/repeated cashout rejection and byte-stable persistence.
- Native reroll tests verify 5/6/7 paid prices, free reroll preserving the paid tier, unchanged voucher/booster areas, saved future RNG and stale action rejection. Failed or unsupported actions return the original state without charging or advancing RNG.
- An independent in-memory sweep tested **40 runs** (20 additional seeds × two motion settings), each with cashout plus eight rerolls: **360 successful transactions**. Every transaction checked input immutability, byte-stable save/reload/save and stale revision rejection. All passed.
- An independent context probe checked a legacy owned `joker_joker` mapping to `j_joker` and a held Arcana Pack offer expanding duplicate eligibility across every same-name Arcana Pack variant. Both passed.
- Legacy runs and reference-RNG-only runs retain their old cashout behavior without introducing `apkShop` or generating new inventory. Native shop opt-in requires reference RNG. The UI new-run factory opts into both.

The additional probes were `node --input-type=module` heredoc scripts and created no test/source files. The malformed-save and next-ante probes produced the findings above; the full-suite success is not evidence against them.

## Limits

This establishes conditional producer/run/save integration only. Full startup global RNG, boss selection, tags, callbacks, profile lifecycle, modified playing-card ownership and consumable areas are outside this completed slice. Full 150-Joker effects, buying native entities, pack/voucher transactions, full playable shop UI and verified next-blind progression remain open Tasks 3–4. Unsupported native purchases correctly reject before payment today. No Android runtime, UI interaction, original APK execution or release-build verification was performed by this reviewer.

## Integrator follow-up

Both findings reproduced by two committed regression tests before fixes. Native shop saves now require inventory, mandatory catalogue metadata and correct areas. Native next-blind transition rejects atomically until Task4 implements it. Root full suite:169 passed,0 failed. Browser and Android Actions verification pending.
