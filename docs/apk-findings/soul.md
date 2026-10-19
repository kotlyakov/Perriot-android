# Soul consumable — APK reference contract (item 8a)

Reference: uploaded Balatro 1.0.1n APK, extracted outside the repository under `reference-apk/assets/`. No original implementation copied into this repository.

- `card.lua:1416–1425`: Judgement and The Soul share a creation callback. Soul invokes `create_card('Joker', G.jokers, true, nil, nil, nil, nil, 'sou')`, adds the result to the owned joker area, triggers the legendary unlock check and juices the consumed source once.
- `card.lua:1559–1565`: using Soul requires free joker capacity. Negative jokers contribute capacity; the future result's possible Negative edition does not bypass this precondition.
- `functions/common_events.lua:2002–2092`: legendary selection still consumes the initial `rarity<ante>sou` poll, then forces rarity 4. Selection key is exactly `Joker4`, with neither suffix nor ante. Native pool order is retained; unavailable entries remain placeholders and resampling keys are `Joker4_resample2`, etc. All five legendary centres remain candidates: Canio, Triboulet, Yorick, Chicot and Perkeo. Locked status is bypassed at rarity 4; duplicate and banned-centre checks remain active. Active Showman permits duplicates. Fully excluded pools fall back to `j_joker`, including when it is itself excluded.
- `functions/common_events.lua:2155–2202`: constructor draws are unchanged; Joker edition poll uses `edisou<ante>`. Owned generation does not use shop/pack eternal/perishable/rental polls; global all-eternal still applies when compatible. Existing native pricing handles edition, inflation and discounts. Source use does not debit money.
- Soul is Spectral: it increments Spectral/all use totals and does not replace the last Tarot/Planet used. Debuffed use has no generation or RNG effect, matching the existing consumable contract. Native profile unlock persistence remains part of item 10.

`generateApkEffectCards` adds an explicit boolean `legendary` option; ordinary callers retain their previous selection and RNG behavior. `createItem7Cards` forwards the flag and retains existing creation IDs, ordinal assignment and legendary initializers.

## Pack source capacity

A pack card is temporarily staged as owned only for action reuse. Internal `fromPack` options in `canUseConsumable` and `applyConsumableAction` exclude that staged source from consumable slots and Negative slot bonuses. Emperor/High Priestess/Fool require actual free inventory capacity, as their native `can_use_consumeable` pack-source condition does. Ordinary owned uses keep the prior behavior.

## Checks

`tests/core/soul-consumable.test.js` covers all five legends across 100 seeds, save/use/reload equality, source immutability, capacity/Negative capacity, debuff, full pool/locks/bans/duplicate/Showman/fallback behavior, native RNG stream names and staged pack generator capacity. Initial four Soul tests failed before the implementation and passed afterwards. Native event/frame or profile-unlock parity is not asserted by these tests.
